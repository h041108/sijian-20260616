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
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-lg">🧭</div>
        <div>
          <h1 className="text-xl font-bold text-[#E8E8F0]">AI持续运营</h1>
          <p className="text-sm text-[#9898B0]">告诉我你的情况，AI多角度诊断最合适的赛道方向</p>
        </div>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div>
          <label className="text-sm font-medium text-[#E8E8F0] mb-2 block">目标平台</label>
          <div className="flex items-center gap-2 flex-wrap">
            {["小红书", "抖音", "视频号", "B站"].map(p => (
              <button key={p} onClick={() => setPlatform(p)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                  platform === p
                    ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]"
                    : "bg-[#0C0C14] border-[#2A2A38] text-[#5A5A72] hover:text-[#9898B0]"
                }`}>{p}</button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-[#E8E8F0] mb-2 block">描述你的情况</label>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder="例如：我平时喜欢做饭，想在小红书上做美食博主，但不知道从哪开始，帮我分析一下适合什么方向"
            rows={4}
            className="w-full resize-none rounded-xl bg-[#0C0C14] border border-[#F59E0B]/10 text-[#E8E8F0] text-sm placeholder-[#5A5A72] focus:outline-none focus:border-[#F59E0B]/40 px-4 py-3" />
        </div>

        <button onClick={handleSubmit} disabled={loading || !input.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold hover:opacity-90 disabled:opacity-40 transition-opacity">
          {loading ? "AI多角度分析中..." : "🚀 开始诊断"}
        </button>
      </div>

      {error && <div className="rounded-xl p-4 bg-red-500/10 border border-red-500/20 text-sm text-red-400">{error}</div>}

      {result && (
        <div className="space-y-4">
          {/* 整合方案 */}
          <div className="glass-card p-5 border-[#F59E0B]/15 bg-[#F59E0B]/[0.04]">
            <div className="text-xs font-semibold text-[#F59E0B] mb-3">📋 诊断结果</div>
            <pre className="text-sm text-[#E8E8F0] whitespace-pre-wrap font-sans leading-relaxed">{result.summary}</pre>
          </div>

          {/* 详细过程（折叠） */}
          {result.details?.length > 0 && (
            <details className="glass-card overflow-hidden group">
              <summary className="px-5 py-3 text-xs text-[#9898B0] cursor-pointer hover:text-[#FBBF24] font-medium">查看分析过程</summary>
              <div className="px-5 pb-4 space-y-3 border-t border-[#2A2A38] pt-3">
                {result.details.map((d: any, i: number) => (
                  <div key={i}>
                    <div className="text-xs font-semibold text-[#F59E0B] mb-1">{d.agentName}</div>
                    <pre className="text-[10px] text-[#5A5A72] whitespace-pre-wrap line-clamp-2">{d.output.slice(0, 200)}</pre>
                  </div>
                ))}
              </div>
            </details>
          )}

          <div className="text-[10px] text-[#5A5A72] text-right">耗时 {(result.totalTime / 1000).toFixed(1)}s</div>
        </div>
      )}
    </div>
  )
}
