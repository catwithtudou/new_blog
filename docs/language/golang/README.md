# Go 与后端

这里整理 Go 语言、并发编程和后端工程的学习记录。可以按下面的问题选择文章，也可以通过左侧目录继续查找。

## 语言与实践

- [Go 1.24 Notes](../../blog/posts/20250223_go_version_update.md)：2025 年的版本更新记录。
- [基于 Go 实现的推文自动分割脚本](notes/20240124_基于_go_实现的推文自动分割脚本.md)：一次小工具的需求与实现记录。

## 并发编程

下面是《Go 并发编程实战课》的摘录和学习笔记，可以从共享资源的保护读到任务协作。

1. **保护共享资源**：[Mutex](books/20220129_go并发编程实战课笔记_mutex.md) 与 [RWMutex](books/20220129_go并发编程实战课笔记_rwmutex.md)。
2. **传递数据与信号**：[Channel](books/20220129_go并发编程实战课笔记_channel.md)。
3. **等待并发任务完成**：[WaitGroup](books/20220129_go并发编程实战课笔记_waitgroup.md)。
4. **理解底层操作**：[Atomic](books/20220129_go并发编程实战课笔记_atomic.md) 与[读写顺序](books/20220129_go并发编程实战课笔记_读写顺序.md)。

## 后端设计与排查

- [RPC 框架设计概要](notes/20220128_rpc框架设计概要.md) → [net/rpc 源码阅读](notes/20220128_netrpc源码阅读.md)
- [四种经典负载均衡算法](../../blog/posts/20250324_load_balancer_algorithm.md)
- [pprof 性能排查笔记](notes/20220128_pprof性能排查分析note.md)

课程摘录与源码分析保留了当时的上下文，具体实现请结合对应的 Go 版本阅读。
