"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  generateStudentGrowthComparison, StudentGrowthComparison,
  captureRoleKnowledge, cloneKnowledgeTo, RoleKnowledge,
  diagnoseAIMaturity, AIMaturityReport,
  generateLessonPlan, LessonPlan,
  generateWeeklyDigest,
  generateCapabilityShowcase, CapabilityShowcase,
} from "@/lib/strategy-engine"
import { loadRooms } from "@/lib/memory-palace"
import { loadUsers } from "@/lib/sijian-user"
import { loadModules } from "@/lib/enterprise-training"

export default function StrategyDashboard() {
  const [tab, setTab] = useState<"growth" | "clone" | "maturity" | "lesson" | "digest" | "showcase">("growth")

  return (
    <div className="space-y-6">
      {/* ── 导航 ── */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-3 flex flex-wrap gap-1.5">
        {[
          { id: "growth" as const, icon: "📈", label: "学生成长对比", badge: "教育机构" },
          { id: "clone" as const, icon: "🧬", label: "知识克隆", badge: "中小企业" },
          { id: "maturity" as const, icon: "🤖", label: "AI成熟度诊断", badge: "中小企业" },
          { id: "lesson" as const, icon: "📐", label: "思维教案生成", badge: "教育机构" },
          { id: "digest" as const, icon: "💬", label: "家长周报", badge: "家长" },
          { id: "showcase" as const, icon: "🏆", label: "企业名片", badge: "中小企业" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${
              tab === t.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}>
            <span>{t.icon}</span>
            <span>{t.label}</span>
            <span className="text-[9px] bg-white/50 px-1.5 py-0.5 rounded-full hidden sm:inline">{t.badge}</span>
          </button>
        ))}
      </div>

      {tab === "growth" && <GrowthComparisonPanel />}
      {tab === "clone" && <KnowledgeClonePanel />}
      {tab === "maturity" && <MaturityDiagnosticPanel />}
      {tab === "lesson" && <LessonPlanPanel />}
      {tab === "digest" && <WeeklyDigestPanel />}
      {tab === "showcase" && <CapabilityShowcasePanel />}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// P0a: 学生成长对比
// ═══════════════════════════════════════════════════

function GrowthComparisonPanel() {
  const [students, setStudents] = useState<string[]>([])
  const [selected, setSelected] = useState("")
  const [periods, setPeriods] = useState(3)
  const [comparison, setComparison] = useState<StudentGrowthComparison | null>(null)

  useEffect(() => {
    const rooms = loadRooms()
    const names = [...new Set(rooms.map(r => r.name.split(" · ")[0]))].sort()
    setStudents(names)
    if (names.length > 0) setSelected(names[0])
  }, [])

  const handleGenerate = useCallback(() => {
    if (!selected) return
    const result = generateStudentGrowthComparison(selected, periods, 30)
    setComparison(result)
  }, [selected, periods])

  useEffect(() => { handleGenerate() }, [selected, periods, handleGenerate])

  if (students.length === 0) return (
    <div className="bg-white rounded-2xl border border-[#e8e5df] p-12 text-center">
      <div className="text-5xl mb-4 opacity-20">📊</div>
      <p className="text-gray-500 text-sm">还没有学生数据</p>
    </div>
  )

  if (!comparison) return null

  const trendColors: Record<string, string> = { strong_growth: "text-green-700 bg-green-50", steady: "text-blue-700 bg-blue-50", declining: "text-red-700 bg-red-50", inactive: "text-gray-500 bg-gray-50" }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 flex items-center gap-3 flex-wrap">
        <select value={selected} onChange={e => setSelected(e.target.value)}
          className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm font-medium">
          {students.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={periods} onChange={e => setPeriods(Number(e.target.value))}
          className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm">
          {[2, 3, 4, 6].map(p => <option key={p} value={p}>{p}个周期对比</option>)}
        </select>
        <div className="flex-1" />
        <span className={`text-xs px-3 py-1 rounded-full font-medium ${trendColors[comparison.overallTrend]}`}>
          {comparison.overallTrend === "strong_growth" ? "📈 显著进步" : comparison.overallTrend === "declining" ? "📉 需关注" : "稳定发展"}
        </span>
      </div>

      {/* 时序雷达 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 五维成长对比</h3>
        <div className="space-y-4">
          {comparison.radarDimensions.map(dim => (
            <div key={dim.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600 font-medium">{dim.label}</span>
                <span className="text-gray-400">{Math.round(dim.values[dim.values.length - 1] * 100)}%</span>
              </div>
              <div className="flex items-end gap-1 h-16">
                {dim.values.map((v, i) => {
                  const colors = ["#d4d4d4", "#a5b4fc", "#6366F1"]
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end">
                      <div className="text-[9px] text-gray-400 mb-0.5">{Math.round(v * 100)}</div>
                      <div className="w-full rounded-t transition-all duration-700"
                        style={{ height: `${(v / dim.maxValue) * 100}%`, backgroundColor: colors[i % 3] }} />
                      <div className="text-[9px] text-gray-300 mt-1">{comparison.snapshots[i]?.period.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI 总结 + 家长建议 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-4">
          <p className="text-[10px] text-blue-500 font-medium mb-1">🤖 AI 总结</p>
          <p className="text-sm text-gray-700 leading-relaxed">{comparison.aiSummary}</p>
        </div>
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4">
          <p className="text-[10px] text-green-500 font-medium mb-1">💬 给家长的建议</p>
          {comparison.parentTips.map((tip, i) => (
            <p key={i} className="text-xs text-gray-700 mb-1 last:mb-0">• {tip}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// P0b: 岗位知识克隆
// ═══════════════════════════════════════════════════

function KnowledgeClonePanel() {
  const [roleName, setRoleName] = useState("销售经理")
  const [department, setDepartment] = useState("销售部")
  const [targetName, setTargetName] = useState("新员工小王")
  const [knowledge, setKnowledge] = useState<RoleKnowledge | null>(null)
  const [cloneResult, setCloneResult] = useState<number | null>(null)
  const [cloned, setCloned] = useState(false)

  const handleCapture = () => {
    const k = captureRoleKnowledge(roleName, department)
    setKnowledge(k)
    setCloned(false)
    setCloneResult(null)
  }

  const handleClone = () => {
    if (!knowledge || !targetName.trim()) return
    const count = cloneKnowledgeTo(knowledge, targetName.trim())
    setCloneResult(count)
    setCloned(true)
  }

  return (
    <div className="space-y-4">
      {/* 捕获面板 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🧬 岗位知识捕获</h3>
        <p className="text-xs text-gray-400 mb-4">定义要克隆的岗位，系统自动从现有数据中提取该岗位的所有知识资产</p>
        <div className="flex gap-3 flex-wrap items-end">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">岗位名称</label>
            <input value={roleName} onChange={e => setRoleName(e.target.value)}
              placeholder="如：销售经理"
              className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm w-36" />
          </div>
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">部门</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm">
              {["销售部","研发部","市场部","客服部","行政部","财务部"].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <button onClick={handleCapture}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 text-sm font-medium">
            🔍 捕获知识
          </button>
        </div>
      </div>

      {/* 捕获结果 */}
      {knowledge && (
        <div className="bg-white rounded-2xl border-2 border-green-200 p-6 animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">✅ 已捕获：{knowledge.roleName} · {knowledge.department}</h3>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { label: "概念知识", value: knowledge.concepts.length, icon: "🧠" },
              { label: "工作流", value: knowledge.workflows.length, icon: "🔗" },
              { label: "决策案例", value: knowledge.decisions.length, icon: "🎯" },
              { label: "培训模块", value: knowledge.trainingModules.length, icon: "📚" },
            ].map(c => (
              <div key={c.label} className="p-3 bg-gray-50 rounded-xl text-center">
                <div className="text-lg">{c.icon}</div>
                <div className="text-xl font-bold text-gray-700">{c.value}</div>
                <div className="text-[10px] text-gray-400">{c.label}</div>
              </div>
            ))}
          </div>

          {/* AI能力分数 */}
          <div className="p-3 bg-purple-50 rounded-xl mb-4">
            <div className="text-xs text-purple-600 font-medium mb-2">AI 能力基准</div>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-gray-600">L1安全: {Math.round(knowledge.aiCapability.l1Score * 100)}%</span>
              <span className="text-gray-600">L2工具: {Math.round(knowledge.aiCapability.l2Score * 100)}%</span>
              <span className="text-gray-600">L3判断: {Math.round(knowledge.aiCapability.l3Score * 100)}%</span>
            </div>
          </div>

          {/* 克隆操作 */}
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-[10px] text-gray-400 block mb-1">目标员工姓名</label>
              <input value={targetName} onChange={e => setTargetName(e.target.value)}
                placeholder="新员工姓名"
                className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm w-44" />
            </div>
            <button onClick={handleClone} disabled={!targetName.trim()}
              className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-2 text-sm font-medium disabled:opacity-40">
              🧬 克隆到新员工
            </button>
            {cloneResult !== null && (
              <div className="p-2 bg-green-50 rounded-xl border border-green-200 text-sm text-green-700">
                ✅ 已克隆 {cloneResult} 个概念到 {targetName}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// P1a: AI 成熟度诊断
// ═══════════════════════════════════════════════════

function MaturityDiagnosticPanel() {
  const [report, setReport] = useState<AIMaturityReport | null>(null)

  useEffect(() => {
    setReport(diagnoseAIMaturity())
  }, [])

  if (!report) return null

  const levelColors: Record<string, string> = {
    beginner: "bg-gray-100 text-gray-700", developing: "bg-blue-100 text-blue-700",
    proficient: "bg-green-100 text-green-700", advanced: "bg-purple-100 text-purple-700",
    pioneer: "bg-amber-100 text-amber-700",
  }
  const levelIcons: Record<string, string> = {
    beginner: "🌱", developing: "🌿", proficient: "🌳", advanced: "💎", pioneer: "👑",
  }

  const scores = report.scores

  return (
    <div className="space-y-4">
      {/* 等级徽章 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-8 text-center">
        <div className="text-5xl mb-3">{levelIcons[report.maturityLevel]}</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-1">
          {report.companyName}
        </h2>
        <div className="inline-flex items-center gap-2 mt-2 mb-4">
          <span className={`text-lg font-bold px-4 py-1.5 rounded-full ${levelColors[report.maturityLevel]}`}>
            {report.maturityLevel === "beginner" ? "AI 入门" :
             report.maturityLevel === "developing" ? "AI 发展" :
             report.maturityLevel === "proficient" ? "AI 熟练" :
             report.maturityLevel === "advanced" ? "AI 领先" : "AI 先锋"}
          </span>
        </div>
        <div className="text-4xl font-extrabold text-indigo-700 mb-1">{scores.overallMaturity}</div>
        <div className="text-sm text-gray-500">AI 成熟度综合评分</div>
      </div>

      {/* 五维雷达 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 五维能力分</h3>
        <div className="space-y-3">
          {[
            { label: "L1 数据安全", value: scores.dataSecurity, color: "#EF4444" },
            { label: "L2 AI工具力", value: scores.aiToolProficiency, color: "#8B5CF6" },
            { label: "L3 AI判断力", value: scores.aiJudgment, color: "#6366F1" },
            { label: "L4 人机协作", value: scores.humanAICollaboration, color: "#22C55E" },
            { label: "L5 组织认知", value: scores.organizationalCognition, color: "#F59E0B" },
          ].map(d => (
            <div key={d.label} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-28">{d.label}</span>
              <div className="flex-1 h-3 rounded-full bg-gray-100">
                <div className="h-full rounded-full" style={{ width: `${d.value}%`, backgroundColor: d.color }} />
              </div>
              <span className="text-xs font-bold text-gray-700 w-10 text-right">{Math.round(d.value)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 优势/劣势 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-xl border border-green-100 p-4">
          <h4 className="text-xs font-semibold text-green-700 mb-2">✅ 优势</h4>
          {report.strengths.length > 0 ? report.strengths.map((s, i) => (
            <p key={i} className="text-xs text-gray-700 mb-1">• {s}</p>
          )) : <p className="text-xs text-gray-400">暂无显著优势，开始建设即可积累</p>}
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4">
          <h4 className="text-xs font-semibold text-red-700 mb-2">⚠️ 待改进</h4>
          {report.weaknesses.length > 0 ? report.weaknesses.map((w, i) => (
            <p key={i} className="text-xs text-gray-700 mb-1">• {w}</p>
          )) : <p className="text-xs text-green-600">各方面表现均衡</p>}
        </div>
      </div>

      {/* ROI 预估 */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border border-amber-100 p-4">
        <h4 className="text-xs font-semibold text-amber-700 mb-2">💰 投资回报预估</h4>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="p-2 bg-white/60 rounded-lg">
            <div className="text-amber-600 font-medium">时间节省</div>
            <div className="text-gray-700 mt-0.5">{report.roiProjection.timeSaved}</div>
          </div>
          <div className="p-2 bg-white/60 rounded-lg">
            <div className="text-amber-600 font-medium">成本降低</div>
            <div className="text-gray-700 mt-0.5">{report.roiProjection.costReduction}</div>
          </div>
          <div className="p-2 bg-white/60 rounded-lg">
            <div className="text-amber-600 font-medium">收入提升</div>
            <div className="text-gray-700 mt-0.5">{report.roiProjection.revenueUplift}</div>
          </div>
        </div>
      </div>

      {/* 12周路线图 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📅 12 周 AI 提升路线图</h3>
        <div className="space-y-0">
          {report.weekByWeekPlan.slice(0, 12).map(w => (
            <div key={w.week} className="flex items-start gap-3 py-2 border-b border-gray-50 last:border-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                {w.week}
              </div>
              <div>
                <div className="text-xs font-semibold text-gray-700">{w.title}</div>
                <div className="text-[10px] text-gray-400">{w.action}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700">
          预计 {report.estimatedTimeToNextLevel} 周后达到下一成熟度等级
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// P1b: 思维教案生成
// ═══════════════════════════════════════════════════

function LessonPlanPanel() {
  const [topic, setTopic] = useState("")
  const [subject, setSubject] = useState("mathematics")
  const [grade, setGrade] = useState("高三")
  const [duration, setDuration] = useState(45)
  const [plan, setPlan] = useState<LessonPlan | null>(null)

  const handleGenerate = () => {
    if (!topic.trim()) return
    setPlan(generateLessonPlan(topic.trim(), subject, grade, duration))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📐 AI 思维教案生成器</h3>
        <p className="text-xs text-gray-400 mb-4">输入教学主题，AI 自动生成包含思维训练环节的完整教案</p>
        <div className="flex gap-3 flex-wrap items-end">
          <input value={topic} onChange={e => setTopic(e.target.value)}
            placeholder="教学主题，如：三角函数的应用"
            className="flex-1 min-w-[200px] rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm"
            onKeyDown={e => e.key === "Enter" && handleGenerate()} />
          <select value={subject} onChange={e => setSubject(e.target.value)}
            className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm">
            {[{v:"mathematics",l:"数学"},{v:"physics",l:"物理"},{v:"chemistry",l:"化学"},{v:"biology",l:"生物"},{v:"chinese",l:"语文"},{v:"english",l:"英语"},{v:"history",l:"历史"}].map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
          <select value={grade} onChange={e => setGrade(e.target.value)}
            className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm">
            {["小学","初中","高一","高二","高三","大学"].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={duration} onChange={e => setDuration(Number(e.target.value))}
            className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm">
            {[30,45,60,90].map(d => <option key={d} value={d}>{d}分钟</option>)}
          </select>
          <button onClick={handleGenerate} disabled={!topic.trim()}
            className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40">
            🪄 生成教案
          </button>
        </div>
      </div>

      {plan && (
        <div className="space-y-4">
          {/* 教案头部 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-800">{plan.topic}</h2>
                <p className="text-xs text-gray-400">{plan.subject} · {plan.grade} · {plan.duration}分钟</p>
              </div>
              <button onClick={() => {
                const text = [
                  `教案：${plan.topic}`,
                  `学科：${plan.subject} · 年级：${plan.grade} · 时长：${plan.duration}分钟`,
                  "",
                  `教学目标：`,
                  ...plan.objectives.map((o, i) => `${i + 1}. ${o}`),
                  "",
                  `教学环节：`,
                  ...plan.sections.map(s => `【${s.title}】${s.content}`),
                ].join("\n")
                navigator.clipboard.writeText(text)
              }} className="text-xs text-gray-400 hover:text-gray-600 border px-3 py-1 rounded-lg">📋 复制教案</button>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <p className="font-medium text-gray-700">教学目标：</p>
              {plan.objectives.map((o, i) => <p key={i}>• {o}</p>)}
            </div>
          </div>

          {/* 教学环节 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📖 教学环节</h3>
            {plan.sections.map((sec, i) => (
              <div key={i} className="mb-4 last:mb-0 p-4 rounded-xl border border-[#e8e5df]"
                style={{ borderLeftWidth: "4px", borderLeftColor: ["#6366F1","#22C55E","#F59E0B","#EC4899","#8B5CF6"][i] }}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-semibold text-gray-800">{sec.title}</h4>
                  <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">{sec.timeAllocation}分钟</span>
                </div>
                <p className="text-xs text-gray-600 mb-2">{sec.content}</p>
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <p className="text-[10px] text-indigo-500 font-medium mb-0.5">👩‍🏫 教学指导</p>
                  <p className="text-xs text-gray-700">{sec.teacherGuidance}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 思维练习 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🧠 思维训练练习</h3>
            <div className="grid grid-cols-3 gap-3">
              {plan.thinkingExercises.map((ex, i) => (
                <div key={i} className="p-4 rounded-xl border border-[#e8e5df] bg-gray-50">
                  <div className="text-xs font-semibold text-gray-700 mb-1">{ex.title}</div>
                  <div className="text-[10px] text-gray-400 mb-2">{ex.type}</div>
                  <p className="text-xs text-gray-600 mb-2">{ex.prompt}</p>
                  <div className="text-[10px] text-gray-400">🎯 {ex.expectedOutcome}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// P2a: 家长每周推送
// ═══════════════════════════════════════════════════

function WeeklyDigestPanel() {
  const [childName, setChildName] = useState("")
  const [digest, setDigest] = useState<any>(null)
  const [students, setStudents] = useState<string[]>([])

  useEffect(() => {
    const rooms = loadRooms()
    const names = [...new Set(rooms.map(r => r.name.split(" · ")[0]))].sort()
    setStudents(names)
    if (names.length > 0) setChildName(names[0])
  }, [])

  const handleGenerate = () => {
    if (!childName) return
    setDigest(generateWeeklyDigest(childName))
  }

  useEffect(() => { handleGenerate() }, [childName])

  if (students.length === 0) return (
    <div className="bg-white rounded-2xl border border-[#e8e5df] p-12 text-center">
      <p className="text-gray-500 text-sm">还没有学生数据</p>
    </div>
  )

  if (!digest) return null

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 flex items-center gap-3">
        <select value={childName} onChange={e => setChildName(e.target.value)}
          className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm">
          {students.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">{digest.weekLabel}</span>
      </div>

      {/* 亮点卡片 */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6">
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-800">{digest.childName} 的每周思维简报</h2>
          <p className="text-xs text-gray-400">{digest.weekLabel}</p>
        </div>
        <div className="flex items-center justify-center gap-1 mb-4">
          {digest.thinkingModes.map((m: string, i: number) => (
            <span key={m} className="text-xs px-2.5 py-1 rounded-full border"
              style={{ borderColor: ["#6366F1","#EC4899","#F59E0B"][i], color: ["#6366F1","#EC4899","#F59E0B"][i] }}>
              {m}
            </span>
          ))}
        </div>
        <div className="space-y-2 mb-4">
          {digest.highlights.map((h: any, i: number) => (
            <div key={i} className="flex items-start gap-2 p-2.5 bg-white rounded-lg">
              <span className="text-lg">{h.icon}</span>
              <div><span className="text-xs font-medium text-gray-700">{h.title}</span>
                <p className="text-[11px] text-gray-500">{h.detail}</p></div>
            </div>
          ))}
        </div>
        <div className="p-3 bg-white rounded-xl text-center">
          <p className="text-xs text-gray-600">💬 {digest.suggestion}</p>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════
// P2b: 企业能力名片
// ═══════════════════════════════════════════════════

function CapabilityShowcasePanel() {
  const [showcase, setShowcase] = useState<CapabilityShowcase | null>(null)

  useEffect(() => {
    setShowcase(generateCapabilityShowcase())
  }, [])

  if (!showcase) return (
    <div className="bg-white rounded-2xl border border-[#e8e5df] p-12 text-center">
      <p className="text-gray-500 text-sm">请先创建机构账号</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-8 text-white text-center"
        style={{ background: `linear-gradient(135deg, ${showcase.primaryColor}, ${showcase.primaryColor}cc)` }}>
        <div className="text-5xl mb-3">🏢</div>
        <h1 className="text-2xl font-bold mb-1">{showcase.companyName}</h1>
        <p className="text-sm opacity-80 mb-4">{showcase.slogan}</p>
        <div className="inline-block bg-white/20 rounded-full px-4 py-1.5 text-sm font-medium">
          {showcase.aiMaturity.badge}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-3">
        {showcase.stats.map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-[#e8e5df] p-4 text-center">
            <div className="text-lg">{s.icon}</div>
            <div className="text-xl font-bold text-gray-800 mt-1">{s.value}</div>
            <div className="text-[10px] text-gray-400">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-[#e8e5df] p-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">🧬 知识资产</h4>
          {showcase.knowledgeAssets.map(a => (
            <div key={a.type} className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-gray-600">{a.icon} {a.type}</span>
              <span className="font-bold text-gray-700">{a.count}</span>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-[#e8e5df] p-4">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">🏆 核心优势</h4>
          {showcase.topSkills.length > 0 ? showcase.topSkills.map((s, i) => (
            <p key={i} className="text-xs text-gray-600 mb-1">• {s}</p>
          )) : <p className="text-xs text-gray-400">开始AI能力建设后自动生成</p>}
          <div className="mt-3 pt-3 border-t border-gray-100">
            {showcase.certifications.map((c, i) => (
              <span key={i} className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full mr-1">{c}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl border border-gray-200 p-4 text-center">
        <p className="text-xs text-gray-400">📊 {showcase.contactIntent}</p>
        <button onClick={() => {
          const text = JSON.stringify(showcase, null, 2)
          navigator.clipboard.writeText(text)
        }} className="mt-2 text-xs text-indigo-500 hover:text-indigo-700">📋 复制名片数据</button>
      </div>
    </div>
  )
}
