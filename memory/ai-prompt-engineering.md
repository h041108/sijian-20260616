---
name: ai-prompt-engineering-best-practices
description: "Gold-standard AI system prompt structure, 7 prompt techniques, agent architecture patterns"
metadata: 
  node_type: memory
  type: reference
  originSessionId: c5c35651-f2e6-41ea-a6e1-2f3ecf78b7c3
---

# AI 系统提示词黄金结构（16+ AI 公司验证）

## 系统提示词四要素（必须按顺序）
1. **身份角色** — "你是十年快消品牌策略顾问"
2. **指令说明** — 明确的 do/don't，如"使用camelCase，不返回markdown"
3. **背景上下文** — RAG 知识、限制条件、参考数据
4. **输出格式** — JSON/Markdown/纯文本，字数上限

## 进阶模板
```
# 身份：你是一个[角色]
# 指令：规则列表（做什么 + 不做什么）+ 约束（字数/格式/语气）
# 示例：user/assistant 对话对
# 背景：参考文档/数据/限制条件
```

## 7 个提示词技巧（所有 LLM 通用）
1. 自然语言 → 完整句子，不用关键词堆砌
2. 具体且迭代 → 提供详细背景，不满意继续补充
3. 动词开头 → "写/分析/比较/总结/翻译"
4. 拆分任务 → 复杂任务分多次提问
5. 设定限制 → 字数/数量/格式/风格
6. 分配角色 → 具体身份显著改变输出质量
7. 指定语气 → 正式/轻松/幽默/专业

## Agent 架构（2025-2026 主流）
Agent = Perception + Reasoning + Action + Memory
- 短期记忆：上下文窗口
- 长期记忆：向量数据库
- 工具体系：Tool Calling / API 调用
- 安全护栏：Guardrails + 最大步数限制

## DeepSeek V3.2 缓存优化
- 缓存命中 $0.06/M tokens vs 未命中 $0.29/M（节省4.8倍）
- 规则：前缀稳定（system prompt+示例）在前，动态内容（用户输入）在末尾
