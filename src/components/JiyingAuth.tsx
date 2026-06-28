"use client"
import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
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

  useEffect(() => {
    // 先从 localStorage 取模拟用户
    const raw = localStorage.getItem("sijian_session")
    if (raw) {
      try {
        const u = JSON.parse(raw) as SijianUser
        setUser(u)
        onUserChange?.(u)
        return
      } catch {}
    }
    // 再尝试 Supabase session
    supabase.auth.getSession().then(({ data: { session } }: any) => {
      if (session?.user) {
        const u: SijianUser = {
          id: session.user.id,
          openid: session.user.id,
          nickname: session.user.email?.split("@")[0] || "用户",
          avatar: "#F59E0B",
          role: "student",
          email: session.user.email || "",
          createdAt: session.user.created_at || new Date().toISOString(),
        }
        setUser(u)
        onUserChange?.(u)
        localStorage.setItem("sijian_session", JSON.stringify(u))
      }
    })
  }, [])

  const handleAuth = useCallback(async () => {
    setError("")
    setLoading(true)
    try {
      if (isSignUp) {
        const { error: e } = await supabase.auth.signUp({ email, password })
        if (e) { setError(e.message); return }
        setError("注册成功！请查看邮箱确认。")
      } else {
        const { data, error: e }: any = await supabase.auth.signInWithPassword({ email, password })
        if (e) { setError(e.message); return }
        if (data?.user) {
          const u: SijianUser = {
            id: data.user.id, openid: data.user.id,
            nickname: email.split("@")[0], avatar: "#F59E0B",
            role: "student", email, createdAt: new Date().toISOString(),
          }
          setUser(u)
          onUserChange?.(u)
          localStorage.setItem("sijian_session", JSON.stringify(u))
          setShowLogin(false)
        }
      }
    } catch { setError("网络错误") }
    setLoading(false)
  }, [email, password, isSignUp])

  const handleLogout = useCallback(() => {
    localStorage.removeItem("sijian_session")
    supabase.auth.signOut()
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

      {showLogin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setShowLogin(false)}>
          <div className="bg-[#1A1A2E] rounded-2xl p-6 shadow-2xl w-80 border border-[#F59E0B]/10" onClick={e => e.stopPropagation()}>
            <div className="text-2xl text-center mb-2">🎬</div>
            <h2 className="text-base font-bold text-[#E8E8F0] text-center mb-1">{isSignUp ? "注册即影" : "登录即影"}</h2>
            <p className="text-xs text-[#9898B0] text-center mb-4">登录后可保存作品到云端</p>

            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="邮箱" type="email"
              className="w-full mb-2 px-3 py-2.5 rounded-xl bg-[#0C0C14] border border-[#F59E0B]/10 text-[#E8E8F0] text-sm placeholder-[#5A5A72] focus:outline-none focus:border-[#F59E0B]/40" />
            <input value={password} onChange={e => setPassword(e.target.value)}
              placeholder="密码（至少6位）" type="password"
              className="w-full mb-3 px-3 py-2.5 rounded-xl bg-[#0C0C14] border border-[#F59E0B]/10 text-[#E8E8F0] text-sm placeholder-[#5A5A72] focus:outline-none focus:border-[#F59E0B]/40" />

            {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

            <button onClick={handleAuth} disabled={loading || !email || !password}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold transition-all disabled:opacity-40 mb-2">
              {loading ? "处理中..." : isSignUp ? "注册" : "登录"}
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#F59E0B]/10" /></div>
              <div className="relative flex justify-center"><span className="px-2 bg-[#1A1A2E] text-[10px] text-[#5A5A72]">或</span></div>
            </div>

            <button onClick={() => handleMockLogin("student")}
              className="w-full py-2 rounded-xl border border-[#F59E0B]/15 text-[#9898B0] hover:text-[#FBBF24] text-xs transition-all mb-2">
              👤 免登录体验（本地模式）
            </button>

            <button onClick={() => { setIsSignUp(!isSignUp); setError("") }}
              className="text-xs text-[#F59E0B]/60 hover:text-[#F59E0B] transition-colors block mx-auto mt-1">
              {isSignUp ? "已有账号？登录" : "没有账号？注册"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
