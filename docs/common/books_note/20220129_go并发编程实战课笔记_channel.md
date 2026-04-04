# Go并发编程实战课笔记—Channel

> 以下大多为鸟窝大佬的[Go 并发编程实战课](https://time.geekbang.org/column/intro/100061801) 中摘录的笔记
>
> [代码repo](https://github.com/catwithtudou/golang_concurrent_examples/tree/master/channel)


在channel的发展中关于CSP理论的部分是不可避免的，而Channel的实现就是实现了CSP的思想。

CSP理论讲述了CSP允许使用进程组件来描述系统，它们独立运行，并且只通过消息传递的方式通信。

Channel类型是Go语言内置的类型，无需引入包。

## Channel的应用场景

> 执行业务处理的goroutine不要通过共享内存的方式通信，而是要通过Channel通信的方式来分享数据。
>
> 即“sharing memory by communicating"，类似于CSP模型的方式。

Channel类型和基本并发原语是有竞争关系的，应用于并发场景，涉及到goroutine之间的通讯，可以提供并发的保护。

总结下来，可以把channel的应用场景分为五种类型：

1. **数据交流**

当作并发的buffer或者queue解决类似生产者-消费者问题，且多个goroutine可以并发当作生产者和消费者。

2. **数据传递**

一个goroutine将数据交给另一个gorouitne，相当于把数据的拥有权（引用）托付出去。

3. **信号通知**

一个goroutine可以将信号（closing、closed、data ready等）传递给另一个或者另一组groutine。

4. **任务编排**

可以让一组goroutine按照一定的顺序并发或者串行执行，即编排的功能。

5. **锁机制**

利用Channel可以实现互斥锁的机制。

## Channel基本用法

channel分为只能接收、只能发送、既可以接收也可以发送的三种类型。

- 这个箭头总是射向左边的，元素类型总在最右边；
- 若箭头指向chan即表示可以往chan中塞数据，若箭头远离chan就表示chan会往外吐数据；

```go
chan<- dataType
<-chan dataType
chan dataType
```

channel根据设置容量分为 buffer chan 和 unbuffered chan。

在 buffer chan 被阻塞时只有在容量已满的时候才会被阻塞，而 unbuffered chan 只有读写都准备好之后才不不会阻塞。

还有需要注意的是 nil 是 chan 的零值，是一种特殊的 chan，对值是 nil 的 chan 的发送接收调用者总是会阻塞。

```go
// send the data
ch <- 10

// receive the data
x,ok:= <-ch
x:= <-ch
<-ch
```

在使用 channel 中我们还可以将 channel 使用于 select 的 case clause，for-range中。

```go
select{
	case ch<-i:
  case v:=<-ch: 
}

for v:=range ch{}
for range ch{} // clean the chan
```

## Channel的实现原理

> 在此部分中不会贴出相应源码部分，仅讲述实现逻辑思路。

### chand的数据结构

![image-20210223145429969](https://img.zhengyua.cn/20210223145435.png)

### chan初始化

底层调用`makechan`实现，根据chan的容量的大小和元素的类型不同，初始化不同的存储空间。最终，针对不同的容量和元素类型，分配不同的对象来初始化 hchan 对象的字段，返回 hchan 对象。

这里需要注意的是在 buffer chan 中元素包含指针和不包含指针中分配内存方式不同，前者是单独分配内存给 buf ，而后者是一段连续的内存给 对象和 buf。

### send

在这里我们可以从 send 的各种情况来分析发送的逻辑思路：

- 往 nil chan 中发送数据
    - 造成死锁阻塞退出
- 往 close chan 中发送数据
    - panic退出

- 往 buffer chan 中发送数据
    - buffer chan 容量未满
        - 等待队列中有 receiver
            - 优先将数据发送至该 receiver 直接返回
        - 等待队列中无 receiver
            - 将数据发送至 buf 直接返回
    - buffer chan 容量已满
        - 放入等待队列 sender 中阻塞等待直至被唤醒
- 往 unbuffered chan 中发送数据
    - 有接收者准备
        - chan 中拥有数据
            - 阻塞等待至 chan 中数据被读取（及 chan close 情况）
        - chan 中没有数据
            - 将数据发送至 chan 中直接返回
    - 无接收者准备
        - chan 中拥有数据
            - 造成死锁阻塞退出
        - chan 中没有数据
            - 造成死锁阻塞退出

### receive

在这里我们可以从 receive 的各种情况来分析发送的逻辑思路：

- 从 nil chan 中接收数据
    - 造成死锁阻塞退出
- 从 close chan 中接收数据
    - buf 则取出数据直接返回
    - 无 buf 则取出类型零值直接返回

- 从 buffer chan 中接收数据
    - buffer chan buf 不为空
        - 优先取出 buf 数据直接返回
    - buffer chan buf 为空
        - 等待队列中无 sender
            - 阻塞等待至 chan 中发送数据（及 chan close 情况）
        - 等待队列中有 sender
            - 接收该 sender 中的数据直接返回
- 从 unbuffered chan 中接收数据
    - 无数据
        - 阻塞等待至 chan 中发送数据
    - 有数据
        - 接收该数据直接返回

### close

在这里我们可以从 close 的各种情况来分析发送的逻辑思路：

- nil chan
    - panic
- not nil chan
    - close chan
        - panic
    - not close chan
        - 把等待队列中的goroutine全部移除并唤醒后返回

## 易错场景

使用 channel 中最常见的错误就是 panic 和 grouting 泄漏。

panic的情况共有三种：

- close the nil chan
- send the close chan
- close the close chan

这里提供一套选择的方法：

- 共享资源的并发访问使用传统并发原语；
- 复杂的任务编排和消息传递使用 Channel；
- 消息通知机制使用 Channel，除非只想 signal 一个 goroutine 才使用 Cond；
- 简单等待所有任务的完成用 WaitGroup，也可以使用 Channel；
- 需要和 Select 语句结合，使用 Channel；
- 需要和超时配合，使用 Channel 和 Context；

![image-20210223154037981](https://img.zhengyua.cn/20210223154038.png)