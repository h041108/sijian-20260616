"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  createVoiceDirectorSession, VoiceDirectorSession,
  NarratedScene,
} from "@/lib/voice-video"

export default function VoiceDirectorPanel() {
  const [session, setSession] = useState<VoiceDirectorSession | null>(null)
  const [narrative, setNarrative] = useState("")
  const [listening, setListening] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedScene, setSelectedScene] = useState<NarratedScene | null>(null)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const recognitionRef = useRef<any>(null)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setVoiceSupported(!!SpeechRecognition)
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.lang = "zh-CN"
      rec.interimResults = true
      rec.continuous = true
      rec.onresult = (e: any) => {
        let transcript = ""
        for (let i = e.resultIndex; i < e.results.length; i++) {
          transcript += e.results[i][0].transcript
        }
        setNarrative(prev => prev + transcript)
      }
      rec.onerror = () => setListening(false)
      rec.onend = () => setListening(false)
      recognitionRef.current = rec
    }
  }, [])

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) return
    if (listening) {
      recognitionRef.current.stop()
      setListening(false)
    } else {
      recognitionRef.current.start()
      setListening(true)
    }
  }, [listening])

  const handleGenerate = useCallback(async () => {
    if (!narrative.trim() || loading) return
    setLoading(true)
    const s = await createVoiceDirectorSession(narrative.trim())
    setSession(s)
    setLoading(false)
  }, [narrative, loading])

  const handleClear = () => {
    setNarrative("")
    setSession(null)
    setSelectedScene(null)
  }

  if (!voiceSupported) {
    return (
      <div className="text-center py-20">
        <div className="text-5xl mb-4 opacity-20">🎙️</div>
        <p className="text-gray-500 text-sm">您的浏览器不支持语音识别</p>
        <p className="text-xs text-gray-400 mt-1">请使用 Chrome 或手动输入叙事文本</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ═══ 口述输入区 ═══ */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl border border-indigo-800 p-8 text-center">
        <div className="text-6xl mb-4">🎙️</div>
        <h2 className="text-xl font-bold text-white mb-2">口述成片</h2>
        <p className="text-sm text-indigo-300 mb-6">
          对着麦克风讲故事，AI 实时拆解为分镜头，推荐视觉风格和拍摄方案
        </p>

        {/* 录音按钮 */}
        <button onClick={toggleListening}
          className={`inline-flex items-center gap-3 px-8 py-4 rounded-full text-lg font-bold transition-all ${
            listening
              ? "bg-red-600 text-white animate-pulse shadow-[0_0_40px_rgba(239,68,68,0.4)]"
              : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg"
          }`}>
          <span className={`w-4 h-4 rounded-full ${listening ? "bg-red-300" : "bg-indigo-300"}`} />
          {listening ? "🔴 录音中... 点击停止" : "🎤 开始口述"}
        </button>

        {/* 文本输入（手动模式） */}
        <div className="mt-6">
          <p className="text-xs text-indigo-400 mb-2">或手动输入叙事文本</p>
          <textarea value={narrative} onChange={e => setNarrative(e.target.value)}
            placeholder="一个少年站在废墟上，远处是燃烧的城市...
他低头看了看手中的照片，照片上的笑容和眼前的灰烬形成了刺眼的对比...
..."
            rows={6}
            className="w-full max-w-2xl mx-auto rounded-xl border border-indigo-700 bg-indigo-900/30 p-4 text-sm text-white placeholder-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none" />
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={handleGenerate} disabled={!narrative.trim() || loading}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-6 py-3 text-sm font-bold transition-all disabled:opacity-40">
            {loading ? "⏳ AI 正在分析叙事..." : "🧠 生成分镜"}
          </button>
          {narrative && (
            <button onClick={handleClear}
              className="rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-3 text-sm transition-all">
              清空
            </button>
          )}
        </div>
      </div>

      {/* ═══ 结果展示 ═══ */}
      {session && (
        <div className="space-y-4">
          {/* 思维覆盖层 */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-purple-900/80 to-indigo-900/80 rounded-xl border border-purple-700 p-5 text-white">
              <div className="text-xs text-purple-300 mb-2">🧠 叙事结构</div>
              <div className="text-lg font-bold">{session.narrativeArc.structure}</div>
              <div className="text-xs text-purple-400 mt-1">{session.narrativeArc.paceAdvice}</div>
            </div>
            <div className="bg-gradient-to-br from-pink-900/80 to-rose-900/80 rounded-xl border border-pink-700 p-5 text-white">
              <div className="text-xs text-pink-300 mb-2">🎨 视觉风格</div>
              <div className="text-sm leading-relaxed">{session.thinkingOverlay.visualStyle}</div>
              <div className="flex gap-1.5 mt-2">
                {session.thinkingOverlay.colorPalette.map(c => (
                  <span key={c} className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full">{c}</span>
                ))}
              </div>
            </div>
            <div className="bg-gradient-to-br from-amber-900/80 to-orange-900/80 rounded-xl border border-amber-700 p-5 text-white">
              <div className="text-xs text-amber-300 mb-2">🎵 音乐推荐</div>
              <div className="text-lg font-bold">{session.thinkingOverlay.musicStyle}</div>
              <div className="text-xs text-amber-400 mt-2">{session.thinkingOverlay.aiInsight.slice(0, 60)}</div>
            </div>
          </div>

          {/* 张力曲线 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📈 叙事张力曲线</h3>
            <div className="flex items-end gap-1 h-24 mb-3">
              {session.narrativeArc.tension.map((t, i) => (
                <div key={i} className="flex-1 rounded-t transition-all"
                  style={{
                    height: `${Math.max(5, t * 100)}%`,
                    backgroundColor: `hsl(${260 + t * 40}, 70%, ${40 + t * 20}%)`,
                    opacity: 0.5 + t * 0.5,
                  }}>
                  {session.narrativeArc.peakPosition === i && (
                    <div className="text-[8px] text-center -mt-4 text-amber-600">★高潮</div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <span>开场</span>
              <span>发展</span>
              <span>高潮</span>
              <span>结尾</span>
            </div>
          </div>

          {/* 分镜网格 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">🎬 分镜脚本 ({session.scenes.length} 个场景)</h3>
              <span className="text-xs text-gray-400">点击场景查看详情和提示词</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {session.scenes.map((scene, i) => (
                <div key={scene.id} onClick={() => setSelectedScene(selectedScene?.id === scene.id ? null : scene)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedScene?.id === scene.id
                      ? "border-indigo-400 bg-indigo-50/50 shadow-md"
                      : "border-[#e8e5df] bg-white hover:border-indigo-200"
                  }`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center text-base font-bold">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">场景 {i + 1}</div>
                      <div className="text-[10px] text-gray-400">≈ {scene.timestamp}秒 · 评分 {scene.score}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mb-2 leading-relaxed">{scene.sceneDescription.slice(0, 80)}</p>
                  <div className="flex flex-wrap gap-1">
                    {scene.visualKeywords.slice(0, 4).map(kw => (
                      <span key={kw} className="text-[9px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded-full">{kw}</span>
                    ))}
                    {scene.moodKeywords.slice(0, 2).map(m => (
                      <span key={m} className="text-[9px] bg-pink-50 text-pink-600 px-1.5 py-0.5 rounded-full">{m}</span>
                    ))}
                  </div>

                  {/* 展开详情 */}
                  {selectedScene?.id === scene.id && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-2 animate-fade-in">
                      <div className="p-2 bg-orange-50 rounded-lg">
                        <div className="text-[10px] text-orange-500 font-medium mb-0.5">📱 即梦提示词</div>
                        <pre className="text-[10px] text-gray-700 font-mono whitespace-pre-wrap">{scene.promptEJ}</pre>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg">
                        <div className="text-[10px] text-purple-500 font-medium mb-0.5">🎨 Midjourney 提示词</div>
                        <pre className="text-[10px] text-gray-700 font-mono whitespace-pre-wrap">{scene.promptMJ}</pre>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-gray-400">
                        <span>镜头: {scene.cameraKeywords.join(" · ")}</span>
                        <button onClick={() => navigator.clipboard.writeText(scene.promptMJ)}
                          className="ml-auto text-indigo-500 hover:text-indigo-700">复制 MJ 提示词</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 底部操作 */}
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => {
                const text = session.scenes.map(s => s.promptMJ).join("\n")
                navigator.clipboard.writeText(text)
              }} className="text-xs text-gray-500 hover:text-gray-800 border px-3 py-1.5 rounded-lg">
                📋 复制所有 MJ 提示词
              </button>
              <button onClick={() => {
                const text = session.scenes.map((s, i) => `镜头${i+1}(${s.timestamp}s): ${s.narrative} → ${s.sceneDescription}`).join("\n")
                navigator.clipboard.writeText(text)
              }} className="text-xs text-gray-500 hover:text-gray-800 border px-3 py-1.5 rounded-lg">
                📋 复制分镜脚本
              </button>
              <div className="flex-1" />
              <span className="text-[10px] text-gray-400">{session.title} · {new Date(session.generatedAt).toLocaleTimeString("zh")}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
