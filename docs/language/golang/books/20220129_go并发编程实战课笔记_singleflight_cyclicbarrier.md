# Go并发编程实战课笔记—SingleFlight&CyclicBarrier

> 以下为鸟窝大佬的[Go 并发编程实战课](https://time.geekbang.org/column/intro/100061801) 中摘录的笔记
>
> [代码repo](https://github.com/catwithtudou/golang_concurrent_examples/tree/master/singleFlight_cyclicBarrier)


![image-20210226140728952](https://img.zhengyua.cn/20210226140728.png)

## 请求合并 SingleFlight

SingleFlight 是 Go 开发组提供的一个扩展并发原语，其作用为**在处理多个 goroutine 同时调用同一个函数的时候，只让一个 goroutine 去调用这个函数，等待这个 goroutine 返回结果的时候，再把结果返回给这个几个同时调用的 goroutine**。这样可以减少并发调用的数量。

与 `sync.Once` 面对的场景不同，前者是主要用在单次初始化场景中，而 SingleFlight 主要用在合并并发请求的场景中，尤其是缓存场景。

### 实现原理

使用互斥锁 Mutex 和 Map 来实现，其中 Mutex 提供并发时的读写保护， Map 用来保存同一个 key 的正在处理（in flight）的请求。

SingleFlight 的数据结构是 Group，它提供了三个方法：

![image-20210226120051148](https://img.zhengyua.cn/20210226120056.png)

- Do：**执行一个函数，并返回函数执行的结果**。需要提供一个 key，对于同一个 key，在同一时间只有一个在执行，**同一个 key 并发的请求会等待**。第一个执行的请求返回的结果就是它的返回结果。函数 fn 是一个无参的函数，返回一个结果或者 error，而 Do 方法会返回函数执行的结果或者是 error，shared 会指示 v 是否返回给多个请求；
- DoChan：类似 Do 方法但是返回 fn 函数结果的 chan 来对结果进行接收；
- Forget：告诉 Group 忘记这个 key。这样一来，之后这个 key 请求会执行 f，而不是等待前一个未完成的 fn 函数的结果。

```go

  // 代表一个正在处理的请求，或者已经处理完的请求
  type call struct {
    wg sync.WaitGroup
  

    // 这个字段代表处理完的值，在waitgroup完成之前只会写一次
        // waitgroup完成之后就读取这个值
    val interface{}
    err error
  
        // 指示当call在处理时是否要忘掉这个key
    forgotten bool
    dups  int
    chans []chan<- Result
  }
  
    // group代表一个singleflight对象
  type Group struct {
    mu sync.Mutex       // protects m
    m  map[string]*call // lazily initialized
  }


  func (g *Group) Do(key string, fn func() (interface{}, error)) (v interface{}, err error, shared bool) {
    g.mu.Lock()
    if g.m == nil {
      g.m = make(map[string]*call)
    }
    if c, ok := g.m[key]; ok {//如果已经存在相同的key
      c.dups++
      g.mu.Unlock()
      c.wg.Wait() //等待这个key的第一个请求完成
      return c.val, c.err, true //使用第一个key的请求结果
    }
    c := new(call) // 第一个请求，创建一个call
    c.wg.Add(1)
    g.m[key] = c //加入到key map中
    g.mu.Unlock()
  

    g.doCall(c, key, fn) // 调用方法
    return c.val, c.err, c.dups > 0
  }


  func (g *Group) doCall(c *call, key string, fn func() (interface{}, error)) {
    c.val, c.err = fn()
    c.wg.Done()
  

    g.mu.Lock()
    if !c.forgotten { // 已调用完，删除这个key // 在默认情况下 forgotten == false
      delete(g.m, key)
    }
    for _, ch := range c.chans {
      ch <- Result{c.val, c.err, c.dups > 0}
    }
    g.mu.Unlock()
  }
```

### 应用场景

Go 代码库中有两个地方用到了 SingleFlight：

- `net/lookup.go`中如果同时有查询同一个 host 的请求，lookupGroup 会把这些请求 merge 到一起，只需要一个请求就可以了；
- Go 在查询仓库版本信息时，将并发的请求合并成一个请求；

```go

func metaImportsForPrefix(importPrefix string, mod ModuleMode, security web.SecurityMode) (*urlpkg.URL, []metaImport, error) {
        // 使用缓存保存请求结果
    setCache := func(res fetchResult) (fetchResult, error) {
      fetchCacheMu.Lock()
      defer fetchCacheMu.Unlock()
      fetchCache[importPrefix] = res
      return res, nil
    
        // 使用 SingleFlight请求
    resi, _, _ := fetchGroup.Do(importPrefix, func() (resi interface{}, err error) {
      fetchCacheMu.Lock()
            // 如果缓存中有数据，那么直接从缓存中取
      if res, ok := fetchCache[importPrefix]; ok {
        fetchCacheMu.Unlock()
        return res, nil
      }
      fetchCacheMu.Unlock()
            ......
```

其中都涉及到了缓存的问题。用 SingleFlight 来解决缓存击穿问题较为合适，并发的请求可以共享同一个查询结构，且因为为缓存查询不用考虑其幂等性问题。

SingleFilght 时**可以通过合并请求的方式降低对下游服务的并发压力，从而提高系统的性能，常常用于缓存系统中**。

## 循环栅栏 CyclicBarrier

循环栅栏 CyclicBarrier 常常应用于重复进行一组 goroutine 同时执行的场景中。该并发原语**允许一组 goroutine 彼此等待，到达一个共同的执行点**。同时可以被重复使用。

这其实与 WaitGroup 并发原语的功能较为类似，但是其在重用时需要注意其 panic 的情况，且在处理可重用的多 goroutine 等待同一个执行点的场景的时候，两种并发原语的方法调用的对应关系如下：

![image-20210226121409156](https://img.zhengyua.cn/20210226121409.png)

### 实现原理

两个初始化方法：

```go
func New(parties int) CyclicBarrier //指定循环栅栏参与者的数量
func NewWithAction(parties int, barrierAction func() error) CyclicBarrier //提供一个函数可以在每一次到达执行点的时候执行一次
```

其中第二个方法中具体的时间点是在最后一个参与者到达之后，但是其它的参与者还未被放行之前，我们可以利用它，做放行之前的一些共享状态的更新等操作。

使用的时候循环栅栏的参与者只需要调用 Await() 方法等待，等所有的参与者到达后再执行下一步，同时循环栅栏的状态恢复到初始的状态，可迎接下一轮同样多的参与者。


## 参考

[Go 并发编程实战课](https://time.geekbang.org/column/intro/100061801)