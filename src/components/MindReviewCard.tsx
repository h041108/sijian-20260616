"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { loadCognitionLogs, generateThinkingMirror, stateLabel } from "@/lib/cognition"
import type { ThinkingMirror } from "@/lib/cognition"
import { getCurrentUser } from "@/lib/sijian-user"

interface Props {
  sessionId?: string
  onClose?: () => void
}

const RADAR_COLORS = ["#6366F1","#EC4899","#F59E0B","#22C55E","#3B82F6","#8B5CF6"]

export default function MindReviewCard({ sessionId, onClose }: Props) {
  const [mirror, setMirror] = useState<ThinkingMirror | null>(null)
  const [sessionStats, setSessionStats] = useState<any>(null)
  const [view, setView] = useState<"session" | "fingerprint">("session")
  const [copied, setCopied] = useState(false)

  const user = typeof window !== "undefined" ? getCurrentUser() : null
  const userId = user?.id || "anonymous"
  const nickname = user?.nickname || "用户"

  useEffect(() => {
    const m = generateThinkingMirror(userId, nickname)
    setMirror(m)

    // Session stats from logs
    const logs = loadCognitionLogs().filter(l => sessionId ? l.sessionId === sessionId : true).slice(-20)
    if (logs.length > 0) {
      const states = new Map<string, number>()
      const intents = new Map<string, number>()
      const emotions = new Map<string, number>()
      let totalLoad = 0
      let stuckCount = 0, recoverCount = 0

      for (let i = 0; i < logs.length; i++) {
        const log = logs[i]
        states.set(log.state, (states.get(log.state) || 0) + 1)
        intents.set(log.intent, (intents.get(log.intent) || 0) + 1)
        emotions.set(log.emotion, (emotions.get(log.emotion) || 0) + 1)
        totalLoad += log.cognitiveLoad
        if (log.state === "stuck") stuckCount++
        if (i > 0 && logs[i-1].state === "stuck" && log.state !== "stuck") recoverCount++
      }

      setSessionStats({
        messages: logs.length,
        dominantState: Array.from(states.entries()).sort((a,b) => b[1]-a[1])[0],
        dominantIntent: Array.from(intents.entries()).sort((a,b) => b[1]-a[1])[0],
        dominantEmotion: Array.from(emotions.entries()).sort((a,b) => b[1]-a[1])[0],
        avgCognitiveLoad: totalLoad / logs.length,
        uniqueStates: states.size,
        uniqueIntents: intents.size,
        resilience: stuckCount > 0 ? recoverCount / stuckCount : 1,
      })
    }
  }, [userId, nickname, sessionId])

  const handleCopyCard = () => {
    if (!mirror || !sessionStats) return
    const text = [
      `🧠 我的思维回顾`,
      ``,
      `思维深度: ${Math.round(mirror.thinkingDepth * 100)}分`,
      `思维广度: ${Math.round(mirror.thinkingBreadth * 100)}分`,
      `思维韧性: ${Math.round(mirror.resilience * 100)}分`,
      `主导风格: ${mirror.dominantStyles[0]?.style || "探索中"}`,
      ``,
      `—— 由 思见 生成`,
    ].join("\n")
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!mirror) return null

  const isNewUser = mirror.totalMessages < 3

  return (
    <div className="space-y-4">
      {/* 模式切换 */}
      <div className="flex items-center gap-2">
        <button onClick={() => setView("session")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === "session" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
          🧠 本次回顾
        </button>
        <button onClick={() => setView("fingerprint")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${view === "fingerprint" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500"}`}>
          {mirror.totalMessages >= 20 ? "🌟 思维指纹" : "🔒 思维指纹"}
        </button>
      </div>

      {/* ════════════════════════════════════════
          本次回顾
          ════════════════════════════════════════ */}
      {view === "session" && sessionStats && (
        <div className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-100 p-6">
          {isNewUser ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4 opacity-20">🧠</div>
              <p className="text-sm text-gray-600 font-medium">刚开始记录你的思维</p>
              <p className="text-xs text-gray-400 mt-1">多聊几句后，这里会生成你的专属思维回顾</p>
            </div>
          ) : (
            <div>
              {/* 标题 */}
              <div className="text-center mb-5">
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {sessionStats.dominantState ? stateLabel(sessionStats.dominantState[0] as any) : "思考"}模式
                </div>
                <p className="text-xs text-gray-500">本次对话思维回顾</p>
              </div>

              {/* 四格核心数据 */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { icon: "🧠", label: "思维状态", value: `${sessionStats.uniqueStates}种`, sub: sessionStats.dominantState ? stateLabel(sessionStats.dominantState[0] as any) : "" },
                  { icon: "🎯", label: "核心意图", value: sessionStats.dominantIntent ? intentLabel(sessionStats.dominantIntent[0]) : "探索", sub: intentLabel(sessionStats.dominantIntent?.[0] || "exploring") },
                  { icon: "💭", label: "认知负荷", value: sessionStats.avgCognitiveLoad > 0.6 ? "较高" : sessionStats.avgCognitiveLoad > 0.3 ? "适中" : "轻松", sub: `${Math.round(sessionStats.avgCognitiveLoad * 100)}%` },
                  { icon: "🔄", label: "思维韧性", value: sessionStats.resilience >= 0.7 ? "强韧" : sessionStats.resilience >= 0.4 ? "中等" : "待提升", sub: sessionStats.stuckCount > 0 ? `${sessionStats.stuckCount}次卡住后突破` : "" },
                ].map((c, i) => (
                  <div key={i} className="bg-white/80 rounded-xl p-3 text-center">
                    <div className="text-lg">{c.icon}</div>
                    <div className="text-xs font-bold text-gray-700 mt-0.5">{c.value}</div>
                    <div className="text-[10px] text-gray-400">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* 迷你思考流 */}
              <div className="flex items-center gap-1 h-6 mb-3">
                {sessionStats && Array.from({ length: 10 }).map((_, i) => (
                  <div key={i}
                    className="flex-1 rounded-full h-full"
                    style={{
                      backgroundColor: RADAR_COLORS[i % RADAR_COLORS.length],
                      opacity: 0.3 + (i / 10) * 0.7,
                    }} />
                ))}
              </div>

              {/* 底部分享 */}
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400">{mirror.totalMessages} 条思考 · {mirror.totalSessions} 次会话</span>
                <button onClick={handleCopyCard}
                  className="flex items-center gap-1 text-indigo-500 hover:text-indigo-700 bg-white/80 px-3 py-1 rounded-full border border-indigo-200">
                  {copied ? "✅ 已复制" : "📋 复制分享"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════
          思维指纹
          ════════════════════════════════════════ */}
      {view === "fingerprint" && (
        mirror.totalMessages >= 20 ? (
          <div className="bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 rounded-2xl border border-slate-200 p-6">
            <div className="text-center mb-5">
              <div className="text-3xl mb-1">🧬</div>
              <h3 className="text-lg font-bold text-gray-800">你的思维指纹</h3>
              <p className="text-xs text-gray-400">{mirror.totalMessages} 条思考数据积累</p>
            </div>

            {/* 四维雷达 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: "思维深度", value: mirror.thinkingDepth, color: "#6366F1", desc: depthDesc(mirror.thinkingDepth) },
                { label: "思维广度", value: mirror.thinkingBreadth, color: "#22C55E", desc: breadthDesc(mirror.thinkingBreadth) },
                { label: "思维韧性", value: mirror.resilience, color: "#F59E0B", desc: resilienceDesc(mirror.resilience) },
                { label: "增长速率", value: Math.min(1, mirror.growthRate / 3), color: "#EC4899", desc: growthDesc(mirror.growthRate) },
              ].map(d => (
                <div key={d.label} className="bg-white/80 rounded-xl p-3">
                  <div className="text-[10px] text-gray-400 mb-1">{d.label}</div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 rounded-full bg-gray-100">
                      <div className="h-full rounded-full" style={{ width: `${d.value * 100}%`, backgroundColor: d.color }} />
                    </div>
                    <span className="text-xs font-bold" style={{ color: d.color }}>{Math.round(d.value * 100)}</span>
                  </div>
                  <div className="text-[9px] text-gray-500">{d.desc}</div>
                </div>
              ))}
            </div>

            {/* 主导风格 */}
            <div className="mb-4">
              <div className="text-[10px] text-gray-400 mb-1.5">主导思维风格</div>
              <div className="flex flex-wrap gap-1.5">
                {mirror.dominantStyles.slice(0, 5).map((s, i) => (
                  <span key={s.style} className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{ borderColor: RADAR_COLORS[i], color: RADAR_COLORS[i], backgroundColor: RADAR_COLORS[i] + "10" }}>
                    {s.style} · {Math.round(s.percentage)}%
                  </span>
                ))}
              </div>
            </div>

            {/* AI 洞察 */}
            <div className="p-3 bg-white/80 rounded-xl border border-indigo-100">
              <p className="text-[10px] text-indigo-500 font-medium mb-1">🤖 思见洞察</p>
              <p className="text-xs text-gray-700 leading-relaxed">{mirror.aiAdvice}</p>
            </div>

            {/* 活跃时段 */}
            {mirror.cognitivePeakHours.length > 0 && (
              <div className="flex items-center gap-2 mt-3 text-[10px] text-gray-400">
                <span>🕐 思维高峰时段:</span>
                <span className="text-gray-600">{mirror.cognitivePeakHours.join(", ")}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl border border-slate-200 p-8 text-center">
            <div className="text-5xl mb-4 opacity-20">🔒</div>
            <p className="text-sm text-gray-600 font-medium">还需要 {20 - mirror.totalMessages} 条对话</p>
            <p className="text-xs text-gray-400 mt-1">积累足够数据后，思见会为你生成专属思维指纹</p>
            <div className="mt-4 h-2 rounded-full bg-gray-100 max-w-[200px] mx-auto">
              <div className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${Math.min(100, (mirror.totalMessages / 20) * 100)}%` }} />
            </div>
          </div>
        )
      )}
    </div>
  )
}

function intentLabel(i: string): string {
  const m: Record<string, string> = { learning:"学习",solving:"解决",creating:"创造",deciding:"决策",understanding:"理解",venting:"倾诉",exploring:"探索" }
  return m[i] || i
}

function depthDesc(v: number): string { return v >= 0.7 ? "思考深入，善于追问本质" : v >= 0.4 ? "正在建立深度思考习惯" : "建议多追问一层" }
function breadthDesc(v: number): string { return v >= 0.6 ? "视角多元，跨领域联想强" : v >= 0.3 ? "有几个擅长的思维模式" : "可以尝试不同角度" }
function resilienceDesc(v: number): string { return v >= 0.7 ? "卡住后恢复快，不轻易放弃" : v >= 0.4 ? "遇到困难能慢慢找回节奏" : "遇到卡顿可以休息一下再来" }
function growthDesc(v: number): string { return v >= 1 ? "学习速度很快" : v >= 0.3 ? "稳步积累中" : "刚开始积累，继续加油" }
