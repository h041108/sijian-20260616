"use client"
import { useState, useCallback, useRef } from "react"
import { STUDIO_MODELS, type StudioModel, type AspectRatio } from "@/lib/image-studio"
import { createStudioProject, saveProject } from "@/lib/image-studio"

const RATIOS: AspectRatio[] = ["1:1", "4:3", "16:9", "9:16", "3:4"]
const STYLES = ["写实电影风格", "日系动漫", "国风水墨", "赛博朋克", "皮克斯3D", "油画风格", "极简扁平", "复古胶片"]

export default function StudioPage() {
  const [project, setProject] = useState(() => createStudioProject(""))
  const [optimizedPrompt, setOptimizedPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [activeView, setActiveView] = useState<"edit" | "compare">("edit")
  const [selectedImg, setSelectedImg] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const callAgent = useCallback(async (agentId: string, instruction: string) => {
    const res = await fetch("/api/agent/" + agentId, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ instruction, context: { userProfile: { platform: "通用" } }, parameters: { style: project.style } }),
    })
    return res.json()
  }, [project.style])

  const handleOptimizePrompt = useCallback(async () => {
    if (!project.prompt.trim()) return
    setOptimizing(true)
    const result = await callAgent("agent_03", project.prompt)
    if (result.structuredOutput?.prompts?.jimeng) {
      setOptimizedPrompt(result.structuredOutput.prompts.jimeng)
    } else if (result.mainOutput) {
      setOptimizedPrompt(result.mainOutput.slice(0, 500))
    }
    setOptimizing(false)
  }, [project.prompt, callAgent])

  const handleGenerate = useCallback(async () => {
    if (!optimizedPrompt && !project.prompt) return
    setLoading(true)
    const prompt = optimizedPrompt || project.prompt
    const result = await callAgent("agent_03", prompt + "，风格：" + project.style)
    const mockResults = [
      { url: "", score: 92, model: project.model, prompt, seed: Math.floor(Math.random() * 10000) },
      { url: "", score: 88, model: project.model, prompt, seed: Math.floor(Math.random() * 10000) },
      { url: "", score: 85, model: project.model, prompt, seed: Math.floor(Math.random() * 10000) },
    ]
    const updated = { ...project, optimizedPrompt, results: mockResults }
    setProject(updated)
    saveProject(updated)
    setLoading(false)
    setActiveView("compare")
    setSelectedImg(0)
  }, [project, optimizedPrompt, callAgent])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setProject(p => ({ ...p, referenceImages: [...p.referenceImages, reader.result as string].slice(0, 5) }))
      }
      reader.readAsDataURL(file)
    }
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">🖼️</span>
        <div><h1 className="text-xl font-bold text-gray-800">图片工作室</h1><p className="text-sm text-gray-400">提示词编辑 · 参考图上传播 · 多模型路由 · 3版对比 · 智能增强</p></div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 text-xs">
        {["edit", "compare"].map(v => (
          <button key={v} onClick={() => setActiveView(v as any)}
            className={`flex-1 py-1.5 rounded-lg font-medium transition-colors ${activeView === v ? "bg-white text-gray-800 shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>
            {v === "edit" ? "✏️ 编辑" : "🖼️ 对比"}
          </button>
        ))}
      </div>

      {activeView === "edit" && (
        <div className="space-y-4">
          {/* Reference images */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-xs font-medium text-gray-500 mb-2">参考图（最多5张）</div>
            <div className="flex gap-2">
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

          {/* Style + Ratio */}
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
                    className={`flex-1 px-2 py-1.5 text-xs rounded-lg border ${project.aspectRatio === r ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-500 border-gray-200"}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">模型</label>
              <select value={project.model} onChange={e => setProject(p => ({ ...p, model: e.target.value as StudioModel }))}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {STUDIO_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          </div>

          {/* Prompt */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
            <label className="text-xs font-medium text-gray-500">原始prompt</label>
            <textarea value={project.prompt} onChange={e => setProject(p => ({ ...p, prompt: e.target.value }))}
              placeholder="描述你想要生成的画面，例如：一位灰发少年站在废墟城市顶端，黄昏逆光..."
              rows={3} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            <button onClick={handleOptimizePrompt} disabled={optimizing || !project.prompt.trim()}
              className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg border border-indigo-200 hover:bg-indigo-100 disabled:opacity-50">
              {optimizing ? "优化中..." : "✨ AI优化prompt"}
            </button>
            {optimizedPrompt && (
              <>
                <label className="text-xs font-medium text-green-600">AI优化后prompt</label>
                <textarea value={optimizedPrompt} onChange={e => setOptimizedPrompt(e.target.value)}
                  rows={3} className="w-full resize-none rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </>
            )}
          </div>

          <button onClick={handleGenerate} disabled={loading || (!optimizedPrompt && !project.prompt)}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300">
            {loading ? "生成中..." : "🚀 生成（3版对比）"}
          </button>
        </div>
      )}

      {activeView === "compare" && project.results.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {project.results.map((r, i) => (
              <div key={i} onClick={() => setSelectedImg(i)}
                className={`rounded-2xl border-2 overflow-hidden cursor-pointer transition-all ${selectedImg === i ? "border-indigo-500 shadow-lg" : "border-gray-200 hover:border-indigo-300"}`}>
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-400 text-xs">
                  方案 {String.fromCharCode(65 + i)}
                </div>
                <div className="p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700">方案{String.fromCharCode(65 + i)}</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">⭐ {r.score}</span>
                  </div>
                  <div className="text-[9px] text-gray-400 mt-0.5">seed: {r.seed}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-center">
            <button className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs hover:bg-gray-800">✨ 智能增强选中方案</button>
            <button className="px-4 py-2 bg-white text-gray-700 rounded-xl text-xs border border-gray-200 hover:border-indigo-300">🔄 4K超分</button>
            <button className="px-4 py-2 bg-white text-gray-700 rounded-xl text-xs border border-gray-200 hover:border-indigo-300">🎨 换色调</button>
          </div>
        </div>
      )}
    </div>
  )
}
