# 可学习和参考的地方

## 1. RingBuffer

```go
// buffer 是环形缓冲区的底层结构，存储元素及头尾指针
// 采用经典的环形缓冲区设计：使用固定大小数组和头尾指针实现
// items: 存储元素的切片，作为环形数组使用
// head: 头指针，指向下一个出队元素的前一个位置（空位）
// tail: 尾指针，指向最后一个入队元素的位置
// mod: 缓冲区容量，用于取模运算实现环形特性
type buffer[T any] struct {
	items           []T
	head, tail, mod int64
}

// RingBuffer 是线程安全的泛型环形缓冲区
// 支持动态扩容，当缓冲区满时自动扩容为原来的两倍
// 使用互斥锁保证并发安全，原子操作优化长度读取性能
type RingBuffer[T any] struct {
	len     int64      // 当前元素数量，使用原子操作保证并发读取安全
	content *buffer[T] // 实际存储内容的 buffer
	mu      sync.Mutex // 互斥锁，保护 buffer 结构的并发访问
}

// New 创建一个指定容量的环形缓冲区
// size: 初始容量，必须大于 0
// 返回: 初始化完成的环形缓冲区实例
func New[T any](size int64) *RingBuffer[T] {
	return &RingBuffer[T]{
		content: &buffer[T]{
			items: make([]T, size),
			head:  0,    // 初始头指针指向位置 0
			tail:  0,    // 初始尾指针指向位置 0
			mod:   size, // 容量用于取模运算
		},
		len: 0, // 初始长度为 0
	}
}

// Push 向缓冲区尾部插入一个元素
// 采用先移动指针再检查是否需要扩容的策略
// 若缓冲区已满，则自动扩容为原来的两倍，保证 O(1) 摊还复杂度
// item: 要插入的元素
func (rb *RingBuffer[T]) Push(item T) {
	rb.mu.Lock()
	defer rb.mu.Unlock()

	// 先移动尾指针到下一个位置
	rb.content.tail = (rb.content.tail + 1) % rb.content.mod

	// 检查是否发生环形缓冲区满的情况（尾指针追上头指针）
	if rb.content.tail == rb.content.head {
		// 缓冲区已满，需要扩容
		size := rb.content.mod * 2
		newBuff := make([]T, size)

		// 将原有数据按顺序复制到新缓冲区的前半部分
		// 从 tail+1 开始复制，保持元素的逻辑顺序
		for i := int64(0); i < rb.content.mod; i++ {
			idx := (rb.content.tail + i) % rb.content.mod
			newBuff[i] = rb.content.items[idx]
		}

		// 创建新的 buffer，重置头尾指针
		content := &buffer[T]{
			items: newBuff,
			head:  0,              // 头指针重置为 0
			tail:  rb.content.mod, // 尾指针指向已复制数据的末尾
			mod:   size,           // 新的容量
		}
		rb.content = content
	}

	// 原子递增长度计数器
	atomic.AddInt64(&rb.len, 1)
	// 将元素写入当前尾指针位置
	rb.content.items[rb.content.tail] = item
}

// Len 返回当前缓冲区元素数量
// 使用原子操作读取，保证并发安全且无需加锁
func (rb *RingBuffer[T]) Len() int64 {
	return atomic.LoadInt64(&rb.len)
}

// Pop 从缓冲区头部弹出一个元素
// 采用 FIFO（先进先出）策略
// 返回: (元素值, 是否成功)，若缓冲区为空则返回 (零值, false)
func (rb *RingBuffer[T]) Pop() (T, bool) {
	rb.mu.Lock()
	defer rb.mu.Unlock()

	// 检查缓冲区是否为空
	if rb.len == 0 {
		var t T // 返回类型 T 的零值
		return t, false
	}

	// 移动头指针到下一个有效元素位置
	rb.content.head = (rb.content.head + 1) % rb.content.mod
	item := rb.content.items[rb.content.head]

	// 清空已弹出的位置，帮助 GC 回收引用类型
	var t T
	rb.content.items[rb.content.head] = t

	// 原子递减长度计数器
	atomic.AddInt64(&rb.len, -1)
	return item, true
}

// PopN 批量弹出 n 个元素，返回弹出的切片
// 提供批量操作以提高性能，减少锁竞争
// n: 要弹出的元素数量
// 返回: (元素切片, 是否成功)，若缓冲区为空则返回 (nil, false)
func (rb *RingBuffer[T]) PopN(n int64) ([]T, bool) {
	rb.mu.Lock()
	defer rb.mu.Unlock()

	// 检查缓冲区是否为空
	if rb.len == 0 {
		return nil, false
	}

	content := rb.content

	// 边界检查：若请求数量超过当前长度，则只弹出全部元素
	if n >= rb.len {
		n = rb.len
	}

	// 原子递减长度计数器
	atomic.AddInt64(&rb.len, -n)

	// 预分配结果切片，避免动态扩容
	items := make([]T, n)

	// 批量复制元素，处理环形边界情况
	for i := int64(0); i < n; i++ {
		pos := (content.head + 1 + i) % content.mod
		items[i] = content.items[pos]

		// 清空已弹出位置，帮助 GC 回收引用类型
		var t T
		content.items[pos] = t
	}

	// 批量移动头指针
	content.head = (content.head + n) % content.mod

	return items, true
}
```

