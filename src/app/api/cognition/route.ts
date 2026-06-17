// ─── 思见认知引擎 API ──────────────────────────────
// POST /api/cognition
// 输入一段文本 → 返回 L1+L2+L3 全量诊断

import { NextRequest, NextResponse } from "next/server"
import { detectThinkingLines } from "@/lib/thinking-lines"
import { fullCognitionAnalysis } from "@/lib/cognition"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { text, options } = body

    if (!text || typeof text !== "string" || text.trim().length < 4) {
      return NextResponse.json({
        error: "请输入至少4个字的文本进行分析",
        usage: "POST /api/cognition  Body: { text: '要分析的文本', options?: { previousState?: string, previousEmotion?: string } }",
      }, { status: 400 })
    }

    const thinkingLines = detectThinkingLines(text.trim())
    const result = fullCognitionAnalysis(
      text.trim(),
      thinkingLines,
      options?.previousState,
      options?.previousEmotion,
      options?.messageHistory,
    )

    return NextResponse.json({
      text: text.slice(0, 100),
      cognition: {
        l1_thinking_state: {
          state: result.l1.state,
          stateLabel: stateLabelZh(result.l1.state),
          confidence: result.l1.confidence,
          dominantLines: result.l1.dominantLines,
          divergenceVsConvergence: result.l1.linePolarity,
          transition: result.l1.transition,
        },
        l2_cognitive_intent: {
          intent: result.l2.intent,
          intentLabel: intentLabelZh(result.l2.intent),
          confidence: result.l2.confidence,
          urgency: result.l2.urgency,
          patience: result.l2.patience,
        },
        l3_emotion_cognitive_load: {
          emotion: result.l3.emotion,
          emotionLabel: emotionLabelZh(result.l3.emotion),
          intensity: result.l3.intensity,
          cognitiveLoad: result.l3.cognitiveLoad,
          loadTrend: result.l3.cognitiveLoadTrend,
          signals: result.l3.signals,
        },
        meta: {
          summary: result.summary,
          suggestion: result.suggestion,
        },
      },
      thinkingLines: thinkingLines.slice(0, 5).map(l => ({
        lineId: l.lineId, confidence: l.confidence,
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Cognition API error:", error)
    return NextResponse.json({ error: "认知分析失败" }, { status: 500 })
  }
}

// ── 标签中文化 ──
function stateLabelZh(s: string): string {
  const m: Record<string, string> = {
    exploring:"探索",focusing:"聚焦",stuck:"卡住",curious:"好奇",building:"构建",questioning:"质疑",resting:"休息"
  }
  return m[s] || s
}
function intentLabelZh(i: string): string {
  const m: Record<string, string> = {
    learning:"学习",solving:"解决",creating:"创造",deciding:"决策",understanding:"理解",venting:"倾诉",exploring:"探索"
  }
  return m[i] || i
}
function emotionLabelZh(e: string): string {
  const m: Record<string, string> = {
    neutral:"平静",curious:"好奇",excited:"兴奋",frustrated:"受挫",anxious:"焦虑",tired:"疲倦",confident:"自信",confused:"困惑"
  }
  return m[e] || e
}
