"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  stateLabel, loadCognitionLogs, generateThinkingMirror,
  type CognitionLogEntry, type ThinkingMirror,
  type ThinkingState, type CognitiveIntent, type EmotionState,
} from "@/lib/cognition"

const intentLabel = (i: string) => ({ learning:"学习",solving:"解决",creating:"创造",deciding:"决策",understanding:"理解",venting:"倾诉",exploring:"探索" }[i] || i)
const emotionLabel = (e: string) => ({ neutral:"平静",curious:"好奇",excited:"兴奋",frustrated:"受挫",anxious:"焦虑",tired:"疲倦",confident:"自信",confused:"困惑" }[e] || e)
import { getCurrentUser } from "@/lib/sijian-user"

const STATE_COLORS: Record<string, string> = {
  exploring: "#6366F1", focusing: "#22C55E", stuck: "#EF4444", curious: "#F59E0B",
  building: "#8B5CF6", questioning: "#EC4899", resting: "#6B7280",
}
const EMOTION_COLORS: Record<string, string> = {
  neutral: "#9CA3AF", curious: "#F59E0B", excited: "#22C55E", frustrated: "#EF4444",
  anxious: "#F97316", tired: "#6B7280", confident: "#3B82F6", confused: "#8B5CF6",
}

export default function CognitionPanel() {
  const [logs, setLogs] = useState<CognitionLogEntry[]>([])
  const [mirror, setMirror] = useState<ThinkingMirror | null>(null)
  const [collapsed, setCollapsed] = useState(true)

  const user = typeof window !== "undefined" ? getCurrentUser() : null
  const userId = user?.id || "anonymous"

  const refresh = useCallback(() => {
    const all = loadCognitionLogs()
    setLogs(all)
    setMirror(generateThinkingMirror(userId, user?.nickname || "用户"))
  }, [userId, user])

  useEffect(() => { refresh() }, [refresh])

  const recent = logs.slice(-10).reverse()

  // Aggregate for sparkline-like display
  const recentStates = recent.map(l => l.state)
  const recentEmotions = recent.map(l => l.emotion)
  const avgCognitiveLoad = recent.length > 0 ? recent.reduce((s, l) => s + l.cognitiveLoad, 0) / recent.length : 0

  if (collapsed) {
    return (
      <button onClick={() => setCollapsed(false)}
        className="fixed bottom-4 right-4 z-40 bg-white rounded-2xl shadow-lg border border-[#e8e5df] px-4 py-2.5 flex items-center gap-2 text-sm hover:shadow-xl transition-all">
        <span>🧠</span>
        <span className="font-medium text-gray-700">意识面板</span>
        {mirror && (
          <span className="text-xs text-gray-400">
            {mirror.totalMessages}条记录
          </span>
        )}
      </button>
    )
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[380px] bg-white border-l border-[#e8e5df] shadow-2xl overflow-y-auto">
      {/* 关闭按钮 */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-[#e8e5df] px-5 py-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-800">🧠 意识面板</h3>
        <button onClick={() => setCollapsed(true)}
          className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
      </div>

      <div className="p-5 space-y-5">
        {/* ═══ L1: 实时思维状态 ═══ */}
        <section>
          <h4 className="text-[11px] text-gray-400 font-medium mb-3 uppercase tracking-wider">L1 · 思维状态</h4>
          {recent.length > 0 ? (
            <div className="space-y-2">
              {/* 最新状态 */}
              <div className="flex items-center gap-3 p-3 rounded-xl border-2"
                style={{ borderColor: STATE_COLORS[recentStates[0]] || "#6B7280", background: (STATE_COLORS[recentStates[0]] || "#6B7280") + "08" }}>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATE_COLORS[recentStates[0]] || "#6B7280" }} />
                <div>
                  <span className="text-sm font-bold text-gray-800">{stateLabel(recentStates[0] as ThinkingState)}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{intentLabel(recent[0].intent as CognitiveIntent)}</span>
                </div>
                {avgCognitiveLoad > 0.6 && (
                  <span className="ml-auto text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full">高负荷</span>
                )}
              </div>
              {/* 状态时间线 */}
              <div className="flex items-end gap-1 h-12">
                {recentStates.map((s, i) => (
                  <div key={i}
                    className="flex-1 rounded-t transition-all"
                    style={{
                      backgroundColor: STATE_COLORS[s] || "#6B7280",
                      height: `${20 + (recent.length - i) / recent.length * 28}px`,
                      opacity: 0.4 + (i / recent.length) * 0.6,
                    }}
                    title={stateLabel(s as ThinkingState)} />
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">开始对话后自动记录</p>
          )}
        </section>

        {/* ═══ L2: 认知意图 ═══ */}
        <section>
          <h4 className="text-[11px] text-gray-400 font-medium mb-3 uppercase tracking-wider">L2 · 认知意图</h4>
          {mirror && mirror.intentHistory.length > 0 ? (
            <div className="space-y-2">
              {mirror.intentHistory.sort((a, b) => b.count - a.count).slice(0, 5).map(item => {
                const pct = mirror.totalMessages > 0 ? Math.round((item.count / mirror.totalMessages) * 100) : 0
                return (
                  <div key={item.intent} className="flex items-center gap-2 text-xs">
                    <span className="w-14 text-gray-500">{intentLabel(item.intent)}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100">
                      <div className="h-full bg-indigo-400 rounded-full" style={{ width: `${Math.max(pct, 5)}%` }} />
                    </div>
                    <span className="text-gray-400 w-8 text-right">{pct}%</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-400">对话次数越多越精准</p>
          )}
        </section>

        {/* ═══ L3: 情绪 + 认知负荷 ═══ */}
        <section>
          <h4 className="text-[11px] text-gray-400 font-medium mb-3 uppercase tracking-wider">L3 · 情绪感知</h4>
          {recent.length > 0 ? (
            <div className="space-y-3">
              {/* 情绪条 */}
              <div className="flex items-center gap-1.5 h-8">
                {recentEmotions.map((e, i) => (
                  <div key={i}
                    className="flex-1 rounded-full transition-all"
                    style={{ backgroundColor: EMOTION_COLORS[e] || "#9CA3AF", opacity: 0.5 + (i / recentEmotions.length) * 0.5 }}
                    title={emotionLabel(e as EmotionState)} />
                ))}
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>{recent.length}轮前</span>
                <span>现在</span>
              </div>

              {/* 认知负荷仪表盘 */}
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">认知负荷</span>
                <div className="flex-1 h-3 rounded-full bg-gray-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${avgCognitiveLoad > 0.7 ? "bg-red-500" : avgCognitiveLoad > 0.4 ? "bg-yellow-500" : "bg-green-500"}`}
                    style={{ width: `${avgCognitiveLoad * 100}%` }} />
                </div>
                <span className="text-xs font-bold text-gray-700">{Math.round(avgCognitiveLoad * 100)}%</span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">暂无数据</p>
          )}
        </section>

        {/* ═══ L4: 思维镜像 ═══ */}
        <section>
          <h4 className="text-[11px] text-gray-400 font-medium mb-3 uppercase tracking-wider">L4 · 思维镜像</h4>
          {mirror && mirror.totalMessages > 0 ? (
            <div className="space-y-3">
              {/* 四维雷达 */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "思维深度", value: mirror.thinkingDepth, color: "#6366F1" },
                  { label: "思维广度", value: mirror.thinkingBreadth, color: "#22C55E" },
                  { label: "思维韧性", value: mirror.resilience, color: "#F59E0B" },
                  { label: "增长速度", value: Math.min(1, mirror.growthRate / 3), color: "#EC4899" },
                ].map(d => (
                  <div key={d.label} className="p-2.5 bg-gray-50 rounded-xl">
                    <div className="text-[10px] text-gray-400 mb-1">{d.label}</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-gray-200">
                        <div className="h-full rounded-full" style={{ width: `${d.value * 100}%`, backgroundColor: d.color }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: d.color }}>{Math.round(d.value * 100)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 主导风格 */}
              {mirror.dominantStyles.length > 0 && (
                <div>
                  <div className="text-[10px] text-gray-400 mb-1.5">主导思维风格</div>
                  <div className="flex flex-wrap gap-1">
                    {mirror.dominantStyles.slice(0, 3).map(s => (
                      <span key={s.style} className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                        {s.style}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI 建议 */}
              <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
                <p className="text-[10px] text-indigo-500 font-medium mb-1">🤖 AI 洞察</p>
                <p className="text-xs text-gray-700 leading-relaxed">{mirror.aiAdvice}</p>
              </div>

              {/* 统计 */}
              <div className="flex items-center gap-4 text-[10px] text-gray-400">
                <span>{mirror.totalMessages} 条思考</span>
                <span>{mirror.totalSessions} 次会话</span>
                {mirror.cognitivePeakHours.length > 0 && (
                  <span>高峰 {mirror.cognitivePeakHours[0]}</span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">需要至少20条对话记录</p>
          )}
        </section>
      </div>
    </div>
  )
}
