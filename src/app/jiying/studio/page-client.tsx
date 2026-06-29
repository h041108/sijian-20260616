"use client"
import { useState, useCallback, useRef } from "react"
import { STUDIO_MODELS, type StudioModel, type AspectRatio, generateImage } from "@/lib/image-studio"
import { createStudioProject, saveProject, type StudioResult } from "@/lib/image-studio"
import Link from "next/link"

const RATIOS: AspectRatio[] = ["1:1", "4:3", "16:9", "9:16", "3:4"]
const STYLES = ["写实电影风格", "日系动漫", "国风水墨", "赛博朋克", "皮克斯3D", "油画风格", "极简扁平", "复古胶片"]

type SubTab = "t2i" | "i2i" | "i2v" | "t2v" | "product" | "ad"

const SUB_TABS: { id: SubTab; label: string; icon: string; desc: string }[] = [
  { id: "t2i", label: "文生图", icon: "🎨", desc: "描述→图片" },
  { id: "i2i", label: "图生图", icon: "🔄", desc: "参考图→变体" },
  { id: "i2v", label: "图生视频", icon: "🎬", desc: "图片→视频" },
  { id: "t2v", label: "文生视频", icon: "📽️", desc: "文字→视频" },
  { id: "product", label: "产品详情页", icon: "📦", desc: "生成电商素材" },
  { id: "ad", label: "广告片生成", icon: "📢", desc: "→ 影片工厂" },
]

