# AI 与 Agent

这里整理 LLM 与 Agent 的学习笔记和工程实践。初次阅读可以从基础概念开始，已经在做项目的话，可以直接看架构、运行时和评测部分。

## 从基础概念开始

1. [Agent 入门：模型、工具与行动](huggingface/AIAgentCourse/UNIT1.md)：Hugging Face 课程的第一单元笔记。
2. [从 0 到 1 了解和使用 MCP](../../blog/posts/20250317_mcp_review.md)：理解模型与外部工具如何连接。
3. [Agent Skills 完整指南](../../blog/posts/20260103_skill_intro.md)：了解技能的组织方式和使用场景。

## 从概念走到工程实践

- **能力组织**：[5 种 Agent Skill 设计模式](../../blog/posts/20260322_skills_pattern.md)，以及[跨平台 Skills 实践记录](../../blog/posts/20260103_skills_cross.md)。
- **架构设计**：[LLM Agents 架构设计实践指南](../../blog/posts/20250504_llm_agent_arch.md) → [通用 CodeAgent 的落地实践](../../blog/posts/20251209_common_code_agent.md)。
- **运行时**：[从 CLI Agent 到本地 Agent Runtime](../../blog/posts/20260607_local_agent_runtime_agentara.md)，关注会话、任务、记忆和本地执行。
- **评测与反馈**：[科学评测 AI 应用](../../blog/posts/20251109_llm_evaluate_n_fold.md)，区分随机波动与稳定出现的问题。

## 继续学习

- [Agent 框架课程笔记](huggingface/AIAgentCourse/UNIT20.md)
- [Agentic RAG 案例笔记](huggingface/AIAgentCourse/UNIT30.md)
- [提示工程入门笔记](inbox/2412_prompt_begin.md)

文章和课程笔记记录的是写作时的实践；涉及工具版本和 API 时，请结合文章日期阅读。
