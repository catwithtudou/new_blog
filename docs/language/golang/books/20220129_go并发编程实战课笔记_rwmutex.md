# Go并发编程实战课笔记—RWMutex


> 以下为鸟窝大佬的[Go 并发编程实战课](https://time.geekbang.org/column/intro/100061801) 中摘录的笔记
>
> [代码repo](https://github.com/catwithtudou/golang_concurrent_examples/tree/master/rwlock)



![image-20210103211026661](https://img.zhengyua.cn/img/20210103211026.png)


针对读写场景，即考虑`readers-writers`问题，同时可能有多个读或者多个写，但只要有一个线程在执行写操作，则其他线程都不能执行写操作，即读锁为共享锁，写锁为排他锁。

## RWMutex标准库

- Lock/Unlock：写操作时调用的方法。
- RLock/RUlock：读操作时调用的方法。
- RLocker：返回调用RLock/RUnlock的Lokcer接口的对象。

当出现明确区分并发读写场景，且有大量的并发读和少量的并发写，可以考虑使用读写锁RWMutex替换Mutex。

## RWMutex的实现原理

> Go标准库中的RWMutex是基于Mutex实现的。

readers-writers问题一般有三类，基于对读和写操作的优先级，读写锁的设计和实现也分成三类：

- Read-preferring：读优先设计提供很高的并发型，但是会在竞争激烈的情况下导致写饥饿。
- Writer-preferring：写优先设计针对新来的请求优先保障writer，避免writer饥饿问题。
- 不指定优先级。

Go标准库中的RWMutex设计是写优先的方案，即一个正在阻塞的Lock调用会排除新的reader请求到锁。

```go
type RWMutex struct {
	w Mutex // 互斥锁解决多个writer的竞争
	writerSem uint32 // writer信号量
	readerSem uint32 // reader信号量
	readerCount int32 // reader的数量
	readerWait int32 // writer等待完成的reader的数量
}
const rwmutexMaxReaders = 1 << 30
```

### RLock/Rulock实现

```go
func (rw *RWMutex) RLock() {
	if atomic.AddInt32(&rw.readerCount, 1) < 0 {
		// rw.readerCount是负值的时候，意味着此时有writer等待请求锁，因为writer优先
		runtime_SemacquireMutex(&rw.readerSem, false, 0)
	}
}
func (rw *RWMutex) RUnlock() {
	if r := atomic.AddInt32(&rw.readerCount, -1); r < 0 {
		rw.rUnlockSlow(r) // 有等待的writer
	}
}

func (rw *RWMutex) rUnlockSlow(r int32) {
	if atomic.AddInt32(&rw.readerWait, -1) == 0 {
		// 最后一个reader了，writer终于有机会获得锁了
		runtime_Semrelease(&rw.writerSem, false, 1)
	}
}
```

### Lock/Unlock实现

```go
func (rw *RWMutex) Lock() {
	// 首先解决其他writer竞争问题
	rw.w.Lock()
	// 反转readerCount，告诉reader有writer竞争锁
	r := atomic.AddInt32(&rw.readerCount, -rwmutexMaxReaders) + rwmutexMaxReaders
	// 如果当前有reader持有锁，那么需要等待
	if r != 0 && atomic.AddInt32(&rw.readerWait, r) != 0 {
		runtime_SemacquireMutex(&rw.writerSem, false, 0)
	}
}

func (rw *RWMutex) Unlock() {
	// 告诉reader没有活跃的writer了
	r := atomic.AddInt32(&rw.readerCount, rwmutexMaxReaders)
	// 唤醒阻塞的reader们
	for i := 0; i < int(r); i++ {
		runtime_Semrelease(&rw.readerSem, false, 0)
	}
	// 释放内部的互斥锁
	rw.w.Unlock()
}
```

## 陷阱

### 不可复制

互斥锁是不可复制的，再加上四个有状态的字段则更加不能复制使用，因为复制记录的状态与本身修改的状态不同步。

解决方案与互斥锁一样，可以借助vet工具进行检查。

### 重入导致死锁

重入导致的死锁情况较多且很难确认。

- writer重入调用Lock时会出现死锁。

  ```go
  func re(l *sync.RWMutex){
      l.Lock();
      re(l);
      l.UnLock();
  }
  ```

- 若在reader读操作时调用writer写操作，则会形成相互依赖的死锁关系。

- 环形依赖问题：writer依赖活跃的reader->活跃的reader依赖新来的reader->新来的reader依赖writer。

### 释放未加锁的RWMutex

使用读写锁的时候注意不要遗漏和多余。