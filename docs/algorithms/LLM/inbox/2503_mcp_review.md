# 🔌从0到1带你了解和使用 MCP—AI应用拓展绕不开的协议

> **文档目标**
>
> - 科普当前 AI 模型与应用主流的交互标准协议 MCP（Model Context Protocol）
> - 帮助了解 MCP 与传统 API 之间的区别以及适用场景
> - 指导如何从0到1搭建和使用 MCP 服务，提供其通用思路和具体实践教程
> - 提供目前 MCP 的主流资源，帮助了解其业界的相关生态
>
> **阅读受众**
>
> - 对 AI 模型与应用之间的主流交互协议感兴趣，希望了解 MCP 来帮助拓展 AI 应用
> - 想要进一步了解 MCP 的底层以及实践，如与传统 API 的对比、底层架构和使用教程等

<!-- more -->


## 1. MCP 简介

### 1.1 什么是 MCP

Model Context Protocol（简称 MCP，模型上下文协议）是一种开放的标准化协议，其协议的核心目的：

- **统一** **AI** **模型与外部数据源和工具之间的交互方式**

简单来说，你可以把 MCP 想象成 AI 领域的 USB-C 接口（如下图生动形象地展示）：

- 让我们做到**使用统一规范对接各种数据源、工具和服务，轻松实现** **AI** **与外部环境的动态交互**

