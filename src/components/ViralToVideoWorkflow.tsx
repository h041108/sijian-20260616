"use client"

import { useState, useCallback } from "react"

interface WorkflowStep {
  name: string
  status: "pending" | "running" | "done" | "failed" | "skipped"
  message: string
  result?: any
}

interface WorkflowResult {
  rewrittenText: string
  ttsAudio: string | null
  ttsFormat: string | null
  digitalHumanVideoUrl: string | null
  viralKeywords: string[]
  viralSource: string
}

interface WorkflowResponse {
  success: boolean
  mode: string
  niche: string
  platform: string
  topic: string
  steps: WorkflowStep[]
  results: WorkflowResult
  meta: {
    totalDuration: number
    personaUsed: boolean
    viralTemplateUsed: boolean
    ttsSource: string
  }
}

const PLATFORMS = ["小红书", "抖音", "B站", "快手", "视频号"]
const STEP_ICONS: Record<string, string> = {
  "爆款搜索": "🔍",
  "爆款拆解": "📊",
  "话题生成": "💡",
  "文案改写": "✍️",
  "敏感词过滤": "🛡️",
  "语音合成": "🎙️",
  "数字人视频": "🎭",
}
const STATUS_ICON: Record<string, string> = {
  pending: "⏳",
  running: "⏳",
  done: "✅",
  failed: "❌",
  skipped: "⏭️",
}
const STATUS_COLOR: Record<string, string> = {
  pending: "text-white/30",
  running: "text-yellow-400",
  done: "text-green-400",
  failed: "text-red-400",
  skipped: "text-white/20",
}

