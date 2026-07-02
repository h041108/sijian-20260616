"use client"
import { useState, useCallback, useRef, useEffect } from "react"
import { createProject, loadProjects, executeStage, getDirectorPlan, type VideoProject, type PipelineStageId } from "@/lib/video-factory"
import { createVoiceDirectorSession, type VoiceDirectorSession, type NarratedScene } from "@/lib/voice-video"
import { useJiyingUser } from "../layout"
import CharacterCreator from "@/components/CharacterCreator"
import ProductPhotoUpload, { type ProductAssets } from "@/components/ProductPhotoUpload"
import UnifiedViralAnalyzer, { type ViralTemplate } from "@/components/UnifiedViralAnalyzer"
import FilmParameters, { type FilmParams } from "@/components/FilmParameters"
import StoryboardVideoRenderer from "@/components/StoryboardVideoRenderer"
import { buildReferenceImageUrls, buildCharacterPrompt, genId, type CharacterTemplate, type StoryboardShot } from "@/lib/character-engine"
import SlideRenderer from "@/components/SlideRenderer"

// ═══════════════════════════════════════════════════
// 类型 & 常量
// ═══════════════════════════════════════════════════
type GenreKey = "short_drama" | "comic" | "tutorial" | "ad"

const GENRE_CARDS: { id: GenreKey; icon: string; label: string; desc: string; color: string; style: string }[] = [
  { id: "short_drama", icon: "🎭", label: "微短剧", desc: "剧情向短视频，完整起承转合", color: "from-pink-500 to-rose-500", style: "写实风格" },
  { id: "comic", icon: "📚", label: "漫剧", desc: "漫画风格叙事，二次元/国风", color: "from-teal-400 to-emerald-500", style: "日系动漫" },
  { id: "tutorial", icon: "📖", label: "知识图谱", desc: "教育科普，图文配合讲解", color: "from-blue-500 to-indigo-500", style: "扁平设计" },
  { id: "ad", icon: "📢", label: "产品广告", desc: "15-30秒产品种草视频", color: "from-amber-500 to-orange-500", style: "高端质感" },
]

// ─── 导演工作流步骤 ───
type DirectorStep = "setup" | "story" | "script" | "keyframes" | "export"

const STEPS: { id: DirectorStep; label: string; icon: string; desc: string }[] = [
  { id: "setup", label: "制片筹备", icon: "📋", desc: "创意、风格、角色、导演参数" },
  { id: "story", label: "故事创世", icon: "📖", desc: "一句话→完整故事大纲" },
  { id: "script", label: "分镜脚本", icon: "🎬", desc: "故事→逐镜头拍摄方案" },
  { id: "keyframes", label: "逐帧监制", icon: "🖼️", desc: "逐帧生成→用户审批→确保连贯" },
  { id: "export", label: "合成导出", icon: "🎞️", desc: "视频合成、下载成品" },
]

