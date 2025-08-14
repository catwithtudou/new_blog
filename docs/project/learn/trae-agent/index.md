# trae-agent

> https://github.com/bytedance/trae-agent

## 代码逻辑注释

- 注释 repo 分支：[learn/add_code_details](https://github.com/catwithtudou/trae-agent/tree/learn/add_code_details)

## 🎯 主要功能和目标
- **核心定位**: 基于LLM的通用软件工程任务智能代理
- **研究友好**: 透明、模块化架构，便于研究者修改、扩展和分析
- **目标用户**: 学术界和开源社区，用于研究AI代理架构、进行消融研究、开发新的代理能力
- **应用场景**: 代码编辑、调试、测试生成、文档编写等软件工程任务

## 🛠️ 技术栈和关键依赖
- **编程语言**: Python 3.12+
- **核心框架**:
  - `click` - CLI界面框架
  - `pydantic` - 数据验证和配置管理
  - `rich` - 终端美化和交互
  - `asyncio` - 异步编程支持
- **LLM集成**:
  - OpenAI, Anthropic, Google Gemini, Azure, OpenRouter, Ollama, Doubao
  - 统一的LLM客户端抽象层
- **工具生态**:
  - `tree-sitter` - 代码解析
  - `mcp` (Model Context Protocol) - 扩展工具协议
  - `textual` - TUI界面
- **开发工具**: `pytest`, `pre-commit`, `ruff`, `uv`

## 🏗️ 整体设计与架构

![](https://img.zhengyua.cn/blog/202508141053766.png)

- **分层架构**:
  - **CLI层** (`cli.py`): 命令行接口和用户交互
  - **Agent层** (`agent/`): 核心智能代理逻辑
  - **工具层** (`tools/`): 可扩展的工具生态系统
  - **LLM层** (`llm_clients/`): 多提供商LLM集成
  - **配置层** (`config.py`): 统一配置管理
- **核心设计模式**:
  - **策略模式**: 不同LLM提供商的统一接口
  - **工厂模式**: Agent和工具的动态创建
  - **观察者模式**: Trajectory记录和LakeView总结

## 📁 目录组织结构
### 核心文件夹
- **`trae_agent/`** - 主要源码目录
  - **`agent/`** - Agent核心实现 (🔥 核心)
  - **`tools/`** - 工具生态系统 (🔥 核心)
  - **`utils/`** - 工具类和配置管理
    - **`llm_clients/`** - LLM提供商集成 (🔥 核心)
  - **`prompt/`** - Agent系统提示词
- **`tests/`** - 测试套件
- **`docs/`** - 文档
- **`evaluation/`** - 评估脚本 (SWE-bench)

### 关键文件
- **`cli.py`** - 入口点和CLI实现 (🔥 入口)
- **`pyproject.toml`** - 项目配置和依赖
- **`trae_config.yaml.example`** - 配置模板

## 🚀 入口点和工作流程
### 入口点
- **主入口**: `trae-cli` 命令 (定义在 `pyproject.toml`)
- **CLI实现**: `trae_agent/cli.py:main()`
- **核心命令**:
  - `trae-cli run "任务描述"` - 执行单次任务
  - `trae-cli interactive` - 交互模式
  - `trae-cli show-config` - 显示配置

### 完整工作流程时序
1. **初始化阶段**:
   - 解析CLI参数和配置文件
   - 创建LLM客户端和Agent实例
   - 初始化工具注册表和MCP服务
2. **执行阶段**:
   - Agent接收任务描述
   - 生成系统提示词
   - 循环执行: LLM推理 → 工具调用 → 结果反馈
   - Trajectory记录每个步骤
3. **总结阶段**:
   - LakeView生成步骤摘要
   - 保存执行轨迹
   - 返回最终结果

## ✨ 关键技术亮点
- **🌊 LakeView机制**: 使用独立LLM对agent步骤进行简洁总结，提供清晰的执行概览
- **📊 Trajectory记录**: 详细记录所有LLM交互、工具调用和执行元数据，便于调试和分析
- **🔧 模块化工具系统**: 可插拔的工具架构，支持bash、文件编辑、结构化思考等
- **🤖 多LLM统一接口**: 抽象化不同提供商的API差异，支持无缝切换
- **⚙️ 灵活配置系统**: YAML/JSON双格式支持，CLI参数覆盖，环境变量集成
- **🔌 MCP协议支持**: 支持Model Context Protocol，可扩展第三方工具
- **🎯 异步架构**: 全面的async/await支持，提高并发性能