export default function ViralToVideoWorkflow() {
  const [niche, setNiche] = useState("美妆")
  const [platform, setPlatform] = useState("小红书")
  const [persona, setPersona] = useState("")
  const [personaTags, setPersonaTags] = useState("")
  const [tone, setTone] = useState("")
  const [portraitImage, setPortraitImage] = useState<string | null>(null)
  const [mode, setMode] = useState<"text-only" | "text-audio" | "full">("text-only")
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<WorkflowResponse | null>(null)
  const [error, setError] = useState("")

  const handlePortrait = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setPortraitImage(reader.result as string)
    reader.readAsDataURL(file)
  }, [])

  const handleRun = useCallback(async () => {
    setRunning(true)
    setError("")
    setResult(null)

    try {
      const body: any = {
        niche,
        platform,
        mode,
      }

      if (persona.trim()) body.persona = persona.trim()
      if (personaTags.trim()) body.personaTags = personaTags.split(/[,，、]/).map((s: string) => s.trim()).filter(Boolean)
      if (tone.trim()) body.tone = tone.trim()
      if (portraitImage && mode === "full") body.portraitImage = portraitImage

      const res = await fetch("/api/workflow/viral-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data: WorkflowResponse = await res.json()
      setResult(data)

      if (!data.success) {
        setError((data as any).error || "工作流执行失败")
      }
    } catch (err: any) {
      setError(err.message || "请求失败")
    } finally {
      setRunning(false)
    }
  }, [niche, platform, persona, personaTags, tone, portraitImage, mode])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* 标题 */}
      <div className="glass rounded-2xl p-6 border border-white/[0.06]">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">🔥</span>
          <h2 className="text-lg font-bold text-[#E8E8F0]">爆款文案 → 视频 全链路工作流</h2>
        </div>
        <p className="text-xs text-[#9898B0]">
          爆款提取 → 人设改写 → 敏感词过滤 → 话题生成 → TTS配音 → 数字人口播
        </p>
      </div>

      {/* 配置区 */}
      <div className="glass rounded-2xl p-5 border border-white/[0.06] space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {/* 赛道 */}
          <div>
            <label className="text-xs text-[#9898B0] mb-1 block">赛道/领域</label>
            <input
              value={niche}
              onChange={e => setNiche(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#E8E8F0] focus:outline-none focus:border-[#F59E0B]/30"
              placeholder="如：美妆、数码、美食"
            />
          </div>

          {/* 平台 */}
          <div>
            <label className="text-xs text-[#9898B0] mb-1 block">发布平台</label>
            <select
              value={platform}
              onChange={e => setPlatform(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#E8E8F0] focus:outline-none focus:border-[#F59E0B]/30"
            >
              {PLATFORMS.map(p => (
                <option key={p} value={p} className="bg-[#1a1a2e]">{p}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 人设 */}
        <div>
          <label className="text-xs text-[#9898B0] mb-1 block">
            👤 创作者人设 <span className="text-white/20">（可选，来自 agent_02 人设建模）</span>
          </label>
          <textarea
            value={persona}
            onChange={e => setPersona(e.target.value)}
            rows={2}
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#E8E8F0] focus:outline-none focus:border-[#F59E0B]/30 resize-none"
            placeholder="如：毒舌美妆博主，说话犀利但不刻薄，粉丝是25-35岁精致女性"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-[#9898B0] mb-1 block">人设标签（逗号分隔）</label>
            <input
              value={personaTags}
              onChange={e => setPersonaTags(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#E8E8F0] focus:outline-none focus:border-[#F59E0B]/30"
              placeholder="毒舌, 专业测评, 真实体验"
            />
          </div>
          <div>
            <label className="text-xs text-[#9898B0] mb-1 block">语气风格</label>
            <input
              value={tone}
              onChange={e => setTone(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-[#E8E8F0] focus:outline-none focus:border-[#F59E0B]/30"
              placeholder="犀利直接, 亲切幽默"
            />
          </div>
        </div>

        {/* 工作流模式 */}
        <div>
          <label className="text-xs text-[#9898B0] mb-1 block">工作流模式</label>
          <div className="flex gap-2">
            {([
              { key: "text-only", label: "📝 仅文案", desc: "生成改写后的文案" },
              { key: "text-audio", label: "🎙️ 文案+配音", desc: "生成文案+TTS音频" },
              { key: "full", label: "🎭 完整视频", desc: "文案+配音+数字人" },
            ] as const).map(m => (
              <button
                key={m.key}
                onClick={() => setMode(m.key)}
                className={`flex-1 rounded-xl p-3 text-xs border transition-all ${
                  mode === m.key
                    ? "border-[#F59E0B]/30 bg-[#F59E0B]/10 text-[#FBBF24]"
                    : "border-white/[0.06] bg-white/[0.02] text-[#9898B0] hover:border-white/15"
                }`}
              >
                <div className="font-medium">{m.label}</div>
                <div className="text-[10px] opacity-60 mt-0.5">{m.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 照片上传（仅full模式） */}
        {mode === "full" && (
          <div>
            <label className="text-xs text-[#9898B0] mb-1 block">📷 数字人照片</label>
            <label className={`block w-full rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${
              portraitImage ? "border-purple-400/30 bg-purple-500/5" : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
            }`}>
              {portraitImage ? (
                <div className="flex items-center gap-3">
                  <img src={portraitImage} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  <span className="text-xs text-purple-300">照片已就绪，点击可更换</span>
                </div>
              ) : (
                <div className="text-[#9898B0] text-xs">📷 点击上传照片（将用于数字人口播）</div>
              )}
              <input type="file" accept="image/*" onChange={handlePortrait} className="hidden" />
            </label>
          </div>
        )}

        {/* 执行按钮 */}
        <button
          onClick={handleRun}
          disabled={running || !niche.trim()}
          className="w-full rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#EA580C] hover:from-[#FBBF24] hover:to-[#F97316] text-white py-3 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {running ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> 工作流执行中...
            </span>
          ) : (
            "🚀 启动全链路工作流"
          )}
        </button>
      </div>

      {/* 错误 */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* 结果 */}
      {result && (
        <div className="space-y-4">
          {/* 步骤进度 */}
          <div className="glass rounded-2xl p-5 border border-white/[0.06]">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs text-white/40">🔄 工作流进度</span>
              <span className="text-[10px] text-white/20">{result.meta.totalDuration}ms</span>
            </div>
            <div className="space-y-2">
              {result.steps.map((step, i) => (
                <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-xl ${
                  step.status === "done" ? "bg-green-500/5" :
                  step.status === "failed" ? "bg-red-500/5" :
                  step.status === "running" ? "bg-yellow-500/5" :
                  "bg-white/[0.02]"
                }`}>
                  <span className="text-sm">{STEP_ICONS[step.name] || "⚙️"}</span>
                  <span className={`text-xs ${STATUS_COLOR[step.status]}`}>{STATUS_ICON[step.status]}</span>
                  <span className="text-xs text-[#E8E8F0]">{step.name}</span>
                  <span className="text-[10px] text-[#5A5A72] ml-auto">{step.message}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 文案结果 */}
          {result.results.rewrittenText && (
            <div className="glass rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-[#FBBF24]">✍️ 生成文案</span>
                <span className="text-[10px] text-white/20">选题: {result.topic}</span>
                {result.meta.personaUsed && <span className="text-[10px] bg-purple-500/10 text-purple-300 px-2 py-0.5 rounded-full">含人设</span>}
                {result.meta.viralTemplateUsed && <span className="text-[10px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-full">含爆款结构</span>}
              </div>
              <div className="bg-white/[0.03] rounded-xl p-4 max-h-80 overflow-y-auto">
                <pre className="text-xs text-[#E8E8F0] whitespace-pre-wrap font-sans leading-relaxed">{result.results.rewrittenText}</pre>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => navigator.clipboard.writeText(result.results.rewrittenText)}
                  className="text-[10px] px-3 py-1 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#9898B0] hover:text-white transition-colors"
                >
                  📋 复制文案
                </button>
                {result.results.viralKeywords.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap">
                    {result.results.viralKeywords.map((kw, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B]/70">#{kw}</span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 音频结果 */}
          {result.results.ttsAudio && (
            <div className="glass rounded-2xl p-5 border border-white/[0.06]">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-green-400">🎙️ TTS 配音</span>
                <span className="text-[10px] text-white/20">{result.meta.ttsSource}</span>
              </div>
              <audio
                controls
                src={`data:audio/${result.results.ttsFormat || "mp3"};base64,${result.results.ttsAudio}`}
                className="w-full h-10"
              />
            </div>
          )}

          {/* 视频结果 */}
          {result.results.digitalHumanVideoUrl && (
            <div className="glass rounded-2xl p-5 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold text-purple-400">🎭 数字人口播视频</span>
              </div>
              <video
                src={result.results.digitalHumanVideoUrl}
                controls
                className="w-full rounded-xl max-h-[500px]"
              />
              <a
                href={result.results.digitalHumanVideoUrl}
                download
                className="inline-block mt-3 text-[10px] px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 transition-colors"
              >
                📥 下载视频
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
