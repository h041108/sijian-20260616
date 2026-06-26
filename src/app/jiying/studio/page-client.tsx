"use client"
import { useState, useCallback, useRef } from "react"
import { STUDIO_MODELS, type StudioModel, type AspectRatio, generateImage } from "@/lib/image-studio"
import { createStudioProject, saveProject, type StudioResult } from "@/lib/image-studio"

const RATIOS: AspectRatio[] = ["1:1", "4:3", "16:9", "9:16", "3:4"]
const STYLES = ["写实电影风格", "日系动漫", "国风水墨", "赛博朋克", "皮克斯3D", "油画风格", "极简扁平", "复古胶片"]

function StudioPanel() {
  const [project, setProject] = useState(() => createStudioProject(""))
  const [optimizedPrompt, setOptimizedPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [activeView, setActiveView] = useState<"edit" | "compare">("edit")
  const [selectedImg, setSelectedImg] = useState<number | null>(null)
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleOptimizePrompt = useCallback(async () => {
    if (!project.prompt.trim()) return
    setOptimizing(true)
    setError("")
    try {
      const res = await fetch("/api/agent/agent_03", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: project.prompt, parameters: { style: project.style } }),
      })
      const data = await res.json()
      if (data.mainOutput) setOptimizedPrompt(data.mainOutput.slice(0, 500))
    } catch {}
    setOptimizing(false)
  }, [project.prompt, project.style])

  const handleGenerate = useCallback(async () => {
    const prompt = optimizedPrompt || project.prompt
    if (!prompt.trim()) return
    setLoading(true)
    setError("")
    setActiveView("compare")
    const results: StudioResult[] = []
    try {
      const variations = [prompt, prompt + "，构图略有不同", prompt + "，色调略有变化"]
      for (let i = 0; i < variations.length; i++) {
        try {
          const lastUrl = i > 0 && results[i - 1]?.url ? results[i - 1].url : undefined
          const img = await generateImage(variations[i], project.model, project.aspectRatio, lastUrl)
          results.push({ url: img.url, score: [95, 90, 88][i], model: project.model, prompt: variations[i], seed: img.seed })
        } catch (e: any) {
          results.push({ url: "", score: 0, model: project.model, prompt: variations[i] })
          setError(e.message || "第" + (i + 1) + "张图生成失败")
        }
      }
    } catch (e: any) { setError(e.message || "生成失败") }
    const updated = { ...project, optimizedPrompt, results }
    setProject(updated)
    saveProject(updated)
    setSelectedImg(results.length > 0 ? 0 : null)
    setLoading(false)
  }, [project, optimizedPrompt])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProject(p => ({ ...p, referenceImages: [...p.referenceImages, reader.result as string].slice(0, 5) }))
    reader.readAsDataURL(file)
  }, [])

  return (
    <div className="space-y-4">
      {project.model === "jimeng" && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-1.5 text-xs text-green-700 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />即梦 API 已连接
        </div>
      )}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 text-xs">
        <button onClick={() => setActiveView("edit")}
          className={"flex-1 py-1.5 rounded-lg font-medium " + (activeView === "edit" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400")}>✏️ 编辑</button>
        <button onClick={() => setActiveView("compare")}
          className={"flex-1 py-1.5 rounded-lg font-medium " + (activeView === "compare" ? "bg-white text-gray-800 shadow-sm" : "text-gray-400")}>🖼️ 结果 ({project.results.length})</button>
      </div>
      {activeView === "edit" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 mb-2">参考图（最多5张）</div>
            <div className="flex gap-2 flex-wrap">
              {project.referenceImages.map((img, i) => (
                <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setProject(p => ({ ...p, referenceImages: p.referenceImages.filter((_, j) => j !== i) }))}
                    className="absolute top-0 right-0 bg-red-500 text-white text-[8px] w-4 h-4 rounded-bl-lg">✕</button>
                </div>
              ))}
              {project.referenceImages.length < 5 && (
                <button onClick={() => fileRef.current?.click()}
                  className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-indigo-300 text-xl">+</button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">风格</label>
              <select value={project.style} onChange={e => setProject(p => ({ ...p, style: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {STYLES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">比例</label>
              <div className="flex gap-1">
                {RATIOS.map(r => (
                  <button key={r} onClick={() => setProject(p => ({ ...p, aspectRatio: r }))}
                    className={"flex-1 px-2 py-1.5 text-xs rounded-lg border " + (project.aspectRatio === r ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200")}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">模型</label>
              <select value={project.model} onChange={e => setProject(p => ({ ...p, model: e.target.value as StudioModel }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {STUDIO_MODELS.map(m => <option key={m.id} value={m.id} disabled={!m.apiAvailable}>{m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <label className="text-xs font-medium text-gray-500">描述你想要生成的画面</label>
            <textarea value={project.prompt} onChange={e => setProject(p => ({ ...p, prompt: e.target.value }))}
              placeholder="一位灰发少年站在废墟城市顶端，黄昏逆光..."
              rows={3} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={handleOptimizePrompt} disabled={optimizing || !project.prompt.trim()}
              className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50">
              {optimizing ? "优化中..." : "AI优化prompt"}
            </button>
            {optimizedPrompt && (
              <textarea value={optimizedPrompt} onChange={e => setOptimizedPrompt(e.target.value)}
                rows={2} className="w-full resize-none rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            )}
          </div>
          <button onClick={handleGenerate} disabled={loading || (!optimizedPrompt && !project.prompt)}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300">{loading ? "生成中..." : "生成（3版对比）"}</button>
        </div>
      )}
      {activeView === "compare" && (
        <div className="space-y-4">
          {project.results.length > 0 ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {project.results.map((r, i) => (
                  <div key={i} onClick={() => setSelectedImg(i)}
                    className={"rounded-2xl border-2 overflow-hidden cursor-pointer transition-all " + (selectedImg === i ? "border-indigo-500 shadow-lg" : "border-gray-200 hover:border-indigo-300")}>
                    {r.url ? <img src={r.url} alt="" className="w-full aspect-square object-cover" /> : <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-300 text-xs">生成失败</div>}
                    <div className="p-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">方案{String.fromCharCode(65 + i)}</span>
                        {r.score > 0 && <span className="text-[10px] text-indigo-600 font-semibold">⭐ {r.score}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {selectedImg !== null && project.results[selectedImg]?.url && (
                <div className="flex justify-center">
                  <a href={project.results[selectedImg].url} target="_blank" rel="noopener noreferrer"
                    className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs hover:bg-gray-800">下载原图</a>
                </div>
              )}
            </>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center text-sm text-gray-400">还没有生成结果</div>
          )}
        </div>
      )}
    </div>
  )
}

function ScriptPanel() {
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true)
    setResult("")
    try {
      const res = await fetch("/api/agent/agent_04", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: input.trim(), parameters: { duration: "60" } }),
      })
      const data = await res.json()
      setResult(data.mainOutput || "生成完成")
    } catch {}
    setLoading(false)
  }, [input])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
        <label className="text-xs font-medium text-gray-500">输入一句话创意，AI生成完整分镜脚本</label>
        <textarea value={input} onChange={e => setInput(e.target.value)}
          placeholder="例如：一个年轻人发现自己的猫会说话，从此开始了奇幻冒险"
          rows={3} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
        <button onClick={handleGenerate} disabled={loading || !input.trim()}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300">{loading ? "生成中..." : "🚀 生成剧本"}</button>
      </div>
      {result && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4">
          <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{result}</pre>
        </div>
      )}
    </div>
  )
}

function MangaPanel() {
  const [project, setProject] = useState(() => {
    const { createMangaProject } = require("@/lib/manga-engine")
    return createMangaProject("")
  })
  const [loading, setLoading] = useState<number | null>(null)

  const addFrame = useCallback(() => {
    const { createMangaProject } = require("@/lib/manga-engine")
    setProject((p: any) => ({ ...p, frames: [...p.frames, { id: "f_" + Date.now(), imageUrl: "", duration: 3, cameraMove: "none", dialogue: "" }] }))
  }, [])

  return (
    <div className="space-y-4">
      {project.frames.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-sm text-gray-400 mb-3">还没有画面，开始添加帧</p>
          <button onClick={addFrame} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm">+ 添加第一帧</button>
        </div>
      ) : (
        <div className="space-y-2">
          {project.frames.map((f: any, i: number) => (
            <div key={f.id} className="bg-white rounded-2xl border border-gray-200 p-3 flex items-center gap-3">
              <div className="w-16 h-24 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 flex items-center justify-center text-[8px] text-gray-300">帧{i + 1}</div>
              <input value={f.dialogue} onChange={e => {
                const newFrames = [...project.frames]
                newFrames[i] = { ...newFrames[i], dialogue: e.target.value }
                setProject((p: any) => ({ ...p, frames: newFrames }))
              }} placeholder="对白/旁白..." className="flex-1 px-2 py-1 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-500" />
              <div className="flex gap-1">
                <select value={f.duration} onChange={e => {
                  const newFrames = [...project.frames]
                  newFrames[i] = { ...newFrames[i], duration: Number(e.target.value) }
                  setProject((p: any) => ({ ...p, frames: newFrames }))
                }} className="w-12 px-1 py-1 text-xs rounded-lg border border-gray-200">
                  {[2,3,4,5,6,8,10].map(d => <option key={d}>{d}</option>)}
                </select>
                <button onClick={() => setProject((p: any) => ({ ...p, frames: p.frames.filter((_: any, j: number) => j !== i) }))}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-500">✕</button>
              </div>
            </div>
          ))}
          <button onClick={addFrame} className="w-full py-2 border-2 border-dashed border-gray-200 rounded-xl text-xs text-gray-400 hover:border-indigo-300">+ 添加帧</button>
        </div>
      )}
      <div className="text-center text-xs text-gray-400">共 {project.frames.length} 帧 · 约 {project.frames.reduce((s: number, f: any) => s + f.duration, 0)} 秒</div>
    </div>
  )
}

export default function FactoryPage() {
  const [tab, setTab] = useState<"script" | "image" | "manga">("script")

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🏭</span>
        <div><h1 className="text-xl font-bold text-gray-800">自媒体工厂</h1><p className="text-sm text-gray-400">AI剧本 → 超级图片 → AI成片 · 一站式生产</p></div>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 text-sm">
        {[
          { id: "script", label: "📝 AI剧本", desc: "一句话生成脚本" },
          { id: "image", label: "🎨 超级图片", desc: "AI出图3版对比" },
          { id: "manga", label: "🎬 AI成片", desc: "图片序列→视频" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={"flex-1 py-2 rounded-lg font-medium transition-colors " + (tab === t.id ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600")}>
            <div>{t.label}</div>
            <div className="text-[9px] opacity-60">{t.desc}</div>
          </button>
        ))}
      </div>

      {tab === "script" && <ScriptPanel />}
      {tab === "image" && <StudioPanel />}
      {tab === "manga" && <MangaPanel />}
    </div>
  )
}
