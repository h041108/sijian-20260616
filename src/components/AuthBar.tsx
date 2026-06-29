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
  const [panelMode, setPanelMode] = useState<"login" | "invite">("login")
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

  return (
    <>
      {/* 登录按钮 — 始终可见 */}
      <button onClick={() => { setPanelMode("login"); setShowPanel(true) }}
        className="text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap shadow-sm">
        {user ? "切换" : "登录"}
      </button>

      {user && (
        <>
          <span className="text-xs text-gray-500 whitespace-nowrap hidden sm:inline">{user.nickname}</span>
          <button onClick={() => { logout(); onLogout() }}
            className="text-[10px] text-gray-400 hover:text-red-500 whitespace-nowrap">退出</button>
        </>
      )}

      {/* 登录弹窗 */}
      {showPanel && panelMode === "login" && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowPanel(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="text-3xl mb-2">💬</div>
              <h2 className="text-lg font-bold text-gray-800">登录思见</h2>
              <p className="text-xs text-gray-400 mt-1">选择身份后点击登录（开发环境模拟）</p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-gray-500 mb-1.5 block">选择身份</label>
              <select value={loginRole} onChange={e => setLoginRole(e.target.value as UserRole)}
                className="w-full text-sm rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <option value="student">👤 学生</option>
                <option value="parent">👨‍👩‍👧 家长</option>
                <option value="teacher">👩‍🏫 教师</option>
                <option value="enterprise_admin">🏢 企业主</option>
                <option value="enterprise_member">💼 员工</option>
              </select>
            </div>

            <button onClick={handleLogin}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all shadow-sm">
              点击登录
            </button>

            <div className="mt-4 pt-4 border-t border-gray-100">
              <button onClick={() => { setPanelMode("invite"); setCodeError(""); setCodeSuccess("") }}
                className="w-full text-xs text-indigo-500 hover:text-indigo-700 text-center block">
                有邀请码？点此绑定
              </button>
            </div>

            <div className="text-[10px] text-gray-300 mt-3 text-center">正式版接入微信 OAuth 2.0</div>
          </div>
        </div>
      )}

      {/* 邀请码弹窗 */}
      {showPanel && panelMode === "invite" && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4" onClick={() => setShowPanel(false)}>
          <div className="bg-white rounded-2xl p-6 shadow-2xl w-full max-w-sm mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-700">🔗 输入邀请码</h3>
              <button onClick={() => setShowPanel(false)} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
            </div>
            <p className="text-xs text-gray-400 mb-4">教师/家长/企业主给你一个6位邀请码，输入即可绑定关系</p>
            <div className="flex gap-2 mb-3">
              <input value={inviteCode} onChange={e => { setInviteCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setCodeError(""); setCodeSuccess("") }}
                placeholder="6位数字"
                className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-center tracking-widest text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                onKeyDown={e => e.key === "Enter" && handleInviteSubmit} />
              <button onClick={handleInviteSubmit} disabled={inviteCode.length !== 6}
                className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-all disabled:opacity-40">确认</button>
            </div>
            {codeError && <p className="text-xs text-red-500 mb-1">{codeError}</p>}
            {codeSuccess && <p className="text-xs text-green-600 mb-1">{codeSuccess}</p>}
            <button onClick={() => setPanelMode("login")} className="text-xs text-indigo-500 hover:text-indigo-700 mt-2">← 返回登录</button>
          </div>
        </div>
      )}
    </>
  )
}
