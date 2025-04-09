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

## 6. Research Agent

```python
# 研究型代理 (Research Agent)
# 该代理主要负责信息检索和网络爬取工作
# 使用 tavily_tool 进行搜索和 crawl_tool 进行网页爬取
research_agent = create_react_agent(
    # 根据配置文件中指定的LLM类型获取对应的语言模型
    get_llm_by_type(AGENT_LLM_MAP["researcher"]),
    # 为研究代理分配专用工具集：搜索和爬虫工具
    tools=[tavily_tool, crawl_tool],
    # 使用动态提示模板，根据当前状态生成适合研究任务的提示
    prompt=lambda state: apply_prompt_template("researcher", state),
)
```

### tavily_tool

项目中使用 Tavily Search 来实现 tavily_tool。Tavily Search 是 LangChain 集成的一个搜索工具，具有以下特点：

- 它是一个 AI 优化的搜索引擎，专门为 LLM（大语言模型）应用设计
- 可以返回结构化的搜索结果
- 支持配置最大返回结果数量（通过 TAVILY_MAX_RESULTS 参数）
- 适合用于需要网络搜索能力的 AI 应用场景

```python
"""
搜索工具模块 - 集成了 Tavily 搜索功能

该模块提供了基于 Tavily API 的网络搜索功能，并集成了日志记录功能。
Tavily 是一个 AI 优化的搜索引擎，专门用于 LLM 应用。
"""

import logging
from langchain_community.tools.tavily_search import TavilySearchResults
from src.config import TAVILY_MAX_RESULTS
from .decorators import create_logged_tool

# 初始化日志记录器
logger = logging.getLogger(__name__)

# 使用装饰器创建带有日志功能的 Tavily 搜索工具
# TavilySearchResults 是 LangChain 提供的搜索工具，可以返回结构化的搜索结果
# create_logged_tool 是一个工厂函数，用于为工具类添加日志记录功能
LoggedTavilySearch = create_logged_tool(TavilySearchResults)

# 初始化 Tavily 搜索工具实例
# name: 工具的唯一标识符
# max_results: 限制每次搜索返回的最大结果数量
tavily_tool = LoggedTavilySearch(name="tavily_search", max_results=TAVILY_MAX_RESULTS)
```

### crawl_tool

该crawl_tool是一个网页爬虫工具函数：

```python
import logging
from typing import Annotated

from langchain_core.messages import HumanMessage
from langchain_core.tools import tool
from .decorators import log_io

from src.crawler import Crawler

# 初始化日志记录器
logger = logging.getLogger(__name__)


@tool
@log_io
def crawl_tool(
    url: Annotated[str, "The url to crawl."],
) -> HumanMessage:
    """
    用于爬取网页内容并将其转换为可读的Markdown格式的工具函数。

    该工具作为LangChain框架中的一个可调用"工具"，允许语言模型对指定URL进行
    网页爬取，并获取结构化的内容。返回的内容会被格式化为适合AI模型阅读的格式。

    参数:
        url: 需要爬取的网页URL地址

    返回:
        HumanMessage对象: 包含爬取内容的消息对象，以便于在LangChain对话流中使用
        或者在爬取失败时返回错误信息字符串
    """
    try:
        # 创建爬虫实例
        crawler = Crawler()
        # 调用爬虫的crawl方法爬取指定URL的内容
        # 返回的article对象包含了网页的结构化内容
        article = crawler.crawl(url)
        # 将爬取的内容转换为消息格式并包装为HumanMessage对象返回
        # 这样可以直接在聊天流中使用这些内容
        return {"role": "user", "content": article.to_message()}
    except BaseException as e:
        # 捕获所有可能的异常，确保工具不会因为爬取错误而崩溃
        error_msg = f"爬取失败。错误信息: {repr(e)}"
        # 记录错误日志
        logger.error(error_msg)
        # 将错误信息返回给调用者
        return error_msg
```


- **工具功能**：

     - 作为LangChain工具链中的网页爬取组件
     - 能够访问指定URL并提取网页内容
     - 将网页内容转换为结构化的Markdown格式
     - 适合AI模型阅读和理解的输出格式

- **实现逻辑**：

     - 使用`@tool`装饰器将函数注册为LangChain工具
     - 使用`@log_io`装饰器记录输入输出，便于调试
     - 接收URL参数，返回包含爬取内容的HumanMessage对象
     - 使用异常处理确保即使爬取失败也能返回有意义的错误信息

- **集成方式**：

     - 封装了底层Crawler类的功能，提供简单的接口
     - 返回适合在LangChain对话流中直接使用的消息对象
     - 在src/agents/agents.py中，该工具被分配给了研究型代理使用

- **错误处理**：

     - 捕获所有类型的异常（BaseException）
     - 记录详细的错误日志
     - 将错误信息格式化后返回给调用者

底层 Crawler 的实现主要依赖于 Jina，如下：

