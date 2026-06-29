"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { createProject, loadProjects, executeStage, PIPELINE_STAGES, type VideoProject, type PipelineStageId } from "@/lib/video-factory"
import { createVoiceDirectorSession, type VoiceDirectorSession, type NarratedScene } from "@/lib/voice-video"
import { useJiyingUser } from "../layout"
import CharacterCreator from "@/components/CharacterCreator"
import StoryboardEditor from "@/components/StoryboardEditor"
import ProductPhotoUpload, { type ProductAssets } from "@/components/ProductPhotoUpload"
import ViralTrendPanel, { type ViralTemplate } from "@/components/ViralTrendPanel"
import { loadCharacters, getCharacter, buildReferenceImageUrls, genId, type CharacterTemplate, type StoryboardShot } from "@/lib/character-engine"

// ─── 类型 ─────────────────────────────────────
type GenreKey = "short_drama" | "comic" | "tutorial" | "ad"

// ─── 4 个模式定义 ─────────────────────────────
const GENRE_CARDS: { id: GenreKey; icon: string; label: string; desc: string; color: string; style: string }[] = [
  { id: "short_drama", icon: "🎭", label: "微短剧", desc: "剧情向短视频，完整起承转合，适合抖音/快手", color: "from-pink-500 to-rose-500", style: "写实风格" },
  { id: "comic", icon: "📚", label: "漫剧", desc: "漫画风格叙事，二次元/国风/赛博朋克", color: "from-teal-400 to-emerald-500", style: "日系动漫" },
  { id: "tutorial", icon: "📖", label: "知识图谱", desc: "教育科普，图文配合讲解，干货输出", color: "from-blue-500 to-indigo-500", style: "扁平设计" },
  { id: "ad", icon: "📢", label: "产品广告", desc: "15-30秒产品种草，种草/带货/品牌展示", color: "from-amber-500 to-orange-500", style: "高端质感" },
]

// ─── 从流水线输出解析分镜 ──────────────────
function parseShotsFromScriptOutput(output: string): StoryboardShot[] {
  const shots: StoryboardShot[] = []
  const shotRegex = /镜头(\d+)\s*[|｜]\s*时长(\d+(?:\.\d+)?)\s*秒/gi
  const matches = [...output.matchAll(shotRegex)]
  for (const match of matches) {
    const shotNum = parseInt(match[1])
    const duration = parseFloat(match[2])
    const start = match.index! + match[0].length
    const rest = output.slice(start)
    const nextShot = rest.search(/镜头\d+\s*[|｜]/)
    const block = nextShot >= 0 ? rest.slice(0, nextShot) : rest
    const descMatch = block.match(/画面描述[：:]([\s\S]*?)(?=对白|旁白|情绪|转场|镜头|\n\n|$)/i)
    const dialMatch = block.match(/(?:对白|旁白)[：:]([\s\S]*?)(?=情绪|转场|镜头|\n\n|$)/i)
    const moodMatch = block.match(/情绪[：:]([\s\S]*?)(?=转场|镜头|\n\n|$)/i)
    const transMatch = block.match(/转场[：:]([\s\S]*?)(?=镜头|\n\n|$)/i)
    const cameraMatch = block.match(/景别[：:]([\s\S]*?)(?=\||运镜|\n|$)/i)
    const moveMatch = block.match(/运镜[：:]([\s\S]*?)(?=\||\n|$)/i)
    const desc = descMatch?.[1]?.trim() || ""
    if (desc.length >= 5) {
      shots.push({
        id: genId(),
        shotNumber: shotNum, duration: Math.min(30, Math.max(2, duration || 5)),
        description: desc, dialogue: dialMatch?.[1]?.trim() || "",
        mood: moodMatch?.[1]?.trim() || "", transition: transMatch?.[1]?.trim() || "切",
        cameraAngle: cameraMatch?.[1]?.trim() || "中景",
        cameraMovement: moveMatch?.[1]?.trim() || "固定",
        characterActions: "", sceneSetting: "", status: "pending" as const,
      })
    }
  }
  if (shots.length === 0 && output.length > 20) {
    shots.push({
      id: genId(), shotNumber: 1, duration: 10, description: output.slice(0, 200),
      dialogue: "", mood: "", cameraAngle: "中景", cameraMovement: "固定", transition: "切",
      characterActions: "", sceneSetting: "", status: "pending" as const,
    })
  }
  return shots.slice(0, 8)
}

