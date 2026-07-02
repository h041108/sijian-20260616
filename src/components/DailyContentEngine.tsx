"use client"

import { useState, useCallback, useEffect } from "react"
import { useJiyingUser } from "@/app/jiying/layout"
import { addGeneratedToMediaLibrary } from "@/lib/media-library"
import { buildPrompt, buildRewritePrompt, buildDeconstructPromptForSelection, type ViralTemplate } from "@/lib/prompt-engine"
import UnifiedViralAnalyzer from "./UnifiedViralAnalyzer"

interface ContentOption {
  id: string
  title: string
  content: string
  imageUrl?: string
  hashtags: string[]
}

interface DeconstructDetail {
  hookStyle: string
  scriptStructure: string
  pacing: string
  emotionalCurve: string
  conversionTactic: string
  visualStyle: string
  keywords: string[]
  rawAnalysis?: string   // AI完整拆解分析文本
}

// ─── 默认赛道（兜底用）───
const FALLBACK_NICHES = ["美食", "美妆", "穿搭", "数码", "教育", "生活", "健康", "母婴", "旅行", "家居", "宠物", "汽车", "游戏", "影视", "科技", "健身", "金融投资", "程序开发", "自媒体运营", "知识付费"]

export default function DailyContentEngine() {
  const { user } = useJiyingUser()
  const [loading, setLoading] = useState(true)
  const [niche, setNiche] = useState("")
  const [platform, setPlatform] = useState("小红书")
  const [error, setError] = useState("")

  // ─── 用户赛道（从账号分析结果读取，去硬编码）───
  const [userNiches, setUserNiches] = useState<string[]>([])

  // 爆款搜索
  const [viralCandidates, setViralCandidates] = useState<any[]>([])
  const [searchingViral, setSearchingViral] = useState(false)
  const [selectedViral, setSelectedViral] = useState<any>(null)
  const [viralTemplate, setViralTemplate] = useState<ViralTemplate | null>(null)
  const [deconstructing, setDeconstructing] = useState(false)
  const [deconstructDetail, setDeconstructDetail] = useState<DeconstructDetail | null>(null)
  const [showDeconstructDetail, setShowDeconstructDetail] = useState(false)

  // 内容生成
  const [generating, setGenerating] = useState(false)
  const [contentOptions, setContentOptions] = useState<ContentOption[]>([])
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [contentSamples, setContentSamples] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("jiying_account_analysis") || "{}")
      if (saved.contentSamples && Array.isArray(saved.contentSamples)) return saved.contentSamples.slice(0, 3)
    } catch {}
    return []
  })

  // ─── 发送时间设置 ───
  const [sendTime, setSendTime] = useState(() => {
    try { return localStorage.getItem("jiying_send_time") || "08:00" } catch { return "08:00" }
  })
  const [sendTimeEnabled, setSendTimeEnabled] = useState(() => {
    try { return localStorage.getItem("jiying_send_time_enabled") === "true" } catch { return false }
  })

  // ─── 一键自动生成（端到端15Agent工作流）───
  const [autoGenerating, setAutoGenerating] = useState(false)
  const [autoGenLog, setAutoGenLog] = useState<string[]>([])
  const [autoGenResult, setAutoGenResult] = useState<ContentOption[]>([])

  const handleAutoGenerate = useCallback(async () => {
    if (!niche.trim() || !user || autoGenerating) return
    setAutoGenerating(true)
    setAutoGenLog([])
    setAutoGenResult([])
    setError("")

    try {
      const res = await fetch("/api/daily-content/auto-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          platform,
          accountNickname: "",
          userId: user.id,
          autoMode: true,
        }),
      })
      const data = await res.json()
      if (data.log) setAutoGenLog(data.log)
      if (data.items?.length > 0) {
        const options: ContentOption[] = data.items.map((item: any, i: number) => ({
          id: `auto_${i}`,
          title: item.title,
          content: item.content,
          imageUrl: item.imageUrl,
          hashtags: item.hashtags || [],
        }))
        setAutoGenResult(options)
      } else if (data.message) {
        setError(data.message)
      }
    } catch {
      setError("自动生成失败，请手动操作")
    }
    setAutoGenerating(false)
  }, [niche, platform, user, autoGenerating])

  const PLATFORM_LIST = ["小红书", "抖音", "B站", "视频号", "快手", "公众号"]

  useEffect(() => {
    // 读 niche 和平台 — 优先从用户实际账户分析结果读取
    try {
      // 1. 读取赛道重定向
      const r = localStorage.getItem("jiying_niche_redirect")
      if (r) setNiche(r)

      // 2. 读取账号分析结果，获取用户真实赛道
      const analysis = JSON.parse(localStorage.getItem("jiying_account_analysis") || "{}")
      if (analysis.nicheCandidates && Array.isArray(analysis.nicheCandidates)) {
        const niches = analysis.nicheCandidates
          .filter((c: any) => c.niche && c.confidence > 0)
          .map((c: any) => c.niche)
        if (niches.length > 0) setUserNiches(niches)
      }
      // 也读取赛道关键词标签
      if (analysis.contentTags && Array.isArray(analysis.contentTags)) {
        const tags = analysis.contentTags.filter((t: string) => t && t.length > 0)
        if (tags.length > 0 && userNiches.length === 0) {
          setUserNiches(tags)
        }
      }

      // 3. 读取绑定账号确定平台
      const accounts = JSON.parse(localStorage.getItem("sijian_bound_accounts") || "[]")
      if (accounts.length > 0) {
        const nameMap: Record<string, string> = { xiaohongshu: "小红书", douyin: "抖音", bilibili: "B站", kuaishou: "快手", shipinhao: "视频号" }
        const p = nameMap[accounts[0].platformId] || accounts[0].platformName
        if (p) setPlatform(p)
      }
    } catch {}
    setLoading(false)
  }, [])

  // ─── 保存发送时间设置 ───
  const handleSaveSendTime = useCallback(() => {
    localStorage.setItem("jiying_send_time", sendTime)
    localStorage.setItem("jiying_send_time_enabled", String(sendTimeEnabled))
    alert(sendTimeEnabled ? `✅ 已设置每日 ${sendTime} 自动推送内容` : "✅ 自动推送已关闭")
  }, [sendTime, sendTimeEnabled])

  // Step 1: 搜爆款
  const handleSearchViral = useCallback(async () => {
    if (!niche.trim()) return
    setSearchingViral(true)
    setError("")
    setViralCandidates([])
    setSelectedViral(null)
    setViralTemplate(null)
    setDeconstructDetail(null)
    setShowDeconstructDetail(false)
    setContentOptions([])
    setSelectedOption(null)
    try {
      const res = await fetch("/api/viral/search", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, keyword: niche, platform }),
      })
      const data = await res.json()
      if (data.candidates?.length > 0) setViralCandidates(data.candidates)
      else setError(data.message || "未找到相关爆款")
    } catch { setError("搜索失败") }
    setSearchingViral(false)
  }, [niche, platform])

  // Step 2: 拆解爆款 — 保存完整分析文本让用户可见
  const handleSelectViral = useCallback(async (candidate: any, idx: number) => {
    setSelectedViral(candidate)
    setDeconstructing(true)
    setContentOptions([])
    setDeconstructDetail(null)
    try {
      const dsRes = await fetch("/api/viral/deconstruct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: candidate.title, description: (candidate.description || "").slice(0, 300), platform }),
      })
      let template: ViralTemplate | null = null
      let detail: DeconstructDetail | null = null
      if (dsRes.ok) {
        const d = await dsRes.json()
        if (!d._fallback) {
          const p = d as ViralTemplate
          p.sourceTitle = candidate.title
          p.sourceLikes = candidate.estimatedLikes
          template = p
          // 保存完整拆解详情
          detail = {
            hookStyle: d.hookStyle || "",
            scriptStructure: d.scriptStructure || "",
            pacing: d.pacing || "",
            emotionalCurve: d.emotionalCurve || "",
            conversionTactic: d.conversionTactic || "",
            visualStyle: d.visualStyle || "",
            keywords: d.keywords || [],
            rawAnalysis: d.rawAnalysis || "",
          }
        }
      }
      if (!template) {
        template = { hookStyle: "反常识开篇", scriptStructure: "问题→解决方案", pacing: "前3秒钩子", emotionalCurve: "好奇→信任", conversionTactic: "引导评论", visualStyle: "高清", keywords: [niche], sourceTitle: candidate.title }
        detail = {
          hookStyle: "反常识开篇", scriptStructure: "问题→解决方案", pacing: "前3秒钩子",
          emotionalCurve: "好奇→信任", conversionTactic: "引导评论", visualStyle: "高清",
          keywords: [niche], rawAnalysis: "（使用默认结构，未获取到AI分析结果）"
        }
      }
      setViralTemplate(template)
      setDeconstructDetail(detail)
    } catch {
      const fallback: ViralTemplate = { hookStyle: "反常识开篇", scriptStructure: "问题→解决方案", pacing: "前3秒钩子", emotionalCurve: "好奇→信任", conversionTactic: "引导评论", visualStyle: "高清", keywords: [niche], sourceTitle: candidate.title }
      setViralTemplate(fallback)
      setDeconstructDetail({
        hookStyle: "反常识开篇", scriptStructure: "问题→解决方案", pacing: "前3秒钩子",
        emotionalCurve: "好奇→信任", conversionTactic: "引导评论", visualStyle: "高清",
        keywords: [niche], rawAnalysis: "（拆解失败，使用默认结构）"
      })
    }
    setDeconstructing(false)
  }, [niche])

  // Step 3: 生成 3 份内容
  const handleGenerateOptions = useCallback(async () => {
    if (!user || generating || !viralTemplate) return
    setGenerating(true)
    setError("")
    setContentOptions([])
    setSelectedOption(null)

    const rewritePrompt = buildRewritePrompt(contentSamples, viralTemplate, niche, platform)
    const angles = [
      "用教程的形式，带具体步骤和代码",
      "用案例分享的形式，带真实数据和对比",
      "用观点讨论的形式，带深度分析和建议",
    ]

    const options: ContentOption[] = []
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch("/api/agent/agent_13", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instruction: rewritePrompt + `\n\n切入角度${i + 1}：${angles[i]}`,
            context: { userProfile: { platform, niche } },
          }),
        })
        const data = await res.json()
        if (data.mainOutput && data.mainOutput.length > 20) {
          const lines = data.mainOutput.split("\n").filter((l: string) => l.trim())
          const title = lines[0]?.replace(/^[#\d、\.\s]*/, "").trim() || `${niche}分享`
          const tagMatches = data.mainOutput.match(/#[^\s#,#]+/g)
          options.push({ id: `opt_${i + 1}`, title, content: data.mainOutput, hashtags: tagMatches ? tagMatches.slice(0, 5) : [`#${niche}`] })
        }
      } catch {}
    }

    if (options.length === 0) {
      setError("内容生成失败，请重试")
    } else {
      setContentOptions(options)
    }
    setGenerating(false)
  }, [user, generating, niche, platform, viralTemplate, contentSamples])

  // Step 4: 为选中的内容生成配图
  const handleSelectOption = useCallback(async (optionId: string) => {
    setSelectedOption(optionId)
    const option = contentOptions.find(c => c.id === optionId)
    if (!option || !user) return

    setGeneratingImage(true)
    try {
      const imgRes = await fetch("/api/video/frame", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${option.title}，${niche}风格，适合${platform}，细节丰富，高清`.slice(0, 380), width: 1080, height: 1920 }),
      })
      const imgData = await imgRes.json()
      if (imgData.url && !imgData.placeholder) {
        option.imageUrl = imgData.url
        addGeneratedToMediaLibrary(imgData.url, option.title, user.id, [niche, platform])
        setContentOptions(prev => prev.map(c => c.id === optionId ? { ...c, imageUrl: imgData.url } : c))
      }
    } catch {}
    setGeneratingImage(false)
  }, [contentOptions, user, niche, platform])

  const handleDownload = useCallback((option: ContentOption) => {
    const all = `标题：${option.title}\n\n${option.content}\n\n${option.hashtags?.join(" ") || ""}`
    const blob = new Blob([all], { type: "text/plain;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${option.title.slice(0, 20)}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [])

  const handleDownloadImage = useCallback((url: string, name: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = `${name.slice(0, 20)}.png`
    a.target = "_blank"
    a.click()
  }, [])

  const handleCopyToClipboard = useCallback((option: ContentOption) => {
    const platformFormat: Record<string, string> = {
      "小红书": "📕 小红书格式已复制",
      "抖音": "🎵 抖音格式已复制",
      "B站": "📺 B站格式已复制",
    }
    const text = `${option.title}\n\n${option.content}${option.hashtags?.length > 0 ? "\n\n" + option.hashtags.join(" ") : ""}${option.imageUrl ? "\n\n[配图: " + option.imageUrl + "]" : ""}`
    navigator.clipboard.writeText(text).then(() => {
      alert(platformFormat[platform] || "✅ 内容已复制，可粘贴发布")
    }).catch(() => {})
  }, [platform])

  // ─── 发布记录 ───
  const [publishLog, setPublishLog] = useState<{ date: string; title: string; platform: string; niche: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem("sijian_publish_log") || "[]") } catch { return [] }
  })
  const handlePublish = useCallback((option: ContentOption) => {
    handleCopyToClipboard(option)
    const entry = { date: new Date().toISOString().slice(0, 10), title: option.title.slice(0, 30), platform, niche }
    const updated = [entry, ...publishLog].slice(0, 90)
    setPublishLog(updated)
    localStorage.setItem("sijian_publish_log", JSON.stringify(updated))
  }, [platform, niche, publishLog, handleCopyToClipboard])

  // ─── 可用赛道：优先用户实际赛道 → 分析结果 → 默认兜底 ───
  const availableNiches = userNiches.length > 0 ? userNiches : FALLBACK_NICHES

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><div className="text-[#9898B0] text-sm animate-pulse">加载中...</div></div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl">📋</span>
        <div><h1 className="text-xl font-bold text-[#E8E8F0]">每日内容引擎</h1><p className="text-xs text-[#9898B0] mt-0.5">搜爆款视频 → 拆解脚本结构 → 生成3稿 → 选稿下载</p></div>
      </div>

      {/* ─── 发送时间设置 ─── */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/50 font-medium">⏰ 每日推送设置</div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={sendTimeEnabled} onChange={e => setSendTimeEnabled(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-[#F59E0B]" />
              <span className="text-[10px] text-white/40">自动推送</span>
            </label>
          </div>
        </div>
        {sendTimeEnabled && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30">每天</span>
            <input type="time" value={sendTime} onChange={e => setSendTime(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-[#0C0C14] border border-white/10 text-white/60 focus:outline-none focus:border-[#F59E0B]/40" />
            <span className="text-[10px] text-white/30">自动生成并推送内容到审核队列</span>
            <button onClick={handleSaveSendTime}
              className="ml-auto px-3 py-1 text-[10px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold">
              保存设置
            </button>
          </div>
        )}
        {!sendTimeEnabled && (
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/20">开启后，系统将在设定时间自动搜索爆款、拆解结构、生成文案并推送</span>
            <button onClick={handleSaveSendTime}
              className="ml-auto px-3 py-1 text-[10px] rounded-lg bg-white/[0.04] text-white/40 border border-white/[0.06]">
              保存
            </button>
          </div>
        )}
      </div>

      {/* ─── 一键自动生成（端到端15Agent工作流）─── */}
      <div className="glass rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs text-white/50 font-medium">🤖 一键自动化工作流</div>
          <span className="text-[9px] text-white/20">15 Agent 协作 · 搜爆款→拆解→文案→配图</span>
        </div>
        <button onClick={handleAutoGenerate} disabled={autoGenerating || !niche.trim()}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-sm font-bold disabled:opacity-40 hover:from-purple-400 hover:to-indigo-400 transition-all">
          {autoGenerating ? "🔄 15Agent协作中..." : "🚀 一键自动生成（全流程自动化）"}
        </button>
        {autoGenerating && (
          <div className="h-1 bg-[#0C0C14] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full animate-pulse" style={{ width: "100%" }} />
          </div>
        )}
        {autoGenLog.length > 0 && (
          <div className="bg-[#0C0C14] rounded-xl p-3 space-y-0.5 max-h-32 overflow-y-auto">
            {autoGenLog.map((l, i) => (
              <div key={i} className="text-[9px] text-white/40">{l}</div>
            ))}
          </div>
        )}
      </div>

      {/* ─── 自动生成结果 ─── */}
      {autoGenResult.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs text-white/50 font-medium">🤖 自动生成结果 · {autoGenResult.length} 篇</div>
          <div className="grid grid-cols-1 gap-3">
            {autoGenResult.map((opt, i) => (
              <div key={opt.id}
                className="rounded-2xl border-2 p-5 bg-[#1A1A2E] border-purple-500/20">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 bg-purple-500/20 text-purple-300">#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/80">{opt.title}</div>
                    <p className="text-[10px] text-white/40 mt-1 line-clamp-3">{opt.content}</p>
                    {opt.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">{opt.hashtags.map(h => <span key={h} className="text-[8px] text-[#F59E0B]/50">#{h.replace("#", "")}</span>)}</div>
                    )}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <button onClick={() => handleCopyToClipboard(opt)}
                        className="px-2.5 py-1 text-[9px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold border border-[#F59E0B]/20">📤 发布到 {platform}</button>
                      <button onClick={() => handleDownload(opt)}
                        className="px-2.5 py-1 text-[9px] rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/15">📥 文案</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 参数 */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#5A5A72] mb-1 block">
              内容赛道 {userNiches.length > 0 && <span className="text-[#F59E0B]/60">（来自账号分析）</span>}
            </label>
            <select value={niche} onChange={e => setNiche(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-[#0C0C14] border border-white/10 text-white/60 focus:outline-none">
              {availableNiches.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#5A5A72] mb-1 block">目标平台</label>
            <select value={platform} onChange={e => setPlatform(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-[#0C0C14] border border-white/10 text-white/60 focus:outline-none">
              {PLATFORM_LIST.map(p => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* 已选赛道提示 */}
        {niche && niche.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/15">
            <span className="text-xs text-[#F59E0B]/80">🎯 当前赛道：{niche}</span>
            <span className="text-[9px] text-white/30">· 参考素材 {contentSamples.length} 条</span>
            {userNiches.length > 0 && <span className="text-[9px] text-green-400/60">· 来自账号真实数据</span>}
          </div>
        )}

        {/* 统一爆款分析器（合并粘贴链接 + 关键词搜索） */}
        <UnifiedViralAnalyzer
          niche={niche || "通用"}
          platform={platform}
          injected={!!viralTemplate}
          compact
          onTemplateReady={(template) => {
            setViralTemplate(template)
          }} />

        {/* Step 1: 搜爆款 — 按钮改名 */}
        <button onClick={handleSearchViral} disabled={searchingViral || !niche.trim()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-xs font-bold disabled:opacity-40">
          {searchingViral ? "🔄 搜索中..." : `🔍 搜索${platform}爆款视频 · 拆解脚本结构`}
        </button>
      </div>

      {error && <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400">{error}</div>}

      {/* 爆款候选列表 — 展示更多信息让用户可见 */}
      {viralCandidates.length > 0 && !viralTemplate && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="text-xs text-white/50 font-medium">🏆 选择爆款视频（点击查看拆解详情）</div>
          {viralCandidates.map((c, i) => (
            <div key={i} onClick={() => !deconstructing && handleSelectViral(c, i)}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${selectedViral === c ? "bg-[#F59E0B]/10 border-[#F59E0B]/30" : "bg-[#0C0C14] border-white/[0.06] hover:border-white/20"} ${deconstructing ? "opacity-60 pointer-events-none" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-white/80 font-medium">{c.title}</div>
                  <div className="text-[10px] text-white/30 mt-0.5 line-clamp-1">{c.description?.slice(0, 100)}</div>
                  {c.url && (
                    <a href={c.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
                      className="text-[9px] text-[#F59E0B]/50 hover:text-[#F59E0B]/80 mt-0.5 inline-block truncate max-w-full">
                      🔗 查看原始链接
                    </a>
                  )}
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="text-xs font-bold text-[#F59E0B]">{c.estimatedLikes >= 10000 ? `${(c.estimatedLikes / 10000).toFixed(1)}万` : `${Math.round(c.estimatedLikes / 1000)}k`}赞</div>
                  <div className="text-[9px] text-white/30">{c.estimatedShares}转发</div>
                </div>
              </div>
              {selectedViral === c && deconstructing && <div className="mt-2 text-[9px] text-[#F59E0B]/60 animate-pulse">拆解结构中...</div>}
            </div>
          ))}
        </div>
      )}

      {/* 已选爆款 + 拆解详情（用户可见） */}
      {viralTemplate && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/50 font-medium">✅ 已选爆款视频结构</div>
            <button onClick={() => { setViralTemplate(null); setSelectedViral(null); setContentOptions([]); setDeconstructDetail(null); setShowDeconstructDetail(false) }}
              className="text-[9px] text-white/30 hover:text-white/50">更换</button>
          </div>
          <div className="bg-[#0C0C14] rounded-xl p-3 text-[9px] space-y-1">
            <div className="text-white/70 font-medium">{viralTemplate.sourceTitle}</div>
            <div className="text-white/30">🎣 钩子: {viralTemplate.hookStyle}</div>
            <div className="text-white/30">📐 结构: {viralTemplate.scriptStructure}</div>
            <div className="text-white/30">🎭 情绪: {viralTemplate.emotionalCurve}</div>
          </div>

          {/* ─── 拆解详情面板（用户可见完整分析过程）─── */}
          {deconstructDetail && (
            <div className="mt-3">
              <button onClick={() => setShowDeconstructDetail(!showDeconstructDetail)}
                className="flex items-center gap-1 text-[10px] text-[#F59E0B]/60 hover:text-[#F59E0B] transition-colors">
                <span>{showDeconstructDetail ? "▾" : "▸"}</span>
                📊 AI拆解详情（查看完整分析过程）
              </button>
              {showDeconstructDetail && (
                <div className="mt-2 bg-[#0C0C14] rounded-xl p-4 space-y-2 max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    {[
                      { label: "🎣 钩子策略", value: deconstructDetail.hookStyle },
                      { label: "📐 脚本结构", value: deconstructDetail.scriptStructure },
                      { label: "⏱️ 节奏控制", value: deconstructDetail.pacing },
                      { label: "🎭 情绪曲线", value: deconstructDetail.emotionalCurve },
                      { label: "💬 转化话术", value: deconstructDetail.conversionTactic },
                      { label: "🎨 视觉风格", value: deconstructDetail.visualStyle },
                    ].map(item => (
                      <div key={item.label} className="text-[9px]">
                        <span className="text-white/30">{item.label}</span>
                        <div className="text-white/60 mt-0.5">{item.value || "—"}</div>
                      </div>
                    ))}
                  </div>
                  {deconstructDetail.keywords.length > 0 && (
                    <div className="text-[9px]">
                      <span className="text-white/30">🏷️ 关键词</span>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {deconstructDetail.keywords.map(k => (
                          <span key={k} className="px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B]/60 text-[8px]">{k}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {deconstructDetail.rawAnalysis && (
                    <div className="text-[9px] pt-2 border-t border-white/[0.04]">
                      <span className="text-white/30">📝 AI原始分析</span>
                      <pre className="text-white/40 mt-1 whitespace-pre-wrap text-[8px] leading-relaxed">{deconstructDetail.rawAnalysis}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 生成3稿 */}
          <button onClick={handleGenerateOptions} disabled={generating}
            className="w-full mt-3 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-xs font-bold disabled:opacity-40">
            {generating ? "🔄 生成中（3篇）..." : "🚀 按爆款结构生成3篇文案"}
          </button>
        </div>
      )}

      {/* 3 篇候选内容 */}
      {contentOptions.length > 0 && (
        <div className="space-y-4">
          <div className="text-xs text-white/50 font-medium">📝 选择你最喜欢的一篇</div>
          <div className="grid grid-cols-1 gap-3">
            {contentOptions.map((opt, i) => (
              <div key={opt.id}
                onClick={() => handleSelectOption(opt.id)}
                className={`rounded-2xl border-2 p-5 cursor-pointer transition-all ${
                  selectedOption === opt.id
                    ? "bg-[#F59E0B]/5 border-[#F59E0B]/30 ring-2 ring-[#F59E0B]"
                    : "bg-[#1A1A2E] border-white/[0.06] hover:border-white/20"
                }`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${
                    i === 0 ? "bg-red-500/20 text-red-300" : i === 1 ? "bg-blue-500/20 text-blue-300" : "bg-green-500/20 text-green-300"
                  }`}>#{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white/80">{opt.title}</div>
                    <p className="text-[10px] text-white/40 mt-1 line-clamp-3">{opt.content}</p>
                    {opt.hashtags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">{opt.hashtags.map(h => <span key={h} className="text-[8px] text-[#F59E0B]/50">#{h.replace("#", "")}</span>)}</div>
                    )}
                    <div className="flex gap-1.5 mt-2 flex-wrap">
                      <button onClick={(e) => { e.stopPropagation(); handlePublish(opt) }}
                        className="px-2.5 py-1 text-[9px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold border border-[#F59E0B]/20">📤 发布到 {platform}</button>
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(opt) }}
                        className="px-2.5 py-1 text-[9px] rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/15">📥 文案</button>
                      {opt.imageUrl && (
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadImage(opt.imageUrl!, opt.title) }}
                          className="px-2.5 py-1 text-[9px] rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/15">🖼️ 配图</button>
                      )}
                      {selectedOption === opt.id && generatingImage && <span className="text-[9px] text-[#F59E0B]/60 animate-pulse">🎨 生成配图中...</span>}
                      {selectedOption === opt.id && opt.imageUrl && <span className="text-[9px] text-green-400">✅ 就绪</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 发布日历 ─── */}
      {publishLog.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <details>
            <summary className="text-xs text-white/50 font-medium cursor-pointer">📅 发布记录 · 共 {publishLog.length} 条</summary>
            <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
              {Array.from(new Set(publishLog.map(e => e.date))).map(date => {
                const dayEntries = publishLog.filter(e => e.date === date)
                return (
                  <div key={date} className="text-[9px]">
                    <div className="text-white/40 font-medium py-1">{date}</div>
                    {dayEntries.map((e, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-white/[0.02] text-white/30">
                        <span>📤</span>
                        <span className="text-white/50 truncate">{e.title}</span>
                        <span className="ml-auto">{e.platform} · {e.niche}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          </details>
        </div>
      )}
    </div>
  )
}