```python
import sys

from .article import Article
from .jina_client import JinaClient
from .readability_extractor import ReadabilityExtractor


class Crawler:
    """
    网页爬虫类，负责爬取指定URL的网页内容并转换为结构化的Article对象。

    该类整合了Jina爬虫服务和自定义的可读性提取器，实现了从URL到结构化文章内容的转换过程。
    主要用于为AI模型提供干净、结构化的网页内容。
    """

    def crawl(self, url: str) -> Article:
        """
        爬取指定URL的网页内容并转换为Article对象。

        工作流程：
        1. 使用JinaClient爬取原始HTML内容
        2. 使用ReadabilityExtractor从HTML中提取结构化文章
        3. 将结果封装为Article对象返回

        参数:
            url: 需要爬取的网页URL

        返回:
            Article: 包含结构化内容的文章对象
        """
        # 为了帮助语言模型更好地理解内容，我们从HTML中提取干净的
        # 文章内容，将其转换为Markdown格式，并将其分割为文本和图像块，
        # 形成统一的、适合语言模型处理的消息格式。
        #
        # Jina虽然在可读性方面不是最佳爬虫，但它使用简单且免费。
        #
        # 我们不使用Jina自带的Markdown转换器，而是使用
        # 自己的解决方案，以获得更好的可读性结果。

        # 创建Jina客户端实例
        jina_client = JinaClient()
        # 调用Jina客户端的crawl方法爬取指定URL的HTML内容
        html = jina_client.crawl(url, return_format="html")
        # 创建可读性提取器实例
        extractor = ReadabilityExtractor()
        # 使用提取器从HTML中提取结构化文章内容
        article = extractor.extract_article(html)
        # 设置文章对象的URL属性
        article.url = url
        # 返回处理完成的文章对象
        return article
```

