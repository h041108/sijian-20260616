"use client"

import { useState, useEffect, useMemo } from "react"
import { loadRooms, getTeacherDashboard } from "@/lib/memory-palace"
import { getMyStudents, getMyChildren, getCurrentUser } from "@/lib/sijian-user"
import GrowthViewer from "@/components/GrowthViewer"
import { STUDENT_GROWTH_DATA } from "@/lib/growth-data"

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
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-orange-700">48</div>
          <div className="text-xs text-orange-500 mt-1">总成员</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-blue-700">12</div>
          <div className="text-xs text-blue-500 mt-1">本月新增</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-green-700">85%</div>
          <div className="text-xs text-green-500 mt-1">活跃率</div>
        </div>
      </div>

      {/* 近期动态 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 近期组织动态</h3>
        <div className="space-y-3">
          {[
            { type: "入职", user: "张老师", dept: "教学部", date: "2026-06-12" },
            { type: "离职", user: "李助理", dept: "行政部", date: "2026-06-10" },
            { type: "调岗", user: "王主任", dept: "教学部 → 行政部", date: "2026-06-08" },
            { type: "入职", user: "陈经理", dept: "市场部", date: "2026-06-05" },
            { type: "晋升", user: "刘主管", dept: "研发部", date: "2026-06-01" },
          ].map((act, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#e8e5df]">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                act.type === "入职" ? "bg-green-100 text-green-700" :
                act.type === "离职" ? "bg-red-100 text-red-700" :
                act.type === "晋升" ? "bg-blue-100 text-blue-700" :
                "bg-yellow-100 text-yellow-700"
              }`}>{act.type}</span>
              <span className="text-sm text-gray-700">{act.user}</span>
              <span className="text-xs text-gray-400">{act.dept}</span>
              <span className="text-xs text-gray-300 ml-auto">{act.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 部门统计 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 部门分布</h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { name: "教学部", count: 28, color: "bg-blue-500" },
            { name: "行政部", count: 12, color: "bg-orange-500" },
            { name: "后勤部", count: 8, color: "bg-green-500" },
          ].map(dept => (
            <div key={dept.name} className="p-4 rounded-xl border border-[#e8e5df] text-center">
              <div className="text-2xl font-bold text-gray-800">{dept.count}</div>
              <div className="text-xs text-gray-400 mt-1">{dept.name}</div>
              <div className="mt-2 w-full h-2 rounded-full bg-gray-100">
                <div className={`h-full rounded-full ${dept.color}`} style={{ width: `${(dept.count / 48) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
