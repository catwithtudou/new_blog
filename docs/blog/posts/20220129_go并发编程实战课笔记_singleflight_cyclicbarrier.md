---
date: 2022-01-29
categories:
  - go
tags:
  - go
  - 并发编程
  - note
---

# Go并发编程实战课笔记—SingleFlight&CyclicBarrier

> 以下为鸟窝大佬的[Go 并发编程实战课](https://time.geekbang.org/column/intro/100061801) 中摘录的笔记
>
> [代码repo](https://github.com/catwithtudou/golang_concurrent_examples/tree/master/singleFlight_cyclicBarrier)


![image-20210226140728952](https://img.zhengyua.cn/20210226140728.png)


<!-- more -->

## 请求合并 SingleFlight