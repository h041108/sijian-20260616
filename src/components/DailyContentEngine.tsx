"use client"

import { useState, useCallback, useEffect } from "react"
import { useJiyingUser } from "@/app/jiying/layout"
import { addGeneratedToMediaLibrary } from "@/lib/media-library"
import { buildPrompt, buildRewritePrompt, buildDeconstructPromptForSelection, type ViralTemplate } from "@/lib/prompt-engine"

interface ContentOption {
  id: string
  title: string
  content: string
  imageUrl?: string
  hashtags: string[]
}

export default function DailyContentEngine() {
  const { user } = useJiyingUser()
  const [loading, setLoading] = useState(true)
  const [niche, setNiche] = useState("")
  const [platform, setPlatform] = useState("小红书")
  const [error, setError] = useState("")

  // 爆款搜索
  const [viralCandidates, setViralCandidates] = useState<any[]>([])
  const [searchingViral, setSearchingViral] = useState(false)
  const [selectedViral, setSelectedViral] = useState<any>(null)
  const [viralTemplate, setViralTemplate] = useState<ViralTemplate | null>(null)
  const [deconstructing, setDeconstructing] = useState(false)

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

  const NICHE_LIST = ["美食", "美妆", "穿搭", "数码", "教育", "生活", "健康", "母婴", "旅行", "家居", "宠物", "汽车", "游戏", "影视", "科技", "健身", "金融投资", "程序开发", "自媒体运营", "知识付费"]
  const PLATFORM_LIST = ["小红书", "抖音", "B站", "视频号", "快手", "公众号"]

  useEffect(() => {
    // 读 niche 和平台
    try {
      const r = localStorage.getItem("jiying_niche_redirect")
      if (r) setNiche(r)
      const accounts = JSON.parse(localStorage.getItem("sijian_bound_accounts") || "[]")
      if (accounts.length > 0) {
        const nameMap: Record<string, string> = { xiaohongshu: "小红书", douyin: "抖音", bilibili: "B站", kuaishou: "快手", shipinhao: "视频号" }
        const p = nameMap[accounts[0].platformId] || accounts[0].platformName
        if (p) setPlatform(p)
      }
    } catch {}
    setLoading(false)
  }, [])

  // Step 1: 搜爆款
  const handleSearchViral = useCallback(async () => {
    if (!niche.trim()) return
    setSearchingViral(true)
    setError("")
    setViralCandidates([])
    setSelectedViral(null)
    setViralTemplate(null)
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

  // Step 2: 拆解爆款
  const handleSelectViral = useCallback(async (candidate: any, idx: number) => {
    setSelectedViral(candidate)
    setDeconstructing(true)
    setContentOptions([])
    try {
      const dsRes = await fetch("https://api.deepseek.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.NEXT_PUBLIC_DEEPSEEK_KEY || ""}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: "你只输出JSON。" },
            { role: "user", content: buildDeconstructPromptForSelection(candidate) },
          ],
          temperature: 0.3, max_tokens: 800,
        }),
      })
      let template: ViralTemplate | null = null
      if (dsRes.ok) {
        const d = await dsRes.json()
        const m = d.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/)
        if (m) {
          const p = JSON.parse(m[0]) as ViralTemplate
          p.sourceTitle = candidate.title
          p.sourceLikes = candidate.estimatedLikes
          template = p
        }
      }
      if (!template) {
        template = { hookStyle: "反常识开篇", scriptStructure: "问题→解决方案", pacing: "前3秒钩子", emotionalCurve: "好奇→信任", conversionTactic: "引导评论", visualStyle: "高清", keywords: [niche], sourceTitle: candidate.title }
      }
      setViralTemplate(template)
    } catch {}
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

  // 下载单个文案
  const handleDownload = useCallback((option: ContentOption) => {
    const all = `标题：${option.title}\n\n${option.content}\n\n${option.hashtags?.join(" ") || ""}`
    const blob = new Blob([all], { type: "text/plain;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = `${option.title.slice(0, 20)}.txt`
    a.click()
    URL.revokeObjectURL(a.href)
  }, [])

  // 下载配图
  const handleDownloadImage = useCallback((url: string, name: string) => {
    const a = document.createElement("a")
    a.href = url
    a.download = `${name.slice(0, 20)}.png`
    a.target = "_blank"
    a.click()
  }, [])

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-20 text-center"><div className="text-[#9898B0] text-sm animate-pulse">加载中...</div></div>

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl">📋</span>
        <div><h1 className="text-xl font-bold text-[#E8E8F0]">每日内容引擎</h1><p className="text-xs text-[#9898B0] mt-0.5">搜爆款 → 选结构 → 生成3稿 → 选稿下载</p></div>
      </div>

      {/* 参数 */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#5A5A72] mb-1 block">内容赛道</label>
            <select value={niche} onChange={e => setNiche(e.target.value)} className="w-full px-3 py-2 text-xs rounded-xl bg-[#0C0C14] border border-white/10 text-white/60 focus:outline-none">
              {NICHE_LIST.map(n => <option key={n}>{n}</option>)}
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
          </div>
        )}

        {/* Step 1: 搜爆款 */}
        <button onClick={handleSearchViral} disabled={searchingViral || !niche.trim()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-xs font-bold disabled:opacity-40">
          {searchingViral ? "🔄 搜索中..." : `🔍 搜索 ${platform} 爆款结构（点赞>10000）`}
        </button>
      </div>

      {error && <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-400">{error}</div>}

      {/* 爆款候选列表 */}
      {viralCandidates.length > 0 && !viralTemplate && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="text-xs text-white/50 font-medium">🏆 选择爆款结构</div>
          {viralCandidates.map((c, i) => (
            <div key={i} onClick={() => !deconstructing && handleSelectViral(c, i)}
              className={`rounded-xl border p-4 cursor-pointer transition-all ${selectedViral === c ? "bg-[#F59E0B]/10 border-[#F59E0B]/30" : "bg-[#0C0C14] border-white/[0.06] hover:border-white/20"} ${deconstructing ? "opacity-60 pointer-events-none" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm text-white/80 font-medium">{c.title}</div>
                  <div className="text-[10px] text-white/30 mt-0.5 line-clamp-1">{c.description?.slice(0, 100)}</div>
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

      {/* 已选爆款 */}
      {viralTemplate && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/50 font-medium">✅ 已选爆款结构</div>
            <button onClick={() => { setViralTemplate(null); setSelectedViral(null); setContentOptions([]) }}
              className="text-[9px] text-white/30 hover:text-white/50">更换</button>
          </div>
          <div className="bg-[#0C0C14] rounded-xl p-3 text-[9px] space-y-1">
            <div className="text-white/70 font-medium">{viralTemplate.sourceTitle}</div>
            <div className="text-white/30">🎣 钩子: {viralTemplate.hookStyle}</div>
            <div className="text-white/30">📐 结构: {viralTemplate.scriptStructure}</div>
            <div className="text-white/30">🎭 情绪: {viralTemplate.emotionalCurve}</div>
          </div>

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
                    <div className="flex gap-2 mt-2">
                      <button onClick={(e) => { e.stopPropagation(); handleDownload(opt) }}
                        className="px-2.5 py-1 text-[9px] rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/15">📥 下载文案</button>
                      {opt.imageUrl && (
                        <button onClick={(e) => { e.stopPropagation(); handleDownloadImage(opt.imageUrl!, opt.title) }}
                          className="px-2.5 py-1 text-[9px] rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/15">🖼️ 下载配图</button>
                      )}
                      {selectedOption === opt.id && generatingImage && <span className="text-[9px] text-[#F59E0B]/60 animate-pulse">🎨 生成配图中...</span>}
                      {selectedOption === opt.id && opt.imageUrl && <span className="text-[9px] text-green-400">✅ 已选 + 配图就绪</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
