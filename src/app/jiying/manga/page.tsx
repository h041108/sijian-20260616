"use client"
import { useState, useCallback, useEffect } from "react"
import { CAMERA_MOVES, TTS_VOICES, createMangaProject, saveMangaProject, generateSRT, generateFrameImage, generateFrameVideo, pollSeedanceTask } from "@/lib/manga-engine"
import type { MangaFrame } from "@/lib/manga-engine"

function defaultPrompt(i: number, total: number): string {
  const scenes = ["开场场景", "发展场景", "转折场景", "高潮场景", "收尾场景", "结尾场景"]
  return `漫剧第${i + 1}帧，${scenes[i] || "故事场景"}，电影质感，${total}帧系列故事的第${i + 1}帧`
}

export default function MangaPage() {
  const [project, setProject] = useState(() => createMangaProject(""))
  const [step, setStep] = useState<"frames" | "audio" | "export">("frames")
  const [previewFrame, setPreviewFrame] = useState<number | null>(null)
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState("")
  const [exportedClips, setExportedClips] = useState<{ frameIdx: number; url: string }[]>([])
  const [pollTimers, setPollTimers] = useState<ReturnType<typeof setInterval>[]>([])

  // 清理轮询定时器
  useEffect(() => {
    return () => pollTimers.forEach(t => clearInterval(t))
  }, [pollTimers])

  const updateFrame = useCallback((id: string, key: string, value: any) => {
    setProject(p => ({ ...p, frames: p.frames.map(f => f.id === id ? { ...f, [key]: value } : f) }))
  }, [])

  const addFrame = useCallback(() => {
    const i = project.frames.length
    setProject(p => ({ ...p, frames: [...p.frames, { id: `frame_${Date.now()}`, imageUrl: "", duration: 3, cameraMove: "none", dialogue: "" }] }))
  }, [project.frames.length])

  const removeFrame = useCallback((id: string) => {
    setProject(p => ({ ...p, frames: p.frames.filter(f => f.id !== id) }))
  }, [])

  const moveFrame = useCallback((id: string, dir: "up" | "down") => {
    setProject(p => {
      const idx = p.frames.findIndex(f => f.id === id)
      if (idx < 0) return p
      const t = dir === "up" ? idx - 1 : idx + 1
      if (t < 0 || t >= p.frames.length) return p
      const f = [...p.frames]
      ;[f[idx], f[t]] = [f[t], f[idx]]
      return { ...p, frames: f }
    })
  }, [])

  const totalDuration = project.frames.reduce((s, f) => s + f.duration, 0)
  const srtContent = generateSRT(project.frames)

  // ─── 生成单帧图片 ────────────────────────
  const handleGenerateFrame = useCallback(async (idx: number) => {
    const frame = project.frames[idx]
    if (!frame) return
    setGeneratingIdx(idx)
    updateFrame(frame.id, "generating", true)
    try {
      const prompt = frame.dialogue ? `${frame.dialogue}，电影级画面` : defaultPrompt(idx, project.frames.length)
      const prevUrl = idx > 0 ? project.frames[idx - 1].imageUrl || undefined : undefined
      const url = await generateFrameImage(frame.id, prompt, project.aspectRatio, prevUrl)
      updateFrame(frame.id, "imageUrl", url)
    } catch (e: any) {
      alert("图片生成失败：" + (e.message || ""))
    }
    updateFrame(frame.id, "generating", false)
    setGeneratingIdx(null)
  }, [project, updateFrame])

  // ─── 一键生成所有图片 ────────────────────
  const handleGenerateAll = useCallback(async () => {
    setExportProgress("正在生成图片...")
    for (let i = 0; i < project.frames.length; i++) {
      const f = project.frames[i]
      if (f.imageUrl) continue
      setGeneratingIdx(i)
      setExportProgress(`生成第 ${i + 1}/${project.frames.length} 帧图片...`)
      try {
        const prompt = f.dialogue ? `${f.dialogue}，电影级画面` : defaultPrompt(i, project.frames.length)
        const prevUrl = i > 0 ? project.frames[i - 1].imageUrl || undefined : undefined
        const url = await generateFrameImage(f.id, prompt, project.aspectRatio, prevUrl)
        setProject(p => {
          const frames = [...p.frames]
          frames[i] = { ...frames[i], imageUrl: url }
          return { ...p, frames }
        })
      } catch (e: any) {
        setExportProgress(`第 ${i + 1} 帧生成失败: ${e.message}`)
      }
    }
    setGeneratingIdx(null)
    setExportProgress("")
  }, [project])

  // ─── 导出全部 → Seedance生成视频片段 ────
  const handleExport = useCallback(async () => {
    const frames = project.frames
    if (frames.length < 2) return
    setExporting(true)
    setExportedClips([])
    setExportProgress("正在提交视频生成任务...")

    const taskIds: { frameIdx: number; taskId: string; frameId: string }[] = []

    for (let i = 0; i < frames.length; i++) {
      const f = frames[i]
      if (!f.imageUrl) {
        setExportProgress(`第 ${i + 1} 帧没有图片，跳过`)
        continue
      }
      setExportProgress(`提交第 ${i + 1}/${frames.length} 帧到Seedance...`)
      try {
        const prompt = f.dialogue ? `[${f.cameraMove}] ${f.dialogue}` : defaultPrompt(i, frames.length) + `，运镜：${f.cameraMove}`
        const taskId = await generateFrameVideo(f.id, prompt, f.imageUrl, f.dialogue, project.aspectRatio)
        taskIds.push({ frameIdx: i, taskId, frameId: f.id })
      } catch (e: any) {
        setExportProgress(`第 ${i + 1} 帧提交失败: ${e.message}`)
      }
      await new Promise(r => setTimeout(r, 1000)) // 限流
    }

    if (taskIds.length === 0) {
      setExportProgress("没有成功提交的任务")
      setExporting(false)
      return
    }

    setExportProgress(`已提交 ${taskIds.length} 个任务，正在轮询结果...`)

    // 轮询所有任务
    const newClips: { frameIdx: number; url: string }[] = []
    const timer = setInterval(async () => {
      let allDone = true
      for (const t of taskIds) {
        try {
          const result = await pollSeedanceTask(t.taskId)
          if (result.status === "succeeded" && result.videoUrl) {
            if (!newClips.find(c => c.frameIdx === t.frameIdx)) {
              newClips.push({ frameIdx: t.frameIdx, url: result.videoUrl! })
              setExportedClips([...newClips])
            }
          } else if (result.status !== "running" && result.status !== "pending") {
            // failed or unknown
          } else {
            allDone = false
          }
        } catch { allDone = false }
      }
      setExportProgress(`已完成 ${newClips.length}/${taskIds.length} 个视频片段`)
      if (allDone || newClips.length === taskIds.length) {
        clearInterval(timer)
        setExporting(false)
        setExportProgress(`✅ 完成！生成了 ${newClips.length} 个视频片段`)
      }
    }, 5000)
    setPollTimers(prev => [...prev, timer])
  }, [project])

  const allHaveImages = project.frames.length > 0 && project.frames.every(f => f.imageUrl)
  const hasVideoClips = exportedClips.length > 0

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📚</span>
        <div><h1 className="text-xl font-bold text-gray-800">漫剧生成引擎</h1><p className="text-sm text-gray-400">帧序列 → AI出图(Seedream) → 视频(Seedance) → 导出</p></div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 text-xs">
        {[{ id: "frames", label: "🖼️ 帧序列" }, { id: "audio", label: "🎙️ 音频" }, { id: "export", label: "🎬 导出" }].map(s => (
          <button key={s.id} onClick={() => setStep(s.id as any)}
            className={`flex-1 py-1.5 rounded-lg font-medium ${step === s.id ? "bg-white text-gray-800 shadow-sm" : "text-gray-400"}`}>{s.label}</button>
        ))}
      </div>

      {/* Step 1: Frames */}
      {step === "frames" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{project.frames.length} 帧 · 约{totalDuration}秒</span>
            <div className="flex gap-1.5">
              {project.frames.length > 0 && (
                <button onClick={handleGenerateAll} disabled={generatingIdx !== null}
                  className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 disabled:opacity-50">
                  ✨ 一键AI出图
                </button>
              )}
              <button onClick={() => saveMangaProject(project)} className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-gray-500">💾 保存</button>
            </div>
          </div>
          {exportProgress && <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2 text-xs text-indigo-700">{exportProgress}</div>}
          {project.frames.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-400 mb-3">添加帧序列开始制作漫剧</p>
              <button onClick={addFrame} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">+ 添加第一帧</button>
            </div>
          ) : (
            <div className="space-y-2">
              {project.frames.map((frame, i) => (
                <div key={frame.id} className="bg-white rounded-2xl border border-gray-200 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">帧 {i + 1}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveFrame(frame.id, "up")} disabled={i === 0}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 disabled:opacity-30">↑</button>
                      <button onClick={() => moveFrame(frame.id, "down")} disabled={i === project.frames.length - 1}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 disabled:opacity-30">↓</button>
                      <button onClick={() => removeFrame(frame.id)} className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500">✕</button>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="relative w-20 h-28 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 flex items-center justify-center">
                      {frame.imageUrl ? (
                        <img src={frame.imageUrl} className="w-full h-full object-cover" alt="" />
                      ) : frame.generating ? (
                        <span className="text-[8px] text-indigo-400 animate-pulse">生成中...</span>
                      ) : (
                        <span className="text-[8px] text-gray-300">暂无图</span>
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex gap-1.5 flex-wrap">
                        <input value={frame.dialogue} onChange={e => updateFrame(frame.id, "dialogue", e.target.value)}
                          placeholder="对白/旁白..." className="flex-1 min-w-[100px] px-2 py-1 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        <select value={frame.duration} onChange={e => updateFrame(frame.id, "duration", Number(e.target.value))}
                          className="w-12 px-1 py-1 text-xs rounded-lg border border-gray-200">
                          {[2,3,4,5,6,8,10].map(d => <option key={d} value={d}>{d}s</option>)}
                        </select>
                        <select value={frame.cameraMove} onChange={e => updateFrame(frame.id, "cameraMove", e.target.value)}
                          className="w-14 px-1 py-1 text-xs rounded-lg border border-gray-200">
                          {CAMERA_MOVES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                      </div>
                      <button onClick={() => handleGenerateFrame(i)} disabled={generatingIdx === i}
                        className="text-[10px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50">
                        {frame.imageUrl ? "🔄 重新生成" : "✨ AI生图"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addFrame} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-500">+ 添加帧</button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Audio */}
      {step === "audio" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <label className="text-xs font-medium text-gray-500 mb-2 block">配音声音</label>
            <div className="flex gap-1.5 flex-wrap">
              {TTS_VOICES.map(v => (
                <button key={v.id} onClick={() => setProject(p => ({ ...p, audio: { ...p.audio, ttsVoice: v.id } }))}
                  className={`px-3 py-1.5 text-xs rounded-lg border ${project.audio.ttsVoice === v.id ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200"}`}>{v.label}</button>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex gap-4">
              <div className="flex-1"><label className="text-[10px] text-gray-400">配音音量</label><input type="range" min={0} max={100} value={project.audio.ttsVolume} onChange={e => setProject(p => ({ ...p, audio: { ...p.audio, ttsVolume: Number(e.target.value) } }))} className="w-full" /></div>
              <div className="flex-1"><label className="text-[10px] text-gray-400">BGM音量</label><input type="range" min={0} max={100} value={project.audio.bgmVolume} onChange={e => setProject(p => ({ ...p, audio: { ...p.audio, bgmVolume: Number(e.target.value) } }))} className="w-full" /></div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">字幕</label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input type="checkbox" checked={project.subtitles.enabled} onChange={e => setProject(p => ({ ...p, subtitles: { ...p.subtitles, enabled: e.target.checked } }))} />显示
              </label>
            </div>
            {srtContent && <pre className="text-[9px] text-gray-500 bg-gray-50 rounded-lg p-2 max-h-20 overflow-y-auto">{srtContent}</pre>}
          </div>
        </div>
      )}

      {/* Step 3: Export */}
      {step === "export" && (
        <div className="space-y-4">
          {exportProgress && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-xs text-indigo-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              {exportProgress}
            </div>
          )}

          {/* Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            {project.frames.length > 0 ? (
              <div className="space-y-4">
                <div className="flex gap-2 justify-center flex-wrap">
                  {project.frames.map((f, i) => (
                    <div key={f.id} onMouseEnter={() => setPreviewFrame(i)} onMouseLeave={() => setPreviewFrame(null)}
                      className={`w-16 h-24 rounded-lg border-2 transition-all ${previewFrame === i ? "border-indigo-500 scale-110" : "border-gray-200"} overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200`}>
                      {f.imageUrl ? <img src={f.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="flex items-center justify-center h-full text-[8px] text-gray-300">{i + 1}</div>}
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 justify-center">
                  <button onClick={handleGenerateAll} disabled={generatingIdx !== null}
                    className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-xs hover:bg-indigo-200 disabled:opacity-50">
                    ✨ 生成所有图片 ({project.frames.filter(f => !f.imageUrl).length}待生成)
                  </button>
                  <button onClick={handleExport} disabled={exporting || !allHaveImages}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${allHaveImages ? "bg-gray-900 text-white hover:bg-gray-800" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}>
                    {exporting ? "导出中..." : "🎬 导出视频 (Seedance)"}
                  </button>
                  <button onClick={() => saveMangaProject(project)} className="px-3 py-2 bg-white text-gray-600 rounded-xl text-xs border border-gray-200">💾 保存</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">请先在帧序列步骤添加帧</p>
            )}
          </div>

          {/* Exported clips */}
          {exportedClips.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-600">已生成的视频片段</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {exportedClips.map((clip, i) => (
                  <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                    <div className="aspect-video bg-gray-100 flex items-center justify-center text-[10px] text-gray-400">
                      <a href={clip.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline">帧 {clip.frameIdx + 1} 视频</a>
                    </div>
                    <div className="p-1.5 text-[9px] text-gray-400 truncate">{clip.url}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
