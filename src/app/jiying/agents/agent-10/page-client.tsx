"use client"
import { useState, useCallback } from "react"

const PLATFORMS = ["小红书", "抖音", "视频号", "B站"]
const DIM_LABELS: Record<string,string> = { emotion: "情绪驱动力", curiosity: "好奇缺口", specificity: "具体度", keywords: "关键词密度", length: "长度适配" }

function ScoreBar({ label, score, max, comment }: { label: string; score: number; max: number; comment: string }) {
  const pct = (score / max) * 100
  const color = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-yellow-500" : "bg-red-400"
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span className="text-gray-600 font-medium">{label}</span><span className="text-gray-400">{score}/{max}</span></div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className={"h-full rounded-full " + color} style={{ width: pct + "%" }} /></div>
      <p className="text-[10px] text-gray-400">{comment}</p>
    </div>
  )
}

export default function Agent10Page() {
  const [title, setTitle] = useState("")
  const [platform, setPlatform] = useState("小红书")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSubmit = useCallback(async () => {
    if (!title.trim()) return
    setLoading(true); setError(""); setResult(null)
    try {
      const res = await fetch("/api/agent/agent_10", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: title.trim(), context: { userProfile: { platform } } }),
      })
      const d = await res.json()
      if (d.success) setResult(d); else setError(d.error || "分析失败")
    } catch { setError("网络错误") } finally { setLoading(false) }
  }, [title, platform])

  const copyTitle = useCallback((t: string) => navigator.clipboard.writeText(t), [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">&#x1F4F0;</span>
        <div><h1 className="text-xl font-bold text-gray-800">爆款标题拆解师</h1><p className="text-sm text-gray-400">5维度评分+3版优化</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">平台：</label>
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={`px-3 py-1 text-xs rounded-full border ${platform === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200"}`}>{p}</button>
          ))}
        </div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="输入标题..."
          className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={handleSubmit} disabled={loading || !title.trim()}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300">{loading ? "分析中..." : "分析标题"}</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}
      {result?.structuredOutput && (
        <div className="space-y-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 text-center">
            <div className="text-4xl font-extrabold text-gray-800 mb-1">{result.structuredOutput.score || "?"}</div>
            <div className="text-xs text-gray-400">/ 100 分</div>
            {result.structuredOutput.summary && <p className="text-sm text-gray-600 mt-2">{result.structuredOutput.summary}</p>}
          </div>
          {result.structuredOutput.dimensions && (
            <div className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3">
              <h3 className="text-xs font-semibold text-gray-500">五维度评分</h3>
              {Object.entries(result.structuredOutput.dimensions).map(([k, v]: [string, any]) => (
                <ScoreBar key={k} label={DIM_LABELS[k] || k} score={v.score} max={v.max} comment={v.comment} />
              ))}
            </div>
          )}
          {result.structuredOutput.suggestions?.map((s: any, i: number) => (
            <div key={i} className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800">{s.title}</div>
                <div className="text-[10px] text-gray-400">{s.reason} 预计{s.expectedScore}分</div>
              </div>
              <button onClick={() => copyTitle(s.title)} className="shrink-0 px-2.5 py-1.5 bg-white rounded-lg text-xs text-indigo-600 border border-indigo-200 hover:bg-indigo-50">复制</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}