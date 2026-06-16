"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  generateClassroomHeatmap, ClassroomHeatmap,
  StudentHeatCell, StudentState, ConceptHeatCell,
  STATE_LABELS, STATE_COLORS, SUBJECT_NAMES,
} from "@/lib/classroom-heatmap"
import { getMyClasses, ClassRoom } from "@/lib/sijian-user"

export default function ClassroomHeatmapView() {
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [topicFilter, setTopicFilter] = useState("")
  const [heatmap, setHeatmap] = useState<ClassroomHeatmap | null>(null)
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "concepts" | "analysis">("grid")

  useEffect(() => {
    if (typeof window === "undefined") return
    const cls = getMyClasses()
    setClasses(cls)
    if (cls.length > 0) {
      setSelectedClassId(cls[0].id)
    }
  }, [])

  const refresh = useCallback(() => {
    if (!selectedClassId) return
    const cls = classes.find(c => c.id === selectedClassId)
    if (!cls) return
    const hm = generateClassroomHeatmap(cls, topicFilter.trim() || undefined)
    setHeatmap(hm)
  }, [selectedClassId, classes, topicFilter])

  useEffect(() => { refresh() }, [refresh])

  // 自动刷新
  useEffect(() => {
    const timer = setInterval(refresh, 30000)
    return () => clearInterval(timer)
  }, [refresh])

  const selectedClass = classes.find(c => c.id === selectedClassId)

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-12 text-center">
        <div className="text-5xl mb-4 opacity-20">🏫</div>
        <p className="text-gray-500 text-sm font-medium">还没有班级</p>
        <p className="text-xs text-gray-400 mt-1">先在"成员管理"中创建班级并让学生加入</p>
      </div>
    )
  }

  if (!heatmap) return null

  return (
    <div className="space-y-4">
      {/* ═══ 顶部控制栏 ═══ */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 flex flex-wrap items-center gap-3">
        {/* 班级选择 */}
        <select value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}
          className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm text-gray-700 font-medium">
          {classes.map(c => <option key={c.id} value={c.id}>{c.name} · {SUBJECT_NAMES[c.subject] || c.subject} · {c.grade}</option>)}
        </select>

        {/* 主题过滤 */}
        <input value={topicFilter} onChange={e => setTopicFilter(e.target.value)}
          placeholder="输入当前教学主题，如：正弦定理"
          className="flex-1 min-w-[180px] rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />

        {/* 刷新 */}
        <button onClick={refresh}
          className="rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-2 text-sm font-medium transition-all">
          🔄 刷新
        </button>

        {/* 视图切换 */}
        <div className="flex rounded-xl bg-gray-100 p-0.5">
          {[
            { id: "grid" as const, label: "学情", icon: "👥" },
            { id: "concepts" as const, label: "概念", icon: "📊" },
            { id: "analysis" as const, label: "分析", icon: "🧠" },
          ].map(v => (
            <button key={v.id} onClick={() => setViewMode(v.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${viewMode === v.id ? "bg-white text-gray-800 shadow-sm" : "text-gray-500"}`}>
              {v.icon} {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ 紧急警告 ═══ */}
      {heatmap.urgentAlerts.length > 0 && (
        <div className="space-y-1.5">
          {heatmap.urgentAlerts.map((alert, i) => (
            <div key={i} className={`px-4 py-2.5 rounded-xl text-sm font-medium animate-fade-in ${
              alert.startsWith("🔴") ? "bg-red-50 border border-red-200 text-red-700" : "bg-yellow-50 border border-yellow-200 text-yellow-700"
            }`}>
              {alert}
            </div>
          ))}
        </div>
      )}

      {/* ═══ AI 教学建议 ═══ */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">🤖</span>
        <div>
          <p className="text-xs text-blue-500 font-medium mb-1">AI 教学建议</p>
          <p className="text-sm text-gray-700 leading-relaxed">{heatmap.aiAdvice}</p>
        </div>
      </div>

      {/* ═══ 状态分布概览条 ═══ */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-4">
        <div className="flex items-center gap-4 mb-3">
          <span className="text-xs font-semibold text-gray-600">
            {heatmap.activeStudents}/{heatmap.totalStudents} 活跃
          </span>
          <div className="flex-1 h-5 rounded-full overflow-hidden flex">
            {(["following", "ahead", "straying", "stuck", "inactive"] as StudentState[]).map(state => {
              const count = heatmap.stateDistribution[state]
              if (count === 0) return null
              return (
                <div key={state}
                  className="h-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-medium"
                  style={{
                    width: `${(count / heatmap.totalStudents) * 100}%`,
                    backgroundColor: STATE_COLORS[state],
                  }}>
                  {count > 1 ? count : ""}
                </div>
              )
            })}
          </div>
        </div>
        <div className="flex gap-4 text-xs">
          {(["following", "ahead", "straying", "stuck", "inactive"] as StudentState[]).map(state => {
            const count = heatmap.stateDistribution[state]
            if (count === 0) return null
            return (
              <span key={state} className="flex items-center gap-1 text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATE_COLORS[state] }} />
                {STATE_LABELS[state]} {count}
              </span>
            )
          })}
        </div>
      </div>

      {/* ════════════════════════════════════════
          视图1: 学生网格
          ════════════════════════════════════════ */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {heatmap.students.map((student, i) => (
            <div key={student.studentName}
              onClick={() => setExpandedStudent(expandedStudent === student.studentName ? null : student.studentName)}
              className={`rounded-xl border-2 p-3 cursor-pointer transition-all hover:shadow-md animate-fade-in ${
                expandedStudent === student.studentName ? "ring-2 ring-blue-400" : ""
              }`}
              style={{
                borderColor: STATE_COLORS[student.state],
                background: student.state === "inactive" ? "#f5f5f5" : "#fff",
                animationDelay: `${i * 50}ms`,
              }}>
              {/* 头像 + 状态 */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: STATE_COLORS[student.state] }}>
                    {student.studentName[0]}
                  </div>
                  <div className="text-xs font-semibold text-gray-800 truncate max-w-[60px]">
                    {student.studentName}
                  </div>
                </div>
                <span className="text-[10px] font-medium">{student.trend === "rising" ? "↑" : student.trend === "declining" ? "↓" : "→"}</span>
              </div>

              {/* 掌握度 */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${student.mastery * 100}%`,
                      backgroundColor: STATE_COLORS[student.state],
                    }} />
                </div>
                <span className="text-[10px] font-bold text-gray-500">
                  {Math.round(student.mastery * 100)}%
                </span>
              </div>

              {/* 状态标签 */}
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: STATE_COLORS[student.state] + "18",
                  color: STATE_COLORS[student.state],
                }}>
                {STATE_LABELS[student.state]}
              </span>

              {/* 当前概念 */}
              {student.currentConcepts.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {student.currentConcepts.map((c, j) => (
                    <span key={j} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                      {c}
                    </span>
                  ))}
                </div>
              )}

              {/* 展开详情 */}
              {expandedStudent === student.studentName && (
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500 leading-relaxed">{student.insights}</p>
                  {student.thinkingStyles.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[9px] text-gray-400">思维:</span>
                      {student.thinkingStyles.map((s, k) => (
                        <span key={k} className="text-[9px] bg-purple-50 text-purple-600 px-1 py-0.5 rounded">
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════
          视图2: 概念热力图
          ════════════════════════════════════════ */}
      {viewMode === "concepts" && (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 概念掌握热力图</h3>
          <p className="text-xs text-gray-400 mb-4">越红代表越急需关注——参与学生多但整体掌握度低</p>
          <div className="grid grid-cols-2 gap-2">
            {heatmap.conceptHeat.slice(0, 20).map(c => (
              <div key={c.label} className="p-3 rounded-xl border-2 transition-all"
                style={{
                  borderColor: c.heatLevel === "hot" ? "#fca5a5" : c.heatLevel === "warm" ? "#fde68a" : "#e5e7eb",
                  background: c.heatLevel === "hot" ? "#fef2f2" : c.heatLevel === "warm" ? "#fffbeb" : "#f9fafb",
                }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-800">{c.label}</span>
                  <span className={`text-xs font-bold ${
                    c.heatLevel === "hot" ? "text-red-600" : c.heatLevel === "warm" ? "text-yellow-600" : "text-gray-400"
                  }`}>
                    🔥 {c.heatLevel === "hot" ? "高关注" : c.heatLevel === "warm" ? "中等" : "冷"}
                  </span>
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex-1 h-2 rounded-full bg-gray-100">
                    <div className="h-full rounded-full"
                      style={{
                        width: `${c.avgMastery * 100}%`,
                        background: c.avgMastery < 0.4 ? "#ef4444" : c.avgMastery < 0.6 ? "#f59e0b" : "#22c55e",
                      }} />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{Math.round(c.avgMastery * 100)}%</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-gray-400">
                  <span>👥 {c.studentCount} 学生</span>
                  {c.strugglingCount > 0 && <span className="text-red-500">⚠️ {c.strugglingCount} 未掌握</span>}
                  {c.masteredCount > 0 && <span className="text-green-500">✅ {c.masteredCount} 已掌握</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          视图3: 分析面板
          ════════════════════════════════════════ */}
      {viewMode === "analysis" && (
        <div className="grid grid-cols-2 gap-4">
          {/* 思维多样性 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🧠 全班思维模式分布</h3>
            {heatmap.thinkingDiversity.length > 0 ? (
              <div className="space-y-3">
                {heatmap.thinkingDiversity.map(d => {
                  const pct = (d.count / heatmap.totalStudents) * 100
                  return (
                    <div key={d.style} className="flex items-center gap-2">
                      <span className="text-xs text-gray-600 w-12">{d.style}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100">
                        <div className="h-full bg-indigo-400 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 w-8 text-right">{d.count}人</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-8">数据积累中</p>
            )}
          </div>

          {/* 学生排名 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 学生掌握度排名</h3>
            <div className="space-y-2 max-h-[340px] overflow-y-auto">
              {[...heatmap.students]
                .sort((a, b) => b.mastery - a.mastery)
                .map((s, i) => (
                  <div key={s.studentName} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                    <span className="text-xs text-gray-300 w-5">{i + 1}</span>
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: STATE_COLORS[s.state] }}>
                      {s.studentName[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-xs font-medium text-gray-700">{s.studentName}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 rounded-full bg-gray-100">
                          <div className="h-full rounded-full" style={{
                            width: `${s.mastery * 100}%`,
                            backgroundColor: STATE_COLORS[s.state],
                          }} />
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-gray-500">{Math.round(s.mastery * 100)}%</span>
                    <span className="text-[10px]" style={{ color: STATE_COLORS[s.state] }}>
                      {STATE_LABELS[s.state]}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ 底部信息 ═══ */}
      <div className="text-center py-3">
        <p className="text-[10px] text-gray-400">
          每 30 秒自动刷新 · 数据来源：学生思见对话记录 · {new Date(heatmap.generatedAt).toLocaleTimeString("zh")} 更新
        </p>
      </div>
    </div>
  )
}
