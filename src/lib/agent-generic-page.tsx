"use client"
import { useState, useCallback, useEffect } from "react"
import { AGENT_META } from "@/lib/agents/types"
import type { AgentId } from "@/lib/agents/types"

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
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">{meta?.icon || "🤖"}</span>
        <div>
          <h1 className="text-xl font-bold text-gray-800">{meta?.name || "AI 助手"}</h1>
          <p className="text-sm text-gray-400">{meta?.description || "输入内容，AI 自动处理"}</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <textarea value={input} onChange={e => setInput(e.target.value)}
          placeholder="输入你的需求..."
          rows={4} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={handleSubmit} disabled={loading || !input.trim()}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300">
          {loading ? "执行中..." : "🚀 执行"}
        </button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}
      {result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{result.mainOutput}</pre>
        </div>
      )}
    </div>
  )
}
