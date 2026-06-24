"use client"
import { useState, useCallback, useEffect } from "react"
import {
  getTodayContent, saveDailyContent, updateItemAction, getReviewStatus,
  generateMockDailyItems,
  type DailyContentItem, type ReviewAction,
} from "@/lib/review-store"

export default function ReviewPage() {
  const [log, setLog] = useState(() => getTodayContent())
  const [editingItem, setEditingItem] = useState<string | null>(null)
  const [editText, setEditText] = useState("")
  const [showPreview, setShowPreview] = useState<string | null>(null)

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
      const newLog = { ...prev, items: newItems }
      saveDailyContent(newLog)
      return newLog
    })
    setEditingItem(null)
  }, [])

  const handleEdit = useCallback((item: DailyContentItem) => {
    setEditingItem(item.id)
    setEditText(item.editedContent || item.content)
  }, [])

  const handleSaveEdit = useCallback((itemId: string) => {
    setLog(prev => {
      const newItems = updateItemAction(prev.items, itemId, "edited", editText)
      const newLog = { ...prev, items: newItems }
      saveDailyContent(newLog)
      return newLog
    })
    setEditingItem(null)
  }, [editText])

  const handlePublishAll = useCallback(() => {
    setLog(prev => {
      const newItems = prev.items.map(i =>
        i.action === "pending" ? { ...i, action: "published" as const } : i,
      )
      const newLog = { ...prev, items: newItems, publishedAt: new Date().toISOString() }
      saveDailyContent(newLog)
      return newLog
    })
  }, [])

  const typeIcon = (t: string) => {
    if (t === "text") return "📝"
    if (t === "image") return "🖼️"
    if (t === "video") return "🎬"
    if (t === "manga") return "📚"
    return "📄"
  }

  const actionBadge = (a: ReviewAction) => {
    if (a === "confirmed" || a === "published") return "bg-green-100 text-green-700"
    if (a === "edited") return "bg-blue-100 text-blue-700"
    if (a === "skipped") return "bg-gray-100 text-gray-500"
    return "bg-amber-100 text-amber-700"
  }

  const actionLabel = (a: ReviewAction) => {
    if (a === "confirmed") return "已确认"
    if (a === "published") return "已发布"
    if (a === "edited") return "已修改"
    if (a === "skipped") return "已跳过"
    return "待审核"
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">✅</span>
        <div>
          <h1 className="text-xl font-bold text-gray-800">每日审核</h1>
          <p className="text-sm text-gray-400">每天30秒 · 确认内容后一键发布</p>
        </div>
      </div>

      {/* Status bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-gray-700">
            {log.date === new Date().toISOString().slice(0, 10) ? "📅 今日内容" : `📅 ${log.date}`}
          </span>
          <span className="text-xs text-gray-400">{status.confirmed + status.edited}/{status.totalItems} 已处理</span>
        </div>
        {status.totalItems > 0 && (
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all"
              style={{ width: `${((status.confirmed + status.edited) / status.totalItems) * 100}%` }} />
          </div>
        )}
        {status.pending > 0 && (
          <p className="text-xs text-amber-600 mt-2">⏳ 还有 {status.pending} 条待审核</p>
        )}
      </div>

      {/* Items */}
      <div className="space-y-2">
        {log.items.map((item) => (
          <div key={item.id}
            className={`bg-white rounded-2xl border p-3 transition-all ${item.action === "skipped" ? "opacity-40" : "border-gray-200"}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span>{typeIcon(item.type)}</span>
                <span className="text-xs font-medium text-gray-700">{item.title.slice(0, 30)}</span>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${actionBadge(item.action)}`}>
                {actionLabel(item.action)}
              </span>
            </div>

            {/* Content */}
            {editingItem === item.id ? (
              <div className="space-y-2">
                <textarea value={editText} onChange={e => setEditText(e.target.value)}
                  rows={5}
                  className="w-full resize-none rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-1.5 justify-end">
                  <button onClick={() => setEditingItem(null)}
                    className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-500">取消</button>
                  <button onClick={() => handleSaveEdit(item.id)}
                    className="px-3 py-1 text-xs rounded-lg bg-blue-600 text-white hover:bg-blue-700">保存修改</button>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-xs text-gray-600 line-clamp-2">{item.editedContent || item.content}</p>
                {item.hashtags && item.hashtags.length > 0 && (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {item.hashtags.map((h, i) => (
                      <span key={i} className="text-[9px] text-indigo-500">{h}</span>
                    ))}
                  </div>
                )}
                {item.suggestedTime && (
                  <p className="text-[9px] text-gray-400 mt-1">⏰ 建议 {item.suggestedTime} 发布 · {item.platform}</p>
                )}
              </div>
            )}

            {/* Actions (only when not editing) */}
            {editingItem !== item.id && item.action !== "skipped" && (
              <div className="flex gap-1.5 mt-2 pt-2 border-t border-gray-50">
                <button onClick={() => handleAction(item.id, "published")}
                  className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">✅ 确认发布</button>
                <button onClick={() => handleEdit(item)}
                  className="px-3 py-1.5 bg-white text-gray-600 rounded-lg text-xs border border-gray-200 hover:border-indigo-300">✏️ 修改</button>
                <button onClick={() => handleAction(item.id, "skipped")}
                  className="px-3 py-1.5 bg-white text-gray-400 rounded-lg text-xs border border-gray-200 hover:border-red-300">🗑️ 跳过</button>
              </div>
            )}
            {item.action === "skipped" && (
              <button onClick={() => handleAction(item.id, "pending")}
                className="mt-2 text-[10px] text-gray-400 hover:text-indigo-600">撤销跳过</button>
            )}
          </div>
        ))}
      </div>

      {/* Publish all */}
      {status.pending > 0 && (
        <button onClick={handlePublishAll}
          className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
          🚀 一键发布剩余 {status.pending} 条
        </button>
      )}

      {status.allDone && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center">
          <div className="text-2xl mb-1">🎉</div>
          <p className="text-sm font-medium text-green-700">今日内容已全部处理！</p>
          <p className="text-xs text-green-500 mt-1">明天早上8:00会有新内容推送</p>
        </div>
      )}

      {log.publishedAt && (
        <div className="text-xs text-gray-400 text-center">
          上次发布：{new Date(log.publishedAt).toLocaleString("zh")}
        </div>
      )}
    </div>
  )
}
