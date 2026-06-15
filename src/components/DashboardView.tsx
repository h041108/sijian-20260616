"use client"

import { useState, useEffect, useMemo } from "react"
import { loadRooms, getTeacherDashboard } from "@/lib/memory-palace"
import { getMyClasses, getMyOrgs, getCurrentUser, getMyChildren, getMyStudents } from "@/lib/sijian-user"
import type { ClassRoom, EnterpriseOrg, SijianUser } from "@/lib/sijian-user"

interface Props {
  role: "education" | "enterprise"
}

// 学科名映射
const subjectNameMap: Record<string, string> = {
  mathematics: "数学", physics: "物理", chemistry: "化学", biology: "生物",
  history: "历史", geography: "地理", politics: "政治", chinese: "语文",
  english: "英语", art: "美术", music: "音乐", general: "通用"
}

export default function DashboardView({ role }: Props) {
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [orgs, setOrgs] = useState<EnterpriseOrg[]>([])
  const [dashboard, setDashboard] = useState<any>(null)
  const [children, setChildren] = useState<SijianUser[]>([])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (role === "education") {
      setClasses(getMyClasses())
      setDashboard(getTeacherDashboard())
      setChildren(getMyChildren())
    } else {
      setOrgs(getMyOrgs())
    }
  }, [role])

  // 聚合学生数据
  const studentData = useMemo(() => {
    const rooms = loadRooms()
    const map = new Map<string, { subjects: Record<string, number>; totalMastery: number; totalItems: number; overdue: number }>()
    for (const r of rooms) {
      const name = r.name.split(" · ")[0]
      if (!map.has(name)) map.set(name, { subjects: {}, totalMastery: 0, totalItems: 0, overdue: 0 })
      const d = map.get(name)!
      d.subjects[r.subject] = (d.subjects[r.subject] || 0) + r.items.length
      for (const it of r.items) {
        d.totalMastery += it.mastery
        d.totalItems++
        if (it.nextReviewAt && new Date(it.nextReviewAt) < new Date()) d.overdue++
      }
    }
    return [...map.entries()].map(([name, d]) => ({
      name, rooms: Object.keys(d.subjects).length, items: d.totalItems,
      avgMastery: d.totalItems > 0 ? d.totalMastery / d.totalItems : 0,
      overdue: d.overdue, subjects: d.subjects,
    })).sort((a, b) => a.avgMastery - b.avgMastery)
  }, [classes])

  if (role === "education") {
    return (
      <div className="space-y-6">
        {/* ── 班级概览卡片 ── */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
            <div className="text-3xl font-bold text-blue-700">{classes.length}</div>
            <div className="text-xs text-blue-500 mt-1">班级数</div>
          </div>
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
            <div className="text-3xl font-bold text-purple-700">{dashboard?.totalStudents || studentData.length}</div>
            <div className="text-xs text-purple-500 mt-1">学生</div>
          </div>
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
            <div className="text-3xl font-bold text-green-700">
              {(dashboard?.overallMastery ? dashboard.overallMastery * 100 : studentData.length > 0 ? studentData.reduce((s, d) => s + d.avgMastery, 0) / studentData.length * 100 : 0).toFixed(0)}%
            </div>
            <div className="text-xs text-green-500 mt-1">均掌握度</div>
          </div>
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
            <div className="text-3xl font-bold text-red-600">{studentData.reduce((s, d) => s + d.overdue, 0)}</div>
            <div className="text-xs text-red-500 mt-1">待复习</div>
          </div>
        </div>

        {/* ── 班级列表 ── */}
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🏫 我的班级</h3>
          {classes.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-3xl mb-2 opacity-30">📚</div>
              <p className="text-sm">还没有创建班级</p>
              <p className="text-xs mt-1">在"成员管理"中创建班级并生成邀请码</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-4 rounded-xl border border-[#e8e5df] hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg">🏫</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{cls.name}</div>
                      <div className="text-xs text-gray-400">{subjectNameMap[cls.subject] || cls.subject} · {cls.grade}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>👥 {cls.studentCount} 学生</span>
                    <span className="bg-gray-100 px-2 py-1 rounded-lg">邀请码: {cls.inviteCode}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 家庭视图 ── */}
        {children.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">👨‍👩‍👧 我的孩子</h3>
            <div className="space-y-3">
              {children.map(child => (
                <div key={child.id} className="flex items-center gap-3 p-4 rounded-xl border border-[#e8e5df] bg-gradient-to-r from-purple-50 to-blue-50">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: child.avatar || "#6366F1" }}>
                    {child.nickname[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800">{child.nickname}</div>
                    <div className="text-xs text-gray-400">角色: {child.role}</div>
                  </div>
                  <span className="text-xs bg-white px-3 py-1 rounded-full border border-[#e8e5df]">
                    📖 查看学习报告
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 薄弱概念 ── */}
        {dashboard?.weakConcepts?.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🔴 概念薄弱点</h3>
            <div className="grid grid-cols-2 gap-3">
              {dashboard.weakConcepts.slice(0, 8).map((c: any) => (
                <div key={c.label} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                  <div>
                    <span className="text-sm font-medium text-gray-700">{c.label}</span>
                    <span className="text-xs text-gray-400 ml-2">{c.studentCount}人</span>
                  </div>
                  <span className="text-xs font-medium text-red-600">{(c.averageMastery * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── 企业视图 ──
  return (
    <div className="space-y-6">
      {/* 组织概览卡片 */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-orange-700">{orgs.length}</div>
          <div className="text-xs text-orange-500 mt-1">组织数</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-purple-700">
            {orgs.reduce((s, o) => s + (o.memberCount || 0), 0)}
          </div>
          <div className="text-xs text-purple-500 mt-1">总成员</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-green-700">
            {orgs.length > 0 ? "活跃" : "-"}
          </div>
          <div className="text-xs text-green-500 mt-1">状态</div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-5 text-center">
          <div className="text-3xl font-bold text-blue-700">
            {orgs.length > 0 ? orgs.reduce((s, o) => s + (o.inviteCode ? 1 : 0), 0) : 0}
          </div>
          <div className="text-xs text-blue-500 mt-1">邀请码</div>
        </div>
      </div>

      {/* 组织列表 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🏢 我的组织</h3>
        {orgs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2 opacity-30">🏗️</div>
            <p className="text-sm">还没有创建组织</p>
            <p className="text-xs mt-1">在"成员管理"中创建组织并生成邀请码</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orgs.map(org => (
              <div key={org.id} className="p-5 rounded-xl border border-[#e8e5df] hover:border-orange-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg">🏢</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{org.name}</div>
                      <div className="text-xs text-gray-400">{org.memberCount} 成员 · 创建于 {new Date(org.createdAt).toLocaleDateString("zh")}</div>
                    </div>
                  </div>
                  <span className="text-xs bg-orange-50 text-orange-700 px-3 py-1 rounded-full border border-orange-200">
                    邀请码: {org.inviteCode}
                  </span>
                </div>
                {/* 部门概览 */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <div className="text-lg font-bold text-gray-700">-</div>
                    <div className="text-[10px] text-gray-400">部门数</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <div className="text-lg font-bold text-gray-700">{org.memberCount}</div>
                    <div className="text-[10px] text-gray-400">成员</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl text-center">
                    <div className="text-lg font-bold text-green-600">活跃</div>
                    <div className="text-[10px] text-gray-400">状态</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
