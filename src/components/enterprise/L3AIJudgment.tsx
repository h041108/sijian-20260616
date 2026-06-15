"use client"

import { useState, useMemo, useCallback } from "react"
import {
  JudgmentChallenge, JudgmentAttempt, getJudgmentChallenges,
  saveL3Attempt, loadL3Attempts,
} from "@/lib/enterprise-ai-capability"

const TYPE_COLORS: Record<string, string> = {
  "事实准确性": "bg-blue-100 text-blue-700", "逻辑推理": "bg-purple-100 text-purple-700",
  "偏见检测": "bg-orange-100 text-orange-700", "时效性": "bg-green-100 text-green-700",
  "数据来源": "bg-teal-100 text-teal-700", "魔鬼代言人": "bg-red-100 text-red-700",
}

export default function L3AIJudgment() {
  const [challenges] = useState<JudgmentChallenge[]>(() => getJudgmentChallenges())
  const [attempts, setAttempts] = useState<JudgmentAttempt[]>(() => loadL3Attempts())
  const [activeId, setActiveId] = useState<string | null>(null)
  const [revealPhase, setRevealPhase] = useState<"reading" | "finding" | "revealed" | "reflecting">("reading")
  const [foundErrors, setFoundErrors] = useState<Set<string>>(new Set())
  const [confidence, setConfidence] = useState(3)
  const [userReflections, setUserReflections] = useState<string[]>([])
  const [startTime, setStartTime] = useState(0)

  const active = activeId ? challenges.find(c => c.id === activeId) : null

  const stats = useMemo(() => {
    const done = new Set(attempts.filter(a => a.passed).map(a => a.challengeId))
    const total = attempts.length
    const totalCorrect = attempts.reduce((s, a) => s + a.errorsFound, 0)
    const totalErrors = attempts.reduce((s, a) => s + a.totalErrors, 0)
    return {
      completed: done.size, total: challenges.length,
      avgDetection: totalErrors > 0 ? totalCorrect / totalErrors : 0,
      totalAttempts: total,
    }
  }, [attempts, challenges])

  const handleStart = useCallback((cid: string) => {
    setActiveId(cid)
    setRevealPhase("reading")
    setFoundErrors(new Set())
    setConfidence(3)
    setUserReflections([])
    setStartTime(Date.now())
  }, [])

  const handleToggleError = useCallback((desc: string) => {
    setFoundErrors(prev => {
      const next = new Set(prev)
      if (next.has(desc)) next.delete(desc)
      else next.add(desc)
      return next
    })
  }, [])

  const handleReveal = useCallback(() => {
    if (!active) return
    const correctErrors = active.hiddenErrors.map(e => e.description)
    const hit = correctErrors.filter(e => foundErrors.has(e)).length
    const total = correctErrors.length
    const attempt: JudgmentAttempt = {
      id: `l3_${Date.now()}`,
      challengeId: active.id,
      employeeId: "current",
      errorsFound: hit,
      totalErrors: total,
      confidence: confidence / 5,
      timeSpent: Math.floor((Date.now() - startTime) / 1000),
      passed: hit >= Math.ceil(total * 0.5),
      timestamp: new Date().toISOString(),
    }
    saveL3Attempt(attempt)
    setAttempts(prev => [...prev, attempt])
    setRevealPhase("revealed")
  }, [active, foundErrors, confidence, startTime])

  return (
    <div className="space-y-6">
      {/* ── 统计 ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.completed}/{stats.total}</div>
          <div className="text-xs text-green-500 mt-1">挑战通过</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{(stats.avgDetection * 100).toFixed(0)}%</div>
          <div className="text-xs text-purple-500 mt-1">错误发现率</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{stats.totalAttempts}</div>
          <div className="text-xs text-blue-500 mt-1">总挑战</div>
        </div>
      </div>

      {/* ── 挑战面板 ── */}
      {active ? (
        <div className="bg-white rounded-2xl border-2 border-indigo-300 p-6">
          <button onClick={() => { setActiveId(null); setRevealPhase("reading") }}
            className="text-xs text-gray-400 hover:text-gray-600 mb-3">← 返回挑战列表</button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">{active.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${TYPE_COLORS[active.type] || "bg-gray-100"}`}>{active.type}</span>
                <span className="text-xs text-gray-400">{active.difficulty}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              {revealPhase === "reading" && <span className="text-blue-500">📖 阅读中</span>}
              {revealPhase === "finding" && <span className="text-orange-500">🔍 找错误中</span>}
              {revealPhase === "revealed" && <span className="text-green-500">✅ 已揭示</span>}
              {revealPhase === "reflecting" && <span className="text-purple-500">🤔 反思中</span>}
            </div>
          </div>

          {/* 场景 */}
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 mb-4">
            <p className="text-xs text-indigo-600 font-medium mb-1">🎭 场景</p>
            <p className="text-sm text-gray-700">{active.scenario}</p>
          </div>

          {/* AI输出 */}
          <div className="p-5 bg-gray-50 rounded-xl border border-gray-200 mb-4">
            <p className="text-xs text-gray-400 font-medium mb-2">🤖 AI 输出（仔细阅读，找出隐藏的错误）</p>
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-mono bg-white p-4 rounded-lg border border-gray-100">
              {active.aiOutput}
            </div>
          </div>

          {/* 阶段1: 阅读 → 进入找错 */}
          {revealPhase === "reading" && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-4">仔细阅读上面的 AI 输出，准备好后点击下方按钮开始找错</p>
              <button onClick={() => setRevealPhase("finding")}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 text-sm font-medium transition-all">
                我准备好了，开始找错误
              </button>
            </div>
          )}

          {/* 阶段2: 找错误 */}
          {revealPhase === "finding" && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">🔍 这段AI输出中有哪些错误？点击你认为有问题的描述：</p>
              <div className="space-y-2 mb-4">
                {/* 生成一些干扰项 + 真实错误混合 */}
                {(() => {
                  const decoys = [
                    "文笔不够流畅，有些句子过长",
                    "缺少一个总结性的段落",
                    "用词可能过于专业化，不够通俗",
                    "格式不够规范，缺少目录",
                    "有些数据没有标注单位",
                  ]
                  const allItems = [...active.hiddenErrors.map(e => e.description), ...decoys.slice(0, 5 - active.hiddenErrors.length)]
                    .sort(() => Math.random() - 0.5)
                  return allItems.map((desc, i) => (
                    <button key={i} onClick={() => handleToggleError(desc)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                        foundErrors.has(desc) ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-200"
                      }`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs ${
                          foundErrors.has(desc) ? "border-orange-400 bg-orange-500 text-white" : "border-gray-300"
                        }`}>{foundErrors.has(desc) ? "✓" : ""}</span>
                        <span className="text-sm text-gray-700">{desc}</span>
                      </div>
                    </button>
                  ))
                })()}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">你对判断的信心：</span>
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} onClick={() => setConfidence(i)}
                      className={`w-6 h-6 rounded-full text-xs font-medium transition-all ${i <= confidence ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                      {i}
                    </button>
                  ))}
                </div>
                <button onClick={handleReveal}
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm font-medium transition-all">
                  提交判断
                </button>
              </div>
            </div>
          )}

          {/* 阶段3: 揭示结果 */}
          {revealPhase === "revealed" && active && (
            <div className="space-y-3">
              <div className={`p-4 rounded-xl border-2 ${attempts.filter(a => a.challengeId === active.id).pop()?.passed ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
                <p className="text-sm font-bold mb-2">
                  {attempts.filter(a => a.challengeId === active.id).pop()?.passed
                    ? "✅ 你的判断力不错！找到了大部分关键错误"
                    : "⚠️ 有些关键错误你漏掉了，来看看AI的输出有哪些问题："
                  }
                </p>
              </div>
              {active.hiddenErrors.map((err, i) => (
                <div key={i} className={`p-4 rounded-xl border-2 ${foundErrors.has(err.description) ? "border-green-300 bg-green-50" : "border-red-200 bg-red-50"}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${err.severity === "致命" ? "bg-red-200 text-red-700" : err.severity === "严重" ? "bg-orange-200 text-orange-700" : "bg-yellow-200 text-yellow-700"}`}>
                      {err.severity}
                    </span>
                    <span className="text-xs text-gray-400">📍 {err.location}</span>
                    {foundErrors.has(err.description)
                      ? <span className="text-xs text-green-600">✅ 你发现了</span>
                      : <span className="text-xs text-red-500">❌ 你漏掉了</span>
                    }
                  </div>
                  <p className="text-sm text-gray-800 mb-2">{err.description}</p>
                  <p className="text-xs text-green-700 bg-white p-2 rounded-lg">✅ 正确: {err.correction}</p>
                </div>
              ))}
              <button onClick={() => { setRevealPhase("reflecting"); setUserReflections(active.reflectionQuestions.map(() => "")) }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm font-medium transition-all">
                进入反思 →
              </button>
            </div>
          )}

          {/* 阶段4: 反思 */}
          {revealPhase === "reflecting" && active && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">🤔 反思问题</h3>
              {active.reflectionQuestions.map((q, i) => (
                <div key={i} className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <p className="text-sm font-medium text-gray-800 mb-2">{q}</p>
                  <textarea value={userReflections[i] || ""} onChange={e => {
                    const next = [...userReflections]
                    next[i] = e.target.value
                    setUserReflections(next)
                  }}
                    placeholder="写下你的思考..."
                    className="w-full rounded-lg border border-purple-200 bg-white p-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none"
                    rows={2} />
                </div>
              ))}
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <p className="text-xs text-green-600 font-medium">💡 核心启示</p>
                <p className="text-sm text-gray-800 mt-1">{active.keyTakeaway}</p>
              </div>
              <button onClick={() => { setActiveId(null); setRevealPhase("reading") }}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm font-medium transition-all">
                完成挑战，返回列表
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── 挑战列表 ── */
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🧠 AI 判断力挑战</h3>
          <p className="text-xs text-gray-400 mb-4">AI生成的内容看起来专业流畅，但可能有隐藏的错误。你的任务是找出这些错误。</p>
          <div className="space-y-3">
            {challenges.map(ch => {
              const lastAttempt = attempts.filter(a => a.challengeId === ch.id).pop()
              const isPassed = lastAttempt?.passed
              const hasAttempted = !isPassed && lastAttempt
              return (
                <div key={ch.id} onClick={() => handleStart(ch.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    isPassed ? "border-green-200 bg-green-50" :
                    hasAttempted ? "border-red-200 bg-red-50" :
                    "border-[#e8e5df] bg-white hover:border-indigo-200"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span>{isPassed ? "✅" : hasAttempted ? "🔄" : "🧠"}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{ch.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${TYPE_COLORS[ch.type] || "bg-gray-100"}`}>{ch.type}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{ch.scenario.slice(0, 50)}...</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {lastAttempt && (
                        <span className={`text-xs ${isPassed ? "text-green-600" : "text-red-500"}`}>
                          {lastAttempt.errorsFound}/{lastAttempt.totalErrors} 发现
                        </span>
                      )}
                      <span className="text-xs text-gray-400 ml-2 block">→</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
