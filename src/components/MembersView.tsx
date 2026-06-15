"use client"

import { useState, useEffect, useCallback } from "react"
import {
  createClass, getMyClasses, generateInviteCode, ClassRoom,
  getMyStudents, getMyOrgMembers,
  createOrg, getMyOrgs,
} from "@/lib/sijian-user"
import type { EnterpriseOrg } from "@/lib/sijian-user"

interface Props {
  role: "education" | "enterprise"
}

const subjectOptions = [
  { v: "mathematics", l: "数学" }, { v: "physics", l: "物理" }, { v: "chemistry", l: "化学" },
  { v: "biology", l: "生物" }, { v: "history", l: "历史" }, { v: "chinese", l: "语文" },
  { v: "english", l: "英语" }, { v: "general", l: "通用" },
]
const grades = ["小学", "初中", "高一", "高二", "高三", "大学", "成人"]

export default function MembersView({ role }: Props) {
  // ── 教育端 ──
  const [className, setClassName] = useState("")
  const [subject, setSubject] = useState("mathematics")
  const [grade, setGrade] = useState("高三")
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [inviteCode, setInviteCode] = useState("")
  const [students, setStudents] = useState<any[]>([])

  // ── 企业端 ──
  const [orgName, setOrgName] = useState("")
  const [orgs, setOrgs] = useState<EnterpriseOrg[]>([])
  const [orgInviteCode, setOrgInviteCode] = useState("")
  const [members, setMembers] = useState<any[]>([])

  const refresh = useCallback(() => {
    if (typeof window === "undefined") return
    if (role === "education") {
      setClasses(getMyClasses())
      setStudents(getMyStudents())
    } else {
      setOrgs(getMyOrgs())
      setMembers(getMyOrgMembers())
    }
  }, [role])

  useEffect(() => { refresh() }, [refresh])

  const handleCreateClass = () => {
    if (!className.trim()) return
    const code = generateInviteCode("teacher_student")
    createClass(className.trim(), subject, grade)
    setInviteCode(code)
    setClassName("")
    refresh()
  }

  const handleCreateOrg = () => {
    if (!orgName.trim()) return
    const org = createOrg(orgName.trim())
    setOrgInviteCode(org.inviteCode)
    setOrgName("")
    refresh()
  }

  if (role === "education") {
    return (
      <div className="space-y-6">
        {/* ── 创建班级 ── */}
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">🏫 创建班级</h3>
          <div className="flex gap-3 flex-wrap items-end">
            <input value={className} onChange={e => setClassName(e.target.value)}
              placeholder="班级名称，如：高三(3)班"
              className="flex-1 min-w-[180px] rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />
            <select value={subject} onChange={e => setSubject(e.target.value)}
              className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm text-gray-700">
              {subjectOptions.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
            </select>
            <select value={grade} onChange={e => setGrade(e.target.value)}
              className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm text-gray-700">
              {grades.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
            <button onClick={handleCreateClass} disabled={!className.trim()}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-40">
              创建班级
            </button>
          </div>
          {inviteCode && (
            <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200 flex items-center gap-3">
              <span className="text-sm font-medium text-green-700">班级邀请码：</span>
              <span className="text-2xl font-bold tracking-[6px] text-green-800">{inviteCode}</span>
              <button onClick={() => { navigator.clipboard.writeText(inviteCode); setInviteCode("") }}
                className="text-xs text-green-600 hover:text-green-800 underline">复制并关闭</button>
            </div>
          )}
        </div>

        {/* ── 班级列表 ── */}
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 我的班级 ({classes.length})</h3>
          {classes.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">还没有创建班级，创建后学生可通过邀请码加入</p>
          ) : (
            <div className="space-y-3">
              {classes.map(cls => (
                <div key={cls.id} className="flex items-center justify-between p-4 rounded-xl border border-[#e8e5df] hover:border-blue-200 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-lg">🏫</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{cls.name}</div>
                      <div className="text-xs text-gray-400">{cls.subject} · {cls.grade} · {cls.studentCount} 学生</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg font-mono">
                      邀请码: {cls.inviteCode}
                    </div>
                    <button onClick={() => navigator.clipboard.writeText(cls.inviteCode)}
                      className="text-xs text-blue-500 hover:text-blue-700 px-2 py-1">复制</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 学生列表 ── */}
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">👥 已加入学生 ({students.length})</h3>
          {students.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">还没有学生通过邀请码加入</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {students.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#e8e5df] bg-gray-50">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: s.avatar || "#6366F1" }}>
                    {s.nickname[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{s.nickname}</div>
                    <div className="text-xs text-gray-400">加入时间: {new Date(s.createdAt).toLocaleDateString("zh")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── 企业端 ──
  return (
    <div className="space-y-6">
      {/* 创建企业 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🏢 创建企业/组织</h3>
        <div className="flex gap-3 items-end">
          <input value={orgName} onChange={e => setOrgName(e.target.value)}
            placeholder="企业名称，如：星辰科技有限公司"
            className="flex-1 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
          <button onClick={handleCreateOrg} disabled={!orgName.trim()}
            className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-40">
            创建组织
          </button>
        </div>
        {orgInviteCode && (
          <div className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200 flex items-center gap-3">
            <span className="text-sm font-medium text-orange-700">企业邀请码：</span>
            <span className="text-2xl font-bold tracking-[6px] text-orange-800">{orgInviteCode}</span>
            <button onClick={() => { navigator.clipboard.writeText(orgInviteCode); setOrgInviteCode("") }}
              className="text-xs text-orange-600 hover:text-orange-800 underline">复制并关闭</button>
          </div>
        )}
      </div>

      {/* 组织列表 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 我的组织 ({orgs.length})</h3>
        {orgs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">还没有创建组织</p>
        ) : (
          <div className="space-y-4">
            {orgs.map(org => (
              <div key={org.id} className="p-4 rounded-xl border border-[#e8e5df] hover:border-orange-200 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-lg">🏢</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{org.name}</div>
                      <div className="text-xs text-gray-400">{org.memberCount} 成员 · 创建于 {new Date(org.createdAt).toLocaleDateString("zh")}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs bg-orange-50 text-orange-700 px-3 py-1.5 rounded-lg font-mono border border-orange-200">
                      邀请码: {org.inviteCode}
                    </span>
                    <button onClick={() => navigator.clipboard.writeText(org.inviteCode)}
                      className="text-xs text-orange-500 hover:text-orange-700 px-2 py-1">复制</button>
                  </div>
                </div>
                {/* 部门管理区域 */}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-400">部门:</span>
                  {["管理部", "研发部", "市场部"].map(dept => (
                    <span key={dept} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{dept}</span>
                  ))}
                  <button className="text-xs text-orange-500 hover:text-orange-700">+ 添加</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 成员列表 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">👥 已加入成员 ({members.length})</h3>
        {members.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">还没有成员通过邀请码加入</p>
        ) : (
          <div className="space-y-3">
            {members.map(m => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border border-[#e8e5df]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: m.avatar || "#F97316" }}>
                    {m.nickname[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-700">{m.nickname}</div>
                    <div className="text-xs text-gray-400">角色: {m.role} · 加入于 {new Date(m.createdAt).toLocaleDateString("zh")}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select className="text-xs rounded-lg border border-[#e8e5df] bg-gray-50 px-2 py-1 text-gray-600">
                    <option>成员</option>
                    <option>管理员</option>
                    <option>部门主管</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
