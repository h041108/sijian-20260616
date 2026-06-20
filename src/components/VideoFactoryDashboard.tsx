"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  VideoProject, PipelineStageId,
  PIPELINE_STAGES, GENRE_PRESETS,
  createProject, loadProjects, deleteProject,
  executeStage, runFullPipeline, getAvailableModels,
  VIDEO_MODELS, pollSeedanceTask,
} from "@/lib/video-factory"
import VoiceDirectorPanel from "@/components/VoiceDirectorPanel"
import DigitalHumanPanel from "@/components/DigitalHumanPanel"

const STAGE_ICONS: Record<PipelineStageId, string> = {
  story_genesis: "📖", script_breakdown: "🎬", prompt_engineering: "🎨",
  visual_generation: "🖼️", audio_production: "🎙️", final_assembly: "🎞️",
}
const STAGE_LABELS: Record<PipelineStageId, string> = {
  story_genesis: "故事创世", script_breakdown: "分镜拆解", prompt_engineering: "提示词工程",
  visual_generation: "视觉生成", audio_production: "音频制作", final_assembly: "最终合成",
}

export default function VideoFactoryDashboard() {
  const [projects, setProjects] = useState<VideoProject[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [seedanceStatus, setSeedanceStatus] = useState<{ status: string; videoUrl?: string; message?: string } | null>(null)
  const [seedancePollTimer, setSeedancePollTimer] = useState<ReturnType<typeof setInterval> | null>(null)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "loading" | "done" | "error">("idle")
  const downloadInProgress = useRef(false)

  // New project form
  const [oneLiner, setOneLiner] = useState("")
  const [genre, setGenre] = useState<VideoProject["genre"]>("short_drama")
  const [style, setStyle] = useState("写实风格")
  const [duration, setDuration] = useState(60)
  const [aspectRatio, setAspectRatio] = useState("9:16")
  const [currentStyles, setCurrentStyles] = useState<string[]>(GENRE_PRESETS.short_drama.styleSuggestions)
  const [viewMode, setViewMode] = useState<"create" | "projects" | "models" | "voice" | "digital_human">("create")

  useEffect(() => {
    setProjects(loadProjects())
    setCurrentStyles(GENRE_PRESETS[genre]?.styleSuggestions || [])
  }, [genre])

  // ── Seedance 视频任务轮询 ──
  useEffect(() => {
    // 清理上一次轮询
    if (seedancePollTimer) { clearInterval(seedancePollTimer); setSeedancePollTimer(null) }
    setSeedanceStatus(null)

    const active = activeId ? projects.find(p => p.id === activeId) : null
    const visStage = active?.stages.find(s => s.stageId === "visual_generation")
    if (!visStage?.output) return

    let taskId: string | null = null
    try {
      const vo = JSON.parse(visStage.output)
      taskId = vo.seedance?.taskId || null
    } catch {}

    if (!taskId) return

    // 立即查询一次
    pollSeedanceTask(taskId).then(r => setSeedanceStatus(r))

    const timer = setInterval(async () => {
      const r = await pollSeedanceTask(taskId!)
      setSeedanceStatus(r)
      if (r.status === "succeeded" || r.status === "failed" || r.status === "expired") {
        clearInterval(timer)
        setSeedancePollTimer(null)
      }
    }, 5000)
    setSeedancePollTimer(timer)

    return () => { clearInterval(timer); setSeedancePollTimer(null) }
  }, [activeId, projects])

  // ── 创建项目 ──
  const handleCreate = useCallback(() => {
    if (!oneLiner.trim()) return
    const project = createProject(oneLiner.trim(), genre, style, duration, aspectRatio)
    setProjects(loadProjects())
    setActiveId(project.id)
    setOneLiner("")
    setViewMode("projects")
  }, [oneLiner, genre, style, duration, aspectRatio])

  // ── 单阶段执行 ──
  const handleRunStage = useCallback(async (stageId: PipelineStageId) => {
    if (!activeId || running) return
    setRunning(true)
    const project = projects.find(p => p.id === activeId)
    if (!project) { setRunning(false); return }

    const stageIdx = PIPELINE_STAGES.findIndex(s => s.id === stageId)
    const prevStage = stageIdx > 0 ? project.stages[stageIdx - 1] : null
    await executeStage(activeId, stageId, prevStage?.output)
    setProjects(loadProjects())
    setRunning(false)
  }, [activeId, running, projects])

  // ── 全部执行 ──
  const handleRunAll = useCallback(async () => {
    if (!activeId || running) return
    setRunning(true)
    await runFullPipeline(activeId)
    setProjects(loadProjects())
    setRunning(false)
  }, [activeId, running])

  const active = activeId ? projects.find(p => p.id === activeId) : null

  const models = getAvailableModels()

  return (
    <div className="space-y-6">
      {/* ═══ 顶部切换 ═══ */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-3 flex items-center gap-1.5 flex-wrap">
        {[
          { id: "create" as const, icon: "🎬", label: "新建作品" },
          { id: "voice" as const, icon: "🎙️", label: "口述成片" },
          { id: "digital_human" as const, icon: "🎭", label: "数字人口播" },
          { id: "projects" as const, icon: "📂", label: `我的作品 (${projects.length})` },
          { id: "models" as const, icon: "🔧", label: "模型工坊" },
        ].map(t => (
          <button key={t.id} onClick={() => setViewMode(t.id)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === t.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════
          创建新项目
          ════════════════════════════════════════ */}
      {viewMode === "create" && (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🎬 一句话生成视频/漫剧</h3>
          <p className="text-xs text-gray-400 mb-4">
            输入一句话创意，选择风格和类型，AI 自动完成：故事创世 → 分镜拆解 → 提示词工程 → 视觉生成 → 音频制作 → 最终合成
          </p>

          <div className="space-y-4">
            {/* 一句话输入 */}
            <textarea value={oneLiner} onChange={e => setOneLiner(e.target.value)}
              placeholder="如：一个少年在末日废土中寻找父亲的遗物，却发现父亲还活着..."
              rows={3}
              className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none" />

            {/* 类型 + 风格 + 时长 */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">视频类型</label>
                <select value={genre} onChange={e => setGenre(e.target.value as VideoProject["genre"])}
                  className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm">
                  {Object.values(GENRE_PRESETS).map(g => (
                    <option key={g.id} value={g.id}>{g.icon} {g.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">艺术风格</label>
                <select value={style} onChange={e => setStyle(e.target.value)}
                  className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm">
                  {currentStyles.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">目标时长(秒)</label>
                <select value={duration} onChange={e => setDuration(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm">
                  {[15, 30, 60, 90, 120, 180].map(d => <option key={d} value={d}>{d}秒</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] text-gray-400 block mb-1">画幅</label>
                <select value={aspectRatio} onChange={e => setAspectRatio(e.target.value)}
                  className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm">
                  {["16:9","9:16","1:1","4:3"].map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>

            <button onClick={handleCreate} disabled={!oneLiner.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-3 text-sm font-bold transition-all disabled:opacity-40">
              🎬 创建视频作品
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          口述成片
          ════════════════════════════════════════ */}
      {viewMode === "voice" && <VoiceDirectorPanel onProjectCreated={() => {
        setProjects(loadProjects())
        setViewMode("projects")
      }} />}

      {/* ════════════════════════════════════════
          数字人口播
          ════════════════════════════════════════ */}
      {viewMode === "digital_human" && <DigitalHumanPanel />}

      {/* ════════════════════════════════════════
          作品详情 / 流水线控制
          ════════════════════════════════════════ */}
      {viewMode === "projects" && (
        <div className="space-y-4">
          {/* 作品列表 */}
          {projects.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-12 text-center">
              <div className="text-5xl mb-4 opacity-20">🎬</div>
              <p className="text-gray-500 text-sm">还没有作品</p>
              <button onClick={() => setViewMode("create")}
                className="mt-3 text-sm text-indigo-600 hover:text-indigo-700">→ 创建第一个作品</button>
            </div>
          ) : (
            <div className="space-y-3">
              {projects.map(p => (
                <div key={p.id} onClick={() => setActiveId(p.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    activeId === p.id ? "border-indigo-300 bg-indigo-50/50" : "border-[#e8e5df] bg-white hover:border-indigo-200"
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-800">{p.oneLiner.slice(0, 40)}</span>
                      <span className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded-full">
                        {GENRE_PRESETS[p.genre]?.icon} {GENRE_PRESETS[p.genre]?.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full">{
                        p.status === "completed" ? "✅ 完成" : p.status === "running" ? "⏳ 执行中" : "📝 草稿"
                      }</span>
                      <button onClick={(e) => {
                        e.stopPropagation()
                        if (confirm(`确定删除作品「${p.oneLiner.slice(0, 30)}」？`)) {
                          deleteProject(p.id)
                          if (activeId === p.id) setActiveId(null)
                          setProjects(loadProjects())
                        }
                      }}
                        className="text-[10px] text-gray-400 hover:text-red-500 px-1 py-0.5 leading-none"
                        title="删除作品">✕</button>
                    </div>
                  </div>
                  {/* 迷你流水线进度 */}
                  <div className="flex items-center gap-1">
                    {p.stages.map(s => (
                      <div key={s.stageId}
                        className={`flex-1 h-1.5 rounded-full ${
                          s.status === "done" ? "bg-green-400" :
                          s.status === "running" ? "bg-blue-400 animate-pulse" :
                          "bg-gray-200"
                        }`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 流水线控制面板 */}
          {active && (
            <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-800">{active.oneLiner.slice(0, 50)}</h2>
                  <p className="text-xs text-gray-400">{GENRE_PRESETS[active.genre]?.icon} {GENRE_PRESETS[active.genre]?.label} · {active.style} · {active.duration}秒 · {active.aspectRatio}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handleRunAll} disabled={running}
                    className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-5 py-2.5 text-sm font-bold transition-all disabled:opacity-40">
                    {running ? "⏳ 执行中..." : "🚀 一键全流程"}
                  </button>
                </div>
              </div>

              {/* 六阶段流水线可视化 */}
              <div className="space-y-2">
                {active.stages.map((stage, idx) => {
                  const config = PIPELINE_STAGES[idx]
                  return (
                    <div key={stage.stageId} className={`p-3 rounded-xl border-2 transition-all ${
                      stage.status === "done" ? "border-green-300 bg-green-50/50" :
                      stage.status === "running" ? "border-blue-300 bg-blue-50/50 animate-pulse" :
                      "border-gray-200 bg-gray-50/30"
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{STAGE_ICONS[stage.stageId]}</span>
                          <span className="text-sm font-semibold text-gray-700">{STAGE_LABELS[stage.stageId]}</span>
                          <span className="text-[10px] text-gray-400">{config?.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">模型: {config?.primaryModel}</span>
                          {stage.status !== "done" && stage.status !== "running" && (
                            <button onClick={() => handleRunStage(stage.stageId)} disabled={running}
                              className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded-lg transition-all disabled:opacity-40">
                              执行
                            </button>
                          )}
                          {stage.status === "running" && <span className="text-xs text-blue-600">⏳</span>}
                          {stage.status === "done" && <span className="text-xs text-green-600">✅</span>}
                        </div>
                      </div>

                      {/* 阶段输出预览 */}
                      {stage.output && (
                        <div className="mt-2 p-2 bg-white rounded-lg border border-gray-100 text-xs text-gray-600 font-mono leading-relaxed max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                          {/* 视觉生成阶段：多镜头图片网格 + Seedance 进度 */}
                          {stage.stageId === "visual_generation" && (() => {
                            try {
                              const parsed = JSON.parse(stage.output)
                              const frames: any[] = parsed.frames || []
                              return (
                                <div>
                                  {parsed.message && (
                                    <div className="mb-2 text-[10px] text-gray-500">{parsed.message}</div>
                                  )}
                                  {frames.length > 0 && (
                                    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Math.min(frames.length, 3)}, 1fr)` }}>
                                      {frames.filter((f: any) => f.imageUrl && !f.imageUrl.includes("placehold.co")).map((f: any, i: number) => (
                                        <div key={i} className="relative">
                                          <img src={f.imageUrl} alt={`镜头${f.shotNumber}`} className="w-full rounded-lg object-cover" style={{ maxHeight: 120 }} />
                                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[9px] px-1 py-0.5 rounded-b-lg">
                                            镜头{f.shotNumber} · {f.duration}秒
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {frames.length === 0 && parsed.url && (
                                    <div className="mb-2">
                                      <img src={parsed.url} alt="关键帧" className="w-full rounded-lg max-h-[300px] object-cover" />
                                      <div className="mt-1 text-[10px] text-gray-400">{parsed.placeholder ? "⚠️ 占位图" : "✅ 即梦生成"}</div>
                                    </div>
                                  )}
                                  {parsed.placeholder && (
                                    <div className="text-amber-600 text-[10px] mt-1">⚠️ 未配置 JIMENG_API_KEY，显示占位图</div>
                                  )}
                                  {frames.some((f: any) => f.seedanceTaskId) && (
                                    <div className="mt-2 p-2 rounded-lg border text-[10px] bg-blue-50 border-blue-200">
                                      <span className="text-blue-600">🎥 {frames.filter((f: any) => f.seedanceTaskId).length} 个镜头已提交 Seedance 视频生成</span>
                                    </div>
                                  )}
                                </div>
                              )
                            } catch {}
                            return null
                          })()}
                          {stage.stageId !== "visual_generation" && (
                            <>
                              {stage.output.slice(0, 1500)}
                              {stage.output.length > 1500 && <p className="text-gray-300 mt-1">... 共 {stage.output.length} 字</p>}
                            </>
                          )}
                        </div>
                      )}

                      {/* 最终合成阶段：Seedance AI 视频 + Canvas 多镜头合成 */}
                      {stage.stageId === "final_assembly" && stage.status === "done" && stage.output && (() => {
                        let parsed: any = null
                        try { parsed = JSON.parse(stage.output) } catch {}
                        const frames: any[] = parsed?.frames || []
                        const totalDuration = parsed?.totalDuration || 0
                        return (
                        <div className="mt-2 space-y-2">
                          {parsed?.message && (
                            <div className="text-[10px] text-gray-500 mb-1">{parsed.message}</div>
                          )}
                          {/* 多镜头时间轴预览 */}
                          {frames.length > 1 && (
                            <div className="flex items-end gap-1 h-10 mb-2">
                              {frames.map((f: any, i: number) => {
                                const w = Math.max(8, (f.endTime - f.startTime) / totalDuration * 100)
                                return (
                                  <div key={i} className="flex-1 rounded bg-gradient-to-b from-indigo-400 to-purple-500 flex items-end justify-center"
                                    style={{ height: `${30 + (i % 3) * 20}%` }}>
                                    <span className="text-[7px] text-white pb-0.5">镜{i + 1}</span>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                          {/* Seedance 视频下载链接 */}
                          {parsed?.seedanceTaskIds?.map((tid: string, i: number) => (
                            <a key={tid} href={`/api/video/seedance?task_id=${tid}`} target="_blank" rel="noopener noreferrer"
                              className="w-full rounded-lg bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 py-2 px-3 text-xs font-medium transition-all flex items-center gap-2">
                              <span>🎥</span> 查看镜头{i + 1} AI视频（轮询中，完成后自动出现下载链接）
                            </a>
                          ))}
                          {/* Canvas 合成下载（多镜头短片） */}
                          {downloadStatus === "idle" && (
                            <button onClick={async () => {
                              if (downloadInProgress.current) return
                              downloadInProgress.current = true
                              setDownloadStatus("loading")
                              setDownloadProgress(0)
                              try {
                                const parsed = JSON.parse(stage.output)
                                if (!parsed.requiresClientRender) { setDownloadStatus("idle"); downloadInProgress.current = false; return }
                                // 优先使用 final_assembly 自己的 frames（多镜头）
                                let frames = parsed.frames || []
                                if (frames.length === 0) {
                                  // 兜底：从 visual_generation 阶段取
                                  const visStage = active?.stages.find(s => s.stageId === "visual_generation")
                                  if (visStage?.output) {
                                    try {
                                      const vo = JSON.parse(visStage.output)
                                      if (vo.frames) {
                                        frames = vo.frames
                                          .filter((f: any) => f.imageUrl && !f.imageUrl.includes("placehold.co"))
                                          .map((f: any, idx: number) => ({
                                            url: f.imageUrl,
                                            startTime: vo.frames.slice(0, idx).reduce((s: number, p: any) => s + (p.duration || 5), 0),
                                            endTime: vo.frames.slice(0, idx + 1).reduce((s: number, p: any) => s + (p.duration || 5), 0),
                                            index: idx,
                                          }))
                                      } else if (vo.url && !vo.url.includes("placehold.co")) {
                                        frames = [{ url: vo.url, startTime: 0, endTime: active?.duration || 10, index: 0 }]
                                      }
                                    } catch {}
                                  }
                                }
                                if (frames.length > 0 && frames.every((f: any) => f.url)) {
                                  const { assembleVideoClientSide, downloadVideo } = await import("@/lib/video-assembler")
                                  // 收集配音片段
                                  const audioClips = parsed.audioClips || []
                                  // 给每帧附加字幕文本
                                  const framesWithSubs = frames.map((f: any, i: number) => ({
                                    ...f,
                                    dialogue: f.dialogue || "",
                                  }))
                                  const blob = await assembleVideoClientSide({
                                    frames: framesWithSubs,
                                    audioClips: audioClips.length > 0 ? audioClips : undefined,
                                    width: 1920, height: 1080, fps: 24,
                                  }, (pct: number) => setDownloadProgress(pct))
                                  downloadVideo(blob, `思见-${active?.id?.slice(0, 8) || "output"}.webm`)
                                  setDownloadStatus("done")
                                } else {
                                  setDownloadStatus("error")
                                  alert("请先运行视觉生成阶段获取真实图片。当前为占位图无法合成。")
                                }
                              } catch (err: any) {
                                setDownloadStatus("error")
                                const msg = err?.message || ""
                                if (msg.includes("Failed to load frame") || msg.includes("CORS")) {
                                  alert(`图片加载失败（可能是跨域限制）：${msg.slice(0, 100)}。请尝试下载 Seedance AI 视频。`)
                                } else if (msg.includes("MediaRecorder") || msg.includes("captureStream")) {
                                  alert("您的浏览器不支持视频合成，请使用 Chrome 或下载 Seedance AI 视频。")
                                } else {
                                  alert(`合成失败：${msg.slice(0, 100) || "未知错误"}。如需帮助请检查图片链接是否可访问。`)
                                }
                              } finally {
                                downloadInProgress.current = false
                              }
                            }}
                              className="w-full rounded-xl bg-green-600 hover:bg-green-700 text-white py-3 text-sm font-bold transition-all flex items-center justify-center gap-2">
                              <span>📥</span> Canvas 合成下载
                            </button>
                          )}
                          {downloadStatus === "loading" && (
                            <div className="w-full rounded-xl bg-green-50 border border-green-200 p-3">
                              <div className="flex items-center gap-2 text-sm text-green-700 mb-2">
                                <span className="animate-spin">⏳</span> 正在合成视频...
                              </div>
                              <div className="w-full bg-green-200 rounded-full h-2">
                                <div className="bg-green-600 h-2 rounded-full transition-all duration-300" style={{ width: `${downloadProgress}%` }} />
                              </div>
                              <div className="text-[10px] text-green-500 mt-1 text-right">{downloadProgress}%</div>
                            </div>
                          )}
                          {downloadStatus === "done" && (
                            <div className="text-sm text-green-600 font-medium flex items-center gap-2">
                              <span>✅</span> 视频已下载
                              <button onClick={() => setDownloadStatus("idle")} className="text-[10px] text-gray-400 underline">重新下载</button>
                            </div>
                          )}
                          {downloadStatus === "error" && (
                            <div className="text-sm text-red-500 flex items-center gap-2">
                              <span>❌</span> 合成失败
                              <button onClick={() => setDownloadStatus("idle")} className="text-[10px] text-indigo-500 underline">重试</button>
                            </div>
                          )}
                        </div>
                      )})()}

                      {/* 内置质检结果 — 故事创世/分镜拆解完成后自动显示 */}
                      {(stage as any).qaResult && (
                        <div className="mt-2 p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl border border-purple-100 animate-fade-in">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-medium text-purple-600">🧠 内置质检</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              (stage as any).qaResult.overallScore >= 80 ? "bg-green-100 text-green-700" :
                              (stage as any).qaResult.overallScore >= 60 ? "bg-yellow-100 text-yellow-700" :
                              "bg-red-100 text-red-700"
                            }`}>{(stage as any).qaResult.overallScore}分</span>
                            <span className="text-[9px] text-gray-400">因果清晰度 {Math.round(((stage as any).qaResult.narrative?.causalClarity || 0) * 100)}%</span>
                          </div>
                          <div className="text-[10px] text-gray-600 leading-relaxed">{(stage as any).qaResult.aiAdvice}</div>
                          {(stage as any).qaResult.narrative?.gaps?.length > 0 && (
                            <div className="mt-1.5 text-[9px] text-red-500">
                              ⚠️ 发现 {(stage as any).qaResult.narrative.gaps.length} 处逻辑跳跃
                            </div>
                          )}
                          {(stage as any).qaResult.emotion?.isMonotone && (
                            <div className="mt-1 text-[9px] text-yellow-500">⚠️ 情绪曲线偏平，建议增加冲突或反转</div>
                          )}
                          {(stage as any).qaResult.cognitiveLoad?.optimalDuration > 0 && (
                            <div className="mt-1 text-[9px] text-gray-400">建议时长：{(stage as any).qaResult.cognitiveLoad.optimalDuration}秒</div>
                          )}
                        </div>
                      )}

                      {stage.error && (
                        <div className="mt-1 text-xs text-red-500">{stage.error}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          模型工坊
          ════════════════════════════════════════ */}
      {viewMode === "models" && (
        <div className="space-y-4">
          {/* 概览 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🔧 视频工厂模型工坊</h3>
            <p className="text-xs text-gray-400 mb-4">
              每个岗位配置最适合的 AI 模型。就像给不同部门招聘最合适的员工。配置越多模型，流水线效率越高。
            </p>
            <div className="grid grid-cols-6 gap-3">
              {(["llm","image_gen","video_gen","tts","editor"] as const).map(type => {
                const models = VIDEO_MODELS.filter(m => m.type === type)
                const available = models.filter(m => m.available).length
                const typeLabels: Record<string, string> = {
                  llm: "剧本组", image_gen: "画面组", video_gen: "视频组", tts: "配音组", editor: "剪辑组",
                }
                return (
                  <div key={type} className="p-3 bg-gray-50 rounded-xl text-center">
                    <div className="text-lg mb-1">
                      {type === "llm" ? "📝" : type === "image_gen" ? "🎨" : type === "video_gen" ? "🎥" : type === "tts" ? "🎙️" : "✂️"}
                    </div>
                    <div className="text-xs font-bold text-gray-700">{typeLabels[type]}</div>
                    <div className="text-xl font-bold text-indigo-700 mt-1">{available}/{models.length}</div>
                    <div className="text-[9px] text-gray-400">已就绪</div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 推荐流水线组合 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🌟 推荐模型组合</h3>
            <div className="space-y-3">
              {[
                { name: "中式短剧方案", models: ["deepseek","jimeng","kling","doubao_tts"], desc: "DeepSeek写剧本 → 即梦生成画面 → 可灵制作视频 → 豆包配音 · 最适合抖音竖屏短剧" },
                { name: "高品质漫剧方案", models: ["claude","midjourney","runway","doubao_tts"], desc: "Claude写故事 → Midjourney生成关键帧 → Runway制作动态 → 豆包配音 · 画质最好" },
                { name: "快速原型方案", models: ["deepseek","jimeng","jimeng_video","qwen_tts"], desc: "全字节系工具链 · 适合快速验证创意" },
              ].map((combo, i) => (
                <div key={i} className="p-4 rounded-xl border border-[#e8e5df] hover:border-indigo-200 transition-all">
                  <div className="text-sm font-semibold text-gray-800 mb-1">{combo.name}</div>
                  <div className="flex items-center gap-1.5 mb-2">
                    {combo.models.map(m => {
                      const model = VIDEO_MODELS.find(mm => mm.id === m)
                      return (
                        <span key={m} className={`text-[10px] px-2 py-0.5 rounded-full ${
                          model?.available ? "bg-green-50 text-green-600 border border-green-200" : "bg-gray-100 text-gray-400 border border-gray-200"
                        }`}>
                          {model?.available ? "✅" : "🔒"} {model?.name || m}
                        </span>
                      )
                    })}
                  </div>
                  <p className="text-xs text-gray-400">{combo.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 完整模型列表 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 全部可用模型</h3>
            {Object.entries(models.byType).map(([type, typeModels]) => (
              <div key={type} className="mb-4 last:mb-0">
                <div className="text-[10px] text-gray-400 mb-2 uppercase">{type}</div>
                <div className="grid grid-cols-3 gap-2">
                  {typeModels.map(m => (
                    <div key={m.id} className={`p-2.5 rounded-lg border text-xs ${
                      m.available ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-gray-50/30 opacity-60"
                    }`}>
                      <div className="font-semibold text-gray-700">{m.name}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{m.provider}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.strengths.slice(0, 2).map(s => (
                          <span key={s} className="text-[9px] bg-white px-1 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
