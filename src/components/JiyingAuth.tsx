"use client"
import { useState, useEffect, useCallback } from "react"
import type { SijianUser, UserRole } from "@/lib/auth"

interface JiyingAuthProps {
  onUserChange?: (user: SijianUser | null) => void
}

export default function JiyingAuth({ onUserChange }: JiyingAuthProps) {
  const [user, setUser] = useState<SijianUser | null>(null)
  const [showLogin, setShowLogin] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  // 初始化：从 localStorage 恢复 session
  useEffect(() => {
    const raw = localStorage.getItem("sijian_session")
    if (raw) {
      try {
        const u = JSON.parse(raw) as SijianUser
        setUser(u)
        onUserChange?.(u)
        return
      } catch {}
    }
    // 尝试服务端 session 恢复
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "session" }),
    }).then(r => r.json()).then(data => {
      if (data?.session?.user) {
        const s = data.session.user
        const u: SijianUser = {
          id: s.id, openid: s.id,
          nickname: s.email?.split("@")[0] || "用户",
          avatar: "#F59E0B", role: "student",
          email: s.email || "", createdAt: s.created_at || new Date().toISOString(),
        }
        setUser(u)
        onUserChange?.(u)
        localStorage.setItem("sijian_session", JSON.stringify(u))
      }
    }).catch(() => {})
  }, [])

  const handleAuth = useCallback(async () => {
    setError("")
    setLoading(true)
    try {
      const action = isSignUp ? "signup" : "signin"
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, email, password, nickname: email.split("@")[0] }),
      })
      const data = await res.json()

      if (data.error) {
        setError(data.error.includes("Email not confirmed")
          ? "邮箱确认中，请稍后重新登录。如持续失败，请告知管理员添加 SUPABASE_SERVICE_ROLE_KEY"
          : data.error)
        setLoading(false)
        return
      }

      if (isSignUp) {
        // 注册可能需邮箱确认，也可能是立即登录
        if (data.user?.identities?.length === 0) {
          setError("注册成功！请查看邮箱确认登录。")
        } else if (data.user) {
          const u: SijianUser = {
            id: data.user.id, openid: data.user.id,
            nickname: email.split("@")[0], avatar: "#F59E0B",
            role: "student", email, createdAt: new Date().toISOString(),
          }
          setUser(u)
          onUserChange?.(u)
          localStorage.setItem("sijian_session", JSON.stringify(u))
          setShowLogin(false)
        } else {
          setError("注册成功，请查看邮箱确认。")
        }
      } else {
        // 登录
        if (data.user) {
          const u: SijianUser = {
            id: data.user.id, openid: data.user.id,
            nickname: email.split("@")[0], avatar: "#F59E0B",
            role: "student", email, createdAt: new Date().toISOString(),
          }
          setUser(u)
          onUserChange?.(u)
          localStorage.setItem("sijian_session", JSON.stringify(u))
          setShowLogin(false)
        } else if (data.session?.user) {
          const s = data.session.user
          const u: SijianUser = {
            id: s.id, openid: s.id,
            nickname: email.split("@")[0], avatar: "#F59E0B",
            role: "student", email, createdAt: new Date().toISOString(),
          }
          setUser(u)
          onUserChange?.(u)
          localStorage.setItem("sijian_session", JSON.stringify(u))
          setShowLogin(false)
        } else {
          setError(data?.error || data?.message || "登录失败")
        }
      }
    } catch (e: any) {
      setError(e?.message || "网络错误")
    }
    setLoading(false)
  }, [email, password, isSignUp])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("sijian_session")
    fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signout" }),
    }).catch(() => {})
    setUser(null)
    onUserChange?.(null)
  }, [])

  const handleMockLogin = useCallback((role: UserRole = "student") => {
    const id = `mock_${Date.now()}`
    const names: Record<string, string> = { student: "体验用户", teacher: "教师用户", enterprise_admin: "企业用户" }
    const u: SijianUser = {
      id, openid: id, nickname: names[role] || "体验用户",
      avatar: "#F59E0B", role, createdAt: new Date().toISOString(),
    }
    setUser(u)
    onUserChange?.(u)
    localStorage.setItem("sijian_session", JSON.stringify(u))
    setShowLogin(false)
  }, [])

  return (
    <>
      <div className="flex items-center gap-2">
        {user ? (
          <>
            <span className="text-xs text-[#9898B0] hidden sm:inline">{user.nickname}</span>
            <button onClick={handleLogout}
              className="text-[10px] text-[#5A5A72] hover:text-red-400 transition-colors">退出</button>
          </>
        ) : (
          <button onClick={() => setShowLogin(true)}
            className="text-[10px] text-[#F59E0B] hover:text-[#FBBF24] transition-colors px-2 py-1 rounded-lg border border-[#F59E0B]/20 hover:bg-[#F59E0B]/8">
            登录
          </button>
        )}
      </div>

      {/* 登录/注册弹窗 — 居中显示 — 全实心不透 */}
      {showLogin && (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4" onClick={() => setShowLogin(false)}>
          <div className="relative bg-[#1A1A2E] rounded-2xl p-8 shadow-2xl w-full max-w-sm border border-[#F59E0B]/15 backdrop-blur-none" onClick={e => e.stopPropagation()}>
            {/* 关闭按钮 */}
            <button onClick={() => setShowLogin(false)}
              className="float-right text-white/30 hover:text-white/60 text-lg leading-none">✕</button>

            <div className="text-center mb-6">
              <div className="text-3xl mb-3">🎬</div>
              <h2 className="text-lg font-bold text-[#E8E8F0]">{isSignUp ? "注册即影" : "登录即影"}</h2>
              <p className="text-xs text-[#9898B0] mt-1">登录后可保存作品到云端</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-[#5A5A72] mb-1 block">邮箱</label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com" type="email" autoFocus
                  className="w-full px-4 py-3 rounded-xl bg-[#0C0C14] border border-[#F59E0B]/10 text-[#E8E8F0] text-sm placeholder-[#5A5A72] focus:outline-none focus:border-[#F59E0B]/40 transition-colors" />
              </div>
              <div>
                <label className="text-[10px] text-[#5A5A72] mb-1 block">密码</label>
                <input value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="至少 6 位" type="password"
                  onKeyDown={e => e.key === "Enter" && handleAuth()}
                  className="w-full px-4 py-3 rounded-xl bg-[#0C0C14] border border-[#F59E0B]/10 text-[#E8E8F0] text-sm placeholder-[#5A5A72] focus:outline-none focus:border-[#F59E0B]/40 transition-colors" />
              </div>
            </div>

            {error && (
              <div className="mt-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400 text-center">
                {error}
              </div>
            )}

            <button onClick={handleAuth} disabled={loading || !email || !password}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold transition-all disabled:opacity-40 hover:shadow-lg hover:shadow-[#F59E0B]/20">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-3 h-3 rounded-full border-2 border-[#0C0C14] border-t-transparent animate-spin" />
                  处理中...
                </span>
              ) : isSignUp ? "注册" : "登录"}
            </button>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#F59E0B]/10" /></div>
              <div className="relative flex justify-center">
                <span className="px-3 bg-[#1A1A2E] text-[10px] text-[#5A5A72]">或</span>
              </div>
            </div>

            <button onClick={() => handleMockLogin("student")}
              className="w-full py-2.5 rounded-xl border border-[#F59E0B]/15 text-[#9898B0] hover:text-[#FBBF24] hover:bg-[#F59E0B]/5 text-xs transition-all">
              👤 免登录体验
            </button>

            <button onClick={() => { setIsSignUp(!isSignUp); setError("") }}
              className="w-full mt-3 text-xs text-[#F59E0B]/60 hover:text-[#F59E0B] transition-colors text-center block">
              {isSignUp ? "已有账号？点此登录" : "没有账号？点此注册"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