// ─── 创建面板（选模式后展开） ──────────────
function CreateProjectPanel({ genreKey, onBack }: { genreKey: GenreKey; onBack: () => void }) {
  const { user } = useJiyingUser()
  const card = GENRE_CARDS.find(c => c.id === genreKey)!

  const [oneLiner, setOneLiner] = useState("")
  const [style, setStyle] = useState(card.style)
  const [duration, setDuration] = useState(card.id === "comic" ? 120 : card.id === "tutorial" ? 60 : card.id === "ad" ? 30 : 90)
  const [aspectRatio, setAspectRatio] = useState("9:16")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [project, setProject] = useState<VideoProject | null>(null)
  const [selectedChar, setSelectedChar] = useState<CharacterTemplate | undefined>()
  const [storyboardShots, setStoryboardShots] = useState<StoryboardShot[]>([])
  const [generatingShot, setGeneratingShot] = useState<string | null>(null)
  const [productAssets, setProductAssets] = useState<ProductAssets | null>(null)
  const [viralTemplate, setViralTemplate] = useState<ViralTemplate | null>(null)

  const STYLE_OPTIONS = ["写实风格", "日系动漫", "国风水墨", "赛博朋克", "皮克斯3D", "油画风格", "扁平设计", "高端质感"]

  const handleCreate = useCallback(() => {
    if (!oneLiner.trim()) return
    const vt = viralTemplate ? { ...viralTemplate } : undefined
    // 传入角色/产品参考图，确保多镜头一致性
    const refUrls = productAssets?.photos?.length
      ? productAssets.photos
      : selectedChar ? (() => {
          const urls: string[] = []
          if (selectedChar.referenceImages.front) urls.push(selectedChar.referenceImages.front)
          if (selectedChar.referenceImages.side) urls.push(selectedChar.referenceImages.side)
          if (selectedChar.referenceImages.back) urls.push(selectedChar.referenceImages.back)
          return urls
        })() : undefined
    const charDesc = selectedChar
      ? `${selectedChar.appearance.hairStyle}，穿${selectedChar.costume.top}和${selectedChar.costume.bottom}${selectedChar.costume.shoes ? "，脚穿"+selectedChar.costume.shoes : ""}`
      : undefined
    const p = createProject(oneLiner.trim(), genreKey, style, duration, aspectRatio, vt, user?.id, {
      characterRefUrls: genreKey === "short_drama" || genreKey === "comic" ? refUrls : undefined,
      productImageUrls: genreKey === "ad" ? productAssets?.photos : undefined,
      charName: selectedChar?.name,
      charDescription: charDesc,
    })
    setProject(p)
    setActiveId(p.id)
    setOneLiner("")
    setStoryboardShots([])
  }, [oneLiner, genreKey, style, duration, aspectRatio, user, viralTemplate, selectedChar, productAssets])

  const handleRunStage = useCallback(async (stageId: PipelineStageId) => {
    if (!activeId || running) return
    setRunning(true)
    await executeStage(activeId, stageId)
    const projects = loadProjects()
    const updated = projects.find(p => p.id === activeId) || null
    setProject(updated)
    if (updated && (stageId === "story_genesis" || stageId === "script_breakdown")) {
      const sbStage = updated.stages.find(s => s.stageId === "script_breakdown")
      const storyStage = updated.stages.find(s => s.stageId === "story_genesis")
      const output = sbStage?.output || storyStage?.output || ""
      const parsed = parseShotsFromScriptOutput(output)
      if (parsed.length > 0) {
        setStoryboardShots(prev => {
          return parsed.map(s => {
            const existing = prev.find(p => p.shotNumber === s.shotNumber)
            return { ...s, keyframeUrl: existing?.keyframeUrl, videoUrl: existing?.videoUrl }
          })
        })
      }
    }
    setRunning(false)
  }, [activeId, running])

  const handleUpdateShot = useCallback((shotId: string, updates: Partial<StoryboardShot>) => {
    setStoryboardShots(prev => prev.map(s => s.id === shotId ? { ...s, ...updates } : s))
  }, [])

  const handleGenerateKeyframe = useCallback(async (shotId: string) => {
    const shot = storyboardShots.find(s => s.id === shotId)
    if (!shot || generatingShot) return
    setGeneratingShot(shotId)
    try {
      const refUrls = productAssets?.photos?.length
        ? productAssets.photos
        : selectedChar ? buildReferenceImageUrls(selectedChar) : []
      const productPrefix = productAssets
        ? `产品：${productAssets.name}，卖点：${productAssets.sellingPoints.join("、")}。`
        : ""
      const charPrefix = selectedChar
        ? `${selectedChar.name}：${selectedChar.appearance.hairStyle}，穿${selectedChar.costume.top}和${selectedChar.costume.bottom}。`
        : ""
      const prompt = `${style}风格。${productPrefix}${charPrefix}${shot.description}${shot.characterActions ? `，动作：${shot.characterActions}` : ""}。${shot.cameraAngle}${shot.cameraMovement ? `，运镜：${shot.cameraMovement}` : ""}${shot.mood ? `，氛围：${shot.mood}` : ""}，电影级画质`.slice(0, 380)
      const res = await fetch("/api/video/frame", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, width: 1920, height: 1080, image: refUrls.length > 0 ? refUrls[0] : undefined, image_strength: 0.3 }),
      })
      const data = await res.json()
      if (data.url) setStoryboardShots(prev => prev.map(s => s.id === shotId ? { ...s, keyframeUrl: data.url, status: "done" as const } : s))
    } catch {}
    setGeneratingShot(null)
  }, [storyboardShots, selectedChar, style, generatingShot, productAssets])

  const handleGenerateAll = useCallback(async () => {
    for (const shot of storyboardShots) {
      if (shot.status !== "done") await handleGenerateKeyframe(shot.id)
    }
  }, [storyboardShots, handleGenerateKeyframe])

  return (
    <div className="space-y-4">
      {/* 顶栏 */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-white/30 hover:text-white/60 text-sm">← 返回</button>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center text-sm`}>{card.icon}</div>
        <div>
          <div className="text-base font-bold text-white/80">{card.label}</div>
          <div className="text-[10px] text-white/30">{card.desc}</div>
        </div>
      </div>

      {/* 参数 */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <textarea value={oneLiner} onChange={e => setOneLiner(e.target.value)}
          placeholder="输入一句话创意..."
          rows={2} className="w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-white/80 placeholder-white/20 text-sm" />
        <div className="flex gap-2">
          <select value={style} onChange={e => setStyle(e.target.value)}
            className="flex-1 rounded-xl border-white/[0.06] bg-white/[0.03] text-white/60 text-xs py-2">
            {STYLE_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))}
            className="w-20 rounded-xl border-white/[0.06] bg-white/[0.03] text-white/60 text-xs py-2 text-center" placeholder="秒" />
          <div className="flex gap-1">
            {["9:16","16:9","1:1"].map(a => (
              <button key={a} onClick={() => setAspectRatio(a)}
                className={`px-2 py-1.5 rounded-lg text-xs border transition-all ${aspectRatio === a ? "bg-teal-500/15 border-teal-500/25 text-teal-300" : "border-white/[0.06] text-white/40 hover:border-white/20"}`}>{a}</button>
            ))}
          </div>
        </div>
        <button onClick={handleCreate} disabled={!oneLiner.trim()}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold">🚀 创建</button>
      </div>

      {/* 角色 / 产品素材 / 配图 — 根据类型切换 */}
      {(genreKey === "short_drama" || genreKey === "comic") && (
        <>
          <div className="glass rounded-2xl p-5">
            <CharacterCreator onSelect={setSelectedChar} selectedId={selectedChar?.id} />
          </div>
          {selectedChar && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/15">
              <div className="w-8 h-10 rounded-lg overflow-hidden bg-[#0C0C14] shrink-0">
                <img src={selectedChar.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/70 font-medium">{selectedChar.name}</div>
                <div className="text-[9px] text-white/30">{selectedChar.appearance.hairStyle} · 穿{selectedChar.costume.top}</div>
              </div>
              <button onClick={() => setSelectedChar(undefined)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
            </div>
          )}
        </>
      )}

      {genreKey === "ad" && (
        <div className="glass rounded-2xl p-5">
          <ProductPhotoUpload onAssetsReady={setProductAssets} initialAssets={productAssets || undefined} />
        </div>
      )}

      {productAssets && genreKey === "ad" && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/5 border border-blue-500/15">
          <div className="text-lg">📦</div>
          <div className="flex-1">
            <div className="text-xs text-white/70 font-medium">{productAssets.name}</div>
            <div className="text-[9px] text-white/30">{productAssets.photos.length} 张产品图 · {productAssets.sellingPoints.length} 个卖点</div>
          </div>
          <button onClick={() => setProductAssets(null)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
        </div>
      )}

      {/* 爆款分析 — 产品广告和知识讲解模式可用 */}
      {(genreKey === "ad" || genreKey === "tutorial") && (
        <ViralTrendPanel
          onInject={setViralTemplate}
          injected={!!viralTemplate} />
      )}

      {/* 流水线 */}
      {project && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="text-xs text-white/40 font-medium">📋 流水线 · {project.oneLiner.slice(0, 30)}</div>
          {PIPELINE_STAGES.map(stage => {
            const ps = project.stages.find(s => s.stageId === stage.id)
            const done = ps?.status === "done"
            const failed = ps?.status === "failed"
            return (
              <div key={stage.id} className={`rounded-xl border p-3 transition-all ${done ? "bg-teal-500/5 border-teal-500/15" : failed ? "bg-red-500/5 border-red-500/15" : "border-white/[0.06]"}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{stage.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-white/70">{stage.name}</div>
                      <div className="text-[10px] text-white/30">{stage.description}</div>
                    </div>
                  </div>
                  {done ? <span className="text-[10px] text-teal-400">✅ 完成</span> : failed ? <span className="text-[10px] text-red-400">失败</span> : (
                    <button onClick={() => handleRunStage(stage.id)} disabled={running || !activeId}
                      className="px-3 py-1 text-[10px] rounded-lg bg-white/[0.04] text-white/40 hover:text-white/60 border border-white/[0.06] disabled:opacity-20">运行</button>
                  )}
                </div>
                {ps?.output && done && <pre className="text-[10px] text-white/30 mt-2 line-clamp-2">{ps.output.slice(0, 200)}</pre>}
              </div>
            )
          })}
        </div>
      )}

      {/* 故事板 */}
      {storyboardShots.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs text-white/50 font-medium">故事板</div>
            <button onClick={handleGenerateAll} disabled={!!generatingShot}
              className="px-3 py-1 text-[10px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold disabled:opacity-40">🎨 一键生成关键帧</button>
          </div>
          <StoryboardEditor shots={storyboardShots} character={selectedChar} onUpdateShot={handleUpdateShot} onGenerateKeyframe={handleGenerateKeyframe} generatingShot={generatingShot} />
        </div>
      )}
    </div>
  )
}

// ─── 口述面板 ──────────────────────────────
function VoicePanel() {
  const { user } = useJiyingUser()
  const [session, setSession] = useState<VoiceDirectorSession | null>(null)
  const [narrative, setNarrative] = useState("")
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedScene, setSelectedScene] = useState<NarratedScene | null>(null)
  const [selectedChar, setSelectedChar] = useState<CharacterTemplate | undefined>()
  const recognitionRef = useRef<any>(null)
  const lastResultIdx = useRef(0)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const r = new SR(); r.lang = "zh-CN"; r.interimResults = true; r.continuous = true
    r.onresult = (e: any) => {
      let t = ""
      for (let i = lastResultIdx.current; i < e.results.length; i++) { t += e.results[i][0].transcript; if (e.results[i].isFinal) lastResultIdx.current = i + 1 }
      if (t) setNarrative(p => p + t)
    }
    r.onend = () => { setListening(false); lastResultIdx.current = 0 }
    recognitionRef.current = r
    return () => { try { recognitionRef.current?.abort() } catch {} }
  }, [])

  const toggleVoice = useCallback(async () => {
    if (!recognitionRef.current) return
    if (listening) { recognitionRef.current.stop(); setListening(false); return }
    try { await navigator.mediaDevices.getUserMedia({ audio: true }); recognitionRef.current.start(); setListening(true) } catch { alert("需要麦克风权限") }
  }, [listening])

  const handleGenerate = useCallback(async () => {
    if (!narrative.trim() || loading) return
    setLoading(true)
    try { setSession(await createVoiceDirectorSession(narrative.trim())) } catch {}
    setLoading(false)
  }, [narrative, loading])

  return (
    <div className="space-y-4">
      <div className="glass rounded-2xl p-5 text-center space-y-4">
        <div className="text-4xl">🎙️</div>
        <h3 className="text-base font-semibold text-white/80">口述成片</h3>
        <p className="text-xs text-white/30">对着麦克风讲故事，AI实时拆解分镜头</p>
        <button onClick={toggleVoice}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${listening ? "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse" : "bg-white/[0.04] text-white/60 border border-white/[0.08] hover:bg-white/[0.06]"}`}>
          <span className={`w-3 h-3 rounded-full ${listening ? "bg-red-400" : "bg-white/20"}`} />
          {listening ? "🔴 录音中，点击停止" : "🎤 开始口述"}
        </button>
        <textarea value={narrative} onChange={e => setNarrative(e.target.value)}
          placeholder="一个少年站在废墟上，远处是燃烧的城市……"
          rows={4} className="w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-white/70 placeholder-white/20 text-sm mt-2" />
        <div className="flex gap-2 justify-center">
          <button onClick={handleGenerate} disabled={!narrative.trim() || loading}
            className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-teal-500/20 border border-teal-500/20 hover:bg-teal-500/30 disabled:opacity-30">🧠 生成分镜</button>
          <button onClick={() => { setNarrative(""); setSession(null) }} className="px-4 py-2 rounded-xl text-xs text-white/30 border border-white/[0.06] hover:text-white/50">清空</button>
        </div>
      </div>
      <div className="glass rounded-2xl p-5"><CharacterCreator onSelect={setSelectedChar} selectedId={selectedChar?.id} /></div>
      {session && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[{ icon: "🧠", label: "结构", value: session.narrativeArc.structure }, { icon: "🎨", label: "风格", value: session.thinkingOverlay.visualStyle }, { icon: "🎵", label: "音乐", value: session.thinkingOverlay.musicStyle }].map(c => (
              <div key={c.label} className="bg-white/[0.03] rounded-xl p-3 text-center"><div className="text-xs text-white/30">{c.icon} {c.label}</div><div className="text-sm font-bold text-white/70 mt-0.5">{c.value}</div></div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {session.scenes.map((s, i) => (
              <div key={s.id} onClick={() => setSelectedScene(selectedScene?.id === s.id ? null : s)} className={`rounded-xl border p-3 cursor-pointer transition-all ${selectedScene?.id === s.id ? "bg-teal-500/10 border-teal-500/20" : "bg-white/[0.02] border-white/[0.06] hover:border-white/20"}`}>
                <div className="flex items-center gap-2 mb-1"><span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 text-[10px] flex items-center justify-center font-bold">{i + 1}</span><span className="text-xs text-white/50">≈{s.timestamp}s</span></div>
                <p className="text-[10px] text-white/40 line-clamp-2">{s.sceneDescription}</p>
              </div>
            ))}
          </div>
          <button onClick={() => { const p = createProject(narrative.slice(0, 50), "storytelling", session.thinkingOverlay.visualStyle || "写实风格", session.scenes.length * 5, "16:9", undefined, user?.id); alert(`已创建「${p.oneLiner}」`) }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500">🎬 发送到即影生成</button>
        </div>
      )}
    </div>
  )
}

// ─── 主页面 ──────────────────────────────
export default function MangaPage() {
  const [mode, setMode] = useState<"select" | "create" | "voice">("select")
  const [selectedGenre, setSelectedGenre] = useState<GenreKey | null>(null)

  const handleSelectGenre = useCallback((genre: GenreKey) => {
    setSelectedGenre(genre)
    setMode("create")
  }, [])

  // 选择页
  if (mode === "select") {
    return (
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#18182A] border border-[#F59E0B]/15 text-xs text-[#F59E0B] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-pulse" />🎬 即刻影片工厂
          </div>
          <h1 className="text-2xl md:text-3xl font-bold">
            <span className="bg-gradient-to-r from-[#F59E0B] to-[#F97316] bg-clip-text text-transparent">选择视频类型</span>
          </h1>
          <p className="text-sm text-[#9898B0] mt-2">角色驱动 · AI 全自动流水线</p>
        </div>

        <div className="space-y-3">
          {GENRE_CARDS.map(c => (
            <button key={c.id} onClick={() => handleSelectGenre(c.id)}
              className="w-full text-left glass-card rounded-2xl p-5 hover:shadow-hover transition-all group border border-white/[0.06] hover:border-white/20">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-2xl shadow-lg shrink-0`}>{c.icon}</div>
                <div className="flex-1">
                  <div className="text-base font-bold text-white/80 group-hover:text-white transition-colors">{c.label}</div>
                  <div className="text-xs text-white/30 mt-0.5">{c.desc}</div>
                </div>
                <div className="text-white/20 group-hover:text-[#F59E0B] transition-colors text-lg">→</div>
              </div>
            </button>
          ))}
        </div>

        <div className="text-center pt-4">
          <button onClick={() => setMode("voice")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.03] text-white/50 hover:text-white/70 border border-white/[0.06] text-sm transition-all">
            🎙️ 或者使用口述成片
          </button>
        </div>
      </div>
    )
  }

  // 创建页 / 口述页
  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {mode === "create" && selectedGenre && (
        <CreateProjectPanel genreKey={selectedGenre} onBack={() => { setMode("select"); setSelectedGenre(null) }} />
      )}
      {mode === "voice" && <VoicePanel />}
    </div>
  )
}
