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
          <div className={"w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-extrabold text-white " + (report?.score >= 65 ? "bg-green-500" : "bg-amber-500")}>{report?.score || "?"}</div>
          <div>
            <div className="text-sm font-bold text-gray-800">{report?.score >= 65 ? "✅ 脚本质量合格" : "⚠️ 需要优化"}</div>
            <div className="text-xs text-gray-400">{report?.gaps?.length ? report.gaps.length + " 个问题" : "暂无问题"}</div>
          </div>
        </div>
        <div className="text-xs text-gray-400">合格线 65分</div>
      </div>
      {report?.gaps?.length > 0 && (
        <div className="space-y-2">
          {report.gaps.includes("缺少时间顺序") && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="text-xs font-semibold text-red-700 mb-1">情节不够跌宕起伏</div>
              <p className="text-[10px] text-red-600">建议增加「首先」「突然」「就在这时」等时间词，让故事有层次感</p>
            </div>
          )}
          {report.gaps.includes("场景切换无过渡") && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <div className="text-xs font-semibold text-red-700 mb-1">转场没有吸引力</div>
              <p className="text-[10px] text-red-600">段落之间跳跃太大，增加「与此同时」「另一边」等过渡词</p>
            </div>
          )}
          {!report?.hasEmo && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="text-xs font-semibold text-amber-700 mb-1">情绪感染力不足</div>
              <p className="text-[10px] text-amber-600">加入「惊喜」「震惊」「感动」等情绪词</p>
            </div>
          )}
        </div>
      )}
      <pre className="text-xs text-gray-600 whitespace-pre-wrap bg-gray-50 rounded-xl p-3 max-h-40 overflow-y-auto">{script}</pre>
      <button onClick={onBack} className="w-full py-2 bg-gray-900 text-white rounded-xl text-xs font-medium hover:bg-gray-800">返回审核列表</button>
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

  useEffect(() => {
    if (log.items.length === 0) {
      const mockItems = generateMockDailyItems()
      const newLog = { ...log, items: mockItems }
      setLog(newLog)
      saveDailyContent(newLog)
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
  const actionBadge = (a: string) => a === "confirmed" || a === "published" ? "bg-green-100 text-green-700" : a === "edited" ? "bg-blue-100 text-blue-700" : a === "skipped" ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700"
  const actionLabel = (a: string) => a === "confirmed" ? "已确认" : a === "published" ? "已发布" : a === "edited" ? "已修改" : a === "skipped" ? "已跳过" : "待审核"

  const allDone = status.totalItems > 0 && status.pending === 0

  if (scriptMode === "qa") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📝</span>
          <div><h1 className="text-xl font-bold text-gray-800">脚本质检</h1><p className="text-sm text-gray-400">AI评分 + 修改建议</p></div>
        </div>
        <QAReview script={scriptText} onBack={() => setScriptMode("list")} />
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <span className="text-3xl">✅</span>
          <div><h1 className="text-xl font-bold text-gray-800">人工审核</h1><p className="text-sm text-gray-400">审核每日内容 · 脚本质检</p></div>
        </div>
        <button onClick={() => setScriptMode("qa")}
          className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200 hover:bg-indigo-100">
          📝 脚本质检
        </button>
      </div>

      {/* 脚本质检输入 */}
      <details className="bg-white rounded-xl border border-gray-200">
        <summary className="px-4 py-2.5 text-xs font-medium text-gray-500 cursor-pointer hover:text-gray-700">📝 粘贴脚本让AI质检</summary>
        <div className="px-4 pb-3 space-y-2">
          <textarea value={scriptText} onChange={e => setScriptText(e.target.value)}
            placeholder="粘贴你的分镜脚本或文案..."
            rows={4} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <button onClick={() => setScriptMode("qa")} disabled={!scriptText.trim()}
            className="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium hover:bg-indigo-700 disabled:bg-gray-300">开始质检</button>
        </div>
      </details>

      {/* 进度 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">📅 {log.date === new Date().toISOString().slice(0, 10) ? "今日内容" : log.date}</span>
          <span className="text-xs text-gray-400">{status.confirmed + status.edited}/{status.totalItems} 已处理</span>
        </div>
        {status.totalItems > 0 && (
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${((status.confirmed + status.edited) / status.totalItems) * 100}%` }} />
          </div>
        )}
      </div>

      {/* 内容列表 */}
      <div className="space-y-2">
        {log.items.map((item) => (
          <div key={item.id} className={"bg-white rounded-2xl border p-3 " + (item.action === "skipped" ? "opacity-40 border-gray-200" : "border-gray-200")}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span>{typeIcon(item.type)}</span>
                <span className="text-xs font-medium text-gray-700">{item.title.slice(0, 30)}</span>
              </div>
              <span className={"text-[10px] px-1.5 py-0.5 rounded-full " + actionBadge(item.action)}>{actionLabel(item.action)}</span>
            </div>
            {editingItem === item.id ? (
              <div className="space-y-2">
                <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4}
                  className="w-full resize-none rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-1.5 justify-end">
                  <button onClick={() => setEditingItem(null)} className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-500">取消</button>
                  <button onClick={() => handleSaveEdit(item.id)} className="px-3 py-1 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700">保存</button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-600 line-clamp-2">{item.editedContent || item.content}</p>
            )}
            {editingItem !== item.id && item.action !== "skipped" && (
              <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-50">
                <button onClick={() => handleAction(item.id, "published")} className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">✅ 确认发布</button>
                <button onClick={() => handleEdit(item)} className="px-3 py-1.5 bg-white text-gray-600 rounded-lg text-xs border border-gray-200 hover:border-indigo-300">✏️ 修改</button>
                <button onClick={() => handleAction(item.id, "skipped")} className="px-3 py-1.5 bg-white text-gray-400 rounded-lg text-xs border border-gray-200 hover:border-red-300">🗑️ 跳过</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {status.pending > 0 && (
        <button onClick={handlePublishAll} className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">🚀 一键发布剩余 {status.pending} 条</button>
      )}
      {allDone && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <p className="text-sm font-medium text-green-700">今日内容已全部处理！</p>
        </div>
      )}
    </div>
  )
}
