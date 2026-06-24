"use client"
import { useState, useCallback } from "react"

const PLATFORMS = ["小红书", "抖音", "视频号", "B站"]

export default function Agent14Page() {
  const [content, setContent] = useState("")
  const [platform, setPlatform] = useState("小红书")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState("")

  const handleSubmit = useCallback(async () => {
    if (!content.trim()) return
    setLoading(true); setError(""); setResult(null)
    try {
      const res = await fetch("/api/agent/agent_14", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: content.trim(), context: { userProfile: { platform } } }),
      })
      const d = await res.json()
      if (d.success) setResult(d); else setError(d.error || "生成失败")
    } catch { setError("网络错误") } finally { setLoading(false) }
  }, [content, platform])

  const copyAll = useCallback(() => {
    if (!result?.structuredOutput) return
    const tags = [
      ...(result.structuredOutput.coreTags || []).map((t: any) => t.tag),
      ...(result.structuredOutput.longTailTags || []).map((t: any) => t.tag),
      ...(result.structuredOutput.trendingTags || []).map((t: any) => t.tag),
    ].join(" ")
    navigator.clipboard.writeText(tags)
  }, [result])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">&#x1F3F7;</span>
        <div><h1 className="text-xl font-bold text-gray-800">标签SEO专家</h1><p className="text-sm text-gray-400">输入文案自动生成标签方案</p></div>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-600">平台：</label>
          {PLATFORMS.map(p => (
            <button key={p} onClick={() => setPlatform(p)}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${platform === p ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200"}`}>{p}</button>
          ))}
        </div>
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="粘贴文案内容..." rows={4}
          className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={handleSubmit} disabled={loading || !content.trim()}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300">{loading ? "生成中..." : "生成标签方案"}</button>
      </div>
      {error && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{error}</div>}
      {result && (
        <div className="space-y-4">
          {result.structuredOutput?.strategy && (
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4">
              <p className="text-sm text-indigo-700">{result.structuredOutput.strategy}</p>
            </div>
          )}
          {result.structuredOutput?.optimizedTitle && (
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="text-xs text-gray-400 mb-1">优化标题</div>
              <div className="text-sm font-medium text-gray-800">{result.structuredOutput.optimizedTitle}</div>
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            {result.structuredOutput?.coreTags && (
              <div className="bg-white border border-blue-200 rounded-xl p-4">
                <div className="text-xs text-blue-600 font-semibold mb-2">核心标签</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.structuredOutput.coreTags.map((t: any, i: number) => (
                    <span key={i} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full border border-blue-200">{t.tag}</span>
                  ))}
                </div>
              </div>
            )}
            {result.structuredOutput?.longTailTags && (
              <div className="bg-white border border-green-200 rounded-xl p-4">
                <div className="text-xs text-green-600 font-semibold mb-2">长尾标签</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.structuredOutput.longTailTags.map((t: any, i: number) => (
                    <span key={i} className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded-full border border-green-200">{t.tag}</span>
                  ))}
                </div>
              </div>
            )}
            {result.structuredOutput?.trendingTags && (
              <div className="bg-white border border-orange-200 rounded-xl p-4">
                <div className="text-xs text-orange-600 font-semibold mb-2">热门标签</div>
                <div className="flex flex-wrap gap-1.5">
                  {result.structuredOutput.trendingTags.map((t: any, i: number) => (
                    <span key={i} className="px-2 py-1 text-xs bg-orange-50 text-orange-700 rounded-full border border-orange-200">{t.tag}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end">
            <button onClick={copyAll} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs hover:bg-gray-800">复制全部标签</button>
          </div>
        </div>
      )}
    </div>
  )
}