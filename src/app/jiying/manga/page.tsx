"use client"
import { useState, useCallback } from "react"
import { CAMERA_MOVES, TTS_VOICES, createMangaProject, saveMangaProject, generateSRT } from "@/lib/manga-engine"
import type { MangaFrame } from "@/lib/manga-engine"

export default function MangaPage() {
  const [project, setProject] = useState(() => createMangaProject(""))
  const [step, setStep] = useState<"frames" | "audio" | "preview">("frames")
  const [previewFrame, setPreviewFrame] = useState<number | null>(null)

  const addFrame = useCallback(() => {
    const newFrame: MangaFrame = {
      id: `frame_${Date.now()}`,
      imageUrl: "",
      duration: 3,
      cameraMove: "none",
      dialogue: "",
    }
    setProject(p => ({ ...p, frames: [...p.frames, newFrame] }))
  }, [])

  const updateFrame = useCallback((id: string, key: string, value: any) => {
    setProject(p => ({
      ...p,
      frames: p.frames.map(f => f.id === id ? { ...f, [key]: value } : f),
    }))
  }, [])

  const removeFrame = useCallback((id: string) => {
    setProject(p => ({ ...p, frames: p.frames.filter(f => f.id !== id) }))
  }, [])

  const moveFrame = useCallback((id: string, dir: "up" | "down") => {
    setProject(p => {
      const idx = p.frames.findIndex(f => f.id === id)
      if (idx < 0) return p
      const newFrames = [...p.frames]
      const target = dir === "up" ? idx - 1 : idx + 1
      if (target < 0 || target >= newFrames.length) return p
      ;[newFrames[idx], newFrames[target]] = [newFrames[target], newFrames[idx]]
      return { ...p, frames: newFrames }
    })
  }, [])

  const totalDuration = project.frames.reduce((s, f) => s + f.duration, 0)
  const srtContent = generateSRT(project.frames)

  const handleSave = useCallback(() => {
    saveMangaProject(project)
  }, [project])

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📚</span>
        <div><h1 className="text-xl font-bold text-gray-800">漫剧生成引擎</h1><p className="text-sm text-gray-400">图片序列 → 排序 → 配音(TTS) → 运镜 → 字幕 → BGM → 封面 → 导出MP4</p></div>
      </div>

      {/* Steps progress */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 text-xs">
        {[
          { id: "frames", label: "🖼️ 图片序列" },
          { id: "audio", label: "🎙️ 配音+字幕" },
          { id: "preview", label: "🎬 预览导出" },
        ].map(s => (
          <button key={s.id} onClick={() => setStep(s.id as any)}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${step === s.id ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>{s.label}</button>
        ))}
      </div>

      {/* Step 1: Frames */}
      {step === "frames" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">{project.frames.length} 帧 · 约{totalDuration}秒</span>
            <button onClick={handleSave} className="text-xs px-2 py-1 bg-gray-100 rounded-lg text-gray-500 hover:bg-gray-200">💾 保存</button>
          </div>
          {project.frames.length === 0 ? (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <p className="text-sm text-gray-400 mb-3">还没有图片，添加图片序列开始制作漫剧</p>
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
                      <button onClick={() => removeFrame(frame.id)}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500">✕</button>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-16 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center text-gray-300 text-[10px] flex-shrink-0">
                      {frame.imageUrl ? <img src={frame.imageUrl} className="w-full h-full object-cover rounded-lg" alt="" /> : "暂无图"}
                    </div>
                    <div className="flex-1 space-y-1.5 min-w-0">
                      <div className="flex gap-1.5">
                        <input value={frame.dialogue} onChange={e => updateFrame(frame.id, "dialogue", e.target.value)}
                          placeholder="对白/旁白..." className="flex-1 px-2 py-1 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                        <select value={frame.duration} onChange={e => updateFrame(frame.id, "duration", Number(e.target.value))}
                          className="w-14 px-1 py-1 text-xs rounded-lg border border-gray-200">
                          {[2,3,4,5,6,8,10].map(d => <option key={d} value={d}>{d}s</option>)}
                        </select>
                        <select value={frame.cameraMove} onChange={e => updateFrame(frame.id, "cameraMove", e.target.value)}
                          className="w-16 px-1 py-1 text-xs rounded-lg border border-gray-200">
                          {CAMERA_MOVES.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button onClick={addFrame} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-indigo-300 hover:text-indigo-500">+ 添加帧</button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Audio + Subtitles */}
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">音量</label>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-[10px] text-gray-400">配音音量</label>
                <input type="range" min={0} max={100} value={project.audio.ttsVolume}
                  onChange={e => setProject(p => ({ ...p, audio: { ...p.audio, ttsVolume: Number(e.target.value) } }))}
                  className="w-full" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-400">BGM音量</label>
                <input type="range" min={0} max={100} value={project.audio.bgmVolume}
                  onChange={e => setProject(p => ({ ...p, audio: { ...p.audio, bgmVolume: Number(e.target.value) } }))}
                  className="w-full" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-500">字幕</label>
              <label className="flex items-center gap-1.5 text-xs text-gray-500">
                <input type="checkbox" checked={project.subtitles.enabled}
                  onChange={e => setProject(p => ({ ...p, subtitles: { ...p.subtitles, enabled: e.target.checked } }))} />
                显示字幕
              </label>
            </div>
            {project.subtitles.enabled && (
              <div className="flex gap-1.5">
                {["white", "yellow"].map(s => (
                  <button key={s} onClick={() => setProject(p => ({ ...p, subtitles: { ...p.subtitles, style: s as any } }))}
                    className={`px-3 py-1 text-xs rounded-lg border ${project.subtitles.style === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200"}`}>{s === "white" ? "白字黑边" : "黄字黑边"}</button>
                ))}
              </div>
            )}
            {srtContent && (
              <div className="mt-2">
                <label className="text-[10px] text-gray-400">SRT字幕预览</label>
                <pre className="text-[9px] text-gray-500 bg-gray-50 rounded-lg p-2 mt-1 max-h-20 overflow-y-auto">{srtContent}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Preview + Export */}
      {step === "preview" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4 text-center">
            {project.frames.length > 0 ? (
              <div className="space-y-4">
                <div className="aspect-[9/16] max-w-[280px] mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center text-gray-400 text-xs border border-gray-200">
                  🎬 漫剧预览（{project.frames.length}帧 · {totalDuration}秒）
                </div>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {project.frames.map((f, i) => (
                    <div key={f.id}
                      onMouseEnter={() => setPreviewFrame(i)}
                      onMouseLeave={() => setPreviewFrame(null)}
                      className={`w-12 h-16 rounded-lg border-2 cursor-pointer transition-all ${previewFrame === i ? "border-indigo-500 scale-110" : "border-gray-200"} bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-[8px] text-gray-300`}>
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 justify-center">
                  <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700">💾 保存项目</button>
                  <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800 disabled:bg-gray-300" disabled={project.frames.length < 2}>🎬 导出MP4</button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">请先在「图片序列」步骤添加帧</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
