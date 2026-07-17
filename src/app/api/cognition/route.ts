// ─── 思见认知引擎 API ────────────────
// POST /api/cognition
// type=analysis（默认）：输入一段文本 → 返回 L1+L2+L3 全量诊断
// type=log：持久化认知日志到 Supabase

import { NextRequest, NextResponse } from "next/server"
import { detectThinkingLines } from "@/lib/thinking-lines"
import { fullCognitionAnalysis } from "@/lib/cognition"
import { saveCognitionLogEntry } from "@/lib/data-persistence"
import { getSupabase } from "@/lib/supabase"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type } = body

    // ── 持久化认知日志 ──
    if (type === "log") {
      const { timestamp, userId, state, intent, emotion, cognitiveLoad, dominantLines, messageLength, sessionId } = body
      if (!userId) {
        return NextResponse.json({ error: "userId 是必需的" }, { status: 400 })
      }
      try {
        // 尝试服务端 Supabase 持久化
        const supabase = getSupabase()
        if (supabase) {
          await supabase.from("cognition_logs").insert({
            user_id: userId, session_id: sessionId || "",
            state: state || "exploring", intent: intent || "exploring",
            emotion: emotion || "neutral", cognitive_load: cognitiveLoad || 0,
            dominant_lines: dominantLines || [], message_length: messageLength || 0,
          })
        } else {
          // 无 Supabase 配置时走 data-persistence（客户端调用时走 localStorage fallback）
          await saveCognitionLogEntry(userId, {
            timestamp: timestamp || new Date().toISOString(), userId,
            state: state || "exploring", intent: intent || "exploring",
            emotion: emotion || "neutral", cognitiveLoad: cognitiveLoad || 0,
            dominantLines: dominantLines || [], messageLength: messageLength || 0,
            sessionId: sessionId || "",
          })
        }
      } catch (e) {
        console.error("Cognition log persist error:", e)
      }
      return NextResponse.json({ success: true })
    }

    // ── 默认：认知分析 ──
    const { text, options } = body

    if (!text || typeof text !== "string" || text.trim().length < 4) {
      return NextResponse.json({
        error: "请输入至少4个字的文本进行分析",
        usage: "POST /api/cognition  Body: { text: '\u8981\u5206\u6790\u7684\u6587\u672c', options?: { previousState?: string, previousEmotion?: string } }",
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
    return NextResponse.json({ error: "\u8ba4\u77e5\u5206\u6790\u5931\u8d25" }, { status: 500 })
  }
}

// ── 标签中文化 ──
function stateLabelZh(s: string): string {
  const m: Record<string, string> = {
    exploring:"\u63a2\u7d22",focusing:"\u805a\u7126",stuck:"\u5361\u4f4f",curious:"\u597d\u5947",building:"\u6784\u5efa",questioning:"\u8d28\u7591",resting:"\u4f11\u606f"
  }
  return m[s] || s
}
function intentLabelZh(i: string): string {
  const m: Record<string, string> = {
    learning:"\u5b66\u4e60",solving:"\u89e3\u51b3",creating:"\u521b\u9020",deciding:"\u51b3\u7b56",understanding:"\u7406\u89e3",venting:"\u503e\u8bc9",exploring:"\u63a2\u7d22"
  }
  return m[i] || i
}
function emotionLabelZh(e: string): string {
  const m: Record<string, string> = {
    neutral:"\u5e73\u9759",curious:"\u597d\u5947",excited:"\u5174\u594b",frustrated:"\u53d7\u632b",anxious:"\u7126\u8651",tired:"\u75b2\u60eb",confident:"\u81ea\u4fe1",confused:"\u56f0\u60d1"
  }
  return m[e] || e
}
