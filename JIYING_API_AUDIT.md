# 即影全链路API审计报告

## 审计结果总览

| API | 状态 | 行数 | 评分 | 关键问题 |
|-----|:----:|:----:|:----:|---------|
| `/api/agent/[id]` | ✅ | 37 | A | 干净，输入校验到位 |
| `/api/agents` | ✅ | 30 | A | 简单列表，无问题 |
| `/api/orchestrator` | ⚠️ | 37 | B | 意图分析只有5种模式，太简单 |
| `/api/chat` | ✅ | 264 | A | 功能完整，流式/搜索/流水线都有 |
| `/api/upload` | ✅ | 47 | A | 真正实现，50MB限制 |
| `/api/cognition` | ✅ | 90 | A | 完善的三层认知分析 |
| `/api/mindspace` | ⚠️ | 65 | B- | 纯内存Map，重启丢失 |
| `/api/video/seedance` | ✅ | 204 | A | 完整火山引擎ARK集成 |
| `/api/video/frame` | ✅ | 81 | A | Seedream 4.5集成+占位降级 |
| `/api/video/tts` | 🔴 | 16 | D | 只有壳，返回"用Seedance音频" |
| `/api/video/digital-human` | ✅ | 238 | A | 完整火山IAM V4签名，真实对接 |
| `/api/video/assemble` | ⚠️ | 35 | C | 返回指令让客户端合成，无服务端能力 |
| `/api/video/proxy-image` | ✅ | 62 | A | 带白名单的CORS代理 |
| `/api/trends/deconstruct` | ⚠️ | 99 | C | 有真实逻辑，但缺TAVILY_API_KEY时变占位 |

## 🔴 阻塞级问题 — 必须修

### 问题1：图片工作室 -> 实际不会生成图片

**路径**: `studio/page.tsx` → 调用 `callAgent("agent_03", ...)` → Agent 03 返回prompt文本 → **没有实际调用图像生成API**

```typescript
// studio_ui.tsx handleGenerate:
const result = await callAgent("agent_03", prompt)
// ❌ 拿到prompt文本后，没有调 /api/video/frame 或任何生图API
// ✅ 应该加：调 /api/video/frame 传prompt，拿到图片URL
```

**影响**: 用户点"生成"只会看到文字提示词，没有图

### 问题2：漫剧引擎 -> 导出MP4不可用

**路径**: `manga/page.tsx` → "导出MP4"按钮 `disabled={project.frames.length < 2}` → **没有对接任何视频合成能力**

```typescript
// manga/page.tsx: 导出按钮disabled是因为
// 1. 没有TTS API（/api/video/tts 只有16行空壳）
// 2. 没有服务端合成（/api/video/assemble 让客户端Canvas合成）
// 3. 前端Canvas合成没实现
```

**影响**: 漫剧最多编辑序列，无法导出成片

### 问题3：30秒审核 -> 内容来自mock，不真实

**路径**: `review/page.tsx` → `generateMockDailyItems()` → **生成硬编码假数据**

```typescript
// review-store.ts:
export function generateMockDailyItems(): DailyContentItem[] {
  // 返回3条写死的"冬日养生汤"示例
  // ❌ 没有调用Agent 13选题 + Agent 03创作
}
```

**影响**: 用户看到的是演示数据，不是给自己定制的

## 🟡 重要问题 — 建议修

### 问题4：Agent prompt质量不统一

15个Agent的 `systemPrompt` 质量差异大：
- Agent 00/02/10/14 — prompt写得好，输出格式明确
- Agent 04/05/06/07/08 — prompt太简单，只有3-5行说明

修复：统一重写所有Agent的prompt到专家级别

### 问题5：主调度Agent意图分析过于简单

```typescript
// orchestrator.ts analyzeIntent():
// 只用5个正则判断，太粗暴
// "生成一个封面图" 和 "帮我分析数据" 之外的情况全走默认
```

修复：用DeepSeek做意图分析，而不是正则

### 问题6：mindspace数据纯内存存储

`/api/mindspace` 用 `new Map<string, ...>()` 存数据，服务器重启全部丢失。需要接Supabase。

## 修复优先级建议

### 🔥 P0（阻塞体验，本周修）

| 问题 | 修复方案 | 预估工时 |
|------|---------|:--------:|
| ① 图片工作室连不上生图API | 调`/api/video/frame`传prompt，拿URL | 0.5天 |
| ② 漫剧导出MP4不能用 | 前端Canvas+MediaRecorder组装或走`/api/video/assemble` | 1天 |
| ③ 审核数据是假mock | 主调度Agent串联Agent 13→Agent 03→Agent 12→Agent 14生成真实内容 | 1天 |

### 💪 P1（品质提升，下周修）

| 问题 | 修复方案 | 预估工时 |
|------|---------|:--------:|
| ④ Agent prompt升级 | 逐个重写15个Agent的systemPrompt | 1.5天 |
| ⑤ 主调度意图分析 | 改用DeepSeek分析意图 | 0.5天 |
| ⑥ 内存存储→Supabase | 改造mindspace和review-store | 1天 |
