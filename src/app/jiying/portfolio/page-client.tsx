"use client"
import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useJiyingUser } from "../layout"
import Link from "next/link"

interface ProjectSave {
  id: string; title: string; genre: string; style: string; status: string
  createdAt: string; updatedAt: string; userId: string
}

const PLATFORM_ICONS: Record<string,string> = { "短视频":"🎬","短剧":"🎭","漫剧":"📚","知识讲解":"📖","产品广告":"📢","故事叙述":"📖" }

export default function PortfolioPage() {
  const { user } = useJiyingUser()
  const [projects, setProjects] = useState<ProjectSave[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }
    loadProjects()
  }, [user])

  async function loadProjects() {
    if (!user) return
    // 优先从 Supabase 加载
    if ((process.env.NEXT_PUBLIC_SUPABASE_URL || "").length > 0) {
      const { data }: any = await supabase
        .from("video_projects")
        .select("id,one_liner as title,genre,style,status,created_at as createdAt,updated_at as updatedAt,user_id as userId")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      if (data) { setProjects(data); setLoading(false); return }
    }
    // fallback localStorage
    const raw = localStorage.getItem("sijian_video_projects")
    const all: any[] = raw ? JSON.parse(raw) : []
    setProjects(all.filter((p: any) => {
      const saved = localStorage.getItem(`sijian_project_owner_${p.id}`)
      return !saved || saved === user.id
    }))
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-white/80 mb-2">请先登录</h1>
        <p className="text-sm text-white/30 mb-6">登录后可查看和管理你的作品</p>
        <Link href="/jiying" className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold">返回首页</Link>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🖼️</span>
        <div>
          <h1 className="text-xl font-bold text-[#E8E8F0]">{user.nickname} 的作品</h1>
          <p className="text-sm text-[#9898B0]">共 {projects.length} 个项目</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#5A5A72] text-sm">加载中...</div>
      ) : projects.length === 0 ? (
        <div className="border-2 border-dashed border-[#F59E0B]/10 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🎬</div>
          <p className="text-[#9898B0] text-sm mb-4">还没有作品</p>
          <Link href="/jiying/agents/agent-router" className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold">
            开始创作
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map(p => (
            <div key={p.id} className="glass-card rounded-2xl p-5 hover:shadow-hover transition-all">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{PLATFORM_ICONS[p.genre] || "🎬"}</span>
                  <div>
                    <div className="text-sm font-medium text-[#E8E8F0]">{p.title?.slice(0, 30) || "未命名"}</div>
                    <div className="text-[10px] text-[#5A5A72]">{p.genre} · {p.style}</div>
                  </div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  p.status === "completed" ? "bg-green-500/10 text-green-400" :
                  p.status === "running" ? "bg-amber-500/10 text-amber-400" : "bg-gray-500/10 text-gray-400"
                }`}>{p.status}</span>
              </div>
              <div className="text-[10px] text-[#5A5A72]">{new Date(p.createdAt).toLocaleDateString("zh-CN")}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
