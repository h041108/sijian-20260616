"use client"
import { useState } from "react"

interface Account { id: string; platform: string; icon: string; nickname: string; status: "已绑定" | "未绑定"; stats?: { views: number; likes: number; posts: number } }
interface ContentItem { title: string; date: string; status: "已发布" | "草稿"; type: string }

const MOCK_ACCOUNTS: Account[] = [
  { id: "a1", platform: "小红书", icon: "📕", nickname: "美食主号", status: "已绑定", stats: { views: 12500, likes: 830, posts: 23 } },
  { id: "a2", platform: "抖音", icon: "🎵", nickname: "美食号", status: "已绑定", stats: { views: 32000, likes: 2100, posts: 15 } },
  { id: "a3", platform: "B站", icon: "📺", nickname: "美食日常", status: "已绑定", stats: { views: 8700, likes: 420, posts: 8 } },
  { id: "a4", platform: "微信公众号", icon: "📱", nickname: "美食日记", status: "未绑定" },
]

const MOCK_CONTENT: Record<string, ContentItem[]> = {
  a1: [{ title: "冬日暖胃汤食谱合集", date: "2026-06-25", status: "已发布", type: "图文" },{ title: "5分钟快手早餐教程", date: "2026-06-24", status: "已发布", type: "视频" },{ title: "周末烘焙计划", date: "2026-06-27", status: "草稿", type: "图文" }],
  a2: [{ title: "挑战100元吃一周", date: "2026-06-26", status: "已发布", type: "视频" },{ title: "探店老字号面馆", date: "2026-06-23", status: "已发布", type: "视频" }],
  a3: [{ title: "从零开始学烘焙EP1", date: "2026-06-20", status: "已发布", type: "长视频" }],
}

const PI: Record<string,string> = { "小红书":"📕","抖音":"🎵","B站":"📺","微信公众号":"📱" }

export default function PortfolioPage() {
  const [activeId, setActiveId] = useState("a1")
  const [menuOpen, setMenuOpen] = useState(false)
  const active = MOCK_ACCOUNTS.find(a => a.id === activeId)
  const bound = MOCK_ACCOUNTS.filter(a => a.status === "已绑定")
  const content = MOCK_CONTENT[activeId] || []

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🖼️</span>
        <div><h1 className="text-xl font-bold text-gray-800">我的作品</h1><p className="text-sm text-gray-400">各平台账号的内容发布记录</p></div>
      </div>

      {/* 账号切换 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500">当前账号：</span>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 rounded-lg text-sm font-medium text-indigo-700">
              {active && <><span>{active.icon}</span><span>{active.platform}-{active.nickname}</span></>}
              <span className="text-indigo-300">▼</span>
            </button>
            {menuOpen && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl border border-gray-200 shadow-lg p-1 z-50">
                {bound.map(a => (
                  <button key={a.id} onClick={() => { setActiveId(a.id); setMenuOpen(false) }}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${activeId === a.id ? "bg-indigo-50 text-indigo-700" : "text-gray-600 hover:bg-gray-50"}`}>
                    <span>{a.icon}</span><span className="flex-1">{a.platform}-{a.nickname}</span>
                    <span className="text-[9px] text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">已绑定</span>
                  </button>
                ))}
                <hr className="my-1 border-gray-100" />
                {MOCK_ACCOUNTS.filter(a => a.status === "未绑定").map(a => (
                  <div key={a.id} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-400">
                    <span>{a.icon}</span><span className="flex-1">{a.platform}-{a.nickname}</span>
                    <span className="text-[9px] text-gray-400">未绑定</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <span className="ml-auto text-xs text-gray-400">共 {bound.length} 个已绑定账号</span>
        </div>
      </div>

      {/* 统计 */}
      {active?.stats && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-lg font-extrabold text-gray-800">{(active.stats.views/10000).toFixed(1)}万</div>
            <div className="text-[10px] text-gray-400">总播放</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-lg font-extrabold text-indigo-600">{active.stats.likes}</div>
            <div className="text-[10px] text-gray-400">总互动</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="text-lg font-extrabold text-green-600">{active.stats.posts}</div>
            <div className="text-[10px] text-gray-400">已发布</div>
          </div>
        </div>
      )}

      {/* 内容列表 */}
      <div className="space-y-2">
        {content.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">暂无内容</div>
        ) : content.map((c,i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-lg">{c.type === "视频" ? "🎬" : c.type === "长视频" ? "📺" : "📝"}</span>
              <div>
                <div className="text-sm font-medium text-gray-800">{c.title}</div>
                <div className="text-[10px] text-gray-400">{c.date}</div>
              </div>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full ${c.status === "已发布" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{c.status}</span>
          </div>
        ))}
      </div>

      {/* 绑定提醒 */}
      {MOCK_ACCOUNTS.filter(a => a.status === "未绑定").length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex items-center justify-between">
          <span>还有 {MOCK_ACCOUNTS.filter(a => a.status === "未绑定").length} 个账号未绑定</span>
          <a href="/jiying/onboarding" className="text-indigo-600 font-medium">去绑定 →</a>
        </div>
      )}
    </div>
  )
}
