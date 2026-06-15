"use client"

import { useState, useEffect } from "react"
import { createClass, getMyClasses, generateInviteCode, ClassRoom } from "@/lib/sijian-user"

export default function OrgManager({ role }: { role: string }) {
  const [className, setClassName] = useState("")
  const [subject, setSubject] = useState("mathematics")
  const [grade, setGrade] = useState("高三")
  const [classes, setClasses] = useState<ClassRoom[]>([])
  const [inviteCode, setInviteCode] = useState("")

  const refresh = () => setClasses(getMyClasses())

  useEffect(() => { refresh() }, [])

  const handleCreateClass = () => {
    if (!className.trim()) return
    const code = generateInviteCode("teacher_student")
    createClass(className.trim(), subject, grade)
    setInviteCode(code)
    setClassName("")
    refresh()
  }

  const subjects = [{v:"mathematics",l:"数学"},{v:"physics",l:"物理"},{v:"chemistry",l:"化学"},{v:"biology",l:"生物"},{v:"history",l:"历史"},{v:"chinese",l:"语文"},{v:"english",l:"英语"},{v:"general",l:"通用"}]
  const grades = ["小学","初中","高一","高二","高三","大学","成人"]

  return (
    <div className="space-y-6">
      {/* 创建班级 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🏫 创建班级</h3>
        <div className="flex gap-3 flex-wrap items-end">
          <input value={className} onChange={e => setClassName(e.target.value)}
            placeholder="班级名称，如：高三(3)班"
            className="flex-1 min-w-[180px] rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-300" />
          <select value={subject} onChange={e => setSubject(e.target.value)} className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm text-gray-700">
            {subjects.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
          <select value={grade} onChange={e => setGrade(e.target.value)} className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm text-gray-700">
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
            <span className="text-xs text-green-500">发给学生输入即可加入</span>
          </div>
        )}
      </div>

      {/* 班级列表 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 我的班级</h3>
        {classes.length === 0 ? (
          <p className="text-sm text-gray-400">还没有创建班级</p>
        ) : (
          <div className="space-y-3">
            {classes.map(cls => (
              <div key={cls.id} className="flex items-center justify-between p-4 rounded-xl border border-[#e8e5df]">
                <div>
                  <div className="text-sm font-semibold text-gray-800">{cls.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{cls.subject} · {cls.grade} · {cls.studentCount} 学生</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">邀请码: {cls.inviteCode}</span>
                  <button onClick={() => navigator.clipboard.writeText(cls.inviteCode)}
                    className="text-xs text-blue-500 hover:text-blue-700">复制</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── 企业组织管理器 ──────────────────────────────

export function EnterpriseOrgManager() {
  const [orgName, setOrgName] = useState("")
  const [orgs, setOrgs] = useState<any[]>([])
  const [code, setCode] = useState("")

  const refresh = () => {
    if (typeof window !== "undefined") {
      const { getMyOrgs, createOrg } = require("@/lib/sijian-user")
      setOrgs(getMyOrgs())
    }
  }

  useEffect(() => { refresh() }, [])

  const handleCreate = () => {
    if (!orgName.trim()) return
    const { createOrg } = require("@/lib/sijian-user")
    const org = createOrg(orgName.trim())
    setCode(org.inviteCode)
    setOrgName("")
    refresh()
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🏢 创建企业</h3>
        <div className="flex gap-3 items-end">
          <input value={orgName} onChange={e => setOrgName(e.target.value)}
            placeholder="企业名称，如：星辰科技有限公司"
            className="flex-1 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-300" />
          <button onClick={handleCreate} disabled={!orgName.trim()}
            className="rounded-xl bg-orange-600 hover:bg-orange-700 text-white px-5 py-2.5 text-sm font-medium transition-all disabled:opacity-40">
            创建企业
          </button>
        </div>
        {code && (
          <div className="mt-3 p-3 bg-orange-50 rounded-xl border border-orange-200 flex items-center gap-3">
            <span className="text-sm font-medium text-orange-700">企业邀请码：</span>
            <span className="text-2xl font-bold tracking-[6px] text-orange-800">{code}</span>
            <span className="text-xs text-orange-500">发给员工输入即可加入</span>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 我的企业</h3>
        {orgs.length === 0 ? (
          <p className="text-sm text-gray-400">还没有创建企业</p>
        ) : (
          <div className="space-y-3">
            {orgs.map((org: any) => (
              <div key={org.id} className="flex items-center justify-between p-4 rounded-xl border border-[#e8e5df]">
                <div>
                  <div className="text-sm font-semibold text-gray-800">{org.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{org.memberCount} 成员</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-lg">邀请码: {org.inviteCode}</span>
                  <button onClick={() => navigator.clipboard.writeText(org.inviteCode)}
                    className="text-xs text-orange-500 hover:text-orange-700">复制</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
