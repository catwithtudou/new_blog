# 25.03《软件设计的哲学》阅读笔记下(09~)


## 第9章 在一起更好还是分开更好

!!! note "关键结论"

    拆分或合并模块的**决定应基于复杂性**。应选择能够实现以下结构：

    1. 最佳信息隐藏
    2. 最少依赖关系
    3. 最深接口

    当做出设计决策时，**关注点应该是如何最大程度地减少整体系统的复杂性，而不是遵循死板的规则**。

**1. 核心问题**

软件设计中最基本的问题之一：**给定两个功能，它们应该在同一位置一起实现，还是应该分开实现**？这个问题适用于系统中的所有级别，包括函数、方法、类和服务。

**2. 决策原则**

在决定是合并还是分开时，目标是**降低整个系统的复杂性并改善其模块化**。将系统划分成更小的组件看似可以简化每个单独组件，但细分也会带来额外的复杂性：

- **组件数量增加**导致更难追踪和查找
- 需要额外的代码来**管理组件间关系**
- 创造了**分离**，使开发人员更难同时查看组件
- 可能导致**代码重复**

**3. 何时合并代码？**

如果代码段紧密相关，将它们组合在一起通常是有益的。

以下是判断两段代码相关的几个指标：

| 相关性指标 | 描述 |
|----------|------|
| **信息共享** | 两段代码依赖于相同的信息，比如特定文档格式的语法 |
| **一起使用** | 使用一段代码的人很可能同时使用另一段（需是双向关系） |
| **概念重叠** | 存在一个简单的更高级别概念可以包含这两段代码 |
| **理解依赖** | 不看其中一段代码就很难理解另一段 |

**4. 核心设计准则**

**4.1 如果信息共享则合并在一起**

当两个模块需要共享大量相同信息时，这通常表明它们应该合并。

例如HTTP服务器中，读取HTTP请求和解析HTTP请求的方法分离会导致两个方法都需要了解HTTP请求的格式：

=== "分离的读取和解析（不推荐）"

    ```go
    // 在不同类中分离读取和解析HTTP请求
    type RequestReader struct {}

    func (r *RequestReader) ReadRequest(socket net.Conn) (string, error) {
        // 读取请求文本到字符串
        // 但为了知道何时结束，需要部分解析请求...
        return requestText, nil
    }

    type RequestParser struct {}

    func (p *RequestParser) ParseRequest(requestText string) (Request, error) {
        // 解析之前读取的请求文本
        // 再次分析相同的格式信息
        return request, nil
    }
    ```

=== "合并的读取和解析（推荐）"

    ```go
    // 合并读取和解析功能
    type RequestHandler struct {}

    func (h *RequestHandler) ReadAndParseRequest(socket net.Conn) (Request, error) {
        // 一次性读取和解析请求
        // 信息只需处理一次
        return request, nil
    }
    ```

**4.2 如果可以简化接口则合并在一起**

当两个或多个模块组合为一个模块时，可能会简化整体接口。例如Java I/O库中，如果`FileInputStream`和`BufferedInputStream`类被合并，并默认提供缓冲，大多数用户无需关心缓冲的存在。

**4.3 消除重复时合并在一起**

如果发现反复重复的代码模式，可以通过重构来消除重复。

=== "重复代码版本"

    ```go
    // 处理不同类型的网络数据包，每种类型都有相似的错误处理
    func ProcessPackets(packets []Packet) {
        for _, p := range packets {
            if p.Type == TYPE_A {
                if len(p.Data) < minLenA {
                    LOG("Packet too short for type A: %v", p)
                    continue
                }
                // 处理A类型包
            } else if p.Type == TYPE_B {
                if len(p.Data) < minLenB {
                    LOG("Packet too short for type B: %v", p)
                    continue
                }
                // 处理B类型包
            } else if p.Type == TYPE_C {
                if len(p.Data) < minLenC {
                    LOG("Packet too short for type C: %v", p)
                    continue
                }
                // 处理C类型包
            }
        }
    }
    ```

=== "重构后版本"

    ```go
    // 重构后的代码，错误处理只有一处
    func ProcessPackets(packets []Packet) {
        for _, p := range packets {
            minLen := 0
            switch p.Type {
            case TYPE_A:
                minLen = minLenA
            case TYPE_B:
                minLen = minLenB
            case TYPE_C:
                minLen = minLenC
            default:
                continue
            }

            if len(p.Data) < minLen {
                LOG("Packet too short for type %v: %v", p.Type, p)
                continue
            }

            // 处理不同类型的包...
        }
    }
    ```