// ─── 从流水线输出解析分镜 ───
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
    const cameraMatch = block.match(/景别[：:]([\s\S]*?)(?=\||运镜|\n|$)/i)
    const moveMatch = block.match(/运镜[：:]([\s\S]*?)(?=\||\n|$)/i)
    const desc = descMatch?.[1]?.trim() || ""
    if (desc.length >= 5) {
      shots.push({
        id: genId(), shotNumber: shotNum,
        duration: Math.min(30, Math.max(2, duration || 5)),
        description: desc, dialogue: dialMatch?.[1]?.trim() || "",
        mood: moodMatch?.[1]?.trim() || "", transition: "切",
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
  return shots.slice(0, 12)
}

// ═══════════════════════════════════════════════════
// 步骤1：制片筹备面板
// ═══════════════════════════════════════════════════
function SetupPanel({
  genreKey, onProceed, onBack,
}: { genreKey: GenreKey; onProceed: (data: SetupData) => void; onBack: () => void }) {
  const card = GENRE_CARDS.find(c => c.id === genreKey)!
  const [oneLiner, setOneLiner] = useState("")
  const [style, setStyle] = useState(card.style)
  const [duration, setDuration] = useState(card.id === "comic" ? 120 : card.id === "tutorial" ? 60 : card.id === "ad" ? 30 : 90)
  const [aspectRatio, setAspectRatio] = useState("9:16")
  const [selectedChar, setSelectedChar] = useState<CharacterTemplate | undefined>()
  const [productAssets, setProductAssets] = useState<ProductAssets | null>(null)
  const [viralTemplate, setViralTemplate] = useState<ViralTemplate | null>(null)
  const [filmParams, setFilmParams] = useState<FilmParams | null>(null)

  const STYLE_OPTIONS = ["写实风格", "日系动漫", "国风水墨", "赛博朋克", "皮克斯3D", "油画风格", "扁平设计", "高端质感"]

  const handleProceed = useCallback(() => {
    if (!oneLiner.trim()) return
    onProceed({
      oneLiner, style, duration, aspectRatio,
      selectedChar, productAssets, viralTemplate, filmParams,
    })
  }, [oneLiner, style, duration, aspectRatio, selectedChar, productAssets, viralTemplate, filmParams, onProceed])

  return (
    <div className="space-y-5">
      {/* 顶栏 */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-white/30 hover:text-white/60 text-sm">← 返回</button>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-base`}>{card.icon}</div>
        <div>
          <div className="text-base font-bold text-white/80">{card.label} · 制片筹备</div>
          <div className="text-[10px] text-white/30">设定创意、角色、导演参数，准备开拍</div>
        </div>
      </div>

      {/* 一句话创意 */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm">💡</span>
          <span className="text-xs font-bold text-white/60">一句话创意</span>
          <span className="text-[9px] text-white/20">这是你影片的起点，描述你想拍什么</span>
        </div>
        <textarea value={oneLiner} onChange={e => setOneLiner(e.target.value)}
          placeholder="一位灰发少年站在废墟城市顶端，黄昏逆光……"
          rows={3} className="w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-white/80 placeholder-white/20 text-sm" />

        {/* 风格 / 时长 / 画幅 */}
        <div className="flex gap-2">
          <select value={style} onChange={e => setStyle(e.target.value)}
            className="flex-1 rounded-xl border-white/[0.06] bg-[#1A1A2E] text-white/80 text-xs py-2 appearance-none">
            {STYLE_OPTIONS.map(s => <option key={s} className="bg-[#1A1A2E] text-white">{s}</option>)}
          </select>
          <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))}
            className="w-20 rounded-xl border-white/[0.06] bg-[#1A1A2E] text-white/80 text-xs py-2 text-center" />
          <div className="flex gap-1">
            {["9:16","16:9","1:1"].map(a => (
              <button key={a} onClick={() => setAspectRatio(a)}
                className={`px-2 py-1.5 rounded-lg text-xs border transition-all ${aspectRatio === a ? "bg-[#F59E0B]/15 border-[#F59E0B]/30 text-[#F59E0B]" : "border-white/[0.06] text-white/40"}`}>{a}</button>
            ))}
          </div>
        </div>

        {/* 爆款趋势分析（仅关键词搜索，链接已隐藏） */}
        <UnifiedViralAnalyzer
          niche={style}
          platform={genreKey === "comic" ? "B站" : genreKey === "ad" ? "抖音" : "小红书"}
          injected={!!viralTemplate}
          showInjectButton
          onTemplateReady={(template, suggestedOneLiner) => {
            setViralTemplate(template)
            if (!oneLiner.trim()) setOneLiner(suggestedOneLiner)
          }} />

        {/* 导演控制台 */}
        {(genreKey === "short_drama" || genreKey === "comic" || genreKey === "ad") && (
          <FilmParameters genre={genreKey} onChange={setFilmParams} />
        )}
      </div>

      {/* 角色创建（短剧/漫剧） */}
      {(genreKey === "short_drama" || genreKey === "comic") && (
        <>
          <div className="glass rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">👤</span>
              <span className="text-xs font-bold text-white/60">角色选角</span>
              <span className="text-[9px] text-white/20">选择或创建角色，确保画面一致性</span>
            </div>
            <CharacterCreator onSelect={setSelectedChar} selectedId={selectedChar?.id} />
          </div>
          {selectedChar && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#F59E0B]/5 border border-[#F59E0B]/15">
              <div className="w-10 h-12 rounded-lg overflow-hidden bg-[#0C0C14] shrink-0">
                <img src={selectedChar.thumbnailUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/70 font-medium">{selectedChar.name} 已入选</div>
                <div className="text-[9px] text-white/30">{selectedChar.appearance.hairStyle} · 穿{selectedChar.costume.top}</div>
              </div>
              <button onClick={() => setSelectedChar(undefined)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
            </div>
          )}
        </>
      )}

      {/* 产品上传（广告） */}
      {genreKey === "ad" && (
        <div className="glass rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">📦</span>
            <span className="text-xs font-bold text-white/60">产品素材</span>
            <span className="text-[9px] text-white/20">上传产品照片，AI自动生成种草视频</span>
          </div>
          <ProductPhotoUpload onAssetsReady={setProductAssets} initialAssets={productAssets || undefined} />
        </div>
      )}
      {productAssets && genreKey === "ad" && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500/5 border border-blue-500/15">
          <div className="text-lg">📦</div>
          <div className="flex-1">
            <div className="text-xs text-white/70 font-medium">{productAssets.name}</div>
            <div className="text-[9px] text-white/30">{productAssets.photos.length} 张图 · {productAssets.sellingPoints.length} 个卖点</div>
          </div>
          <button onClick={() => setProductAssets(null)} className="text-white/30 hover:text-white/60 text-xs">✕</button>
        </div>
      )}

      {/* 广告/知识讲解 — 补充爆款分析 */}
      {(genreKey === "ad" || genreKey === "tutorial") && (
        <div className="glass rounded-2xl p-5">
          <UnifiedViralAnalyzer
            niche={style}
            platform={genreKey === "ad" ? "抖音" : "B站"}
            injected={!!viralTemplate}
            showInjectButton
            compact
            onTemplateReady={(template) => setViralTemplate(template)} />
        </div>
      )}

      {/* 开拍按钮 */}
      <button onClick={handleProceed} disabled={!oneLiner.trim()}
        className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40 shadow-lg shadow-[#F59E0B]/20">
        🎬 确认开拍 → 进入故事创世
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 步骤2+3+4+5：导演工作流面板
// ═══════════════════════════════════════════════════
type SetupData = {
  oneLiner: string; style: string; duration: number; aspectRatio: string
  selectedChar?: CharacterTemplate; productAssets?: ProductAssets | null
  viralTemplate?: ViralTemplate | null; filmParams?: FilmParams | null
}

function DirectorWorkflow({ genreKey, setupData, onBack }: {
  genreKey: GenreKey; setupData: SetupData; onBack: () => void
}) {
  const { user } = useJiyingUser()
  const card = GENRE_CARDS.find(c => c.id === genreKey)!
  const [step, setStep] = useState<DirectorStep>("story")
  const [project, setProject] = useState<VideoProject | null>(null)
  const [running, setRunning] = useState(false)
  const [storyText, setStoryText] = useState("")
  const [storyboardShots, setStoryboardShots] = useState<StoryboardShot[]>([])
  const [generatingShot, setGeneratingShot] = useState<string | null>(null)
  const [shotApproved, setShotApproved] = useState<Record<string, boolean>>({})
  const [allKeyframesApproved, setAllKeyframesApproved] = useState(false)
  const [showVideoRender, setShowVideoRender] = useState(false)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [showSlideRender, setShowSlideRender] = useState(false)
  const [slideBlob, setSlideBlob] = useState<Blob | null>(null)
  const [autoRunning, setAutoRunning] = useState(false)

  // 创建项目
  const initProject = useCallback(() => {
    if (project) return
    const vt = setupData.viralTemplate ? { ...setupData.viralTemplate } : undefined
    const refUrls = setupData.productAssets?.photos?.length
      ? setupData.productAssets.photos
      : setupData.selectedChar ? (() => {
          const urls: string[] = []
          if (setupData.selectedChar!.referenceImages.front) urls.push(setupData.selectedChar!.referenceImages.front)
          if (setupData.selectedChar!.referenceImages.side) urls.push(setupData.selectedChar!.referenceImages.side)
          if (setupData.selectedChar!.referenceImages.back) urls.push(setupData.selectedChar!.referenceImages.back)
          return urls
        })() : undefined
    const charDesc = setupData.selectedChar ? buildCharacterPrompt(setupData.selectedChar) : undefined
    const fp = setupData.filmParams ? {
      visualStyle: setupData.filmParams.visualStyle || "", lensFocal: setupData.filmParams.lensFocal || "",
      shotScale: setupData.filmParams.shotScale || "", cameraAngle: setupData.filmParams.cameraAngle || "",
      cameraMove: setupData.filmParams.cameraMove || "", lighting: setupData.filmParams.lighting || "",
      colorTone: setupData.filmParams.colorTone || "", environment: setupData.filmParams.environment || "",
      timeOfDay: setupData.filmParams.timeOfDay || "", mood: setupData.filmParams.mood || "",
      actionDesc: setupData.filmParams.actionDesc || "", soundDesign: setupData.filmParams.soundDesign || "",
      editRhythm: setupData.filmParams.editRhythm || "",
    } : undefined
    const p = createProject(setupData.oneLiner, genreKey, setupData.style, setupData.duration, setupData.aspectRatio, vt, user?.id, {
      characterRefUrls: genreKey === "short_drama" || genreKey === "comic" ? refUrls : undefined,
      productImageUrls: genreKey === "ad" ? setupData.productAssets?.photos : undefined,
      charName: setupData.selectedChar?.name,
      charDescription: charDesc,
      filmParams: fp,
    })
    setProject(p)
  }, [project, setupData, genreKey, user])

  // 初始化项目（挂载时）
  useEffect(() => { initProject() }, [initProject])

  // 运行阶段
  const handleRunStage = useCallback(async (stageId: PipelineStageId) => {
    if (!project || running) return
    setRunning(true)
    try {
      await executeStage(project.id, stageId)
      const projects = loadProjects()
      const updated = projects.find(p => p.id === project.id) || null
      setProject(updated)
      if (updated) {
        if (stageId === "story_genesis") {
          const storyStage = updated.stages.find(s => s.stageId === "story_genesis")
          if (storyStage?.output) setStoryText(storyStage.output)
        }
        if (stageId === "story_genesis" || stageId === "script_breakdown") {
          const sbStage = updated.stages.find(s => s.stageId === "script_breakdown")
          const storyStage = updated.stages.find(s => s.stageId === "story_genesis")
          const output = sbStage?.output || storyStage?.output || ""
          const parsed = parseShotsFromScriptOutput(output)
          if (parsed.length > 0) setStoryboardShots(parsed)
        }
      }
    } catch {}
    setRunning(false)
  }, [project, running])

  // 逐帧生成关键帧（带帧间连续性）
  const handleGenerateKeyframe = useCallback(async (shotIndex: number) => {
    if (!project || generatingShot) return
    const shot = storyboardShots[shotIndex]
    if (!shot) return
    setGeneratingShot(shot.id)
    try {
      const refUrls = setupData.productAssets?.photos?.length
        ? setupData.productAssets.photos
        : setupData.selectedChar ? buildReferenceImageUrls(setupData.selectedChar) : []
      const productPrefix = setupData.productAssets
        ? `产品：${setupData.productAssets.name}，卖点：${setupData.productAssets.sellingPoints.join("、")}。`
        : ""
      const charPrefix = setupData.selectedChar ? buildCharacterPrompt(setupData.selectedChar) : ""
      const fpStr = setupData.filmParams
        ? [setupData.filmParams.visualStyle, setupData.filmParams.environment, setupData.filmParams.lighting, setupData.filmParams.colorTone,
           setupData.filmParams.timeOfDay, setupData.filmParams.mood, setupData.filmParams.lensFocal, setupData.filmParams.shotScale,
           setupData.filmParams.cameraAngle, setupData.filmParams.cameraMove, setupData.filmParams.actionDesc].filter(Boolean).join("，")
        : ""
      // 帧间连续性：用上一个已审批帧作为参考
      const prevApprovedShot = shotIndex > 0
        ? storyboardShots.slice(0, shotIndex).reverse().find(s => shotApproved[s.id] && s.keyframeUrl)
        : null
      const continuityPrefix = prevApprovedShot
        ? `延续上一帧画面（镜头${prevApprovedShot.shotNumber}），仅改变：`
        : ""
      const prompt = `${setupData.style}风格${fpStr ? "，" + fpStr : ""}。${productPrefix}${charPrefix}${continuityPrefix}${shot.description}${shot.characterActions ? `，动作：${shot.characterActions}` : ""}。${shot.cameraAngle}${shot.cameraMovement ? `，运镜：${shot.cameraMovement}` : ""}${shot.mood ? `，氛围：${shot.mood}` : ""}，电影级画质`.slice(0, 380)
      const imageRef = prevApprovedShot?.keyframeUrl || refUrls[0] || undefined
      const imageStrength = prevApprovedShot ? 0.55 : refUrls[0] ? 0.5 : undefined
      const res = await fetch("/api/video/frame", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt, width: 1920, height: 1080,
          image: imageRef,
          image_strength: imageStrength,
        }),
      })
      const data = await res.json()
      if (data.url) {
        setStoryboardShots(prev => prev.map(s => s.id === shot.id ? { ...s, keyframeUrl: data.url, status: "done" as const } : s))
      }
    } catch {}
    setGeneratingShot(null)
  }, [project, storyboardShots, generatingShot, setupData, shotApproved])

  // 全部关键帧审批通过后进入导出
  const checkAllApproved = useCallback(() => {
    const approved = storyboardShots.filter(s => s.keyframeUrl && shotApproved[s.id])
    if (approved.length === storyboardShots.length && storyboardShots.length > 0) {
      setAllKeyframesApproved(true)
    }
  }, [storyboardShots, shotApproved])

  // 一键全自动（跳过审批门控）
  const handleAutoRun = useCallback(async () => {
    if (!project || autoRunning) return
    setAutoRunning(true)
    const plan = getDirectorPlan(genreKey, "full")
    for (const stageId of plan.stages) {
      setRunning(true)
      try { await executeStage(project.id, stageId) } catch {}
      const projects = loadProjects()
      const updated = projects.find(p => p.id === project.id) || null
      setProject(updated)
      if (updated) {
        if (stageId === "story_genesis") {
          const storyStage = updated.stages.find(s => s.stageId === "story_genesis")
          if (storyStage?.output) setStoryText(storyStage.output)
        }
        if (stageId === "story_genesis" || stageId === "script_breakdown") {
          const sbStage = updated.stages.find(s => s.stageId === "script_breakdown")
          const storyStage = updated.stages.find(s => s.stageId === "story_genesis")
          const output = sbStage?.output || storyStage?.output || ""
          const parsed = parseShotsFromScriptOutput(output)
          if (parsed.length > 0) setStoryboardShots(parsed)
        }
      }
      setRunning(false)
    }
    // 自动生成所有关键帧并审批
    for (let i = 0; i < storyboardShots.length; i++) {
      await handleGenerateKeyframe(i)
      const shot = storyboardShots[i]
      if (shot) setShotApproved(prev => ({ ...prev, [shot.id]: true }))
    }
    setAllKeyframesApproved(true)
    setStep("export")
    setAutoRunning(false)
  }, [project, autoRunning, genreKey, storyboardShots, handleGenerateKeyframe])

  // ── 步骤进度指示器 ──
  const StepIndicator = () => (
    <div className="flex items-center gap-1 px-1">
      {STEPS.slice(1).map((s, i) => {
        const stepKeys = STEPS.slice(1).map(st => st.id)
        const currentIdx = stepKeys.indexOf(step)
        const thisIdx = i
        const isActive = thisIdx === currentIdx
        const isDone = thisIdx < currentIdx
        return (
          <div key={s.id} className="flex items-center gap-1">
            <div className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-[10px] font-medium transition-all ${
              isActive ? "bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/25" :
              isDone ? "bg-teal-500/10 text-teal-400 border border-teal-500/20" :
              "bg-white/[0.03] text-white/30 border border-white/[0.06]"
            }`}>
              <span className="text-xs">{isDone ? "✅" : s.icon}</span>
              <span>{s.label}</span>
            </div>
            {i < STEPS.length - 2 && <span className="text-white/10 text-xs">→</span>}
          </div>
        )
      })}
    </div>
  )

  return (
    <div className="space-y-5">
      {/* 顶栏 + 步骤进度 */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-white/30 hover:text-white/60 text-sm">← 返回</button>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center text-base`}>{card.icon}</div>
        <div className="flex-1">
          <div className="text-base font-bold text-white/80">{card.label}</div>
          <div className="text-[10px] text-white/30">{project?.oneLiner?.slice(0, 40) || setupData.oneLiner.slice(0, 40)}</div>
        </div>
        <button onClick={handleAutoRun} disabled={autoRunning || running}
          className="px-4 py-1.5 text-[10px] rounded-lg bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold disabled:opacity-40">
          {autoRunning ? "🔄 自动运行中..." : "⚡ 一键全自动"}
        </button>
      </div>

      {/* 进度条 */}
      <StepIndicator />

      {autoRunning && (
        <div className="h-1.5 bg-[#0C0C14] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#F59E0B] to-[#F97316] rounded-full animate-pulse" style={{ width: "60%" }} />
        </div>
      )}

      {/* ══════════════════════════════════════════
          步骤2：故事创世（审批门控）
          ══════════════════════════════════════════ */}
      {step === "story" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">📖</span>
                <div>
                  <div className="text-sm font-bold text-white/70">故事创世</div>
                  <div className="text-[10px] text-white/30">一句话创意 → AI生成完整故事大纲</div>
                </div>
              </div>
              {!storyText && (
                <button onClick={() => handleRunStage("story_genesis")} disabled={running}
                  className="px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold disabled:opacity-40">
                  {running ? "生成中..." : "🧠 生成故事"}
                </button>
              )}
            </div>

            {storyText && (
              <>
                <div className="text-[10px] text-white/40 mb-2">👇 查看并编辑你的故事，满意后点击「通过」进入分镜</div>
                <textarea value={storyText} onChange={e => setStoryText(e.target.value)}
                  rows={12} className="w-full text-[11px] bg-[#0C0C14] rounded-xl p-4 text-white/60 border border-white/10 placeholder-white/20 focus:outline-none focus:border-[#F59E0B]/40 leading-relaxed" />
                <div className="flex gap-2">
                  <button onClick={() => handleRunStage("story_genesis")} disabled={running}
                    className="px-4 py-2 text-xs rounded-xl bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60">
                    🔄 重新生成
                  </button>
                  <button onClick={() => setStep("script")}
                    className="flex-1 py-2.5 text-xs rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-lg shadow-teal-500/15">
                    ✅ 故事通过 → 进入分镜脚本
                  </button>
                </div>
              </>
            )}

            {!storyText && !running && (
              <div className="text-center py-8 text-white/20 text-xs">
                点击「生成故事」按钮，AI将根据你的创意生成完整故事大纲
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          步骤3：分镜脚本（审批门控）
          ══════════════════════════════════════════ */}
      {step === "script" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🎬</span>
                <div>
                  <div className="text-sm font-bold text-white/70">分镜脚本</div>
                  <div className="text-[10px] text-white/30">故事 → 逐镜头拍摄方案，包含画面/对白/景别/运镜</div>
                </div>
              </div>
              {storyboardShots.length === 0 && (
                <button onClick={() => handleRunStage("script_breakdown")} disabled={running}
                  className="px-4 py-2 text-xs rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold disabled:opacity-40">
                  {running ? "生成中..." : "🎬 生成分镜"}
                </button>
              )}
            </div>

            {storyboardShots.length > 0 && (
              <>
                <div className="text-[10px] text-white/40 mb-2">👇 查看每个镜头的描述，满意后点击「通过」进入逐帧监制</div>
                <div className="space-y-2">
                  {storyboardShots.map((shot) => (
                    <div key={shot.id} className="rounded-xl border border-white/[0.06] p-3 bg-white/[0.02]">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="w-6 h-6 rounded-lg bg-[#F59E0B]/20 text-[#F59E0B] text-[10px] font-bold flex items-center justify-center">{shot.shotNumber}</span>
                        <span className="text-[10px] text-white/40">{shot.duration}s</span>
                        <span className="text-[10px] text-white/30">{shot.cameraAngle} · {shot.cameraMovement}</span>
                        {shot.mood && <span className="text-[10px] text-white/25">🎭 {shot.mood}</span>}
                      </div>
                      <div className="text-[11px] text-white/60 leading-relaxed">{shot.description}</div>
                      {shot.dialogue && <div className="text-[10px] text-[#F59E0B]/50 mt-1">💬 {shot.dialogue}</div>}
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleRunStage("script_breakdown")} disabled={running}
                    className="px-4 py-2 text-xs rounded-xl bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60">
                    🔄 重新生成分镜
                  </button>
                  <button onClick={() => setStep("keyframes")}
                    className="flex-1 py-2.5 text-xs rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold shadow-lg shadow-teal-500/15">
                    ✅ 分镜通过 → 进入逐帧监制
                  </button>
                </div>
              </>
            )}

            {storyboardShots.length === 0 && !running && (
              <div className="text-center py-8 text-white/20 text-xs">
                点击「生成分镜」按钮，AI将把故事拆解为逐镜头脚本
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          步骤4：逐帧监制（核心！用户逐帧审批）
          ══════════════════════════════════════════ */}
      {step === "keyframes" && storyboardShots.length > 0 && (
        <div className="space-y-4">
          {/* 说明 */}
          <div className="rounded-2xl bg-[#F59E0B]/5 border border-[#F59E0B]/15 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🖼️</span>
              <span className="text-xs font-bold text-[#F59E0B]/80">逐帧监制 — 像导演一样审片</span>
            </div>
            <div className="text-[10px] text-white/40 leading-relaxed">
              每一帧画面生成后，你可以：<b>审批通过</b>（确保画面连贯）→ <b>拒绝重生成</b>（修正不满意的部分）→ <b>编辑描述</b>（微调画面细节）。<br/>
              通过的帧会作为下一帧的参考，确保镜头间角色、色调、光影的一致性。
            </div>
          </div>

          {/* 批量操作 */}
          <div className="flex items-center gap-2">
            <button onClick={async () => {
              for (let i = 0; i < storyboardShots.length; i++) {
                if (!storyboardShots[i].keyframeUrl) await handleGenerateKeyframe(i)
              }
            }} disabled={!!generatingShot}
              className="px-4 py-2 text-[10px] rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] font-bold disabled:opacity-40">
              🎨 逐帧生成所有画面
            </button>
            <button onClick={() => {
              const allApproved = storyboardShots.every(s => s.keyframeUrl)
              if (allApproved) {
                storyboardShots.forEach(s => setShotApproved(prev => ({ ...prev, [s.id]: true })))
                setAllKeyframesApproved(true)
                setStep("export")
              }
            }} disabled={!storyboardShots.every(s => s.keyframeUrl)}
              className="px-4 py-2 text-[10px] rounded-xl bg-teal-500/15 text-teal-300 border border-teal-500/20 disabled:opacity-30">
              ✅ 全部审批通过 → 导出
            </button>
            <span className="text-[9px] text-white/20 ml-1">
              {storyboardShots.filter(s => shotApproved[s.id]).length}/{storyboardShots.length} 已审批
            </span>
          </div>

          {/* 逐帧审批卡片 */}
          <div className="space-y-3">
            {storyboardShots.map((shot, i) => {
              const isApproved = shotApproved[shot.id]
              const isGenerating = generatingShot === shot.id
              return (
                <div key={shot.id} className={`glass rounded-2xl overflow-hidden transition-all ${
                  isApproved ? "border-teal-500/20 bg-teal-500/[0.03]" :
                  "border-white/[0.06]"
                }`}>
                  <div className="flex gap-4 p-4">
                    {/* 左侧：画面 */}
                    <div className="w-48 shrink-0">
                      <div className="aspect-video rounded-xl bg-[#0C0C14] overflow-hidden relative border border-white/[0.06]">
                        {shot.keyframeUrl ? (
                          <img src={shot.keyframeUrl} alt={`镜头${shot.shotNumber}`} className="w-full h-full object-cover" />
                        ) : isGenerating ? (
                          <div className="w-full h-full flex items-center justify-center text-white/30 text-xs animate-pulse">
                            🔄 生成中...
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <button onClick={() => handleGenerateKeyframe(i)}
                              className="px-3 py-1.5 text-[10px] rounded-lg bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/20 hover:bg-[#F59E0B]/25">
                              🎨 生成画面
                            </button>
                          </div>
                        )}
                        <div className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/70 text-white text-[10px] font-bold flex items-center justify-center">
                          {isApproved ? "✅" : shot.shotNumber}
                        </div>
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/70 text-[9px] text-white/60">
                          {shot.duration}s
                        </div>
                      </div>
                    </div>

                    {/* 右侧：信息 + 操作 */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white/70">镜头 {shot.shotNumber}</span>
                        <span className="text-[9px] text-white/25">{shot.cameraAngle} · {shot.cameraMovement}</span>
                        {shot.mood && <span className="text-[9px] text-white/25">🎭 {shot.mood}</span>}
                      </div>
                      <div className="text-[11px] text-white/50 leading-relaxed">{shot.description}</div>
                      {shot.dialogue && <div className="text-[10px] text-[#F59E0B]/40">💬 {shot.dialogue}</div>}

                      {/* 审批操作 */}
                      {shot.keyframeUrl && !isApproved && (
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => {
                            setShotApproved(prev => ({ ...prev, [shot.id]: true }))
                            checkAllApproved()
                            if (i === storyboardShots.length - 1) {
                              setAllKeyframesApproved(true)
                              setStep("export")
                            }
                          }}
                            className="px-4 py-1.5 text-[10px] rounded-lg bg-teal-500/15 text-teal-300 border border-teal-500/20 hover:bg-teal-500/25 font-medium">
                            ✅ 通过（下一帧将参考此帧保持连贯）
                          </button>
                          <button onClick={() => handleGenerateKeyframe(i)}
                            className="px-3 py-1.5 text-[10px] rounded-lg bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60">
                            🔄 重生成
                          </button>
                        </div>
                      )}
                      {isApproved && (
                        <div className="text-[10px] text-teal-400/60 mt-1">✅ 已通过审批 — 此帧将作为后续帧的参考</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* 底部推进 */}
          {!allKeyframesApproved && (
            <button onClick={() => {
              if (storyboardShots.every(s => s.keyframeUrl)) {
                storyboardShots.forEach(s => setShotApproved(prev => ({ ...prev, [s.id]: true })))
                setAllKeyframesApproved(true)
                setStep("export")
              }
            }} disabled={!storyboardShots.every(s => s.keyframeUrl)}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white text-sm font-bold disabled:opacity-30 shadow-lg shadow-teal-500/15">
              ✅ 所有帧已查看 → 批量通过进入导出
            </button>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          步骤5：合成导出
          ══════════════════════════════════════════ */}
      {step === "export" && (
        <div className="space-y-4">
          <div className="glass rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">🎞️</span>
              <div>
                <div className="text-sm font-bold text-white/70">合成导出</div>
                <div className="text-[10px] text-white/30">{storyboardShots.length} 个已审批镜头 → 视频成品</div>
              </div>
            </div>

            {/* 已审批帧预览 */}
            <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5">
              {storyboardShots.filter(s => s.keyframeUrl).map(shot => (
                <div key={shot.id} className="aspect-video rounded-lg overflow-hidden bg-[#0C0C14]">
                  <img src={shot.keyframeUrl!} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>

            {/* 视频渲染 */}
            {(genreKey === "short_drama" || genreKey === "comic" || genreKey === "ad") && (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowVideoRender(!showVideoRender)}
                  className={`px-4 py-2 text-[10px] rounded-xl border transition-all ${
                    showVideoRender ? "bg-red-500/15 border-red-500/25 text-red-300" : "bg-white/[0.04] text-white/40 border-white/[0.06]"
                  }`}>
                  {showVideoRender ? "🎬 视频预览中" : "🎬 导出视频"}
                </button>
                <span className="text-[9px] text-white/20">约{storyboardShots.length * 5}秒</span>
              </div>
            )}
            {showVideoRender && (genreKey === "short_drama" || genreKey === "comic" || genreKey === "ad") && (
              <div className="space-y-3">
                <StoryboardVideoRenderer
                  shots={storyboardShots} genre={genreKey} title={project?.oneLiner || ""}
                  onRecordingComplete={(blob) => setVideoBlob(blob)} />
                {videoBlob && (
                  <div className="flex gap-2">
                    <a href={URL.createObjectURL(videoBlob)} download={`视频_${Date.now()}.webm`}
                      className="flex-1 py-2.5 rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 text-xs font-medium text-center hover:bg-green-500/25">
                      📥 下载视频 (.webm)
                    </a>
                    <button onClick={() => setVideoBlob(null)}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-white/40 text-xs">重新录制</button>
                  </div>
                )}
              </div>
            )}

            {/* 知识讲解动画 */}
            {genreKey === "tutorial" && (
              <div className="flex items-center gap-2">
                <button onClick={() => setShowSlideRender(!showSlideRender)}
                  className={`px-4 py-2 text-[10px] rounded-xl border transition-all ${
                    showSlideRender ? "bg-blue-500/15 border-blue-500/25 text-blue-300" : "bg-white/[0.04] text-white/40 border-white/[0.06]"
                  }`}>
                  {showSlideRender ? "📖 动画预览中" : "📖 知识讲解动画"}
                </button>
              </div>
            )}
            {showSlideRender && genreKey === "tutorial" && (
              <div className="space-y-3">
                <SlideRenderer
                  title={project?.oneLiner || "知识讲解"}
                  content={project?.stages?.find(s => s.stageId === "story_genesis" || s.stageId === "script_breakdown")?.output || ""}
                  onRecordingComplete={(blob) => setSlideBlob(blob)} />
                {slideBlob && (
                  <div className="flex gap-2">
                    <a href={URL.createObjectURL(slideBlob)} download={`知识讲解_${Date.now()}.webm`}
                      className="flex-1 py-2.5 rounded-xl bg-green-500/15 text-green-400 border border-green-500/20 text-xs font-medium text-center">
                      📥 下载视频
                    </a>
                    <button onClick={() => setSlideBlob(null)}
                      className="px-4 py-2.5 rounded-xl bg-white/[0.04] text-white/40 text-xs">重新录制</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 口述面板（保留不变）
// ═══════════════════════════════════════════════════
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
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${listening ? "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse" : "bg-white/[0.04] text-white/60 border border-white/[0.08]"}`}>
          <span className={`w-3 h-3 rounded-full ${listening ? "bg-red-400" : "bg-white/20"}`} />
          {listening ? "🔴 录音中" : "🎤 开始口述"}
        </button>
        <textarea value={narrative} onChange={e => setNarrative(e.target.value)}
          placeholder="一个少年站在废墟上……"
          rows={4} className="w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-white/70 placeholder-white/20 text-sm mt-2" />
        <div className="flex gap-2 justify-center">
          <button onClick={handleGenerate} disabled={!narrative.trim() || loading}
            className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-teal-500/20 border border-teal-500/20 disabled:opacity-30">🧠 生成分镜</button>
          <button onClick={() => { setNarrative(""); setSession(null) }} className="px-4 py-2 rounded-xl text-xs text-white/30 border border-white/[0.06]">清空</button>
        </div>
      </div>
      <div className="glass rounded-2xl p-5"><CharacterCreator onSelect={setSelectedChar} selectedId={selectedChar?.id} /></div>
      {session && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {session.scenes.map((s, i) => (
              <div key={s.id} onClick={() => setSelectedScene(selectedScene?.id === s.id ? null : s)}
                className={`rounded-xl border p-3 cursor-pointer transition-all ${selectedScene?.id === s.id ? "bg-teal-500/10 border-teal-500/20" : "bg-white/[0.02] border-white/[0.06]"}`}>
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

// ═══════════════════════════════════════════════════
// 主页面
// ═══════════════════════════════════════════════════
export default function MangaPage() {
  const [mode, setMode] = useState<"select" | "setup" | "workflow" | "voice">("select")
  const [selectedGenre, setSelectedGenre] = useState<GenreKey | null>(null)
  const [setupData, setSetupData] = useState<SetupData | null>(null)

  const handleSelectGenre = useCallback((genre: GenreKey) => {
    setSelectedGenre(genre)
    setMode("setup")
  }, [])

  const handleSetupComplete = useCallback((data: SetupData) => {
    setSetupData(data)
    setMode("workflow")
  }, [])

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
          <p className="text-sm text-[#9898B0] mt-2">导演式工作流 · 逐帧审批 · 确保画面连贯</p>
        </div>

        <div className="space-y-3">
          {GENRE_CARDS.map(c => (
            <button key={c.id} onClick={() => handleSelectGenre(c.id)}
              className="w-full text-left glass-card rounded-2xl p-5 hover:shadow-hover transition-all group border border-white/[0.06] hover:border-white/20">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-2xl shadow-lg shrink-0`}>{c.icon}</div>
                <div className="flex-1">
                  <div className="text-base font-bold text-white/80 group-hover:text-white">{c.label}</div>
                  <div className="text-xs text-white/30 mt-0.5">{c.desc}</div>
                </div>
                <div className="text-white/20 group-hover:text-[#F59E0B] text-lg">→</div>
              </div>
            </button>
          ))}
        </div>

        {/* 工作流说明 */}
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
          <div className="text-xs text-white/40 font-medium mb-3">🎬 导演工作流程</div>
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center gap-1">
                <div className="px-3 py-1.5 rounded-lg text-[10px] bg-white/[0.04] border border-white/[0.06] text-white/50">
                  <span className="mr-1">{s.icon}</span>{s.label}
                  <div className="text-[8px] text-white/20 mt-0.5">{s.desc}</div>
                </div>
                {i < STEPS.length - 1 && <span className="text-white/10">→</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center pt-4">
          <button onClick={() => setMode("voice")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.03] text-white/50 border border-white/[0.06] text-sm">
            🎙️ 或者使用口述成片
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {mode === "setup" && selectedGenre && (
        <SetupPanel genreKey={selectedGenre} onProceed={handleSetupComplete} onBack={() => { setMode("select"); setSelectedGenre(null) }} />
      )}
      {mode === "workflow" && selectedGenre && setupData && (
        <DirectorWorkflow genreKey={selectedGenre} setupData={setupData} onBack={() => setMode("setup")} />
      )}
      {mode === "voice" && <VoicePanel />}
    </div>
  )
}
