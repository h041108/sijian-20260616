import { NextRequest, NextResponse } from "next/server"
import { chat, chatStream } from "@/lib/deepseek"
import { deepSearch } from "@/lib/search"
import { detectThinkingLines } from "@/lib/thinking-lines"
import { fullCognitionAnalysis } from "@/lib/cognition"
import { loadRegistry, decideOrchestration, runPipeline, type PipelineStep } from "@/lib/orchestrator"
import type { FrameType } from "@/lib/types"

// ─── 思维线路 → 框架类型映射 ───────────────────
// 28条思维线路各自对应最适合的11种可视化框架

const LINE_TO_FRAME: Record<string, FrameType> = {
  // 基础逻辑类
  induction: "tree",          // 归纳：层级提炼
  deduction: "pipeline",      // 演绎：推导流程
  causality: "pipeline",      // 因果：因果链
  analogy: "lens",            // 类比：透过A看B
  contrast: "helix",          // 对比：双股对照
  dialectic: "helix",         // 辩证：正反合
  reverse: "lens",            // 逆向：翻转视角

  // 学习理解类
  timeline: "pipeline",       // 时间线：有序推进
  layers: "strata",           // 分层：层层剖析
  pipeline: "pipeline",       // 流程：步骤推进
  memory: "tree",             // 记忆：层级结构
  feynman: "lens",            // 费曼：用简单解释复杂

  // 创造发散类
  divergent: "diffusion",     // 发散：涟漪扩散
  convergent: "lens",         // 聚焦：收敛到中心
  association: "network",     // 联想：网状跳转
  hypothesis: "tree",         // 假设：分支推演

  // 分析决策类
  critical: "lens",           // 批判：审视剖析
  argumentation: "tree",      // 论证：论点支撑
  proscons: "matrix",         // 利弊：网格权衡
  priority: "matrix",         // 优先级：矩阵排序

  // 系统思维类
  cycle: "cycle",             // 循环：闭环流转
  system: "network",          // 系统：关系网络
  bottleneck: "strata",       // 瓶颈：分层诊断

  // 目标行动类
  goal: "pipeline",           // 目标：路径推进
  review: "cycle",            // 复盘：循环迭代
  trialerror: "pipeline",     // 试错：迭代推进

  // 沟通表达类
  narrative: "pipeline",      // 叙事：线性展开
  qa: "lens",                 // 问答：聚焦解答
  example: "diffusion",       // 举例：单点扩散
  visualization: "spectrum",  // 可视线：连续谱
  structured: "matrix",       // 结构化：矩阵整理
  nvc: "lens",               // 非暴力沟通：换位透视
  empathy: "lens",           // 换位思考：视角切换

  // 元认知类
  metacognition: "lens",      // 元认知：自我审视
  first_principles: "tree",   // 第一性原理：逐层拆解

  // 实战应用类
  framework: "matrix",        // 框架：矩阵分析
  probability: "spectrum",    // 概率：连续分布
  game_theory: "matrix",      // 博弈：矩阵
  ethics: "lens",            // 伦理：道德透镜

  // 个体认知类
  emotion: "diffusion",       // 情绪：涟漪感知
  insight: "lens",            // 洞察：聚焦穿透
  flow: "pipeline",           // 心流：沉浸通道

  // 科学方法类
  modeling: "matrix",         // 建模：参数矩阵
  experiment: "pipeline",     // 实验：步骤流程
  fast_slow: "helix",         // 快慢思考：双轨

  // 习惯能力类
  habit: "cycle",             // 习惯：循环养成
  deliberate: "pipeline",     // 刻意练习：阶梯推进
  growth: "tree",             // 成长：层级跃迁
  feedback: "cycle",          // 反馈：循环迭代

  // 策略决策类
  second_order: "tree",       // 二阶思维：深层推演
  leverage: "lens",           // 杠杆：放大视角
  scenario: "matrix",         // 情景：矩阵推演
  opportunity_cost: "matrix", // 机会成本：权衡矩阵
  counterintuitive: "lens",   // 反直觉：颠覆视角

  // 认知偏误类
  blindspot: "lens",          // 盲点：照亮忽略处
  dunning_kruger: "strata",   // 自知：分层认知
  confirmation_bias: "helix", // 证实偏差：正反对照

  // 综合能力类
  simplify: "tree",           // 简化：提炼精华
  practice: "pipeline",       // 实践：行动路径
  compound: "pipeline",       // 复利：累积推进
  first_step: "pipeline",     // 行动：第一步
}