**4.4 分离通用代码和专用代码**

如果一个模块包含可用于多种不同目的的机制，它应该只提供通用机制，而不包含专门针对特定用途的代码。

**例子：撤销机制设计**

=== "错误设计：撤销机制全在文本类中"

    ```go
    // 文本类包含所有撤销功能，包括与文本无关的内容
    type Text struct {
        // 文本相关字段
        undoList []UndoAction
    }

    func (t *Text) AddTextUndoAction(action TextUndoAction) {
        // 添加文本相关撤销动作
    }

    func (t *Text) AddSelectionUndoAction(action SelectionUndoAction) {
        // 添加选择相关的撤销动作（与文本无关！）
    }

    func (t *Text) AddCursorUndoAction(action CursorUndoAction) {
        // 添加光标相关的撤销动作（与文本无关！）
    }

    func (t *Text) Undo() {
        // 混合处理所有类型的撤销动作
    }
    ```

=== "良好设计：分离通用撤销机制"

    ```go
    // 通用撤销机制
    type History struct {
        actions []Action
        current int
    }

    // 通用动作接口
    type Action interface {
        Redo()
        Undo()
    }

    func (h *History) AddAction(action Action) {
        // 添加任何实现Action接口的动作
    }

    func (h *History) Undo() {
        // 通用撤销处理
    }

    // 文本类只实现自己的特定撤销动作
    type Text struct {
        // 文本相关字段
    }

    // 文本的特定撤销动作
    type TextInsertAction struct {
        text *Text
        position int
        content string
    }

    func (a *TextInsertAction) Undo() {
        // 撤销文本插入
    }

    // 用户界面模块实现自己的特定撤销动作
    type Selection struct {
        // 选择相关字段
    }

    type SelectionAction struct {
        selection *Selection
        oldRange Range
        newRange Range
    }

    func (a *SelectionAction) Undo() {
        // 撤销选择变更
    }
    ```

**5. 方法的拆分与合并**

关于方法的拆分，**长度本身很少是一个充分的理由**。开发者通常过度拆分方法。方法拆分应该遵循以下原则：

1. 只有在能使整个系统更简单时才拆分方法
2. 拆分方法有两种主要方式：

      - **提取子任务**：将独立子任务提取为辅助方法（推荐）
      - **分割功能**：将一个复杂方法拆分为两个公开的方法

