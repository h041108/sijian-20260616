"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  TrainingModule, EmployeeRecord, TrainingPoint, AssessmentQuestion,
  loadModules, createModule, deleteModule as deleteTrainingModule,
  loadRecords, assignTraining, startTraining, updatePointMastery,
  submitAssessment, getEnterpriseDashboard,
  EnterpriseDashboard,
  seedEnterpriseData,
} from "@/lib/enterprise-training"

// ─── 工具函数 ─────────────────────────────────

const DEPARTMENTS = ["全员", "研发部", "市场部", "销售部", "行政部", "客服部", "财务部", "人事部"]
const CATEGORIES = ["入职培训", "定期复训", "专项提升", "合规培训"]
const CATEGORY_COLORS: Record<string, string> = {
  "入职培训": "bg-blue-100 text-blue-700 border-blue-200",
  "定期复训": "bg-orange-100 text-orange-700 border-orange-200",
  "专项提升": "bg-purple-100 text-purple-700 border-purple-200",
  "合规培训": "bg-red-100 text-red-700 border-red-200",
}
const IMPORTANCE_COLORS: Record<string, string> = {
  critical: "text-red-600 bg-red-50",
  important: "text-orange-600 bg-orange-50",
  nice_to_have: "text-gray-500 bg-gray-50",
}

// ─── 主组件 ──────────────────────────────────

