---
date: 2022-01-28
categories:
  - network
tags:
  - network
  - socks5
---

# simple socks5 proxy & the c10k problem


<!-- more -->

## socks5

> socks5简介
> SOCKS是一种网络传输协议，主要用于客户端与外网服务器之间通讯的中间传递。SOCKS是"SOCKetS"的缩写。 当防火墙后的客户端要访问外部的服务器时，就跟SOCKS代理服务器连接。这个代理服务器控制客户端访问外网的资格，允许的话，就将客户端的请求发往外部的服务器。

主要重点在于：

- 认证
- 建立连接
- 转发数据

## c10k问题

通过socks5二进制协议可以实现一个高性能的网络服务器代理。而说到服务器代理的性能相关，我们不由得想到经典的c10k问题。

解决c10k问题的主要思路其实非常简单，分别是：

- 对于每个连接处理分配一个独立的进程/线程；
- 用同一进程/线程来同时处理若干连接；

首先第一个思路是最直接的方式，但是资源是有限的（在我看来，性能问题的起因就是资源有限）。

所以问题非常明显，资源占用过多，可扩展性也非常差。

而第二个思路就是我们常说的IO多路复用的问题。

那IO多路复用最直接的方式就是从循环处理开始，遍历处理各个socket，若socket中都有数据，这种方式是可行的。但当应用读取某个socket的文件数据产生了堵塞，即非ready状态，则整个应用会阻塞在这里等待该文件句柄，从而无法处理其他文件句柄。

这里就需要提到select、poll、epoll这三个技术了。

这里我简单总结一下：

- select

  每次调用初始化fd_set 结构体，利用fd_set结构体在内核同时监控多个文件句柄，通过FD_ISSET来查看具体某个文件句柄是否发生变化(ready/unready)。

  思路：有连接请求进行无差别轮询检查。

  问题：句柄上限+重复初始化+逐个排查所有文件句柄效率低。

- poll

  poll本质上和select没有区别，主要是结构体是通过一个 pollfd 数组向内核传递需要关注的事件消除文件句柄上限（通过链表），同时使用不同字段分别标注关注事件和发生事件，来避免重复初始化。

  思路：设计新的数据结构提供使用效率。

  问题：逐个排查所有文件句柄效率低。

- epoll

  事件驱动（每个事件关联上fd），调用返回的时候只给发生了状态变化的应用提供（很可能是数据 ready）的文件句柄，即利用callback方式进行异步回调。且利用mmap()文件映射内存加速与内核空间的消息传递；即epoll使用mmap减少复制开销。

  思路：只返回状态变化的文件句柄。

  问题：依赖特定平台（Linux）+ 存在上限（但是相对于前面两种很大）。

> 由于epoll, kqueue, IOCP每个接口都有自己的特点，程序移植非常困难，于是需要对这些接口进行封装，以让它们易于使用和移植。而就是libevent库就是其中之一。
> 目前，libevent已支持以下接口/dev/poll, kqueue, event ports, select, poll 和 epoll。

select，poll，epoll都是IO多路复用的机制。I/O多路复用就通过一种机制，可以监视多个描述符，一旦某个描述符就绪（一般是读就绪或者写就绪），能够通知程序进行相应的读写操作。但select，poll，epoll本质上都是同步I/O，因为他们都需要在读写事件就绪后自己负责进行读写，也就是说这个读写过程是阻塞的，而异步I/O则无需自己负责进行读写，异步I/O的实现会负责把数据从内核拷贝到用户空间。

epoll技术中还有几个点值得我们学习下。

epoll支持水平触发和边缘触发。且对文件描述符的操作有两种模式：

- LT模式：缺省的工作方式，并且同时支持block和no-block socket；当epoll_wait检测到描述符事件发生并将此事件通知应用程序，应用程序可以不立即处理该事件。下次调用epoll_wait时，会再次响应应用程序并通知此事件。

- ET模式：高速工作方式，只支持no-block socket。当epoll_wait检测到描述符事件发生并将此事件通知应用程序，应用程序必须立即处理该事件。如果不处理，下次调用epoll_wait时，不会再次响应应用程序并通知此事件。

> 水平触发：如果报告了fd后，没有被处理，那么下次poll时会再次报告该fd。
> 边缘触发：它只告诉进程哪些fd刚刚变为就绪态，并且只会通知一次。

### 协程

从前面的I/O多路复用技术可以看出，实际上epoll已经能够很好的处理c10k问题，但是我们也知道epoll的上限还是存在的，对于如今这个对百万并发常见的时代，如果要进行进一步的拓展，我们就需要引入新的技术来解决。

了解并发问题的朋友可能都知道这么一个道理：内核不是解决方案，而是问题所在！

> 即可以理解为，内核处理核心任务，而其他的尽量交给应用程序处理或者交给用户态去处理。