function resolveFrameType(thinkingLines: { lineId: string; confidence: number }[], aiFrameType?: string): FrameType {
  if (thinkingLines.length === 0) return (aiFrameType as FrameType) || "tree"

  // 取置信度最高的线路
  const top = thinkingLines[0]
  const mapped = LINE_TO_FRAME[top.lineId]

  // 如果映射的 frame 和 AI 的判断一致（或 AI 没判断），用线路映射
  if (mapped) {
    // 如果最高置信度线路 ≥ 0.6，直接用它映射的 frame
    if (top.confidence >= 0.6) return mapped

    // 如果有多个线路指向同一个 frame，加权确认
    const frameVotes = new Map<FrameType, number>()
    for (const tl of thinkingLines) {
      const f = LINE_TO_FRAME[tl.lineId]
      if (f) frameVotes.set(f, (frameVotes.get(f) || 0) + tl.confidence)
    }
    let bestFrame: FrameType = mapped
    let bestScore = 0
    for (const [f, score] of frameVotes) {
      if (score > bestScore) { bestScore = score; bestFrame = f }
    }
    return bestFrame
  }

  return (aiFrameType as FrameType) || "tree"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { messages, existingNodes, imageData, stream } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages is required" }, { status: 400 })
    }

    const lastUserMsg = messages[messages.length - 1]?.content || ""

    // Search enhancement
    const searchPatterns = [
      /下载/, /试卷/, /真题/, /考题/, /试题/, /高考/, /考卷/, /历年/,
      /中考/, /考研/, /考公/, /模拟/, /真题卷/, /真题答案/,
      /最新的/, /今年/, /2024/, /2025/, /2026/, /今天/, /新闻/, /最新/,
      /搜索/, /帮我查/, /帮我找/, /帮我搜/, /网上/, /查一下/,
      /找一下/, /现在/, /当前/, /最近/, /现在/, /目前/,
    ]
    const needsSearch = searchPatterns.some(p => p.test(lastUserMsg))

    let enhancedMessages = messages

    if (needsSearch) {
      const searchQuery = lastUserMsg
        .replace(/请|帮我|给我|能不能|可以|下载下来|下载|/g, "")
        .replace(/\s+/g, " ").trim().slice(0, 100)

      const searchContent = await deepSearch(searchQuery, 3)

      if (searchContent.length > 80) {
        enhancedMessages = messages.map((m: any, i: number) => {
          if (i === messages.length - 1 && m.role === "user") {
            return { role: m.role, content: `${m.content}\n\n[以下是联网搜索获取的最新真实信息。你必须基于这些信息回答]\n\n${searchContent.slice(0, 8000)}` }
          }
          return m
        })
      } else if (searchContent.length > 0) {
        enhancedMessages = messages.map((m: any, i: number) => {
          if (i === messages.length - 1 && m.role === "user") {
            return { role: m.role, content: `${m.content}\n\n[联网搜索尝试获取了信息但结果很少。请诚实告知用户搜索到的内容有限]` }
          }
          return m
        })
      }
    }

    const thinkingLines = detectThinkingLines(lastUserMsg)
    const registry = loadRegistry()

    // ── 编排决策：智能路由 + 流水线 vs 直连 ──
    const decision = decideOrchestration(lastUserMsg, registry)
    const pipelineRequested = stream && decision.mode === "pipeline" && decision.pipeline && decision.pipeline.length > 0

    if (pipelineRequested) {
      // 多模型流水线模式 — 生成→批判→润色或分析→检验→总结
      const pipelineResult = await runPipeline(decision.pipeline!, lastUserMsg, registry)
      const resolvedFrame = resolveFrameType(thinkingLines, "tree")
      const cognition = fullCognitionAnalysis(lastUserMsg, thinkingLines)
      return NextResponse.json({
        message: pipelineResult.finalOutput,
        mindSpaceUpdate: { nodes: [], edges: [], frameType: resolvedFrame },
        domain_type: "general",
        thinkingLines,
        cognition,
        _pipeline: { modelsUsed: pipelineResult.modelsUsed, totalLatency: pipelineResult.totalLatency },
      })
    }

    // ── 流式模式：SSE（单模型直连）──
    if (stream) {
      const cognition = fullCognitionAnalysis(lastUserMsg, thinkingLines)
      const s = await chatStream(enhancedMessages, existingNodes || [], imageData || null)

      // Wrap stream to inject cognition in the final "done" event
      const reader = s.getReader()
      const wrapped = new ReadableStream({
        async start(controller) {
          const decoder = new TextDecoder()
          let buf = ""
          while (true) {
            const { done, value } = await reader.read()
            if (value) {
              const text = decoder.decode(value, { stream: !done })
              buf += text
              // Check and rewrite "done" events
              const lines = buf.split("\n\n")
              buf = lines.pop() || ""
              for (const chunk of lines) {
                if (chunk.startsWith("data: ") && chunk.includes('"type":"done"')) {
                  try {
                    const json = JSON.parse(chunk.slice(6))
                    json.cognition = cognition
                    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(json)}\n\n`))
                  } catch {
                    controller.enqueue(new TextEncoder().encode(chunk + "\n\n"))
                  }
                } else {
                  controller.enqueue(new TextEncoder().encode(chunk + "\n\n"))
                }
              }
            }
            if (done) {
              if (buf.trim()) controller.enqueue(new TextEncoder().encode(buf))
              controller.close()
              break
            }
          }
        },
      })

      return new Response(wrapped, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
        },
      })
    }

    // ── 非流式模式（B端/工作流等调用） ──
    const result = await chat(enhancedMessages, existingNodes || [], imageData || null)
    const resolvedFrame = resolveFrameType(thinkingLines, result.mindSpaceUpdate?.frameType as string)
    if (result.mindSpaceUpdate) result.mindSpaceUpdate.frameType = resolvedFrame as any
    const cognition = fullCognitionAnalysis(lastUserMsg, thinkingLines)
    return NextResponse.json({ ...result, thinkingLines, cognition })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "AI 服务暂时不可用，请稍后重试。" }, { status: 500 })
  }
}
