# 可学习和参考的地方


## 1. python `__init__.py`

在 Python 中，`__init__.py` 文件有几个重要作用：

1. **标记目录为包(Package)**

   - Python 将含有 `__init__.py` 文件的目录视为一个包
   - 这允许该目录中的模块可以被导入到其他 Python 代码中

2. **初始化包**

   - 当包被导入时，`__init__.py` 中的代码会自动执行
   - 可以用于设置包级别的变量、导入依赖等

3. **控制导入行为**

   - 通过 `__all__` 列表定义当使用 `from package import *` 时哪些模块会被导入
   - 简化导入路径，例如允许从更深层次的子模块直接导入到包级别


**不同类型 `__init__.py`**


-  空的 `__init__.py`

```python
# 没有任何内容
```

**作用**：仅标记目录为 Python 包，使其中的模块可以被导入，但不进行任何初始化或导出操作。

- 有内容的 `__init__.py`

例如 `src/graph/__init__.py` 的内容：

```python
from .builder import build_graph

__all__ = [
    "build_graph",
]
```

**作用**：
- 提供包级别的导入接口，简化导入路径
- 对外暴露特定函数或类，隐藏内部实现细节
- 通过 `__all__` 控制 `from package import *` 的行为

或者像 `src/config/__init__.py` 那样汇总和重新导出多个子模块中的配置：

```python
from .env import (
    REASONING_MODEL,
    REASONING_BASE_URL,
    # ...其他配置...
)
from .tools import TAVILY_MAX_RESULTS

# 团队配置
TEAM_MEMBERS = ["researcher", "coder", "browser", "reporter"]

__all__ = [
    # ...导出的变量列表...
]
```

**在 LangManus 项目架构中，这种设计有以下好处：**

1. **提高代码可读性**
   - 使用者只需导入包，而不需要知道内部具体模块
   - 例如 `from src.graph import build_graph` 而不是 `from src.graph.builder import build_graph`

2. **实现封装**
   - 控制哪些函数和类被导出，哪些是内部实现
   - 提供更干净的 API 接口

3. **简化导入路径**
   - 将深层次目录中的重要函数提升到包级别
   - 避免冗长的导入路径

4. **集中管理配置**
   - 像 `src/config/__init__.py` 这样的文件集中了各个子模块的配置，使配置更容易管理

## 2. python 中的日志系统


**1. Python 日志系统的特点**

- **全局配置**：`logging.basicConfig()` 是对整个 Python 进程的日志系统进行全局配置，它**只应该被调用一次**。

- **首次配置生效原则**：如果 `logging.basicConfig()` 被多次调用，只有第一次调用会生效，后续的调用会被忽略。

- **模块级别的记录器**：每个 Python 模块应该创建自己的记录器 (`logger = logging.getLogger(__name__)`)，而不是重新配置日志系统。

**2. LangManus 项目中的日志处理**

在 LangManus 项目中多个文件（如 `src/workflow.py` 和 `server.py`）都调用了 `logging.basicConfig()`，这里是考虑到为了**模块独立运行支持**，因此都包含了日志配置，通常的最佳做法是：

- **在程序入口点配置一次**：只在程序主入口（如 `main.py`）中调用 `logging.basicConfig()`

> **最佳实践**：在 Python 项目中，日志系统的配置应该集中在一处，通常是在程序主入口点或专用的日志配置模块中。

- **在其他模块中只创建记录器**：其他模块应该只创建自己的记录器（`logger = logging.getLogger(__name__)`），不做全局和重复配置




**3. 推荐的日志处理方式**

一种更好的做法是创建一个专门的日志配置模块，例如 `src/config/logging.py`：

```python
import logging

def configure_logging(debug=False):
    """配置全局日志系统"""
    level = logging.DEBUG if debug else logging.INFO

    logging.basicConfig(
        level=level,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    )

    # 可以在这里添加更复杂的配置，如文件处理器、过滤器等
```

然后在主入口点调用这个函数：

```python
# main.py
from src.config.logging import configure_logging

if __name__ == "__main__":
    configure_logging(debug=True)
    # 其他代码...
```

在其他模块中只创建记录器，不进行全局配置：

