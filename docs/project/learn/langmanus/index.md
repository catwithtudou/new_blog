# langmanus

> https://github.com/catwithtudou/langmanus

A community-driven AI automation framework that builds upon the incredible work of the open source community. Our goal is to combine language models with specialized tools for tasks like web search, crawling, and Python code execution, while giving back to the community that made this possible.

> 注释 repo 分支：[learn/code_detail](https://github.com/catwithtudou/langmanus/tree/learn/code_detail)


### 1. 整体架构

LangManus 是一个基于多智能体（Multi-Agent）系统的 AI 自动化框架，采用了分层架构设计：

1. **核心工作流引擎**：基于 LangGraph 构建的智能体协作图
2. **多种智能体**：每个智能体负责特定领域的任务（研究、编码、浏览网页等）
3. **工具集成**：集成了各种工具如网络搜索、Python 代码执行、命令行等
4. **LLM 后端**：支持多层次 LLM 调用（基础、推理、视觉语言模型）

### 2. 代码组织结构

项目代码组织清晰，主要包含以下部分：

- `src/graph/`: 定义智能体协作的工作流图
- `src/agents/`: 实现各种专业智能体
- `src/tools/`: 提供各种工具（搜索、代码执行、网页爬取等）
- `src/config/`: 配置文件，包括模型选择、API 密钥等
- `src/prompts/`: 智能体提示模板
- `src/service/`: 服务相关代码
- `src/crawler/`: 网页爬取相关功能
- `src/api/`: API 接口实现

### 3. 工作流程

1. **入口点**：`main.py` 接收用户输入并启动工作流
2. **工作流构建**：`src/workflow.py` 调用 `build_graph()` 构建智能体图
3. **智能体协作**：

      - **协调员（Coordinator）**：处理用户输入并根据需要转交给规划员
      - **规划员（Planner）**：制定详细执行计划
      - **主管（Supervisor）**：决定下一步应该由哪个智能体执行
      - **专家智能体**：研究员、程序员、浏览器等执行具体任务
      - **汇报员（Reporter）**：生成最终报告

### 4. 关键技术点

1. **多 LLM 系统**：

      - `reasoning` 模型：用于复杂推理任务
      - `basic` 模型：用于简单任务
      - `vision` 模型：用于视觉相关任务

2. **工具集成**：

      - `tavily_tool`：网络搜索
      - `python_repl_tool`：Python 代码执行
      - `browser_tool`：网页浏览和信息提取
      - `bash_tool`：执行 shell 命令
      - `crawl_tool`：网页爬取

3. **ReAct 代理模式**：

      - 使用 `create_react_agent` 创建能够推理和执行动作的智能体

### 5. 配置系统

- `.env` 文件：设置各种 API 密钥和模型选择
- 配置模块：在 `src/config/` 目录下定义各种配置参数
