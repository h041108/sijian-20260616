"use client"
import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"

interface Chapter { id: string; title: string; order: number; content: string; shotCount: number; status: string }
interface DramaProject {
  id: string; title: string; genre: string; status: string; script: string
  chapterCount: number; shotCount: number
  chapters: Chapter[]; entities: { characters: any[]; scenes: any[]; props: any[] }
  createdAt: string; updatedAt: string
}

const TABS = [
  { id:"overview", label:"总览", icon:"📊" },
  { id:"chapters", label:"分幕管理", icon:"📑" },
  { id:"characters", label:"角色管理", icon:"👤" },
  { id:"shots", label:"镜头列表", icon:"🎬" },
  { id:"export", label:"生成导出", icon:"🚀" },
]

export default function ProjectDetail() {
  const params = useParams()
  const [project, setProject] = useState<DramaProject | null>(null)
  const [activeTab, setActiveTab] = useState("overview")
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetch("/api/drama/projects").then(r=>r.json()).then((all:DramaProject[])=>{
      const p = all.find(x=>x.id===params.id)
      if (p) setProject(p)
    })
  }, [params.id])

  const runAnalysis = async () => {
    if (!project) return; setAnalyzing(true)
    await fetch("/api/drama/analyze", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({projectId:project.id}) })
    const updated = await fetch("/api/drama/projects").then(r=>r.json())
    const p = updated.find((x:DramaProject)=>x.id===params.id)
    if (p) setProject(p); setAnalyzing(false)
  }

  if (!project) return <div className="min-h-screen bg-[#0C0C14] p-8 text-center text-[#5A5A72]">加载中...</div>

  return (
    <div className="min-h-screen bg-[#0C0C14]">
      <div className="border-b border-white/5 bg-[#1A1A2E]/50 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="flex items-center h-12 gap-3">
            <Link href="/jiying/drama" className="text-[10px] text-[#5A5A72] hover:text-[#FBBF24]">← 返回</Link>
            <span className="text-white/20">|</span>
            <span className="text-sm font-bold text-[#E8E8F0]">{project.title}</span>
            <span className={'px-2 py-0.5 rounded text-[10px] font-medium '+(project.status==="draft"?"text-[#5A5A72] bg-white/5":project.status==="ready"?"text-green-400 bg-green-400/10":"")}>{project.status}</span>
          </div>
          <div className="flex gap-1 pb-0">
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                className={'px-3 py-2 text-xs font-medium rounded-t-lg transition-all '+(activeTab===t.id?'bg-[#0C0C14] text-[#FBBF24] border-t border-l border-r border-white/5':'text-[#5A5A72] hover:text-[#9898B0]')}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {activeTab==="overview" && (
          <div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-[#1A1A2E] rounded-2xl p-4 border border-white/5">
                <div className="text-2xl mb-1">📑</div>
                <div className="text-lg font-bold text-[#E8E8F0]">{project.chapterCount}</div>
                <div className="text-[10px] text-[#5A5A72]">分幕</div>
              </div>
              <div className="bg-[#1A1A2E] rounded-2xl p-4 border border-white/5">
                <div className="text-2xl mb-1">👤</div>
                <div className="text-lg font-bold text-[#E8E8F0]">{project.entities.characters.length}</div>
                <div className="text-[10px] text-[#5A5A72]">角色</div>
              </div>
              <div className="bg-[#1A1A2E] rounded-2xl p-4 border border-white/5">
                <div className="text-2xl mb-1">🎬</div>
                <div className="text-lg font-bold text-[#E8E8F0]">{project.shotCount}</div>
                <div className="text-[10px] text-[#5A5A72]">镜头</div>
              </div>
            </div>
            {project.script && (
              <div className="bg-[#1A1A2E] rounded-2xl p-5 border border-white/5 mb-6">
                <h3 className="text-sm font-bold text-[#E8E8F0] mb-3">原始剧本</h3>
                <pre className="text-xs text-[#9898B0] whitespace-pre-wrap font-sans">{project.script.slice(0,1000)}{project.script.length>1000?"...":""}</pre>
              </div>
            )}
            {project.status==="draft" && project.script && (
              <button onClick={runAnalysis} disabled={analyzing}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
                {analyzing?"AI 分析中...":"开始分析剧本（分幕 + 角色提取）"}
              </button>
            )}
          </div>
        )}

        {activeTab==="chapters" && (
          <div>
            <h3 className="text-sm font-bold text-[#E8E8F0] mb-4">分幕列表</h3>
            {project.chapters.map((ch,i)=>(
              <div key={ch.id} className="bg-[#1A1A2E] rounded-2xl p-4 border border-white/5 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-[#E8E8F0]">第{ch.order}幕: {ch.title}</h4>
                  <span className="text-[10px] text-[#5A5A72]">{ch.shotCount}镜头</span>
                </div>
                <p className="text-xs text-[#9898B0] line-clamp-3">{ch.content}</p>
              </div>
            ))}
            {project.chapters.length===0 && <div className="text-center py-12 text-[#5A5A72]"><p className="text-sm">暂无分幕</p></div>}
          </div>
        )}

        {activeTab==="characters" && (
          <div>
            <h3 className="text-sm font-bold text-[#E8E8F0] mb-4">角色列表</h3>
            <div className="grid gap-3">
              {project.entities.characters.map((c,i)=>(
                <div key={i} className="bg-[#1A1A2E] rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-sm font-bold text-[#0C0C14]">{c.name[0]}</div>
                    <div>
                      <h4 className="text-sm font-bold text-[#E8E8F0]">{c.name}</h4>
                      <p className="text-[10px] text-[#5A5A72]">{c.description}</p>
                      <div className="flex gap-1 mt-1">{(c.traits||[]).map((t:string,ti:number)=><span key={ti} className="px-1.5 py-0.5 rounded bg-white/5 text-[10px] text-[#9898B0]">{t}</span>)}</div>
                    </div>
                  </div>
                </div>
              ))}
              {project.entities.characters.length===0 && <div className="text-center py-12 text-[#5A5A72]"><p className="text-sm">暂无角色</p></div>}
            </div>
          </div>
        )}

        {activeTab==="shots" && <div className="text-center py-12 text-[#5A5A72]"><div className="text-3xl mb-2">🎬</div><p className="text-sm">镜头管理</p><p className="text-[10px] mt-1">分幕后将自动生成镜头</p></div>}
        {activeTab==="export" && <div className="text-center py-12 text-[#5A5A72]"><div className="text-3xl mb-2">🚀</div><p className="text-sm">生成与导出</p><p className="text-[10px] mt-1">完成分幕和镜头后一键生成</p></div>}
      </div>
    </div>
  )
}