function TextToImagePanel() {
  const [project, setProject] = useState(() => createStudioProject(""))
  const [optimizedPrompt, setOptimizedPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [results, setResults] = useState<StudioResult[]>([])
  const [selectedImg, setSelectedImg] = useState<number | null>(null)
  const [error, setError] = useState("")

  const handleOptimize = useCallback(async () => {
    if (!project.prompt.trim()) return
    setOptimizing(true)
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
    setLoading(true); setError("")
    const arr: StudioResult[] = []
    try {
      const variations = [prompt, prompt + "，构图略有不同", prompt + "，色调略有变化"]
      for (let i = 0; i < variations.length; i++) {
        try {
          const img = await generateImage(variations[i], project.model, project.aspectRatio, i > 0 && arr[i - 1]?.url ? arr[i - 1].url : undefined)
          arr.push({ url: img.url, score: [95, 90, 88][i], model: project.model, prompt: variations[i], seed: img.seed })
        } catch { arr.push({ url: "", score: 0, model: project.model, prompt: variations[i] }) }
      }
    } catch {}
    setResults(arr); setSelectedImg(arr.length > 0 ? 0 : null); setLoading(false)
  }, [project, optimizedPrompt])

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5 space-y-4">
        <textarea value={project.prompt} onChange={e => setProject(p => ({ ...p, prompt: e.target.value }))}
          placeholder="一位灰发少年站在废墟城市顶端，黄昏逆光..."
          rows={3} className="w-full text-sm bg-[#0C0C14] border border-white/10 text-white/80 placeholder-white/20 rounded-xl p-3" />
        <div className="flex gap-2">
          <select value={project.style} onChange={e => setProject(p => ({ ...p, style: e.target.value }))}
            className="flex-1 bg-[#0C0C14] border border-white/10 text-white/60 text-xs rounded-xl px-3 py-2">
            {STYLES.map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="flex gap-1">
            {RATIOS.map(r => (
              <button key={r} onClick={() => setProject(p => ({ ...p, aspectRatio: r }))}
                className={`px-2 py-1.5 text-[10px] rounded-lg border ${project.aspectRatio === r ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]" : "bg-[#0C0C14] border-white/10 text-white/30"}`}>{r}</button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleOptimize} disabled={optimizing || !project.prompt.trim()}
            className="px-3 py-1.5 text-[10px] bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/20 rounded-lg hover:bg-[#F59E0B]/20">
            {optimizing ? "优化中..." : "✨ AI优化prompt"}
          </button>
          <button onClick={handleGenerate} disabled={loading || (!optimizedPrompt && !project.prompt)}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
            {loading ? "生成中..." : "🚀 生成（3版对比）"}
          </button>
        </div>
        {optimizedPrompt && (
          <textarea value={optimizedPrompt} onChange={e => setOptimizedPrompt(e.target.value)}
            rows={2} className="w-full text-[10px] bg-[#F59E0B]/5 border border-[#F59E0B]/20 text-white/60 rounded-xl p-2" />
        )}
      </div>

      {results.length > 0 && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {results.map((r, i) => (
              <div key={i} onClick={() => setSelectedImg(i)}
                className={`rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${selectedImg === i ? "border-[#F59E0B]" : "border-white/[0.06] hover:border-white/20"}`}>
                {r.url ? <img src={r.url} alt="" className="w-full aspect-square object-cover" /> : <div className="aspect-square bg-[#0C0C14] flex items-center justify-center text-white/20 text-[10px]">生成失败</div>}
                <div className="p-1.5 text-center"><span className="text-[10px] text-white/50">方案{String.fromCharCode(65 + i)}</span></div>
              </div>
            ))}
          </div>
          {selectedImg !== null && results[selectedImg]?.url && (
            <div className="flex justify-center gap-2">
              <a href={results[selectedImg].url} target="_blank" className="px-4 py-1.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] text-xs border border-[#F59E0B]/20 hover:bg-[#F59E0B]/25">📥 下载</a>
              <button onClick={() => navigator.clipboard.writeText(results[selectedImg].url)} className="px-4 py-1.5 rounded-lg bg-white/[0.04] text-white/40 text-xs">📋 复制链接</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ImageToImagePanel() {
  const [prompt, setPrompt] = useState("")
  const [refUrl, setRefUrl] = useState("")
  const [loading, setLoading] = useState(false)
  const [resultUrl, setResultUrl] = useState("")
  const [error, setError] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRefUrl(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || !refUrl) return
    setLoading(true); setError(""); setResultUrl("")
    try {
      const res = await fetch("/api/video/frame", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.slice(0, 380), width: 1080, height: 1080, image: refUrl, image_strength: 0.5 }),
      })
      const data = await res.json()
      if (data.url && !data.placeholder) setResultUrl(data.url)
      else setError("生成失败")
    } catch { setError("网络错误") }
    setLoading(false)
  }, [prompt, refUrl])

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex gap-4 items-start">
        <div className="w-32 shrink-0">
          <div className="aspect-square rounded-xl overflow-hidden bg-[#0C0C14] border border-white/10">
            {refUrl ? <img src={refUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">参考图</div>}
          </div>
          <button onClick={() => fileRef.current?.click()} className="w-full mt-1 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/40 border border-white/[0.06]">📁 上传</button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} hidden />
        </div>
        <div className="flex-1 space-y-3">
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="描述基于参考图的变化：让她穿红色连衣裙，背景变成海滩..."
            rows={3} className="w-full text-sm bg-[#0C0C14] border border-white/10 text-white/80 placeholder-white/20 rounded-xl p-3" />
          <button onClick={handleGenerate} disabled={loading || !prompt.trim() || !refUrl}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
            {loading ? "生成中..." : "🔄 基于参考图生成变体"}
          </button>
        </div>
      </div>
      {resultUrl && (
        <div className="text-center">
          <img src={resultUrl} alt="" className="max-w-xs mx-auto rounded-xl border border-white/10" />
          <a href={resultUrl} target="_blank" className="inline-block mt-2 px-4 py-1.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] text-xs">📥 下载</a>
        </div>
      )}
    </div>
  )
}

function ImageToVideoPanel() {
  const [refUrl, setRefUrl] = useState("")
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [taskId, setTaskId] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [polling, setPolling] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRefUrl(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!refUrl) return
    setLoading(true); setTaskId(""); setVideoUrl("")
    try {
      const res = await fetch("/api/video/seedance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: (prompt || "动态场景").slice(0, 400), imageUrl: refUrl, model: "seedance-2.0-fast", ratio: "9:16", duration: 5 }),
      })
      const data = await res.json()
      if (data.taskId) {
        setTaskId(data.taskId)
        setPolling(true)
        // 轮询
        const poll = async () => {
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 3000))
            try {
              const pRes = await fetch(`/api/video/seedance?task_id=${data.taskId}`)
              const pData = await pRes.json()
              if (pData.status === "succeeded" && pData.videoUrl) {
                setVideoUrl(pData.videoUrl); setPolling(false); break
              }
              if (pData.status === "failed") { setPolling(false); break }
            } catch {}
          }
          setPolling(false)
        }
        poll()
      }
    } catch {}
    setLoading(false)
  }, [refUrl, prompt])

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <div className="flex gap-4 items-start">
        <div className="w-32 shrink-0">
          <div className="aspect-[9/16] rounded-xl overflow-hidden bg-[#0C0C14] border border-white/10">
            {refUrl ? <img src={refUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">上传图</div>}
          </div>
          <button onClick={() => fileRef.current?.click()} className="w-full mt-1 py-1 text-[9px] rounded-lg bg-white/[0.04] text-white/40 border border-white/[0.06]">📁 上传</button>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} hidden />
        </div>
        <div className="flex-1 space-y-3">
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
            placeholder="视频画面描述（可选）..."
            rows={2} className="w-full text-sm bg-[#0C0C14] border border-white/10 text-white/80 placeholder-white/20 rounded-xl p-3" />
          <button onClick={handleGenerate} disabled={loading || !refUrl}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
            {loading ? "提交中..." : "🎬 图生视频"}
          </button>
        </div>
      </div>
      {polling && <div className="text-center text-[10px] text-white/30 animate-pulse">视频生成中，约30秒...</div>}
      {videoUrl && (
        <div className="text-center space-y-2">
          <video src={videoUrl} controls className="max-w-xs mx-auto rounded-xl border border-white/10" />
          <a href={videoUrl} target="_blank" className="inline-block px-4 py-1.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] text-xs">📥 下载视频</a>
        </div>
      )}
    </div>
  )
}

