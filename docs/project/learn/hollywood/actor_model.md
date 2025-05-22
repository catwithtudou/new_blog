# 理解 Actor Model

## 1. 为何还要关心并发模型

在 Go 里我们已经有了 **goroutine + channel**，为什么还需要额外学习 Actor Model？

* **复杂度升级**：当系统跨越进程/机器，channel 失效；Actor 的**统一抽象**可以延伸到集群。
* **容错性**：goroutine 崩溃会带崩进程；Actor 天生可**监督并自动重启**。
* **可组合性**：Actor = 轻量级进程 + 邮箱，可按层级组织，天然适合领域建模。

如果你的业务从「单机服务」成长为「分布式低延迟系统」，Actor Model 是值得投资的思维工具。

---

## 2. Actor Model 的历史渊源

1973 年，Carl Hewitt 在 MIT 提出了 *Actor Model* 论文，核心观点：
> “万物皆演员（Actor），通过异步消息驱动协作。”

随后 Erlang（1986）把理论落地为电信级容错平台；Akka 将其移植到 JVM 世界。Hollywood 则把同样的理念带到 Go。

---

## 3. 三大核心原则

```
┌─────────┐
│  Actor  │   receive msg
└────┬────┘
     │
     │ 1. 修改私有状态
     │ 2. 发送消息给其它 Actor
     │ 3. 创建/停止子 Actor
```

1. **封装状态**
   - Actor 内部状态只被自己读写，外界无法共享指针，消灭数据竞争。

2. **消息驱动**
   - 与外界唯一交互方式是 *异步* 消息；没有同步调用阻塞，可无限扩展到网络层。

3. **生命周期与监督**
   - Actor 可以像父子进程一样层级化：父 Actor 监督子 Actor，决定崩溃时的重启策略。

这三个原则组合，构建了一个**去锁化**、**可恢复**、**去中心化**的并发系统。

---

## 4. 与传统并发手段的对比

| 维度              | goroutine + channel | lock/RWMutex | Actor Model |
|-------------------|---------------------|--------------|-------------|
| 状态共享          | 可能               | 直接共享     | 不共享      |
| 死锁可能性        | 存在（channel 堵塞）| 存在         | 极低（无锁）|
| 跨进程/集群扩展   | 手动改协议         | 手动         | 天然模型    |
| 容错与重启        | 需额外编排        | 需额外编排  | 内建监督    |
| 思维成本          | 中                | 高          | 中          |
| 性能（本地）      | 高                 | 中          | 高（环形队列）|

> 不是“谁优谁劣”，而是 Actor 在**复杂度 x 可维护性**维度提供更好折中。

---

## 5. 超越 “Hello, World”：常见模式与陷阱

### 5.1 Request–Response

```
client ──►  [ Service Actor ]
  ▲              │
  └──— reply ════┘
```

*在 Actor 里模拟同步调用*：
1. 随消息携带 `replyTo` PID。
2. 调用方 `Receive()` 时 `select` 等待响应或者超时。
3. 对调用方依旧保持异步、不阻塞线程。

### 5.2 Pub/Sub

使用 **Eventstream** 广播系统事件，订阅方 Actor 依次处理，达到 decouple 目的。

### 5.3 工作池

```
Supervisor
   ├── Worker 1
   ├── Worker 2
   └── Worker N
```

Supervisor 收到负载后随机 `Send` 给子 Actor；子 Actor panic 时自动重启，池始终保持固定 worker 数。

### 5.4 常见陷阱

1. **Inbox“吞噬”内存**：异步写容易把队列写爆；必须合理设置 Inbox Size + 背压。
2. **无界递归**：Actor A 重启 → 父 Actor 再重启 → … 形成 *重启风暴*，需设置 maxRestarts + Backoff。
3. **类型爆炸**：消息是自由的 interface{}，建议统一 protobuf schema/枚举防止滥用。

---

## 6. Hollywood 如何把 Actor Model 搬进 Go

### 6.1 接口对照

| Actor Model 概念 | Hollywood 结构 |
|------------------|----------------|
| Actor            | `type Foo struct{}; func (f *Foo) Receive(ctx *actor.Context)` |
| Mailbox/Inbox    | `ringbuffer.Ring` 封装 |
| PID              | `actor.PID{NodeID, LocalID}` |
| Supervision      | `Engine.WithMaxRestarts` + `crashbuf.go` |
| System Messages  | `actor.Initialized/Started/Stopped` |
| Eventstream      | `engine.Eventstream()` |

### 6.2 简单示例

```go
type counter struct{ n int }

func (c *counter) Receive(ctx *actor.Context) {
    switch ctx.Message().(type) {
    case actor.Started:
        fmt.Println("ready")
    case inc:
        c.n++
    case get:
        ctx.Respond(c.n) // Hollywood 提供封装
    }
}
```

### 6.3 分布式加成

*Hollywood 的 Remote & Cluster 层* 让 “Send” 不再局限本地内存，Actor ID 可以是全球唯一，透明跨节点寻址。

---

## 7. 结语：Actor Model 的适用场景

1. **高并发、低延迟**
   - 金融撮合、广告竞价、在线游戏；因 Inbox 全内存+无锁，可吞吐百万级消息。
2. **需要容错**
   - 电信信令、IoT 网关；Actor 崩溃自动重启且消息不丢。
3. **天然领域建模**
   - 领域驱动设计中的 Aggregate 可落地为 Actor，避免并发冲突。

当你的系统满足以上任意两条，Actor Model 值得落地，而 Hollywood 提供了最“Go 风格”的实现：**简洁 API、极端性能、开箱即容错**。

> “不要把时间花在写锁和恢复脚本，把并发与容错交给 Actor Runtime，开发者回归业务本身。”

