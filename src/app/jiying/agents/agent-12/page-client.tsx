"use client"
import { useState, useCallback } from "react"

const PLATFORMS = ["小红书", "抖音", "视频号", "B站"]

export default function Agent12Page() {
  const [topic, setTopic] = useState("")
  const [platform, setPlatform] = useState("小红书")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSubmit = useCallback(async () => {
    if (!topic.trim()) return
    setLoading(true); setError(""); setResult(null)
    try {
      const res = await fetch("/api/agent/agent_12", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: topic.trim(), context: { userProfile: { platform } } }),
      })
      const d = await res.json()
      if (d.success) setResult(d); else setError(d.error || "生成失败")
    } catch { setError("网络错误") } finally { setLoading(false) }
  }, [topic, platform])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🖼️</span>
        <div><h1 className="text-xl font-bold text-gray-800">封面灵感师</h1><p className="text-sm text-gray-400">输入主题，AI生成3套封面方案+点击率预测</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="flex gap-1.5 items-center">
          <label className="text-sm font-medium text-gray-600">平台：</label>
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={`px-3 py-1 text-xs rounded-full border ${platform === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200"}`}>{p}</button>
          ))}
        </div>
        <input value={topic} onChange={e => setTopic(e.target.value)} placeholder="输入内容主题，如：冬日养生汤食谱" className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={handleSubmit} disabled={loading || !topic.trim()}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300">{loading ? "生成中..." : "🎨 生成封面方案"}</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}
      {result?.structuredOutput?.schemes && (
        <div className="space-y-3">
          {result.structuredOutput.schemes.map((s: any, i: number) => (
            <div key={i} className={`rounded-2xl border p-4 ${i === result.structuredOutput.bestPick ? "border-indigo-300 bg-indigo-50/50" : "border-gray-200 bg-white"}`}>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-bold text-gray-800">{s.name}</h3>
                <span className="text-xs text-indigo-600 font-semibold">点击率 {s.predictedCTR}</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">视觉：{s.visual}</p>
              <div className="flex gap-1.5 mb-2">
                {s.colorPalette?.map((c: string, j: number) => (
                  <span key={j} className="w-6 h-6 rounded-full border border-gray-200" style={{backgroundColor: c}} title={c} />
                ))}
              </div>
              <p className="text-sm font-bold text-gray-800">{s.title}</p>
              {s.subtitle && <p className="text-xs text-gray-400">{s.subtitle}</p>}
              <p className="text-[10px] text-gray-400 mt-1">{s.layoutDescription}</p>
              <p className="text-[10px] text-green-600 mt-1">{s.strength}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
