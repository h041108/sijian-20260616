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

interface ReferenceUrlInputProps {
  niche: string
  platform: string
  onTemplateReady: (template: ViralTemplate, oneLiner: string) => void
}

export default function ReferenceUrlInput({ niche, platform, onTemplateReady }: ReferenceUrlInputProps) {
  const [url, setUrl] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<string>("")
  const [error, setError] = useState("")

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return
    setAnalyzing(true)
    setError("")
    setResult("")

    try {
      // 从 URL 提取关键词搜索（Tavily 搜不到特定 URL 的内容，只能搜关键词）
      const urlObj = new URL(url.startsWith("http") ? url : "https://" + url)
      const pathWords = urlObj.pathname.split("/").filter(w => w.length > 2).slice(0, 5).join(" ")
      const searchQuery = `${niche} ${pathWords || niche}`

      const res = await fetch("/api/trends/deconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, platform }),
      })
      const data = await res.json()

      if (data.viralTemplates?.length > 0) {
        const template = data.viralTemplates[0] as ViralTemplate
        template.sourceTitle = data.rawResults?.[0]?.title || niche + "爆款参考"
        // 生成一句话创意
        const oneLiner = `创作一条关于${niche}的${platform}爆款内容，参考同类爆款的结构和节奏`
        onTemplateReady(template, oneLiner)
        setResult(`✅ 已分析爆款结构：${template.hookStyle?.slice(0, 20)}...`)
      } else if (data.rawResults?.length > 0) {
        setError("已搜索到相关内容但未能拆解结构，已注入热搜方向")
        onTemplateReady({
          hookStyle: "反常识/悬念开篇",
          scriptStructure: "问题→解决方案→总结",
          pacing: "前3秒钩子，中间递进",
          emotionalCurve: "好奇→信任→行动",
          conversionTactic: "引导评论收藏",
          visualStyle: "高清实拍",
          keywords: [niche, platform],
          sourceTitle: data.rawResults[0]?.title || "参考内容",
        }, `创作一条关于${niche}的${platform}内容`)
      } else {
        setError(data.message || "未找到相关爆款，已注入基础结构")
        onTemplateReady({
          hookStyle: "反常识/悬念开篇",
          scriptStructure: "问题→解决方案→总结",
          pacing: "前3秒钩子，中间递进",
          emotionalCurve: "好奇→信任→行动",
          conversionTactic: "引导评论收藏",
          visualStyle: "高清",
          keywords: [niche, platform],
          sourceTitle: "通用爆款结构",
        }, `创作一条关于${niche}的${platform}内容`)
      }
    } catch {
      setError("分析失败，已注入基础结构")
      onTemplateReady({
        hookStyle: "反常识开篇",
        scriptStructure: "问题→解决方案",
        pacing: "前3秒钩子",
        emotionalCurve: "好奇→信任",
        conversionTactic: "引导互动",
        visualStyle: "高清",
        keywords: [niche, platform],
        sourceTitle: "通用爆款结构",
      }, `创作一条关于${niche}的${platform}内容`)
    }
    setAnalyzing(false)
  }, [url, niche, platform, onTemplateReady])

  // 提取平台图标
  const getSiteIcon = (u: string) => {
    if (u.includes("xiaohongshu") || u.includes("xhslink")) return "📕"
    if (u.includes("douyin")) return "🎵"
    if (u.includes("bilibili") || u.includes("b23")) return "📺"
    if (u.includes("youtube")) return "▶️"
    if (u.includes("twitter") || u.includes("x.com")) return "🐦"
    if (u.includes("instagram")) return "📷"
    if (u.includes("weixin") || u.includes("mp.weixin")) return "📱"
    return "🔗"
  }

  return (
    <div className="bg-[#0C0C14] rounded-xl border border-white/[0.06] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40">🔗</span>
        <span className="text-[10px] text-white/40">粘贴竞品链接自动分析</span>
        {result && <span className="text-[9px] text-green-400 ml-auto">{result}</span>}
      </div>
      <div className="flex gap-1">
        <div className="flex-1 relative">
          {url && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm">{getSiteIcon(url)}</span>}
          <input value={url} onChange={e => setUrl(e.target.value)}
            placeholder="粘贴小红书/抖音/B站链接..."
            onKeyDown={e => e.key === "Enter" && handleAnalyze()}
            className={`w-full ${url ? "pl-8" : "pl-3"} pr-3 py-2 text-[10px] rounded-lg bg-[#1A1A2E] border border-white/10 text-white/60 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40`} />
        </div>
        <button onClick={handleAnalyze} disabled={analyzing || !url.trim()}
          className="px-3 py-2 text-[10px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold disabled:opacity-40 whitespace-nowrap">
          {analyzing ? "分析中..." : "分析"}
        </button>
      </div>
      {error && <div className="text-[9px] text-amber-400/80">{error}</div>}
    </div>
  )
}
