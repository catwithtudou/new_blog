# 可优化的地方

## 1. storage.SubtitleTasks 全局 map 带来的并发安全问题

- 在 subtitle_service.go 实现中 storage.SubtitleTasks 变量是一个全局 map

- 该逻辑里面也有异步 goroutine 中修改全局 map 的处理，虽然每个任务有唯一的taskId，但是map的并发访问和修改是不安全的

- 项目中主流程和goroutine之间也确实可能会出现并发访问，虽然每个任务的处理是顺序的，但不同任务之间可能并发

- **可以考虑使用类似 sync.Map 的处理来进行避免**


## 2. 任务状态管理考虑持久化处理避免重启导致任务状态丢失

```go
storage.SubtitleTasks[taskId] = &types.SubtitleTask{
    TaskId:   taskId,
    VideoSrc: req.Url,
    Status:   types.SubtitleTaskStatusProcessing,
}
```

- 当前使用的是内存存储（map），建议改用 Redis 或数据库存储
- 需要考虑任务状态的持久化，避免服务重启导致任务状态丢失
- 可以添加任务过期清理机制

## 3. 多个任务的并发控制

- 建议添加任务队列，控制并发处理的任务数量
- 可以使用信号量或工作池模式限制同时处理的任务数

```go
// 建议添加类似这样的任务队列控制
type TaskQueue struct {
    semaphore chan struct{}
    tasks     chan *types.SubtitleTask
}

func NewTaskQueue(maxConcurrent int) *TaskQueue {
    return &TaskQueue{
        semaphore: make(chan struct{}, maxConcurrent),
        tasks:     make(chan *types.SubtitleTask, 100),
    }
}
```

## 4. 可考虑的架构演进

1. 消息队列改造

```go
// 使用消息队列解耦任务处理
type TaskProcessor struct {
    mqClient    mq.Client
    taskQueue   string
    resultQueue string
}

func (p *TaskProcessor) PublishTask(task *types.SubtitleTask) error {
    return p.mqClient.Publish(p.taskQueue, task)
}
```

2. 分布式任务处理

- 将任务处理服务独立部署
- 使用分布式任务调度系统（如 Asynq）
- 支持横向扩展的任务处理集群

3. WebSocket 实时进度

- 除了轮询接口外，可以提供 WebSocket 接口推送任务进度
- 减少客户端轮询压力
