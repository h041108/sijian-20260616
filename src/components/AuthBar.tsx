"use client"

import { useState } from "react"
import { generateMockWechatLogin, registerUser, getCurrentUser, logout, UserRole, SijianUser } from "@/lib/sijian-user"

interface AuthBarProps {
  user: SijianUser | null
  onLogin: (user: SijianUser) => void
  onLogout: () => void
  onRoleChange: (role: UserRole) => void
}

export default function AuthBar({ user, onLogin, onLogout, onRoleChange }: AuthBarProps) {
  const [showPanel, setShowPanel] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [codeError, setCodeError] = useState("")
  const [codeSuccess, setCodeSuccess] = useState("")

  const handleLogin = () => {
    const mockUser = generateMockWechatLogin()
    const registered = registerUser(mockUser)
    onLogin(registered)
    setShowPanel(false)
  }

  const handleInviteSubmit = async () => {
    if (inviteCode.length !== 6) { setCodeError("邀请码为6位数字"); return }
    const { validateInviteCode, useInviteCode } = await import("@/lib/sijian-user")
    const invite = validateInviteCode(inviteCode)
    if (!invite) { setCodeError("邀请码无效或已过期"); return }
    const cu = getCurrentUser()
    if (!cu) { setCodeError("请先登录"); return }
    const result = useInviteCode(inviteCode, cu.id)
    if (result) {
      const labels: Record<string, string> = { parent_child: "家长绑定", teacher_student: "班级加入", enterprise_member: "企业加入" }
      setCodeSuccess(labels[invite.type] + "成功！")
      setCodeError("")
      setInviteCode("")
      setTimeout(() => { setCodeSuccess(""); setShowPanel(false) }, 2000)
    }
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => setShowPanel(true)}
          className="text-xs text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-xl transition-all">
          微信登录
        </button>
        {showPanel && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPanel(false)}>
            <div className="bg-white rounded-2xl p-8 shadow-2xl w-80 text-center" onClick={e => e.stopPropagation()}>
              <div className="text-4xl mb-4">💬</div>
              <h2 className="text-lg font-bold text-gray-800 mb-2">微信扫码登录</h2>
              <p className="text-xs text-gray-400 mb-5">开发环境模拟登录，点击即登录</p>

              {/* 模拟二维码 */}
              <div className="w-40 h-40 mx-auto mb-5 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 cursor-pointer hover:bg-green-50 hover:border-green-300 transition-all"
                onClick={handleLogin}>
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-lg bg-green-500 flex items-center justify-center">
                    <span className="text-white font-bold text-xl">微</span>
                  </div>
                  <div className="text-xs text-gray-400">点击模拟扫码</div>
                </div>
              </div>

              <div className="text-[10px] text-gray-300">正式版接入微信开放平台 OAuth 2.0</div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 relative">
      {/* 角色切换 */}
      <select
        value={user.role}
        onChange={e => onRoleChange(e.target.value as UserRole)}
        className="text-[11px] rounded-lg border border-[#a5d6a7] bg-white/80 px-2 py-1 text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-300">
        <option value="student">👤 学生</option>
        <option value="parent">👨‍👩‍👧 家长</option>
        <option value="teacher">👩‍🏫 教师</option>
        <option value="enterprise_admin">🏢 企业主</option>
        <option value="enterprise_member">💼 员工</option>
      </select>

      {/* 邀请码输入 */}
      <button onClick={() => setShowPanel(!showPanel)}
        className="text-[11px] text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg border border-[#a5d6a7] transition-all">
        🔗 输入邀请码
      </button>

      {/* 用户名 */}
      <span className="text-xs text-gray-600 font-medium">{user.nickname}</span>

      {/* 退出 */}
      <button onClick={() => { logout(); onLogout() }}
        className="text-[10px] text-gray-400 hover:text-red-500 ml-2">
        退出
      </button>

      {/* 邀请码面板 */}
      {showPanel && (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl border border-[#e8e5df] shadow-lg p-4 z-30">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">🔗 输入邀请码</h3>
          <p className="text-[11px] text-gray-400 mb-3">
            教师/家长/企业主给你一个6位邀请码，输入即可绑定关系
          </p>
          <div className="flex gap-2 mb-2">
            <input value={inviteCode} onChange={e => { setInviteCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCodeError(""); setCodeSuccess("") }}
              placeholder="6位数字"
              className="flex-1 rounded-lg border border-[#e8e5df] bg-gray-50 px-3 py-2 text-sm text-center tracking-widest text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-300"
              onKeyDown={e => e.key === "Enter" && handleInviteSubmit()} />
            <button onClick={handleInviteSubmit}
              disabled={inviteCode.length !== 6}
              className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-all disabled:opacity-40">
              确认
            </button>
          </div>
          {codeError && <p className="text-[11px] text-red-500 mt-1">{codeError}</p>}
          {codeSuccess && <p className="text-[11px] text-green-600 mt-1">{codeSuccess}</p>}
        </div>
      )}
    </div>
  )
}
