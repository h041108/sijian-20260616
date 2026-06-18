"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { createVoiceDirectorSession, VoiceDirectorSession, NarratedScene } from "@/lib/voice-video"

export default function VoiceDirectorPanel() {
  const [session, setSession] = useState<VoiceDirectorSession | null>(null)
  const [narrative, setNarrative] = useState("")
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedScene, setSelectedScene] = useState<NarratedScene | null>(null)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SR)
    if (SR) {
      const r = new SR(); r.lang = "zh-CN"; r.interimResults = true; r.continuous = true
      r.onresult = (e: any) => { let t = ""; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript; setNarrative(p => p + t) }
      r.onerror = () => setListening(false); r.onend = () => setListening(false)
      recognitionRef.current = r
    }
  }, [])

  const toggleVoice = useCallback(() => {
    if (!recognitionRef.current) return
    listening ? (recognitionRef.current.stop(), setListening(false)) : (recognitionRef.current.start(), setListening(true))
  }, [listening])

  const handleGenerate = useCallback(async () => {
    if (!narrative.trim() || loading) return; setLoading(true)
    try { setSession(await createVoiceDirectorSession(narrative.trim())) } catch {}
    setLoading(false)
  }, [narrative, loading])

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl border border-indigo-800 p-8 text-center">
        <div className="text-6xl mb-4">🎙️</div>
        <h2 className="text-xl font-bold text-white mb-2">口述成片</h2>
        <p className="text-sm text-indigo-300 mb-6">{voiceSupported ? "对着麦克风讲故事，AI实时拆解分镜头" : "手动输入叙事文本，AI拆解分镜头"}</p>
        <button onClick={toggleVoice} className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-bold transition-all ${voiceSupported ? (listening ? "bg-red-600 animate-pulse text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white") : "bg-gray-600 text-gray-300 cursor-not-allowed"}`}>
          <span className={`w-4 h-4 rounded-full ${voiceSupported && listening ? "bg-red-300" : "bg-indigo-300"}`} />
          {voiceSupported ? (listening ? "🔴 录音中...点击停止" : "🎤 开始口述") : "语音不可用"}
        </button>
        <textarea value={narrative} onChange={e => setNarrative(e.target.value)} placeholder="一个少年站在废墟上，远处是燃烧的城市……" rows={6}
          className="w-full max-w-2xl mx-auto mt-6 rounded-xl border border-indigo-700 bg-indigo-900/30 p-4 text-sm text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
        <div className="flex justify-center gap-3 mt-4">
          <button onClick={handleGenerate} disabled={!narrative.trim() || loading}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 text-sm font-bold disabled:opacity-40">
            {loading ? "⏳ AI分析中..." : "🧠 生成分镜"}
          </button>
          {narrative && <button onClick={() => { setNarrative(""); setSession(null) }} className="rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-3 text-sm">清空</button>}
        </div>
      </div>

      {session && <RenderSession session={session} selectedScene={selectedScene} setSelectedScene={setSelectedScene} />}
    </div>
  )
}

function RenderSession({ session, selectedScene, setSelectedScene }: { session: VoiceDirectorSession; selectedScene: NarratedScene | null; setSelectedScene: (s: NarratedScene | null) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: "🧠", label: "叙事结构", value: session.narrativeArc.structure, sub: session.narrativeArc.paceAdvice, bg: "from-purple-900/80 to-indigo-900/80 border-purple-700", subColor: "purple-400" },
          { icon: "🎨", label: "视觉风格", value: session.thinkingOverlay.visualStyle, sub: session.thinkingOverlay.colorPalette.map(c => c).join(" · "), bg: "from-pink-900/80 to-rose-900/80 border-pink-700", subColor: "pink-400" },
          { icon: "🎵", label: "音乐推荐", value: session.thinkingOverlay.musicStyle, sub: session.thinkingOverlay.aiInsight.slice(0, 60), bg: "from-amber-900/80 to-orange-900/80 border-amber-700", subColor: "amber-400" },
        ].map(c => (
          <div key={c.label} className={`bg-gradient-to-br ${c.bg} rounded-xl border p-5 text-white`}>
            <div className="text-xs opacity-60 mb-2">{c.icon} {c.label}</div>
            <div className="text-lg font-bold">{c.value}</div>
            <div className={`text-xs text-${c.subColor} mt-1`}>{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📈 叙事张力曲线</h3>
        <div className="flex items-end gap-1 h-24 mb-3">
          {session.narrativeArc.tension.map((t, i) => (
            <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(5, t * 100)}%`, background: `hsl(${260 + t * 40}, 70%, ${40 + t * 20}%)`, opacity: 0.5 + t * 0.5 }} />
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-gray-400"><span>开场</span><span>发展</span><span>高潮</span><span>结尾</span></div>
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🎬 分镜脚本 ({session.scenes.length} 场景)</h3>
        <div className="grid grid-cols-2 gap-3">
          {session.scenes.map((s, i) => (
            <div key={s.id} onClick={() => setSelectedScene(selectedScene?.id === s.id ? null : s)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${selectedScene?.id === s.id ? "border-indigo-400 bg-indigo-50 shadow-md" : "border-[#e8e5df] bg-white hover:border-indigo-200"}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center font-bold">{i + 1}</div>
                <div><div className="text-xs font-semibold text-gray-800">场景{i + 1}</div><div className="text-[10px] text-gray-400">≈{s.timestamp}s · {s.score}分</div></div>
              </div>
              <p className="text-xs text-gray-600 mb-2">{s.sceneDescription.slice(0, 80)}</p>
              <div className="flex flex-wrap gap-1">
                {s.visualKeywords.slice(0, 4).map(k => <span key={k} className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">{k}</span>)}
              </div>
              {selectedScene?.id === s.id && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="p-2 bg-orange-50 rounded-lg"><div className="text-[10px] text-orange-500 mb-0.5">📱 即梦</div><pre className="text-[10px] text-gray-700 font-mono whitespace-pre-wrap">{s.promptEJ}</pre></div>
                  <div className="p-2 bg-purple-50 rounded-lg"><div className="text-[10px] text-purple-500 mb-0.5">🎨 MJ</div><pre className="text-[10px] text-gray-700 font-mono whitespace-pre-wrap">{s.promptMJ}</pre></div>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-100">
          <button onClick={() => navigator.clipboard.writeText(session.scenes.map(s => s.promptMJ).join("\n"))} className="text-xs text-gray-500 border px-3 py-1.5 rounded-lg">📋 复制所有MJ提示词</button>
        </div>
      </div>
    </div>
  )
}
