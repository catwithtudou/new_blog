﻿# 提示工程的入门笔记v0

## 1. 简介

**1. 聊天(Chat)**

- 定义：用户通过自然语言与AI模型进行互动
- 特点：
    - 基于文本输入输出
    - 无需技术背景
    - 使用自然语言交流
- 用途：获取信息｜完成任务｜娱乐对话

**2. 提示词(Prompt)**

- 定义：引导模型生成特定输出的用户输入文本
- 形式：问题｜陈述句｜不完整句子
- 重要性：提供上下文和方向｜影响生成结果质量

**3. 提示词工程(Prompt Engineering)**

- 定义：设计和优化提示词的系统化过程
- 目标：获得更准确和有用的模型输出

核心技术：
- 检索增强生成(RAG)
    - 结合信息检索和生成模型
    - 利用外部知识库增强输出质量
    - 提高准确性和实用性
- 多智能体系统(Multi-Agent)
    - 实现任务分解
    - 协作信息处理
    - 提升系统灵活性
- 工作流自动化(如Coze)
    - 自动化工具和流程
    - 提高管理效率
    - 减少人为错误

**4. 通过 API 访问大模型**

以 OpenAI 的 Open API 为例，可通过调用 openai.ChatCompletion.create() API 访问大模型，其主要参数有

- **messages：消息对象结构，由message对象列表组成**，每条消息包含两个主要字段：
    - role：指定角色的消息，通常有以下几种
        - system
            - 系统提示
            - 设置对话初始条件
            - 定义助手行为/个性
        - user
            - 用户输入消息
            - 作为用户提示使用
        - assistant
            - 助手生成的响应
            - 可用于优化生成结果
    - content
        - 支持文本内容
        - 支持多媒体内容
- **temperature：控制生成文本的随机性和多样性，取值范围：0-1**
    - 低温度(接近0)
      - 更确定的结果
      - 选择概率高的词语
      - 适合需要精确答案场景
    - 高温度(接近1)
      - 更随机的结果
      - 选择概率低的词语
      - 适合创造性场景

- **top_p：使用核采样技术，与temperature配合使用，通过限制候选词集合控制随机性**
- 其他重要参数：
    - n 指定生成响应数量，便于比较和选择
    - max_length：限制生成文本最大长度，控制token数量，管理计算资源使用
    - stop：设置停止标记，控制输出终止条件

**5. 提示词的要素**

- **指令**：通常包括执行的特定任务描述或指令，好的指令应该包含有条理的需求、限制条件以及异常处理
- **上下文**：包含外部信息或额外的上下文信息，引导大语言模型更好地响应
- **输入数据**：用户输入的内容或问题，因此又被称为“用户提示（User Prompt）”
- **输出指示**：指定输出的类型及格式，通常还会包含输出的一个或多个样例

## 2. 必备技能

### 2.1 zero-shot&one-shot&few-shot

- 在提示工程中，**样本（Shot）通常指代输出样例**，这里提到的 zero-shot 实际指零样本，而 one-shot 和 few-shot 实际上就是一份和多份示例信息
- 零样本虽然也能在通用场景下也能够执行任务，**但在输出控制、输出稳定性以及处理较为复杂的任务时仍存在局限性**，主要原因就是模型在缺乏具体上下文或示例时很难把握用户意图或理解任务的复杂性
- 利用大语言模型的能力，提供一份或多份示例提示仍然**是目前最简单且有效的提示工程方法之一**。通过示例提示，模型可更好地理解任务要求，从而提高输出的准确性和一致性，该方法不仅有助于增强模型的表现，也能一定程度上减少生成结果的随机性，使其更符合用户的期望

### 2.2 思维链（chain of thought）

- **定义与用途**
    - 一种用于增强推理能力的方法
    - 模拟人类思维过程
    - 将复杂问题分解为简单步骤
    - 适用于多步推理和逻辑分析任务
      - 意图识别
      - 数学题解答
- **主要特点**
    - 分步推理
        - 问题分解为多个简单步骤
        - 便于理解问题结构
        - 明确逻辑关系
    - 透明性
       - 展示完整推理过程
       - 便于人类理解决策
    - 可解释性
       - 显式推理步骤
       - 易于识别和纠正错误
- **实现与局限**
    - 实现方式
      - 在训练数据中加入示例
      - 展示问题分解步骤
      - 训练模型学习推理方法
    - 局限性
      - 需要更多Token资源
      - 消耗更多算力
      - 增加推理时间

### 2.3 实现常见的自然语言处理任务

- **自然语言处理能力**
    - 基础功能
        - 通过简单提示完成任务
        - 高效处理多种任务类型
    - 翻译能力
        - 不同语言间准确转换
        - 帮助跨越语言障碍
        - 实现无缝交流
    - 文本润色
        - 识别并改进语法错误
        - 提升表达流畅性
        - 优化文章可读性