function TextToVideoPanel() {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [taskId, setTaskId] = useState("")
  const [videoUrl, setVideoUrl] = useState("")
  const [polling, setPolling] = useState(false)

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return
    setLoading(true); setTaskId(""); setVideoUrl("")
    try {
      const res = await fetch("/api/video/seedance", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.slice(0, 400), model: "seedance-2.0-fast", ratio: "9:16", duration: 5 }),
      })
      const data = await res.json()
      if (data.taskId) {
        setTaskId(data.taskId); setPolling(true)
        const poll = async () => {
          for (let i = 0; i < 20; i++) {
            await new Promise(r => setTimeout(r, 3000))
            try {
              const pRes = await fetch(`/api/video/seedance?task_id=${data.taskId}`)
              const pData = await pRes.json()
              if (pData.status === "succeeded" && pData.videoUrl) { setVideoUrl(pData.videoUrl); setPolling(false); break }
              if (pData.status === "failed") { setPolling(false); break }
            } catch {}
          }
          setPolling(false)
        }
        poll()
      }
    } catch {}
    setLoading(false)
  }, [prompt])

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)}
        placeholder="一段充满科技感的城市夜景，无人机缓慢上升，摩天大楼灯光闪烁..."
        rows={3} className="w-full text-sm bg-[#0C0C14] border border-white/10 text-white/80 placeholder-white/20 rounded-xl p-3" />
      <button onClick={handleGenerate} disabled={loading || !prompt.trim()}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
        {loading ? "提交中..." : "📽️ 文生视频"}
      </button>
      {polling && <div className="text-center text-[10px] text-white/30 animate-pulse">视频生成中，约30秒...</div>}
      {videoUrl && (
        <div className="text-center space-y-2">
          <video src={videoUrl} controls className="max-w-xs mx-auto rounded-xl border border-white/10" />
          <a href={videoUrl} target="_blank" className="inline-block px-4 py-1.5 rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] text-xs">📥 下载视频</a>
        </div>
      )}
    </div>
  )
}

