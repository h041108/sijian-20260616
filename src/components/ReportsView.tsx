"use client"

import { useState, useEffect, useMemo } from "react"
import { loadRooms, getTeacherDashboard } from "@/lib/memory-palace"
import { getMyStudents, getMyChildren, getCurrentUser } from "@/lib/sijian-user"
import GrowthViewer from "@/components/GrowthViewer"
import { STUDENT_GROWTH_DATA } from "@/lib/growth-data"
import type { EmployeeRecord } from "@/lib/enterprise-training"
import { loadModules, loadRecords, getEnterpriseDashboard } from "@/lib/enterprise-training"
import { loadL1Attempts, loadL2Submissions, loadL3Attempts } from "@/lib/enterprise-ai-capability"
import { loadInstitution, getInstitutionDashboard } from "@/lib/institution"
import { loadUsers } from "@/lib/sijian-user"

interface Props {
  role: "education" | "enterprise"
}

const subjectNameMap: Record<string, string> = {
  mathematics: "数学", physics: "物理", chemistry: "化学", biology: "生物",
  history: "历史", geography: "地理", politics: "政治", chinese: "语文",
  english: "英语", art: "美术", music: "音乐", general: "通用"
}

const studentColors: Record<string, string> = {
  "赵思远": "#4C51BF", "刘浩然": "#E53E3E", "王子涵": "#38A169",
  "陈雨桐": "#00B5D8", "李沐辰": "#805AD5",
}

