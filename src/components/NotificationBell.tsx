"use client"

import { useState, useEffect, useRef } from "react"

interface Notification {
  id: string
  type: "review" | "data" | "system"
  title: string
  message: string
  time: string
  read: boolean
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "review", title: "审核完成", message: "内容「冬日养生汤」已通过审核，点击查看", time: "2分钟前", read: false },
  { id: "n2", type: "data", title: "数据复盘", message: "昨日内容曝光量 1.2万，互动率 8.3%", time: "1小时前", read: false },
  { id: "n3", type: "system", title: "系统公告", message: "即影已升级 v2.1，新增短剧工坊功能", time: "昨天", read: false },
  { id: "n4", type: "review", title: "待审核", message: "你有 3 条内容待审核，请及时处理", time: "3小时前", read: true },
  { id: "n5", type: "data", title: "爆款提醒", message: "「夏季穿搭指南」播放量突破 5 万", time: "昨天", read: true },
]

const TYPE_ICONS: Record<string, string> = {
  review: "\u2705",
  data: "\ud83d\udcca",
  system: "\ud83d\udd14",
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS)
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as HTMLElement)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const markAllRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg bg-[#0C0C14] text-[#9898B0] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8 transition-all"
        title="通知"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full bg-[#EF4444] text-[8px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-[#1A1A2E] border border-[#2A2A38] rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A38]">
            <span className="text-xs font-bold text-[#E8E8F0]">\ud83d\udd14 通知</span>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[10px] text-[#F59E0B]/60 hover:text-[#F59E0B]">
                全部已读
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[#5A5A72]">暂无通知</div>
            ) : (
              notifications.map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-[#2A2A38]/50 hover:bg-[#F59E0B]/5 cursor-pointer transition-colors ${n.read ? "" : "bg-[#F59E0B]/3"}`}>
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5">{TYPE_ICONS[n.type] || "\ud83d\udd14"}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[#E8E8F0]">{n.title}</span>
                        <span className="text-[10px] text-[#5A5A72] shrink-0 ml-2">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-[#9898B0] mt-0.5 line-clamp-2">{n.message}</p>
                    </div>
                    {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] shrink-0 mt-1.5" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
