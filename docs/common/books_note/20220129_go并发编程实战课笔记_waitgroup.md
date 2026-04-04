# Go并发编程实战课笔记—WaitGroup

> 以下为鸟窝大佬的[Go 并发编程实战课](https://time.geekbang.org/column/intro/100061801) 中摘录的笔记
>
> [代码repo](https://github.com/catwithtudou/golang_concurrent_examples/tree/master/waitGroup)

![image-20210105004212097](https://img.zhengyua.cn/img/20210105004212.png)

## 基本用法

```go
func (wg *WaitGroup) Add(delta int) //设置计数值
func (wg *WaitGroup) Done() //Add(-1)
func (wg *WaitGroup) Wait() //阻塞直至计数值为0
```

## WaitGroup实现

### 数据结构定义

- WaitGroup的数据结构定义以及state信息的获取方法如下：

```go
type WaitGroup struct {
	// 避免复制使用的一个技巧，可以告诉vet工具违反了复制使用的规则
	noCopy noCopy
	// 64bit(8bytes)的值分成两段，高32bit是计数值，低32bit是waiter的计数
	// 另外32bit是用作信号量的
	// 因为64bit值的原子操作需要64bit对齐，但是32bit编译器不支持，所以数组中的元素在不同的
	// 总之，会找到对齐的那64bit作为state，其余的32bit做信号量
	state1 [3]uint32
}
// 得到state的地址和信号量的地址
func (wg *WaitGroup) state() (statep *uint64, semap *uint32) {
	if uintptr(unsafe.Pointer(&wg.state1))%8 == 0 {
		// 如果地址是64bit对齐的，数组前两个元素做state，后一个元素做信号量
		return (*uint64)(unsafe.Pointer(&wg.state1)), &wg.state1[2]
	} else {
		// 如果地址是32bit对齐的，数组后两个元素用来做state，它可以用来做64bit的原子操作
		return (*uint64)(unsafe.Pointer(&wg.state1[1])), &wg.state1[0]
	}
}
```

其中在64位环境和32位环境中的state字段组成是不一样的：

![image-20210105002456455](https://img.zhengyua.cn/img/20210105002503.png)

![image-20210105002511725](https://img.zhengyua.cn/img/20210105002511.png)

- 除了方法本身的实现外，需要一些race检查和异常检查的额外代码，避免出现panic。

### Add/Done方法

该方法主要操作的是state的计数部分，通过原子操作来操作该计数值。

```go
func (wg *WaitGroup) Add(delta int) {
	statep, semap := wg.state()
	// 高32bit是计数值v，所以把delta左移32，增加到计数上
	state := atomic.AddUint64(statep, uint64(delta)<<32)
	v := int32(state >> 32) // 当前计数值
	w := uint32(state) // waiter count
	if v > 0 || w == 0 {
		return
	}
	// 如果计数值v为0并且waiter的数量w不为0，那么state的值就是waiter的数量。
	// 将waiter的数量设置为0，因为计数值v也是0,所以它们俩的组合*statep直接设置为0即可。
	*statep = 0
	for ; w != 0; w-- {
		runtime_Semrelease(semap, false, 0)
	}
}
// Done方法实际就是计数器减1
func (wg *WaitGroup) Done() {
	wg.Add(-1)
}
```

### Wait方法

该方法的试下逻辑即不断检查state的值：

- 若该值为0则说明所有任务完成，调用者不等待直接返回；
- 若该值大于0则说明还有任务未完成，则调用者变成等待者，加入waiter队列且阻塞自己。

```go
func (wg *WaitGroup) Wait() {
	statep, semap := wg.state()
	for {
		state := atomic.LoadUint64(statep)
		v := int32(state >> 32) // 当前计数值
		w := uint32(state) // waiter的数量
		if v == 0 {
			// 如果计数值为0, 调用这个方法的goroutine不必再等待，继续执行它后面的逻辑即可
			return
		}
		// 否则把waiter数量加1。期间可能有并发调用Wait的情况，所以最外层使用了一个for循环
		if atomic.CompareAndSwapUint64(statep, state, state+1) {
			// 阻塞休眠等待
			runtime_Semacquire(semap)
			// 被唤醒，不再阻塞，返回
			return
		}
	}
}
```

## WaitGroup常见错误

### 计数值设置为负值

WaitGroup 的计数器的值**必须大于等于0**。

我们在更改这个计数值的时候，WaitGroup 会先做检查，**如果计数值被设置为负数，就会导致panic**。

- 一般情况下有两种方法会导致计数器设置为负值：
    - **调用Add的时候传递负数**；
    - **调用Done方法次数太多超过了计数值**；

使用WaitGroup应该**预先确定好WaitGroup的计数值**，然后调用相同次数的Done完成相应的任务。

### 不期望的Add时机

需要遵循的原则：**等所有的Add方法调用之后再调用Wait**，否则就可能导致panic或者不期望的结果。

### 前一个Wait还没结束就重用WaitGroup

因为WaitGroup是可以重用的，只要将计数值恢复为0值则可以被看作是新创建的WaitGroup被重复使用。**但是如果在计数值没有恢复至0值时就重用，就会导致程序panic**。

## noCopy：辅助vet检查

noCopy 字段的类型是 noCopy，它只是一个辅助的、用来帮助 vet 检查用的类型:

```go
type noCopy struct{}

// Lock is a no-op used by -copylocks checker from `go vet`.
func (*noCopy) Lock() {}
func (*noCopy) Unlock() {}
```

通过给WaitGroup添加一个noCopy字段，可以**为WaitGroup实现 Locker接口**，这样vet工具就可以做复制检查了，且因为**noCopy 字段是未输出类型**，所以WaitGroup不会暴露Lock/Unlock方法。

如果想要自己定义的数据结构**不被复制使用**，或者说，**不能通过 vet 工具检查出复制使用的报警**，就可以通过嵌入 noCopy 这个数据类型来实现。

## 小结

关于如何避免错误使用 WaitGroup 的情况，我们只需要尽量保证下面几点：

- 不重用 WaitGroup。新建一个 WaitGroup 不会带来多大的资源开销，重用反而更容易出错。
- 保证所有的Add方法调用都在Wait之前。
- 不传递负数给Add方法，只通过 Done 来给计数值减 1。
- 不做多余的Done方法调用，保证Add的计数值和Done方法调用的数量是一样的。
- 不遗漏Done方法的调用，否则会导致Wait hang住无法返回。