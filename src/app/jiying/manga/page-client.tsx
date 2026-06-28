"use client"
import { useState, useCallback, useEffect, useRef } from "react"
import { createProject, loadProjects, executeStage, PIPELINE_STAGES, type VideoProject, type PipelineStageId } from "@/lib/video-factory"
import { createVoiceDirectorSession, type VoiceDirectorSession, type NarratedScene } from "@/lib/voice-video"

// ─── 新建作品面板 ──────────────────────────
function CreateProjectPanel() {
  const [oneLiner, setOneLiner] = useState("")
  const [genre, setGenre] = useState<VideoProject["genre"]>("short_drama")
  const [style, setStyle] = useState("写实风格")
  const [duration, setDuration] = useState(60)
  const [aspectRatio, setAspectRatio] = useState("9:16")
  const [activeId, setActiveId] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [project, setProject] = useState<VideoProject | null>(null)

  const GENRE_OPTIONS = [
    { id: "short_drama", label: "短剧", icon: "🎭" },
    { id: "comic", label: "漫剧", icon: "📚" },
    { id: "tutorial", label: "知识讲解", icon: "📖" },
    { id: "ad", label: "产品广告", icon: "📢" },
    { id: "storytelling", label: "故事叙述", icon: "📖" },
  ]
  const STYLE_OPTIONS = ["写实风格", "日系动漫", "国风水墨", "赛博朋克", "皮克斯3D", "油画风格"]
  const ASPECT_OPTIONS = ["9:16", "16:9", "1:1"]

  const handleCreate = useCallback(() => {
    if (!oneLiner.trim()) return
    const p = createProject(oneLiner.trim(), genre, style, duration, aspectRatio)
    setProject(p)
    setActiveId(p.id)
    setOneLiner("")
  }, [oneLiner, genre, style, duration, aspectRatio])

  const handleRunStage = useCallback(async (stageId: PipelineStageId) => {
    if (!activeId || running) return
    setRunning(true)
    await executeStage(activeId, stageId)
    const projects = loadProjects()
    setProject(projects.find(p => p.id === activeId) || null)
    setRunning(false)
  }, [activeId, running])

  return (
    <div className="space-y-4">
      {/* 参数表单 */}
      <div className="glass rounded-2xl p-5 space-y-4">
        <textarea value={oneLiner} onChange={e => setOneLiner(e.target.value)}
          placeholder="输入一句话创意，例如：一个少年发现自己的猫会说话，从此开始了奇幻冒险"
          rows={2} className="w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-white/80 placeholder-white/20 text-sm" />
        <div className="grid grid-cols-4 gap-2">
          {GENRE_OPTIONS.map(g => (
            <button key={g.id} onClick={() => setGenre(g.id as any)}
              className={`px-3 py-2 rounded-xl text-xs border transition-all ${genre === g.id ? "bg-teal-500/15 border-teal-500/25 text-teal-300" : "border-white/[0.06] text-white/40 hover:border-white/20"}`}>{g.icon} {g.label}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <select value={style} onChange={e => setStyle(e.target.value)}
            className="flex-1 rounded-xl border-white/[0.06] bg-white/[0.03] text-white/60 text-xs py-2">
            {STYLE_OPTIONS.map(s => <option key={s}>{s}</option>)}
          </select>
          <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))}
            className="w-20 rounded-xl border-white/[0.06] bg-white/[0.03] text-white/60 text-xs py-2 text-center" placeholder="秒" />
          <div className="flex gap-1">
            {ASPECT_OPTIONS.map(a => (
              <button key={a} onClick={() => setAspectRatio(a)}
                className={`px-2 py-1.5 rounded-lg text-xs border transition-all ${aspectRatio === a ? "bg-teal-500/15 border-teal-500/25 text-teal-300" : "border-white/[0.06] text-white/40 hover:border-white/20"}`}>{a}</button>
            ))}
          </div>
        </div>
        <button onClick={handleCreate} disabled={!oneLiner.trim()}
          className="w-full py-2.5 btn-primary rounded-xl text-sm font-semibold">🚀 创建作品</button>
      </div>

      {/* 6阶段流水线 */}
      {project && (
        <div className="glass rounded-2xl p-5 space-y-3">
          <div className="text-xs text-white/40 font-medium mb-2">📋 创作流水线 · {project.oneLiner.slice(0, 30)}</div>
          {PIPELINE_STAGES.map((stage, i) => {
            const ps = project.stages.find(s => s.stageId === stage.id)
            const done = ps?.status === "done"
            const failed = ps?.status === "failed"
            const isActive = activeId !== null
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
                  <div className="flex items-center gap-2">
                    {done ? <span className="text-[10px] text-teal-400">✅ 完成</span> : failed ? <span className="text-[10px] text-red-400">失败</span> : (
                      <button onClick={() => handleRunStage(stage.id)} disabled={running || !isActive}
                        className="px-3 py-1 text-[10px] rounded-lg bg-white/[0.04] text-white/40 hover:text-white/60 border border-white/[0.06] disabled:opacity-20">运行</button>
                    )}
                  </div>
                </div>
                {ps?.output && done && (
                  <pre className="text-[10px] text-white/30 mt-2 line-clamp-2">{ps.output.slice(0, 200)}</pre>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── 口述成片面板 ──────────────────────────
function VoicePanel() {
  const [session, setSession] = useState<VoiceDirectorSession | null>(null)
  const [narrative, setNarrative] = useState("")
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedScene, setSelectedScene] = useState<NarratedScene | null>(null)
  const recognitionRef = useRef<any>(null)
  const lastResultIdx = useRef(0)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    const r = new SR(); r.lang = "zh-CN"; r.interimResults = true; r.continuous = true
    r.onresult = (e: any) => {
      let t = ""
      for (let i = lastResultIdx.current; i < e.results.length; i++) {
        t += e.results[i][0].transcript
        if (e.results[i].isFinal) lastResultIdx.current = i + 1
      }
      if (t) setNarrative(p => p + t)
    }
    r.onend = () => { setListening(false); lastResultIdx.current = 0 }
    recognitionRef.current = r
    return () => { try { recognitionRef.current?.abort() } catch {} }
  }, [])

  const toggleVoice = useCallback(async () => {
    if (!recognitionRef.current) return
    if (listening) { recognitionRef.current.stop(); setListening(false); return }
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true })
      recognitionRef.current.start()
      setListening(true)
    } catch { alert("需要麦克风权限") }
  }, [listening])

  const handleGenerate = useCallback(async () => {
    if (!narrative.trim() || loading) return
    setLoading(true)
    try { setSession(await createVoiceDirectorSession(narrative.trim())) } catch {}
    setLoading(false)
  }, [narrative, loading])

  return (
    <div className="space-y-4">
      {/* 口述输入 */}
      <div className="glass rounded-2xl p-5 text-center space-y-4">
        <div className="text-4xl">🎙️</div>
        <h3 className="text-base font-semibold text-white/80">口述成片</h3>
        <p className="text-xs text-white/30">对着麦克风讲故事，AI实时拆解分镜头</p>
        <button onClick={toggleVoice}
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all ${
            listening ? "bg-red-500/20 text-red-300 border border-red-500/30 animate-pulse" : "bg-white/[0.04] text-white/60 border border-white/[0.08] hover:bg-white/[0.06]"}`}>
          <span className={`w-3 h-3 rounded-full ${listening ? "bg-red-400" : "bg-white/20"}`} />
          {listening ? "🔴 录音中，点击停止" : "🎤 开始口述"}
        </button>
        <textarea value={narrative} onChange={e => setNarrative(e.target.value)}
          placeholder="一个少年站在废墟上，远处是燃烧的城市……"
          rows={4} className="w-full rounded-xl border-white/[0.06] bg-white/[0.03] text-white/70 placeholder-white/20 text-sm mt-2" />
        <div className="flex gap-2 justify-center">
          <button onClick={handleGenerate} disabled={!narrative.trim() || loading}
            className="px-5 py-2 rounded-xl text-xs font-medium text-white bg-teal-500/20 border border-teal-500/20 hover:bg-teal-500/30 disabled:opacity-30">🧠 生成分镜</button>
          <button onClick={() => { setNarrative(""); setSession(null) }}
            className="px-4 py-2 rounded-xl text-xs text-white/30 border border-white/[0.06] hover:text-white/50">清空</button>
        </div>
      </div>

      {/* 分镜结果 */}
      {session && (
        <div className="glass rounded-2xl p-5 space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: "🧠", label: "叙事结构", value: session.narrativeArc.structure },
              { icon: "🎨", label: "视觉风格", value: session.thinkingOverlay.visualStyle },
              { icon: "🎵", label: "音乐", value: session.thinkingOverlay.musicStyle },
            ].map(c => (
              <div key={c.label} className="bg-white/[0.03] rounded-xl p-3 text-center">
                <div className="text-xs text-white/30">{c.icon} {c.label}</div>
                <div className="text-sm font-bold text-white/70 mt-0.5">{c.value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {session.scenes.map((s, i) => (
              <div key={s.id} onClick={() => setSelectedScene(selectedScene?.id === s.id ? null : s)}
                className={`rounded-xl border p-3 cursor-pointer transition-all ${selectedScene?.id === s.id ? "bg-teal-500/10 border-teal-500/20" : "bg-white/[0.02] border-white/[0.06] hover:border-white/20"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-lg bg-teal-500/20 text-teal-300 text-[10px] flex items-center justify-center font-bold">{i + 1}</span>
                  <span className="text-xs text-white/50">≈{s.timestamp}s</span>
                </div>
                <p className="text-[10px] text-white/40 line-clamp-2">{s.sceneDescription}</p>
              </div>
            ))}
          </div>
          <button onClick={() => {
            const p = createProject(narrative.slice(0, 50), "storytelling", session.thinkingOverlay.visualStyle || "写实风格", session.scenes.length * 5, "16:9")
            alert(`已创建作品「${p.oneLiner}」，请在「我的作品」中继续`)
          }}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400">🎬 发送到即影生成</button>
        </div>
      )}
    </div>
  )
}

// ─── 主页面 ──────────────────────────────
export default function MangaPage() {
  const [mode, setMode] = useState<"create" | "voice">("create")

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-lg shadow-lg shadow-teal-500/15">📚</div>
        <div>
          <h1 className="text-xl font-bold text-white/90">漫剧一键生成</h1>
          <p className="text-sm text-white/30 mt-0.5">一句话创意 → 6阶段流水线 · 口述故事 → AI拆解分镜</p>
        </div>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 w-fit">
        <button onClick={() => setMode("create")}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${mode === "create" ? "bg-white/[0.06] text-white" : "text-white/40 hover:text-white/60"}`}>🎬 新建作品</button>
        <button onClick={() => setMode("voice")}
          className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${mode === "voice" ? "bg-white/[0.06] text-white" : "text-white/40 hover:text-white/60"}`}>🎙️ 口述成片</button>
      </div>

      {mode === "create" ? <CreateProjectPanel /> : <VoicePanel />}
    </div>
  )
}
