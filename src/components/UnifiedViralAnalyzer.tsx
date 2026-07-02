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
  sourceTitle?: string
  sourceLikes?: number
}

interface UnifiedViralAnalyzerProps {
  niche: string
  platform?: string
  onTemplateReady: (template: ViralTemplate, oneLiner: string) => void
  /** 如果已注入，显示已注入状态 */
  injected?: boolean
  /** 是否显示"注入到故事板"按钮（微短剧模式用） */
  showInjectButton?: boolean
  /** 紧凑模式（用于嵌入到小空间） */
  compact?: boolean
}

function detectPlatform(url: string): string {
  const u = url.toLowerCase()
  if (u.includes("douyin") || u.includes("iesdouyin")) return "抖音"
  if (u.includes("xiaohongshu") || u.includes("xhslink") || u.includes("rednote")) return "小红书"
  if (u.includes("bilibili") || u.includes("b23.tv")) return "B站"
  if (u.includes("youtube") || u.includes("youtu.be")) return "YouTube"
  if (u.includes("kuaishou")) return "快手"
  if (u.includes("weixin") || u.includes("mp.weixin") || u.includes("wechat")) return "视频号"
  if (u.includes("twitter") || u.includes("x.com")) return "Twitter"
  if (u.includes("instagram")) return "Instagram"
  if (u.includes("tiktok")) return "TikTok"
  return ""
}

function getSiteIcon(url: string) {
  const u = url.toLowerCase()
  if (u.includes("xiaohongshu") || u.includes("xhslink")) return "📕"
  if (u.includes("douyin") || u.includes("iesdouyin")) return "🎵"
  if (u.includes("bilibili") || u.includes("b23")) return "📺"
  if (u.includes("youtube")) return "▶️"
  if (u.includes("twitter") || u.includes("x.com")) return "🐦"
  if (u.includes("instagram")) return "📷"
  if (u.includes("weixin") || u.includes("mp.weixin")) return "📱"
  if (u.includes("kuaishou")) return "📹"
  if (u.includes("tiktok")) return "🎵"
  return "🔗"
}

/**
 * 统一爆款分析器 — 合并了 ReferenceUrlInput 和 ViralTrendPanel
 * 
 * 支持两种模式：
 * 1. 粘贴链接自动分析（输入URL → 自动检测平台 → 分析爆款结构）
 * 2. 关键词搜索（输入关键词 → 选择平台 → 搜索并分析）
 * 
 * 底层逻辑：无论哪种输入，最终都是搜索同类爆款 → AI拆解结构 → 注入到创作参数
 */