export default function EnterpriseMemoryPalace() {
  const [modules, setModules] = useState<TrainingModule[]>([])
  const [records, setRecords] = useState<EmployeeRecord[]>([])
  const [view, setView] = useState<"modules" | "employees" | "assessment" | "dashboard">("modules")
  const [dashboard, setDashboard] = useState<EnterpriseDashboard | null>(null)

  // 创建模块表单
  const [showCreate, setShowCreate] = useState(false)
  const [newModName, setNewModName] = useState("")
  const [newModDept, setNewModDept] = useState("全员")
  const [newModCat, setNewModCat] = useState("入职培训")
  const [newModDesc, setNewModDesc] = useState("")
  const [newModPassScore, setNewModPassScore] = useState(70)
  const [newPoints, setNewPoints] = useState<{ label: string; content: string; importance: TrainingPoint["importance"] }[]>([])

  // 详情/考核视图
  const [selectedModule, setSelectedModule] = useState<TrainingModule | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRecord | null>(null)
  const [quizModule, setQuizModule] = useState<TrainingModule | null>(null)
  const [quizEmployee, setQuizEmployee] = useState<string>("")
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({})
  const [quizResult, setQuizResult] = useState<{ score: number; passed: boolean } | null>(null)
  const [quizStartTime] = useState(() => Date.now())

  // 知识导入
  const [showKnowledgeImport, setShowKnowledgeImport] = useState(false)
  const [importPointLabel, setImportPointLabel] = useState("")
  const [importPointContent, setImportPointContent] = useState("")
  const [importPointImportance, setImportPointImportance] = useState<TrainingPoint["importance"]>("important")

  const refresh = useCallback(() => {
    setModules(loadModules())
    setRecords(loadRecords())
  }, [])

  useEffect(() => {
    seedEnterpriseData()
    refresh()
  }, [])

  // ── 创建培训模块 ──
  const handleCreate = () => {
    if (!newModName.trim() || newPoints.length === 0) return
    createModule(newModName.trim(), newModDept, newModCat, newModDesc.trim(),
      newPoints.map(p => ({ label: p.label, content: p.content, importance: p.importance })),
      newModPassScore / 100)
    setShowCreate(false)
    setNewModName(""); setNewModDept("全员"); setNewModCat("入职培训"); setNewModDesc("")
    setNewPoints([]); setNewModPassScore(70)
    refresh()
  }

  const addPoint = () => {
    if (!importPointLabel.trim() || !importPointContent.trim()) return
    setNewPoints(prev => [...prev, { label: importPointLabel.trim(), content: importPointContent.trim(), importance: importPointImportance }])
    setImportPointLabel(""); setImportPointContent(""); setImportPointImportance("important")
  }

  const removePoint = (idx: number) => {
    setNewPoints(prev => prev.filter((_, i) => i !== idx))
  }

  // ── 考核 ──
  const handleStartQuiz = (mod: TrainingModule, empId: string) => {
    setQuizModule(mod)
    setQuizEmployee(empId)
    setQuizAnswers({})
    setQuizResult(null)
  }

  const handleQuizSubmit = () => {
    if (!quizModule || !quizEmployee) return
    const timeSpent = Math.floor((Date.now() - quizStartTime) / 1000)
    const result = submitAssessment(quizEmployee, quizModule.id, quizAnswers, timeSpent)
    setQuizResult({ score: result.score, passed: result.passed })
    refresh()
  }

  // ── 聚合数据 ──
  const stats = useMemo(() => {
    let totalAssigned = 0, totalCompleted = 0, totalOverdue = 0
    for (const rec of records) {
      for (const tp of rec.trainings) {
        totalAssigned++
        if (tp.status === "completed") totalCompleted++
        if (tp.status === "overdue") totalOverdue++
      }
    }
    return { totalAssigned, totalCompleted, totalOverdue, totalEmployees: records.length, totalModules: modules.length }
  }, [records, modules])

  // ── 模块的完整信息 ──
  const getModuleProgress = useCallback((modId: string) => {
    let assigned = 0, completed = 0, inProgress = 0
    for (const rec of records) {
      const tp = rec.trainings.find(t => t.trainingModuleId === modId)
      if (tp) {
        assigned++
        if (tp.status === "completed") completed++
        if (tp.status === "in_progress") inProgress++
      }
    }
    return { assigned, completed, inProgress }
  }, [records])

  // 获取员工在某模块的进度
  const getEmployeeModuleProgress = useCallback((empId: string, modId: string) => {
    const rec = records.find(r => r.employeeId === empId)
    if (!rec) return null
    return rec.trainings.find(t => t.trainingModuleId === modId) || null
  }, [records])

  // ── 分配培训 ──
  const handleAssign = (modId: string, empId: string, empName: string, dept: string) => {
    assignTraining(empId, empName, dept, modId, 14)
    refresh()
  }

  return (
    <div className="space-y-6">
      {/* ── 顶部导航 ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border border-[#e8e5df] p-4">
        <button onClick={() => setView("modules")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "modules" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          📚 培训模块
        </button>
        <button onClick={() => setView("employees")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "employees" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          👥 员工进度
        </button>
        <button onClick={() => setView("assessment")}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "assessment" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          📝 考核中心
        </button>
        <button onClick={() => { setView("dashboard"); setDashboard(getEnterpriseDashboard()) }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "dashboard" ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          📊 培训分析
        </button>
        <div className="flex-1" />
        <button onClick={() => setShowCreate(true)}
          className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium transition-all">
          + 新建培训模块
        </button>
        <span className="text-xs text-gray-400">{stats.totalModules}模块 · {stats.totalEmployees}员工</span>
      </div>

      {/* ── 创建模块弹窗 ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[720px] max-h-[85vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-800 mb-6">📚 新建培训模块</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">模块名称</label>
                <input value={newModName} onChange={e => setNewModName(e.target.value)}
                  placeholder="如：新员工信息安全培训"
                  className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">目标部门</label>
                <select value={newModDept} onChange={e => setNewModDept(e.target.value)}
                  className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-700">
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">培训类别</label>
                <select value={newModCat} onChange={e => setNewModCat(e.target.value)}
                  className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-700">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">通过分数线 (%)</label>
                <input type="number" min={50} max={100} value={newModPassScore}
                  onChange={e => setNewModPassScore(Number(e.target.value))}
                  className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-300" />
              </div>
            </div>
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1 block">模块描述</label>
              <input value={newModDesc} onChange={e => setNewModDesc(e.target.value)}
                placeholder="简要描述培训目标和内容"
                className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
            </div>

            {/* 知识点列表 */}
            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-2 block">培训知识点 ({newPoints.length})</label>
              {newPoints.length > 0 && (
                <div className="space-y-2 mb-3 max-h-[200px] overflow-y-auto">
                  {newPoints.map((p, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-[#e8e5df]">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${p.importance === "critical" ? "bg-red-100 text-red-600" : p.importance === "important" ? "bg-orange-100 text-orange-600" : "bg-gray-200 text-gray-500"}`}>
                        {p.importance === "critical" ? "关键" : p.importance === "important" ? "重要" : "了解"}
                      </span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-700">{p.label}</div>
                        <div className="text-xs text-gray-400 truncate">{p.content.slice(0, 50)}</div>
                      </div>
                      <button onClick={() => removePoint(i)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-end">
                <input value={importPointLabel} onChange={e => setImportPointLabel(e.target.value)}
                  placeholder="知识点标签(≤6字)" className="flex-1 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                <input value={importPointContent} onChange={e => setImportPointContent(e.target.value)}
                  placeholder="内容描述" className="flex-[2] rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                <select value={importPointImportance} onChange={e => setImportPointImportance(e.target.value as TrainingPoint["importance"])}
                  className="w-20 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-2 py-2 text-xs text-gray-700">
                  <option value="critical">关键</option>
                  <option value="important">重要</option>
                  <option value="nice_to_have">了解</option>
                </select>
                <button onClick={addPoint}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-all whitespace-nowrap">
                  + 添加
                </button>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowCreate(false)}
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 text-sm font-medium transition-all">取消</button>
              <button onClick={handleCreate} disabled={!newModName.trim() || newPoints.length === 0}
                className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-40">创建培训模块</button>
            </div>
          </div>
        </div>
      )}

      {/* ── 1. 培训模块视图 ── */}
      {view === "modules" && (
        <div className="space-y-4">
          {modules.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#e8e5df]">
              <div className="text-5xl mb-4 opacity-20">📚</div>
              <p className="text-gray-500 text-sm">还没有培训模块</p>
              <p className="text-xs text-gray-400 mt-1">点击右上角"新建培训模块"开始</p>
            </div>
          ) : (
            modules.map(mod => {
              const prog = getModuleProgress(mod.id)
              return (
                <div key={mod.id} className="bg-white rounded-2xl border border-[#e8e5df] p-6 hover:border-orange-200 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-800">{mod.name}</h3>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[mod.category] || "bg-gray-100"}`}>{mod.category}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{mod.department}</span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">{mod.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>📌 {mod.knowledgePoints.length} 知识点</span>
                        <span>📝 {mod.assessment.questions.length} 考核题</span>
                        <span className="text-orange-600 font-medium">分数线 {Math.round(mod.passScore * 100)}%</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedModule(selectedModule?.id === mod.id ? null : mod)}
                        className="text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-[#e8e5df] transition-all">
                        {selectedModule?.id === mod.id ? "收起" : "展开详情"}
                      </button>
                      <button onClick={() => { deleteTrainingModule(mod.id); refresh(); }}
                        className="text-xs text-red-400 hover:text-red-600 px-2 py-1">删除</button>
                    </div>
                  </div>

                  {/* 进度条 */}
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${prog.assigned > 0 ? (prog.completed / prog.assigned) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-500 shrink-0">{prog.completed}/{prog.assigned}</span>
                  </div>
                  <div className="text-[10px] text-gray-400">{prog.assigned} 分配 · {prog.completed} 完成 · {prog.inProgress} 进行中</div>

                  {/* 展开详情 */}
                  {selectedModule?.id === mod.id && (
                    <div className="mt-5 pt-4 border-t border-[#e8e5df]">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">📖 知识点列表</h4>
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        {mod.knowledgePoints.map(kp => (
                          <div key={kp.id} className="p-3 rounded-xl border border-[#e8e5df] bg-gray-50">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded ${IMPORTANCE_COLORS[kp.importance]}`}>
                                {kp.importance === "critical" ? "关键" : kp.importance === "important" ? "重要" : "了解"}
                              </span>
                              <span className="text-sm font-medium text-gray-700">{kp.label}</span>
                            </div>
                            <p className="text-xs text-gray-500 leading-relaxed">{kp.content}</p>
                          </div>
                        ))}
                      </div>

                      <h4 className="text-sm font-semibold text-gray-700 mb-3">📝 考核样题</h4>
                      <div className="space-y-3">
                        {mod.assessment.questions.slice(0, 3).map((q, qi) => (
                          <div key={q.id} className="p-3 rounded-xl border border-[#e8e5df]">
                            <p className="text-sm text-gray-700 mb-2">{qi + 1}. {q.question}</p>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt, oi) => (
                                <div key={oi} className={`text-xs p-2 rounded-lg ${oi === q.correctIndex ? "bg-green-50 border border-green-200 text-green-700" : "bg-gray-50 border border-gray-100 text-gray-500"}`}>
                                  {String.fromCharCode(65 + oi)}. {opt}
                                </div>
                              ))}
                            </div>
                            <p className="text-[10px] text-green-600 mt-1">解析: {q.explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* ── 2. 员工进度视图 ── */}
      {view === "employees" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700">👥 员工培训进度</h3>
              <span className="text-xs text-gray-400">{records.length} 人</span>
            </div>
            {records.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">暂无员工数据</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-400 border-b border-gray-100">
                      <th className="pb-2 text-left font-medium">员工</th>
                      <th className="pb-2 text-left font-medium">部门</th>
                      <th className="pb-2 font-medium">培训数</th>
                      <th className="pb-2 font-medium">已完成</th>
                      <th className="pb-2 font-medium">掌握度</th>
                      <th className="pb-2 font-medium">进度</th>
                      <th className="pb-2 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map(rec => {
                      const completed = rec.trainings.filter(t => t.status === "completed").length
                      const avgMastery = rec.trainings.length > 0
                        ? rec.trainings.reduce((s, t) => s + t.overallMastery, 0) / rec.trainings.length
                        : 0
                      const hasOverdue = rec.trainings.some(t => t.status === "overdue")
                      return (
                        <tr key={rec.employeeId} className="border-b border-gray-50 hover:bg-orange-50 cursor-pointer transition-colors"
                          onClick={() => setSelectedEmployee(selectedEmployee?.employeeId === rec.employeeId ? null : rec)}>
                          <td className="py-2.5 font-medium text-gray-800">{rec.employeeName}</td>
                          <td className="py-2.5 text-xs text-gray-500">{rec.department}</td>
                          <td className="py-2.5 text-center text-xs">{rec.trainings.length}</td>
                          <td className="py-2.5 text-center text-xs">{completed}</td>
                          <td className="py-2.5 text-center">
                            <span className={`text-xs font-medium ${avgMastery >= 0.7 ? "text-green-600" : avgMastery >= 0.4 ? "text-yellow-600" : "text-red-600"}`}>
                              {Math.round(avgMastery * 100)}%
                            </span>
                          </td>
                          <td className="py-2.5">
                            <div className="w-20 h-1.5 rounded-full bg-gray-100 mx-auto">
                              <div className={`h-full rounded-full ${avgMastery >= 0.7 ? "bg-green-500" : avgMastery >= 0.4 ? "bg-yellow-500" : "bg-red-500"}`}
                                style={{ width: `${avgMastery * 100}%` }} />
                            </div>
                          </td>
                          <td className="py-2.5 text-center">
                            {hasOverdue ? (
                              <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">有逾期</span>
                            ) : completed === rec.trainings.length && rec.trainings.length > 0 ? (
                              <span className="text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">全部完成</span>
                            ) : (
                              <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">进行中</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 员工详情 */}
          {selectedEmployee && (
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 {selectedEmployee.employeeName} 的培训详情</h3>
              <div className="space-y-3">
                {selectedEmployee.trainings.map(tp => {
                  const mod = modules.find(m => m.id === tp.trainingModuleId)
                  const lastAttempt = tp.assessmentAttempts[tp.assessmentAttempts.length - 1]
                  return (
                    <div key={tp.trainingModuleId} className={`p-4 rounded-xl border ${
                      tp.status === "completed" ? "border-green-200 bg-green-50" :
                      tp.status === "overdue" ? "border-red-200 bg-red-50" :
                      tp.status === "in_progress" ? "border-blue-200 bg-blue-50" :
                      "border-[#e8e5df] bg-gray-50"
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{mod?.name || tp.trainingModuleId}</span>
                          <span className="text-xs text-gray-400 ml-2">{mod?.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {tp.status !== "completed" && (
                            <button onClick={() => { handleStartQuiz(mod!, selectedEmployee.employeeId) }}
                              className="text-xs bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-lg transition-all">
                              开始考核
                            </button>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            tp.status === "completed" ? "bg-green-200 text-green-700" :
                            tp.status === "overdue" ? "bg-red-200 text-red-700" :
                            tp.status === "in_progress" ? "bg-blue-200 text-blue-700" :
                            "bg-gray-200 text-gray-600"
                          }`}>
                            {tp.status === "assigned" ? "未开始" : tp.status === "in_progress" ? "进行中" : tp.status === "completed" ? "已完成" : "已逾期"}
                          </span>
                        </div>
                      </div>
                      {/* 知识点掌握度 */}
                      {Object.keys(tp.pointMastery).length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          {Object.entries(tp.pointMastery).map(([pid, mastery]) => {
                            const kp = mod?.knowledgePoints.find(k => k.id === pid)
                            return (
                              <div key={pid} className="flex items-center gap-2 text-[11px]">
                                <span className="text-gray-600 truncate">{kp?.label || pid}</span>
                                <div className="flex-1 h-1 rounded-full bg-gray-200">
                                  <div className={`h-full rounded-full ${mastery >= 0.7 ? "bg-green-400" : mastery >= 0.4 ? "bg-yellow-400" : "bg-red-400"}`}
                                    style={{ width: `${mastery * 100}%` }} />
                                </div>
                                <span className="text-gray-400">{(mastery * 100).toFixed(0)}%</span>
                              </div>
                            )
                          })}
                        </div>
                      )}
                      {/* 考核记录 */}
                      {tp.assessmentAttempts.length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          最近考核: {new Date(lastAttempt.date).toLocaleDateString("zh")} · 得分 {(lastAttempt.score * 100).toFixed(0)}% · {lastAttempt.passed ? "✅ 通过" : "❌ 未通过"}
                        </div>
                      )}
                      {tp.dueDate && (
                        <div className="text-[10px] text-gray-400 mt-1">截止: {new Date(tp.dueDate).toLocaleDateString("zh")}</div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── 3. 考核中心 ── */}
      {view === "assessment" && (
        <div className="space-y-4">
          {/* 考核弹窗 */}
          {quizModule && quizEmployee && !quizResult && (
            <div className="bg-white rounded-2xl border-2 border-orange-300 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-800">📝 {quizModule.name} — 结业考核</h3>
                <button onClick={() => { setQuizModule(null); setQuizEmployee(""); setQuizAnswers({}) }}
                  className="text-xs text-gray-400 hover:text-red-500">退出考核</button>
              </div>
              <p className="text-xs text-gray-400 mb-4">
                共 {quizModule.assessment.questions.length} 题 · 通过分数 {Math.round(quizModule.passScore * 100)}% · {quizModule.assessment.timeLimit ? `限时 ${quizModule.assessment.timeLimit} 分钟` : "不限时"}
              </p>
              <div className="space-y-5">
                {quizModule.assessment.questions.map((q, qi) => (
                  <div key={q.id} className="p-4 rounded-xl border border-[#e8e5df]">
                    <p className="text-sm font-medium text-gray-800 mb-3">{qi + 1}. {q.question}</p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => {
                        const selected = quizAnswers[q.id] === oi
                        return (
                          <button key={oi} onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oi }))}
                            className={`text-left text-sm p-2.5 rounded-lg border transition-all ${
                              selected ? "border-orange-400 bg-orange-50 text-orange-800" : "border-gray-200 bg-gray-50 text-gray-600 hover:border-orange-200"
                            }`}>
                            <span className="font-medium mr-1.5">{String.fromCharCode(65 + oi)}.</span>
                            {opt}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => { setQuizModule(null); setQuizEmployee(""); setQuizAnswers({}) }}
                  className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 text-sm font-medium transition-all">取消</button>
                <button onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length < quizModule.assessment.questions.length}
                  className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 text-sm font-medium transition-all disabled:opacity-40">
                  提交答案 ({Object.keys(quizAnswers).length}/{quizModule.assessment.questions.length})
                </button>
              </div>
            </div>
          )}

          {/* 考核结果 */}
          {quizResult && quizModule && (
            <div className={`bg-white rounded-2xl border-2 p-8 text-center ${quizResult.passed ? "border-green-300" : "border-red-300"}`}>
              <div className="text-6xl mb-4">{quizResult.passed ? "🎉" : "📚"}</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                {quizResult.passed ? "考核通过！" : "考核未通过"}
              </h2>
              <p className="text-3xl font-bold mb-2" style={{ color: quizResult.passed ? "#16a34a" : "#dc2626" }}>
                {Math.round(quizResult.score * 100)}%
              </p>
              <p className="text-sm text-gray-500 mb-4">
                通过线 {Math.round(quizModule.passScore * 100)}% · {quizResult.passed ? "恭喜完成培训！" : "需要重新学习后再次考核"}
              </p>
              <button onClick={() => { setQuizModule(null); setQuizEmployee(""); setQuizAnswers({}); setQuizResult(null); refresh() }}
                className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 text-sm font-medium transition-all">
                关闭
              </button>
            </div>
          )}

          {/* 可考核列表 */}
          {!quizModule && (
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">📝 选择员工和培训模块进行考核</h3>
              {records.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">暂无员工数据</p>
              ) : (
                <div className="space-y-3">
                  {records.map(rec => (
                    <div key={rec.employeeId} className="p-4 rounded-xl border border-[#e8e5df]">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-sm font-semibold text-gray-800">{rec.employeeName}</span>
                          <span className="text-xs text-gray-400 ml-2">{rec.department}</span>
                        </div>
                        <span className="text-xs text-gray-400">{rec.trainings.length} 培训</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {rec.trainings
                          .filter(t => t.status !== "completed")
                          .map(tp => {
                            const mod = modules.find(m => m.id === tp.trainingModuleId)
                            return (
                              <button key={tp.trainingModuleId}
                                onClick={() => handleStartQuiz(mod!, rec.employeeId)}
                                className="text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-1.5 rounded-lg border border-orange-200 transition-all">
                                📝 {mod?.name || tp.trainingModuleId}
                              </button>
                            )
                          })}
                        {rec.trainings.filter(t => t.status !== "completed").length === 0 && (
                          <span className="text-xs text-green-600">✅ 所有培训已完成</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 4. 培训分析看板 ── */}
      {view === "dashboard" && (
        <div className="space-y-6">
          {/* 概览卡片 */}
          <div className="grid grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
              <div className="text-2xl font-bold text-orange-700">{dashboard?.totalEmployees || 0}</div>
              <div className="text-xs text-orange-500 mt-1">总员工</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{dashboard?.totalModules || 0}</div>
              <div className="text-xs text-purple-500 mt-1">培训模块</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{dashboard?.totalCompleted || 0}</div>
              <div className="text-xs text-green-500 mt-1">已完成</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{dashboard?.totalInProgress || 0}</div>
              <div className="text-xs text-blue-500 mt-1">进行中</div>
            </div>
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{dashboard?.totalOverdue || 0}</div>
              <div className="text-xs text-red-500 mt-1">逾期</div>
            </div>
          </div>

          {/* 部门统计 */}
          {dashboard?.departmentStats && dashboard.departmentStats.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">🏢 部门培训统计</h3>
              <div className="space-y-3">
                {dashboard.departmentStats.map(dept => (
                  <div key={dept.department} className="flex items-center gap-4 p-3 rounded-xl border border-[#e8e5df]">
                    <span className="text-sm font-medium text-gray-700 w-20">{dept.department}</span>
                    <span className="text-xs text-gray-400 w-16">{dept.employeeCount} 人</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-100">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${dept.completedRate * 100}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 w-10">{(dept.completedRate * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <span className={`text-xs font-medium ${dept.avgMastery >= 0.7 ? "text-green-600" : dept.avgMastery >= 0.4 ? "text-yellow-600" : "text-red-600"}`}>
                      均掌握 {(dept.avgMastery * 100).toFixed(0)}%
                    </span>
                    {dept.overdueCount > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⚠️ {dept.overdueCount}逾期</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 模块统计 */}
          {dashboard?.moduleStats && dashboard.moduleStats.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">📚 模块完成率</h3>
              <div className="grid grid-cols-2 gap-3">
                {dashboard.moduleStats.map(mod => (
                  <div key={mod.moduleId} className="p-4 rounded-xl border border-[#e8e5df]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{mod.moduleName}</span>
                      <span className="text-xs text-gray-400">{mod.department}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                      <span>👥 {mod.assignedCount}</span>
                      <span className="text-green-600">✅ {mod.completedCount}</span>
                      <span className="text-blue-600">🔄 {mod.inProgressCount}</span>
                      {mod.avgScore > 0 && <span>均分 {(mod.avgScore * 100).toFixed(0)}%</span>}
                    </div>
                    <div className="h-2 rounded-full bg-gray-100">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: `${mod.assignedCount > 0 ? (mod.completedCount / mod.assignedCount) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 薄弱知识点 + 最近完成 */}
          <div className="grid grid-cols-2 gap-6">
            {dashboard?.weakestPoints && dashboard.weakestPoints.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">🔴 薄弱知识点</h3>
                <div className="space-y-2">
                  {dashboard.weakestPoints.slice(0, 8).map(wp => (
                    <div key={wp.label} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{wp.label}</span>
                        <span className="text-xs text-gray-400 ml-2">{wp.employeeCount}人</span>
                      </div>
                      <span className="text-xs font-medium text-red-600">{(wp.avgMastery * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {dashboard?.recentCompletions && dashboard.recentCompletions.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">🟢 最近完成</h3>
                <div className="space-y-2">
                  {dashboard.recentCompletions.slice(0, 8).map((rc, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-100">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{rc.employeeName}</span>
                        <span className="text-xs text-gray-400 ml-2">{rc.moduleName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{new Date(rc.date).toLocaleDateString("zh")}</span>
                        <span className="text-xs font-medium text-green-600">{(rc.score * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
