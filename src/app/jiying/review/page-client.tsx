"use client"
import { useState, useCallback, useEffect } from "react"
import { getTodayContent, saveDailyContent, updateItemAction, getReviewStatus, generateMockDailyItems, type ReviewAction } from "@/lib/review-store"

function QAReview({ script, onBack }: { script: string; onBack: () => void }) {
  const [report, setReport] = useState<any>(null)

  useEffect(() => {
    const lines = script.split(/[。！？\n]+/).filter(s => s.trim().length > 5)
    const hasCausal = /因为|所以|导致|因此|原来|结果|于是/.test(script)
    const hasSeq = /首先|然后|接着|最后|第一|第二|突然/.test(script)
    const hasEmo = /惊喜|震惊|愤怒|感动|悲伤|害怕|紧张|开心/.test(script)
    const hasTrans = /这时|此刻|另一边|与此同时|转眼/.test(script)
    const gaps: string[] = []
    if (!hasSeq) gaps.push("缺少时间顺序")
    if (!hasTrans) gaps.push("场景切换无过渡")
    const score = (hasCausal ? 15 : 0) + (hasSeq ? 15 : 0) + (hasEmo ? 20 : 0) + (hasTrans ? 15 : 0) + Math.min(25, lines.length * 4)
    setReport({ score: Math.min(score, 95), gaps, hasEmo, hasCausal, hasSeq, hasTrans })
  }, [script])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={"w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold text-[#0C0C14] " + (report?.score >= 65 ? "bg-[#10B981]" : "bg-[#F59E0B]")}>{report?.score || "?"}</div>
          <div>
            <div className="text-sm font-bold text-[#E8E8F0]">{report?.score >= 65 ? "✅ 脚本质量合格" : "⚠️ 需要优化"}</div>
            <div className="text-xs text-[#5A5A72]">{report?.gaps?.length ? report.gaps.length + " 个问题" : "暂无问题"}</div>
          </div>
        </div>
        <div className="text-xs text-[#5A5A72]">合格线 65分</div>
      </div>
      {report?.gaps?.length > 0 && (
        <div className="space-y-2">
          {report.gaps.includes("缺少时间顺序") && (
            <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
              <div className="text-xs font-semibold text-red-400 mb-1">情节不够跌宕起伏</div>
              <p className="text-[10px] text-red-400/70">建议增加「首先」「突然」「就在这时」等时间词，让故事有层次感</p>
            </div>
          )}
          {report.gaps.includes("场景切换无过渡") && (
            <div className="rounded-xl p-3 bg-red-500/10 border border-red-500/20">
              <div className="text-xs font-semibold text-red-400 mb-1">转场没有吸引力</div>
              <p className="text-[10px] text-red-400/70">段落之间跳跃太大，增加「与此同时」「另一边」等过渡词</p>
            </div>
          )}
          {!report?.hasEmo && (
            <div className="rounded-xl p-3 bg-amber-500/10 border border-amber-500/20">
              <div className="text-xs font-semibold text-amber-400 mb-1">情绪感染力不足</div>
              <p className="text-[10px] text-amber-400/70">加入「惊喜」「震惊」「感动」等情绪词</p>
            </div>
          )}
        </div>
      )}
      <pre className="text-xs text-[#9898B0] whitespace-pre-wrap bg-[#0C0C14] rounded-xl p-3 max-h-40 overflow-y-auto">{script}</pre>
      <button onClick={onBack} className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-xs font-bold hover:opacity-90">返回审核列表</button>
    </div>
  )
}

