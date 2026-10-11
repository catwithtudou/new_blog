---
date: 2026-01-03
categories:
  - aigc
tags:
  - llm
  - aigc
---

# Anthropic Agent Skills 完整指南：让 AI Agent 掌握专业技能的标准化方案

## 引言

随着大语言模型在各个领域的应用越来越广泛，如何让 AI Agent 更好地完成特定领域的专业任务成为了一个重要课题。Anthropic 推出的 **Agent Skills** 提供了一个优雅的解决方案——通过标准化的技能包（Skill），让 Claude 能够动态加载专业指令和资源，从而在特定任务上表现得更加专业和一致。

本文将深入介绍 Anthropic 的 Skills 项目，帮助你理解其核心价值、技术架构和实际应用。

> **技术准确性声明**：本文中所有关键技术细节（Progressive Disclosure、高效脚本执行、环境隔离等）均基于 Anthropic 官方文档验证，包括：
> - [Agent Skills API Guide](https://platform.claude.com/docs/en/api/skills-guide)
> - [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview)
> - [Anthropic Engineering Blog - Agent Skills](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
>
> 文中涉及官方文档的部分均以引用块标注，确保信息的准确性和可追溯性。

<!-- more -->

## 什么是 Agent Skills？

**Agent Skills** 是一种将指令、脚本和资源打包成独立技能单元的标准化方案。简单来说，Skill 就是一个包含特定任务指令的文件夹，Claude 可以动态加载这些指令来完成专业化的任务。

Anthropic 在 GitHub 上开源了 [skills](https://github.com/anthropics/skills) 仓库，其中包含：

- **示例技能集**：展示各种应用场景的参考实现
- **文档处理技能**：PDF、DOCX、PPTX、XLSX 等格式的处理能力
- **Agent Skills 规范**：定义技能包的标准格式
- **技能模板**：帮助快速创建自定义技能

## 核心价值：为什么需要 Skills？

### 1. 可复用的专业知识

传统方式下，每次需要 Claude 完成特定任务时，都需要在 Prompt 中重复说明细节。而 Skills 允许你将这些专业知识封装成可复用的技能包：

```markdown
# 场景对比

## 传统方式
每次对话都需要说明：
- "请按照我们公司的品牌指南创建文档"
- "使用我们的数据分析流程处理数据"
- "遵循特定的代码审查标准"

## 使用 Skills
一次定义，多次使用：
- 创建 "company-branding" Skill
- 创建 "data-analysis-workflow" Skill
- 创建 "code-review-standards" Skill
```

### 2. 一致性保证

通过 Skills，可以确保 Claude 在处理相同类型任务时遵循统一的标准和流程，这对企业应用尤为重要：

- **品牌一致性**：文档生成遵循统一的品牌规范
- **流程标准化**：数据分析使用组织特定的工作流
- **质量控制**：代码审查符合团队的编码标准

### 3. 能力扩展

Skills 让 Claude 能够处理原本不擅长的专业任务，如：

- 创建和编辑 Office 文档（DOCX、PPTX、XLSX）
- 处理 PDF 文件
- 执行企业特定的业务流程
- 遵循特定领域的最佳实践

### 4. 知识隔离与安全

不同的技能可以独立管理和版本控制，避免了将所有指令混在一起导致的混乱，同时也便于权限管理和审计。

## 技术架构：Skills 如何保证一致性和稳定性？

> **本章重点**：本章深入探讨 Skills 的核心技术机制，特别是**如何通过 Progressive Disclosure、高效脚本执行、环境隔离等机制保证任务执行的一致性和稳定性**。所有技术细节均基于官方文档验证，关键概念以引用块标注官方原文。

### 核心机制：Progressive Disclosure（渐进式披露）

Skills 最核心的技术创新在于其**渐进式披露（Progressive Disclosure）**架构。根据 Anthropic 官方文档，这与传统的 RAG（检索增强生成）或直接注入 System Prompt 的方式有本质区别。

#### 官方定义的三级加载模型

根据官方文档，Skills 采用三级渐进加载机制：

**Level 1: Metadata（元数据层）**
- **内容**：仅加载 SKILL.md 中的 YAML frontmatter（`name` 和 `description`）
- **时机**：始终加载（Always loaded）
- **成本**：每个 Skill 约 ~100 tokens
- **作用**：让 Claude 能够"发现"可用的技能并进行意图匹配

**Level 2: Instructions（指令层）**
- **内容**：SKILL.md 的主体 Markdown 内容
- **时机**：当 Claude 识别到任务需要该 Skill 时自动加载（Loaded when triggered）
- **成本**：通常 <5,000 tokens
- **作用**：提供详细的执行指令、最佳实践和使用示例

**Level 3: Resources（资源层）**
- **内容**：额外的文件、脚本、模板、配置等
- **时机**：按需加载（Loaded as needed）
- **成本**：几乎为零（脚本执行时，代码本身不进入上下文，仅输出结果进入）
- **作用**：提供确定性的代码执行和数据访问

#### 技术实现细节

**文件系统加载**：
- Skill 文件被复制到代码执行容器的 `/skills/{directory}/` 目录
- 文件已就绪，但完整内容不会自动读取到上下文
- Claude 可通过 bash 或 Python 代码随时访问这些文件

**自动触发机制**：
- Claude 基于任务描述与 Skill 的 `description` 字段进行语义匹配
- 无需用户显式调用（如 `/use-skill xxx`）
- 匹配成功后自动加载 Level 2 和 Level 3 内容

**多技能组合**：
- 一个请求可同时使用多个 Skills（最多 8 个）
- Skills 之间可以自然组合，无需预定义交互逻辑
- 例如：`xlsx` Skill → 自定义分析 Skill → `pptx` Skill 的工作流

#### 为什么这种架构能解决上下文爆炸问题？

传统方法的问题：
```python
# 传统方式：将所有指令都加载到上下文
system_prompt = """
你是一个助手。

# 品牌指南（5000 tokens）
...完整的品牌指南内容...

# 数据分析流程（3000 tokens）
...完整的分析流程...

# 代码审查标准（4000 tokens）
...完整的审查标准...

# 其他 10 个技能（30000 tokens）
...

"""
# 总计：42000+ tokens 始终占用上下文
# 即使当前任务只需要其中一个技能
```

Skills 的解决方案：
```python
# Skills 方式：渐进式加载
初始上下文（Level 1 - Metadata）：
- 品牌指南 Skill：name + description（~100 tokens）
- 数据分析 Skill：name + description（~100 tokens）
- 代码审查 Skill：name + description（~100 tokens）
- 其他 10 个 Skills：各 ~100 tokens
# 总计：仅 ~1,300 tokens（13 个 Skills 的元数据）

当用户请求 "生成品牌文档" 时：
→ Claude 识别需要品牌指南 Skill
→ 系统动态加载该 Skill 的 Level 2（指令层，~5000 tokens）
→ 其他 12 个 Skills 依然只占用元数据空间（Level 1）
# 实际上下文：1,300 + 5,000 = 6,300 tokens
# 相比传统方式（42,000+ tokens）节省了 85% 的上下文
```

这种架构的优势：
- ✅ **理论上无限的技能数量**：未激活的 Skill 几乎不占空间
- ✅ **减少噪音干扰**：无关技能的详细内容不会干扰 Claude 的推理
- ✅ **提高推理质量**：更多的上下文空间用于任务本身
- ✅ **节省成本**：更少的 token 消耗

### 高效可靠的执行机制：混合 LLM 推理与代码执行

Skills 能够保证一致性和稳定性的核心原因是**混合执行模式（Hybrid Execution）**——将 LLM 的语言理解能力与代码的可靠执行相结合。

> **官方表述**：根据 Anthropic 文档，Skills 的关键优势在于"Efficient script execution"（高效脚本执行）和"Reliability"（可靠性），而非单纯的"确定性"。这种设计确保了：
> - **Efficient（高效）**：脚本代码不进入上下文，只有输出消耗 tokens
> - **Reliable（可靠）**：相同输入产生一致的结果，减少 LLM 生成的随机性
> - **Consistent（一致）**：通过代码执行而非 LLM 生成来保证格式和计算的准确性

#### 纯 Prompt 方式的根本性问题

```python
# 场景：生成 Excel 财务报告
prompt = """
请创建一个包含以下内容的 Excel 文件：
1. 资产负债表
2. 利润表
3. 现金流量表
格式要求：... (详细格式说明)
"""

# 问题 1：LLM 每次生成都有随机性
# Temperature > 0 导致同样输入可能产生不同输出

# 问题 2：LLM 容易出现幻觉
# 可能编造不存在的单元格引用或公式

# 问题 3：格式一致性无法保证
# 列宽、颜色、边框等细节每次可能不同

# 问题 4：复杂计算容易出错
# LLM 可能在多步计算中出错
```

#### Skills 的可靠执行解决方案

Skills 通过以下机制实现高效和可靠性：

**1. 代码执行而非文本生成（Level 3: Resources）**

根据官方文档，Skills 的脚本执行有独特的优势：

> **官方文档原文**："When instructions mention executable scripts, Claude runs them via bash and receives only the output. The script code itself never enters context, making this far more efficient than having Claude generate equivalent code on the fly."

这意味着：
- **脚本代码 ≠ Token 成本**：`validate_form.py` 的代码可以有 500 行，但不消耗上下文
- **仅输出进入上下文**：只有脚本的执行结果（如 `{"valid": true, "errors": []}`）占用 tokens
- **预写脚本的可复用性**：同一个脚本可在多次对话中使用，无需重新生成

**Skills 中的指导模式**：
```markdown
当需要创建 Excel 文件时，使用 Python 的 openpyxl 库：

1. 导入必要的库
2. 创建 Workbook 对象
3. 使用代码设置格式（而不是描述格式）
4. 保存文件并返回 file_id
```

Claude 实际执行的代码（确定性的）：
```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Border

wb = Workbook()
ws = wb.active

# 设置表头（确定性）
ws['A1'] = '资产'
ws['A1'].font = Font(bold=True, size=12)
ws['A1'].fill = PatternFill(start_color="0066CC", fill_type="solid")

# 计算（确定性）
ws['B10'] = '=SUM(B2:B9)'  # 公式精确无误

# 保存文件（确定性）
wb.save('/tmp/output.xlsx')
```

**关键区别**：
- ❌ 纯 Prompt：Claude 尝试"描述"一个 Excel 文件 → 不可靠、低效
  - 每次生成都可能不同（LLM 的随机性）
  - 需要在上下文中详细描述所有格式（消耗大量 tokens）
  - 容易出现格式错误和计算错误
- ✅ Skills：Claude 编写并执行代码生成 Excel 文件 → 高效、可靠
  - 代码执行保证一致性（相同代码产生相同结果）
  - 脚本代码不占用上下文（仅输出占用 tokens）
  - 预写脚本经过测试，质量有保障

**2. 文件系统访问而非记忆依赖**

```python
# 传统方式（依赖 LLM "记忆"）
prompt = """
这是我们公司的品牌指南：
颜色：#0066CC
字体：Arial
Logo 位置：右上角
... (数千字的详细说明)

现在请创建一个符合品牌指南的文档
"""
# 问题：LLM 可能遗忘细节或记错信息

# Skills 方式（文件系统访问）
# skills/company-brand/brand_guidelines.json
{
  "colors": {"primary": "#0066CC"},
  "fonts": {"heading": "Arial"},
  "logo_position": "top-right"
}

# Claude 通过代码读取（确定性）
import json

with open('/skills/company-brand/brand_guidelines.json', 'r') as f:
    guidelines = json.load(f)

primary_color = guidelines['colors']['primary']  # 总是 #0066CC
```

**关键区别**：
- ❌ 传统方式：依赖 LLM 的"记忆" → 容易出错
- ✅ Skills：通过文件系统读取数据 → 可靠准确

**3. 模板和脚本的复用**

Skills 可以包含预写的脚本，确保每次执行完全相同：

```
skills/financial-report/
├── SKILL.md                    # 指导如何使用这个 Skill
├── scripts/
│   ├── generate_balance_sheet.py   # 固定的资产负债表生成逻辑
│   ├── generate_income_statement.py # 固定的利润表生成逻辑
│   └── calculate_ratios.py          # 固定的财务比率计算
├── templates/
│   ├── report_template.xlsx         # 固定的 Excel 模板
│   └── styles.json                  # 固定的格式定义
└── references/
    └── accounting_standards.md      # 会计准则参考
```

Claude 使用时：
```python
# Claude 不需要每次"重新发明轮子"
# 直接调用预写的确定性脚本

import sys
sys.path.append('/skills/financial-report/scripts')

from generate_balance_sheet import create_balance_sheet
from calculate_ratios import calculate_financial_ratios

# 这些函数的实现是固定的、经过测试的
# 相同输入必然产生相同输出
balance_sheet = create_balance_sheet(financial_data)
ratios = calculate_financial_ratios(balance_sheet)
```

#### 实际效果对比

> **案例来源**：以下数据来自 Anthropic 官方工程博客文章 ["Equipping agents for the real world with Agent Skills"](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) 中关于 Rakuten（乐天）的实际使用案例。

根据 Rakuten（乐天）的实际使用案例，使用 Skills 后：

- 财务报告生成速度提升了 **87.5%**
- 输出一致性接近 **100%**（使用代码执行而非 LLM 生成）
- 错误率显著降低（不再依赖 LLM 的数学计算和格式记忆）

**提升的根本原因**：

1. **Progressive Disclosure 减少上下文干扰**
   - 未激活的 Skills 仅占用 ~100 tokens/个（元数据层）
   - 只有相关 Skill 的指令层被加载
   - 更多上下文空间用于任务本身

2. **代码执行保证可靠性和一致性**
   - 相同代码产生相同结果（vs. LLM 的随机性）
   - 预写脚本经过测试，质量有保障
   - 复杂计算和格式化由代码完成，不依赖 LLM 生成

3. **文件系统访问消除记忆依赖**
   - 配置从文件读取，不依赖 LLM "记住"细节
   - 模板和样式定义存储为文件，确保准确性
   - 避免 LLM 在长对话中遗忘或记错信息

4. **高效的脚本执行机制**
   - 脚本代码不进入上下文（仅输出占用 tokens）
   - 减少了 token 消耗和推理时间
   - 预写脚本复用性高，不需要每次重新生成代码

### 环境隔离：避免状态污染

Skills 运行在隔离的代码执行容器中，确保了每次执行的独立性。

#### 隔离机制

```python
# 每个 API 请求获得一个全新的容器环境
Request 1:
  └─ Fresh Container 1
      ├─ Python 环境（干净状态）
      ├─ /skills/ 目录（从零加载）
      └─ /tmp/ 目录（空白状态）

Request 2:
  └─ Fresh Container 2
      ├─ Python 环境（干净状态）
      ├─ /skills/ 目录（从零加载）
      └─ /tmp/ 目录（空白状态）

# 两个请求完全独立，互不影响
```

#### 为什么隔离很重要？

**问题场景**（如果没有隔离）：
```python
# 用户 A 的请求（假设有状态污染）
import pandas as pd
df = pd.DataFrame({'amount': [100, 200, 300]})
# ... 处理数据 ...

# 用户 B 的请求（可能受影响）
# 如果环境没有隔离，可能会访问到用户 A 的数据
# 这会导致安全问题和结果不一致
```

**Skills 的解决方案**（环境隔离）：
```python
# 用户 A 的容器
Container_A:
  - 完全独立的 Python 进程
  - 独立的文件系统
  - 请求结束后销毁

# 用户 B 的容器
Container_B:
  - 完全独立的 Python 进程
  - 独立的文件系统
  - 请求结束后销毁

# 不可能互相干扰
```

#### 环境约束（官方限制）

为了保证安全性和一致性，Skills 执行环境有以下限制：

| 约束 | 说明 | 原因 |
|------|------|------|
| **无网络访问** | 不能进行外部 API 调用 | 确保结果可复现，避免外部依赖导致的不确定性 |
| **无运行时包安装** | 只能使用预装的包 | 避免版本不一致，确保环境稳定 |
| **隔离环境** | 每个请求获得新容器 | 防止状态污染和数据泄露 |
| **文件大小限制** | Skill 上传限制 8MB | 确保加载性能 |
| **Skills 数量限制** | 每个请求最多 8 个 Skills | 防止上下文过载 |

这些约束虽然限制了灵活性，但**极大地提高了可靠性和一致性**。

### 版本控制：锁定稳定性

Skills 支持版本管理，允许你在开发和生产环境使用不同的策略。

#### 版本格式

| 类型 | 版本格式 | 示例 | 说明 |
|------|---------|------|------|
| **Anthropic Skills** | 日期格式 | `20251013` | 官方发布的版本号 |
| **Custom Skills** | 时间戳格式 | `1759178010641129` | 上传时自动生成 |
| **Latest** | 字符串 | `latest` | 始终指向最新版本 |

#### 生产环境最佳实践

```python
# ❌ 生产环境不推荐
container={
    "skills": [{
        "type": "custom",
        "skill_id": "skill_01AbCdEfGhIjKlMnOpQrStUv",
        "version": "latest"  # 不稳定：随时可能变化
    }]
}

# ✅ 生产环境推荐
container={
    "skills": [{
        "type": "custom",
        "skill_id": "skill_01AbCdEfGhIjKlMnOpQrStUv",
        "version": "1759178010641129"  # 稳定：永远不变
    }]
}
```

#### 版本策略对比

```python
# 开发环境：使用 latest 快速迭代
dev_container = {
    "skills": [{"skill_id": "my-skill", "version": "latest"}]
}
# 优势：立即获得最新功能
# 风险：可能引入未经充分测试的变更

# 测试环境：锁定版本进行验证
test_container = {
    "skills": [{"skill_id": "my-skill", "version": "1759178010641129"}]
}
# 优势：测试结果可复现
# 流程：验证通过后再部署到生产

# 生产环境：使用经过验证的版本
prod_container = {
    "skills": [{"skill_id": "my-skill", "version": "1759178010641129"}]
}
# 优势：最大化稳定性
# 更新：通过严格的变更管理流程
```

这种版本控制机制确保了：
- ✅ **可复现性**：相同版本产生相同结果
- ✅ **可回滚性**：问题版本可以快速回退
- ✅ **渐进式部署**：先测试后推广

### 总结：一致性和稳定性的保障体系

> **设计理念**：根据官方文档，Skills 的核心设计理念是"**Hybrid Execution**"（混合执行）——结合 LLM 的语言理解能力与代码的可靠执行，实现高效（Efficient）、可靠（Reliable）、一致（Consistent）的任务完成。

Skills 通过多层机制保证了一致性和稳定性：

| 机制 | 如何保证一致性 | 如何保证稳定性 | 官方文档验证 |
|------|---------------|---------------|------------|
| **Progressive Disclosure** | 减少无关上下文干扰，提高推理质量 | 避免上下文爆炸导致的不稳定 | ✓ 3-level loading model |
| **高效脚本执行** | 相同代码产生一致结果（vs. LLM 的随机性） | 脚本代码不占用上下文，仅输出进入 | ✓ "Efficient script execution" |
| **文件系统访问** | 数据从文件读取而非依赖 LLM "记忆" | 避免 LLM 遗忘或记错信息 | ✓ Filesystem access |
| **预写脚本和模板** | 最佳实践固化为代码，无需重新生成 | 经过测试的代码质量有保障 | ✓ Level 3: Resources |
| **环境隔离** | 每个请求独立容器，无状态污染 | 防止跨请求干扰和数据泄露 | ✓ "Fresh container per request" |
| **版本锁定** | 锁定特定版本确保行为不变 | 避免意外更新引入未测试的变更 | ✓ Timestamp/date versioning |
| **环境约束** | 无网络访问等限制确保可复现 | 减少外部依赖导致的不确定性 | ✓ No network, no runtime installs |

**这种混合架构的本质优势**：

1. **LLM 负责**：理解用户意图、选择合适的技能、规划执行流程
2. **代码负责**：格式化、计算、文件操作、数据转换
3. **两者结合**：LLM 的灵活性 + 代码的可靠性 = 既智能又稳定的 Agent

这是 Skills 能够在生产环境中可靠运行的根本原因，也是其优于纯 Prompt 方案的核心价值。

## Skills vs. System Prompt：本质区别

很多人会问：Skills 和我在 System Prompt 中写固定指令有什么区别？

### 技术层面的区别

| 维度 | System Prompt | Agent Skills |
|------|--------------|--------------|
| **加载方式** | 静态，所有内容始终在上下文中 | 动态，按需加载（Progressive Disclosure） |
| **Token 消耗** | 整个 Prompt 始终占用 token | 未激活时仅占用元数据（~100 tokens/skill） |
| **作用域** | 全局，影响整个对话 | 按需激活，仅在相关时生效 |
| **可组合性** | 难以组合多个 Prompt | 可在同一对话中安全切换多个 Skills |
| **版本管理** | 需要手动修改代码 | 文件化管理，支持 Git 版本控制 |
| **确定性** | 完全依赖 LLM 生成 | 可包含确定性代码执行 |
| **扩展性** | 受上下文窗口限制 | 理论上无限（未激活的 Skill 不占用空间） |

### 架构设计哲学的区别

**System Prompt 设计哲学**：
- 是 AI 的"基础人格"和"通用能力"
- 类似于操作系统的内核
- 应该保持稳定，不频繁变化

**Skills 设计哲学**：
- 是 AI 的"专业技能"和"领域知识"
- 类似于操作系统的应用程序
- 应该模块化、可插拔、可组合

一个好的类比是：

> System Prompt 就像给一个人进行通识教育，让 TA 成为一个基础合格的助手。
> Skills 就像给这个人提供专业培训和操作手册，让 TA 在特定任务上成为专家。

### 实际效果对比

根据 Rakuten（乐天）的实际使用案例：

- 使用 Skills 后，财务报告生成速度提升了 **87.5%**
- 这种提升不仅来自于指令的优化，更来自于：
  - 减少了无关上下文的干扰
  - 利用确定性代码执行保证了格式一致性
  - Progressive Disclosure 节省了推理时间

## Skills vs. Tools (MCP)：互补而非替代

Anthropic 生态中还有另一个重要概念——**MCP（Model Context Protocol）**，它与 Skills 的定位和使用场景有明显区别。

### 核心定位差异

**Skills（技能）**：
- 封装**领域知识**和**操作流程**
- 回答"如何做"的问题（How）
- 主要通过 Markdown 指令 + 本地代码实现
- 适合静态、可重复的专业知识

**Tools/MCP（工具）**：
- 连接**外部系统**和**实时数据**
- 回答"从哪获取"的问题（Where）
- 通过客户端-服务器协议实现
- 适合动态、需要外部交互的任务

### 技术架构对比

| 维度 | Skills | MCP Tools |
|------|--------|-----------|
| **本质** | Prompt 注入 + 本地代码执行 | 外部 API 调用 |
| **上下文成本** | 低（渐进式加载，几十 tokens） | 高（工具定义可达数万 tokens） |
| **实时性** | 无法独立访问外部数据 | 专门用于访问实时外部数据 |
| **设置复杂度** | 简单（Markdown 文件） | 复杂（需运行服务器、配置 .mcp.json） |
| **跨平台性** | 目前仅 Claude 生态 | 开放标准，支持多种 LLM |
| **知识边界** | 受 Skill 文件内容限制 | 受 API 能力限制 |
| **典型延迟** | 低（本地执行） | 中到高（网络调用） |

### 优劣势分析

**Skills 的优势**：
- ✅ **极低的 Token 成本**：未激活时几乎不占空间
- ✅ **简单易用**：Markdown + YAML，学习成本低
- ✅ **自动激活**：Claude 自动判断何时使用
- ✅ **多技能并存**：可同时安装大量 Skills 而不影响性能
- ✅ **版本管理友好**：纯文本文件，Git 友好

**Skills 的局限**：
- ❌ **无法访问实时数据**：环境限制无网络访问
- ❌ **生态封闭**：目前仅 Claude 支持
- ❌ **静态知识**：知识更新需手动修改文件
- ❌ **包依赖限制**：只能使用预装的 Python 包

**MCP Tools 的优势**：
- ✅ **强大的扩展性**：可连接任意外部系统（数据库、API、第三方服务）
- ✅ **开放标准**：不绑定特定 LLM，生态更开放
- ✅ **实时性**：访问最新数据（GitHub 状态、CI/CD 结果等）
- ✅ **社区生态**：大量社区开发的 MCP 服务器

**MCP Tools 的局限**：
- ❌ **高 Token 成本**：工具定义可消耗数万 tokens
- ❌ **配置复杂**：需要运行服务器、管理配置
- ❌ **学习曲线陡峭**：规范复杂，开发门槛高
- ❌ **性能开销**：网络调用带来延迟

### 使用场景指南

**选择 Skills 的场景**：

1. **文档生成与格式化**
   - 按照公司品牌指南生成文档
   - 标准化的数据报告生成
   - 示例：生成符合 IEEE 格式的学术论文

2. **业务流程自动化**
   - CRM 数据汇总
   - 项目提案草拟
   - 示例：每周自动生成销售报告

3. **本地数据分析**
   - 数据清洗和转换
   - 统计分析和可视化
   - 示例：分析本地 CSV 文件并生成洞察

4. **代码审查和重构**
   - 按照团队编码规范检查代码
   - 生成符合最佳实践的代码
   - 示例：检查 Python 代码是否符合 PEP 8

**选择 MCP Tools 的场景**：

1. **实时数据获取**
   - 查询数据库当前状态
   - 获取 API 的最新响应
   - 示例：检查 GitHub 仓库的 CI/CD 状态

2. **多系统编排**
   - 跨系统的数据同步
   - 复杂的业务流程集成
   - 示例：从库存系统查询，更新到订单系统

3. **遗留系统集成**
   - 连接没有现代 API 的老系统
   - 统一访问接口
   - 示例：通过 MCP 访问内部 ERP 系统

4. **外部服务调用**
   - Slack 消息发送
   - 日历事件创建
   - 示例：自动将会议纪要同步到 Google Calendar

**最佳实践：组合使用**

最强大的方案往往是将两者结合：

```markdown
场景：自动生成库存报告

1. [MCP Tool] 从数据库获取实时库存数据
2. [MCP Tool] 从销售系统获取本月销售额
3. [Skill] 使用"库存分析 Skill"进行数据分析
4. [Skill] 使用"公司报告 Skill"生成符合品牌的 PDF 报告
5. [MCP Tool] 将报告上传到 SharePoint
```

这种混合模式发挥了各自的优势：
- MCP 负责数据的获取和分发（动态部分）
- Skills 负责分析逻辑和格式规范（静态部分）

## 使用方式

Anthropic 提供了多种使用 Skills 的方式，适应不同的应用场景。

### 1. 在 Claude Code 中使用

**Claude Code** 是 Anthropic 的官方 CLI 工具，支持通过插件系统加载 Skills。

> **注意**：以下命令基于实际使用经验，但请以[官方最新文档](https://docs.claude.com/en/api/skills-guide)为准。

#### 添加 Skills 市场

```bash
/plugin marketplace add anthropics/skills
```

#### 安装技能包

```bash
# 安装文档处理技能
/plugin install document-skills@anthropic-agent-skills

# 安装示例技能
/plugin install example-skills@anthropic-agent-skills

# 安装前端设计技能
/plugin install frontend-design@anthropic-agent-skills
```

安装后需要重启 Claude Code 以加载新插件。

### 2. 在 Claude.ai 网页版使用

在 Claude.ai 的付费计划（Pro, Max, Team, Enterprise）中，可以通过界面上传和使用自定义 Skills：

1. 访问 Skills 设置页面
2. 上传你的 Skill 文件夹（压缩包或文件）
3. 在对话中启用代码执行功能
4. Claude 会自动识别并使用相关的 Skill

详细步骤参考：[Using skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude)

### 3. 通过 Claude API 使用

在 API 调用中，可以通过编程方式使用预构建的 Skills 或上传自定义 Skills。

#### 基础示例

```python
import anthropic

client = anthropic.Anthropic()

response = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    # 关键点 1：必须包含特定的 beta headers
    betas=[
        "code-execution-2025-08-25", # 必须启用代码执行
        "skills-2025-10-02"          # 必须启用 Skills
    ],
    # 关键点 2：Skills 是通过 container 参数传入的
    container={
        "skills": [
            {
                "type": "anthropic", # 使用预置技能
                "skill_id": "pptx",
                "version": "latest"
            },
            # 或者引用自定义技能
            # {
            #     "type": "custom",
            #     "skill_id": "skill_01AbCdEfGhIjKlMnOpQrStUv",
            #     "version": "latest"
            # }
        ]
    },
    # 关键点 3：必须启用代码执行工具
    tools=[{
        "type": "code_execution_20250825",
        "name": "code_execution"
    }],
    messages=[
        {"role": "user", "content": "创建一份关于可再生能源的演示文稿"}
    ]
)
```

详细的 API 使用指南：[Skills API Quickstart](https://platform.claude.com/docs/en/api/skills-guide)

## 创建自定义 Skill

### Skill 的基本结构

一个最简单的 Skill 只需要一个包含 `SKILL.md` 文件的文件夹：

```markdown
---
name: my-custom-skill
description: 这个技能的详细描述，说明它能做什么以及何时使用
---

# 我的自定义技能

这里是 Claude 在激活这个技能时会遵循的具体指令。

## 使用示例

1. 示例场景一
2. 示例场景二

## 指导原则

- 原则 1：具体的行为规范
- 原则 2：输出格式要求
- 原则 3：注意事项

## 工具和资源

- 可能需要的工具说明
- 相关资源链接
```

**必需的 Frontmatter 字段（严格要求）**：

| 字段 | 要求 | 说明 |
|------|------|------|
| `name` | **必需** | 最多 64 字符，仅限小写字母/数字/连字符，不能包含 XML 标签，不能使用保留词（"anthropic", "claude"）|
| `description` | **必需** | 最多 1024 字符，非空，不能包含 XML 标签 |

### 上传自定义 Skill

```python
import anthropic
from anthropic.lib import files_from_dir

client = anthropic.Anthropic()

# 方式 1：使用目录路径（Python 推荐）
skill = client.beta.skills.create(
    display_title="Financial Analysis",
    files=files_from_dir("/path/to/financial_analysis_skill"),
    betas=["skills-2025-10-02"]
)

# 方式 2：使用 zip 文件
skill = client.beta.skills.create(
    display_title="Financial Analysis",
    files=[("skill.zip", open("financial_analysis_skill.zip", "rb"))],
    betas=["skills-2025-10-02"]
)

print(f"Created skill: {skill.id}")
print(f"Latest version: {skill.latest_version}")
```

**上传要求**：
- 必须包含顶层的 SKILL.md 文件
- 所有文件路径必须指定共同的根目录
- 总上传大小不超过 8MB
- Frontmatter 必须符合字段要求

## 高级用法

### 文件下载

当 Skills 创建文档（Excel、PowerPoint、PDF、Word）时，需要通过 Files API 下载：

```python
import anthropic

client = anthropic.Anthropic()

# 步骤 1：使用 Skill 创建文件
response = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "skills": [
            {"type": "anthropic", "skill_id": "xlsx", "version": "latest"}
        ]
    },
    messages=[{
        "role": "user",
        "content": "创建一个简单的预算电子表格"
    }],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)

# 步骤 2：从响应中提取 file_id
def extract_file_ids(response):
    file_ids = []
    for item in response.content:
        if item.type == 'bash_code_execution_tool_result':
            content_item = item.content
            if content_item.type == 'bash_code_execution_result':
                for file in content_item.content:
                    if hasattr(file, 'file_id'):
                        file_ids.append(file.file_id)
    return file_ids

# 步骤 3：使用 Files API 下载文件
for file_id in extract_file_ids(response):
    # 获取文件元数据
    file_metadata = client.beta.files.retrieve_metadata(
        file_id=file_id,
        betas=["files-api-2025-04-14"]
    )
    # 下载文件内容
    file_content = client.beta.files.download(
        file_id=file_id,
        betas=["files-api-2025-04-14"]
    )
    # 保存到本地
    file_content.write_to_file(file_metadata.filename)
    print(f"已下载: {file_metadata.filename}")
```

### 处理长时间操作（pause_turn）

Skills 可能执行需要多个轮次的长时间操作，需要处理 `pause_turn` 停止原因：

```python
import anthropic

client = anthropic.Anthropic()

messages = [{"role": "user", "content": "处理这个大型数据集"}]
max_retries = 10

response = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "skills": [
            {"type": "custom", "skill_id": "skill_01AbCdEfGhIjKlMnOpQrStUv", "version": "latest"}
        ]
    },
    messages=messages,
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)

# 循环处理 pause_turn
for i in range(max_retries):
    if response.stop_reason != "pause_turn":
        break  # 操作完成

    # 将响应添加到消息历史
    messages.append({"role": "assistant", "content": response.content})

    # 继续对话，让 Claude 继续执行
    response = client.beta.messages.create(
        model="claude-sonnet-4-5-20250929",
        max_tokens=4096,
        betas=["code-execution-2025-08-25", "skills-2025-10-02"],
        container={
            "id": response.container.id,  # 复用容器
            "skills": [
                {"type": "custom", "skill_id": "skill_01AbCdEfGhIjKlMnOpQrStUv", "version": "latest"}
            ]
        },
        messages=messages,
        tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
    )

print("长时间操作完成")
```

### 多轮对话中复用容器

在多轮对话中复用同一个容器，保留执行状态：

```python
# 第一个请求创建容器
response1 = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "skills": [
            {"type": "anthropic", "skill_id": "xlsx", "version": "latest"}
        ]
    },
    messages=[{"role": "user", "content": "分析这些销售数据"}],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)

# 继续对话，复用同一个容器
messages = [
    {"role": "user", "content": "分析这些销售数据"},
    {"role": "assistant", "content": response1.content},
    {"role": "user", "content": "总收入是多少？"}
]

response2 = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "id": response1.container.id,  # 复用容器 ID
        "skills": [
            {"type": "anthropic", "skill_id": "xlsx", "version": "latest"}
        ]
    },
    messages=messages,
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)
```

### 使用多个 Skills

在一个请求中组合多个 Skills 处理复杂工作流：

```python
response = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    max_tokens=4096,
    betas=["code-execution-2025-08-25", "skills-2025-10-02"],
    container={
        "skills": [
            {"type": "anthropic", "skill_id": "xlsx", "version": "latest"},
            {"type": "anthropic", "skill_id": "pptx", "version": "latest"},
            {"type": "custom", "skill_id": "skill_01AbCdEfGhIjKlMnOpQrStUv", "version": "latest"}
        ]
    },
    messages=[{
        "role": "user",
        "content": "分析销售数据并创建演示文稿"
    }],
    tools=[{"type": "code_execution_20250825", "name": "code_execution"}]
)
```

## 限制和约束

### 请求限制

| 限制项 | 值 | 说明 |
|--------|-----|------|
| **每个请求最多 Skills 数** | 8 | 防止上下文过载 |
| **Skill 上传大小** | 8MB | 所有文件总和 |
| **name 字段长度** | 64 字符 | 仅小写字母/数字/连字符 |
| **description 字段长度** | 1024 字符 | 不能为空 |

### 环境约束

Skills 在隔离的代码执行容器中运行，有以下限制：

| 约束 | 影响 | 原因 |
|------|------|------|
| **无网络访问** | 不能调用外部 API | 确保结果可复现 |
| **无运行时包安装** | 只能使用预装包 | 保证环境稳定性 |
| **隔离环境** | 每个请求新容器 | 防止状态污染 |

查看可用的预装包：[Code Execution Tool 文档](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool)

### 管理限制

- 删除 Skill 前必须先删除所有版本
- 不能修改已发布的版本
- 版本号自动生成，不可自定义

## 最佳实践

### 1. Skill 设计原则

- **单一职责**：每个 Skill 专注于一个明确的任务
- **清晰描述**：在 description 中详细说明适用场景（被 Claude 用于匹配）
- **结构化指令**：使用标题、列表等组织指令内容
- **提供示例**：包含具体的使用示例帮助理解

### 2. 指令编写技巧

- **具体明确**：避免模糊的要求，给出具体标准
- **提供上下文**：说明为什么要这样做
- **包含检查点**：列出需要验证的事项
- **定义输出格式**：明确期望的输出结构

### 3. 版本管理策略

**开发环境**：
```python
# 使用 latest 快速迭代
container={"skills": [{"skill_id": "my-skill", "version": "latest"}]}
```

**生产环境**：
```python
# 锁定特定版本确保稳定
container={"skills": [{"skill_id": "my-skill", "version": "1759178010641129"}]}
```

### 4. Prompt Caching 注意事项

> 重要：更改 Skills 列表会破坏 Prompt Cache

```python
# 第一个请求创建缓存
response1 = client.beta.messages.create(
    betas=["code-execution-2025-08-25", "skills-2025-10-02", "prompt-caching-2024-07-31"],
    container={"skills": [{"type": "anthropic", "skill_id": "xlsx", "version": "latest"}]},
    ...
)

# 添加/删除 Skills 会导致 cache miss
response2 = client.beta.messages.create(
    betas=["code-execution-2025-08-25", "skills-2025-10-02", "prompt-caching-2024-07-31"],
    container={"skills": [
        {"type": "anthropic", "skill_id": "xlsx", "version": "latest"},
        {"type": "anthropic", "skill_id": "pptx", "version": "latest"}  # 缓存失效
    ]},
    ...
)
```

**建议**：在使用 Prompt Caching 时，保持 Skills 列表一致。

### 5. 错误处理

```python
try:
    response = client.beta.messages.create(...)
except anthropic.BadRequestError as e:
    if "skill" in str(e):
        print(f"Skill 错误: {e}")
        # 处理 Skill 相关错误
    else:
        raise
```

### 6. 性能优化

- **控制 description 长度**：建议 < 100 词（影响元数据加载）
- **分层加载资源**：大型文件放在单独目录，按需读取
- **避免冗余**：不要在多个 Skills 中重复相同内容
- **合理组合**：不要加载用不到的 Skills

## 总结

Anthropic 的 Agent Skills 为 AI Agent 的能力扩展提供了一个优雅且实用的解决方案：

**核心优势**：

1. **渐进式加载**：通过 Progressive Disclosure 的三级加载模型解决上下文爆炸问题
2. **高效可靠执行**：混合 LLM 推理与代码执行，脚本代码不占用上下文
3. **环境隔离**：每个请求独立容器，确保安全和一致性
4. **简单易用**：Markdown + YAML，学习成本低，易于维护
5. **版本控制**：内置版本管理，支持回滚和渐进式部署

**技术创新**：

- **Progressive Disclosure 三级架构**：元数据层（~100 tokens）→ 指令层（按需加载）→ 资源层（几乎零成本）
- **高效脚本执行**：脚本代码不进入上下文，仅输出占用 tokens，极大提升效率
- **文件系统访问**：配置和模板从文件读取，消除 LLM "记忆"错误
- **隔离容器环境**：每个请求全新环境，无网络访问，确保可复现性

**适用场景**：

- **企业级应用**：品牌规范、业务流程自动化、质量标准执行
- **个人生产力**：任务自动化、文档处理、数据分析和可视化
- **开发工具**：代码生成、测试、审查，遵循团队编码规范
- **教育培训**：课程辅导、作业批改、知识问答、学习路径规划

**行动建议**：

**🎯 Claude API 用户**：
- 尝试创建自己的 Skills，从简单的工作流开始
- 使用 MVP 方法迭代，从基础功能逐步完善
- 在生产环境锁定特定版本，确保稳定性

**🎯 企业团队**：
- 构建企业专属 Skills 库，标准化业务流程和质量规范
- 使用 Git 管理 Skills 版本，配合 CI/CD 自动部署
- 建立 Skills 治理流程，确保质量和一致性

Skills 展示了如何在保持灵活性的同时，让 AI Agent 变得更加可靠、一致和可维护——这是 AI 从实验走向生产的关键一步。

## 参考资料

### 官方文档

1. [Anthropic Skills GitHub Repository](https://github.com/anthropics/skills) - 官方 Skills 仓库和示例
2. [Agent Skills API Guide](https://platform.claude.com/docs/en/api/skills-guide) - 完整 API 使用指南
3. [Agent Skills Overview](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview) - Skills 概览和技术架构
4. [Skill Authoring Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices) - 官方最佳实践
5. [Anthropic Engineering Blog - Agent Skills](https://anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) - 技术深度解析
6. [Code Execution Tool Documentation](https://platform.claude.com/docs/en/agents-and-tools/tool-use/code-execution-tool) - 代码执行环境
7. [Using Skills in Claude](https://support.claude.com/en/articles/12512180-using-skills-in-claude) - 用户指南
8. [Creating Custom Skills](https://support.claude.com/en/articles/12512198-creating-custom-skills) - 创建指南

### 社区资源和深度分析

9. [Agent Skills Specification](http://agentskills.io) - 跨平台标准规范
10. [Claude Skills vs. MCP Technical Comparison](https://intuitionlabs.ai/articles/claude-skills-vs-mcp) - 深入对比 Skills 和 MCP
11. [Claude Agent Skills: First Principles Deep Dive](https://leehanchung.github.io/blogs/2025/10/26/claude-skills-deep-dive/) - 从第一性原理分析
12. [Progressive Disclosure in Agent Skills](https://www.marthakelly.com/blog/progressive-disclosure-agent-skills) - 渐进式披露设计模式
13. [Building an internal agent: Progressive disclosure and handling large files](https://lethain.com/agents-large-files/) - 实际工程应用