```python
# 其他任何模块
import logging

logger = logging.getLogger(__name__)

def some_function():
    logger.debug("调试信息")
    logger.info("信息消息")
```


## 3. LangGraph 的使用

LangGraph 是由 LangChain 团队开发的一个开源框架，专门用于构建基于 LLM（大语言模型）的多智能体系统。它的主要目标是**简化多智能体系统的开发过程，提供一个声明式的方式来定义智能体之间的交互和协作**。特别适合构建：

- 多智能体协作系统
- 复杂的工作流自动化
- 智能对话系统
- 任务分解和执行系统

**#1. 核心概念**

```python
from langgraph.graph import StateGraph, START
```

- **状态图（StateGraph）**

      - 用于定义智能体之间的协作关系
      - 基于状态传递的工作流引擎
      - 通过节点和边构建工作流图

- **状态管理**

```python
class State(MessagesState):
    """智能体系统的状态类"""
    # 常量配置
    TEAM_MEMBERS: list[str]  # 团队成员列表

    # 运行时变量
    next: str           # 下一个执行节点
    full_plan: str      # 执行计划
    deep_thinking_mode: bool  # 思考模式
    search_before_planning: bool  # 预搜索模式
```

**#2. 工作流构建的最佳实践**

关键点：

- 使用 `StateGraph` 创建工作流构建器
- 通过 `add_edge` 定义节点间的连接
- 通过 `add_node` 添加节点及其处理函数
- 最后调用 `compile()` 生成可执行的工作流图

```python
def build_graph():
    """构建工作流图"""
    # 1. 创建图构建器
    builder = StateGraph(State)

    # 2. 定义起点
    builder.add_edge(START, "coordinator")

    # 3. 添加节点
    builder.add_node("coordinator", coordinator_node)
    builder.add_node("planner", planner_node)
    builder.add_node("supervisor", supervisor_node)
    # ... 添加其他节点

    # 4. 编译并返回
    return builder.compile()
```

**#3. 节点函数的实现模式**

节点函数的特点：

- 接收状态对象作为参数
- 返回 `Command` 对象，指定下一个节点和状态更新
- 可以访问和修改状态
- 可以调用外部工具和服务

```python
def coordinator_node(state: State) -> Command[Literal["planner", "__end__"]]:
    """协调员节点处理函数"""
    # 1. 处理当前状态
    messages = apply_prompt_template("coordinator", state)

    # 2. 调用 LLM
    response = get_llm_by_type(AGENT_LLM_MAP["coordinator"]).invoke(messages)

    # 3. 决定下一步
    goto = "planner" if "handoff_to_planner" in response.content else "__end__"

    # 4. 返回命令（包含状态更新和下一个节点）
    return Command(goto=goto)
```



**#4. 工作流执行**

执行特点：

- 通过 `graph.invoke()` 启动工作流
- 传入初始状态字典
- 自动按照图结构执行节点
- 返回最终状态


```python
def run_agent_workflow(user_input: str, debug: bool = False):
    """运行智能体工作流"""
    # 1. 准备初始状态
    initial_state = {
        "TEAM_MEMBERS": TEAM_MEMBERS,
        "messages": [{"role": "user", "content": user_input}],
        "deep_thinking_mode": True,
        "search_before_planning": True,
    }

    # 2. 执行工作流
    result = graph.invoke(initial_state)

    return result
```


**#5. LangGraph 的优势**

- **声明式工作流**

     - 清晰地定义智能体之间的关系
     - 容易理解和维护
     - 可视化支持（Mermaid 图表）

- **状态管理**

     - 统一的状态传递机制
     - 类型安全的状态定义
     - 方便的状态访问和更新

- **灵活性**

     - 可以动态决定下一个节点
     - 支持条件分支和循环
     - 易于扩展新的节点和功能


## 4. prompt 工程实践

