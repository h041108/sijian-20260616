"use client"
import { useState } from "react"

interface Competition {
  id: string
  title: string
  description: string
  prize: string
  deadline: string
  status: "active" | "upcoming" | "ended"
  entries: number
  type: "image" | "video" | "manga" | "text"
  sponsor?: string
}

const MOCK_COMPETITIONS: Competition[] = [
  { id: "c1", title: "首届即影创作大赛", description: "用即影生成你最满意的作品，主题不限。最佳作品赢取 ¥5000 奖金+平台首页推荐", prize: "¥5000 + 首页推荐", deadline: "2026-08-01", status: "active", entries: 47, type: "image" },
  { id: "c2", title: "夏日美食漫剧挑战", description: "用漫剧引擎制作一条30秒内的美食视频，最佳运镜+叙事奖", prize: "¥2000 + 即影Pro年卡", deadline: "2026-07-25", status: "active", entries: 23, type: "manga" },
  { id: "c3", title: "爆款标题PK赛", description: "用Agent 10生成3个标题，评分最高者获胜", prize: "¥500 + 月卡", deadline: "2026-07-15", status: "active", entries: 89, type: "text" },
  { id: "c4", title: "秋日灵感征集", description: "主题预告，即将开启", prize: "待公布", deadline: "2026-09-01", status: "upcoming", entries: 0, type: "image" },
]

export default function CompetitionPage() {
  const [comps] = useState(MOCK_COMPETITIONS)
  const [activeFilter, setActiveFilter] = useState<string>("all")

  const filtered = activeFilter === "all" ? comps : comps.filter(c => c.type === activeFilter)

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🏆</span>
        <div><h1 className="text-xl font-bold text-gray-800">创作大赛</h1><p className="text-sm text-gray-400">用即影创作，赢取现金大奖和平台推荐</p></div>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-pink-500 rounded-2xl p-6 text-white text-center">
        <div className="text-2xl mb-1">🏆 首届即影创作大赛</div>
        <p className="text-sm text-white/80 mb-3">总奖金池 ¥10,000+ · 截止 2026-08-01</p>
        <button className="px-5 py-2 bg-white text-purple-700 rounded-xl text-sm font-medium hover:bg-purple-50">立即参赛</button>
      </div>

      <div className="flex gap-1.5">
        {[{ id: "all", label: "全部" }, { id: "image", label: "🖼️ 图片" }, { id: "manga", label: "📚 漫剧" }, { id: "text", label: "📝 文案" }].map(f => (
          <button key={f.id} onClick={() => setActiveFilter(f.id)}
            className={`px-3 py-1.5 text-xs rounded-lg border ${activeFilter === f.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200"}`}>{f.label}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className={`bg-white rounded-2xl border p-4 ${c.status === "upcoming" ? "opacity-60" : "border-gray-200 hover:shadow-md"}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-bold text-gray-800">{c.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{c.description}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${c.status === "active" ? "bg-green-100 text-green-700" : c.status === "upcoming" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"}`}>
                {c.status === "active" ? "进行中" : c.status === "upcoming" ? "即将开始" : "已结束"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex gap-3">
                <span>🏆 {c.prize}</span>
                <span>📅 {c.deadline}</span>
                <span>👥 {c.entries}人参赛</span>
              </div>
              {c.status === "active" && <button className="text-indigo-600 font-medium">查看详情 →</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
