"use client"
import { useState, useCallback } from "react"
import Link from "next/link"
import { AGENT_META } from "@/lib/agents/types"

export function GenericAgentPage({ agentId }: { agentId: string }) {
  const meta = (AGENT_META as any)[agentId]
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true); setError(""); setResult(null)
    try {
      const res = await fetch("/api/agent/" + agentId, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: input.trim() }),
      })
      const d = await res.json()
      if (d.success) setResult(d); else setError(d.error || "执行失败")
    } catch { setError("网络错误") } finally { setLoading(false) }
  }, [input, agentId])

  return (
    <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
      {/* 返回 + 标题 */}
      <div className="flex items-center gap-3">
        <Link href="/jiying/agents"
          className="text-white/30 hover:text-white/60 text-sm transition-colors">← 返回</Link>
        <span className="text-3xl">{meta?.icon || "🤖"}</span>
        <div>
          <h1 className="text-xl font-bold text-[#E8E8F0]">{meta?.name || "AI 助手"}</h1>
          <p className="text-sm text-[#9898B0]">{meta?.description || "输入内容，AI 自动处理"}</p>
        </div>
      </div>

      {/* 输入区 */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 space-y-4">
        <textarea value={input} onChange={e => setInput(e.target.value)}
          placeholder="输入你的需求，智能体将为你分析并生成结果..."
          rows={5}
          className="w-full resize-none rounded-xl border border-white/[0.08] bg-[#0C0C14] px-4 py-3 text-sm text-[#E8E8F0] placeholder-[#5A5A72] focus:outline-none focus:border-[#F59E0B]/40 transition-colors" />
        <button onClick={handleSubmit} disabled={loading || !input.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold hover:shadow-lg hover:shadow-[#F59E0B]/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[#0C0C14]/30 border-t-[#0C0C14] rounded-full animate-spin" />
              执行中...
            </span>
          ) : "🚀 执行"}
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="rounded-xl bg-red-500/5 border border-red-500/15 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* 结果展示 */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs text-[#9898B0]">
            <span>✅ 执行完成</span>
            {result.qualityScore != null && <span>· 质量分 {result.qualityScore}/100</span>}
            {result.confidence != null && <span>· 置信度 {Math.round(result.confidence * 100)}%</span>}
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
            <pre className="text-sm text-[#E8E8F0] whitespace-pre-wrap font-sans leading-relaxed">{result.mainOutput}</pre>
          </div>
        </div>
      )}

      {/* 底部：返回工作流 */}
      <div className="text-center pt-4">
        <Link href="/jiying/agents/agent-router"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-white/40 text-xs hover:text-white/70 hover:border-white/20 transition-all">
          🎯 想组合多个智能体？进入工作流调度 →
        </Link>
      </div>
    </div>
  )
}
