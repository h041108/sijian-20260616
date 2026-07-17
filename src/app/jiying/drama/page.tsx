"use client"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useJiyingUser } from "../layout"

interface DramaProject {
  id: string; title: string; genre: string; status: string
  chapterCount: number; shotCount: number; createdAt: string; updatedAt: string
}

const GENRES = [
  { id: "short_drama", label: "微短剧", icon: "🎭", desc: "剧情向短视频" },
  { id: "comic", label: "漫剧", icon: "📚", desc: "漫画风格叙事" },
  { id: "tutorial", label: "知识科普", icon: "📖", desc: "教育科普" },
  { id: "ad", label: "产品广告", icon: "📢", desc: "产品种草" },
]
const STATUS: Record<string,string> = { draft:"草稿", extracting:"分析中", ready:"已就绪", generating:"生成中", done:"已完成" }
const SCOLORS: Record<string,string> = { draft:"text-[#5A5A72] bg-white/5", extracting:"text-[#F59E0B] bg-[#F59E0B]/10", ready:"text-green-400 bg-green-400/10", generating:"text-blue-400 bg-blue-400/10", done:"text-[#8B5CF6] bg-[#8B5CF6]/10" }

export default function DramaPage() {
  const { user } = useJiyingUser()
  const [projects, setProjects] = useState<DramaProject[]>([])
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newGenre, setNewGenre] = useState("short_drama")
  const [newScript, setNewScript] = useState("")

  useEffect(() => { fetch("/api/drama/projects").then(r=>r.json()).then(setProjects).catch(()=>{}) }, [])

  const createProject = async () => {
    if (!newTitle) return
    const res = await fetch("/api/drama/projects", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ title:newTitle, genre:newGenre, script:newScript }) })
    if (res.ok) { setShowCreate(false); setNewTitle(""); setNewScript(""); fetch("/api/drama/projects").then(r=>r.json()).then(setProjects) }
  }

  return (
    <div className="min-h-screen bg-[#0C0C14] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl font-bold text-[#E8E8F0]">🎭 短剧工坊</h1>
            <p className="text-xs text-[#5A5A72] mt-1">AI 短剧全流程制作：剧本 → 分幕 → 角色 → 镜头 → 成片</p>
          </div>
          <button onClick={()=>setShowCreate(!showCreate)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold">+ 新建项目</button>
        </div>

        {showCreate && (
          <div className="bg-[#1A1A2E] rounded-2xl p-6 border border-white/5 mb-8">
            <h2 className="text-base font-bold text-[#E8E8F0] mb-4">新建短剧项目</h2>
            <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="项目名称" className="w-full px-4 py-3 rounded-xl bg-[#0C0C14] border border-[#F59E0B]/10 text-[#E8E8F0] text-sm mb-3 focus:outline-none focus:border-[#F59E0B]/40" />
            <div className="flex gap-2 mb-3">
              {GENRES.map(g => (
                <button key={g.id} onClick={()=>setNewGenre(g.id)}
                  className={'px-3 py-2 rounded-xl text-xs font-medium transition-all '+(newGenre===g.id?'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30':'bg-white/5 text-[#5A5A72] border border-white/5')}>
                  {g.icon} {g.label}
                </button>
              ))}
            </div>
            <textarea value={newScript} onChange={e=>setNewScript(e.target.value)} placeholder="粘贴剧本内容..." rows={6}
              className="w-full px-4 py-3 rounded-xl bg-[#0C0C14] border border-[#F59E0B]/10 text-[#E8E8F0] text-sm mb-3 focus:outline-none focus:border-[#F59E0B]/40 resize-none" />
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowCreate(false)} className="px-4 py-2 rounded-xl bg-white/5 text-[#5A5A72] text-xs">取消</button>
              <button onClick={createProject} className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-xs font-bold">{user?"创建并分析":"请先登录"}</button>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {projects.map(p => (
            <Link key={p.id} href={"/jiying/drama/"+p.id}
              className="bg-[#1A1A2E] rounded-2xl p-5 border border-white/5 hover:border-[#F59E0B]/20 transition-all block">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#E8E8F0]">{p.title}</h3>
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#5A5A72]">
                    <span>{GENRES.find(g=>g.id===p.genre)?.icon} {GENRES.find(g=>g.id===p.genre)?.label||p.genre}</span>
                    <span>{p.chapterCount} 幕 · {p.shotCount} 镜头</span>
                    <span>{new Date(p.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className={'px-2.5 py-1 rounded-lg text-[10px] font-medium '+(SCOLORS[p.status]||'')}>{STATUS[p.status]||p.status}</span>
              </div>
            </Link>
          ))}
          {projects.length===0 && !showCreate && (
            <div className="text-center py-16 text-[#5A5A72]">
              <div className="text-4xl mb-3">🎬</div>
              <p className="text-sm">还没有短剧项目</p>
              <p className="text-[10px] mt-1">点击上方"新建项目"开始创作</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}