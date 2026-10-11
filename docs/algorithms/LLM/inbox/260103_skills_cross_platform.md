# 跨平台 Skills 实践指南：在任何 AI 工具中使用专业技能

## 引言

Anthropic 的 Agent Skills 提供了一套优雅的专业技能管理方案，但最初它是 Claude 专属特性。随着社区的发展，现在有多种方案让其他 AI 编程工具（Cursor、Windsurf、Aider 等）也能使用 Skills，甚至在 LangChain、LlamaIndex 等框架中实现类似的 Skills 模式。

本文将介绍三种跨平台 Skills 实践方案，从**开箱即用**到**深度定制**，以及在实战中创建和迭代 Skills 的最佳工作流。

> **前置阅读**：建议先阅读 [Anthropic Agent Skills 完整指南](./260103_anthropic_skills_guide.md) 了解 Skills 的核心概念和技术架构。

<!-- more -->

## 方案概览：三种方式使用 Skills

| 方案 | 复杂度 | 功能完整度 | 适用场景 |
|------|--------|-----------|---------|
| **OpenSkills** | ⭐ 简单 | ⭐⭐ 基础 | 使用 Cursor/Windsurf/Aider 等 AI 编程工具 |
| **LangChain/LangGraph** | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ 高级 | 需要深度定制的应用开发 |
| **LlamaIndex** | ⭐⭐⭐ 中等 | ⭐⭐⭐⭐ 高级 | 数据密集型、RAG 场景 |

## 方案一：OpenSkills（推荐 - 开箱即用）