- **高级应用能力**
    - 仿写功能
        - 遵循给定文本风格
        - 按指定主题创作
        - 满足多样化创作需求
    - 情感分析
        - 识别文本情感倾向
        - 分析用户反馈
        - 了解市场趋势

- **关键词处理**
    - 提取能力
        - 分析文本内容
        - 识别代表性关键词
        - 提取文章核心信息
    - 应用价值
        - 快速理解文章要点
        - 提取搜索关键字
        - 支持检索增强生成

### 2.4 检索增强生成（Retrieval-Augmented Generation, RAG）


- **RAG基本概念**
    - 定义
        - 检索增强生成(Retrieval-Augmented Generation)
        - 结合信息检索和生成模型
        - 提升生成准确性和信息丰富度
    - 与传统模型区别
        - 传统模型依赖训练数据知识
        - RAG可动态获取外部知识
        - 生成更准确的上下文相关内容

- **工作流程**
    - 检索阶段
        - 基于输入查询外部文档库
        - 获取相关文档和信息片段
        - 使用向量检索技术(如ByteGraph)
    - 生成阶段
        - 整合检索信息和原始输入
        - 传递给大语言模型
        - 生成最终输出文本

- **核心优势**
    - 知识增强
        - 可访问外部知识库
        - 利用最新信息
        - 突破训练数据限制
    - 质量提升
        - 避免常识性错误
        - 减少过时信息
        - 提高内容准确度
    - 应用灵活
        - 可调整文档库
        - 适应不同任务需求
        - 满足各领域应用

- **应用场景**
    - 主要领域
        - 问答系统
        - 对话系统
        - 内容生成
    - 特别适用
        - 企业内部应用
        - 高准确性要求场景
        - 需要实时信息更新的环境

## 3. 进阶技能

### 3.1 利用大模型来生成 prompt

利用大模型本身的角色能力，来充当“prompt生成专家”的角色来帮助生成，提前提供好相关的 prompt 模版和规范，并结合前面提到的 few-shot 和 rag 等来使其 prompt 有更好的效果。


### 3.2 更丰富的输出格式

除了生成普通的文本、JSON 和计算机代码外，还可以生成多种格式的内容，如：

- Markdown富文本
- Mermaid图表
- PlantUML图示
- SVG矢量图形等

### 3.3 工具

- **基本概念**
    - 发展过程
        - 最初用于文本生成
        - 逐步整合外部工具
        - 实现功能扩展
    - 工具定义
        - 外部API或函数
        - 提供特定功能服务
        - 扩展模型基础能力

- **集成方式**
    - API调用
        - 通过HTTP请求通信
        - 使用RESTful接口
        - 处理请求和响应
    - 插件系统
        - 平台提供插件支持
        - 支持动态加载工具
        - 自动化流程管理
    - 函数调用
        - 调用预定义函数
        - 支持本地函数
        - 支持远程函数

- **主要优势**
    - 能力扩展
        - 处理更广泛任务
        - 突破原有限制
    - 时效性
        - 获取实时数据
        - 提供准确信息
    - 专业能力
        - 深入特定领域
        - 提供专业服务

- **应用场景**
    - 数据分析
        - 执行SQL查询
        - 生成文档报告
        - 进行协作提醒
    - 客服系统
        - 访问CRM系统
        - 获取客户信息
        - 个性化服务
    - 金融服务
        - 获取市场数据
        - 分析股票趋势
        - 提供投资建议

### 3.4 智能体与多智能体

- **智能体(Agent)**
    - 核心定义
        - 自主感知环境
        - 执行目标导向行为
        - 基于工具调用
    - 工作机制
        - 调用工具获取信息
        - 感知外界反馈
        - 进行环境交互
        - 自主决策下一步

- **多智能体系统**
    - 基础形态
        - 多个智能体协作
        - 各具自主性
        - 承担特定功能
    - 系统类型
        - 简单系统
            - 主智能体为核心
            - 子智能体作为工具
            - 层级调用关系
        - 复杂系统
            - 模拟公司架构
            - 角色多样化
                - 管理层(CEO/CFO/CTO)
                - 执行层(程序员/测试)
            - 团队协作模式

### 3.5 image as prompt

通过图片来作为 prompt 进行使用。

### 3.6 提示词安全与攻防

- **提示工程安全挑战**
    - 输入操控
        - 恶意提示设计
        - 生成不当内容
            - 虚假信息
            - 仇恨言论
            - 有害内容
    - 信息安全
        - 敏感信息泄露
        - 机密数据外露
        - 训练数据风险
    - 提示词安全
        - 逆向工程威胁
        - 提示词获取风险
        - 潜在损失影响

- **安全应对策略**
    - 重要性
        - 降低应用风险
        - 确保模型可靠性
        - 保障使用安全
    - 发展方向
        - 持续关注安全
        - 技术与安全并重
        - 保护用户利益
        - 维护社会效益