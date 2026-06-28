import { useState } from "react"
import { generateMockWechatLogin, registerUser, getCurrentUser, logout, validateInviteCode, useInviteCode, UserRole, SijianUser } from "@/lib/auth"

interface AuthBarProps {
  user: SijianUser | null
  onLogin: (user: SijianUser) => void
  onLogout: () => void
  onRoleChange: (role: UserRole) => void
}

export default function AuthBar({ user, onLogin, onLogout, onRoleChange }: AuthBarProps) {
  const [showPanel, setShowPanel] = useState(false)
  const [panelMode, setPanelMode] = useState<"login" | "invite">("invite")
  const [loginRole, setLoginRole] = useState<UserRole>("student")
  const [inviteCode, setInviteCode] = useState("")
  const [codeError, setCodeError] = useState("")
  const [codeSuccess, setCodeSuccess] = useState("")

  const handleLogin = async () => {
    const mockUser = generateMockWechatLogin(loginRole)
    const registered = await registerUser(mockUser)
    onLogin(registered)
    setShowPanel(false)
  }

  const handleInviteSubmit = async () => {
    if (inviteCode.length !== 6) { setCodeError("邀请码为6位数字"); return }
    const invite = validateInviteCode(inviteCode)
    if (!invite) { setCodeError("邀请码无效或已过期"); return }
    const cu = await getCurrentUser()
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

  // ── 未登录 ——
  if (!user) {
    return (
      <>
        <button onClick={() => { setPanelMode("login"); setShowPanel(true) }}
          className="text-[10px] text-gray-400 hover:text-indigo-600 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap">
          切换身份
        </button>
        {showPanel && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPanel(false)}>
            <div className="bg-white rounded-2xl p-6 shadow-2xl w-72 text-center" onClick={e => e.stopPropagation()}>
              <div className="text-3xl mb-3">💬</div>
              <h2 className="text-base font-bold text-gray-800 mb-1">登录思见</h2>
              <p className="text-xs text-gray-400 mb-4">选择身份后点击登录（开发环境模拟）</p>
              <div className="mb-4">
                <select value={loginRole} onChange={e => setLoginRole(e.target.value as UserRole)}
                  className="text-sm rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                  <option value="student">👤 学生</option>
                  <option value="parent">👨‍👩‍👧 家长</option>
                  <option value="teacher">👩‍🏫 教师</option>
                  <option value="enterprise_admin">🏢 企业主</option>
                  <option value="enterprise_member">💼 员工</option>
                </select>
              </div>
              <button onClick={handleLogin}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all">
                点击登录
              </button>
              <div className="text-[10px] text-gray-300 mt-3">正式版接入微信 OAuth 2.0</div>
            </div>
          </div>
        )}
      </>
    )
  }

  // ── 已登录 ——
  return (
    <>
      <span className="text-[10px] text-gray-500 whitespace-nowrap hidden sm:inline">{user.nickname}</span>
      <button onClick={() => { setPanelMode("invite"); setShowPanel(!showPanel) }}
        className="text-[10px] text-gray-400 hover:text-gray-600 whitespace-nowrap">🔗</button>
      <button onClick={() => { logout(); onLogout() }}
        className="text-[10px] text-gray-400 hover:text-red-500 whitespace-nowrap">退出</button>

      {/* 邀请码弹窗 */}
      {showPanel && panelMode === "invite" && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPanel(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-72" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">🔗 输入邀请码</h3>
            <p className="text-[11px] text-gray-400 mb-3">教师/家长/企业主给你一个6位邀请码，输入即可绑定关系</p>
            <div className="flex gap-2 mb-2">
              <input value={inviteCode} onChange={e => { setInviteCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCodeError(""); setCodeSuccess("") }}
                placeholder="6位数字"
                className="flex-1 rounded-lg border border-[#e8e5df] bg-gray-50 px-3 py-2 text-sm text-center tracking-widest text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onKeyDown={e => e.key === "Enter" && handleInviteSubmit} />
              <button onClick={handleInviteSubmit} disabled={inviteCode.length !== 6}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all disabled:opacity-40">确认</button>
            </div>
            {codeError && <p className="text-[11px] text-red-500 mt-1">{codeError}</p>}
            {codeSuccess && <p className="text-[11px] text-green-600 mt-1">{codeSuccess}</p>}
          </div>
        </div>
      )}
    </>
  )
}
