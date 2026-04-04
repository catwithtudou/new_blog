---
date: 2022-01-29
categories:
  - go
tags:
  - go
  - 并发编程
  - note
---

# Go并发编程实战课笔记—Channel

> 以下大多为鸟窝大佬的[Go 并发编程实战课](https://time.geekbang.org/column/intro/100061801) 中摘录的笔记
>
> [代码repo](https://github.com/catwithtudou/golang_concurrent_examples/tree/master/channel)


在channel的发展中关于CSP理论的部分是不可避免的，而Channel的实现就是实现了CSP的思想。

CSP理论讲述了CSP允许使用进程组件来描述系统，它们独立运行，并且只通过消息传递的方式通信。


<!-- more -->
