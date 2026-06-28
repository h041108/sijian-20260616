"use client"

import { useState, useCallback } from "react"

export interface ViralTemplate {
  hookStyle: string
  scriptStructure: string
  pacing: string
  emotionalCurve: string
  conversionTactic: string
  visualStyle: string
  keywords: string[]
}

interface ViralTrendPanelProps {
  onInject: (template: ViralTemplate) => void
  injected?: boolean
}

export default function ViralTrendPanel({ onInject, injected }: ViralTrendPanelProps) {
  const [keyword, setKeyword] = useState("")
  const [platform, setPlatform] = useState("抖音")
  const [searching, setSearching] = useState(false)
  const [result, setResult] = useState<{
    query: string
    rawResults: { title: string; snippet: string; url: string }[]
    viralTemplates?: ViralTemplate[]
    recommendedApproach?: string
    message?: string
  } | null>(null)
  const [error, setError] = useState("")

  const handleSearch = useCallback(async () => {
    if (!keyword.trim() || searching) return
    setSearching(true)
    setError("")
    setResult(null)
    try {
      const res = await fetch("/api/trends/deconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: keyword.trim(), platform }),
      })
      const data = await res.json()
      if (data.placeholder) {
        setError("需要配置 TAVILY_API_KEY 和 DEEPSEEK_API_KEY")
      } else if (data.viralTemplates?.length > 0 || data.message) {
        setResult(data)
        if (!data.viralTemplates?.length && data.message) {
          setError(data.message)
        }
      } else {
        setError("未找到相关爆款内容，请换一个关键词试试")
      }
    } catch { setError("搜索失败") }
    setSearching(false)
  }, [keyword, platform, searching])

  const handleInject = useCallback(() => {
    if (!result?.viralTemplates?.length) return
    // 合并多个模板的分析结果为一个综合模板
    const templates = result.viralTemplates
    const merged: ViralTemplate = {
      hookStyle: templates.map(t => t.hookStyle).filter(Boolean).join(" / ") || "反常识开篇",
      scriptStructure: templates.map(t => t.scriptStructure).filter(Boolean).join(" / ") || "问题→解决方案",
      pacing: templates.map(t => t.pacing).filter(Boolean).join(" / ") || "前3秒钩子",
      emotionalCurve: templates.map(t => t.emotionalCurve).filter(Boolean).join(" → ") || "好奇→信任",
      conversionTactic: templates.map(t => t.conversionTactic).filter(Boolean).join(" / ") || "限时优惠",
      visualStyle: templates.map(t => t.visualStyle).filter(Boolean).join(" / ") || "高质感",
      keywords: [...new Set(templates.flatMap(t => t.keywords || []))],
    }
    onInject(merged)
  }, [result, onInject])

  return (
    <div className="glass rounded-2xl p-4 space-y-3">
      <details open={!injected}>
        <summary className="text-xs text-white/50 font-medium cursor-pointer flex items-center gap-1">
          📈 爆款分析
          {injected && <span className="text-[#F59E0B] ml-1">✅ 已注入</span>}
        </summary>

        <div className="mt-3 space-y-3">
          {/* 搜索输入 */}
          <div className="flex gap-2">
            <input value={keyword} onChange={e => setKeyword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              placeholder="输入赛道关键词（如：扫地机器人带货）"
              className="flex-1 px-3 py-2 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/60 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />
            <select value={platform} onChange={e => setPlatform(e.target.value)}
              className="px-2 py-1 text-[10px] rounded-lg bg-[#0C0C14] border border-white/10 text-white/40 focus:outline-none">
              <option>抖音</option><option>小红书</option><option>B站</option>
            </select>
            <button onClick={handleSearch} disabled={searching || !keyword.trim()}
              className="px-4 py-1.5 text-[10px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold disabled:opacity-40">
              {searching ? "🔄" : "🔍 分析"}
            </button>
          </div>

          {/* 搜索结果 */}
          {searching && (
            <div className="text-center py-4 text-[10px] text-white/30 animate-pulse">
              🔍 正在搜索 {platform} 爆款内容...
            </div>
          )}

          {error && (
            <div className="text-[10px] text-red-400 bg-red-500/5 rounded-lg px-3 py-2">{error}</div>
          )}

          {result?.rawResults && result.rawResults.length > 0 && (
            <div className="space-y-1">
              <div className="text-[9px] text-white/30">搜索到 {result.rawResults.length} 条相关内容</div>
              <div className="max-h-24 overflow-y-auto space-y-1">
                {result.rawResults.slice(0, 3).map((r, i) => (
                  <div key={i} className="text-[9px] text-white/30 truncate bg-white/[0.02] rounded-lg px-2 py-1">
                    <span className="text-white/50">{r.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 拆解结果 */}
          {result?.viralTemplates && result.viralTemplates.length > 0 && (
            <div className="bg-[#0C0C14] rounded-xl p-3 space-y-2">
              <div className="text-[9px] text-[#F59E0B]/60 font-medium">🏆 爆款结构拆解</div>
              {result.viralTemplates[0] && (
                <div className="space-y-1">
                  {[
                    { label: "钩子策略", value: result.viralTemplates[0].hookStyle },
                    { label: "脚本结构", value: result.viralTemplates[0].scriptStructure },
                    { label: "节奏控制", value: result.viralTemplates[0].pacing },
                    { label: "情绪曲线", value: result.viralTemplates[0].emotionalCurve },
                    { label: "转化话术", value: result.viralTemplates[0].conversionTactic },
                    { label: "视觉风格", value: result.viralTemplates[0].visualStyle },
                  ].filter(i => i.value).map(item => (
                    <div key={item.label} className="flex gap-2 text-[9px]">
                      <span className="text-white/30 shrink-0 w-12">{item.label}</span>
                      <span className="text-white/60">{item.value}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleInject}
                className="w-full py-1.5 text-[10px] rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20 hover:bg-[#F59E0B]/25 font-medium">
                📥 注入到我的故事板
              </button>
            </div>
          )}

          {result?.recommendedApproach && (
            <div className="text-[9px] text-white/30 bg-white/[0.02] rounded-lg px-3 py-2">
              💡 建议：{result.recommendedApproach}
            </div>
          )}
        </div>
      </details>
    </div>
  )
}
