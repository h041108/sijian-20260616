"use client"

import { useState, useMemo, useCallback } from "react"
import {
  SecurityScenario, SecurityAttempt, getSecurityScenarios,
  saveL1Attempt, loadL1Attempts,
} from "@/lib/enterprise-ai-capability"

const CATEGORY_COLORS: Record<string, string> = {
  "数据分级": "bg-red-100 text-red-700", "密码安全": "bg-blue-100 text-blue-700",
  "钓鱼攻击": "bg-orange-100 text-orange-700", "设备安全": "bg-purple-100 text-purple-700",
  "社会工程": "bg-pink-100 text-pink-700", "AI合规": "bg-indigo-100 text-indigo-700",
  "应急响应": "bg-yellow-100 text-yellow-700",
}
const DIFFICULTY_STARS: Record<string, string> = { "初级": "⭐", "中级": "⭐⭐", "高级": "⭐⭐⭐" }

export default function L1SecuritySandbox() {
  const [scenarios] = useState<SecurityScenario[]>(() => getSecurityScenarios())
  const [attempts, setAttempts] = useState<SecurityAttempt[]>(() => loadL1Attempts())
  const [currentScenarioId, setCurrentScenarioId] = useState<string | null>(null)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [revealed, setRevealed] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string | null>(null)
  const [filterDifficulty, setFilterDifficulty] = useState<string | null>(null)
  const [quizStartTime, setQuizStartTime] = useState(0)

  const filteredScenarios = useMemo(() => {
    let list = scenarios
    if (filterCategory) list = list.filter(s => s.category === filterCategory)
    if (filterDifficulty) list = list.filter(s => s.difficulty === filterDifficulty)
    return list
  }, [scenarios, filterCategory, filterDifficulty])

  const stats = useMemo(() => {
    const scenarioAttempts = new Map(attempts.map(a => [a.scenarioId + "_" + a.employeeId, a]))
    const uniqueCompleted = new Set(attempts.filter(a => a.correct).map(a => a.scenarioId))
    const totalCorrect = attempts.filter(a => a.correct).length
    const totalAttempts = attempts.length
    return {
      completed: uniqueCompleted.size,
      total: scenarios.length,
      accuracy: totalAttempts > 0 ? totalCorrect / totalAttempts : 0,
      totalAttempts,
    }
  }, [attempts, scenarios])

  const currentScenario = currentScenarioId ? scenarios.find(s => s.id === currentScenarioId) : null

  const handleStartScenario = useCallback((sid: string) => {
    setCurrentScenarioId(sid)
    setSelectedChoice(null)
    setRevealed(false)
    setQuizStartTime(Date.now())
  }, [])

  const handleChoose = useCallback((idx: number) => {
    if (revealed) return
    setSelectedChoice(idx)
    setRevealed(true)
    if (currentScenario) {
      const attempt: SecurityAttempt = {
        id: `l1_${Date.now()}`,
        scenarioId: currentScenario.id,
        employeeId: "current",
        chosenIndex: idx,
        correct: idx === currentScenario.correctIndex,
        timestamp: new Date().toISOString(),
        timeSpent: Math.floor((Date.now() - quizStartTime) / 1000),
      }
      saveL1Attempt(attempt)
      setAttempts(prev => [...prev, attempt])
    }
  }, [revealed, currentScenario, quizStartTime])

  const handleNext = useCallback(() => {
    const idx = filteredScenarios.findIndex(s => s.id === currentScenarioId)
    if (idx < filteredScenarios.length - 1) {
      handleStartScenario(filteredScenarios[idx + 1].id)
    } else {
      setCurrentScenarioId(null)
    }
  }, [currentScenarioId, filteredScenarios, handleStartScenario])

  const categories = useMemo(() => [...new Set(scenarios.map(s => s.category))], [scenarios])
  const difficulties = ["初级", "中级", "高级"]

  return (
    <div className="space-y-6">
      {/* ── 顶部统计 ── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.completed}/{stats.total}</div>
          <div className="text-xs text-green-500 mt-1">场景通过</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{(stats.accuracy * 100).toFixed(0)}%</div>
          <div className="text-xs text-blue-500 mt-1">正确率</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{stats.totalAttempts}</div>
          <div className="text-xs text-purple-500 mt-1">总推演次数</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
          <div className="text-2xl font-bold text-orange-700">15</div>
          <div className="text-xs text-orange-500 mt-1">场景总数</div>
        </div>
      </div>

      {/* ── 运行中的沙盘推演 ── */}
      {currentScenario && (
        <div className="bg-white rounded-2xl border-2 border-red-300 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${CATEGORY_COLORS[currentScenario.category] || "bg-gray-100"}`}>
                {currentScenario.category}
              </span>
              <span className="text-xs text-gray-400">{DIFFICULTY_STARS[currentScenario.difficulty]} {currentScenario.difficulty}</span>
            </div>
            <button onClick={() => setCurrentScenarioId(null)}
              className="text-xs text-gray-400 hover:text-red-500">退出推演</button>
          </div>

          <h2 className="text-base font-bold text-gray-800 mb-3">{currentScenario.title}</h2>

          {/* 场景代入 */}
          <div className="p-4 bg-red-50 rounded-xl border border-red-200 mb-4">
            <p className="text-xs text-red-600 font-medium mb-1">📋 情景</p>
            <p className="text-sm text-gray-700 leading-relaxed">{currentScenario.context}</p>
          </div>
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-200 mb-5">
            <p className="text-xs text-orange-600 font-medium mb-1">🎯 你正在面对</p>
            <p className="text-sm text-gray-800 leading-relaxed font-medium">{currentScenario.scene}</p>
          </div>

          {/* 选项 */}
          <p className="text-sm font-semibold text-gray-700 mb-3">你会怎么做？</p>
          <div className="space-y-2 mb-4">
            {currentScenario.choices.map((choice, i) => {
              let borderClass = "border-[#e8e5df] bg-white"
              if (revealed) {
                if (i === currentScenario.correctIndex) borderClass = "border-green-400 bg-green-50"
                else if (i === selectedChoice && i !== currentScenario.correctIndex) borderClass = "border-red-400 bg-red-50"
                else borderClass = "border-gray-200 bg-gray-50 opacity-50"
              } else if (i === selectedChoice) {
                borderClass = "border-orange-400 bg-orange-50"
              }
              return (
                <button key={i} onClick={() => handleChoose(i)} disabled={revealed}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${borderClass} ${!revealed ? "hover:border-orange-300 cursor-pointer" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${revealed && i === currentScenario.correctIndex ? "bg-green-500 text-white" : revealed && i === selectedChoice && i !== currentScenario.correctIndex ? "bg-red-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                      {revealed ? (i === currentScenario.correctIndex ? "✓" : i === selectedChoice ? "✗" : String.fromCharCode(65 + i)) : String.fromCharCode(65 + i)}
                    </span>
                    <div>
                      <p className="text-sm text-gray-800">{choice.text}</p>
                      {revealed && <p className="text-xs text-gray-400 mt-1">思考路径: {choice.reasoning}</p>}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* 揭示结果 */}
          {revealed && currentScenario && (
            <div className={`p-5 rounded-xl border-2 ${selectedChoice === currentScenario.correctIndex ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
              <p className={`text-sm font-bold mb-2 ${selectedChoice === currentScenario.correctIndex ? "text-green-700" : "text-red-700"}`}>
                {selectedChoice === currentScenario.correctIndex ? "✅ 正确！你做出了安全的决策" : "❌ 这个选择存在安全隐患"}
              </p>
              <p className="text-sm text-gray-700 leading-relaxed mb-3">{currentScenario.explanation}</p>
              <div className="p-3 bg-white rounded-xl border border-red-200 mb-3">
                <p className="text-xs text-red-600 font-medium">⚠️ 错误后果</p>
                <p className="text-sm text-gray-700">{currentScenario.consequence}</p>
              </div>
              {currentScenario.regulation && (
                <p className="text-xs text-gray-500">📜 相关法规: {currentScenario.regulation}</p>
              )}
              <div className="mt-4">
                <button onClick={handleNext}
                  className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-5 py-2 text-sm font-medium transition-all">
                  {filteredScenarios.findIndex(s => s.id === currentScenario.id) < filteredScenarios.length - 1 ? "下一场景 →" : "完成推演 ✓"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 场景列表 ── */}
      {!currentScenario && (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">🔐 安全沙盘场景库</h3>
            <div className="flex gap-2">
              <select value={filterCategory || ""} onChange={e => setFilterCategory(e.target.value || null)}
                className="text-xs rounded-lg border border-[#e8e5df] bg-gray-50 px-3 py-1.5">
                <option value="">全部类别</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={filterDifficulty || ""} onChange={e => setFilterDifficulty(e.target.value || null)}
                className="text-xs rounded-lg border border-[#e8e5df] bg-gray-50 px-3 py-1.5">
                <option value="">全部难度</option>
                {difficulties.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredScenarios.map(s => {
              const isCompleted = attempts.some(a => a.scenarioId === s.id && a.correct)
              const hasAttempted = attempts.some(a => a.scenarioId === s.id && !a.correct)
              return (
                <div key={s.id} onClick={() => handleStartScenario(s.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    isCompleted ? "border-green-200 bg-green-50" :
                    hasAttempted ? "border-red-200 bg-red-50" :
                    "border-[#e8e5df] bg-white hover:border-red-200"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`text-lg ${isCompleted ? "" : hasAttempted ? "opacity-70" : ""}`}>
                        {isCompleted ? "✅" : hasAttempted ? "🔄" : "🔒"}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-800">{s.title}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${CATEGORY_COLORS[s.category] || "bg-gray-100"}`}>{s.category}</span>
                          <span className="text-xs text-gray-400">{DIFFICULTY_STARS[s.difficulty]}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{s.context.slice(0, 45)}...</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">→</span>
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