## 2. 工厂方法类型

- 定义生成工厂方法的数据类型，可用于延迟创建和依赖注入

```go
// Producer 是用于生成 Receiver 的工厂方法类型
// 采用工厂模式，支持延迟创建和依赖注入
type Producer func() Receiver

// Receiver 接口定义了消息接收与处理的核心能力
// 这是 Actor 模型中 Actor 的行为抽象
type Receiver interface {
	Receive(*Context) // 处理接收到的消息，通过 Context 获取消息内容和元数据
}
```

## 3. VTProtobuf

-  **VTProtobuf** 是一个高性能的 Protocol Buffers 实现

VTProtobuf 相较于 普通 Protobuf 的**主要优势**如下：

**a) 零分配优化**

- **VTProtobuf**: 直接字段复制，避免不必要的内存分配
- **普通 Protobuf**: 使用反射机制，可能产生额外分配

**b) 类型安全**

- **VTProtobuf**: `CloneVT()` 返回具体类型 `*PID`
- **普通 Protobuf**: `Clone()` 返回 `proto.Message` 接口，需要类型断言

**c) 编译时优化**

- **VTProtobuf**: 生成的代码在编译时就确定了所有操作
- **普通 Protobuf**: 运行时使用反射，性能开销更大

## 4. 应用中间件链到消息接收函数

- 中间件按照洋葱模型执行，最后添加的中间件最先执行

```go
type ReceiveFunc = func(*Context)

type MiddlewareFunc = func(ReceiveFunc) ReceiveFunc

// applyMiddleware 应用中间件链到消息接收函数
// rcv: 原始的消息接收函数
// middleware: 中间件函数列表
// 返回: 包装后的消息接收函数
func applyMiddleware(rcv ReceiveFunc, middleware ...MiddlewareFunc) ReceiveFunc {
	// 从后往前应用中间件，形成调用链
	for i := len(middleware) - 1; i >= 0; i-- {
		rcv = middleware[i](rcv)
	}
	return rcv
}
```

## 5. 崩溃恢复和优雅关闭

在处理消息队列的过程中：

- 利用`mbuffer`实现了崩溃恢复的处理
- 通过设计毒丸消息（关闭信号）的处理支持了优雅关闭

```go
// Invoke 批量处理消息队列
// 这是 Actor 消息处理的核心方法
// msgs: 待处理的消息列表
func (p *process) Invoke(msgs []Envelope) {
	var (
		nmsg      = len(msgs) // 总消息数量
		nproc     = 0         // 已处理消息数量（用于崩溃恢复）
		processed = 0         // 成功处理的消息数量
	)

	// 使用 defer + recover 实现崩溃恢复机制
	defer func() {
		if v := recover(); v != nil {
			// 发送停止消息给 receiver
			p.context.message = Stopped{}
			p.context.receiver.Receive(p.context)

			// 将未处理的消息缓存起来，重启后重新处理
			// 这确保了消息不会因为崩溃而丢失
			p.mbuffer = make([]Envelope, nmsg-nproc)
			for i := 0; i < nmsg-nproc; i++ {
				p.mbuffer[i] = msgs[i+nproc]
			}
			p.tryRestart(v) // 尝试重启进程
		}
	}()

	// 逐个处理消息
	for i := 0; i < len(msgs); i++ {
		nproc++ // 更新处理计数器
		msg := msgs[i]

		// 检查是否为毒丸消息（关闭信号）
		if pill, ok := msg.Msg.(poisonPill); ok {
			if pill.graceful {
				// 优雅关闭：处理完剩余的所有消息再关闭
				msgsToProcess := msgs[processed:]
				for _, m := range msgsToProcess {
					p.invokeMsg(m)
				}
			}
			// 执行清理并退出
			p.cleanup(pill.cancel)
			return
		}

		p.invokeMsg(msg) // 处理普通消息
		processed++      // 更新成功处理计数器
	}
}
```

## 6. 清理 goroutine 堆栈信息

- 通过清理 goroutine 堆栈信息来移除不必要的栈帧，使错误日志更加清晰易读

```go
// cleanTrace 清理 goroutine 堆栈信息
// stack: 原始堆栈信息
// 返回: 清理后的堆栈信息
func cleanTrace(stack []byte) []byte {
	// 解析 goroutine 堆栈
	goros, err := gostackparse.Parse(bytes.NewReader(stack))
	if err != nil {
		slog.Error("failed to parse stacktrace", "err", err)
		return stack // 解析失败时返回原始堆栈
	}
	if len(goros) != 1 {
		slog.Error("expected only one goroutine", "goroutines", len(goros))
		return stack // 异常情况，返回原始堆栈
	}

	// 跳过前 4 个栈帧（通常是 runtime 相关的内部调用）
	goros[0].Stack = goros[0].Stack[4:]

	// 重新格式化堆栈信息
	buf := bytes.NewBuffer(nil)
	_, _ = fmt.Fprintf(buf, "goroutine %d [%s]\n", goros[0].ID, goros[0].State)
	for _, frame := range goros[0].Stack {
		_, _ = fmt.Fprintf(buf, "%s\n", frame.Func)
		_, _ = fmt.Fprint(buf, "\t", frame.File, ":", frame.Line, "\n")
	}
	return buf.Bytes()
}
```