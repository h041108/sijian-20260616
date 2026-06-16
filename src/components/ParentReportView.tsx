"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { generateParentReport, ParentReport } from "@/lib/parent-report"
import { loadRooms } from "@/lib/memory-palace"
import { loadAllChats } from "@/lib/memory"

const SUBJECT_COLORS: Record<string, string> = {
  mathematics:"#4C51BF", physics:"#E53E3E", chemistry:"#38A169", biology:"#00B5D8",
  history:"#DD6B20", geography:"#D69E2E", politics:"#805AD5", chinese:"#3182CE",
  english:"#D53F8C", art:"#ED8936", music:"#319795", general:"#8B4513",
}

export default function ParentReportView() {
  const [selectedStudent, setSelectedStudent] = useState("")
  const [report, setReport] = useState<ParentReport | null>(null)
  const [expanded, setExpanded] = useState(false)

  const students = useMemo(() => {
    const rooms = loadRooms()
    const names = new Set(rooms.map(r => r.name.split(" · ")[0]))
    return Array.from(names).sort()
  }, [])

  const handleGenerate = useCallback((name: string) => {
    const rpt = generateParentReport(name, name, 7)
    setReport(rpt)
    setSelectedStudent(name)
  }, [])

  // Auto-select first student
  useEffect(() => {
    if (students.length > 0 && !selectedStudent) {
      handleGenerate(students[0])
    }
  }, [students, selectedStudent, handleGenerate])

  if (students.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-8 text-center">
        <div className="text-5xl mb-4 opacity-20">📋</div>
        <p className="text-gray-500 text-sm">还没有思维记录</p>
        <p className="text-xs text-gray-400 mt-1">开始对话后，AI 会自动为每个学生生成思维报告</p>
      </div>
    )
  }

  if (!report) return null

  const scoreColor = report.overallScore >= 70 ? "text-green-600" : report.overallScore >= 40 ? "text-yellow-600" : "text-red-600"
  const scoreBg = report.overallScore >= 70 ? "bg-green-50 border-green-200" : report.overallScore >= 40 ? "bg-yellow-50 border-yellow-200" : "bg-red-50 border-red-200"

  return (
    <div className="space-y-4">
      {/* ═══ 学生选择 + 总结卡片 ═══ */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] overflow-hidden">
        {/* 头部 */}
        <div className="p-6" style={{ background: "linear-gradient(135deg, #f8f4ff 0%, #ede9fe 50%, #f5f3ff 100%)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white ${
                report.overallScore >= 70 ? "bg-green-500" : report.overallScore >= 40 ? "bg-yellow-500" : "bg-red-400"
              }`}>
                {report.overallScore}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-800">{report.childName}</h2>
                  <select value={selectedStudent} onChange={e => handleGenerate(e.target.value)}
                    className="text-xs rounded-lg border border-gray-200 bg-white px-2 py-1 text-gray-500">
                    {students.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">思维综合指数</p>
                {report.previousScore != null && (
                  <span className={`text-xs ${report.overallScore >= report.previousScore ? "text-green-600" : "text-red-500"}`}>
                    较上期 {report.overallScore >= report.previousScore ? "↑" : "↓"}{Math.abs(report.overallScore - report.previousScore)}分
                  </span>
                )}
              </div>
            </div>
            <div className="text-right text-xs text-gray-400">
              {new Date(report.period.start).toLocaleDateString("zh")} — {new Date(report.period.end).toLocaleDateString("zh")}
            </div>
          </div>

          {/* AI 总结 */}
          <p className="text-sm text-gray-700 leading-relaxed">{report.aiSummary}</p>
        </div>

        {/* ═══ 四格快览 ═══ */}
        <div className="grid grid-cols-4 divide-x border-b">
          {[
            { icon: "🧠", label: "概念", value: report.conceptOverview.totalConcepts, sub: `掌握${report.conceptOverview.masteredCount}个`, color: "text-purple-700" },
            { icon: "🔥", label: "复习", value: `${report.reviewHealth.streak}天`, sub: `按时率${Math.round(report.reviewHealth.complianceRate * 100)}%`, color: "text-orange-700" },
            { icon: "🌟", label: "思维模式", value: `${report.thinkingStyle.radarData.length}种`, sub: report.thinkingStyle.dominantStyle, color: "text-indigo-700" },
            { icon: "📈", label: "新概念", value: report.conceptOverview.newThisWeek, sub: `复习${report.conceptOverview.reviewedThisWeek}次`, color: "text-green-700" },
          ].map((card, i) => (
            <div key={i} className="p-4 text-center">
              <div className="text-lg">{card.icon}</div>
              <div className={`text-xl font-bold mt-1 ${card.color}`}>{card.value}</div>
              <div className="text-[10px] text-gray-400">{card.sub}</div>
            </div>
          ))}
        </div>

        {/* ═══ 思维雷达 + 学科分解 ═══ */}
        <div className="grid grid-cols-2 divide-x border-b">
          {/* 思维风格雷达 */}
          <div className="p-5">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">🌟 思维风格</h3>
            <p className="text-xs text-gray-400 mb-2">{report.thinkingStyle.styleEvolution}</p>
            <div className="space-y-1.5">
              {report.thinkingStyle.radarData.slice(0, 6).map(d => (
                <div key={d.label} className="flex items-center gap-2 text-[11px]">
                  <span className="w-14 text-gray-500 truncate">{d.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-gray-100">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${(d.value / d.maxValue) * 100}%`, backgroundColor: d.color }} />
                  </div>
                  <span className="text-gray-400 w-5 text-right">{d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 学科分解 */}
          <div className="p-5">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">📚 学科分解</h3>
            <div className="space-y-2">
              {report.subjectBreakdown.map(sb => (
                <div key={sb.subject} className="flex items-center gap-2 text-[11px]">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: SUBJECT_COLORS[sb.subject] || "#8B4513" }} />
                  <span className="w-16 text-gray-600">{sb.subjectName}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                    <div className="h-full rounded-full" style={{
                      width: `${sb.averageMastery * 100}%`,
                      background: SUBJECT_COLORS[sb.subject] || "#8B4513"
                    }} />
                  </div>
                  <span className="text-gray-400 w-12 text-right">{Math.round(sb.averageMastery * 100)}%</span>
                  <span className={`text-[9px] ${sb.trend === "up" ? "text-green-500" : sb.trend === "down" ? "text-red-500" : "text-gray-300"}`}>
                    {sb.trend === "up" ? "↑" : sb.trend === "down" ? "↓" : "→"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══ 高亮 + 薄弱概念 ═══ */}
        <div className="grid grid-cols-2 divide-x border-b">
          {/* 本周亮点 */}
          <div className="p-5">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">✨ 本周亮点</h3>
            <div className="space-y-2">
              {report.highlights.length > 0 ? report.highlights.map((h, i) => (
                <div key={i} className="flex items-start gap-2 p-2.5 bg-amber-50 rounded-xl border border-amber-100">
                  <span className="text-lg shrink-0">{h.icon}</span>
                  <div>
                    <div className="text-xs font-semibold text-gray-700">{h.title}</div>
                    <div className="text-xs text-gray-500 leading-relaxed">{h.description}</div>
                  </div>
                </div>
              )) : (
                <p className="text-xs text-gray-400">继续积累，亮点会自动出现</p>
              )}
            </div>
          </div>

          {/* 薄弱概念 */}
          <div className="p-5">
            <h3 className="text-xs font-semibold text-gray-600 mb-3">🔍 需要加强</h3>
            <div className="space-y-2">
              {report.conceptOverview.weakestConcepts.length > 0 ? report.conceptOverview.weakestConcepts.map((c, i) => (
                <div key={i} className="flex items-center justify-between p-2 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <span className="text-xs font-medium text-gray-700">{c.label}</span>
                    <span className="text-[10px] text-gray-400 ml-2">{SUBJECT_COLORS[c.subject] ? "" : c.subject}</span>
                  </div>
                  <span className="text-xs font-bold text-red-500">{(c.mastery * 100).toFixed(0)}%</span>
                </div>
              )) : (
                <p className="text-xs text-green-600">没有薄弱概念！</p>
              )}
            </div>
          </div>
        </div>

        {/* ═══ 复习健康度 ═══ */}
        <div className="p-5 border-b">
          <h3 className="text-xs font-semibold text-gray-600 mb-3">📅 艾宾浩斯复习健康度</h3>
          <div className="flex items-end gap-2 h-20">
            {[1, 3, 7, 30, 90, 180, 365].map(day => {
              const entry = report.reviewHealth.ebbinghausDistribution.find(e => e.intervalDays === day)
              const completed = entry?.completed || 0
              const pending = entry?.pending || 0
              const total = completed + pending || 1
              return (
                <div key={day} className="flex-1 flex flex-col items-center">
                  <div className="text-[10px] text-gray-500 mb-1">{completed + pending}</div>
                  <div className="w-full rounded-t" style={{ height: Math.max((completed + pending) / Math.max(...report.reviewHealth.ebbinghausDistribution.map(e => e.completed + e.pending), 1) * 60, 3) }}>
                    {pending > 0 && <div className="w-full bg-red-200 rounded-t" style={{ height: `${(pending / total) * 100}%` }} />}
                    {completed > 0 && <div className="w-full bg-green-400 rounded-t" style={{ height: `${(completed / total) * 100}%` }} />}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-1">{day}天</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ═══ 给家长的建议 ═══ */}
        <div className="p-5">
          <h3 className="text-xs font-semibold text-gray-600 mb-3">💬 给家长的建议</h3>
          <div className="space-y-2">
            {report.tipsForParents.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-sm shrink-0">💡</span>
                <p className="text-xs text-gray-700 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 底部 ═══ */}
        <div className="px-5 py-3 text-center bg-gray-50 border-t border-[#e8e5df]">
          <p className="text-[10px] text-gray-400">
            报告由 AI 自动生成 · 每周一更新 · 数据来源：思见记忆宫殿
          </p>
        </div>
      </div>
    </div>
  )
}
