"use client"
import { useState, useEffect } from "react"
import { useJiyingUser } from "../layout"
import Link from "next/link"

interface GalleryItem {
  id: string; title: string; type: string; description: string
  imageUrl?: string; author: string; createdAt: string
}

const DEMO_GALLERY: GalleryItem[] = [
  { id: "demo_1", title: "赛博朋克夜城漫游", type: "漫剧", description: "FPV视角穿越霓虹雨夜街道，主角在追寻一个神秘信号", author: "赛博创作者", createdAt: "2026-06-28", imageUrl: "" },
  { id: "demo_2", title: "咖啡馆的午后邂逅", type: "微短剧", description: "暖色调日系清新短剧，两个陌生人在复古咖啡馆的意外相遇", author: "故事制造机", createdAt: "2026-06-27", imageUrl: "" },
  { id: "demo_3", title: "Python量化策略回测入门", type: "知识图谱", description: "10分钟搞懂回测框架搭建，从数据获取到策略评估", author: "极简交易系统", createdAt: "2026-06-26", imageUrl: "" },
  { id: "demo_4", title: "智能扫地机器人深度评测", type: "产品广告", description: "30秒产品种草视频，自动集尘+激光导航卖点突出", author: "数码评测家", createdAt: "2026-06-25", imageUrl: "" },
  { id: "demo_5", title: "赛博禅寺", type: "漫剧", description: "传统寺庙与全息投影融合的梦幻漫剧，樱花与霓虹交相辉映", author: "视觉诗人", createdAt: "2026-06-24", imageUrl: "" },
  { id: "demo_6", title: "海底古城废墟", type: "微短剧", description: "深海探险题材短剧，阳光穿透水面照亮沉没古城", author: "深海创作者", createdAt: "2026-06-23", imageUrl: "" },
]

export default function PortfolioPage() {
  const { user } = useJiyingUser()
  const [tab, setTab] = useState<"mine" | "gallery">("gallery")
  const [myProjects, setMyProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      try {
        const raw = localStorage.getItem("sijian_video_projects")
        const all: any[] = raw ? JSON.parse(raw) : []
        setMyProjects(all.filter((p: any) => {
          const saved = localStorage.getItem(`sijian_project_owner_${p.id}`)
          return saved === user.id
        }))
      } catch {}
    }
    setLoading(false)
  }, [user])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl">🖼️</span>
        <div>
          <h1 className="text-xl font-bold text-[#E8E8F0]">
            {tab === "gallery" ? "作品展示" : `${user?.nickname || "我"}的作品`}
          </h1>
          <p className="text-xs text-[#9898B0] mt-0.5">
            {tab === "gallery" ? "付费会员的优秀作品展" : `共 ${myProjects.length} 个项目`}
          </p>
        </div>
        <div className="ml-auto flex gap-1 bg-[#0C0C14] rounded-xl p-1 border border-white/[0.06]">
          <button onClick={() => setTab("gallery")}
            className={`px-3 py-1 text-[10px] rounded-lg transition-all ${tab === "gallery" ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "text-white/40"}`}>🌟 作品展</button>
          {user && (
            <button onClick={() => setTab("mine")}
              className={`px-3 py-1 text-[10px] rounded-lg transition-all ${tab === "mine" ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "text-white/40"}`}>📁 我的</button>
          )}
        </div>
      </div>

      {tab === "gallery" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DEMO_GALLERY.map(item => (
            <div key={item.id} className="glass-card rounded-2xl overflow-hidden hover:shadow-hover transition-all group">
              <div className="aspect-video bg-gradient-to-br from-[#F59E0B]/10 to-[#F97316]/10 flex items-center justify-center text-5xl">
                {item.type === "漫剧" ? "📚" : item.type === "微短剧" ? "🎭" : item.type === "知识图谱" ? "📖" : "📢"}
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium text-[#E8E8F0]">{item.title}</div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]/70">{item.type}</span>
                  </div>
                </div>
                <p className="text-[10px] text-[#9898B0] line-clamp-2">{item.description}</p>
                <div className="flex items-center justify-between text-[9px] text-[#5A5A72]">
                  <span>👤 {item.author}</span>
                  <span>{item.createdAt}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : user ? (
        <>
          {loading ? (
            <div className="text-center py-12 text-[#5A5A72] text-sm">加载中...</div>
          ) : myProjects.length === 0 ? (
            <div className="border-2 border-dashed border-[#F59E0B]/10 rounded-2xl p-12 text-center">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-[#9898B0] text-sm mb-4">还没有作品</p>
              <Link href="/jiying/manga" className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold">开始创作</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myProjects.map((p: any) => (
                <div key={p.id} className="glass-card rounded-2xl p-5 hover:shadow-hover transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{p.genre === "comic" ? "📚" : p.genre === "short_drama" ? "🎭" : p.genre === "tutorial" ? "📖" : "📢"}</span>
                      <div>
                        <div className="text-sm font-medium text-[#E8E8F0]">{p.oneLiner?.slice(0, 30) || "未命名"}</div>
                        <div className="text-[10px] text-[#5A5A72]">{p.genre} · {p.style}</div>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "completed" ? "bg-green-500/10 text-green-400" : p.status === "running" ? "bg-amber-500/10 text-amber-400" : "bg-gray-500/10 text-gray-400"}`}>{p.status}</span>
                  </div>
                  <div className="text-[10px] text-[#5A5A72]">{new Date(p.createdAt).toLocaleDateString("zh-CN")}</div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-sm text-[#9898B0]">请先登录查看自己的作品</p>
          <Link href="/jiying" className="inline-block mt-4 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold">返回首页</Link>
        </div>
      )}
    </div>
  )
}