而其中关于 ReadabilityExtractor 来从 html 提取结构化文章内容的处理，主要是依赖了 [readabilipy 库](https://github.com/alan-turing-institute/ReadabiliPy)，其具体代码如下：

```python
from readabilipy import simple_json_from_html_string  # 导入readabilipy库中的HTML解析函数

from .article import Article  # 导入自定义的Article类，用于存储提取后的文章内容


class ReadabilityExtractor:
    """
    网页可读性提取器
    用于从HTML内容中提取文章的核心内容（标题和正文），
    通过readabilipy库实现，该库底层使用Mozilla的Readability算法。

    该类的主要作用是将复杂的HTML页面简化，仅保留对用户有价值的文章内容部分，
    去除导航栏、侧边栏、广告等干扰元素。

    技术背景:
    - readabilipy是一个Python库，是Mozilla的Readability.js算法的Python封装
    - Readability算法最初由Arc90实验室开发，后被Mozilla收购并用于Firefox的阅读模式
    - 该算法通过分析DOM结构、文本密度和HTML标签特征来识别页面的主要内容
    - 常用于内容抽取、RSS生成、文章归档等场景

    设计考虑:
    - 采用单一职责原则，该类只负责内容提取，不涉及HTML获取和后续处理
    - 将提取结果封装为Article对象，便于后续处理（如转换为Markdown、存储等）
    - 未对extractor做缓存或池化处理，每次调用都会重新执行提取算法

    潜在优化:
    - 可添加提取配置参数，允许自定义提取行为（如是否保留图片、表格等）
    - 可实现错误处理机制，处理解析失败的情况
    - 可增加预处理步骤，如处理特定网站的自定义结构
    - 可添加后处理逻辑，如清理多余空白、规范化图片路径等
    """

    def extract_article(self, html: str) -> Article:
        """
        从HTML字符串中提取文章内容

        Args:
            html: 包含文章内容的HTML字符串

        Returns:
            Article: 包含提取出的标题和HTML内容的Article对象

        处理流程:
            1. 使用readabilipy库的simple_json_from_html_string函数解析HTML
            2. 从解析结果中提取标题和内容
            3. 将提取的信息封装到Article对象中返回

        注意:
            - 设置use_readability=True参数表示使用Mozilla的Readability算法进行内容提取
            - 如果原始HTML不包含有效的文章内容，可能返回空标题或内容
            - simple_json_from_html_string返回的字典还包含其他信息，如byline(作者)、
              excerpt(摘要)等，可根据需要扩展Article类来存储这些信息

        性能考虑:
            - 内容提取是CPU密集型操作，处理大型HTML文档可能较慢
            - 对于高并发场景，考虑使用异步处理或工作队列
            - HTML解析和DOM操作是主要的性能瓶颈
        """
        # 使用readabilipy解析HTML，返回包含文章信息的字典
        article = simple_json_from_html_string(html, use_readability=True)

        # 创建并返回Article实例，将提取出的标题和内容传入
        return Article(
            title=article.get("title"),  # 提取文章标题，使用get避免键不存在时出错
            html_content=article.get("content"),  # 提取文章HTML内容
        )
```




## 7. Python 中的装饰器

项目中提供了日志记录功能的装饰器实现：

```python
"""
工具装饰器模块 - 提供日志记录功能的装饰器实现

本模块实现了两种方式来为工具添加日志记录功能：
1. 函数装饰器 (@log_io)：用于装饰独立的工具函数
2. 类装饰器工厂 (create_logged_tool)：用于为工具类添加日志功能
"""

import logging
import functools
from typing import Any, Callable, Type, TypeVar

# 初始化日志记录器
logger = logging.getLogger(__name__)

# 定义泛型类型变量，用于类型注解
T = TypeVar("T")


def log_io(func: Callable) -> Callable:
    """
    函数装饰器：记录工具函数的输入参数和输出结果

    这个装饰器会在函数执行前后添加日志记录，用于跟踪函数的调用情况：
    - 执行前：记录函数名和输入参数
    - 执行后：记录函数的返回值

    Args:
        func: 需要被装饰的工具函数

    Returns:
        装饰后的函数，增加了日志记录功能
    """

    @functools.wraps(func)  # 保留原函数的元数据
    def wrapper(*args: Any, **kwargs: Any) -> Any:
        # 记录输入参数
        func_name = func.__name__
        params = ", ".join(
            [*(str(arg) for arg in args), *(f"{k}={v}" for k, v in kwargs.items())]
        )
        logger.debug(f"Tool {func_name} called with parameters: {params}")

        # 执行原函数
        result = func(*args, **kwargs)

        # 记录输出结果
        logger.debug(f"Tool {func_name} returned: {result}")

        return result

    return wrapper


class LoggedToolMixin:
    """
    Mixin类：为工具类添加日志记录功能

    通过继承这个Mixin类，工具类可以获得自动日志记录的能力。
    主要提供两个方法：
    1. _log_operation：记录工具操作的辅助方法
    2. _run：重写基类的执行方法，添加日志记录
    """

    def _log_operation(self, method_name: str, *args: Any, **kwargs: Any) -> None:
        """
        辅助方法：记录工具操作的详细信息

        Args:
            method_name: 被调用的方法名
            *args: 位置参数
            **kwargs: 关键字参数
        """
        tool_name = self.__class__.__name__.replace("Logged", "")
        params = ", ".join(
            [*(str(arg) for arg in args), *(f"{k}={v}" for k, v in kwargs.items())]
        )
        logger.debug(f"Tool {tool_name}.{method_name} called with parameters: {params}")

    def _run(self, *args: Any, **kwargs: Any) -> Any:
        """
        重写工具类的执行方法，添加日志记录功能

        在执行原始_run方法前后添加日志记录：
        - 执行前：记录调用参数
        - 执行后：记录返回结果
        """
        self._log_operation("_run", *args, **kwargs)
        result = super()._run(*args, **kwargs)
        logger.debug(
            f"Tool {self.__class__.__name__.replace('Logged', '')} returned: {result}"
        )
        return result


def create_logged_tool(base_tool_class: Type[T]) -> Type[T]:
    """
    工厂函数：创建具有日志功能的工具类

    这是一个类装饰器工厂函数，用于创建一个新的工具类，该类继承自原始工具类
    并混入日志记录功能。

    使用示例：
    ```python
    LoggedMyTool = create_logged_tool(MyTool)
    tool_instance = LoggedMyTool()
    ```

    Args:
        base_tool_class: 原始工具类，需要被增强的类

    Returns:
        新的工具类，继承自LoggedToolMixin和原始工具类
    """

    class LoggedTool(LoggedToolMixin, base_tool_class):
        pass

    # 设置更具描述性的类名
    LoggedTool.__name__ = f"Logged{base_tool_class.__name__}"
    return LoggedTool
```

**1. 什么是装饰器？**

装饰器是 Python 中的一个重要特性，它允许我们在不修改原有代码的情况下，为函数或类添加新的功能。装饰器本质上是一个函数，它接受一个函数或类作为输入，并返回一个新的函数或类。

**2. 装饰器的基本形式**

```python
# 函数装饰器的基本形式
def decorator(func):
    def wrapper(*args, **kwargs):
        # 在函数执行前做些什么
        result = func(*args, **kwargs)
        # 在函数执行后做些什么
        return result
    return wrapper

# 使用装饰器
@decorator
def my_function():
    pass
```

**3. 装饰器的主要用途**

- 日志记录（如本例中的实现）
- 权限验证
- 性能测量
- 缓存
- 参数验证
- 异常处理

**4. 本例中的装饰器实现**

这个模块实现了两种装饰器模式：

**函数装饰器 `@log_io`**：

- 用于装饰独立的工具函数
- 自动记录函数的输入和输出
- 使用 `@functools.wraps` 保留原函数的元数据

```python
@log_io
def my_tool_function():
    pass
```


**类装饰器工厂 `create_logged_tool`**：

- 用于为整个类添加日志功能
- 使用 Mixin 模式实现功能扩展
- 保持类型提示的正确性（使用泛型）

```python
LoggedMyTool = create_logged_tool(MyTool)
tool_instance = LoggedMyTool()
```


**5. 最佳实践**

**使用 `functools.wraps`**

```python
from functools import wraps

def decorator(func):
    @wraps(func)  # 保留原函数的元数据
    def wrapper():
        pass
    return wrapper
```

- **参数的灵活处理**

```python
def wrapper(*args, **kwargs):  # 使用不定参数
    pass
```

- **类型提示**

```python
from typing import Callable, Any
def decorator(func: Callable) -> Callable:
    pass
```

**文档字符串**

```python
def decorator(func):
    """清晰的文档说明装饰器的功能和用法"""
    pass
```

**6. 进阶用法**

**带参数的装饰器**

```python
def decorator_with_args(arg1, arg2):
    def decorator(func):
        def wrapper(*args, **kwargs):
            # 使用 arg1, arg2
            return func(*args, **kwargs)
        return wrapper
    return decorator

@decorator_with_args("param1", "param2")
def function():
    pass
```

**类作为装饰器**

```python
class Decorator:
    def __init__(self, func):
        self.func = func

    def __call__(self, *args, **kwargs):
        # 在这里添加装饰器逻辑
        return self.func(*args, **kwargs)
```

## 8. Browser Agent

```python
# 浏览器代理 (Browser Agent)
# 该代理主要负责与网页交互，如点击、填表等操作
# 使用 browser_tool 进行网页浏览和交互
browser_agent = create_react_agent(
    # 根据配置文件指定的LLM类型获取对应的浏览器操作专用语言模型
    get_llm_by_type(AGENT_LLM_MAP["browser"]),
    # 为浏览器代理分配专用工具：浏览器自动化工具
    tools=[browser_tool],
    # 使用动态提示模板，根据当前状态生成适合网页交互任务的提示
    prompt=lambda state: apply_prompt_template("browser", state),
)
```


- 项目中使用三方库 [browser-use](https://github.com/browser-use/browser-use) 来实现控制浏览器的 AIAgent

**主要特点和功能**

- **核心定位：**

    - 🌐 为 AI 代理提供最简单的浏览器控制方式
    - 让 AI 能够直接操作和控制网页浏览器
    - 支持自然语言指令转换为浏览器操作

- **技术架构：**
    - 基于 Playwright 实现浏览器自动化
    - 支持多种 LLM 模型集成（OpenAI、Anthropic、Azure、Gemini、DeepSeek等）
    - 提供异步操作支持

## 9. Coder Agent

```python
# 代码开发代理 (Coder Agent)
# 该代理主要负责编写和执行代码
# 使用 python_repl_tool 执行Python代码和 bash_tool 执行系统命令
coder_agent = create_react_agent(
    # 根据配置文件指定的LLM类型获取对应的代码开发专用语言模型
    get_llm_by_type(AGENT_LLM_MAP["coder"]),
    # 为代码开发代理分配专用工具集：Python解释器和Bash命令执行工具
    tools=[python_repl_tool, bash_tool],
    # 使用动态提示模板，根据当前状态生成适合编程任务的提示
    prompt=lambda state: apply_prompt_template("coder", state),
)
```

### python_repl_tool


该部分**实现了一个 Python REPL（Read-Eval-Print Loop）工具**，它是该仓库中的一个重要工具组件，用于动态执行 Python 代码：

```python
# Python REPL工具模块
# 该模块提供了一个Python代码执行环境（REPL: Read-Eval-Print Loop）的工具
# 用于在Agent运行过程中动态执行Python代码，进行数据分析或计算

import logging
from typing import Annotated
from langchain_core.tools import tool  # 导入LangChain工具装饰器
from langchain_experimental.utilities import PythonREPL  # 导入Python REPL实用工具
from .decorators import log_io  # 导入自定义日志装饰器

# 初始化Python REPL环境和日志记录器
repl = PythonREPL()  # 创建Python代码执行环境实例
logger = logging.getLogger(__name__)  # 获取模块级别的日志记录器


@tool  # LangChain工具装饰器，将函数注册为LangChain可用的工具
@log_io  # 自定义日志装饰器，用于记录工具的输入和输出
def python_repl_tool(
    code: Annotated[
        str, "The python code to execute to do further analysis or calculation."
    ],
):
    """使用此工具执行Python代码，进行数据分析或计算。

    如果想要查看某个值的输出，应使用`print(...)`打印出来，这样用户才能看到结果。

    Args:
        code (str): 要执行的Python代码字符串

    Returns:
        str: 代码执行结果或错误信息
    """
    logger.info("执行Python代码")  # 记录开始执行的日志
    try:
        # 使用REPL环境执行传入的Python代码
        result = repl.run(code)
        logger.info("代码执行成功")  # 记录执行成功的日志
    except BaseException as e:
        # 捕获执行过程中的任何异常
        error_msg = f"执行失败。错误: {repr(e)}"
        logger.error(error_msg)  # 记录错误日志
        return error_msg  # 返回错误信息

    # 格式化执行结果，包含原始代码和标准输出
    result_str = f"成功执行:\n```python\n{code}\n```\n输出结果: {result}"
    return result_str  # 返回格式化后的结果
```


**核心组件和功能：**

- **工具定位**：

     - 这是一个让 AI 代理能够执行 Python 代码的工具
     - 主要用于数据分析、计算和处理
     - 集成到了 LangChain 工具链中

- **技术实现**：

     - 使用 `langchain_experimental.utilities.PythonREPL` 提供代码执行环境
     - 通过装饰器 `@tool` 将函数注册为 LangChain 可用工具
     - 使用自定义装饰器 `@log_io` 记录输入输出日志

- **工作流程**：

     - 接收 Python 代码字符串作为输入
     - 在隔离的 REPL 环境中执行代码
     - 捕获并处理执行过程中的异常
     - 返回格式化的执行结果或错误信息

- **错误处理**：

     - 使用 `try-except` 捕获所有可能的异常
     - 详细记录错误信息并返回给调用者
     - 使用日志系统记录执行状态

- **集成特点**：

     - 与仓库的日志系统集成
     - 与 LangChain 工具链集成
     - 支持类型注解和文档字符串

**在整个仓库中的作用**

这个工具允许 AI 代理执行动态 Python 代码，使其具备以下能力：

- 处理和分析从浏览器或其他来源获取的数据
- 执行复杂计算
- 动态生成和操作数据结构
- 调用其他 Python 库和 API

这使得整个代理系统具有更强的灵活性和扩展性，可以处理各种复杂任务，而不仅限于预定义的操作。


**REPL 环境介绍**

REPL 代表"Read-Eval-Print Loop"（读取-求值-打印 循环），是一种交互式编程环境：

- **Read（读取）**：读取用户输入的代码
- **Eval（求值）**：执行/解释代码
- **Print（打印）**：显示执行结果
- **Loop（循环）**：回到第一步，形成循环

在这个项目中，REPL 环境通过 `langchain_experimental.utilities.PythonREPL` 类实现，为 AI 代理提供了在运行时执行动态 Python 代码的能力。

### bash_tool

该部分代码实现了一个bash命令执行工具：

```python:src/tools/bash_tool.py
import logging
import subprocess
from typing import Annotated
from langchain_core.tools import tool
from .decorators import log_io

# 初始化日志记录器
logger = logging.getLogger(__name__)


@tool
@log_io
def bash_tool(
    cmd: Annotated[str, "The bash command to be executed."],
):
    """
    用于执行 bash 命令并完成必要操作的工具函数。

    本工具可以在 LangChain 框架中被用作一个可调用的"工具"，允许语言模型执行
    系统级别的 bash 命令，并获取执行结果。

    参数:
        cmd: 要执行的 bash 命令字符串

    返回:
        命令执行的标准输出结果或错误信息
    """
    logger.info(f"执行 Bash 命令: {cmd}")
    try:
        # 执行命令并捕获输出
        # shell=True: 允许执行 shell 命令
        # check=True: 如果命令返回非零退出状态，则抛出 CalledProcessError 异常
        # text=True: 将输出作为字符串而非字节流返回
        # capture_output=True: 捕获标准输出和标准错误
        result = subprocess.run(
            cmd, shell=True, check=True, text=True, capture_output=True
        )
        # 返回标准输出作为结果
        return result.stdout
    except subprocess.CalledProcessError as e:
        # 如果命令执行失败，返回错误信息
        # returncode: 命令的退出状态码
        # stdout: 命令的标准输出
        # stderr: 命令的标准错误
        error_message = f"命令执行失败，退出码 {e.returncode}。\n标准输出: {e.stdout}\n标准错误: {e.stderr}"
        logger.error(error_message)
        return error_message
    except Exception as e:
        # 捕获任何其他异常
        error_message = f"执行命令时发生错误: {str(e)}"
        logger.error(error_message)
        return error_message


if __name__ == "__main__":
    # 当脚本直接运行时，执行示例命令
    print(bash_tool.invoke("ls -all"))
```




## 10. python Web框架 FastAPI

FastAPI 是一个现代化、高性能、易于学习的 Python Web 框架，专为构建 API 而设计。其 FastAPI 的主要特点：

1. **高性能**：基于 Starlette 和 Pydantic 构建，它是目前可用的最快的 Python 框架之一，仅次于其内部使用的 Starlette 和 Uvicorn。

2. **易于学习和使用**：采用直观的语法，利用标准的 Python 类型注解来定义 API，无需学习新的语法或特定库的方法。

3. **自动文档生成**：内置支持 Swagger UI 和 ReDoc，自动生成交互式 API 文档，大大减少了文档维护的工作量。

4. **数据验证**：集成 Pydantic 进行数据验证和序列化，能够自动验证请求数据，并将其转换为 Python 对象。

5. **异步支持**：全面支持异步编程，适合构建高并发应用。

**基本使用示例如下**：

```python
from fastapi import FastAPI
from pydantic import BaseModel

# 创建应用实例
app = FastAPI()

# 定义数据模型
class Item(BaseModel):
    name: str
    price: float
    is_offer: bool = None

# 定义路由和处理函数
@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_item(item_id: int, q: str = None):
    return {"item_id": item_id, "q": q}
```

其中在 LangManus 项目中使用 FastAPI 来构建了一个支持流式响应的聊天 API。这里利用了 FastAPI 的异步能力和事件流功能，**实现了 Server-Sent Events (SSE) 机制，这是实时 AI 聊天应用的常见架构模式**。

## 11. 流式聊天 API 接口

项目中实现了方便流式聊天的 API 接口，具体注释代码如下：

```python
"""
FastAPI application for LangManus.
LangManus 的 FastAPI 应用程序。
"""

import json
import logging
from typing import Dict, List, Any, Optional, Union

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse
import asyncio
from typing import AsyncGenerator, Dict, List, Any

from src.graph import build_graph
from src.config import TEAM_MEMBERS
from src.service.workflow_service import run_agent_workflow

# 配置日志
logger = logging.getLogger(__name__)

# 创建 FastAPI 应用实例
app = FastAPI(
    title="LangManus API",
    description="API for LangManus LangGraph-based agent workflow",
    version="0.1.0",
)

# 添加 CORS 中间件，允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源的请求
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有 HTTP 方法
    allow_headers=["*"],  # 允许所有 HTTP 头
)

# 创建 LangGraph 工作流图
graph = build_graph()


class ContentItem(BaseModel):
    """
    内容项模型，用于表示不同类型的消息内容（文本、图像等）
    """
    type: str = Field(..., description="The type of content (text, image, etc.)")
    text: Optional[str] = Field(None, description="The text content if type is 'text'")
    image_url: Optional[str] = Field(
        None, description="The image URL if type is 'image'"
    )


class ChatMessage(BaseModel):
    """
    聊天消息模型，表示单条对话消息
    """
    role: str = Field(
        ..., description="The role of the message sender (user or assistant)"
    )
    content: Union[str, List[ContentItem]] = Field(
        ...,
        description="The content of the message, either a string or a list of content items",
    )


class ChatRequest(BaseModel):
    """
    聊天请求模型，包含完整的对话历史和配置选项
    """
    messages: List[ChatMessage] = Field(..., description="The conversation history")
    debug: Optional[bool] = Field(False, description="Whether to enable debug logging")
    deep_thinking_mode: Optional[bool] = Field(
        False, description="Whether to enable deep thinking mode"
    )
    search_before_planning: Optional[bool] = Field(
        False, description="Whether to search before planning"
    )


@app.post("/api/chat/stream")
async def chat_endpoint(request: ChatRequest, req: Request):
    """
    聊天流式响应端点，通过 LangGraph 调用代理工作流

    Args:
        request: 聊天请求对象，包含消息历史和配置选项
        req: FastAPI 请求对象，用于检查连接状态

    Returns:
        使用 Server-Sent Events 的流式响应
    """
    try:
        # 将 Pydantic 模型转换为字典并规范化内容格式
        messages = []
        for msg in request.messages:
            message_dict = {"role": msg.role}

            # 处理两种不同格式的内容：字符串或内容项列表
            if isinstance(msg.content, str):
                message_dict["content"] = msg.content
            else:
                # 对于列表类型的内容，转换为工作流期望的格式
                content_items = []
                for item in msg.content:
                    if item.type == "text" and item.text:
                        content_items.append({"type": "text", "text": item.text})
                    elif item.type == "image" and item.image_url:
                        content_items.append(
                            {"type": "image", "image_url": item.image_url}
                        )

                message_dict["content"] = content_items

            messages.append(message_dict)

        async def event_generator():
            """
            事件生成器，用于创建 SSE 流
            从代理工作流中异步获取事件并转发给客户端
            """
            try:
                async for event in run_agent_workflow(
                    messages,
                    request.debug,
                    request.deep_thinking_mode,
                    request.search_before_planning,
                ):
                    # 检查客户端是否仍然连接
                    if await req.is_disconnected():
                        logger.info("Client disconnected, stopping workflow")
                        break
                    yield {
                        "event": event["event"],  # 事件类型
                        "data": json.dumps(event["data"], ensure_ascii=False),  # 事件数据，确保正确处理中文
                    }
            except asyncio.CancelledError:
                logger.info("Stream processing cancelled")
                raise

        # 返回 SSE 响应
        return EventSourceResponse(
            event_generator(),
            media_type="text/event-stream",
            sep="\n",
        )
    except Exception as e:
        # 捕获并记录所有异常，返回 500 错误响应
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
```


### SSE (Server-Sent Events)

在项目中所使用的 `EventSourceResponse` 是 FastAPI 生态系统中实现 SSE (Server-Sent Events) 机制的组件。**SSE 是一种服务器向客户端推送数据的 Web 技术**，需要与 WebSocket 进行区分，有较大的不同。

**虽然 SSE 和 WebSocket 都是实时通信技术**，但有关键区别：

**SSE (Server-Sent Events)**

1. **单向通信**：服务器向客户端推送数据，客户端不能通过同一连接向服务器发送数据
2. **基于 HTTP**：使用标准 HTTP 协议，无需特殊协议升级
3. **自动重连**：客户端自动处理连接断开和重新连接
4. **简单实现**：相比 WebSocket 更加轻量级和简单
5. **仅文本传输**：主要用于发送文本数据，通常是 JSON 格式
6. **HTTP 特性**：可以利用现有的 HTTP 功能（如头部压缩、缓存等）

**WebSocket**

1. **双向通信**：客户端和服务器可以随时互相发送数据
2. **协议升级**：从 HTTP 协议升级到 WebSocket 协议
3. **持久连接**：一旦建立连接，保持开放直到一方关闭
4. **二进制支持**：可以发送文本和二进制数据
5. **较复杂**：实现和管理相对复杂
6. **实时性**：更低的延迟，适合需要即时响应的应用

**SSE 的工作原理如下**：

1. **连接建立**：客户端通过 JavaScript 的 `EventSource` API 向服务器发起标准 HTTP 请求
2. **保持连接**：服务器不关闭连接，而是保持打开状态
3. **数据推送**：服务器持续向客户端发送事件数据，格式为：
   ```
   event: eventname
   data: {"key": "value"}

   ```
4. **客户端接收**：客户端通过事件监听器接收和处理这些事件

具体在上述 API 中 SSE 被用于流式传输 AI 代理工作流的输出：

1. **事件生成**：`event_generator()` 函数异步生成事件数据
2. **事件格式化**：每个事件都有 `event` 类型和 `data` 负载
3. **流式响应**：`EventSourceResponse` 将生成器产生的事件转换为符合 SSE 规范的响应流
4. **断开检测**：检查客户端是否断开连接，以停止不必要的处理

**SSE 适用场景**：

1. **实时流式 AI 响应**：逐步向用户呈现 AI 生成的文本，而不是等待完整响应
2. **通知系统**：向用户推送实时通知或警报
3. **实时数据更新**：股票价格、新闻更新、社交媒体 feed 等
4. **日志流**：将服务器日志实时推送到管理界面
5. **进度更新**：显示长时间运行任务的进度

### 异步处理


项目中也使用到了 FastAPI 中常用的异步处理模式，这也是 Python 3.5+ 引入的 `async/await` 语法的应用。其中异步函数、异步迭代器和异步等待的说明如下：

**异步函数定义 `async def`**

```python
async def event_generator():
```

`async def` 用于定义一个**协程函数**：

1. **协程(Coroutine)**：是一种可以在执行过程中暂停并稍后恢复的函数。
2. **非阻塞执行**：当一个异步函数在等待 I/O 操作（如网络请求）时，Python 可以切换去执行其他任务，而不是让整个线程处于等待状态。
3. **返回协程对象**：调用异步函数不会立即执行其内容，而是返回一个协程对象，需要通过事件循环运行。

**异步迭代 `async for`**

```python
async for event in run_agent_workflow(...):
```

`async for` 用于从**异步迭代器**中获取数据：

1. **异步迭代器**：是支持异步迭代的对象，它的 `__anext__` 方法返回一个协程。
2. **非阻塞式迭代**：允许在每次迭代之间让出控制权，使事件循环可以处理其他任务。
3. **适用场景**：特别适合处理流式数据，如你的代码中的 Agent 工作流生成的事件流。

**异步等待 `await`**

```python
if await req.is_disconnected():
```

`await` 用于等待协程执行完毕并获取其结果：

1. **暂停执行**：当执行到 `await` 时，当前协程会暂停执行，控制权返回给事件循环。
2. **等待完成**：事件循环会运行其他任务，直到被等待的协程完成。
3. **获取结果**：协程完成后，`await` 表达式的值就是协程的返回值。


### workflow 事件处理和传递

在 API 中用户输入信息以及后续整体的 workflow 也是整体使用异步处理的方式来执行，其中也涉及到了对图引擎的执行过程，具体代码如下：


```python
import logging

from src.config import TEAM_MEMBERS
from src.graph import build_graph
from langchain_community.adapters.openai import convert_message_to_dict
import uuid

# 配置日志
logging.basicConfig(
    level=logging.INFO,  # 默认日志级别为INFO
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)


def enable_debug_logging():
    """启用调试级别的日志记录，以获取更详细的执行信息。"""
    logging.getLogger("src").setLevel(logging.DEBUG)


logger = logging.getLogger(__name__)

# 创建工作流图
graph = build_graph()

# 协调器消息的缓存
coordinator_cache = []
MAX_CACHE_SIZE = 2  # 缓存的最大大小


async def run_agent_workflow(
    user_input_messages: list,
    debug: bool = False,
    deep_thinking_mode: bool = False,
    search_before_planning: bool = False,
):
    """运行代理工作流处理用户输入。

    这是工作流服务的主要入口点，它协调多个代理的工作流程，处理用户请求并生成响应。
    整个过程采用事件流的方式，通过异步迭代器返回各个阶段的事件。

    Args:
        user_input_messages: 用户请求消息列表
        debug: 如果为True，则启用调试级别的日志记录
        deep_thinking_mode: 如果为True，启用深度思考模式
        search_before_planning: 如果为True，在规划前执行搜索

    Returns:
        工作流完成后的最终状态

    Yields:
        工作流执行过程中的各种事件
    """
    if not user_input_messages:
        raise ValueError("Input could not be empty")

    if debug:
        enable_debug_logging()

    logger.info(f"Starting workflow with user input: {user_input_messages}")

    # 生成唯一的工作流ID
    workflow_id = str(uuid.uuid4())

    # 需要流式处理的LLM代理列表
    streaming_llm_agents = [*TEAM_MEMBERS, "planner", "coordinator"]

    # 在每个工作流开始时重置协调器缓存
    global coordinator_cache
    coordinator_cache = []
    global is_handoff_case
    is_handoff_case = False

    # 从图中异步流式获取事件
    # TODO: extract message content from object, specifically for on_chat_model_stream
    async for event in graph.astream_events(
        {
            # 常量
            "TEAM_MEMBERS": TEAM_MEMBERS,
            # 运行时变量
            "messages": user_input_messages,
            "deep_thinking_mode": deep_thinking_mode,
            "search_before_planning": search_before_planning,
        },
        version="v2",
    ):
        # 解析事件数据
        kind = event.get("event")  # 事件类型
        data = event.get("data")   # 事件数据
        name = event.get("name")   # 事件名称
        metadata = event.get("metadata")  # 元数据

        # 获取节点名称（代理名称）
        node = (
            ""
            if (metadata.get("checkpoint_ns") is None)
            else metadata.get("checkpoint_ns").split(":")[0]
        )

        # 获取LangGraph步骤信息
        langgraph_step = (
            ""
            if (metadata.get("langgraph_step") is None)
            else str(metadata["langgraph_step"])
        )

        # 获取运行ID
        run_id = "" if (event.get("run_id") is None) else str(event["run_id"])

        # 处理代理启动事件
        if kind == "on_chain_start" and name in streaming_llm_agents:
            if name == "planner":
                # 当规划器启动时，标志着整个工作流的开始
                yield {
                    "event": "start_of_workflow",
                    "data": {"workflow_id": workflow_id, "input": user_input_messages},
                }
            ydata = {
                "event": "start_of_agent",
                "data": {
                    "agent_name": name,
                    "agent_id": f"{workflow_id}_{name}_{langgraph_step}",
                },
            }
        # 处理代理结束事件
        elif kind == "on_chain_end" and name in streaming_llm_agents:
            ydata = {
                "event": "end_of_agent",
                "data": {
                    "agent_name": name,
                    "agent_id": f"{workflow_id}_{name}_{langgraph_step}",
                },
            }
        # 处理LLM开始生成事件
        elif kind == "on_chat_model_start" and node in streaming_llm_agents:
            ydata = {
                "event": "start_of_llm",
                "data": {"agent_name": node},
            }
        # 处理LLM结束生成事件
        elif kind == "on_chat_model_end" and node in streaming_llm_agents:
            ydata = {
                "event": "end_of_llm",
                "data": {"agent_name": node},
            }
        # 处理LLM流式输出事件 - 这是最关键的部分，处理模型生成的内容
        elif kind == "on_chat_model_stream" and node in streaming_llm_agents:
            content = data["chunk"].content
            if content is None or content == "":
                # 处理空内容消息
                if not data["chunk"].additional_kwargs.get("reasoning_content"):
                    # 跳过完全为空的消息
                    continue
                # 处理推理内容
                ydata = {
                    "event": "message",
                    "data": {
                        "message_id": data["chunk"].id,
                        "delta": {
                            "reasoning_content": (
                                data["chunk"].additional_kwargs["reasoning_content"]
                            )
                        },
                    },
                }
            else:
                # 检查消息是否来自协调器(coordinator)
                if node == "coordinator":
                    # 协调器消息需要特殊处理 - 使用缓存来决定是否传递
                    if len(coordinator_cache) < MAX_CACHE_SIZE:
                        coordinator_cache.append(content)
                        cached_content = "".join(coordinator_cache)
                        if cached_content.startswith("handoff"):
                            # 如果是切换处理的情况，标记并跳过
                            is_handoff_case = True
                            continue
                        if len(coordinator_cache) < MAX_CACHE_SIZE:
                            # 缓存尚未满，继续收集内容
                            continue
                        # 发送缓存的消息
                        ydata = {
                            "event": "message",
                            "data": {
                                "message_id": data["chunk"].id,
                                "delta": {"content": cached_content},
                            },
                        }
                    elif not is_handoff_case:
                        # 非切换处理情况，直接发送消息
                        ydata = {
                            "event": "message",
                            "data": {
                                "message_id": data["chunk"].id,
                                "delta": {"content": content},
                            },
                        }
                else:
                    # 其他代理的消息直接发送
                    ydata = {
                        "event": "message",
                        "data": {
                            "message_id": data["chunk"].id,
                            "delta": {"content": content},
                        },
                    }
        # 处理工具调用开始事件
        elif kind == "on_tool_start" and node in TEAM_MEMBERS:
            ydata = {
                "event": "tool_call",
                "data": {
                    "tool_call_id": f"{workflow_id}_{node}_{name}_{run_id}",
                    "tool_name": name,
                    "tool_input": data.get("input"),
                },
            }
        # 处理工具调用结束事件
        elif kind == "on_tool_end" and node in TEAM_MEMBERS:
            ydata = {
                "event": "tool_call_result",
                "data": {
                    "tool_call_id": f"{workflow_id}_{node}_{name}_{run_id}",
                    "tool_name": name,
                    "tool_result": data["output"].content if data.get("output") else "",
                },
            }
        else:
            # 跳过其他类型的事件
            continue
        # 产生事件
        yield ydata

    # 处理最终的切换情况
    if is_handoff_case:
        yield {
            "event": "end_of_workflow",
            "data": {
                "workflow_id": workflow_id,
                "messages": [
                    convert_message_to_dict(msg)
                    for msg in data["output"].get("messages", [])
                ],
            },
        }

```


其中需要注意的是 `yield` 作为异步生成器的输出机制，它让函数能够在长时间运行的工作流中实时返回中间结果。图的执行是在调用 `graph.astream_events()` 时就已经开始的，而不是由 `yield` 触发的。这种设计使得系统能够实时响应，为用户提供流畅的交互体验。

 `run_agent_workflow` 函数中，`yield` 的具体作用是：

1. **事件发送**：将生成的事件数据发送给函数的调用者
2. **异步迭代**：使函数成为一个异步生成器（async generator），能够逐个产生多个值
3. **非阻塞返回**：允许在长时间运行的过程中立即返回中间结果

**执行流程的准确理解**，实际的执行流程是这样的：


1. **工作流启动前**：

      - 调用者（如API服务）调用 `run_agent_workflow` 函数并传入用户输入
      - 函数初始化工作流并准备参数

2. **图执行启动**：

    - 调用 `graph.astream_events()` 启动图的执行
    - 此时，图已经开始执行，而不是等待后续步骤

3. **事件处理和转发**：

      - 当图执行过程中产生事件（如 planner 代理启动）
      - 这些事件被 `async for event in ...` 循环捕获
      - 函数处理事件并通过 `yield` 转发给调用者

4. **具体到示例代码**：

    ```python
    if name == "planner":
        yield {
            "event": "start_of_workflow",
            "data": {"workflow_id": workflow_id, "input": user_input_messages},
        }
    ```

    这段代码的意思是：当检测到 planner 代理启动时，生成一个"工作流开始"的事件并返回给调用者。