![](https://img.zhengyua.cn/blog/202503190952139.png)

![](https://img.zhengyua.cn/blog/202503190953379.png)

> 历史 Tips：MCP 最开始是 Anthropic 的一个项目，目的是让 Claude 等模型更容易与工具和数据源交互。
>
> 但随着 AI 系统工程迅速发展，它已经迅速发展成为了一个开放标准，越来越多的公司和开发者正在采用。

### 1.2 MCP 的核心价值

这里我们可将 MCP 所带来的核心价值总结为以下：

| **核心价值** | **具体作用**                                                 |
| ------------ | ------------------------------------------------------------ |
| 统一接口     | AI 模型与不同工具和服务通过单一标准连接，无需单独为每个服务编写定制化 API 集成代码 |
| 动态发现     | AI 模型能够自动发现可用的工具和数据源，而无需对每个工具进行硬编码的知识预设 |
| 实时双向通信 | 支持实时的双向数据交互，模型既可以主动获取数据（pull），也可以触发操作（push） |

而我们如果聚焦到具体常见的业务场景上，MCP 带来的好处可总结为以下几点：

- **开发效率**：一次编写，多次集成，无需为每次集成重写自定义代码
- **技术灵活性**：无需复杂的重新配置即可切换 AI 模型或工具
- **实时响应**：MCP 连接保持活跃，实现实时上下文更新和交互
- **安全性和合规性**：内置访问控制和标准化安全实践
- **可扩展性**：随着 AI 生态系统的发展，轻松添加新功能—只需连接另一个 MCP 服务器即可


## 2. 与传统 API 的对比

在 MCP 出现之前，我们通常通过各服务单独提供的API与AI系统交互。

这里我们通过对比传统 API 与 MCP 来帮助我们清晰地理解 MCP 带来的优势，这里我们以"钥匙"为类比：

- **传统 API 就像建筑物中每扇门都需要不同钥匙**

    每个 API 都有自己的文档、认证方法和错误处理，同时需要为每个服务编写特定的集成代码（如下图所示）

    ![](https://img.zhengyua.cn/blog/202503190954960.png)

- **MCP 就像拥有一把适用于不同系统的万能钥匙**

    集成一个 MCP 就可能做到访问多个工具和服务，同时支持持久的实时双向通信，既可以检索也可动态触发操作


### 2.1 特性对比

根据上述的描述我们通过几个关键特性来总结下传统 API 和 MCP 的对比情况：

| 特性           | 传统 API                     | MCP                          |
| -------------- | ---------------------------- | ---------------------------- |
| **集成工作量** | 每个服务或数据源需要单独代码 | 单一标准化集成协议           |
| **实时通信**   | ❌（有限的实时能力）          | ✅ （支持持久的实时双向通信） |
| **动态发现**   | ❌ （需要硬编码知识）         | ✅（可动态发现可用工具）      |
| **可扩展性**   | 需要额外集成                 | 即插即用，轻松扩展           |
| **安全与控制** | 每个 API 各不相同            | 跨工具一致                   |

### 2.2 使用对比

这里我们也通过列举如下场景来对比使用 API 和 MCP 的区别：

| **场景**     | **使用 API**                                      | **使用 MCP**                                        |
| ------------ | ------------------------------------------------- | --------------------------------------------------- |
| 旅行规划助手 | 为日历、电子邮件、航空公司预订 API 编写单独的代码 | 通过单一协议检查日历可用性、预订航班并发送确认邮件  |
| 高级 IDE     | 手动与文件系统、版本控制、包管理器集成            | 通过统一协议连接所有这些，实现更丰富的上下文感知    |
| 复杂数据分析 | 手动管理与数据库和可视化工具的连接                | AI 平台通过统一层自主发现并与数据库和可视化工具交互 |


### 2.3 适用场景

传统 API 适合需要**精确控制、可预测性高和性能敏感**场景，如关键业务逻辑处理、严格数据流控制和标准化工作流。

而 MCP 则在**处理复杂多模态交互、需要上下文理解和自然语言处理**的场景中表现优越。

所以在实际应用中，可根据功能需求结合使用两种技术，比如：

- **让 MCP 处理灵活的用户交互部分，传统 API 负责确定性的核心业务逻辑**


## 3. MCP 的底层架构

通过上面提到的图我可以看到：MCP 实际还是采用的**典型的客户端-服务器（client-server）架构**：

![](https://img.zhengyua.cn/blog/202503190956856.png)

![](https://img.zhengyua.cn/blog/202503190957878.png)

这里我们对上述提到的常见交互要素进行说明：

| **MCP** **Host（宿主应用）** | 需要**访问外部数据或工具的应用程序**，如 Claude Desktop 或 AI 驱动的 IDE |
| ---------------------------- | ------------------------------------------------------------ |
| **MCP** **客户端**           | 建立与 MCP 服务器的专用连接，**负责通信**!![](https://img.zhengyua.cn/blog/202503190957429.png) |
| **MCP** **服务器**           | 轻量级服务，**暴露具体的功能给** **AI** **模型**，连接本地或远程数据资源![](https://img.zhengyua.cn/blog/202503190957268.png) |
| **数据源**                   | MCP 服务器访**问的本地文件、数据库或远程服务**               |

理解这个架构，我们可以把 MCP 看作 AI 模型与工具（tools）之间的“桥梁”，即：

- **它本身并不执行具体业务逻辑，而是协调数据流动与指令执行**

## 4. MCP 的实践指南

为了帮助理解，接下来我们以**从零开始搭建一个简单的** **MCP** **服务（提供计算器 Tool）并在** **AI** **工具中进行使用**。

### 4.1 通用实现流程

在具体搭建前，我们可以先了解目前集成 MCP 的常见实现流程：

![](https://img.zhengyua.cn/blog/202503191006467.png)

### 4.2 开发环境准备

- 编程语言：Golang

> 注：目前[mcp 官方 SDK 支持](https://github.com/modelcontextprotocol)的语言主要是 Python、TypeScript、Java、Kotlin，暂未支持 Golang。
>
>
> 而考虑到服务端同学大部分是使用 Golang 开发，所以后续会使用目前实现 mcp 的主流的第三方库。

- MCP Client：Cursor（or Vscode+Client）
- 其他如终端、用于开发的 IDE 按照开发者的使用习惯选择即可

### 4.3 搭建 MCP 服务器

这里我们使用 golang + **[mcp-go](https://github.com/mark3labs/mcp-go)** 来搭建用于提供 MCP 服务的 Server，该 Server 会提供一个简单的计算器 Tool。

**#1. 安装** **[mcp-go](https://github.com/mark3labs/mcp-go)**

```Bash
go get github.com/mark3labs/mcp-go
```

**#2.** **初始化** **MCP** **server**

```go
package main

import (
    "fmt"

    "github.com/mark3labs/mcp-go/server"
)

func main() {
    // 初始化 MCP server
    s := server.NewMCPServer(
       "Calculator Demo",
       "1.0.0",
       server.WithResourceCapabilities(true, true),
       server.WithLogging(),
    )

    // 启动该 MCP Server
    if err := server.ServeStdio(s); err != nil {
       fmt.Printf("Server error: %v\n", err)
    }
}
```

**#3. 在 MCP 服务中增加计算器 Tool 并实现其逻辑**

```go
package main

import (
    "context"
    "fmt"

    "github.com/mark3labs/mcp-go/mcp"
    "github.com/mark3labs/mcp-go/server"
)

func main() {
    // 初始化 MCP server
    // ......

    // 为 MCP server 增加计算器 tool 进行声明
    calculatorTool := mcp.NewTool("calculate",
       mcp.WithDescription("Perform basic arithmetic operations"),
       mcp.WithString("operation",
          mcp.Required(),
          mcp.Description("The operation to perform (add, subtract, multiply, divide)"),
          mcp.Enum("add", "subtract", "multiply", "divide"),
       ),
       mcp.WithNumber("x",
          mcp.Required(),
          mcp.Description("First number"),
       ),
       mcp.WithNumber("y",
          mcp.Required(),
          mcp.Description("Second number"),
       ),
    )

    // 实现计算器 Tool 的具体逻辑
    s.AddTool(calculatorTool, func(ctx context.Context, request mcp.CallToolRequest) (*mcp.CallToolResult, error) {
       op := request.Params.Arguments["operation"].(string)
       x := request.Params.Arguments["x"].(float64)
       y := request.Params.Arguments["y"].(float64)

       var result float64
       switch op {
       case "add":
          result = x + y
       case "subtract":
          result = x - y
       case "multiply":
          result = x * y
       case "divide":
          if y == 0 {
             return mcp.NewToolResultError("Cannot divide by zero"), nil
          }
          result = x / y
       }

       // 将计算结果格式化为保留两位小数的字符串，并返回
       return mcp.NewToolResultText(fmt.Sprintf("%.2f", result)), nil
    })

    // 启动该 MCP Server
    // ....
}
```

**#4. 打包成应用程序方便后续 MCP Client 直接调用**

```go
go build -o mcp_server_demo.exe
```

### 4.4 MCP Client 调用

**这里我们以 Cursor 来进行举例**，除了 Cursor 之外目前市面上支持 MCP Server 还有 Vscode+Client 较为受欢迎。

> ⭐️如果想要了解 Cursor 的基本用法和高阶用法，以及适用场景和短板和最佳实践，这里推荐我写的[另一篇文档](https://zhengyua.cn/new_blog/blog/2025/02/14/%E6%8E%A2%E7%B4%A2-cursorai-%E7%BC%96%E7%A8%8B%E7%9A%84%E7%89%88%E6%9C%AC%E7%AD%94%E6%A1%88%E4%B9%8B%E4%B8%80/)。

最近也了解到字节最新的大模型开发框架 eino（同样也是 Golang 实现）[已支持 MCP Tool 调用](https://www.cloudwego.io/zh/docs/eino/ecosystem_integration/tool/tool_mcp/)，读者可自行尝试：

![](https://img.zhengyua.cn/blog/202503191008379.png)

**#1. 找到 Cursor 中配置 MCP server 的位置**

在首选项中找到 Cursor Settings 点击后，在“Features”中找到“MCP Servers”模块：

> 注：在 Cursor 的最新版本中，MCP Servers 模块已经放到 Cursor Settings 左侧主要模块中。

![](https://img.zhengyua.cn/blog/202503191009351.png)

**#2. 添加一个新的 MCP Server**

选择“Add new MCP server”后，将我们刚刚打包好的应用程序的路径添加进去，当指示变绿的时候便可正常使用：

![](https://img.zhengyua.cn/blog/202503191009207.png)

![](https://img.zhengyua.cn/blog/202503191009917.png)

![](https://img.zhengyua.cn/blog/202503191009364.png)

**#3. 在 Cursor 中使用 MCP server 提供 Tool**

在上面添加好 MCP Server 后，我们就可以在 Cursor 里使用了，这里需要额外注意的是：

- **只有在 Composer 模式中才会调用 MCP 提供的服务，Chat 模式是不会默认调用的**

在 Composer 对话框中我们输入“计算 12312321+43241234231 ”，便可在输出中观测到调用 mcp tool 的过程：

> 注意：由于目前模型基本上都能支持较为简单的运算，所以若不指定 mcp tool，则会直接计算得到结果，
>
> 所以这里为了方便演示 mcp tool 的调用过程，这里在输出的指令中强调了需要使用我们所提供的 mcp tool。

![](https://img.zhengyua.cn/blog/202503191009252.png)

## 5. MCP 相关资源

### 5.1 官方 Wiki

首先要提的就是 MCP 官方的 Wiki，包含相关介绍和发展以及面对不同开发者的教程和案例等，非常值得一看：

https://modelcontextprotocol.io/introduction

### 5.2 主流市场和导航

这里列举一些市面上使用人数较多且比较好用的 MCP 市场或导航站点，方便大家直接使用或了解：

| **名称&地址**                             | **简述**                                                     |
| ----------------------------------------- | ------------------------------------------------------------ |
| **[Glama.ai](https://glama.ai/mcp/servers)**  | 来自开源 [awesome-mcp-servers](https://github.com/punkpeye/awesome-mcp-servers)，目前已有将近 9.8k 的 stars 数。无论是语言还是应用场景，分类齐全，收录数量也是比较多的 ![](https://img.zhengyua.cn/blog/202503191010429.png)|
| **[Smithery.ai](https://smithery.ai/)**       | 界面直观清晰，交互体验较好每个 MCP Server 都有不同客户端使用的示例和说明 ![](https://img.zhengyua.cn/blog/202503191010558.png)![](https://img.zhengyua.cn/blog/202503191010165.png)|
| **[MCP.so](https://mcp.so/)**   | 号称最大的 MCP 服务器集合导航，目前共收录将近 2.8k 个 Server ![](https://img.zhengyua.cn/blog/202503191011035.png) |
| **[MCP.composio](https://mcp.composio.dev/)** | 该市场较为特别的点在于可直接生成对应 MCP 的 SSE URL：做到立即连接到完全托管的 MCP 服务器使用，具有内置身份验证和无缝可扩展性 ![](https://img.zhengyua.cn/blog/202503191011011.png) ![](https://img.zhengyua.cn/blog/202503191011737.png)|
| **[Pulse Mcp](https://www.pulsemcp.com/)**    | 目前共收录了 1.6k 个Server，提供较多 Use Cases，方便用户了解如何使用 ![](https://img.zhengyua.cn/blog/202503191011362.png) ![](https://img.zhengyua.cn/blog/202503191011211.png)|

### 5.3 MCP Client

除了前面提前的 AI 应用 Cursor 和 Clien 能作为 MCP Client 支持 MCP Server 的直接调用外，还有比如：

- Windsurf
- Claude 客户端
- Witsyai
- Enconvo、Glama 等

而且目前也有部分 AI 应用开发框架也是支持的，如 eino、spinai 等。相信 AI 应用支持 MCP 协议也会是大势所趋。

## 6. 总结

MCP 提供了一种统一和标准化的方式，将 AI 代理与外部工具和数据源集成。它不仅仅是另一个 API；它是一个连接框架，能够实现智能、动态和富含上下文的 AI 应用。且随着 MCP 生态系统的发展，我们可能会看到更多支持该协议的付费 MCP 服务器和客户端软件。MCP 采用的趋势已经很明显，值得投入时间学习和实施这项技术。

MCP 也是 AI 集成领域的一次重要变革，它简化了 AI 模型与外部工具间的交互，极大降低了开发门槛和维护复杂性。然而需要注意的是，MCP 更适合需要灵活性和实时响应的场景，而传统 API 在追求明确性和精确控制的场景中仍然有其优势。

通过本文的理论介绍与实践步骤，你已经掌握了 MCP 的基础知识和实际开发方法，下一步可以尝试更多复杂的工具开发与集成实践，进一步探索 MCP 在实际项目中的强大价值。

## 7. 参考

https://norahsakal.com/blog/mcp-vs-api-model-context-protocol-explained/

https://mp.weixin.qq.com/s/y4f-TiK7kOe_vK2sh7It8A

https://www.panziye.com/ai/15769.html