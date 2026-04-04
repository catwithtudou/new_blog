# pprof性能排查分析note

## pprof

### 概述

1. 工具

runtime/pprof

net/hhtp/pprof

2. 采样

CPU

Heap

Goroutine

Mutex

Block

ThreadCreate

3. 分析

网页

可视化终端

4. 展示

Top

Graph

Source

FlameGraph

Peek

Disassemble

### 性能排查[炸弹]

1. 前置准备

使用 net/http/pprof

2. 浏览器查看指标

ip:port/debug/pprof/

3. CPU

`go tool pprof "http://localhost:6060/dubug/pprof/profile?seconds=10"`

topN:查看占用资源最多的函数

其中需要注意两个参数：

- flat:本函数的执行耗时；
- cum:累计量。指该函数加上该函数调用的函数总耗时；

在 flat==cum 情况下说明该函数没有子函数，若 flat == 0 则说明函数中只有其他函数的调用；

list:根据给定的正则表达式查找代码行

web:生成调用关系图

4. Heap

`go tool pprof -http=:8080 "http://localhost:6060/debug/pprof/heap"`

Top视图

Source视图：源码视角查看资源占用

SAMPLE选项：

- alloc_objects:程序累计申请的对象数
- alloc_sapce:程序累计申请的内存大小
- infuse_objects:当前持有的对象数
- infuse_sapce:当前持有的内存大小

5. Goroutine

goroutine泄漏也会导致内存泄漏

`go tool pprof -http=:8080 "http://localhost:6060/debug/pprof/goroutine"`

FlameGraph：火焰图

6. Mutex

`go tool pprof -http=:8080 "http://localhost:6060/debug/pprof/mutex"`

7. Block

`go tool pprof -http=:8080 "http://localhost:6060/debug/pprof/block"`

若阻塞操作消耗时间相对于其他阻塞过小，则 pprof 视图中可能会被忽略，出现这种问题我们可以通过调整比例发现，且 pprof 的 http端口监听若出现阻塞也会被记录下来。

## proof指标采样的流程和原理

### CPU采样

- 采样对象：函数调用和它们的占用时间
- 采样率：100次/秒，固定值
- 采样时间：从手动启动到手动结束

核心在于通过设定和取消信号处理函数，来开启和关闭定时器。

- 操作系统：每10ms向进程发送一次SIGPROF信号
- 进程：每次接受到SIGPROF会记录调用栈
- 写缓冲：每100ms读取一次已经记录的调用栈并写入输出流

### Goroutine&ThreadCreate采样

- Goroutine

  记录所有用户发起且在运行中的 goroutine（即入口非 runtime 开头的）和 runtime.main 的调用栈信息

  Stop->遍历allgs切片->输出创建g的堆栈->Start

- ThreadCreate

  记录程序创建的所有系统线程的信息

  Stop->遍历allm链表->输出创建m的堆栈->Start

### Heap（堆内存）采样

- 采样程序通过内存分配器在堆上分配和释放且参与GC的内存，记录分配/释放的大小和数量

  > 底层使用cgo、调用就回收的栈内存等是不会被记录的。

- 采样率：每分配512KB记录一次，可以在运行开头修改，1为每次分配均记录

- 采样时间：从程序运行开始到采样时

- 采用指标：alloc_space、alloc_objects、inuse_space、inuse_objects；

- 计算方式：inuse = alloc - free

### Block&Mutex采样

- 阻塞

  采用阻塞操作的次数和耗时

  采样率：阻塞耗时超过阈值值才会被记录，1为每次阻塞均记录

  阻塞操作-上报调用栈和消耗时间->profiler-采样时->遍历阻塞记录->统计阻塞次数和耗时

- 锁竞争

  采样争抢锁的次数和耗时

  采样率：只记录固定比例的锁操作，1为每次加锁均记录

  锁操作-上报调用栈和消耗时间->profiler->采样时-遍历锁记录->统计锁竞争次数和耗时