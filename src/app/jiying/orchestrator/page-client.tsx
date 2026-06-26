"use client"
import { useState, useCallback } from "react"

export default function TrackExpertPage() {
  const [input, setInput] = useState("")
  const [platform, setPlatform] = useState("小红书")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSubmit = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/orchestrator", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userInput: input.trim(), platform }),
      })
      const data = await res.json()
      if (data.success) setResult(data)
      else setError(data.error || "分析失败")
    } catch {
      setError("网络错误")
    } finally {
      setLoading(false)
    }
  }, [input, platform])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🧭</span>
        <div>
          <h1 className="text-xl font-bold text-gray-800">赛道诊断</h1>
          <p className="text-sm text-gray-400">告诉我你的情况，AI帮你诊断最合适的赛道方向</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">目标平台：</label>
          {["小红书", "抖音", "视频号", "B站"].map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={`px-3 py-1 text-xs rounded-full border ${platform === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200"}`}>{p}</button>
          ))}
        </div>

        <textarea value={input} onChange={e => setInput(e.target.value)}
          placeholder="例如：我平时喜欢做饭，想在小红书上做美食博主，但不知道从哪开始，帮我分析一下适合什么方向"
          rows={3}
          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />

        <button onClick={handleSubmit} disabled={loading || !input.trim()}
          className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-300 transition-colors">
          {loading ? "AI多角度分析中..." : "🚀 开始诊断"}
        </button>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}

      {result && (
        <div className="space-y-4">
          {/* 整合方案 */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
            <div className="text-xs font-semibold text-indigo-600 mb-2">📋 诊断结果</div>
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">{result.summary}</pre>
          </div>

          {/* 详细过程（折叠） */}
          {result.details?.length > 0 && (
            <details className="bg-white border border-gray-200 rounded-xl">
              <summary className="px-4 py-2.5 text-xs text-gray-500 cursor-pointer hover:text-gray-700 font-medium">查看分析过程</summary>
              <div className="px-4 pb-3 space-y-2">
                {result.details.map((d: any, i: number) => (
                  <div key={i} className="border-t border-gray-100 pt-2">
                    <div className="text-xs font-semibold text-gray-600 mb-1">{d.agentName}</div>
                    <pre className="text-[10px] text-gray-400 whitespace-pre-wrap line-clamp-2">{d.output.slice(0, 200)}</pre>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div className="text-[10px] text-gray-300 text-right">耗时 {(result.totalTime / 1000).toFixed(1)}s</div>
        </div>
      )}
    </div>
  )
}
