"use client"
import { useState, useCallback } from "react"

const MODELS = [
  { id: "midjourney", name: "Midjourney V7" },
  { id: "jimeng", name: "即梦4.0" },
  { id: "flux", name: "Flux Pro" },
  { id: "dalle3", name: "DALL-E 3" },
]

export default function Agent03Page() {
  const [description, setDescription] = useState("")
  const [style, setStyle] = useState("写实电影风格")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")
  const [activeModel, setActiveModel] = useState("midjourney")

  const handleSubmit = useCallback(async () => {
    if (!description.trim()) return
    setLoading(true); setError(""); setResult(null)
    try {
      const res = await fetch("/api/agent/agent_03", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: description.trim(), parameters: { style }, context: {} }),
      })
      const d = await res.json()
      if (d.success) setResult(d); else setError(d.error || "生成失败")
    } catch { setError("网络错误") } finally { setLoading(false) }
  }, [description, style])

  const copyPrompt = useCallback((text: string) => navigator.clipboard.writeText(text), [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🎨</span>
        <div><h1 className="text-xl font-bold text-gray-800">提示词大师</h1><p className="text-sm text-gray-400">一句话描述 → 4个顶级模型的优化prompt</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <input value={style} onChange={e => setStyle(e.target.value)} placeholder="艺术风格，如：写实电影风格"
          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="描述你想要生成的画面，例如：一位灰发少年站在废墟城市顶端，黄昏逆光，孤寂悲壮的氛围" rows={4}
          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={handleSubmit} disabled={loading || !description.trim()}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300">{loading ? "生成中..." : "✨ 生成提示词"}</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}
      {result?.structuredOutput?.prompts && (
        <div className="space-y-3">
          {result.structuredOutput.styleTips && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">💡 {result.structuredOutput.styleTips}</div>
          )}
          {result.structuredOutput.recommendedModel && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-2 text-xs text-green-700 text-center">推荐模型：{result.structuredOutput.recommendedModel}</div>
          )}
          <div className="flex gap-1.5 flex-wrap">
            {MODELS.map(m => (
              <button key={m.id} onClick={() => setActiveModel(m.id)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-colors ${activeModel === m.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>{m.name}</button>
            ))}
          </div>
          {result.structuredOutput.prompts[activeModel] && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-gray-600">{MODELS.find(m => m.id === activeModel)?.name}</span>
                <button onClick={() => copyPrompt(result.structuredOutput.prompts[activeModel])}
                  className="text-xs px-2 py-1 bg-white rounded-lg border text-indigo-600 hover:bg-indigo-50">📋 复制</button>
              </div>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{result.structuredOutput.prompts[activeModel]}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
