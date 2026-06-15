"use client"

import { useState, useMemo, useCallback } from "react"
import {
  PromptExercise, PromptSubmission, getPromptExercises,
  saveL2Submission, loadL2Submissions,
} from "@/lib/enterprise-ai-capability"

const PATTERN_COLORS: Record<string, string> = {
  "链式思维": "bg-blue-100 text-blue-700", "角色扮演": "bg-purple-100 text-purple-700",
  "少样本学习": "bg-green-100 text-green-700", "分步拆解": "bg-orange-100 text-orange-700",
  "格式化输出": "bg-teal-100 text-teal-700", "反面约束": "bg-pink-100 text-pink-700",
  "上下文注入": "bg-indigo-100 text-indigo-700", "批判性反思": "bg-red-100 text-red-700",
}
const DIFFICULTY_LABELS: Record<string, string> = { "入门": "⭐ 入门", "进阶": "⭐⭐ 进阶", "高级": "⭐⭐⭐ 高级" }

export default function L2PromptTraining() {
  const [exercises] = useState<PromptExercise[]>(() => getPromptExercises())
  const [submissions, setSubmissions] = useState<PromptSubmission[]>(() => loadL2Submissions())
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  const [userPrompt, setUserPrompt] = useState("")
  const [selfScore, setSelfScore] = useState(3)
  const [submitted, setSubmitted] = useState(false)
  const [showHints, setShowHints] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [filterPattern, setFilterPattern] = useState<string | null>(null)

  const filteredExercises = useMemo(() => {
    if (!filterPattern) return exercises
    return exercises.filter(e => e.pattern === filterPattern)
  }, [exercises, filterPattern])

  const activeExercise = activeExerciseId ? exercises.find(e => e.id === activeExerciseId) : null

  const stats = useMemo(() => {
    const done = new Set(submissions.map(s => s.exerciseId))
    return { completed: done.size, total: exercises.length }
  }, [submissions, exercises])

  const handleStart = useCallback((eid: string) => {
    setActiveExerciseId(eid)
    setUserPrompt(""); setSelfScore(3); setSubmitted(false)
    setShowHints(false); setHintIndex(0)
  }, [])

  const handleSubmit = useCallback(() => {
    if (!userPrompt.trim() || !activeExercise) return
    const sub: PromptSubmission = {
      id: `l2_${Date.now()}`,
      exerciseId: activeExercise.id,
      employeeId: "current",
      prompt: userPrompt.trim(),
      selfScore: selfScore / 5,
      peerReviewed: false,
      timestamp: new Date().toISOString(),
    }
    saveL2Submission(sub)
    setSubmissions(prev => [...prev, sub])
    setSubmitted(true)
  }, [userPrompt, activeExercise, selfScore])

  const patterns = useMemo(() => [...new Set(exercises.map(e => e.pattern))], [exercises])

  return (
    <div className="space-y-6">
      {/* ── 统计 ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
          <div className="text-2xl font-bold text-green-700">{stats.completed}/{stats.total}</div>
          <div className="text-xs text-green-500 mt-1">练习完成</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
          <div className="text-2xl font-bold text-purple-700">{patterns.length}</div>
          <div className="text-xs text-purple-500 mt-1">Prompt 模式</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
          <div className="text-2xl font-bold text-blue-700">{exercises.length}</div>
          <div className="text-xs text-blue-500 mt-1">总练习</div>
        </div>
      </div>

      {/* ── 练习面板 ── */}
      {activeExercise ? (
        <div className="bg-white rounded-2xl border-2 border-purple-300 p-6">
          <button onClick={() => setActiveExerciseId(null)}
            className="text-xs text-gray-400 hover:text-gray-600 mb-3">← 返回练习列表</button>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-gray-800">{activeExercise.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-0.5 rounded-full ${PATTERN_COLORS[activeExercise.pattern] || "bg-gray-100"}`}>{activeExercise.pattern}</span>
                <span className="text-xs text-gray-400">{DIFFICULTY_LABELS[activeExercise.difficulty]}</span>
                <span className="text-xs text-gray-400">🛠️ {activeExercise.aiTool}</span>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">{activeExercise.description}</p>

          {/* 任务 */}
          <div className="p-4 bg-purple-50 rounded-xl border border-purple-200 mb-4">
            <p className="text-xs text-purple-600 font-medium mb-1">🎯 任务</p>
            <p className="text-sm text-gray-800 leading-relaxed">{activeExercise.task}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-xl border border-[#e8e5df] mb-4">
            <p className="text-xs text-gray-500 font-medium mb-1">📋 背景</p>
            <p className="text-sm text-gray-700">{activeExercise.context}</p>
          </div>

          {/* Prompt输入 */}
          {!submitted && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">✍️ 写出你的 Prompt</label>
                <button onClick={() => { setShowHints(!showHints); if (!showHints) setHintIndex(0) }}
                  className="text-xs text-purple-500 hover:text-purple-700">
                  {showHints ? "隐藏提示" : "💡 需要提示？"}
                </button>
              </div>
              {showHints && activeExercise.hints.length > 0 && (
                <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200 mb-2">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-yellow-700 font-medium">提示 {hintIndex + 1}/{activeExercise.hints.length}</p>
                    {hintIndex < activeExercise.hints.length - 1 && (
                      <button onClick={() => setHintIndex(i => i + 1)}
                        className="text-xs text-yellow-600 hover:text-yellow-800 underline">下一个提示</button>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{activeExercise.hints[hintIndex]}</p>
                </div>
              )}
              <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)}
                placeholder="在这里写你的 Prompt ..."
                className="w-full h-40 rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none font-mono" />
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">自评：</span>
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} onClick={() => setSelfScore(i)}
                      className={`w-6 h-6 rounded-full text-xs font-medium transition-all ${i <= selfScore ? "bg-purple-500 text-white" : "bg-gray-200 text-gray-400"}`}>
                      {i}
                    </button>
                  ))}
                  <span className="text-xs text-gray-400 ml-1">{["", "差", "一般", "不错", "好", "优秀"][selfScore]}</span>
                </div>
                <button onClick={handleSubmit} disabled={!userPrompt.trim()}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-sm font-medium transition-all disabled:opacity-40">
                  提交练习
                </button>
              </div>
            </div>
          )}

          {/* 提交后展示对比 */}
          {submitted && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50">
                  <p className="text-xs text-green-600 font-medium mb-2">✅ 优秀示例</p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{activeExercise.goodExample}</pre>
                </div>
                <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50">
                  <p className="text-xs text-red-600 font-medium mb-2">❌ 不推荐写法</p>
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{activeExercise.badExample}</pre>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-[#e8e5df] bg-white">
                <p className="text-xs text-gray-500 font-medium mb-2">📝 你的 Prompt</p>
                <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">{userPrompt}</pre>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-[#e8e5df]">
                <p className="text-xs text-gray-500 font-medium mb-2">📊 评分维度</p>
                <div className="space-y-1.5">
                  {activeExercise.scoringRubric.map((r, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600 w-48">{r.criterion}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-200">
                        <div className="h-full bg-purple-400 rounded-full" style={{ width: `${r.weight * 100}%` }} />
                      </div>
                      <span className="text-gray-400">权重 {(r.weight * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-3">对照以上维度，重新审视你的 Prompt，找出可以改进的地方</p>
              </div>
              <button onClick={() => { setActiveExerciseId(null); setSubmitted(false); }}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-sm font-medium transition-all">
                完成练习，返回列表
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── 练习列表 ── */
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-700">✍️ Prompt 工程练习库</h3>
            <select value={filterPattern || ""} onChange={e => setFilterPattern(e.target.value || null)}
              className="text-xs rounded-lg border border-[#e8e5df] bg-gray-50 px-3 py-1.5">
              <option value="">全部模式</option>
              {patterns.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {filteredExercises.map(ex => {
              const isCompleted = submissions.some(s => s.exerciseId === ex.id)
              return (
                <div key={ex.id} onClick={() => handleStart(ex.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${
                    isCompleted ? "border-green-200 bg-green-50" : "border-[#e8e5df] bg-white hover:border-purple-200"
                  }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-base">{isCompleted ? "✅" : "📝"}</span>
                    <span className="text-xs text-gray-400">{DIFFICULTY_LABELS[ex.difficulty]}</span>
                  </div>
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">{ex.title}</h4>
                  <p className="text-xs text-gray-400 mb-2">{ex.description.slice(0, 50)}...</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${PATTERN_COLORS[ex.pattern] || "bg-gray-100"}`}>{ex.pattern}</span>
                    <span className="text-xs text-gray-400">🛠️ {ex.aiTool}</span>
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