而协程就是能够实现这一目的的技术，其核心思路为试图用一组少量的线程来实现多个任务，一旦某个任务阻塞，则可能用同一线程继续运行其他任务，避免大量上下文的切换。每个协程所独占的系统资源往往只有栈部分。而且，各个协程之间的切换，往往是用户通过代码来显式指定的（跟各种 callback 类似），不需要内核参与，可以很方便的实现异步。

> 其本质就是异步非阻塞技术。

Golang中对于协程的实现，和其GPM调度策略等处理器策略是非常优秀的，当然这里就不详细解释了，篇幅有限。

当然同步阻塞策略在一些并发量较小的场景也非常优秀，不会浪费资源，效率较高，调度较异步非阻塞更加容易。

但我们也需要知道异步回调程序的性能是要优于协程模型的，因为异步回调是没有切换开销的。

## socks代码示例

```go
package socks5

import (
	"encoding/binary"
	"errors"
	"fmt"
	"io"
	"net"
)

/**
 * user: ZY
 * Date: 2020/11/24 15:38
 */

func main() {
	server, err := net.Listen("tcp", ":1080")
	if err != nil {
		fmt.Printf("Listen failed: %v\n", err)
		return
	}

	for {
		client, err := server.Accept()
		if err != nil {
			fmt.Printf("Accept failed: %v", err)
			continue
		}
		go process(client)
	}
}

func process(client net.Conn) {
	if err := Socks5Auth(client); err != nil {
		fmt.Println("auth error:", err)
		client.Close()
		return
	}

	target, err := Socks5Connect(client)
	if err != nil {
		fmt.Println("connect error:", err)
		client.Close()
		return
	}

	Socks5Forward(client, target)
}

func Socks5Auth(client net.Conn) (err error) {
	buf := make([]byte, 256)

	// 读取 VER 和 NMETHODS
	n, err := io.ReadFull(client, buf[:2])
	if n != 2 {
		return errors.New("reading header: " + err.Error())
	}

	ver, nMethods := int(buf[0]), int(buf[1])
	if ver != 5 {
		return errors.New("invalid version")
	}

	// 读取 METHODS 列表
	n, err = io.ReadFull(client, buf[:nMethods])
	if n != nMethods {
		return errors.New("reading methods: " + err.Error())
	}

	//无需认证
	n, err = client.Write([]byte{0x05, 0x00})
	if n != 2 || err != nil {
		return errors.New("write rsp: " + err.Error())
	}

	return nil
}

func Socks5Connect(client net.Conn) (net.Conn, error) {
	buf := make([]byte, 256)

	n, err := io.ReadFull(client, buf[:4])
	if n != 4 {
		return nil, errors.New("read header: " + err.Error())
	}

	ver, cmd, _, atyp := buf[0], buf[1], buf[2], buf[3]
	if ver != 5 || cmd != 1 {
		return nil, errors.New("invalid ver/cmd")
	}

	addr := ""
	switch atyp {
	case 1:
		n, err = io.ReadFull(client, buf[:4])
		if n != 4 {
			return nil, errors.New("invalid IPv4: " + err.Error())
		}
		addr = fmt.Sprintf("%d.%d.%d.%d", buf[0], buf[1], buf[2], buf[3])

	case 3:
		n, err = io.ReadFull(client, buf[:1])
		if n != 1 {
			return nil, errors.New("invalid hostname: " + err.Error())
		}
		addrLen := int(buf[0])

		n, err = io.ReadFull(client, buf[:addrLen])
		if n != addrLen {
			return nil, errors.New("invalid hostname: " + err.Error())
		}
		addr = string(buf[:addrLen])

	case 4:
		return nil, errors.New("IPv6: no supported yet")

	default:
		return nil, errors.New("invalid atyp")
	}

	n, err = io.ReadFull(client, buf[:2])
	if n != 2 {
		return nil, errors.New("read port: " + err.Error())
	}
	port := binary.BigEndian.Uint16(buf[:2])

	destAddrPort := fmt.Sprintf("%s:%d", addr, port)
	dest, err := net.Dial("tcp", destAddrPort)
	if err != nil {
		return nil, errors.New("dial dst: " + err.Error())
	}

	n, err = client.Write([]byte{0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0})
	if err != nil {
		dest.Close()
		return nil, errors.New("write rsp: " + err.Error())
	}

	return dest, nil
}

func Socks5Forward(client, target net.Conn) {
	forward := func(src, dest net.Conn) {
		defer src.Close()
		defer dest.Close()
		io.Copy(src, dest)
	}
	go forward(client, target)
	go forward(target, client)
}
```

## 参考

- [C10K问题](http://byteliu.com/2016/08/27/C10K%E9%97%AE%E9%A2%98/)
- [聊聊IO多路复用之select、poll、epoll详解](https://www.jianshu.com/p/dfd940e7fca2)
