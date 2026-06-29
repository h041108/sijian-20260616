"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useJiyingUser } from "@/app/jiying/layout"
import {
  getTodayContent, saveDailyContent, updateItemAction, getReviewStatus, generateMockDailyItems,
  type DailyContentItem, type ReviewAction,
} from "@/lib/review-store"
import { addGeneratedToMediaLibrary } from "@/lib/media-library"
import ViralSelector from "./ViralSelector"
import { buildPrompt, type ViralTemplate } from "@/lib/prompt-engine"

export default function DailyContentEngine() {
  const { user } = useJiyingUser()
  const [loading, setLoading] = useState(true)
  const [niche, setNiche] = useState("")
  const [log, setLog] = useState(() => getTodayContent())
  const [status, setStatus] = useState(() => getReviewStatus(log.items))
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [platform, setPlatform] = useState("小红书")
  const [error, setError] = useState("")
  const [referenceTexts, setReferenceTexts] = useState<string[]>(() => {
    // 从分析结果自动加载用户的内容样本（Tavily 搜到的用户自己的帖子）
    // 注意：这些是用户账号的真实内容，不是 AI 生成的"自媒体运营"风格的内容
    // 它们会被传给 AI 作为风格参考，让 AI 模仿用户的真实写作风格
    try {
      const saved = JSON.parse(localStorage.getItem("jiying_account_analysis") || "{}")
      if (saved.contentSamples && Array.isArray(saved.contentSamples) && saved.contentSamples.length > 0) {
        return saved.contentSamples.slice(0, 3)
      }
    } catch {}
    return []
  })
  const [showRefInput, setShowRefInput] = useState(false)
  const [refInput, setRefInput] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)
  const [showViralSelector, setShowViralSelector] = useState(false)
  const [viralTemplate, setViralTemplate] = useState<ViralTemplate | null>(null)

  // 页面加载时读取平台（只读平台，不读 niche）
  useEffect(() => {
    try {
      const accounts = JSON.parse(localStorage.getItem("sijian_bound_accounts") || "[]")
      if (accounts.length > 0) {
        const nameMap: Record<string, string> = { xiaohongshu: "小红书", douyin: "抖音", bilibili: "B站", kuaishou: "快手", shipinhao: "视频号" }
        const p = nameMap[accounts[0].platformId] || accounts[0].platformName
        if (p) setPlatform(p)
      }
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => {
    const s = getReviewStatus(log.items)
    setStatus(s)
    saveDailyContent(log)
  }, [log])

  const NICHE_LIST = ["美食", "美妆", "穿搭", "数码", "教育", "生活", "健康", "母婴", "旅行", "家居", "宠物", "汽车", "游戏", "影视", "科技", "健身", "金融投资", "程序开发", "自媒体运营", "知识付费"]
  const PLATFORM_LIST = ["小红书", "抖音", "B站", "视频号", "快手", "公众号"]

  const handleGenerate = useCallback(async () => {
    if (!user || generating) return
    setGenerating(true)
    setError("")
    const mockItems = generateMockDailyItems()
    try {
      // 使用提示词引擎构建 prompt（如果有爆款模板就注入）
      const promptResult = buildPrompt({
        niche,
        platform,
        userContentSamples: referenceTexts,
        viralTemplate: viralTemplate || undefined,
      })
      const res = await fetch("/api/agent/agent_13", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: promptResult.systemPrompt + "\n\n" + promptResult.userPrompt,
          context: { userProfile: { platform, niche } },
        }),
      })
      const data = await res.json()
      if (data.mainOutput && data.mainOutput.length > 20) {
        const lines = data.mainOutput.split("\n").filter((l: string) => l.trim())
        const title = lines[0]?.replace(/^[#\d、\.\s]*/, "").trim() || niche + "今日分享"
        const content = data.mainOutput
        let imageUrl = ""
        try {
          const imgRes = await fetch("/api/video/frame", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: `${title}，${niche}风格，适合${platform}，细节丰富，高清`.slice(0, 380), width: 1080, height: 1920 }),
          })
          const imgData = await imgRes.json()
          if (imgData.url && !imgData.placeholder) {
            imageUrl = imgData.url
            addGeneratedToMediaLibrary(imgData.url, title, user.id, [niche, platform])
          }
        } catch {}
        const tagMatches = content.match(/#[^\s#,#]+/g)
        const hashtags = tagMatches ? tagMatches.slice(0, 5) : [`#${niche}`, `#${platform}`]
        const items: DailyContentItem[] = [
          { id: `daily_${Date.now()}_1`, date: new Date().toISOString().slice(0, 10), type: "text", title, content, hashtags, platform, suggestedTime: "08:00", action: "pending", createdAt: new Date().toISOString() },
          { id: `daily_${Date.now()}_2`, date: new Date().toISOString().slice(0, 10), type: "image", title: title + " - 配图", content: title, mediaUrl: imageUrl || undefined, hashtags, platform, suggestedTime: "08:00", action: "pending", createdAt: new Date().toISOString() },
        ]
        setLog(prev => ({ ...prev, items: [...items, ...prev.items.filter(i => i.action === "published")] }))
        setGenerating(false)
        return
      }
    } catch {}
    setLog(prev => ({ ...prev, items: [...mockItems, ...prev.items.filter(i => i.action === "published")] }))
    setGenerating(false)
  }, [user, generating, niche, platform])

  const startEdit = useCallback((item: DailyContentItem) => { setEditingId(item.id); setEditText(item.content || item.title) }, [])
  const saveEdit = useCallback(() => { if (!editingId) return; const newItems = updateItemAction(log.items, editingId, "edited", editText); setLog(prev => ({ ...prev, items: newItems })); setEditingId(null) }, [editingId, editText, log])

  const handleAction = useCallback((itemId: string, action: ReviewAction) => {
    const newItems = updateItemAction(log.items, itemId, action)
    setLog(prev => ({ ...prev, items: newItems }))
    if (action === "published") setTimeout(() => alert("✅ 已发布到" + platform + "（平台API集成后自动发布）"), 300)
  }, [log, platform])

  const handleDownload = useCallback((item: DailyContentItem) => {
    const content = item.type === "text" || item.type === "image" ? `${item.title}\n\n${item.editedContent || item.content}\n\n${item.hashtags?.join(" ") || ""}` : item.content
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `${item.title.slice(0, 20)}.txt`; a.click(); URL.revokeObjectURL(url)
  }, [])

  const handleDownloadImage = useCallback((url: string, name: string) => { const a = document.createElement("a"); a.href = url; a.download = `${name.slice(0, 20)}.png`; a.target = "_blank"; a.click() }, [])

  const handlePublishAll = useCallback(() => {
    const newItems = log.items.map(i => i.action === "pending" || i.action === "confirmed" ? { ...i, action: "published" as ReviewAction } : i)
    setLog(prev => ({ ...prev, items: newItems }))
    alert("✅ 已全部发布到 " + platform + "（平台API集成后自动发布）")
  }, [log, platform])

  const pendingItems = log.items.filter(i => i.action === "pending" || i.action === "confirmed")
  const publishedItems = log.items.filter(i => i.action === "published")
  const totalDone = status.confirmed + status.edited

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-[#9898B0] text-sm animate-pulse">加载中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl">📋</span>
        <div>
          <h1 className="text-xl font-bold text-[#E8E8F0]">每日内容引擎</h1>
          <p className="text-xs text-[#9898B0] mt-0.5">AI 自动生成 → 你审核 → 一键发布</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-white/70 font-medium">{new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" })}</div>
            <div className="text-xs text-white/30 mt-0.5">赛道: {niche} · 待审核 {pendingItems.length} 条 · 已发布 {publishedItems.length} 条</div>
          </div>
          <div className="w-14 h-14 rounded-full bg-[#0C0C14] flex items-center justify-center border-2 border-[#F59E0B]/30">
            <span className="text-sm font-bold text-[#F59E0B]">{log.items.length > 0 ? Math.round(totalDone / log.items.length * 100) : 0}%</span>
          </div>
        </div>
        <div className="mt-3 h-1.5 bg-[#0C0C14] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#F97316] rounded-full transition-all" style={{ width: `${log.items.length > 0 ? totalDone / log.items.length * 100 : 0}%` }} />
        </div>
      </div>

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

        {/* 参考素材区 — 让 AI 模仿你的风格 */}
        <details className="bg-[#0C0C14] rounded-xl border border-white/[0.06]">
          <summary className="px-3 py-2 text-[10px] text-white/40 cursor-pointer hover:text-white/60">
            📎 参考素材 {referenceTexts.length > 0 ? `(${referenceTexts.length})` : "(选填)"}
          </summary>
          <div className="px-3 pb-3 space-y-2">
            {referenceTexts.length > 0 && (
              <div className="space-y-1">
                {referenceTexts.map((t, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px] text-white/30 bg-white/[0.02] rounded-lg px-2 py-1">
                    <span className="truncate flex-1">{t.slice(0, 60)}</span>
                    <button onClick={() => setReferenceTexts(prev => prev.filter((_, j) => j !== i))}
                      className="text-white/20 hover:text-red-400 shrink-0">✕</button>
                  </div>
                ))}
              </div>
            )}
            {showRefInput ? (
              <div className="flex gap-1">
                <textarea value={refInput} onChange={e => setRefInput(e.target.value)}
                  placeholder="粘贴你的文案、标题或内容描述..."
                  rows={2} className="flex-1 text-[10px] bg-[#1A1A2E] rounded-lg p-2 text-white/60 border border-[#F59E0B]/30 focus:outline-none" />
                <div className="flex flex-col gap-1">
                  <button onClick={() => { if (refInput.trim()) { setReferenceTexts(prev => [...prev, refInput.trim()]); setRefInput(""); setShowRefInput(false) } }}
                    className="px-2 py-1 text-[9px] rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20">添加</button>
                  <button onClick={() => setShowRefInput(false)} className="px-2 py-1 text-[9px] rounded-lg text-white/30">取消</button>
                </div>
              </div>
            ) : (
              <div className="flex gap-1">
                <button onClick={() => setShowRefInput(true)}
                  className="px-2 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]">✏️ 粘贴参考内容</button>
                <input ref={fileRef} type="file" accept=".txt" onChange={e => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  const reader = new FileReader()
                  reader.onload = () => {
                    const text = reader.result as string
                    if (text.length > 50) setReferenceTexts(prev => [...prev, text.slice(0, 500)])
                  }
                  reader.readAsText(f)
                }} hidden />
                <button onClick={() => fileRef.current?.click()}
                  className="px-2 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/40 border border-white/[0.06] hover:bg-white/[0.08]">📄 上传文件</button>
              </div>
            )}
          </div>
        </details>

        {/* 爆款参考按钮 */}
        <button onClick={() => setShowViralSelector(true)}
          className="w-full py-2 rounded-xl border border-[#F59E0B]/15 text-[#F59E0B] text-xs font-medium hover:bg-[#F59E0B]/5 transition-all">
          {viralTemplate ? "✅ 已选爆款参考" : "🏆 参考同类爆款结构（可选）"}
        </button>

        {/* 爆款选择器弹窗 */}
        {showViralSelector && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setShowViralSelector(false)}>
            <div className="bg-[#1A1A2E] rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <ViralSelector
                niche={niche}
                platform={platform}
                userContentSamples={referenceTexts}
                onTemplateReady={(template: any, _rewritePrompt: string) => {
                  setViralTemplate(template)
                  setShowViralSelector(false)
                }}
                onClose={() => setShowViralSelector(false)} />
            </div>
          </div>
        )}

        <button onClick={handleGenerate} disabled={generating} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
          {generating ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 rounded-full border-2 border-[#0C0C14] border-t-transparent animate-spin" />AI 生成中...</span> : `🚀 AI 生成今日 ${platform} 内容`}
        </button>
      </div>

      {log.items.length === 0 && !generating && (
        <div className="text-center py-16 border-2 border-dashed border-white/10 rounded-2xl">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-sm text-[#9898B0]">今天还没有内容</p>
          <p className="text-xs text-[#5A5A72] mt-1">点击上方按钮让 AI 自动生成今日内容</p>
        </div>
      )}

      {log.items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs text-white/50 font-medium">{status.pending > 0 ? `待审核 (${status.pending})` : `已全部处理 (${totalDone})`}</div>
            <div className="flex gap-2">
              {pendingItems.length > 1 && <button onClick={handlePublishAll} className="px-4 py-1.5 text-[10px] rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 font-medium">📤 全部发布 ({pendingItems.length} 条)</button>}
              {log.items.length > 0 && <button onClick={() => { const all = log.items.map(i => `${i.title}\n\n${i.editedContent || i.content}\n\n${i.hashtags?.join(" ") || ""}`).join("\n\n═══════════════════════════\n\n"); const blob = new Blob([all], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `即影内容_${new Date().toISOString().slice(0, 10)}.txt`; a.click(); URL.revokeObjectURL(url) }} className="px-4 py-1.5 text-[10px] rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/15 hover:bg-blue-500/20 font-medium">📥 下载全部</button>}
            </div>
          </div>
          {log.items.map(item => (
            <div key={item.id} className={`glass rounded-xl border p-4 transition-all ${item.action === "published" ? "border-green-500/15 bg-green-500/3" : item.action === "edited" ? "border-amber-500/15 bg-amber-500/3" : item.action === "skipped" ? "border-gray-500/15 bg-gray-500/3 opacity-50" : "border-white/[0.06]"}`}>
              <div className="flex items-start gap-3">
                <div className="w-16 h-16 rounded-xl bg-[#0C0C14] overflow-hidden shrink-0 border border-white/[0.06]">
                  {item.mediaUrl ? <img src={item.mediaUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-lg">{item.type === "text" ? "📝" : item.type === "image" ? "🖼️" : "🎬"}</div>}
                </div>
                <div className="flex-1 min-w-0">
                  {editingId === item.id ? (
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4} className="w-full text-xs bg-[#0C0C14] rounded-lg p-2 text-white/70 border border-[#F59E0B]/40 focus:outline-none" />
                  ) : (
                    <><div className="text-sm font-medium text-white/80">{item.title}</div><p className="text-[10px] text-white/40 mt-1 line-clamp-2">{item.content}</p></>
                  )}
                  {item.hashtags && item.hashtags.length > 0 && <div className="flex flex-wrap gap-1 mt-1.5">{item.hashtags.map(h => <span key={h} className="text-[9px] text-[#F59E0B]/50">#{h.replace("#", "")}</span>)}</div>}
                  <div className="flex items-center gap-3 mt-2 text-[9px] text-white/30">
                    <span className={`px-1.5 py-0.5 rounded ${item.type === "text" ? "bg-blue-500/10 text-blue-300" : item.type === "image" ? "bg-purple-500/10 text-purple-300" : "bg-teal-500/10 text-teal-300"}`}>{item.type}</span>
                    <span>⏰ {item.suggestedTime || "未定"}</span>
                    <span>📍 {item.platform || platform}</span>
                    {item.action !== "pending" && <span className={`${item.action === "published" ? "text-green-400" : item.action === "edited" ? "text-amber-400" : "text-gray-400"}`}>{item.action === "published" ? "✅ 已发布" : item.action === "edited" ? "✏️ 已编辑" : "⏭️ 已跳过"}</span>}
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {item.action === "pending" || item.action === "confirmed" ? (
                      <><button onClick={() => handleAction(item.id, "published")} className="px-2.5 py-1 text-[9px] rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25">✅ 发布</button><button onClick={() => startEdit(item)} className="px-2.5 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/40 hover:text-white/60 border border-white/[0.06]">✏️ 编辑</button><button onClick={() => handleAction(item.id, "skipped")} className="px-2.5 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/30 hover:text-white/50 border border-white/[0.06]">⏭️ 跳过</button></>
                    ) : editingId === item.id ? (
                      <><button onClick={saveEdit} className="px-2.5 py-1 text-[9px] rounded-lg bg-[#F59E0B] text-[#0C0C14] font-bold">💾 保存</button><button onClick={() => setEditingId(null)} className="px-2.5 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/40">取消</button></>
                    ) : <button onClick={() => handleAction(item.id, "pending")} className="px-2.5 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/40 hover:text-white/60">↩️ 撤回</button>}
                    <button onClick={() => handleDownload(item)} className="px-2.5 py-1 text-[9px] rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/15 hover:bg-blue-500/20">📥 文案</button>
                    {item.mediaUrl && <button onClick={() => handleDownloadImage(item.mediaUrl!, item.title)} className="px-2.5 py-1 text-[9px] rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/15 hover:bg-purple-500/20">🖼️ 配图</button>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {publishedItems.length > 0 && (
        <details className="glass rounded-2xl p-4">
          <summary className="text-xs text-white/40 font-medium cursor-pointer">📊 已发布内容 ({publishedItems.length} 条)</summary>
          <div className="mt-3 space-y-2">
            {publishedItems.map(item => (
              <div key={item.id} className="flex items-center gap-3 text-[10px] text-white/40">
                <span className="w-4 h-4 rounded bg-green-500/20 text-green-400 flex items-center justify-center text-[8px]">✓</span>
                <span className="flex-1 truncate">{item.title}</span>
                <span>{item.suggestedTime || "未定"}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
