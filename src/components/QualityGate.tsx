"use client"

import { useState, useCallback } from "react"

interface QualityResult {
  stage: string
  passed: boolean
  score: number
  grade: string
  details: Record<string, any>
  message: string
}

interface QualityGateProps {
  content?: string
  stage: "pre_compose" | "post_render"
  type?: "script" | "video" | "image"
  onCheckComplete?: (result: QualityResult) => void
}

export default function QualityGate({ content, stage, type = "script", onCheckComplete }: QualityGateProps) {
  const [result, setResult] = useState<QualityResult | null>(null)
  const [checking, setChecking] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCheck = useCallback(async () => {
    if (!content && stage === "pre_compose") return
    setChecking(true)
    try {
      const body: any = { stage, type }
      if (stage === "pre_compose") body.content = content
      if (stage === "post_render") {
        body.hasAudio = false
        body.frameCount = 30
        body.duration = 10
      }
      const res = await fetch("/api/quality/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      setResult(data)
      onCheckComplete?.(data)
    } catch {}
    setChecking(false)
  }, [content, stage, type, onCheckComplete])

  const gradeColors: Record<string, string> = {
    excellent: "bg-green-500/15 text-green-400 border-green-500/20",
    good: "bg-amber-500/15 text-amber-400 border-amber-500/20",
    weak: "bg-red-500/15 text-red-400 border-red-500/20",
  }

  const gradeLabels: Record<string, string> = {
    excellent: "优秀", good: "合格", weak: "需优化",
  }

  return (
    <div className="bg-[#0C0C14] rounded-xl border border-white/[0.06] overflow-hidden">
      <button onClick={() => { if (!result) handleCheck(); else setExpanded(!expanded) }}
        className="w-full px-3 py-2 flex items-center gap-2 text-[10px] text-white/40 hover:text-white/60 transition-colors">
        <span>{result ? (result.passed ? "✅" : "⚠️") : "🔍"}</span>
        <span>{result ? `${result.message} (${result.score}/100)` : stage === "pre_compose" ? "点击质检脚本质量" : "点击质检视频质量"}</span>
        <span className="ml-auto text-[8px]">{checking ? "检查中..." : result ? (expanded ? "▾" : "▸") : ""}</span>
      </button>

      {checking && <div className="px-3 pb-2 text-[8px] text-white/20 animate-pulse">质检中...</div>}

      {result && expanded && (
        <div className="px-3 pb-3 space-y-2">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-0.5 rounded text-[9px] border ${gradeColors[result.grade] || "bg-gray-500/15 text-gray-400"}`}>
              {gradeLabels[result.grade] || result.grade} · {result.score}/100
            </div>
            <span className="text-[9px] text-white/30">{result.passed ? "✅ 门禁通过" : "⚠️ 门禁未通过"}</span>
          </div>

          {result.details && (
            <div className="space-y-1 text-[8px] text-white/30">
              {Object.entries(result.details).map(([key, val]) => (
                <div key={key} className="flex gap-2">
                  <span className="text-white/20">{key}:</span>
                  <span>{Array.isArray(val) ? val.join(", ") : String(val)}</span>
                </div>
              ))}
            </div>
          )}

          {!result.passed && (
            <button onClick={handleCheck}
              className="w-full py-1 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] text-[9px] border border-[#F59E0B]/20 hover:bg-[#F59E0B]/25">
              🔄 重新质检
            </button>
          )}
        </div>
      )}
    </div>
  )
}
