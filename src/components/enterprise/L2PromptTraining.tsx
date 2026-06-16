"use client"

import { useState, useMemo, useCallback, useRef, useEffect } from "react"
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

type FeedbackPhase = "writing" | "sending" | "both_done" | "comparing"

export default function L2PromptTraining() {
  const [exercises] = useState<PromptExercise[]>(() => getPromptExercises())
  const [submissions, setSubmissions] = useState<PromptSubmission[]>(() => loadL2Submissions())
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null)
  const [userPrompt, setUserPrompt] = useState("")
  const [phase, setPhase] = useState<FeedbackPhase>("writing")
  const [showHints, setShowHints] = useState(false)
  const [hintIndex, setHintIndex] = useState(0)
  const [filterPattern, setFilterPattern] = useState<string | null>(null)

  // Real AI responses
  const [userResponse, setUserResponse] = useState("")
  const [goodResponse, setGoodResponse] = useState("")
  const [userLoading, setUserLoading] = useState(false)
  const [goodLoading, setGoodLoading] = useState(false)
  const [aiFeedback, setAiFeedback] = useState("")
  const [feedbackLoading, setFeedbackLoading] = useState(false)

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
    setActiveExerciseId(eid); setUserPrompt(""); setPhase("writing")
    setShowHints(false); setHintIndex(0)
    setUserResponse(""); setGoodResponse(""); setAiFeedback("")
  }, [])

  // ── 发送用户 Prompt 到真实 AI ──
  const handleSendToAI = useCallback(async () => {
    if (!userPrompt.trim() || !activeExercise || userLoading) return
    setUserLoading(true)
    setPhase("sending")
    setUserResponse("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: userPrompt.trim() }],
          existingNodes: [],
        }),
      })
      const data = await res.json()
      setUserResponse(data.message || "(AI 未返回内容)")
    } catch {
      setUserResponse("⚠️ AI 请求失败，请检查网络后重试。")
    } finally {
      setUserLoading(false)
    }
  }, [userPrompt, activeExercise, userLoading])

  // ── 用优秀示例也请求一次 AI ──
  const handleSendGoodExample = useCallback(async () => {
    if (!activeExercise || goodLoading) return
    setGoodLoading(true)
    setGoodResponse("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: activeExercise.goodExample.split("\n\n").pop() || activeExercise.goodExample }],
          existingNodes: [],
        }),
      })
      const data = await res.json()
      setGoodResponse(data.message || "(AI 未返回内容)")
    } catch {
      setGoodResponse("⚠️ AI 请求失败。")
    } finally {
      setGoodLoading(false)
    }
  }, [activeExercise, goodLoading])

  // ── AI 对 Prompt 质量做反馈 ──
  const handleGetFeedback = useCallback(async () => {
    if (!activeExercise || !userPrompt.trim() || !userResponse || feedbackLoading) return
    setFeedbackLoading(true)
    setAiFeedback("")

    const rubricText = activeExercise.scoringRubric
      .map((r, i) => `${i + 1}. ${r.criterion}（权重 ${Math.round(r.weight * 100)}%）`)
      .join("\n")

    const feedbackPrompt = `你是一个 Prompt 工程导师。请评估以下学员的 Prompt 质量。

【练习目标】${activeExercise.title}
【练习描述】${activeExercise.description}
【评分维度】
${rubricText}

【学员的 Prompt】
${userPrompt}

【AI 对学员 Prompt 的实际回复】
${userResponse.slice(0, 1200)}

请按以下格式给出反馈：
1. **总体评分**（1-5 星）及一句话总结
2. **亮点**：这个 Prompt 哪里做得好？
3. **改进空间**：哪里可以更好？如何改进？
4. **与优秀 Prompt 的差距**：参考评分维度，指出 1-2 个最关键的改进方向
5. **一句话建议**：用一句话总结最重要的改进建议

用中文回复，语气友善但专业。控制在 300 字以内。`

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: feedbackPrompt }],
          existingNodes: [],
        }),
      })
      const data = await res.json()
      setAiFeedback(data.message || "")

      // 保存提交
      const sub: PromptSubmission = {
        id: `l2_${Date.now()}`,
        exerciseId: activeExercise.id,
        employeeId: "current",
        prompt: userPrompt.trim(),
        aiResponse: userResponse,
        selfScore: 3 / 5,
        peerReviewed: true,
        timestamp: new Date().toISOString(),
      }
      saveL2Submission(sub)
      setSubmissions(prev => [...prev, sub])
    } catch {
      setAiFeedback("⚠️ 反馈生成失败。")
    } finally {
      setFeedbackLoading(false)
      setPhase("both_done")
    }
  }, [activeExercise, userPrompt, userResponse, feedbackLoading])

  const patterns = useMemo(() => [...new Set(exercises.map(e => e.pattern))], [exercises])

  const canSend = userPrompt.trim().length > 0 && !userLoading
  const canGetFeedback = userResponse.length > 0 && !feedbackLoading
  const canCompare = userResponse.length > 0 && !goodLoading && !goodResponse

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
            {/* 阶段指示器 */}
            <div className="flex items-center gap-1 text-xs">
              <span className={`px-2 py-1 rounded-lg ${phase === "writing" ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-300"}`}>① 写 Prompt</span>
              <span className="text-gray-300">→</span>
              <span className={`px-2 py-1 rounded-lg ${phase === "sending" ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-300"}`}>② AI 回复</span>
              <span className="text-gray-300">→</span>
              <span className={`px-2 py-1 rounded-lg ${phase === "both_done" || phase === "comparing" ? "bg-purple-100 text-purple-700 font-medium" : "text-gray-300"}`}>③ 对比反馈</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">{activeExercise.description}</p>

          {/* 任务 + 背景 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <p className="text-xs text-purple-600 font-medium mb-1">🎯 任务</p>
              <p className="text-sm text-gray-800 leading-relaxed">{activeExercise.task}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-xl border border-[#e8e5df]">
              <p className="text-xs text-gray-500 font-medium mb-1">📋 背景</p>
              <p className="text-sm text-gray-700 leading-relaxed">{activeExercise.context}</p>
            </div>
          </div>

          {/* ── 阶段1: 写 Prompt ── */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">✍️ 写出你的 Prompt，然后发送给 AI</label>
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
                      className="text-xs text-yellow-600 hover:text-yellow-800 underline">下一个</button>
                  )}
                </div>
                <p className="text-sm text-gray-700">{activeExercise.hints[hintIndex]}</p>
              </div>
            )}
            <textarea value={userPrompt} onChange={e => setUserPrompt(e.target.value)}
              placeholder="在这里写你的 Prompt，然后点击「发送给 AI」看效果..."
              disabled={userLoading}
              className="w-full h-36 rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300 resize-none font-mono" />
            <div className="flex items-center gap-2 mt-2">
              <button onClick={handleSendToAI} disabled={!canSend}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-1.5">
                {userLoading ? (
                  <><span className="inline-flex gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" /><span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0.15s" }} /><span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0.3s" }} /></span> AI 回复中</>
                ) : (
                  <>🚀 发送给 AI</>
                )}
              </button>
              <span className="text-xs text-gray-400">{userPrompt.length} 字</span>
            </div>
          </div>

          {/* ── 阶段2: 用户 Prompt 的 AI 回复 + 初始对比 ── */}
          {userResponse && (
            <div className="space-y-4 animate-fade-in">
              {/* 用户 Prompt → AI 回复 */}
              <div className="p-4 rounded-xl border-2 border-purple-200 bg-purple-50/30">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-purple-600 font-medium">🤖 AI 对你 Prompt 的回复</p>
                  <span className="text-[10px] text-gray-400">{userResponse.length} 字</span>
                </div>
                <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto bg-white p-3 rounded-lg border border-purple-100">
                  {userResponse}
                </div>
              </div>

              {/* 操作按钮组 */}
              <div className="flex items-center gap-3">
                <button onClick={handleGetFeedback} disabled={!canGetFeedback}
                  className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-2 text-sm font-medium transition-all disabled:opacity-40 flex items-center gap-1.5">
                  {feedbackLoading ? (
                    <>⏳ 分析中</>
                  ) : (
                    <>🤖 AI 评价我的 Prompt</>
                  )}
                </button>
                <button onClick={handleSendGoodExample} disabled={!canCompare}
                  className="rounded-xl border-2 border-green-300 bg-green-50 hover:bg-green-100 text-green-700 px-5 py-2 text-sm font-medium transition-all disabled:opacity-40">
                  {goodLoading ? "⏳ 请求中..." : goodResponse ? "✅ 已获取对比" : "📋 用优秀示例也发一次"}
                </button>
              </div>

              {/* AI 评分反馈 */}
              {aiFeedback && (
                <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50 animate-fade-in">
                  <p className="text-xs text-green-600 font-medium mb-2">🤖 AI 导师反馈</p>
                  <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{aiFeedback}</div>
                </div>
              )}

              {/* 并排对比：用户 vs 优秀示例 */}
              {userResponse && goodResponse && (
                <div className="grid grid-cols-2 gap-4 animate-fade-in">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-0.5 rounded">你的 Prompt</span>
                      <span className="text-[10px] text-gray-400">{getPromptSummary(userPrompt)}</span>
                    </div>
                    <pre className="text-[11px] text-gray-700 whitespace-pre-wrap font-mono leading-relaxed p-3 bg-white rounded-lg border border-purple-100 max-h-[400px] overflow-y-auto">
                      {userResponse.slice(0, 800)}
                    </pre>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded">优秀 Prompt</span>
                      <span className="text-[10px] text-gray-400">{activeExercise.pattern}</span>
                    </div>
                    <pre className="text-[11px] text-gray-700 whitespace-pre-wrap font-mono leading-relaxed p-3 bg-white rounded-lg border border-green-100 max-h-[400px] overflow-y-auto">
                      {goodResponse.slice(0, 800)}
                    </pre>
                  </div>
                </div>
              )}

              {/* 评分维度 + 优秀/差示例参考 */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border-2 border-green-200 bg-green-50">
                  <p className="text-xs text-green-600 font-medium mb-2">✅ 优秀示例</p>
                  <pre className="text-[11px] text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{activeExercise.goodExample}</pre>
                </div>
                <div className="p-4 rounded-xl border-2 border-red-200 bg-red-50">
                  <p className="text-xs text-red-600 font-medium mb-2">❌ 不推荐写法</p>
                  <pre className="text-[11px] text-gray-700 whitespace-pre-wrap font-mono leading-relaxed">{activeExercise.badExample}</pre>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-gray-50 border border-[#e8e5df]">
                <p className="text-xs text-gray-500 font-medium mb-2">📊 评分维度 — 对照检查你的 Prompt</p>
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
                <p className="text-xs text-purple-600 font-medium mt-3 bg-purple-50 p-2 rounded-lg">
                  💡 核心理念：不是看 AI 能不能答对，而是看你的 Prompt 是否精准地引导了 AI 给出你想要的结果。
                  发送给 AI → 看回复 → 改 Prompt → 再发送 → 看变化。反复迭代才是真正的 Prompt 工程。
                </p>
              </div>

              <button onClick={() => { setActiveExerciseId(null); setPhase("writing"); }}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 text-sm font-medium transition-all">
                完成练习，返回列表
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ── 练习列表 ── */
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">✍️ Prompt 工程实战练习库</h3>
          <p className="text-xs text-gray-400 mb-4">
            不再是看静态示例——把你的 Prompt 真正发送给 AI，看到真实回复，再和优秀 Prompt 的回复做对比。
          </p>
          <div className="flex items-center gap-2 mb-4">
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

function getPromptSummary(prompt: string): string {
  const lines = prompt.split("\n").filter(l => l.trim()).length
  const hasRole = /你是[一个位]/.test(prompt) ? "有角色" : ""
  const hasSteps = /步骤|第[一二三]|先.*再|首先/.test(prompt) ? "有步骤" : ""
  const hasFormat = /格式|输出|返回.*格式|json|markdown/.test(prompt) ? "有格式" : ""
  const tags = [hasRole, hasSteps, hasFormat].filter(Boolean)
  return tags.length > 0 ? tags.join(" · ") : ""
}