export default function UnifiedViralAnalyzer({
  niche,
  platform = "小红书",
  onTemplateReady,
  injected = false,
  showInjectButton = false,
  compact = false,
}: UnifiedViralAnalyzerProps) {
  // ─── 爆款链接功能暂时隐藏，仅保留关键词搜索模式 ───
  const [keyword, setKeyword] = useState("")
  const [searchPlatform, setSearchPlatform] = useState(platform)

  // 通用
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState("")
  const [rawResults, setRawResults] = useState<{ title: string; snippet: string; url: string }[]>([])
  const [viralTemplates, setViralTemplates] = useState<ViralTemplate[]>([])
  const [recommendedApproach, setRecommendedApproach] = useState("")

  // ─── URL模式已隐藏，handleUrlAnalyze 暂不使用 ───

  // ─── 关键词模式搜索 ───
  const handleKeywordSearch = useCallback(async () => {
    if (!keyword.trim() || analyzing) return
    setAnalyzing(true)
    setError("")
    setResult("")
    setRawResults([])
    setViralTemplates([])

    try {
      const res = await fetch("/api/trends/deconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: keyword.trim(), platform: searchPlatform }),
      })
      const data = await res.json()
      if (data.viralTemplates?.length > 0 || data.message) {
        setViralTemplates(data.viralTemplates || [])
        setRawResults(data.rawResults || [])
        setRecommendedApproach(data.recommendedApproach || "")
        if (data.viralTemplates?.length > 0) {
          const t = data.viralTemplates[0] as ViralTemplate
          t.sourceTitle = data.rawResults?.[0]?.title || `${searchPlatform}爆款参考`
          onTemplateReady(t, `创作一条关于${keyword.trim()}的${searchPlatform}爆款内容`)
          setResult(`✅ 已分析 ${searchPlatform} 爆款结构`)
        }
        if (!data.viralTemplates?.length && data.message) {
          setError(data.message)
        }
      } else {
        setError("未找到相关爆款内容，请换一个关键词试试")
      }
    } catch { setError("搜索失败") }
    setAnalyzing(false)
  }, [keyword, searchPlatform, analyzing, onTemplateReady])

  // ─── 注入到故事板（微短剧模式用） ───
  const handleInject = useCallback(() => {
    if (viralTemplates.length === 0) return
    const merged: ViralTemplate = {
      hookStyle: viralTemplates.map(t => t.hookStyle).filter(Boolean).join(" / ") || "反常识开篇",
      scriptStructure: viralTemplates.map(t => t.scriptStructure).filter(Boolean).join(" / ") || "问题→解决方案",
      pacing: viralTemplates.map(t => t.pacing).filter(Boolean).join(" / ") || "前3秒钩子",
      emotionalCurve: viralTemplates.map(t => t.emotionalCurve).filter(Boolean).join(" → ") || "好奇→信任",
      conversionTactic: viralTemplates.map(t => t.conversionTactic).filter(Boolean).join(" / ") || "限时优惠",
      visualStyle: viralTemplates.map(t => t.visualStyle).filter(Boolean).join(" / ") || "高质感",
      keywords: [...new Set(viralTemplates.flatMap(t => t.keywords || []))],
      sourceTitle: rawResults[0]?.title,
    }
    onTemplateReady(merged, `创作一条关于${keyword || niche}的${searchPlatform}爆款内容`)
  }, [viralTemplates, rawResults, keyword, niche, searchPlatform, onTemplateReady])

  return (
    <div className={`bg-[#0C0C14] rounded-xl border border-white/[0.06] ${compact ? "p-2" : "p-3"} space-y-2`}>
      {/* 爆款关键词搜索（链接模式已隐藏） */}
      <div className="flex items-center gap-1">
        <span className="text-[10px] text-white/40 shrink-0">📈</span>
        <span className="text-[9px] text-white/40">搜索赛道关键词分析爆款</span>
        {injected && <span className="text-[9px] text-[#F59E0B] ml-auto">✅ 已注入</span>}
      </div>
      <div className="flex gap-1">
        <input value={keyword} onChange={e => setKeyword(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleKeywordSearch()}
          placeholder="输入赛道关键词（如：扫地机器人带货）"
          className="flex-1 px-3 py-2 text-[10px] rounded-lg bg-[#1A1A2E] border border-white/10 text-white/60 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40" />
        <select value={searchPlatform} onChange={e => setSearchPlatform(e.target.value)}
          className="px-2 py-1 text-[10px] rounded-lg bg-[#1A1A2E] border border-white/10 text-white/40 focus:outline-none">
          <option>抖音</option><option>小红书</option><option>B站</option><option>视频号</option><option>快手</option>
        </select>
        <button onClick={handleKeywordSearch} disabled={analyzing || !keyword.trim()}
          className="px-3 py-2 text-[10px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold disabled:opacity-40 whitespace-nowrap">
          {analyzing ? "🔄" : "🔍 分析"}
        </button>
      </div>

      {/* 错误提示 */}
      {error && <div className="text-[9px] text-amber-400/80">{error}</div>}

      {/* 分析中 */}
      {analyzing && (
        <div className="text-center py-2 text-[10px] text-white/30 animate-pulse">
          🔍 正在分析 {searchPlatform} 爆款内容...
        </div>
      )}

      {/* 搜索结果 */}
      {rawResults.length > 0 && (
        <div className="space-y-1">
          <div className="text-[9px] text-white/30">搜索到 {rawResults.length} 条相关内容</div>
          <div className="max-h-24 overflow-y-auto space-y-1">
            {rawResults.slice(0, 3).map((r, i) => (
              <div key={i} className="text-[9px] text-white/30 truncate bg-white/[0.02] rounded-lg px-2 py-1">
                <span className="text-white/50">{r.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 拆解结果 */}
      {viralTemplates.length > 0 && (
        <div className="bg-[#0C0C14] rounded-xl p-3 space-y-2">
          <div className="text-[9px] text-[#F59E0B]/60 font-medium">🏆 爆款结构拆解</div>
          {viralTemplates[0] && (
            <div className="space-y-1">
              {[
                { label: "钩子策略", value: viralTemplates[0].hookStyle },
                { label: "脚本结构", value: viralTemplates[0].scriptStructure },
                { label: "节奏控制", value: viralTemplates[0].pacing },
                { label: "情绪曲线", value: viralTemplates[0].emotionalCurve },
                { label: "转化话术", value: viralTemplates[0].conversionTactic },
                { label: "视觉风格", value: viralTemplates[0].visualStyle },
              ].filter(i => i.value).map(item => (
                <div key={item.label} className="flex gap-2 text-[9px]">
                  <span className="text-white/30 shrink-0 w-14">{item.label}</span>
                  <span className="text-white/60">{item.value}</span>
                </div>
              ))}
            </div>
          )}

          {showInjectButton && (
            <button onClick={handleInject}
              className="w-full py-1.5 text-[10px] rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20 hover:bg-[#F59E0B]/25 font-medium">
              📥 注入到我的故事板
            </button>
          )}
        </div>
      )}

      {recommendedApproach && (
        <div className="text-[9px] text-white/30 bg-white/[0.02] rounded-lg px-3 py-2">
          💡 建议：{recommendedApproach}
        </div>
      )}
    </div>
  )
}