![](https://img.zhengyua.cn/blog/202503171026843.png)

当拆分方法时需要警惕的信号：

- **联合方法**：如果需要频繁在父子方法间切换才能理解功能，这表明拆分可能是错误的


## 第10章 通过定义规避错误

!!! note "关键结论"

    特殊情况会使代码更难理解并增加bug的可能性。减少异常处理复杂性的四种主要技术是：

    1. **通过定义规避错误**：重新定义API语义，消除错误条件
    2. **异常屏蔽**：在低层处理异常，限制其影响范围
    3. **异常聚合**：将多个特殊情况的处理聚合到一个通用处理程序
    4. **直接让程序崩溃**：对于难以处理且罕见的错误，简单终止程序

    这些技术可以显著降低系统的整体复杂性，使代码更易于理解和维护。


**1. 异常处理的复杂性问题**

异常处理是**软件系统中最糟糕的复杂性来源之一**。处理特殊情况的代码本质上比处理正常情况的代码更难编写，而开发人员经常在不考虑如何处理异常的情况下定义异常。

代码可能以几种不同方式遇到异常：

- 调用方提供错误的参数或配置信息
- 调用的方法无法完成请求的操作
- 分布式系统中的网络和服务问题
- 代码检测到内部错误或未准备处理的情况

异常处理之所以增加复杂性，主要有以下原因：

a. **处理代码本身复杂**：异常处理需要决定是继续操作还是中止并上报
b. **引发更多异常**：处理一个异常常常会引发新的异常情况
c. **语法冗长繁琐**：异常处理的语法通常很啰嗦，破坏代码可读性
d. **难以测试**：异常处理代码很少执行，难以确保其正常工作

**2. 减少异常处理复杂性的四种技术**

**2.1 通过定义规避错误**

**核心思想**：修改API的定义，使得特殊情况成为正常行为的一部分，从而消除异常。

**示例：Tcl 的 unset 命令：**

=== "有问题的设计"

    ```go
    // unset命令如果变量不存在就抛出异常
    func unset(varName string) error {
        if !variableExists(varName) {
            return errors.New("变量不存在")
        }
        // 删除变量
        delete(variables, varName)
        return nil
    }

    // 使用时需要处理异常
    func cleanup() {
        // 很尴尬，需要捕获并忽略错误
        err := unset("tempVar")
        if err != nil {
            // 忽略错误
        }
    }
    ```

=== "改进的设计"

    ```go
    // 重新定义unset：确保变量不存在，而不是删除变量
    func unset(varName string) {
        // 无需检查变量是否存在
        delete(variables, varName)
        // 永远不会失败，无需返回错误
    }

    // 使用时简单明了
    func cleanup() {
        unset("tempVar") // 无需处理错误
    }
    ```

**示例：Java 的 substring 方法**

=== "原始设计"

    ```go
    // 如果索引超出范围则抛出IndexOutOfBoundsException
    func substring(s string, beginIndex, endIndex int) (string, error) {
        if beginIndex < 0 || endIndex > len(s) || beginIndex > endIndex {
            return "", errors.New("IndexOutOfBoundsException")
        }
        return s[beginIndex:endIndex], nil
    }

    // 使用时需要检查索引并处理异常
    func extractText(s string, start, end int) string {
        // 需要写5-10行代码来检查和调整索引
        if start < 0 {
            start = 0
        }
        if end > len(s) {
            end = len(s)
        }
        if start > end {
            start = end
        }

        result, err := substring(s, start, end)
        if err != nil {
            return ""
        }
        return result
    }
    ```

=== "改进的设计"

    ```go
    // 重新定义：返回索引范围内的所有字符(如果有)
    func substring(s string, beginIndex, endIndex int) string {
        // 自动调整索引
        if beginIndex < 0 {
            beginIndex = 0
        }
        if endIndex > len(s) {
            endIndex = len(s)
        }
        if beginIndex > endIndex {
            beginIndex = endIndex
        }

        if beginIndex == endIndex {
            return ""
        }
        return s[beginIndex:endIndex]
    }

    // 使用时简单直接
    func extractText(s string, start, end int) string {
        return substring(s, start, end) // 一行代码解决问题
    }
    ```

**示例：文件删除机制**

Unix与Windows的文件删除机制对比：


| 特性 | Windows | Unix |
|------|---------|------|
| 文件正在使用时 | 拒绝删除，返回错误 | 标记为删除，成功返回 |
| 用户体验 | 需搜索并关闭使用该文件的进程 | 可立即删除，无需其他操作 |
| 正在使用的文件 | 不允许创建同名新文件 | 可创建同名新文件 |
| 异常处理 | 需要处理"文件正在使用"的错误 | 无需处理特殊错误 |

**2.2 异常屏蔽**

**核心思想**：在低层检测并处理异常，使高层软件不需要感知异常。

**示例：传输协议中的数据包丢失**

TCP协议屏蔽了网络中数据包丢失的异常，在协议内部通过重发丢失的数据包来保证数据的可靠传输，应用层完全不需要处理这些异常。

**示例：NFS网络文件系统**

NFS文件系统在服务器暂时不可用时不会向应用程序报告错误，而是阻塞操作直到服务器恢复。虽然这会导致应用挂起，但比报告错误更好，因为：

1. 应用程序通常无法合理处理文件访问失败的情况
2. 如果报告错误，所有应用程序都需要添加重试逻辑
3. 阻塞允许服务器恢复后自动继续操作，无需用户干预

**2.3 异常聚合**

**核心思想**：使用单个异常处理代码处理多种异常，而不是为每种异常编写单独的处理程序。

=== "分散的异常处理"

    ```go
    // Web服务器中分散处理缺失参数
    func handleLogin(request *Request) Response {
        username, err := request.getParameter("username")
        if err != nil {
            return createErrorResponse("参数'username'不存在")
        }

        password, err := request.getParameter("password")
        if err != nil {
            return createErrorResponse("参数'password'不存在")
        }

        // 处理登录逻辑...
    }

    func handleRegister(request *Request) Response {
        username, err := request.getParameter("username")
        if err != nil {
            return createErrorResponse("参数'username'不存在")
        }

        email, err := request.getParameter("email")
        if err != nil {
            return createErrorResponse("参数'email'不存在")
        }

        // 处理注册逻辑...
    }
    ```

=== "聚合的异常处理"

    ```go
    // Web服务器中集中处理所有参数异常
    func dispatchRequest(request *Request) Response {
        var handler func(*Request) Response

        // 根据URL选择处理函数
        switch request.URL.Path {
        case "/login":
            handler = handleLogin
        case "/register":
            handler = handleRegister
        default:
            return createErrorResponse("未知路径")
        }

        // 聚合异常处理在顶层
        defer func() {
            if r := recover(); r != nil {
                // 检查是否是NoSuchParameter类型的异常
                if paramErr, ok := r.(NoSuchParameterError); ok {
                    return createErrorResponse(paramErr.Error())
                }
                // 重新抛出其他类型的异常
                panic(r)
            }
        }()

        return handler(request)
    }

    // 处理函数不再需要处理参数缺失的异常
    func handleLogin(request *Request) Response {
        username := request.getMustParameter("username")
        password := request.getMustParameter("password")

        // 处理登录逻辑...
    }

    func handleRegister(request *Request) Response {
        username := request.getMustParameter("username")
        email := request.getMustParameter("email")

        // 处理注册逻辑...
    }

    // 辅助方法，如果参数不存在则通过panic传递异常
    func (r *Request) getMustParameter(name string) string {
        value, err := r.getParameter(name)
        if err != nil {
            panic(NoSuchParameterError{
                Message: fmt.Sprintf("参数'%s'不存在", name),
            })
        }
        return value
    }
    ```

**RAMCloud系统中的异常聚合**

RAMCloud存储系统将小错误"提升"为大错误，使用相同的恢复机制处理多种错误：

- 当发现对象损坏时，不是单独恢复该对象，而是崩溃整个服务器
- 这样可以复用已有的服务器崩溃恢复机制，无需单独开发对象恢复机制
- 减少了需要编写和维护的代码量，提高了恢复机制的质量

**2.4 直接让程序崩溃**

**核心思想**：对于难以处理且罕见的错误，最简单的解决方案是打印诊断信息并中止应用程序。

适合直接崩溃的情况：

- 内存不足错误
- 罕见的I/O错误
- 网络套接字无法打开
- 检测到内部数据结构不一致

**示例：内存分配失败**

=== "传统C语言方式"

    ```c
    // 每次调用malloc都需要检查返回值
    void* ptr = malloc(size);
    if (ptr == NULL) {
        // 处理内存不足情况
        // 但实际上通常无法有效处理
    }
    ```

=== "简化的方式"

    ```go
    // 定义ckalloc函数统一处理内存分配失败
    func ckalloc(size int) unsafe.Pointer {
        ptr := C.malloc(C.size_t(size))
        if ptr == nil {
            // 打印诊断信息并中止程序
            log.Fatal("内存分配失败")
        }
        return ptr
    }

    // 使用时无需检查返回值
    ptr := ckalloc(size)
    ```

**3. 通过设计规避特殊情况**

特殊情况会导致代码中充斥着if语句，使代码难以理解并容易引入bug。应尽可能设计普通情况的处理方式，使其能够自动处理特殊情况。

**示例：文本编辑器中的选择**

=== "有特殊情况的设计"

    ```go
    type Selection struct {
        exists bool
        start Position
        end Position
    }

    func (s *Selection) copyText() string {
        if !s.exists {
            return "" // 特殊情况
        }
        // 复制选中文本...
    }

    func (s *Selection) deleteSelection() {
        if !s.exists {
            return // 特殊情况
        }
        // 删除选中文本...
    }
    ```

=== "规避特殊情况的设计"

    ```go
    type Selection struct {
        start Position
        end Position
        // 没有exists字段，选择始终存在
        // 当start == end时为空选择
    }

    func (s *Selection) copyText() string {
        // 无需检查选择是否存在
        // 如果start == end，自然返回空字符串
        return textBetween(s.start, s.end)
    }

    func (s *Selection) deleteSelection() {
        // 无需检查选择是否存在
        // 如果start == end，删除操作自然不会有效果
        newText := textBefore(s.start) + textAfter(s.end)
        replaceText(newText)
    }
    ```

**4. 需要注意的边界**

**并非所有异常都应该被规避或屏蔽**。如果异常信息对模块外部很重要，就必须将其暴露出来。

例如，在网络通信模块中，如果屏蔽了所有网络异常，应用程序将无法知道消息是否丢失或对端服务器是否故障，这会使构建健壮的应用程序变得不可能。


## 第11章 设计两次

!!! note "关键结论"

    设计两次是一种实用的软件设计方法论，它承认设计是困难的，**接受我们的第一想法通常不是最佳的**。通过强制考虑多个方案，它不仅提高了设计质量，还培养了设计思维能力。这一原则适用于从单个类到整个系统的各个层次的设计决策。

    对于软件设计者来说，**应该把"设计多个方案并比较"视为常规做法，而不是特例**。正如作者所说，这不是因为你不够聪明，而是因为问题本身确实很难，这正是软件设计有趣和有挑战性的地方。

**1. 核心思想**

**设计两次**的基本原则是：对于任何重要的设计决策，都应该考虑至少两种不同的方案，而不是仅实现首先想到的方案。这是因为设计软件非常困难，第一直觉很少能产生最佳设计。通过比较多个选项，可以得到更好的最终设计。

**2. 设计两次的实践方法**

**2.1 步骤1：考虑多种设计方案**

以GUI文本编辑器的文本管理类为例，可以考虑几种不同接口设计：

| 设计方案 | 描述 | 特点 |
|---------|-----|------|
| **面向行的接口** | 操作以整行文本为单位 | 在部分行和多行操作中需要拆分和合并行 |
| **面向字符的接口** | 以单个字符为单位插入删除 | 处理多字符操作需要循环调用 |
| **面向范围的接口** | 操作任意范围的字符，可跨行边界 | 能更好地匹配高级软件的需求 |

关键是选择**彼此根本不同**的方法，以便能学到更多。即使你确信只有一种合理方法，也要考虑第二种设计，无论它看起来多么不可行。

**2.2 步骤2：评估各方案的优缺点**

评估标准应包括：

1. **高级软件使用的易用性**（最重要）
2. **接口的简洁性**
3. **通用性**
4. **实现效率**

例如：面向字符的接口可能在处理多字符操作时效率低下，因为每个字符都需要单独的函数调用。

**2.3 步骤3：选择或整合最佳设计**

比较后，可能出现三种结果：

- 某一方案明显优于其他方案
- 可以整合多个方案的优点创造新设计
- 所有方案都不够理想，需要重新思考问题

**如果所有方案都不够理想，应该仔细分析它们的共同问题**。例如，如果只考虑了面向行和面向字符的方法，可能会发现它们都要求高级软件执行额外的文本操作，这是个危险信号——文本类应该处理所有文本操作。这种思考可能引导你设计出面向范围的API，从而解决前两种设计的问题。

**3. 多层次应用设计两次原则**

设计两次的原则可以应用于系统的多个层次：

=== "接口设计"

    ```go
    // 面向行的接口
    type LineTextEditor interface {
        InsertLine(lineNum int, content string) error
        DeleteLine(lineNum int) error
        GetLine(lineNum int) (string, error)
        // ...
    }

    // 面向字符的接口
    type CharTextEditor interface {
        InsertChar(position Position, char rune) error
        DeleteChar(position Position) error
        GetChar(position Position) (rune, error)
        // ...
    }

    // 面向范围的接口
    type RangeTextEditor interface {
        Insert(position Position, text string) error
        Delete(start, end Position) error
        GetText(start, end Position) (string, error)
        // ...
    }
    ```

=== "实现设计"

    ```go
    // 实现方案1：链表实现
    type LinkedListTextBuffer struct {
        lines *list.List
        // ...
    }

    // 实现方案2：固定大小字符块
    type BlockTextBuffer struct {
        blocks [][]rune
        blockSize int
        // ...
    }

    // 实现方案3：间隙缓冲区
    type GapBufferTextBuffer struct {
        buffer []rune
        gapStart int
        gapEnd int
        // ...
    }
    ```

不同层次关注点不同：

- **接口设计**：关注易用性、通用性
- **实现设计**：关注简单性和性能
- **系统分解**：关注模块间关系、责任分配

**4. 设计两次的时间投入与回报**

设计两次所需的额外时间投入通常很少，但回报丰厚：

| 模块规模 | 设计时间 | 实现时间 | 投资回报 |
|---------|---------|---------|---------|
| 小型类 | 1-2小时 | 数天或数周 | 显著更好的设计 |
| 大型模块 | 更多时间 | 更长时间 | 更高的收益 |

关键是：**设计阶段的适度投资可以在实现阶段获得倍数回报**。

**5. 聪明人的设计陷阱**

作者观察到，非常聪明的人有时难以接受设计两次的原则，原因可能是：

1. **成长经历**：聪明人可能习惯于第一个想法就足够好
2. **自我认知**：潜意识认为"聪明人应该第一次就做对"
3. **错误的标准**：将"一次成功"视为能力的衡量标准

然而，随着问题复杂度增加，每个人最终都会到达第一个想法不再足够好的境地。大型软件系统设计正是这种情况——没有人能第一次就做对。

**6. 设计两次的双重收益**

设计两次不仅能提高当前设计的质量，还能培养设计技能：

a. **设计质量提升**：通过比较多个方案找到更优解决方案
b. **设计能力成长**：了解什么因素使设计更好或更差
c. **判断力增强**：逐渐能更快排除不良设计，聚焦优秀设计

