
# pocketbase

> repo：https://github.com/catwithtudou/pocketbase

## 1. 项目概览

### readme

[PocketBase](https://pocketbase.io) is an open source Go backend that includes:

- embedded database (_SQLite_) with **realtime subscriptions**
- built-in **files and users management**
- convenient **Admin dashboard UI**
- and simple **REST-ish API**

**For documentation and examples, please visit https://pocketbase.io/docs.**

Overview:

1.  Use as standalone app

You could download the prebuilt executable for your platform from the [Releases page](https://github.com/pocketbase/pocketbase/releases).
Once downloaded, extract the archive and run `./pocketbase serve` in the extracted directory.

The prebuilt executables are based on the [`examples/base/main.go` file](https://github.com/pocketbase/pocketbase/blob/master/examples/base/main.go) and comes with the JS VM plugin enabled by default which allows to extend PocketBase with JavaScript (_for more details please refer to [Extend with JavaScript](https://pocketbase.io/docs/js-overview/)_).

2. Use as a Go framework/toolkit

PocketBase is distributed as a regular Go library package which allows you to build
your own custom app specific business logic and still have a single portable executable at the end.

### 技术栈选择

### 整体架构设计



### 目录结构

![](https://img.zhengyua.cn/blog/202412150938032.png)

**1. 核心目录**

apis/: 包含 API 相关的实现代码
core/: 核心功能实现
cmd/: 命令行工具相关代码
plugins/: 插件系统
tools/: 工具类代码
ui/: 用户界面相关代码

**2. 功能支持目录**

forms/: 表单处理相关代码
mails/: 邮件功能相关代码
migrations/: 数据库迁移相关代码

**3. 测试相关**

tests/: 测试代码目录
examples/: 示例代码
pocketbase_test.go: 主程序测试文件

**4. 主程序文件**

pocketbase.go: 主程序入口文件

#### core

从 core 目录的内容可以看出，这是一个功能完整的后端框架，主要包含：

**1. 数据模型相关：**

- collection_*.go: 集合/数据表相关的模型和操作
- record_*.go: 记录相关的模型和操作
- field_*.go: 各种字段类型的实现（text, number, file, email 等）

**2. 认证相关：**

- auth_*.go: 认证相关
- external_auth_*.go: 外部认证
- mfa_*.go: 多因素认证
- otp_*.go: 一次性密码

**3. 数据库相关：**

- db_*.go: 数据库连接和操作
- migrations_*.go: 数据库迁移

**4. 核心功能：**

- app.go: 应用程序主体
- base.go: 基础功能
- events.go: 事件系统
- settings_*.go: 系统设置
- validators/: 验证器

#### 目录调用关系

```
请求 → 路由 → 中间件 → API处理器 → 核心服务 → 数据模型 → 存储层
↑                                     ↓
└─────────────────── 响应 ←───────────┘
```

![](https://img.zhengyua.cn/blog/202412150956740.png)


## 2. 流程分析

### 入口启动流程

![](https://img.zhengyua.cn/blog/202412151044529.png)

## 3. 可学习的地方


### 3.1 入口流程使用Base结构体进行收敛

![](https://img.zhengyua.cn/blog/202412151039990.png)


### 3.2 检测运行环境(区分是通过gorun还是编译后运行)

```go
func inspectRuntime() (baseDir string, withGoRun bool) {
	if strings.HasPrefix(os.Args[0], os.TempDir()) {
		// probably ran with go run
		withGoRun = true
		baseDir, _ = os.Getwd()
	} else {
		// probably ran with go build
		withGoRun = false
		baseDir = filepath.Dir(os.Args[0])
	}
	return
}
```

主要作用：

- 确定应用的基础目录（baseDir），使之能在运行时正确找到对应资源
- 判断是否通过 go run 运行，以此来区分开发环境还是生产环境

```bash
# 开发环境
go run main.go
# os.Args[0] 会指向临时目录
# baseDir 将是当前工作目录

# 生产环境
./pocketbase
# os.Args[0] 会指向实际的二进制文件
# baseDir 将是二进制文件所在目录
```

### 3.3 识别命令场景跳过资源加载

```go
// 情况1：已经完成引导
if pb.IsBootstrapped() {
    return true
}

// 情况2：未知命令
cmd, _, err := pb.RootCmd.Find(os.Args[1:])
if err != nil {
    return true
}

// 情况3和4：帮助命令或版本命令
flags := []string{"-h", "--help", "-v", "--version"}
```

- **性能优化考虑**：对于简单命令（如查看帮助、版本）不需要完整的引导过程，同时避免不必要的数据库连接和资源初始化
- 避免重复初始化：如果应用已经引导完成，不需要再次引导，同时防止多次初始化可能带来的问题
- 命令行体验优化：帮助和版本信息应该快速响应，不应该等待完整的应用初始化

```bash
pocketbase --help  # 不需要引导就能显示帮助
pocketbase -h      # 同上

pocketbase unknown-command  # 快速返回错误，不需要引导
```

### 3.4 启动时注册系统命令区分权限

- serve 命令：启动 Web 服务器，这是 PocketBase 最基本的功能
- superuser 命令：管理超级用户账户，这是系统管理的必要功能

```go
	// register system commands
	pb.RootCmd.AddCommand(cmd.NewSuperuserCommand(pb))
	pb.RootCmd.AddCommand(cmd.NewServeCommand(pb, !pb.hideStartBanner))
```