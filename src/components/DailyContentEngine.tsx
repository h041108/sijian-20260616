"use client"

import { useState, useCallback, useEffect } from "react"
import { useJiyingUser } from "@/app/jiying/layout"
import {
  getTodayContent, saveDailyContent, updateItemAction, getReviewStatus, generateMockDailyItems,
  type DailyContentItem, type ReviewAction,
} from "@/lib/review-store"
import { addGeneratedToMediaLibrary } from "@/lib/media-library"

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

  // 唯一的数据加载点：轮询 localStorage，直至读到有效值
  // 不依赖 props 传递，不依赖 URL 参数，不依赖任何外部组件
  useEffect(() => {
    let stopped = false
    let attempts = 0

    const poll = () => {
      if (stopped) return
      attempts++
      try {
        // 来源1: launch 页按钮写入的专用 key
        const redirect = localStorage.getItem("jiying_niche_redirect")
        if (redirect && redirect !== "" && redirect !== "美食" && redirect !== "待确认") {
          setNiche(redirect)
          setLoading(false)
          return
        }
        // 来源2: API 写入的分析结果
        const saved = JSON.parse(localStorage.getItem("jiying_account_analysis") || "{}")
        if (saved.niche && saved.niche !== "" && saved.niche !== "待确认" && saved.niche !== "美食") {
          setNiche(saved.niche)
          setLoading(false)
          return
        }
      } catch {}

      // 读平台
      try {
        const accounts = JSON.parse(localStorage.getItem("sijian_bound_accounts") || "[]")
        if (accounts.length > 0) {
          const nameMap: Record<string, string> = { xiaohongshu: "小红书", douyin: "抖音", bilibili: "B站", kuaishou: "快手", shipinhao: "视频号" }
          const p = nameMap[accounts[0].platformId] || accounts[0].platformName
          if (p) setPlatform(p)
        }
      } catch {}

      // 最多轮询 3 秒（30次x100ms），超时后设默认值
      if (attempts >= 30) {
        setNiche("美食")
        setLoading(false)
        return
      }
      setTimeout(poll, 100)
    }

    poll()
    return () => { stopped = true }
  }, [])

  useEffect(() => {
    const s = getReviewStatus(log.items)
    setStatus(s)
    saveDailyContent(log)
  }, [log])

  const NICHE_LIST = ["美食", "美妆", "穿搭", "数码", "教育", "生活", "健康", "母婴", "旅行", "家居", "宠物", "汽车", "游戏", "影视", "科技", "健身"]
  const PLATFORM_LIST = ["小红书", "抖音", "B站", "视频号", "快手", "公众号"]

  const handleGenerate = useCallback(async () => {
    if (!user || generating) return
    setGenerating(true)
    setError("")
    const mockItems = generateMockDailyItems()
    try {
      const res = await fetch("/api/agent/agent_13", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: `我是${platform}平台的${niche}领域博主，请推荐今日最佳选题（TOP 1），并写一段完整的文案（300字左右），适合${platform}平台风格`,
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

  // 加载中：不渲染任何内容，不给"美食"出场机会
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
              {pendingItems.length > 1 && (
                <button onClick={handlePublishAll} className="px-4 py-1.5 text-[10px] rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25 font-medium">📤 全部发布 ({pendingItems.length} 条)</button>
              )}
              {log.items.length > 0 && (
                <button onClick={() => { const all = log.items.map(i => `${i.title}\n\n${i.editedContent || i.content}\n\n${i.hashtags?.join(" ") || ""}`).join("\n\n═══════════════════════════\n\n"); const blob = new Blob([all], { type: "text/plain;charset=utf-8" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `即影内容_${new Date().toISOString().slice(0, 10)}.txt`; a.click(); URL.revokeObjectURL(url) }}
                  className="px-4 py-1.5 text-[10px] rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/15 hover:bg-blue-500/20 font-medium">📥 下载全部</button>
              )}
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
                    <>
                      <div className="text-sm font-medium text-white/80">{item.title}</div>
                      <p className="text-[10px] text-white/40 mt-1 line-clamp-2">{item.content}</p>
                    </>
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
                      <>
                        <button onClick={() => handleAction(item.id, "published")} className="px-2.5 py-1 text-[9px] rounded-lg bg-green-500/15 text-green-400 border border-green-500/20 hover:bg-green-500/25">✅ 发布</button>
                        <button onClick={() => startEdit(item)} className="px-2.5 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/40 hover:text-white/60 border border-white/[0.06]">✏️ 编辑</button>
                        <button onClick={() => handleAction(item.id, "skipped")} className="px-2.5 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/30 hover:text-white/50 border border-white/[0.06]">⏭️ 跳过</button>
                      </>
                    ) : editingId === item.id ? (
                      <>
                        <button onClick={saveEdit} className="px-2.5 py-1 text-[9px] rounded-lg bg-[#F59E0B] text-[#0C0C14] font-bold">💾 保存</button>
                        <button onClick={() => setEditingId(null)} className="px-2.5 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/40">取消</button>
                      </>
                    ) : <button onClick={() => handleAction(item.id, "pending")} className="px-2.5 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/40 hover:text-white/60">↩️ 撤回</button>}
                    <button onClick={() => handleDownload(item)} className="px-2.5 py-1 text-[9px] rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/15 hover:bg-blue-500/20" title="下载文案">📥 文案</button>
                    {item.mediaUrl && <button onClick={() => handleDownloadImage(item.mediaUrl!, item.title)} className="px-2.5 py-1 text-[9px] rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/15 hover:bg-purple-500/20" title="下载配图">🖼️ 配图</button>}
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