```python
import os
import re
from datetime import datetime

from langchain_core.prompts import PromptTemplate
from langgraph.prebuilt.chat_agent_executor import AgentState


def get_prompt_template(prompt_name: str) -> str:
    """
    获取指定名称的提示模板内容。

    该函数从文件系统中读取提示模板文件，并对模板内容进行处理：
    1. 读取与提示名称对应的.md文件
    2. 转义所有花括号，防止与后续的格式化冲突
    3. 将特殊格式的占位符 <<VAR>> 转换为标准的 {VAR} 格式

    参数:
        prompt_name: 提示模板的名称，对应于.md文件名

    返回:
        处理后的提示模板字符串
    """
    template = open(os.path.join(os.path.dirname(__file__), f"{prompt_name}.md")).read()
    # Escape curly braces using backslash
    template = template.replace("{", "{{").replace("}", "}}")
    # Replace `<<VAR>>` with `{VAR}`
    template = re.sub(r"<<([^>>]+)>>", r"{\1}", template)
    return template


def apply_prompt_template(prompt_name: str, state: AgentState) -> list:
    """
    应用提示模板，生成格式化的提示消息列表。

    该函数将指定的提示模板与当前状态相结合：
    1. 使用get_prompt_template获取原始模板
    2. 创建PromptTemplate对象并填充变量，包括当前时间和状态中的数据
    3. 返回一个包含系统提示和状态消息的完整消息列表

    这种设计使得提示可以动态适应当前的对话上下文和状态信息。

    参数:
        prompt_name: 提示模板的名称
        state: 当前代理状态对象，包含消息历史和其他上下文信息

    返回:
        一个消息列表，包含格式化的系统提示和状态中的消息历史
    """
    system_prompt = PromptTemplate(
        input_variables=["CURRENT_TIME"],
        template=get_prompt_template(prompt_name),
    ).format(CURRENT_TIME=datetime.now().strftime("%a %b %d %Y %H:%M:%S %z"), **state)
    return [{"role": "system", "content": system_prompt}] + state["messages"]
```


1. **模块化设计**：每个代理（研究者、编码者、浏览器等）都有独立的提示模板文件（.md格式），便于维护和更新。

2. **灵活的模板系统**：

    - 使用了标准的Markdown文件存储提示模板
    - 采用自定义的占位符语法（`<<VAR>>`），让非技术人员也能轻松编辑
    - 通过代码自动转换为标准格式（`{VAR}`）用于后续处理

3. **状态管理与上下文集成**：

      - 将当前时间等环境信息注入到提示中
      - 将代理状态（包括消息历史）无缝集成到提示模板中
      - 使得提示可以根据对话上下文动态调整

4. **清晰的角色定义**：

      - 每个代理都有明确定义的职责和能力范围
      - 这种设计使得多代理协作更加有效和可靠

5. **统一的处理流程**：

      - 通过`apply_prompt_template`函数标准化了提示的应用方式
      - 确保所有代理使用一致的格式与LLM交互


## 5. 模型实例的缓存机制

该仓库实现了一个简单的LLM缓存机制非常值得学习和参考

```python
# 用于缓存LLM实例的字典
_llm_cache: dict[LLMType, ChatOpenAI | ChatDeepSeek] = {}

def get_llm_by_type(llm_type: LLMType) -> ChatOpenAI | ChatDeepSeek:
    """根据类型获取LLM实例。如果缓存中已有该类型的实例，则返回缓存的实例。"""
    if llm_type in _llm_cache:
        return _llm_cache[llm_type]

    # 创建新实例的逻辑...

    _llm_cache[llm_type] = llm
    return llm
```

1. **单例模式的简化实现**

      - 使用字典作为缓存容器，以LLM类型为键
      - 不需要复杂的单例类设计，就能确保每种类型的LLM只创建一次

2. **懒加载策略**

      - 模型实例只在首次请求时才被创建，而不是在程序启动时就全部初始化
      - 对于可能不会使用到的模型，避免了不必要的资源消耗

3. **对资源消耗的优化**

      - LLM实例通常消耗较多内存和计算资源
      - 缓存避免了重复创建相同类型的实例，减少了内存占用
      - 特别是对于大型模型（如GPT-4、Claude等），这种优化更为重要

4. **降低API初始化开销**

      - 创建LLM客户端实例可能涉及网络请求、验证等操作
      - 缓存机制减少了这些初始化开销，提高了系统响应速度

5. **简化使用方式**

      - 调用者不需要关心实例是否已经存在，只需通过`get_llm_by_type`函数获取
      - 减少了代码重复，提高了可维护性



