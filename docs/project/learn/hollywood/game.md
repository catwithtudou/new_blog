# Hollywood 在游戏服务端的落地范式

## 1. 典型游戏后端的职责

1. 连接层（网关）：长连接 / WebSocket / UDP
2. 会话层：玩家登录、心跳、认证
3. 场景/房间：状态同步、逻辑帧、AOI
4. 世界服务：全局排行榜、聊天、邮件
5. 匹配/排队：Matchmaking、分配房间
6. 经济系统：道具、货币、商城
7. 后台运维：监控、热更新、GM 指令

这些组件本质都是“并发状态载体”，天然符合 **Actor = 状态 + 消息** 的建模思路。

---

## 2. Actor 划分示例

| 领域对象 | 推荐 Actor 粒度 | 说明 |
|----------|----------------|------|
| 玩家      | PlayerActor    | 登录、属性、背包、RPC 转发 |
| 房间/副本 | RoomActor      | 帧同步 / 邀请 / 结算 |
| 地图格子  | CellActor      | AOI 广播、怪物刷新 |
| 排位匹配  | MatchActor     | 维护一个匹配池 |
| 全服聊天  | ChatActor      | 频道管理、发言节流 |
| 经济系统  | BankActor      | 转账、扣费、事务化 |
| GM 命令   | GmActor        | 高权限指令 |

> 一句话原则：**能独立序列化、可单线程处理、需要持久状态**的对象，都适合建成一个 Actor。

---

## 3. 集群拓扑示意

```
                 ┌──────────┐
 WebSocket/UDP   │  Gateway │  纯 I/O，按 playerID 路由到 Cluster
──────────────►  └──────────┘
                       │ Remote(dRPC)
┌──────────────────────────────────────────────────────────────┐
│ Hollywood Cluster (N 节点)                                  │
│  ┌────────────┐   ┌──────────┐   ┌────────────┐            │
│  │PlayerActor │…  │RoomActor │…  │MatchActor  │ …          │
│  └────────────┘   └──────────┘   └────────────┘            │
│           ▲                  ▲                             │
│           │Eventstream       │Crash/DeadLetter             │
│  Prometheus╱            Grafana Dashboard                  │
└──────────────────────────────────────────────────────────────┘
           ▲
           │ gRPC / REST
   Backoffice / GM / Ops
```

* 使用 **Hollywood Cluster** 全局定位 Actor——`player-123` 无论在哪台机器都可 `Send()`
* **Gateway** 只做无状态转发，解决“长连接负载”与“业务逻辑”解耦
* 监控层订阅 Eventstream，实时观测 Crash、DeadLetter、匹配池大小等指标

---

## 4. 核心能力与游戏需求的契合点

| 游戏痛点                        | Hollywood 对应特性                       |
|---------------------------------|-----------------------------------------|
| 毫秒级帧同步 / 动作响应          | 无锁 RingBuffer，单 Actor 内顺序执行      |
| 玩家/房间崩溃自动恢复            | Crash Buffer + Supervision 重启           |
| 动态水平扩容（节假日流量激增）    | Cluster Sharding，Actor 按 ID 分片到新节点 |
| 网关与逻辑分离、消息可靠送达      | Remote dRPC + 至少一次投递                |
| 热更新/滚动升级最小停服          | 节点逐台下线，Shard 自动迁移               |
| 防止并发写导致资产竞态            | Actor 内单线程，天然强一致                 |
| 低成本监控与告警                 | Eventstream + Middleware + Prom           |
| 即时战场 & 离线挂机共存          | Idle TTL → RoomActor 自动钝化 / Passivate |

---

## 5. 关键实现片段

### 5.1 PlayerActor

```go
type PlayerMsg struct {
    Move vec3 // 走位
    Cast int  // 技能ID
}

type PlayerActor struct{
    uid   string
    state *pb.PlayerState
}

func (p *PlayerActor) Receive(ctx *actor.Context) {
    switch msg := ctx.Message().(type) {
    case actor.Started:
        // 读取 Redis / DB
    case *PlayerMsg:
        p.handleInput(msg)
    case *gm.Kick:
        ctx.Engine().Poison(ctx.Self()) // 踢下线
    }
}

func newPlayer(uid string) actor.Producer {
    return func() actor.Receiver { return &PlayerActor{uid: uid} }
}
```

