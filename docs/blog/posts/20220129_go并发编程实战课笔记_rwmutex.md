---
date: 2022-01-29
categories:
  - go
tags:
  - go
  - 并发编程
  - note
---

# Go并发编程实战课笔记—RWMutex


> 以下为鸟窝大佬的[Go 并发编程实战课](https://time.geekbang.org/column/intro/100061801) 中摘录的笔记
>
> [代码repo](https://github.com/catwithtudou/golang_concurrent_examples/tree/master/rwlock)



![image-20210103211026661](https://img.zhengyua.cn/img/20210103211026.png)


针对读写场景，即考虑`readers-writers`问题，同时可能有多个读或者多个写，但只要有一个线程在执行写操作，则其他线程都不能执行写操作，即读锁为共享锁，写锁为排他锁。


<!-- more -->
