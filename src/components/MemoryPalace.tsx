"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import {
  loadRooms,
  addRoom, removeItemFromRoom, completeReview,
  getTeacherDashboard,
  MemoryRoom, TeacherDashboard,
} from "@/lib/memory-palace"
import { SEED_ROOMS } from "@/lib/seed-palace"
import { STUDENT_GROWTH_DATA, StudentGrowth } from "@/lib/growth-data"
import GrowthViewer from "@/components/GrowthViewer"

const growthStudentColors: Record<string, string> = {
  "赵思远": "#4C51BF", "刘浩然": "#E53E3E", "王子涵": "#38A169",
  "陈雨桐": "#00B5D8", "李沐辰": "#805AD5",
}

export default function MemoryPalace() {
  const [rooms, setRooms] = useState<MemoryRoom[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [view, setView] = useState<"overview" | "student" | "dashboard" | "growth">("overview")
  const [dashboard, setDashboard] = useState<TeacherDashboard | null>(null)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [filterSubject, setFilterSubject] = useState<string | null>(null)
  const [searchName, setSearchName] = useState("")

  const refresh = useCallback(() => { setRooms(loadRooms()) }, [])

  useEffect(() => {
    const existing = loadRooms()
    // 旧种子数据只有3个房间，新的是300个 — 检测到旧数据就替换
    if (existing.length <= 10) {
      localStorage.setItem("sijian_memory_palace", JSON.stringify(SEED_ROOMS))
    }
    refresh()
  }, [])

  // ── 学生聚合数据 ──
  const studentData = useMemo(() => {
    const map = new Map<string, { subjects: Record<string, number>; totalMastery: number; totalItems: number; overdue: number; lastActivity: string }>()
    for (const r of rooms) {
      const name = r.name.split(" · ")[0]
      if (!map.has(name)) map.set(name, { subjects: {}, totalMastery: 0, totalItems: 0, overdue: 0, lastActivity: r.createdAt })
      const d = map.get(name)!
      d.subjects[r.subject] = (d.subjects[r.subject] || 0) + r.items.length
      for (const it of r.items) {
        d.totalMastery += it.mastery
        d.totalItems++
        if (it.nextReviewAt && new Date(it.nextReviewAt) < new Date()) d.overdue++
        if (it.lastReviewedAt && it.lastReviewedAt > d.lastActivity) d.lastActivity = it.lastReviewedAt
      }
    }
    return [...map.entries()].map(([name, d]) => ({
      name, rooms: Object.keys(d.subjects).length, items: d.totalItems,
      avgMastery: d.totalItems > 0 ? d.totalMastery / d.totalItems : 0,
      overdue: d.overdue, lastActivity: d.lastActivity, subjects: d.subjects,
    })).sort((a, b) => a.avgMastery - b.avgMastery)
  }, [rooms])

  // ── 概念聚合 ──
  const conceptData = useMemo(() => {
    const map = new Map<string, { total: number; count: number; students: Set<string> }>()
    for (const r of rooms) {
      for (const it of r.items) {
        if (!map.has(it.label)) map.set(it.label, { total: 0, count: 0, students: new Set() })
        const c = map.get(it.label)!
        c.total += it.mastery; c.count++; c.students.add(r.name.split(" · ")[0])
      }
    }
    return [...map.entries()].map(([label, d]) => ({ label, avgMastery: d.total / d.count, studentCount: d.students.size }))
      .sort((a, b) => a.avgMastery - b.avgMastery)
  }, [rooms])

  const selectedStudentData = selectedStudent
    ? studentData.find(s => s.name === selectedStudent)
    : null
  const studentRooms = selectedStudent
    ? rooms.filter(r => r.name.startsWith(selectedStudent))
    : []

  // ── 筛选后的学生列表 ──
  const filteredStudents = useMemo(() => {
    let list = studentData
    if (searchName) list = list.filter(s => s.name.includes(searchName))
    if (filterSubject) list = list.filter(s => s.subjects[filterSubject] !== undefined)
    return list
  }, [studentData, searchName, filterSubject])

  const filterNameMap: Record<string, string> = { mathematics: "数学", physics: "物理", chemistry: "化学" }

  return (
    <div className="space-y-6">
      {/* ── 导航 ── */}
      <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border border-[#d8e0c8] p-4">
        <button onClick={() => { setView("overview"); setSelectedStudent(null) }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "overview" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          👥 学生总览
        </button>
        <button onClick={() => { setView("dashboard"); setDashboard(getTeacherDashboard()) }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "dashboard" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          📊 班级数据
        </button>
        <button onClick={() => { setView("growth"); setSelectedStudent(null) }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${view === "growth" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
          🌱 思维成长
        </button>
        <div className="flex-1" />
        <span className="text-xs text-gray-400">{studentData.length} 学生 · {rooms.length} 房间 · {studentData.reduce((s,d) => s + d.items, 0)} 概念</span>
      </div>

      {/* ── 学生总览 ── */}
      {view === "overview" && (
        <div className="bg-white rounded-2xl border border-[#d8e0c8] p-6">
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input value={searchName} onChange={e => setSearchName(e.target.value)}
              placeholder="搜索学生…" className="rounded-xl border border-[#d8e0c8] bg-[#f8faf3] px-4 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-300 w-48" />
            <select value={filterSubject || ""} onChange={e => setFilterSubject(e.target.value || null)}
              className="rounded-xl border border-[#d8e0c8] bg-[#f8faf3] px-3 py-2 text-sm text-gray-700">
              <option value="">全部学科</option>
              {Object.entries(filterNameMap).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <span className="text-xs text-gray-400">{filteredStudents.length} 人</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                <tr className="text-xs text-gray-400">
                  <th className="pb-2 text-left font-medium w-10">#</th>
                  <th className="pb-2 text-left font-medium">学生</th>
                  <th className="pb-2 font-medium">掌握度</th>
                  <th className="pb-2 font-medium">进度条</th>
                  <th className="pb-2 font-medium">概念</th>
                  <th className="pb-2 font-medium">逾期</th>
                  <th className="pb-2 font-medium">学科</th>
                  <th className="pb-2 font-medium">最近</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s, i) => (
                  <tr key={s.name}
                    onClick={() => { setSelectedStudent(s.name); setView("student") }}
                    className="border-b border-gray-50 hover:bg-purple-50 cursor-pointer transition-colors">
                    <td className="py-2 text-xs text-gray-300">{i + 1}</td>
                    <td className="py-2 font-medium text-gray-800">{s.name}</td>
                    <td className="py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.avgMastery >= 0.65 ? "bg-green-100 text-green-700" : s.avgMastery >= 0.45 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                        {(s.avgMastery * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2">
                      <div className="w-20 h-1.5 rounded-full bg-gray-100">
                        <div className={`h-full rounded-full ${s.avgMastery >= 0.65 ? "bg-green-500" : s.avgMastery >= 0.45 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${s.avgMastery * 100}%` }} />
                      </div>
                    </td>
                    <td className="py-2 text-xs text-gray-500">{s.items}</td>
                    <td className="py-2">
                      {s.overdue > 0 ? <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">{s.overdue}</span> : <span className="text-xs text-gray-300">0</span>}
                    </td>
                    <td className="py-2">
                      <div className="flex gap-1">
                        {Object.entries(s.subjects).map(([subj, cnt]) => (
                          <span key={subj} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{filterNameMap[subj] || subj}:{cnt}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 text-xs text-gray-400">{s.lastActivity ? new Date(s.lastActivity).toLocaleDateString("zh") : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 班级数据看板 ── */}
      {view === "dashboard" && (
        <div className="bg-white rounded-2xl border border-[#d8e0c8] p-6">
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-purple-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{studentData.length}</div>
              <div className="text-xs text-purple-500">学生</div>
            </div>
            <div className="bg-green-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-green-700">{(studentData.reduce((s,d) => s + d.avgMastery, 0) / studentData.length * 100).toFixed(0)}%</div>
              <div className="text-xs text-green-500">均掌握度</div>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{studentData.reduce((s,d) => s + d.items, 0)}</div>
              <div className="text-xs text-blue-500">总概念</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-red-700">{studentData.reduce((s,d) => s + d.overdue, 0)}</div>
              <div className="text-xs text-red-500">待复习</div>
            </div>
          </div>

          {/* ── 全班艾宾浩斯遗忘曲线 ── */}
          <div className="mb-6 p-5 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">📈 全班遗忘曲线分布（艾宾浩斯 1→3→7→30→90天）</h3>
            <div className="flex items-end gap-2 h-32">
              {[1, 3, 7, 30, 90].map(day => {
                let completed = 0, pending = 0
                for (const r of rooms) {
                  for (const it of r.items) {
                    const slot = it.reviewSchedule?.find((s: any) => s.intervalDays === day)
                    if (slot) { if (slot.completedAt) completed++; else pending++ }
                  }
                }
                const total = completed + pending || 1
                const maxH = 120
                const doneH = (completed / total) * maxH * 0.65
                const pendH = (pending / total) * maxH * 0.65
                return (
                  <div key={day} className="flex-1 flex flex-col items-center">
                    <div className="text-[10px] font-semibold text-gray-600 mb-1">{completed + pending}</div>
                    <div className={`w-full rounded-t ${day <= 7 ? "bg-red-300" : day <= 30 ? "bg-yellow-300" : "bg-green-300"}`}
                      style={{ height: Math.max(pendH + doneH, 3) }}>
                      {/* 完成比例用更深的颜色 */}
                      <div className={`w-full rounded-t ${day <= 7 ? "bg-red-500" : day <= 30 ? "bg-yellow-500" : "bg-green-500"}`}
                        style={{ height: Math.max(doneH, 1) }} />
                    </div>
                    <span className="text-[11px] text-gray-500 mt-1.5 font-medium">{day}天</span>
                    <span className="text-[9px] text-gray-400">{pending > 0 ? `${pending}待复习` : "✓全部完成"}</span>
                  </div>
                )
              })}
            </div>
            <div className="mt-3 flex items-center justify-between text-[10px] text-gray-400">
              <span>短期记忆（1-7天）—— 遗忘最快阶段，红色标记</span>
              <span>中期巩固（30天）</span>
              <span>长期记忆（90天+）—— 接近永久记忆</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">🔴 概念薄弱点（全班均分最低）</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {conceptData.slice(0, 12).map(c => (
                  <div key={c.label} className="flex items-center justify-between p-2.5 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{c.label}</span>
                      <span className="text-xs text-gray-400 ml-2">{c.studentCount}人</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-red-100"><div className="h-full rounded-full bg-red-400" style={{ width: `${c.avgMastery * 100}%` }} /></div>
                      <span className="text-xs font-medium text-red-600">{(c.avgMastery * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">🟢 概念优势点</h3>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {conceptData.slice(-12).reverse().map(c => (
                  <div key={c.label} className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-100">
                    <div>
                      <span className="text-sm font-medium text-gray-700">{c.label}</span>
                      <span className="text-xs text-gray-400 ml-2">{c.studentCount}人</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-green-100"><div className="h-full rounded-full bg-green-400" style={{ width: `${c.avgMastery * 100}%` }} /></div>
                      <span className="text-xs font-medium text-green-600">{(c.avgMastery * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 思维成长轨迹 ── */}
      {view === "growth" && (
        <div className="space-y-6">
          <h2 className="text-base font-semibold text-gray-800">🌱 学生思维成长轨迹</h2>
          <p className="text-xs text-gray-400 -mt-4 mb-2">每个学生完整的多轮对话记录 — 拖拽时间轴滑块或点"播放演进"，3D空间动态展示思维变化</p>
          {STUDENT_GROWTH_DATA.map(growth => (
            <GrowthViewer key={growth.studentId} growth={growth} color={growthStudentColors[growth.studentName] || "#4C51BF"} />
          ))}
        </div>
      )}

      {/* ── 单个学生详情 ── */}
      {view === "student" && selectedStudentData && (
        <div className="bg-white rounded-2xl border border-[#d8e0c8] p-6">
          <button onClick={() => { setSelectedStudent(null); setView("overview") }}
            className="text-xs text-gray-400 hover:text-gray-600 mb-3">← 返回总览</button>

          <div className="flex items-center gap-4 mb-6">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${selectedStudentData.avgMastery >= 0.65 ? "bg-green-500" : selectedStudentData.avgMastery >= 0.45 ? "bg-yellow-500" : "bg-red-400"}`}>
              {(selectedStudentData.avgMastery * 100).toFixed(0)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800">{selectedStudentData.name}</h2>
              <div className="text-xs text-gray-400">{selectedStudentData.items}概念 · 复习逾期{selectedStudentData.overdue}个 · {new Date(selectedStudentData.lastActivity).toLocaleDateString("zh")}最后活动</div>
            </div>
          </div>

          {/* 艾宾浩斯遗忘曲线 — 该学生的复习分布 */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-100">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">📈 艾宾浩斯遗忘曲线 · {selectedStudentData.name}的复习分布</h3>

            {/* 柱状图：每个间隔已复习 + 待复习 */}
            <div className="h-28 flex items-end gap-1.5 mb-2">
              {[1, 3, 7, 30, 90].map(day => {
                // 统计该生在所有房间中，每个间隔的完成情况
                let completed = 0, pending = 0
                for (const r of studentRooms) {
                  for (const it of r.items) {
                    const slot = it.reviewSchedule.find(s => s.intervalDays === day)
                    if (slot) {
                      if (slot.completedAt) completed++
                      else pending++
                    }
                  }
                }
                const total = completed + pending || 1
                const maxH = 100
                const doneH = (completed / Math.max(total, 1)) * maxH * 0.7
                const pendH = (pending / Math.max(total, 1)) * maxH * 0.7
                return (
                  <div key={day} className="flex-1 flex flex-col items-center justify-end group cursor-default">
                    <div className="text-[9px] font-medium text-gray-500 mb-1">
                      {completed + pending}
                    </div>
                    <div className="w-full flex flex-col rounded-t overflow-hidden" style={{ height: Math.max(doneH + pendH, 4) }}>
                      {pendH > 0 && (
                        <div className="w-full bg-red-200 transition-all hover:bg-red-300 relative" style={{ height: pendH }}>
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-red-500 opacity-0 group-hover:opacity-100 whitespace-nowrap">待{pending}</div>
                        </div>
                      )}
                      {doneH > 0 && (
                        <div className="w-full bg-green-400 transition-all hover:bg-green-500 rounded-t relative" style={{ height: doneH }}>
                          <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-[8px] text-green-600 opacity-0 group-hover:opacity-100 whitespace-nowrap">已{completed}</div>
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1.5">{day}天</span>
                  </div>
                )
              })}
            </div>

            {/* 图例 + 说明 */}
            <div className="flex items-center gap-4 text-[10px] text-gray-400 mt-2">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-400" /> 已完成复习</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-200" /> 待复习</span>
              <span className="ml-auto">遗忘临界点：1天→3天→7天→30天→90天</span>
            </div>
          </div>
          {studentRooms.map(room => {
            const sorted = [...room.items].sort((a, b) => a.mastery - b.mastery)
            const avg = sorted.reduce((s, i) => s + i.mastery, 0) / sorted.length
            return (
              <div key={room.id} className="mb-4 border border-[#e8ecd8] rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">{filterNameMap[room.subject] || room.subject}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${avg >= 0.65 ? "bg-green-100 text-green-700" : avg >= 0.45 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                    {room.items.length}概念 · 均{(avg * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {sorted.map(item => (
                    <div key={item.id} className={`p-2.5 rounded-lg border-2 ${item.mastery < 0.35 ? "border-red-300 bg-red-50" : item.mastery < 0.55 ? "border-yellow-200 bg-yellow-50" : "border-green-200 bg-green-50"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                        </div>
                        <span className={`text-[10px] font-medium ${item.mastery < 0.35 ? "text-red-600" : item.mastery < 0.55 ? "text-yellow-600" : "text-green-600"}`}>
                          {(item.mastery * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div className="w-full h-1 rounded-full bg-gray-100 mb-1">
                        <div className={`h-full rounded-full ${item.mastery < 0.35 ? "bg-red-400" : item.mastery < 0.55 ? "bg-yellow-400" : "bg-green-400"}`} style={{ width: `${item.mastery * 100}%` }} />
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">{item.content?.slice(0, 35)}</div>
                      {item.anchors?.slice(0, 1).map((a, ai) => (
                        <div key={ai} className="text-[9px] text-gray-400 mt-0.5 truncate">📍 {a.label}</div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