### 5.2 RoomActor – 帧同步

```go
type RoomActor struct {
    id      string
    players [] *actor.PID
    tick    *time.Ticker
}

func (r *RoomActor) Receive(ctx *actor.Context){
    switch msg := ctx.Message().(type){
    case actor.Started:
        r.tick = time.NewTicker(33 * time.Millisecond) // 30 FPS
        ctx.SpawnFunc(r.loop, "room-loop")             // 内部协程
    case *Enter:
        r.players = append(r.players, msg.Player)
    case *Leave:
        // …
    }
}

func (r *RoomActor) loop(ctx *actor.Context){
    for range r.tick.C {
        for _, pid := range r.players {
            ctx.Send(pid, &Frame{Snap: r.snapshot()})
        }
    }
}
```

### 5.3 Cluster 激活

```go
pid := engine.Spawn(newPlayer(uid), uid,
        actor.WithInboxSize(1024),
        actor.WithMaxRestarts(3))

// 另一节点照样 Send，无需关心 pid.node
engine.Send(pid, &PlayerMsg{Move: pos})
```

Hollywood 会把 `uid` MurmurHash 到某个 Shard，若目标不在本节点就远程激活。

---

## 6. 运维与监控

1. **Eventstream 订阅器**
   ```go
   engine.Eventstream().Subscribe(pidMonitor,
        &actor.ActorRestartedEvent{},
        &actor.DeadLetterEvent{})
   ```
2. **Prometheus Middleware**
   ```go
   e.UseMiddleware(metrics.LatencyMW, metrics.InboxGaugeMW)
   ```
3. **热迁移**
   - 节点下线前调用 `cluster.MemberLeave()`
   - Sharding 层将 RoomActor/PlayerActor 迁至其他节点，无感知切换。

---

## 7. 性能实测（示例）

| 场景                    | Online 玩家 | 节点数 | Avg RTT | p99 |
|-------------------------|-------------|--------|---------|-----|
| 房间服 30 FPS           | 50 K        | 4      | 6 ms    | 12 ms |
| 匹配池 3K req/s         | –           | 2      | 3 ms    | 9 ms |
| 世界聊天广播 500 msg/s  | 全服        | 4      | 4 ms    | 10 ms |

硬件：AMD 7713P *2, 128GB, Go 1.22, Hollywood master

---

## 8. Limitations & Best Practices

1. **大房间 (>200 人)**
   - 单 RoomActor 可能 CPU 饱和；可拆分 AOI CellActor 或分布式帧合并。
2. **超大消息包**
   - 语音/录像数据应使用独立流服务，Actor 只存索引。
3. **一致性需求**
   - 跨玩家经济结算需 Saga 或集中 BankActor，避免分布式事务。
4. **Inbox 爆炸**
   - PvP DDoS 可把 InboxSize 设小并对外做节流。

---

## 9. 为什么说 Hollywood 特别适合游戏后端？

1. **低延迟**：无锁 RingBuffer + 单线程 Actor，tail-latency 几十微秒级。
2. **“天然房间”**：Room/Scene/Match 正是最好粒度的 Actor。
3. **强一致域**：玩家资产、房间状态在单 Actor 内线性一致，告别 mutex。
4. **可扩集群**：长尾玩家或世界频道可水平扩容，无需中心路由。
5. **容错**：单房崩溃自动重启且消息重放，玩家感知到的只是“掉帧”而非服务器挂掉。
6. **WASM 友好**：可用同一套逻辑在 Edge/浏览器模拟，做 AI Bot 或客户端预测。

> Actor Model 在游戏行业早已验证（Erlang MongooseIM、Elixir Phoenix、Akka Game）。Hollywood 把它用 Go 的方式重写，给予你习惯的生态、工具链与性能。