export default function ReviewPage() {
  const [log, setLog] = useState(() => getTodayContent())
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [scriptMode, setScriptMode] = useState<"list" | "qa">("list")
  const [scriptText, setScriptText] = useState("")

  const status = getReviewStatus(log.items)

    // 首次加载：从真实 API 获取今日内容，失败则回退到本地 mock
  useEffect(() => {
    if (log.items.length === 0) {
      (async () => {
        try {
          const res = await fetch("/api/daily-content/auto-generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ niche: "默认赛道", platform: "小红书", autoMode: true }),
          })
          if (res.ok) {
            const data = await res.json()
            const items = (data.items || data.results || []).map((item: any, i: number) => ({
              id: "daily_" + Date.now() + "_" + i,
              date: new Date().toISOString().slice(0, 10),
              type: item.type || "text",
              title: item.title || "AI自动生成",
              content: item.content || item.text || "",
              mediaUrl: item.imageUrl || "",
              hashtags: item.hashtags || [],
              suggestedTime: item.suggestedTime || "08:00",
              platform: item.platform || "小红书",
              action: "pending" as const,
              createdAt: new Date().toISOString(),
            }))
            if (items.length > 0) {
              const newLog = { ...log, items }
              setLog(newLog)
              saveDailyContent(newLog)
              return
            }
          }
        } catch {}
        // fallback：API 不可用时用本地 mock
        const mockItems = generateMockDailyItems()
        setLog({ ...log, items: mockItems })
        saveDailyContent({ ...log, items: mockItems })
      })()
    }
  }, [log])

  const handleAction = useCallback((itemId: string, action: ReviewAction) => {
    setLog(prev => {
      const newItems = updateItemAction(prev.items, itemId, action)
      saveDailyContent({ ...prev, items: newItems })
      return { ...prev, items: newItems }
    })
    setEditingItem(null)
  }, [])

  const handleEdit = useCallback((item: any) => {
    setEditingItem(item.id)
    setEditText(item.editedContent || item.content)
  }, [])

  const handleSaveEdit = useCallback((itemId: string) => {
    setLog(prev => {
      const newItems = updateItemAction(prev.items, itemId, "edited", editText)
      saveDailyContent({ ...prev, items: newItems })
      return { ...prev, items: newItems }
    })
    setEditingItem(null)
  }, [editText])

  const handlePublishAll = useCallback(() => {
    setLog(prev => {
      const newItems = prev.items.map(i => i.action === "pending" ? { ...i, action: "published" as const } : i)
      saveDailyContent({ ...prev, items: newItems, publishedAt: new Date().toISOString() })
      return { ...prev, items: newItems, publishedAt: new Date().toISOString() }
    })
  }, [])

  const typeIcon = (t: string) => t === "text" ? "📝" : t === "image" ? "🖼️" : t === "video" ? "🎬" : "📄"
  const actionBadge = (a: string) => a === "confirmed" || a === "published" ? "bg-[#10B981]/15 text-[#10B981]" : a === "edited" ? "bg-[#3B82F6]/15 text-[#3B82F6]" : a === "skipped" ? "bg-[#5A5A72]/15 text-[#5A5A72]" : "bg-[#F59E0B]/15 text-[#F59E0B]"
  const actionLabel = (a: string) => a === "confirmed" ? "已确认" : a === "published" ? "已发布" : a === "edited" ? "已修改" : a === "skipped" ? "已跳过" : "待审核"

  const allDone = status.totalItems > 0 && status.pending === 0

  if (scriptMode === "qa") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-lg">📝</div>
          <div><h1 className="text-xl font-bold text-[#E8E8F0]">脚本质检</h1><p className="text-sm text-[#9898B0]">AI评分 + 修改建议</p></div>
        </div>
        <QAReview script={scriptText} onBack={() => setScriptMode("list")} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-lg">✅</div>
          <div><h1 className="text-xl font-bold text-[#E8E8F0]">人工审核</h1><p className="text-sm text-[#9898B0]">审核每日内容 · 脚本质检</p></div>
        </div>
        <button onClick={() => setScriptMode("qa")}
          className="text-xs px-3 py-1.5 bg-[#F59E0B]/10 text-[#F59E0B] rounded-lg border border-[#F59E0B]/20 hover:bg-[#F59E0B]/20">
          📝 脚本质检
        </button>
      </div>

      {/* 脚本质检输入 */}
      <details className="glass-card overflow-hidden group">
        <summary className="px-4 py-2.5 text-xs font-medium text-[#9898B0] cursor-pointer hover:text-[#FBBF24]">📝 粘贴脚本让AI质检</summary>
        <div className="px-4 pb-4 space-y-3 border-t border-[#2A2A38] pt-3">
          <textarea value={scriptText} onChange={e => setScriptText(e.target.value)}
            placeholder="粘贴你的分镜脚本或文案..."
            rows={4} className="w-full resize-none rounded-xl bg-[#0C0C14] border border-[#F59E0B]/10 text-[#E8E8F0] text-xs placeholder-[#5A5A72] focus:outline-none focus:border-[#F59E0B]/40 px-3 py-2" />
          <button onClick={() => setScriptMode("qa")} disabled={!scriptText.trim()}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-xs font-bold hover:opacity-90 disabled:opacity-40">开始质检</button>
        </div>
      </details>

      {/* 进度 */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-[#E8E8F0]">📅 {log.date === new Date().toISOString().slice(0, 10) ? "今日内容" : log.date}</span>
          <span className="text-xs text-[#5A5A72]">{status.confirmed + status.edited}/{status.totalItems} 已处理</span>
        </div>
        {status.totalItems > 0 && (
          <div className="h-2 bg-[#0C0C14] rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#F97316] rounded-full transition-all" style={{ width: `${((status.confirmed + status.edited) / status.totalItems) * 100}%` }} />
          </div>
        )}
      </div>

      {/* 内容列表 */}
      <div className="space-y-2">
        {log.items.map((item) => (
          <div key={item.id} className={`glass-card p-4 ${item.action === "skipped" ? "opacity-40" : ""}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span>{typeIcon(item.type)}</span>
                <span className="text-xs font-medium text-[#E8E8F0]">{item.title.slice(0, 30)}</span>
              </div>
              <span className={"text-[10px] px-1.5 py-0.5 rounded-full " + actionBadge(item.action)}>{actionLabel(item.action)}</span>
            </div>
            {editingItem === item.id ? (
              <div className="space-y-2">
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4}
                  className="w-full resize-none rounded-xl bg-[#0C0C14] border border-[#F59E0B]/30 text-[#E8E8F0] px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]/60" />
                <div className="flex gap-1.5 justify-end">
                  <button onClick={() => setEditingItem(null)} className="px-3 py-1 text-xs rounded-lg border border-[#2A2A38] text-[#5A5A72] hover:text-[#9898B0]">取消</button>
                  <button onClick={() => handleSaveEdit(item.id)} className="px-3 py-1 text-xs rounded-lg bg-[#F59E0B] text-[#0C0C14] font-bold hover:bg-[#FBBF24]">保存</button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#9898B0] line-clamp-2">{item.editedContent || item.content}</p>
            )}
            {editingItem !== item.id && item.action !== "skipped" && (
              <div className="flex gap-1.5 mt-3 pt-3 border-t border-[#2A2A38]">
                <button onClick={() => handleAction(item.id, "published")} className="flex-1 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-xs font-bold hover:opacity-90">✅ 确认发布</button>
                <button onClick={() => handleEdit(item)} className="px-3 py-2 rounded-xl border border-[#2A2A38] text-[#9898B0] text-xs hover:text-[#FBBF24] hover:border-[#F59E0B]/30">✏️ 修改</button>
                <button onClick={() => handleAction(item.id, "skipped")} className="px-3 py-2 rounded-xl border border-[#2A2A38] text-[#5A5A72] text-xs hover:text-red-400 hover:border-red-400/30">🗑️ 跳过</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {status.pending > 0 && (
        <button onClick={handlePublishAll} className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold hover:opacity-90">🚀 一键发布剩余 {status.pending} 条</button>
      )}
      {allDone && (
        <div className="glass-card p-5 text-center border-[#10B981]/20 bg-[#10B981]/[0.04]">
          <p className="text-sm font-medium text-[#10B981]">今日内容已全部处理！</p>
        </div>
      )}
    </div>
  )
}