**[OpenSkills](https://github.com/numman-ali/openskills)** 是一个由社区开发的通用 Skills 加载器，可以将 Anthropic 的 Skills 系统带给所有 AI 编程工具。

> **官方介绍**："Universal skills loader for AI coding agents - Brings Anthropic's skills system to Claude Code, Cursor, Windsurf, Aider and more."

### 核心特性

- ✅ **跨平台支持**：适配 Claude Code、Cursor、Windsurf、Aider 等主流 AI 编程工具
- ✅ **零配置使用**：通过 `AGENTS.md` 格式自动同步 Skills 元数据
- ✅ **兼容官方 Skills**：可以直接使用 Anthropic 官方 Skills 仓库
- ✅ **多源管理**：支持本地路径、Git 仓库、符号链接等多种 Skills 来源
- ✅ **CI/CD 友好**：支持 headless 模式，可集成到自动化流程

### 快速开始

**1. 安装 OpenSkills**

```bash
# 全局安装 OpenSkills
npm install -g openskills

# 验证安装
openskills --version
```

**2. 初始化项目**

```bash
# 在项目目录中初始化
cd your-project
openskills init

# 这会创建：
# - .openskills/ 目录（存储 Skills）
# - AGENTS.md 文件（Skills 元数据）
```

**3. 安装 Skills**

```bash
# 从 Anthropic 官方仓库安装预构建 Skills
openskills install anthropic-agent-skills/document-skills

# 从本地路径安装自定义 Skill
openskills install ./my-custom-skill

# 从私有 Git 仓库安装
openskills install git@github.com:yourorg/private-skills.git

# 使用符号链接（便于开发调试）
openskills install --symlink ../my-skill-in-development
```

**4. 同步 Skills 到 AGENTS.md**

```bash
# 同步所有已安装的 Skills
openskills sync

# 自定义输出文件
openskills sync --output .claude/instructions.md

# headless 模式（适合 CI/CD）
openskills sync --yes
```

### AGENTS.md 格式示例

OpenSkills 会生成类似 Claude Code 的格式：

```markdown
# Available Skills

<available_skills>
<skill>
<name>document-skills:pdf</name>
<description>
Comprehensive PDF manipulation toolkit for extracting text and tables,
creating new PDFs, merging/splitting documents, and handling forms.
</description>
<location>plugin</location>
</skill>

<skill>
<name>my-custom-skill</name>
<description>
Custom skill for analyzing financial data and generating reports.
</description>
<location>local</location>
</skill>
</available_skills>

## How to Use Skills

When you need to use a skill, invoke it with:
```
openskills read <skill-name>
```

For example:
```
openskills read document-skills:pdf
```
```

### 在不同 AI 工具中使用

**Cursor / Windsurf / 其他支持自定义指令的工具**：

1. 将 `AGENTS.md` 作为项目级指令文件
2. 工具会自动读取并理解可用的 Skills
3. 当需要使用 Skill 时，AI 会建议执行 `openskills read <name>`

**Aider**：

```bash
# 在 Aider 中使用
aider --read AGENTS.md

# AI 会自动识别 Skills 并在需要时使用
```

**命令行使用**：

```bash
# 直接读取 Skill 内容
openskills read pdf

# 将 Skill 内容传递给其他工具
openskills read pdf | pbcopy  # 复制到剪贴板
```

### 工作流示例

```bash
# 1. 初始化项目并安装 Skills
cd my-ai-project
openskills init
openskills install anthropic-agent-skills/document-skills
openskills install anthropic-agent-skills/frontend-design
openskills sync

# 2. 在 Cursor 中打开项目
# Cursor 会自动读取 AGENTS.md

# 3. 与 AI 对话
# User: "帮我创建一个关于可再生能源的演示文稿"
# AI: 我看到有 document-skills:pptx 技能可用，让我读取它...
# AI 执行: openskills read document-skills:pptx
# AI: 根据 Skill 指令创建演示文稿

# 4. 开发自定义 Skill
mkdir my-skill
cd my-skill
cat > SKILL.md << 'EOF'
---
name: data-analyzer
description: Analyze CSV data and generate insights
---
# Data Analyzer Skill
...
EOF

# 5. 使用符号链接安装（便于开发）
cd ..
openskills install --symlink ./my-skill
openskills sync
```

### 版本管理和协作

```bash
# 锁定 Skills 版本（类似 package-lock.json）
openskills lock

# 这会生成 openskills-lock.json
# 团队成员可以用相同的版本

# 在其他机器上恢复完全相同的 Skills
openskills install --frozen-lockfile
```

### 优势和局限

**优势**：
- ✅ **最简单**：无需编写任何代码，npm 安装即用
- ✅ **兼容性好**：直接使用 Anthropic 官方 Skills
- ✅ **工具无关**：适配几乎所有 AI 编程工具
- ✅ **开发友好**：支持符号链接，方便本地开发
- ✅ **团队协作**：通过 Git 管理 AGENTS.md 和 lock 文件

**局限**：
- ⚠️ **功能有限**：不支持 Progressive Disclosure 的动态加载
- ⚠️ **依赖工具**：需要 AI 工具主动读取 `openskills read` 命令
- ⚠️ **元数据而非执行**：只是提供指令，不包含 Claude 的代码执行环境

**适合场景**：
- 🎯 使用 Cursor、Windsurf 等 AI 编程工具
- 🎯 想要快速使用 Anthropic 官方 Skills
- 🎯 团队协作，需要统一的 Skills 管理
- 🎯 不需要复杂的动态加载逻辑

> **参考资料**：
> - [OpenSkills GitHub](https://github.com/numman-ali/openskills) - 官方仓库
> - [OpenSkills: Enabling AI Agents to Share Skill Libraries](https://ai-engineering-trend.medium.com/openskills-enabling-ai-agents-to-share-skill-libraries-b5c8734ac5d5) - 深度介绍
> - [Anthropic Skills Repository](https://github.com/anthropics/skills) - 官方 Skills 来源

## 方案二：自定义实现（深度定制）

如果你需要更深度的控制和定制，可以在主流 LLM 框架中自己实现 Skills 模式。

### 技术可行性

根据 2025 年的 AI Agent 框架发展，主流框架均支持实现类似 Skills 的功能：

| 框架 | 是否支持 Skills 模式 | 实现方式 | 多模型支持 |
|------|-------------------|---------|----------|
| **LangChain/LangGraph** | ✅ 可实现 | 自定义 Agent + 动态 Prompt 注入 | OpenAI, Anthropic, Hugging Face 等 |
| **LlamaIndex** | ✅ 可实现 | RAG + Agent 组合 | OpenAI, Anthropic, PaLM, 本地模型等 |
| **AutoGen** | ✅ 可实现 | Conversable Agents + Function Calling | 所有支持 Function Calling 的模型 |
| **Semantic Kernel** | ✅ 可实现 | Plugins + Planner | Azure OpenAI, OpenAI, 本地模型等 |

> **参考资料**：
> - [The AI Agent Stack in 2025](https://medium.com/@lssmj2014/the-ai-agent-stack-in-2025-understanding-mcp-langchain-and-llamaindex-408c82041168)
> - [LangChain vs LangGraph vs LlamaIndex (2025)](https://xenoss.io/blog/langchain-langgraph-llamaindex-llm-frameworks)

### 实现方案：LangChain/LangGraph

LangChain 是最适合实现 Skills 模式的框架，因为它天然支持动态工具加载和状态管理。

#### 核心实现思路

```python
from langchain.agents import Agent, AgentExecutor
from langchain.prompts import ChatPromptTemplate
from langchain.chat_models import init_chat_model
import os
import json

class SkillBasedAgent:
    """
    实现类似 Claude Skills 的 Progressive Disclosure 机制
    """

    def __init__(self, skills_directory: str, model_name: str = "openai:gpt-4o"):
        """
        初始化 Skills Agent

        Args:
            skills_directory: Skills 目录路径
            model_name: LLM 模型（支持 "openai:gpt-4o", "anthropic:claude-3-5-sonnet" 等）
        """
        self.skills_dir = skills_directory
        self.llm = init_chat_model(model_name)

        # Level 1: 加载所有 Skills 的元数据
        self.skills_metadata = self._load_skills_metadata()

        # Level 2 & 3: 按需加载的完整 Skills
        self.loaded_skills = {}

    def _load_skills_metadata(self) -> list:
        """
        Level 1: 只加载元数据（name + description）
        每个 Skill 约 100 tokens
        """
        metadata = []

        for skill_dir in os.listdir(self.skills_dir):
            skill_path = os.path.join(self.skills_dir, skill_dir)
            skill_file = os.path.join(skill_path, "SKILL.md")

            if os.path.exists(skill_file):
                with open(skill_file, 'r') as f:
                    content = f.read()
                    # 解析 YAML frontmatter
                    import yaml
                    if content.startswith('---'):
                        parts = content.split('---', 2)
                        frontmatter = yaml.safe_load(parts[1])

                        metadata.append({
                            'skill_id': skill_dir,
                            'name': frontmatter.get('name'),
                            'description': frontmatter.get('description'),
                            'path': skill_path
                        })

        return metadata

    def _match_skills(self, task: str) -> list:
        """
        基于任务描述匹配相关的 Skills
        这里使用语义相似度（可以使用向量数据库优化）
        """
        # 简化版本：使用 LLM 进行匹配
        metadata_text = "\n".join([
            f"- {s['name']}: {s['description']}"
            for s in self.skills_metadata
        ])

        prompt = f"""
Given the following task and available skills, identify which skills are relevant.

Task: {task}

Available Skills:
{metadata_text}

Respond with a JSON array of skill names, e.g., ["skill1", "skill2"]
"""

        response = self.llm.invoke(prompt)
        # 解析响应获取匹配的 skills
        # （实际实现需要更健壮的解析）
        return json.loads(response.content)

    def _load_skill_instructions(self, skill_id: str) -> str:
        """
        Level 2: 加载 Skill 的完整指令（SKILL.md 主体内容）
        """
        if skill_id in self.loaded_skills:
            return self.loaded_skills[skill_id]

        # 找到对应的 skill
        skill_meta = next(
            (s for s in self.skills_metadata if s['skill_id'] == skill_id),
            None
        )

        if not skill_meta:
            return ""

        skill_file = os.path.join(skill_meta['path'], "SKILL.md")
        with open(skill_file, 'r') as f:
            content = f.read()
            # 移除 frontmatter，只保留主体内容
            if content.startswith('---'):
                parts = content.split('---', 2)
                instructions = parts[2].strip()
            else:
                instructions = content

        # 缓存已加载的 Skill
        self.loaded_skills[skill_id] = instructions
        return instructions

    def execute(self, task: str) -> str:
        """
        执行任务，应用 Progressive Disclosure 模式
        """
        # 1. 匹配相关 Skills（基于 Level 1 元数据）
        matched_skills = self._match_skills(task)

        # 2. 动态加载匹配的 Skills 指令（Level 2）
        skill_instructions = []
        for skill_id in matched_skills:
            instructions = self._load_skill_instructions(skill_id)
            skill_instructions.append(f"\n## Skill: {skill_id}\n{instructions}")

        # 3. 构建增强的 Prompt
        enhanced_prompt = ChatPromptTemplate.from_messages([
            ("system", """You are a helpful assistant with access to specialized skills.

{skill_instructions}

Use the above skills when relevant to complete the user's task."""),
            ("human", "{task}")
        ])

        # 4. 执行任务
        chain = enhanced_prompt | self.llm
        response = chain.invoke({
            "skill_instructions": "\n".join(skill_instructions),
            "task": task
        })

        return response.content

# 使用示例
if __name__ == "__main__":
    # 初始化 Agent（可以使用任何支持的模型）
    agent = SkillBasedAgent(
        skills_directory="./skills",
        model_name="openai:gpt-4o"  # 或 "anthropic:claude-3-5-sonnet"
    )

    # 执行任务
    result = agent.execute("创建一个关于可再生能源的演示文稿")
    print(result)
```

#### 关键设计点

1. **三级加载机制**：
   - Level 1（元数据）：始终加载，成本低
   - Level 2（指令）：按需加载，动态注入
   - Level 3（资源）：通过文件系统访问

2. **模型无关性**：
   - 使用 `init_chat_model()` 支持多种 LLM
   - 可以切换 OpenAI、Anthropic、本地模型等

3. **技能匹配**：
   - 可以使用 LLM 进行语义匹配
   - 更高效的方案：使用向量数据库（如 ChromaDB）存储技能描述

### 实现方案：LlamaIndex

LlamaIndex 更适合处理复杂的数据检索和 RAG 场景：

```python
from llama_index.core import VectorStoreIndex, Document
from llama_index.core.agent import ReActAgent
from llama_index.core.tools import FunctionTool
from llama_index.llms.openai import OpenAI
from llama_index.llms.anthropic import Anthropic
import os

class LlamaIndexSkillAgent:
    """
    使用 LlamaIndex 实现 Skills 模式
    结合 RAG 检索和 Agent 执行
    """

    def __init__(self, skills_directory: str, llm_provider: str = "openai"):
        """
        初始化 Agent

        Args:
            skills_directory: Skills 目录
            llm_provider: "openai" 或 "anthropic"
        """
        self.skills_dir = skills_directory

        # 选择 LLM
        if llm_provider == "openai":
            self.llm = OpenAI(model="gpt-4")
        elif llm_provider == "anthropic":
            self.llm = Anthropic(model="claude-3-5-sonnet-20241022")
        else:
            raise ValueError(f"Unsupported provider: {llm_provider}")

        # 构建 Skills 索引（用于检索）
        self.skills_index = self._build_skills_index()

        # 创建 ReAct Agent
        self.agent = self._create_agent()

    def _build_skills_index(self) -> VectorStoreIndex:
        """
        将 Skills 元数据构建为向量索引，用于语义检索
        """
        documents = []

        for skill_dir in os.listdir(self.skills_dir):
            skill_path = os.path.join(self.skills_dir, skill_dir)
            skill_file = os.path.join(skill_path, "SKILL.md")

            if os.path.exists(skill_file):
                with open(skill_file, 'r') as f:
                    content = f.read()

                # 为每个 Skill 创建 Document
                doc = Document(
                    text=content,
                    metadata={
                        'skill_id': skill_dir,
                        'path': skill_path
                    }
                )
                documents.append(doc)

        # 构建向量索引
        return VectorStoreIndex.from_documents(documents, llm=self.llm)

    def _create_agent(self) -> ReActAgent:
        """
        创建 ReAct Agent，带有 Skills 检索能力
        """
        # 创建检索工具
        query_engine = self.skills_index.as_query_engine(
            similarity_top_k=2  # 检索最相关的 2 个 Skills
        )

        def retrieve_relevant_skills(task: str) -> str:
            """检索与任务相关的 Skills"""
            response = query_engine.query(task)
            return str(response)

        skill_tool = FunctionTool.from_defaults(
            fn=retrieve_relevant_skills,
            name="skill_retriever",
            description="Retrieve relevant skills for the current task"
        )

        # 创建 Agent
        return ReActAgent.from_tools(
            [skill_tool],
            llm=self.llm,
            verbose=True
        )

    def execute(self, task: str) -> str:
        """执行任务"""
        return self.agent.chat(task)

# 使用示例
agent = LlamaIndexSkillAgent(
    skills_directory="./skills",
    llm_provider="openai"  # 或 "anthropic"
)

response = agent.execute("帮我分析这个数据集并生成报告")
print(response)
```

### 向量检索优化

对于大量 Skills 的场景，使用向量数据库可以显著提升匹配效率：

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document

class VectorSkillMatcher:
    """
    使用向量数据库进行 Skill 匹配
    """

    def __init__(self, skills_metadata: list):
        """
        初始化向量存储

        Args:
            skills_metadata: Skills 元数据列表
        """
        # 创建 Documents
        documents = [
            Document(
                page_content=f"{s['name']}: {s['description']}",
                metadata=s
            )
            for s in skills_metadata
        ]

        # 构建向量存储
        self.vectorstore = Chroma.from_documents(
            documents,
            OpenAIEmbeddings(),
            collection_name="skills"
        )

    def match(self, task: str, top_k: int = 3) -> list:
        """
        基于语义相似度匹配 Skills

        Args:
            task: 用户任务描述
            top_k: 返回最相关的前 k 个 Skills

        Returns:
            匹配的 Skills 元数据列表
        """
        results = self.vectorstore.similarity_search(task, k=top_k)
        return [doc.metadata for doc in results]
```

### 与现有框架集成

**LangChain + LlamaIndex 混合方案**（推荐）：

```python
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.tools import Tool
from llama_index.core import VectorStoreIndex

# 1. 使用 LlamaIndex 构建 Skills 索引
skills_index = VectorStoreIndex.from_documents(skill_documents)
query_engine = skills_index.as_query_engine()

# 2. 将 LlamaIndex 查询引擎包装为 LangChain Tool
skill_tool = Tool(
    name="SkillRetriever",
    func=lambda q: str(query_engine.query(q)),
    description="Retrieve relevant skills for the current task"
)

# 3. 创建 LangChain Agent
agent = create_openai_functions_agent(llm, [skill_tool], prompt)
agent_executor = AgentExecutor(agent=agent, tools=[skill_tool])

# 4. 执行任务
response = agent_executor.invoke({"input": "创建财务报告"})
```

### 关键差异与限制

虽然可以在非 Claude 场景实现 Skills 模式，但需要注意以下差异：

| 特性 | Claude Skills | 非 Claude 实现 |
|------|--------------|--------------|
| **自动激活** | ✅ 原生支持，无需显式匹配 | ⚠️ 需要自己实现匹配逻辑 |
| **代码执行环境** | ✅ 隔离容器，安全可靠 | ⚠️ 需要自己管理（如 Docker） |
| **脚本执行优化** | ✅ 脚本代码不占用上下文 | ❌ 需要通过 Function Calling 实现 |
| **多技能组合** | ✅ 自动组合，无需预定义 | ⚠️ 需要手动编排工作流 |
| **版本管理** | ✅ 内置版本控制和回滚 | ❌ 需要自己实现（可用 Git） |

### 生产部署建议

1. **使用 Docker 隔离执行环境**：
   ```dockerfile
   FROM python:3.11-slim

   # 安装依赖
   COPY requirements.txt .
   RUN pip install -r requirements.txt

   # 复制 Skills
   COPY skills/ /app/skills/

   # 运行 Agent
   CMD ["python", "agent.py"]
   ```

2. **使用向量数据库加速检索**：
   - 推荐：ChromaDB（轻量）、Pinecone（云端）、Weaviate（自托管）

3. **监控和日志**：
   ```python
   import logging
   from langchain.callbacks import LangChainTracer

   # 启用追踪
   tracer = LangChainTracer(project_name="skills-agent")
   agent_executor.invoke(
       {"input": task},
       config={"callbacks": [tracer]}
   )
   ```

## 实战经验：创建自定义 Skills 的工作流

> **经验来源**：本章节基于社区实践者的真实使用经验，综合了：
> - 知乎文章中提到的 4 条核心实践经验（MVP 迭代、Git 管理、倒推法等）
> - Anthropic 官方 Skills 仓库中的 skill-creator 最佳实践
> - [Progressive Disclosure in Agent Skills](https://www.marthakelly.com/blog/progressive-disclosure-agent-skills) 中的工程实践
> - 社区开发者在实际项目中总结的踩坑经验
>
> 这些经验已在实际生产环境中验证，具有很强的实用价值。

基于社区实践者的真实经验，以下是创建和迭代 Skills 的最佳工作流。

### 1. 快速上手：让 AI 学会创建 Skills

**挑战**：第一次创建 Skill 时，可能不清楚规范和最佳实践。

**最佳实践**：
```bash
# 1. 克隆官方 Skills 仓库到本地
git clone https://github.com/anthropics/skills.git ~/anthropic-skills

# 2. 在 Claude Code 或其他 AI 工具中，让它先阅读官方仓库
# 这样它会通过官方的 skill-creator 这个 Skill 快速学会如何创建
```

在 Claude Code 中：
```
请阅读 ~/anthropic-skills 目录中的内容，
特别是 skill-creator 这个 Skill，
然后帮我创建一个 [你的需求] 的 Skill。
```

**为什么有效**：
- ✅ 官方仓库包含 `skill-creator` Skill，它本身就是教 Claude 如何创建 Skills 的元技能
- ✅ 通过阅读示例 Skills，AI 能理解最佳实践和常见模式
- ✅ 避免了阅读文档的学习曲线，直接从示例中学习

### 2. 核心准备：提前梳理工作流

**挑战**：AI 不知道你的业务逻辑和具体需求。

**最佳实践**：

在创建 Skill 之前，先梳理清楚你的工作流：

```markdown
## 工作流梳理模板

### 1. 目标
这个 Skill 要解决什么问题？
- 问题描述：
- 预期输出：
- 成功标准：

### 2. 步骤拆解
详细列出完成任务的每个步骤：
1. 步骤1：输入是什么？输出是什么？
2. 步骤2：依赖步骤1的什么信息？
3. ...

### 3. 边界情况
- 如果输入格式错误怎么办？
- 如果缺少必要信息怎么办？
- 需要处理哪些特殊情况？

### 4. 资源需求
- 需要哪些预置脚本？
- 需要哪些模板文件？
- 需要哪些参考文档？
```

**示例：创建"每周报告生成" Skill**

```markdown
## 每周报告生成 Skill 工作流

### 1. 目标
- 问题：手动整理每周工作报告耗时 1-2 小时
- 输出：符合公司模板的 Markdown 格式报告
- 成功标准：报告包含本周完成的任务、下周计划、遇到的问题

### 2. 步骤拆解
1. 读取本周的 Git 提交记录 → 提取任务列表
2. 读取项目管理工具的数据 → 获取任务状态
3. 按照公司模板格式化 → 生成 Markdown
4. 添加个人总结 → 人工审核点

### 3. 边界情况
- 如果本周没有提交：提示用户手动添加
- 如果任务状态不明确：标注为"待确认"
- 如果缺少某个章节：使用占位符

### 4. 资源需求
- 脚本：`parse_git_log.py` - 解析 Git 日志
- 模板：`weekly_report_template.md` - 公司报告模板
- 参考：`report_examples.md` - 历史报告示例
```

**为什么重要**：
- ❌ **无法偷懒**：工作流的细节只有你自己最清楚
- ✅ **AI 可辅助**：可以让 AI 帮你拓展思路或提前规避问题
- ✅ **迭代基础**：清晰的梳理是后续优化的基础

### 3. MVP 迭代：先跑起来，再优化

**挑战**：第一次可能无法设计出完美的 Skill。

**最佳实践**：采用 MVP（最小可行产品）方法

```bash
# 1. 创建最简版本的 Skill（只包含核心功能）
skill/
├── SKILL.md          # 只包含最基本的指令
└── (暂时不添加复杂脚本)

# 2. 测试并收集问题
# 在实际使用中发现哪里不符合预期

# 3. 使用 Git 进行版本管理
git init
git add .
git commit -m "feat: initial MVP version of [skill-name]"

# 4. 根据反馈迭代优化
git commit -m "fix: handle edge case when input is empty"
git commit -m "feat: add template support for custom formats"
git commit -m "refactor: extract common logic to helper script"
```

**MVP 迭代流程**：

```
梳理工作流 → 创建 MVP Skill → 实际使用测试
                                    ↓
                            是否符合预期?
                                    ↓
                            否 → 记录问题 → 针对性优化 ↑
                                    ↓
                            是 → 完成 v1.0 → 继续迭代新功能
```

**Git 管理的好处**：
- ✅ **版本回滚**：出问题时可以快速回到上一个可用版本
- ✅ **变更追踪**：清楚知道每次改了什么
- ✅ **分支实验**：可以在分支上尝试激进的改进
- ✅ **团队协作**：多人可以并行优化不同部分

**实战示例**：

```bash
# 创建项目目录
mkdir my-skill
cd my-skill
git init

# MVP v0.1 - 最基本功能
cat > SKILL.md << 'EOF'
---
name: weekly-report-generator
description: 生成符合公司格式的每周工作报告
---

# 每周报告生成器

当用户请求生成每周报告时：

1. 询问用户本周完成的主要任务
2. 询问下周计划
3. 按照以下格式生成报告：

## 本周完成
- [用户输入的任务]

## 下周计划
- [用户输入的计划]

## 遇到的问题
- [用户输入的问题]
EOF

git add .
git commit -m "feat: MVP v0.1 - basic manual input"

# 测试后发现：手动输入太麻烦，应该自动读取 Git 记录
# v0.2 - 添加自动化脚本
mkdir scripts
cat > scripts/parse_git_log.sh << 'EOF'
#!/bin/bash
# 读取本周的 Git 提交
git log --since="1 week ago" --pretty=format:"- %s" --author="$(git config user.name)"
EOF

chmod +x scripts/parse_git_log.sh
git add .
git commit -m "feat: v0.2 - auto-parse git commits"

# 继续迭代...
```

### 4. 复杂 Skills：倒推法（Bottom-Up）

**挑战**：对于复杂的 Skill，一次性生成容易出问题。

**最佳实践**：使用倒推法，从最底层的脚本开始，逐步构建

#### 倒推法步骤

```
最终目标：完整的 Skill
    ↑
第 4 步：用 skill-creator 整合为 SKILL.md
    ↑
第 3 步：编写调用脚本的主逻辑
    ↑
第 2 步：编写辅助函数和工具
    ↑
第 1 步：编写核心脚本并测试通过 ← 从这里开始
```

#### 实战案例：创建 PPT 生成 Skill

**第 1 步：先创建核心脚本**

```python
# scripts/create_ppt.py
from pptx import Presentation
from pptx.util import Inches, Pt

def create_presentation(title: str, slides: list) -> str:
    """
    创建 PowerPoint 文件

    Args:
        title: 演示文稿标题
        slides: 幻灯片列表，每个元素包含 {title, content, layout}

    Returns:
        生成的文件路径
    """
    prs = Presentation()

    # 添加标题页
    title_slide = prs.slides.add_slide(prs.slide_layouts[0])
    title_slide.shapes.title.text = title

    # 添加内容页
    for slide_data in slides:
        slide = prs.slides.add_slide(prs.slide_layouts[1])
        slide.shapes.title.text = slide_data['title']
        slide.shapes.placeholders[1].text = slide_data['content']

    # 保存文件
    output_path = f"/tmp/{title}.pptx"
    prs.save(output_path)
    return output_path

# 测试脚本
if __name__ == "__main__":
    test_slides = [
        {"title": "Introduction", "content": "Welcome to our presentation"},
        {"title": "Main Points", "content": "• Point 1\n• Point 2\n• Point 3"}
    ]

    file_path = create_presentation("Test Presentation", test_slides)
    print(f"Created: {file_path}")
```

**测试脚本**：
```bash
python scripts/create_ppt.py
# 确保脚本能正常生成 PPT
```

**第 2 步：添加辅助功能**

```python
# scripts/ppt_helper.py

def parse_outline(outline_text: str) -> list:
    """
    将大纲文本解析为幻灯片列表

    Args:
        outline_text: Markdown 格式的大纲

    Returns:
        幻灯片数据列表
    """
    slides = []
    current_slide = None

    for line in outline_text.split('\n'):
        if line.startswith('## '):
            if current_slide:
                slides.append(current_slide)
            current_slide = {
                'title': line[3:].strip(),
                'content': ''
            }
        elif line.startswith('- ') and current_slide:
            current_slide['content'] += line + '\n'

    if current_slide:
        slides.append(current_slide)

    return slides

# 测试
if __name__ == "__main__":
    test_outline = """
## Introduction
- Welcome message
- Overview

## Main Content
- Point 1
- Point 2
"""
    slides = parse_outline(test_outline)
    print(f"Parsed {len(slides)} slides")
    print(slides)
```

**第 3 步：编写主逻辑**

```python
# scripts/generate_ppt_from_topic.py

import sys
import json
from create_ppt import create_presentation
from ppt_helper import parse_outline

def main(topic: str, outline: str = None):
    """
    根据主题生成演示文稿
    """
    # 如果没有提供大纲，使用默认结构
    if not outline:
        outline = f"""
## {topic}
- Introduction to the topic
- Key points
- Conclusion
"""

    # 解析大纲
    slides = parse_outline(outline)

    # 创建 PPT
    file_path = create_presentation(topic, slides)

    # 返回结果（JSON 格式，方便 Claude 解析）
    result = {
        "success": True,
        "file_path": file_path,
        "slides_count": len(slides)
    }

    print(json.dumps(result))
    return file_path

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate_ppt_from_topic.py <topic> [outline]")
        sys.exit(1)

    topic = sys.argv[1]
    outline = sys.argv[2] if len(sys.argv) > 2 else None

    main(topic, outline)
```

**测试完整流程**：
```bash
python scripts/generate_ppt_from_topic.py "可再生能源"
# 确保能生成完整的 PPT
```

**第 4 步：用 skill-creator 整合**

当所有脚本都测试通过后，再用官方的 skill-creator 生成最终的 SKILL.md：

```
请帮我创建一个 PPT 生成 Skill，我已经准备好了以下脚本：

1. create_ppt.py - 核心 PPT 生成逻辑
2. ppt_helper.py - 大纲解析辅助函数
3. generate_ppt_from_topic.py - 主入口脚本

工作流程是：
1. 用户提供主题
2. Claude 生成演示大纲（或用户提供）
3. 调用 generate_ppt_from_topic.py 生成 PPT
4. 返回文件路径

请生成完整的 SKILL.md 和目录结构。
```

#### 倒推法的优势

| 方法 | 一次性生成 | 倒推法 |
|------|----------|--------|
| **成功率** | ⚠️ 低（复杂逻辑容易出错） | ✅ 高（每步都测试） |
| **调试难度** | ⚠️ 难（问题难定位） | ✅ 易（问题局限在单个脚本） |
| **质量** | ⚠️ 不稳定 | ✅ 稳定（经过测试的代码） |
| **迭代速度** | ⚠️ 慢（大改动） | ✅ 快（增量改进） |
| **复用性** | ⚠️ 低（耦合严重） | ✅ 高（脚本可独立使用） |

### 5. 完整工作流示例

综合以上 4 条经验，完整的 Skill 创建工作流：

```bash
# ===== 阶段 1：准备和学习 =====

# 1.1 克隆官方仓库（首次）
git clone https://github.com/anthropics/skills.git ~/anthropic-skills

# 1.2 让 AI 学习如何创建 Skills
# 在 Claude Code 中：
# "请阅读 ~/anthropic-skills，特别是 skill-creator，然后告诉我创建 Skill 的流程"

# ===== 阶段 2：梳理需求 =====

# 2.1 创建工作流文档
cat > workflow.md << 'EOF'
## [你的 Skill 名称] 工作流

### 1. 目标
- 问题描述：
- 预期输出：
- 成功标准：

### 2. 步骤拆解
1. ...

### 3. 边界情况
- ...

### 4. 资源需求
- ...
EOF

# 2.2 让 AI 帮助完善（可选）
# "请帮我审查这个工作流，指出可能遗漏的边界情况"

# ===== 阶段 3：创建 MVP =====

# 3.1 初始化项目
mkdir my-skill
cd my-skill
git init

# 3.2 创建最简版本
cat > SKILL.md << 'EOF'
---
name: my-skill
description: [简短描述]
---

# [Skill 名称]

[最基本的指令]
EOF

git add .
git commit -m "feat: MVP v0.1"

# 3.3 测试 MVP
# 在 Claude Code 或 API 中加载这个 Skill，测试基本功能

# ===== 阶段 4：倒推构建（如果复杂） =====

# 4.1 创建并测试核心脚本
mkdir scripts
cat > scripts/core.py << 'EOF'
# 核心逻辑
EOF

python scripts/core.py  # 测试
git add scripts/core.py
git commit -m "feat: add core script"

# 4.2 添加辅助函数
cat > scripts/helper.py << 'EOF'
# 辅助函数
EOF

python scripts/helper.py  # 测试
git add scripts/helper.py
git commit -m "feat: add helper functions"

# 4.3 编写主逻辑
cat > scripts/main.py << 'EOF'
# 主入口
EOF

python scripts/main.py  # 测试
git add scripts/main.py
git commit -m "feat: add main entry point"

# 4.4 用 skill-creator 整合
# 在 Claude Code 中：
# "基于 scripts/ 中的这些脚本，帮我生成完整的 SKILL.md"

# ===== 阶段 5：迭代优化 =====

# 5.1 在实际使用中收集反馈
# 5.2 针对性改进
git checkout -b feature/improve-error-handling
# 修改代码
git add .
git commit -m "feat: improve error handling for edge cases"
git checkout main
git merge feature/improve-error-handling

# 5.3 版本发布
git tag v1.0.0
git push origin main --tags

# ===== 阶段 6：上传和部署（Claude API） =====

# 6.1 测试 Skill 完整性
# 确保 SKILL.md 中的 frontmatter 符合要求

# 6.2 上传到 Claude
python << 'EOF'
import anthropic

client = anthropic.Anthropic()

skill = client.beta.skills.create(
    display_title="My Skill",
    files=anthropic.lib.files_from_dir("./my-skill"),
    betas=["skills-2025-10-02"]
)

print(f"Skill ID: {skill.id}")
print(f"Version: {skill.latest_version}")
EOF

# 6.3 在应用中使用
# 参考 API 使用章节的代码
```

### 6. 常见陷阱和解决方案

| 陷阱 | 表现 | 解决方案 |
|------|------|---------|
| **一次性想完美** | 卡在设计阶段，迟迟不动手 | 采用 MVP 方法，先做出能跑的版本 |
| **脚本太复杂** | 一个脚本几百行，难以调试 | 拆分为多个小脚本，每个脚本单一职责 |
| **没有测试** | 上传后发现各种bug | 每个脚本都独立测试通过再整合 |
| **忽略边界情况** | 正常情况能用，异常输入就挂 | 提前梳理边界情况，添加错误处理 |
| **没有版本管理** | 改坏了不知道怎么回退 | 从一开始就用 Git，频繁提交 |
| **description 写得模糊** | Claude 不知道何时激活这个 Skill | description 要清晰描述适用场景 |
| **过度工程化** | 为了可能的需求添加很多功能 | 只实现当前确定需要的功能 |

## 对 AI 生态的启示：可借鉴的设计思路

虽然 Skills 目前是 Claude 专属特性，但其设计思想对整个 AI Agent 生态都有重要启示。

### 1. Progressive Disclosure：解决上下文爆炸问题

**其他框架可借鉴**：
- LangChain、LlamaIndex 等框架可实现类似的"技能注册表"
- 在 Agent 初始化时加载技能目录，运行时动态注入
- 使用向量数据库存储技能描述，通过语义检索匹配

**参考实现思路**：
```python
# 伪代码示例
class SkillRegistry:
    def __init__(self):
        # 只加载元数据
        self.skills = {
            "data-analysis": {"description": "..."},
            "report-generation": {"description": "..."}
        }

    def activate_skill(self, task_description):
        # 基于任务描述匹配技能
        matched_skill = self.match_skill(task_description)
        # 动态加载完整内容
        full_skill = self.load_full_skill(matched_skill)
        # 临时注入到 system prompt
        return full_skill
```

### 2. 混合确定性执行：减少幻觉和随机性

**设计原则**：
```
如果任务可以用代码确定性完成 → 使用代码执行
如果任务需要理解和推理 → 使用 LLM 生成
如果任务需要两者结合 → 使用 LLM 规划 + 代码执行
```

**组合式可靠性策略**：

1. **结构化输出**：使用 JSON Schema、Pydantic 等强制输出格式
2. **验证层**：在 LLM 输出后进行规则验证
3. **确定性后处理**：使用代码处理 LLM 的结构化输出
4. **分层责任**：
   - LLM 负责：理解意图、提取信息、生成创意内容
   - 代码负责：格式化、计算、数据转换、文件操作

**示例：可靠的报告生成流程**
```
用户需求
  ↓ [LLM] 理解需求，提取关键信息
结构化数据 (JSON)
  ↓ [代码] 验证数据完整性
验证通过
  ↓ [代码] 使用模板引擎生成报告
  ↓ [LLM] 生成摘要和洞察（可选）
最终报告 (确定性格式 + 智能内容)
```

### 3. 标准化格式：促进生态共享

**潜在的统一格式**：
```yaml
---
spec_version: "1.0"
name: "data-analysis"
description: "Statistical analysis and visualization"
compatible_frameworks: ["langchain", "llamaindex", "autogen"]
capabilities:
  - statistical_analysis
  - data_visualization
runtime:
  language: python
  dependencies:
    - pandas>=2.0.0
    - matplotlib>=3.5.0
---

[Instructions in Markdown]
```

## 总结

跨平台 Skills 实践为开发者提供了灵活的选择，无论使用何种 AI 工具或框架，都能享受 Skills 模式带来的好处：

**三种方案对比**：

| 方案 | 最佳场景 | 核心价值 |
|------|---------|---------|
| **OpenSkills** | AI 编程工具用户（Cursor、Windsurf、Aider） | 开箱即用，快速同步官方 Skills |
| **LangChain/LangGraph** | 需要深度定制的应用开发 | 灵活的 Agent 编排，多模型支持 |
| **LlamaIndex** | 数据密集型、RAG 场景 | 强大的文档检索和知识管理 |

**实战工作流要点**：

1. **快速上手**：克隆官方仓库，让 AI 通过 skill-creator 学习
2. **梳理工作流**：提前明确目标、步骤、边界情况和资源需求
3. **MVP 迭代**：先做出能跑的最小版本，用 Git 管理，根据反馈持续优化
4. **倒推法**：复杂 Skill 从脚本开始逐层构建，每步测试通过再整合

**对 AI 生态的贡献**：

Skills 的设计理念（Progressive Disclosure、混合执行、环境隔离）为整个 AI Agent 领域提供了宝贵的经验，推动了：
- 跨平台知识共享生态的发展（agentskills.io）
- LLM 应用的工程化和生产化
- Agent 框架的标准化和互操作性

**行动建议**（按使用场景分类）：

**🎯 AI 编程工具用户（Cursor、Windsurf、Aider）**：
- 立即安装 OpenSkills：`npm install -g openskills`
- 从 Anthropic 官方仓库安装预构建 Skills
- 在项目中创建 AGENTS.md，让团队成员共享技能库

**🎯 LangChain/LlamaIndex 开发者**：
- 借鉴 Progressive Disclosure 理念实现三级加载
- 使用向量数据库优化 Skills 匹配效率
- 考虑混合方案：LlamaIndex 检索 + LangChain 编排

**🎯 开源贡献者**：
- 参与 OpenSkills 项目开发，支持更多 AI 工具
- 贡献高质量 Skills 到社区
- 参与 agentskills.io 标准制定，推动跨平台生态发展

Skills 模式展示了如何让 AI Agent 在保持灵活性的同时变得更加可靠、一致和可维护——这是 AI 从实验走向生产的关键一步。

## 参考资料

### 跨平台解决方案

1. [OpenSkills GitHub Repository](https://github.com/numman-ali/openskills) - 通用 Skills 加载器，支持 Cursor/Windsurf/Aider
2. [OpenSkills: Enabling AI Agents to Share Skill Libraries](https://ai-engineering-trend.medium.com/openskills-enabling-ai-agents-to-share-skill-libraries-b5c8734ac5d5) - OpenSkills 深度介绍
3. [The AI Agent Stack in 2025](https://medium.com/@lssmj2014/the-ai-agent-stack-in-2025-understanding-mcp-langchain-and-llamaindex-408c82041168) - 2025 AI Agent 技术栈
4. [LangChain vs LangGraph vs LlamaIndex (2025)](https://xenoss.io/blog/langchain-langgraph-llamaindex-llm-frameworks) - 框架对比
5. [GitHub - Agent Skills for Context Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) - 上下文工程实践
6. [Agent Frameworks, Runtimes, and Harnesses](https://blog.langchain.com/agent-frameworks-runtimes-and-harnesses-oh-my/) - LangChain 官方博客

### 实战经验和最佳实践

7. [Progressive Disclosure in Agent Skills](https://www.marthakelly.com/blog/progressive-disclosure-agent-skills) - 渐进式披露设计模式
8. [Building an internal agent: Progressive disclosure and handling large files](https://lethain.com/agents-large-files/) - 实际工程应用

### Anthropic 官方资源

9. [Anthropic Skills GitHub Repository](https://github.com/anthropics/skills) - 官方 Skills 仓库和示例
10. [Agent Skills Specification](http://agentskills.io) - 跨平台标准规范
11. [Agent Skills API Guide](https://platform.claude.com/docs/en/api/skills-guide) - 完整 API 使用指南
