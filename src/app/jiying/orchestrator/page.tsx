"use client"
import { useState, useCallback } from "react"

const PLATFORMS = ["小红书", "抖音", "视频号", "B站"]

type StepStatus = "pending" | "running" | "done" | "failed"

export default function OrchestratorPage() {
  const [input, setInput] = useState("")
  const [platform, setPlatform] = useState("小红书")
  const [niche, setNiche] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [pipelinePreview, setPipelinePreview] = useState<any>(null)

  const analyzeInput = useCallback(async () => {
    if (!input.trim()) return
    try {
      const res = await fetch(`/api/orchestrator?input=${encodeURIComponent(input.trim())}`)
      const d = await res.json()
      setPipelinePreview(d)
    } catch {}
  }, [input])

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true); setError(""); setResult(null)
    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: input.trim(), platform, niche: niche || undefined }),
      })
      const d = await res.json()
      if (d.success) setResult(d); else setError(d.error || "执行失败")
    } catch { setError("网络错误") } finally { setLoading(false) }
  }, [input, platform, niche])

  const statusIcon = (s: StepStatus) => {
    if (s === "done") return "✅"
    if (s === "running") return "⏳"
    if (s === "failed") return "❌"
    return "⏸️"
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🧠</span>
        <div><h1 className="text-xl font-bold text-gray-800">主调度Agent</h1><p className="text-sm text-gray-400">一句话指令 → 自动拆解 → 分配15个Agent执行 → 汇总结果</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-1.5 items-center flex-wrap">
          <label className="text-sm font-medium text-gray-600">平台：</label>
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={`px-3 py-1 text-xs rounded-full border ${platform === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200"}`}>{p}</button>
          ))}
          <input value={niche} onChange={e => setNiche(e.target.value)} placeholder="赛道（如：美食探店）"
            className="ml-2 px-3 py-1 text-xs rounded-full border border-gray-200 w-28 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
        </div>
        <textarea value={input} onChange={e => { setInput(e.target.value); setPipelinePreview(null) }}
          onBlur={analyzeInput}
          placeholder="描述你的需求，例如：我刚开了一个小红书账号做美食探店，帮我做好人设和今天的内容"
          rows={3} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        {pipelinePreview && (
          <div className="flex items-center gap-1.5 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-1.5">
            <span>🧠 分析为：{pipelinePreview.description}</span>
            <span className="text-gray-300">|</span>
            {pipelinePreview.agents?.map((a: any) => <span key={a.id}>{a.icon} {a.name}</span>)}
          </div>
        )}
        <button onClick={handleSubmit} disabled={loading || !input.trim()}
          className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300">{loading ? "执行中..." : "🚀 执行"}</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}
      {result && (
        <div className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 flex items-center justify-between">
            <span>{result.summary}</span>
            <span className="text-gray-400">{(result.totalTime / 1000).toFixed(1)}s</span>
          </div>
          {result.plan?.steps?.map((step: any, i: number) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{statusIcon(step.status)} {AGENT_META?.[step.agentId]?.icon || ""} {step.agentName}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${step.status === "done" ? "bg-green-100 text-green-700" : step.status === "failed" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500"}`}>{step.status}</span>
              </div>
              {step.output?.mainOutput && step.status === "done" && (
                <pre className="text-[10px] text-gray-500 whitespace-pre-wrap line-clamp-3">{step.output.mainOutput.slice(0, 300)}</pre>
              )}
            </div>
          ))}
          {result.results?.length > 0 && (
            <details className="bg-gray-50 border border-gray-200 rounded-xl">
              <summary className="px-3 py-2 text-xs text-gray-500 cursor-pointer hover:text-gray-700">查看完整JSON结果</summary>
              <pre className="px-3 pb-3 text-[10px] text-gray-400 whitespace-pre-wrap overflow-auto max-h-60">{JSON.stringify(result.results, null, 2)}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  )
}
const AGENT_META: Record<string, { icon: string }> = {
  agent_00: { icon: "🎯" }, agent_01: { icon: "🏢" }, agent_02: { icon: "👤" },
  agent_03: { icon: "🎨" }, agent_04: { icon: "🎬" }, agent_05: { icon: "🎵" },
  agent_06: { icon: "🔊" }, agent_07: { icon: "📊" }, agent_08: { icon: "📈" },
  agent_09: { icon: "🧠" }, agent_10: { icon: "📰" }, agent_11A: { icon: "📋" },
  agent_11B: { icon: "💬" }, agent_12: { icon: "🖼️" }, agent_13: { icon: "💡" }, agent_14: { icon: "🏷️" },
}