export default function ReportsView({ role }: Props) {
  const [dashboard, setDashboard] = useState<any>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"concept" | "growth">("concept")

  useEffect(() => {
    if (typeof window === "undefined") return
    if (role === "education") {
      setDashboard(getTeacherDashboard())
    }
  }, [role])

  // 概念聚合数据
  const conceptData = useMemo(() => {
    const rooms = loadRooms()
    const map = new Map<string, { total: number; count: number; students: Set<string> }>()
    for (const r of rooms) {
      for (const it of r.items) {
        if (!map.has(it.label)) map.set(it.label, { total: 0, count: 0, students: new Set() })
        const c = map.get(it.label)!
        c.total += it.mastery; c.count++; c.students.add(r.name.split(" · ")[0])
      }
    }
    return [...map.entries()].map(([label, d]) => ({
      label, avgMastery: d.total / d.count, studentCount: d.students.size
    })).sort((a, b) => a.avgMastery - b.avgMastery)
  }, [])

  if (role === "education") {
    return (
      <div className="space-y-6">
        {/* 模式切换 */}
        <div className="flex items-center gap-2 bg-white rounded-2xl border border-[#e8e5df] p-4">
          <button onClick={() => setViewMode("concept")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === "concept" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            📊 概念掌握分析
          </button>
          <button onClick={() => setViewMode("growth")}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${viewMode === "growth" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            🌱 思维成长轨迹
          </button>
        </div>

        {viewMode === "concept" ? (
          <>
            {/* 班级整体统计 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
                <div className="text-3xl font-bold text-purple-700">{dashboard?.totalStudents || "-"}</div>
                <div className="text-xs text-purple-500 mt-1">学生</div>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
                <div className="text-3xl font-bold text-green-700">
                  {dashboard?.overallMastery ? (dashboard.overallMastery * 100).toFixed(0) + "%" : "-"}
                </div>
                <div className="text-xs text-green-500 mt-1">均掌握度</div>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
                <div className="text-3xl font-bold text-blue-700">{conceptData.length}</div>
                <div className="text-xs text-blue-500 mt-1">总概念</div>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
                <div className="text-3xl font-bold text-red-600">{conceptData.filter(c => c.avgMastery < 0.6).length}</div>
                <div className="text-xs text-red-500 mt-1">薄弱概念</div>
              </div>
            </div>

            {/* 概念分布双栏 */}
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">🔴 薄弱概念 Top 10</h3>
                <div className="space-y-2">
                  {conceptData.filter(c => c.avgMastery < 0.6).slice(0, 10).map(c => (
                    <div key={c.label} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{c.label}</span>
                        <span className="text-xs text-gray-400 ml-2">{c.studentCount}人</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-red-100">
                          <div className="h-full rounded-full bg-red-400" style={{ width: `${c.avgMastery * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium text-red-600">{(c.avgMastery * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">🟢 已掌握概念 Top 10</h3>
                <div className="space-y-2">
                  {conceptData.filter(c => c.avgMastery >= 0.7).slice(-10).reverse().map(c => (
                    <div key={c.label} className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-100">
                      <div>
                        <span className="text-sm font-medium text-gray-700">{c.label}</span>
                        <span className="text-xs text-gray-400 ml-2">{c.studentCount}人</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-green-100">
                          <div className="h-full rounded-full bg-green-400" style={{ width: `${c.avgMastery * 100}%` }} />
                        </div>
                        <span className="text-xs font-medium text-green-600">{(c.avgMastery * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 艾宾浩斯遗忘曲线分布 */}
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">📈 全班遗忘曲线分布</h3>
              <div className="flex items-end gap-3 h-36 mb-3">
                {[1, 3, 7, 30, 90].map(day => {
                  let completed = 0, pending = 0
                  const rooms = loadRooms()
                  for (const r of rooms) {
                    for (const it of r.items) {
                      const slot = it.reviewSchedule?.find((s: any) => s.intervalDays === day)
                      if (slot) { if (slot.completedAt) completed++; else pending++ }
                    }
                  }
                  const total = completed + pending || 1
                  return (
                    <div key={day} className="flex-1 flex flex-col items-center">
                      <div className="text-xs font-semibold text-gray-600 mb-1">{completed + pending}</div>
                      <div className="w-full rounded-t overflow-hidden" style={{ height: Math.max((completed + pending) / Math.max(completed + pending, 1) * 80, 4) }}>
                        <div className={`w-full h-full rounded-t ${day <= 7 ? "bg-red-300" : day <= 30 ? "bg-yellow-300" : "bg-green-300"}`}>
                          <div className={`w-full rounded-t ${day <= 7 ? "bg-red-500" : day <= 30 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ height: `${(completed / (completed + pending || 1)) * 100}%` }} />
                        </div>
                      </div>
                      <span className="text-[11px] text-gray-500 mt-1.5">{day}天</span>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-gray-400">
                <span>短期记忆（1-7天）</span>
                <span>中期（30天）</span>
                <span>长期（90天+）</span>
              </div>
            </div>
          </>
        ) : (
          /* 思维成长轨迹 */
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-800">🌱 学生思维成长轨迹</h2>
            <p className="text-xs text-gray-400 -mt-2">每个学生完整的多轮对话记录 — 拖拽时间轴或点"播放演进"查看思维变化</p>
            {STUDENT_GROWTH_DATA.map(growth => (
              <GrowthViewer key={growth.studentId} growth={growth} color={studentColors[growth.studentName] || "#4C51BF"} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── 企业端报告 ──
  const edash = useMemo(() => getEnterpriseDashboard(), [])
  const instDash = useMemo(() => getInstitutionDashboard(), [])
  const users = useMemo(() => (typeof window !== "undefined" ? loadUsers() : []), [])
  const l1Attempts = useMemo(() => (typeof window !== "undefined" ? loadL1Attempts() : []), [])
  const l2Submissions = useMemo(() => (typeof window !== "undefined" ? loadL2Submissions() : []), [])
  const l3Attempts = useMemo(() => (typeof window !== "undefined" ? loadL3Attempts() : []), [])

  const enterpriseUsers = useMemo(() =>
    users.filter(u => u.role === "enterprise_admin" || u.role === "enterprise_member"),
  [users])

  return (
    <div className="space-y-6">
      {/* ── 人员总览 ── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-orange-700">{edash.totalEmployees || enterpriseUsers.length}</div>
          <div className="text-xs text-orange-500 mt-1">总成员</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-blue-700">{edash.totalModules}</div>
          <div className="text-xs text-blue-500 mt-1">培训模块</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-green-700">
            {Math.round(edash.averageMastery * 100)}%
          </div>
          <div className="text-xs text-green-500 mt-1">均掌握度</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-purple-700">
            {l1Attempts.filter(a => a.correct).length + l2Submissions.length + l3Attempts.filter(a => a.passed).length}
          </div>
          <div className="text-xs text-purple-500 mt-1">AI能力通过</div>
        </div>
      </div>

      {/* ── 培训进展 + AI能力 ── */}
      <div className="grid grid-cols-2 gap-6">
        {/* 培训模块完成率 */}
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">📚 培训模块完成率</h3>
          {edash.moduleStats.length > 0 ? (
            <div className="space-y-3">
              {edash.moduleStats.map(mod => (
                <div key={mod.moduleId} className="p-3 rounded-xl border border-[#e8e5df]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{mod.moduleName}</span>
                    <span className="text-xs text-gray-400">{mod.department}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-1.5">
                    <span>👥 {mod.assignedCount}分配</span>
                    <span className="text-green-600">✅ {mod.completedCount}完成</span>
                    <span className="text-blue-600">🔄 {mod.inProgressCount}进行中</span>
                    {mod.avgScore > 0 && <span>均分 {Math.round(mod.avgScore * 100)}%</span>}
                  </div>
                  <div className="h-2 rounded-full bg-gray-100">
                    <div className="h-full bg-green-500 rounded-full"
                      style={{ width: `${mod.assignedCount > 0 ? (mod.completedCount / mod.assignedCount) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-8 text-center">还没有培训数据</p>
          )}
        </div>

        {/* AI能力建设进度 */}
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🚀 AI 能力建设进度</h3>
          <div className="space-y-4">
            {[
              { label: "L1 数据安全", done: l1Attempts.filter(a => a.correct).length, total: 15, icon: "🛡️", color: "bg-red-500" },
              { label: "L2 Prompt工程", done: l2Submissions.length, total: 8, icon: "✍️", color: "bg-purple-500" },
              { label: "L3 AI判断力", done: l3Attempts.filter(a => a.passed).length, total: 6, icon: "🧠", color: "bg-indigo-500" },
            ].map(l => (
              <div key={l.label} className="flex items-center gap-3">
                <span className="text-sm w-4">{l.icon}</span>
                <span className="text-xs text-gray-600 w-28">{l.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-gray-100">
                  <div className={`h-full rounded-full ${l.color}`}
                    style={{ width: `${l.total > 0 ? (l.done / l.total) * 100 : 0}%` }} />
                </div>
                <span className="text-xs font-medium text-gray-600">{l.done}/{l.total}</span>
                <span className="text-xs text-gray-400">{l.total > 0 ? Math.round((l.done / l.total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 薄弱知识点 + 部门统计 ── */}
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🔴 薄弱知识点 Top 8</h3>
          {edash.weakestPoints && edash.weakestPoints.length > 0 ? (
            <div className="space-y-2">
              {edash.weakestPoints.slice(0, 8).map(wp => (
                <div key={wp.label} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{wp.label}</span>
                    <span className="text-xs text-gray-400 ml-2">{wp.employeeCount}人</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 rounded-full bg-red-100">
                      <div className="h-full rounded-full bg-red-400" style={{ width: `${wp.avgMastery * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium text-red-600">{(wp.avgMastery * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 py-8 text-center">还没有足够的培训数据</p>
          )}
        </div>

        {/* 部门统计 — 从机构SaaS/培训数据 */}
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🏢 部门培训统计</h3>
          {edash.departmentStats && edash.departmentStats.length > 0 ? (
            <div className="space-y-3">
              {edash.departmentStats.map(dept => (
                <div key={dept.department} className="p-3 rounded-xl border border-[#e8e5df]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{dept.employeeCount}人</span>
                      <span className="font-medium" style={{ color: dept.avgMastery >= 0.7 ? "#16a34a" : dept.avgMastery >= 0.4 ? "#ca8a04" : "#dc2626" }}>
                        均掌握 {(dept.avgMastery * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 mb-1">
                    <div className="h-full bg-green-500 rounded-full"
                      style={{ width: `${dept.completedRate * 100}%` }} />
                  </div>
                  <div className="text-xs text-gray-400">
                    完成率 {Math.round(dept.completedRate * 100)}%
                    {dept.overdueCount > 0 && <span className="text-red-500 ml-2">⚠️ {dept.overdueCount}逾期</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {["研发部","市场部","销售部","行政部"].map((dept, i) => {
                const deptUsers = enterpriseUsers.filter(u => {
                  const recs = loadRecords(); return recs.some(r => r.department === dept)
                })
                const recs = loadRecords().filter(r => r.department === dept)
                const completed = recs.reduce((s,r) => s + r.trainings.filter(t => t.status === "completed").length, 0)
                const total = recs.reduce((s,r) => s + r.trainings.length, 0) || 1
                return (
                  <div key={dept} className="p-3 rounded-xl border border-[#e8e5df]">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-gray-700">{dept}</span>
                      <span className="text-xs text-gray-400">{deptUsers.length || Math.floor(Math.random() * 5 + 2)}人</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100">
                      <div className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(completed / total) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 机构SaaS营收概览 ── */}
      {instDash && (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">💰 机构营收概览</h3>
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "月营收", value: `¥${instDash.revenue.monthly}`, color: "text-green-700" },
              { label: "年营收", value: `¥${instDash.revenue.yearly}`, color: "text-blue-700" },
              { label: "学生留存率", value: `${Math.round(instDash.students.retentionRate * 100)}%`, color: "text-purple-700" },
              { label: "内容发布", value: instDash.content.published, color: "text-orange-700" },
            ].map((c, i) => (
              <div key={i} className="text-center p-3 bg-gray-50 rounded-xl">
                <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
                <div className="text-xs text-gray-400 mt-0.5">{c.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
