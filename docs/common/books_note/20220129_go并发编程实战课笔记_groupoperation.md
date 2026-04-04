# Go并发编程实战课笔记—GroupOperation

**分组操作：处理一组子任务执行的并发原语**

> 以下为鸟窝大佬的[Go 并发编程实战课](https://time.geekbang.org/column/intro/100061801) 中摘录的笔记
>
> [代码repo](https://github.com/catwithtudou/golang_concurrent_examples/tree/master/group_operation)


![image-20210314145158475](https://img.zhengyua.cn/20210314145203.png)



## ErrGroup

ErrGroup为官方提供的一个同步扩展库。应用场景就是将一个大的任务拆分成几个小任务并发执行。它主要提供的功能包括：

- 和Context集成；
- error向上传播，可将子任务的错误传递给Wait的调用者。

该原语底层也是基于WaitGroup实现的。

在使用ErrGroup时我们会用到的三个方法：

```go
// 一旦有子任务返回错误或是Wait调用返回则该返回的context会被cancel
// 注意当传递ctx参数是一个可以cancel的Context的话则被cancel的时候并不会终止该正在执行的子任务
func WithContext(ctx context.Context)(*Group,context.Context)
// 任务函数f若执行成功则返回nil，若不成功则返回error且会cancel那个新的Context
// Wait方法只会返回第一个错误
func (g *Group)Go(f func() error)
// 阻塞等待至等所有子任务执行完成后才会返回
func (g *Group)Wait()error
```

### 扩展库

> 原生库中若无限制地使用 Go 方法则会创建非常多的 goroutine，过多的 goroutine 会带来调度和 GC 的压力，而且也会占用更多的内存资源。
>
> 解决此问题的常用手段就是利用 worker pool(goroutine pool)，或者类似利用信号量来控制并行的 goroutine 的数量。

- [bilibili/errgroup](https://pkg.go.dev/github.com/bilibili/kratos/pkg/sync/errgroup?utm_source=godoc)

该库可以使用一个固定数量的 goroutine 处理子任务。

除了可以控制并发 goroutine 的数量，还提供了以下功能：

1. cancel：失败的子任务可以 cancel 所有正在执行任务；
2. recover：会把 panic 的堆栈信息放到 error 中，避免子任务 panic 导致的程序崩溃。

需要注意：

1. 若并发的子任务超过了设置的并发数则需要等到调用者调用 Wait 之后才会执行，而不是 goroutine 空闲则会执行；
2. 若高并发情况下任务数大于设定的 goroutine 的数量，且这些任务被集中加入到 Group 中，该库的处理方式是把子任务加入到数组中，而该数组不是线程安全的。

- [neilotoole/errgroup](https://github.com/neilotoole/errgroup)

在官方的 ErrGroup 基础上增加了可以控制并发 goroutine 的功能。

新增的 WithContextN 可设置并发的 goroutine 数，以及等待处理的子任务队列的大小。当队列满的时候则调用 Go 方法会被阻塞，直到子任务可以放入到队列中才返回。

- facebookgo/errgroup

实际上为标准库 WaitGroup 的扩展，增加了 Wait 方法可返回 error，而且可以包含多个 error。

### 其他 Group 并发原语

- [SizedGroup/ErrSizedGroup](https://github.com/go-pkgz/syncs)

SizeGroup 内部使用信号量和 WaitGroup 实现，通过信号量控制并发的 goroutine 数量或者是不控制该数量而控制子任务并发执行时候的数量。

默认情况下，SizedGroup 控制的是子任务的并发数量，而不是 goroutine 的数量。在这种方式下，每次调用 Go 方法都不会被阻塞，而是新建一个 goroutine 去执行。如果想控制 goroutine 的数量，你可以使用 syncs.Preemptive 设置这个并发原语的可选项。

```go

package main

import (
    "context"
    "fmt"
    "sync/atomic"
    "time"

    "github.com/go-pkgz/syncs"
)

func main() {
    // 设置goroutine数是10
    swg := syncs.NewSizedGroup(10)
    // swg := syncs.NewSizedGroup(10, syncs.Preemptive)
    var c uint32

    // 执行1000个子任务，只会有10个goroutine去执行
    for i := 0; i < 1000; i++ {
        swg.Go(func(ctx context.Context) {
            time.Sleep(5 * time.Millisecond)
            atomic.AddUint32(&c, 1)
        })
    }

    // 等待任务完成
    swg.Wait()
    // 输出结果
    fmt.Println(c)
}
```

ErrSizedGroup 为 SizedGroup 提供了 error 处理的功能，与 Go 官方扩展库的功能一样，如等待子任务完成并返回第一个出现的 error。实现的额外功能如下：

- 控制并发的 goroutine 数量；
- 设置了 termOnError 时子任务出现第一个错误的时候会 cancel Context，且后续的 Go 调用会直接返回，Wait 调用者会得到这个错误，默认则返回所有子任务的错误。

SizedGroup 可以把 Context 传递给子任务，可通过 cancel 让子任务中断执行，但ErrSizedGroup 却没有实现。

## gollback

用来处理一组子任务的执行的，解决了 ErrGroup 收集子任务返回结果的问题，且会把结果和 error 信息都返回。

提供的三个方法如下：

```go
// 等待所有异步函数执行完才返回，且返回结果顺序和传入顺序一致
func All(ctx context.Context, fns ...AsyncFunc)([]interface{},[]error)
// type AsyncFunc func(ctx context.Context) (interface{}, error)

// 与 All 方法类似，区别在于只要一个异步函数执行没有错误则立马返回，而不会返回所有子任务的信息
func Race(ctx context.Context, fns ...AsyncFunc)(interface{},error)

// 执行一个子任务，若执行失败会尝试一定的次数，若一直不成功就会返回失败错误，若执行成功会立即返回，若 retires 为 0 则会永远尝试直至成功
func Retry(ctx context.Context, retires int, fn AsyncFunc)(interface{},error)

```

## Hunch

与 gollback 类似，不过提供的方法更多，且与 rollback 的方法也有一些不同。

提供的方法如下：

```go
// type Executable func(context.Context) (interface{}, error)

// 会传入一组可执行的函数且返回子任务的执行结果，一旦一个子任务出现错误则会返回错误信息，执行结果为 nil
func All(parentCtx context.Context, execs ...Executable) ([]interface{}, error)

// 只要有 num 个子任务正常执行完没有错误，该方法就会返回这几个子任务的结果。若出现错误与 All 方法类似
func Take(parentCtx context.Context, num int, execs ...Executable）([]interface{}, error)

// 只返回最后 num 个正常执行的、没有错误的子任务的结果。若出现错误与 All 方法类似
func Last(parentCtx context.Context, num int, execs ...Executable) ([]interface{}, error)

// 与 gollback Retry 方法一致
func Retry(parentCtx context.Context, retries int, fn Executable) (interface{}, error)

// 所有子任务是串行执行的，前一个子任务的执行结果会被当作参数传给下一个子任务，直至所有的任务都完成，返回最后的执行结果
func Waterfall(parentCtx context.Context, execs ...ExecutableInSequence) (interface{}, error)
```

## schedgroup

该并发原语与时间处理相关，可为 worker pool 指定任务在某个时间或者某个时间之后执行。

```go
type Group
  func New(ctx context.Context) *Group
// 会在 time.Now()+delay 之后执行函数
  func (g *Group) Delay(delay time.Duration, fn func())
// 指定明确的某个时间执行
  func (g *Group) Schedule(when time.Time, fn func())
// 阻塞调用者，直到之前安排的所有子任务都执行完才返回
// 调用了 Wait 方法则不能再调用上面两个方法，否则会panic
// Wait 方法只能调用一次，若多次调用则会 panic
  func (g *Group) Wait() error
```