function ProductPanel() {
  const [productName, setProductName] = useState("")
  const [sellingPoints, setSellingPoints] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [resultUrl, setResultUrl] = useState("")
  const fileRef = useRef<HTMLInputElement>(null)

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setImages(p => [...p, reader.result as string])
    reader.readAsDataURL(file)
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!productName.trim() || images.length === 0) return
    setGenerating(true)
    try {
      const prompt = `产品"${productName}"的电商详情页设计，卖点：${sellingPoints}，产品图作为主视觉，简洁高端排版，白色背景，电商风格`.slice(0, 380)
      const res = await fetch("/api/video/frame", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, width: 1080, height: 1920, image: images[0], image_strength: 0.4 }),
      })
      const data = await res.json()
      if (data.url && !data.placeholder) setResultUrl(data.url)
    } catch {}
    setGenerating(false)
  }, [productName, sellingPoints, images])

  return (
    <div className="glass rounded-2xl p-5 space-y-4">
      <input value={productName} onChange={e => setProductName(e.target.value)}
        placeholder="产品名称" className="w-full px-3 py-2 text-sm bg-[#0C0C14] border border-white/10 text-white/80 placeholder-white/20 rounded-xl" />
      <textarea value={sellingPoints} onChange={e => setSellingPoints(e.target.value)}
        placeholder="核心卖点（一行一个）" rows={3} className="w-full text-sm bg-[#0C0C14] border border-white/10 text-white/80 placeholder-white/20 rounded-xl p-3" />
      <div className="flex gap-2 flex-wrap">
        {images.map((url, i) => (
          <div key={i} className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 relative">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button onClick={() => setImages(p => p.filter((_, j) => j !== i))} className="absolute top-0 right-0 bg-red-500/80 text-white text-[8px] w-4 h-4">✕</button>
          </div>
        ))}
        {images.length < 3 && <button onClick={() => fileRef.current?.click()} className="w-16 h-16 rounded-lg border-2 border-dashed border-white/10 text-white/30 text-xl flex items-center justify-center">+</button>}
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} hidden />
      </div>
      <button onClick={handleGenerate} disabled={generating || !productName.trim() || images.length === 0}
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
        {generating ? "生成中..." : "📦 生成详情页"}
      </button>
      {resultUrl && <img src={resultUrl} alt="" className="max-w-xs mx-auto rounded-xl border border-white/10" />}
    </div>
  )
}

export default function StudioPage() {
  const [tab, setTab] = useState<SubTab>("t2i")

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-3xl">🖼️</span>
        <div><h1 className="text-xl font-bold text-[#E8E8F0]">超级图片社</h1><p className="text-xs text-[#9898B0] mt-0.5">AI 图像/视频生成工具箱</p></div>
      </div>

      {/* 二级导航 */}
      <div className="flex gap-1 bg-[#0C0C14] rounded-xl p-1 border border-white/[0.06] overflow-x-auto">
        {SUB_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all ${tab === t.id ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "text-white/40 hover:text-white/60"}`}>
            <span className="mr-1">{t.icon}</span>{t.label}
            <span className="text-[9px] opacity-60 ml-1 hidden sm:inline">{t.desc}</span>
          </button>
        ))}
      </div>

      {tab === "t2i" && <TextToImagePanel />}
      {tab === "i2i" && <ImageToImagePanel />}
      {tab === "i2v" && <ImageToVideoPanel />}
      {tab === "t2v" && <TextToVideoPanel />}
      {tab === "product" && <ProductPanel />}
      {tab === "ad" && (
        <div className="glass rounded-2xl p-8 text-center space-y-4">
          <div className="text-5xl">📢</div>
          <h2 className="text-lg font-bold text-[#E8E8F0]">广告片生成</h2>
          <p className="text-sm text-[#9898B0]">上传产品照片 + 卖点，AI 生成 15-30 秒产品种草视频</p>
          <Link href="/jiying/manga" className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold">
            🎬 前往即刻影片工厂
          </Link>
        </div>
      )}
    </div>
  )
}
