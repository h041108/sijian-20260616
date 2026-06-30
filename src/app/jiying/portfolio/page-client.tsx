"use client"
import { useState, useEffect, useCallback } from "react"
import { useJiyingUser } from "../layout"
import Link from "next/link"
import { loadProjects } from "@/lib/video-factory"

export default function PortfolioPage() {
  const { user } = useJiyingUser()
  const [tab, setTab] = useState<"gallery" | "mine">("mine")
  const [projects, setProjects] = useState<any[]>([])
  const [videoUrls, setVideoUrls] = useState<Record<string, string>>({})
  const [polling, setPolling] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)

  // 加载项目并轮询 Seedance 结果
  useEffect(() => {
    const all = loadProjects()
    // 过滤出当前用户的项目
    const mine = all.filter((p: any) => {
      const owner = localStorage.getItem(`sijian_project_owner_${p.id}`)
      return !owner || (user && owner === user.id)
    })
    setProjects(mine)
    setLoading(false)

    // 自动轮询 Seedance 任务
    mine.forEach((p: any) => {
      const visStage = p.stages?.find((s: any) => s.stageId === "visual_generation")
      if (!visStage?.output) return
      try {
        const vo = JSON.parse(visStage.output)
        const taskIds: string[] = []
        if (vo.frames) vo.frames.forEach((f: any) => { if (f.seedanceTaskId) taskIds.push(f.seedanceTaskId) })
        if (vo.seedanceTaskIds) taskIds.push(...vo.seedanceTaskIds)

        taskIds.forEach(async (tid: string) => {
          try {
            const res = await fetch(`/api/video/seedance?task_id=${tid}`)
            const data = await res.json()
            if (data.status === "succeeded" && data.videoUrl) {
              setVideoUrls(prev => ({ ...prev, [tid]: data.videoUrl }))
            }
          } catch {}
        })
      } catch {}
    })
  }, [user])

  const handlePollTask = useCallback(async (taskId: string) => {
    setPolling(prev => ({ ...prev, [taskId]: true }))
    try {
      const res = await fetch(`/api/video/seedance?task_id=${taskId}`)
      const data = await res.json()
      if (data.status === "succeeded" && data.videoUrl) {
        setVideoUrls(prev => ({ ...prev, [taskId]: data.videoUrl }))
      }
    } catch {}
    setPolling(prev => ({ ...prev, [taskId]: false }))
  }, [])

  const GENRE_ICONS: Record<string, string> = {
    short_drama: "🎭", comic: "📚", tutorial: "📖", ad: "📢", storytelling: "📖"
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl">🖼️</span>
        <div>
          <h1 className="text-xl font-bold text-[#E8E8F0]">{user ? `${user.nickname} 的作品` : "作品展示"}</h1>
          <p className="text-xs text-[#9898B0] mt-0.5">{projects.length} 个项目 · {Object.keys(videoUrls).length} 个视频已就绪</p>
        </div>
        {user && (
          <div className="ml-auto flex gap-1 bg-[#0C0C14] rounded-xl p-1 border border-white/[0.06]">
            <button onClick={() => setTab("mine")} className={`px-3 py-1 text-[10px] rounded-lg transition-all ${tab === "mine" ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "text-white/40"}`}>📁 我的作品</button>
            <Link href="/jiying/manga" className="px-3 py-1 text-[10px] rounded-lg text-white/40 hover:text-white/60 transition-all">+ 新建</Link>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#5A5A72] text-sm">加载中...</div>
      ) : projects.length === 0 ? (
        <div className="border-2 border-dashed border-[#F59E0B]/10 rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">🎬</div>
          <p className="text-[#9898B0] text-sm mb-4">还没有作品</p>
          <Link href="/jiying/manga" className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold">开始创作</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((p: any) => {
            const visStage = p.stages?.find((s: any) => s.stageId === "visual_generation")
            let frames: any[] = []
            let seedanceTaskIds: string[] = []
            if (visStage?.output) {
              try {
                const vo = JSON.parse(visStage.output)
                if (vo.frames) { frames = vo.frames; seedanceTaskIds = vo.frames.filter((f: any) => f.seedanceTaskId).map((f: any) => f.seedanceTaskId) }
                if (vo.seedanceTaskIds) seedanceTaskIds.push(...vo.seedanceTaskIds)
              } catch {}
            }

            return (
              <div key={p.id} className="glass rounded-2xl overflow-hidden border border-white/[0.06]">
                <div className="p-5 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{GENRE_ICONS[p.genre] || "🎬"}</span>
                    <div>
                      <div className="text-base font-bold text-[#E8E8F0]">{p.oneLiner?.slice(0, 50) || "未命名"}</div>
                      <div className="text-[10px] text-[#9898B0] mt-0.5">{p.style} · {p.genre} · {new Date(p.createdAt).toLocaleDateString("zh-CN")}</div>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                    p.status === "completed" ? "bg-green-500/10 text-green-400" :
                    p.status === "running" ? "bg-amber-500/10 text-amber-400" : "bg-gray-500/10 text-gray-400"
                  }`}>{p.status}</span>
                </div>

                {/* 关键帧预览 */}
                {frames.length > 0 && (
                  <div className="px-5 pb-4">
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {frames.map((f: any, i: number) => (
                        <div key={i} className="shrink-0">
                          <div className="w-24 aspect-[9/16] rounded-lg overflow-hidden bg-[#0C0C14] border border-white/10">
                            {f.imageUrl ? (
                              <img src={f.imageUrl} alt={`镜头${f.shotNumber}`} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-white/20 text-[8px]">无</div>
                            )}
                          </div>
                          <div className="text-[8px] text-white/30 text-center mt-0.5">镜头 {f.shotNumber}</div>
                          {/* Seedance 视频链接 */}
                          {f.seedanceTaskId && videoUrls[f.seedanceTaskId] && (
                            <a href={videoUrls[f.seedanceTaskId]} target="_blank"
                              className="block text-center text-[8px] text-green-400 mt-0.5 hover:text-green-300">
                              📥 视频
                            </a>
                          )}
                          {f.seedanceTaskId && !videoUrls[f.seedanceTaskId] && (
                            <button onClick={() => handlePollTask(f.seedanceTaskId)} disabled={polling[f.seedanceTaskId]}
                              className="block w-full text-center text-[8px] text-[#F59E0B]/60 mt-0.5 hover:text-[#F59E0B] disabled:opacity-40">
                              {polling[f.seedanceTaskId] ? "..." : "🔄 查结果"}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 项目详情 */}
                <details className="border-t border-white/[0.06]">
                  <summary className="px-5 py-2 text-[10px] text-white/30 cursor-pointer hover:text-white/50">流水线详情</summary>
                  <div className="px-5 pb-3 space-y-1">
                    {p.stages?.map((s: any) => (
                      <div key={s.stageId} className="flex items-center gap-2 text-[9px]">
                        <span className={`${s.status === "done" ? "text-green-400" : s.status === "failed" ? "text-red-400" : "text-white/20"}`}>
                          {s.status === "done" ? "✅" : s.status === "failed" ? "❌" : "⏳"}
                        </span>
                        <span className="text-white/40">{s.stageId}</span>
                        <span className="text-white/20 ml-auto">{s.modelUsed || ""}</span>
                      </div>
                    ))}
                  </div>
                </details>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
