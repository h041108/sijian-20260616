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
  platform?: string
  onTemplateReady: (template: ViralTemplate, oneLiner: string) => void
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

export default function ReferenceUrlInput({ niche, platform = "小红书", onTemplateReady }: ReferenceUrlInputProps) {
  const [url, setUrl] = useState("")
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState("")
  const [error, setError] = useState("")

  const detectedPlatform = detectPlatform(url) || platform

  const handleAnalyze = useCallback(async () => {
    if (!url.trim()) return
    setAnalyzing(true)
    setError("")
    setResult("")

    try {
      const searchQuery = `${niche} ${detectedPlatform}`
      const res = await fetch("/api/trends/deconstruct", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, platform: detectedPlatform }),
      })
      const data = await res.json()

      if (data.viralTemplates?.length > 0) {
        const t = data.viralTemplates[0] as ViralTemplate
        t.sourceTitle = data.rawResults?.[0]?.title || `${detectedPlatform}爆款参考`
        onTemplateReady(t, `创作一条关于${niche}的${detectedPlatform}爆款内容，参考同类爆款的结构和节奏`)
        setResult(`✅ 已分析 ${detectedPlatform} 爆款结构`)
      } else {
        onTemplateReady({
          hookStyle: "反常识/悬念开篇", scriptStructure: "问题→解决方案→总结",
          pacing: "前3秒钩子", emotionalCurve: "好奇→信任→行动",
          conversionTactic: "引导评论收藏", visualStyle: "高清",
          keywords: [niche, detectedPlatform], sourceTitle: "通用爆款结构",
        }, `创作一条关于${niche}的${detectedPlatform}内容`)
        setError(data.message || "已注入基础结构")
      }
    } catch {
      onTemplateReady({
        hookStyle: "反常识开篇", scriptStructure: "问题→解决方案",
        pacing: "前3秒钩子", emotionalCurve: "好奇→信任",
        conversionTactic: "引导互动", visualStyle: "高清",
        keywords: [niche, detectedPlatform], sourceTitle: "通用爆款结构",
      }, `创作一条关于${niche}的${detectedPlatform}内容`)
      setError("分析失败，已注入基础结构")
    }
    setAnalyzing(false)
  }, [url, niche, detectedPlatform, onTemplateReady])

  const getSiteIcon = (u: string) => {
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

  return (
    <div className="bg-[#0C0C14] rounded-xl border border-white/[0.06] p-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/40">🔗</span>
        <span className="text-[10px] text-white/40">粘贴链接自动分析</span>
        {result && <span className="text-[9px] text-green-400 ml-auto">{result}</span>}
        {url && detectedPlatform && <span className="text-[9px] text-white/30 ml-auto">识别平台：{detectedPlatform}</span>}
      </div>
      <div className="flex gap-1">
        <div className="flex-1 relative">
          {url && <span className="absolute left-2 top-1/2 -translate-y-1/2 text-sm">{getSiteIcon(url)}</span>}
          <input value={url} onChange={e => setUrl(e.target.value)}
            placeholder={`粘贴${detectedPlatform || platform}链接...`}
            onKeyDown={e => e.key === "Enter" && handleAnalyze()}
            className={`w-full ${url ? "pl-8" : "pl-3"} pr-3 py-2 text-[10px] rounded-lg bg-[#1A1A2E] border border-white/10 text-white/60 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40`} />
        </div>
        <button onClick={handleAnalyze} disabled={analyzing || !url.trim()}
          className="px-3 py-2 text-[10px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold disabled:opacity-40 whitespace-nowrap">
          {analyzing ? "分析中..." : `🔍 分析${detectedPlatform || platform}爆款`}
        </button>
      </div>
      {error && <div className="text-[9px] text-amber-400/80">{error}</div>}
      {url && detectedPlatform && (
        <div className="text-[8px] text-white/20">已识别平台：{detectedPlatform} · 搜索关键词：{niche} {detectedPlatform}</div>
      )}
    </div>
  )
}
