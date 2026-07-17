"use client"
import Link from "next/link"
import { useState, useEffect, createContext, useContext } from "react"
import { createPortal } from "react-dom"
import type { SijianUser, UserRole } from "@/lib/auth"

export const JiyingUserContext = createContext<{ user: SijianUser | null; setUser: (u: SijianUser | null) => void }>({
  user: null, setUser: () => {},
})
export const useJiyingUser = () => useContext(JiyingUserContext)

import JiyingSearch from "@/components/JiyingSearch"
import NotificationBell from "@/components/NotificationBell"
import PhoneAuth from "@/components/PhoneAuth"

// Portal 登录弹窗 — 始终渲染到 body 最顶层
function AuthModal({
  isSignUp, email, password, error, loading, authMode,
  onEmailChange, onPasswordChange, onAuth, onMockLogin, onToggleMode, onClose, onSetAuthMode,
}: {
  isSignUp: boolean; email: string; password: string; error: string; loading: boolean; authMode: "email" | "phone"
  onEmailChange: (v: string) => void; onPasswordChange: (v: string) => void
  onAuth: () => void; onMockLogin: () => void; onToggleMode: () => void; onClose: () => void
  onSetAuthMode: (m: "email" | "phone") => void
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-[2147483647] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/85" />
      <div className="relative bg-[#1A1A2E] rounded-2xl p-8 shadow-2xl w-full max-w-sm border border-[#F59E0B]/15" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="float-right text-white/30 hover:text-white/60 text-lg leading-none">✕</button>
        <div className="text-center mb-6">
          <div className="text-3xl mb-3">🎬</div>
          <h2 className="text-lg font-bold text-[#E8E8F0]">{isSignUp ? "注册即影" : "登录即影"}</h2>
          <p className="text-xs text-[#9898B0] mt-1">登录后可捆绑自媒体账号，同步内容数据</p>
        </div>

        {/* 登录方式切换 */}
        <div className="flex gap-1 bg-white/[0.03] rounded-xl p-1 mb-4">
          <button onClick={() => onSetAuthMode("email")}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${authMode === "email" ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "text-white/40"}`}>
            📧 邮箱
          </button>
          <button onClick={() => onSetAuthMode("phone")}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-medium transition-all ${authMode === "phone" ? "bg-[#F59E0B]/15 text-[#F59E0B]" : "text-white/40"}`}>
            📱 手机号
          </button>
        </div>

        {authMode === "email" ? (
          <>
            <div className="space-y-3">
              <input value={email} onChange={e => onEmailChange(e.target.value)}
                placeholder="邮箱" type="email"
                className="w-full px-4 py-3 rounded-xl bg-[#0C0C14] border border-[#F59E0B]/10 text-[#E8E8F0] text-sm placeholder-[#5A5A72] focus:outline-none focus:border-[#F59E0B]/40" />
              <input value={password} onChange={e => onPasswordChange(e.target.value)}
                placeholder="密码" type="password" onKeyDown={e => e.key === "Enter" && onAuth()}
                className="w-full px-4 py-3 rounded-xl bg-[#0C0C14] border border-[#F59E0B]/10 text-[#E8E8F0] text-sm placeholder-[#5A5A72] focus:outline-none focus:border-[#F59E0B]/40" />
            </div>
            {error && <div className="mt-3 text-xs text-red-400 text-center">{error}</div>}
            <button onClick={onAuth} disabled={loading || !email || !password}
              className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold disabled:opacity-40">
              {loading ? "处理中..." : isSignUp ? "注册" : "登录"}
            </button>
            <button onClick={onToggleMode}
              className="w-full mt-3 text-xs text-[#F59E0B]/60 hover:text-[#F59E0B] text-center block">
              {isSignUp ? "已有账号？点此登录" : "没有账号？点此注册"}
            </button>
          </>
        ) : (
          <PhoneAuth
            onSuccess={(phone) => {
              // 手机号验证成功 → 自动创建用户或关联已有账号
              const u: SijianUser = {
                id: `phone_${Date.now()}`,
                openid: phone,
                nickname: phone.slice(-4),
                avatar: "#F59E0B",
                role: "student",
                phone,
                createdAt: new Date().toISOString(),
              }
              localStorage.setItem("sijian_session", JSON.stringify(u))
              localStorage.setItem("sijian_phone", phone)
              // 通过 layout 的 setUser
              const event = new CustomEvent("jiying_phone_login", { detail: u })
              window.dispatchEvent(event)
              onClose()
            }}
            onCancel={() => onSetAuthMode("email")}
          />
        )}

        {authMode === "email" && (
          <>
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#F59E0B]/10" /></div>
              <div className="relative flex justify-center"><span className="px-3 bg-[#1A1A2E] text-[10px] text-[#5A5A72]">或</span></div>
            </div>
            <button onClick={onMockLogin}
              className="w-full py-2.5 rounded-xl border border-[#F59E0B]/15 text-[#9898B0] hover:text-[#FBBF24] text-xs">👤 免登录体验</button>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}

const NAV_ITEMS = [
  { href: "/jiying/agents", label: "🤖 AI引擎" },
  { href: "/jiying/daily-content", label: "📋 每日内容" },
  { href: "/jiying/manga", label: "🎬 即刻影片工厂" },
  { href: "/jiying/digital-human", label: "🎙️ 数字人口播" },
  { href: "/jiying/studio", label: "🖼️ 超级图片社" },
  { href: "/jiying/media-library", label: "🗂️ 素材库" },
  { href: "/jiying/portfolio", label: "🖼️ 作品展示" },
  { href: "/jiying/drama", label: "🎭 短剧工坊" },
]

export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SijianUser | null>(null)
  const [isPaid, setIsPaid] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [authMode, setAuthMode] = useState<"email" | "phone">("email")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [usageCount, setUsageCount] = useState(0)
  const [usageLimit, setUsageLimit] = useState(3)
  const [userLevel, setUserLevel] = useState("青铜")
  const [quotaPlan, setQuotaPlan] = useState("free")

  useEffect(() => {
    const raw = localStorage.getItem("sijian_session")
    if (raw) {
      try { const u = JSON.parse(raw) as SijianUser; setUser(u) } catch {}
    }
    setIsPaid(localStorage.getItem("sijian_paid") === "true")
      try { const u = parseInt(localStorage.getItem("jiying_usage_count") || "0", 10); if (!isNaN(u)) setUsageCount(u) } catch {}
      try { const l = localStorage.getItem("jiying_level") || "青铜"; setUserLevel(l) } catch {}

    // 从后端 API 获取真实配额和等级（失败时保留 localStorage 降级数据）
    const fetchQuotaAndLevel = async () => {
      try {
        const [quotaRes, levelRes] = await Promise.all([
          fetch("/api/user/quota"),
          fetch("/api/user/level"),
        ])
        if (quotaRes.ok) {
          const q = await quotaRes.json()
          setUsageCount(q.used)
          setUsageLimit(q.limit)
          setQuotaPlan(q.plan)
          if (q.level) setUserLevel(q.level)
        }
        if (levelRes.ok) {
          const lv = await levelRes.json()
          setUserLevel(lv.level)
        }
      } catch {
        // 静默降级到 localStorage 值
      }
    }
    fetchQuotaAndLevel()

    import("@/lib/supabase").then(m => {
      const sb = m.supabase
      sb.auth.getSession().then(({ data }: any) => {
        if (data?.session?.user) {
          const s = data.session.user
          const u: SijianUser = {
            id: s.id, openid: s.id, nickname: s.email?.split("@")[0] || "用户",
            avatar: "#F59E0B", role: "student", email: s.email || "", createdAt: s.created_at || "",
          }
          setUser(u); localStorage.setItem("sijian_session", JSON.stringify(u))
          sb.from("subscriptions").select("plan_id").eq("user_id", s.id).single().then(({ data: sd }: any) => {
            if (sd?.plan_id && sd.plan_id !== "free") { setIsPaid(true); localStorage.setItem("sijian_paid", "true") }
          }).catch(() => {})
          // 订阅确认后刷新配额和等级
          fetchQuotaAndLevel()
        }
      }).catch(() => {})
    }).catch(() => {})
  }, [])

  const handleAuth = async () => {
    setError(""); setLoading(true)
    try {
      const action = isSignUp ? "signup" : "signin"
      const res = await fetch("/api/auth", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: isSignUp ? "signup" : "signin", email, password, nickname: email.split("@")[0] }),
      })
      const data = await res.json()
      if (data.error) { if (data.error.includes("Email not confirmed")) setError("请稍后重试"); else setError(data.error); setLoading(false); return }
      if (data.user || data.session?.user) {
        const s = data.user || data.session.user
        const u: SijianUser = { id: s.id, openid: s.id, nickname: email.split("@")[0], avatar: "#F59E0B", role: "student", email, createdAt: new Date().toISOString() }
        localStorage.setItem("sijian_session", JSON.stringify(u)); setUser(u); setAuthOpen(false)
      } else { setError(data?.message || "登录失败") }
    } catch { setError("网络错误") }
    setLoading(false)
  }

  const handleMockLogin = () => {
    const u: SijianUser = { id: `mock_${Date.now()}`, openid: `mock_${Date.now()}`, nickname: "体验用户", avatar: "#F59E0B", role: "student", createdAt: new Date().toISOString() }
    localStorage.setItem("sijian_session", JSON.stringify(u)); setUser(u); setAuthOpen(false)
  }

  return (
    <JiyingUserContext.Provider value={{ user, setUser }}>
    <div className="min-h-screen bg-[#0C0C14]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[10%] w-[50%] h-[50%] rounded-full bg-[#F59E0B]/3 blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[10%] w-[45%] h-[45%] rounded-full bg-[#F97316]/3 blur-[140px]" style={{ animationDelay: "1.5s" }} />
      </div>
      <header className="relative z-10 bg-[#0C0C14]/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/jiying" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-sm shadow-md">🎬</div>
              <span className="text-base font-bold text-[#E8E8F0] tracking-tight">即影</span>
            </Link>
            <nav className="hidden md:flex items-center gap-0.5">
              {NAV_ITEMS.map(item => (
                <Link key={item.href} href={item.href} className="px-3 py-1.5 text-sm text-[#9898B0] hover:text-[#FBBF24] rounded-lg hover:bg-[#F59E0B]/8">{item.label}</Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <JiyingSearch />
            <NotificationBell />
            {user && (
              <div className="flex items-center gap-1.5 text-[10px] text-[#5A5A72] bg-[#0C0C14] px-2.5 py-1 rounded-lg border border-[#2A2A38]">
                <span className={"w-1.5 h-1.5 rounded-full " + (usageCount < usageLimit ? "bg-green-400" : "bg-red-400")} />
                <span className="font-medium text-[#9898B0]">{usageLimit - usageCount}</span>
                <span className="text-[#5A5A72]">/ {usageLimit}</span>
              </div>
            )}
            {user && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-medium text-[#F59E0B]/80 bg-[#F59E0B]/8 px-2 py-1 rounded-lg border border-[#F59E0B]/15">
                {userLevel === "青铜" ? "🥉" : userLevel === "白银" ? "🥈" : "🥇"} {userLevel}
              </span>
            )}
            {user && !isPaid && (
              <Link href="/jiying/pricing"
                className="hidden sm:inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold text-[#0C0C14] bg-gradient-to-r from-[#F59E0B] to-[#F97316] rounded-full hover:shadow-lg hover:shadow-[#F59E0B]/20 transition-all">
                ⬆ 升级
              </Link>
            )}
            {user ? (
              <button onClick={() => { localStorage.removeItem("sijian_session"); localStorage.removeItem("sijian_paid"); setUser(null); setIsPaid(false); setUsageCount(0); setUserLevel("青铜") }}
                className="text-[10px] text-[#5A5A72] hover:text-[#EF4444] px-2 py-1 rounded-lg border border-[#2A2A38] hover:border-[#EF4444]/30 hover:bg-[#EF4444]/8">
                退出
              </button>
            ) : (
              <button onClick={() => setAuthOpen(true)}
                className="text-[10px] text-[#F59E0B] hover:text-[#FBBF24] px-2 py-1 rounded-lg border border-[#F59E0B]/20 hover:bg-[#F59E0B]/8">
                登录
              </button>
            )}
            {user && (
              <Link href="/jiying/portfolio" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0C0C14] text-[#9898B0] hover:text-[#FBBF24] text-sm">
                <span>👤</span><span className="hidden sm:inline">{user.nickname}</span>
              </Link>
            )}
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg bg-[#0C0C14] text-[#9898B0] hover:text-[#FBBF24]">
              {mobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
      )}

      {user && !isPaid && (
        <div className="relative z-10 bg-gradient-to-r from-[#F59E0B]/10 to-[#F97316]/10 border-b border-[#F59E0B]/20 px-4 py-2 text-center">
          <Link href="/jiying/pricing" className="text-xs text-[#F59E0B] hover:text-[#FBBF24]">💎 花20元开启你的自媒体公司 — 选套餐扫码支付 →</Link>
        </div>
      )}

      <main className="relative z-10">{children}</main>
    </div>

    {/* ═══ 登录弹窗 — 使用 Portal 渲染到 body，确保永远在最顶层 ═══ */}
    {authOpen && <AuthModal
      isSignUp={isSignUp}
      email={email}
      password={password}
      error={error}
      loading={loading}
      authMode={authMode}
      onEmailChange={setEmail}
      onPasswordChange={setPassword}
      onAuth={handleAuth}
      onMockLogin={handleMockLogin}
      onToggleMode={() => { setIsSignUp(!isSignUp); setError("") }}
      onClose={() => setAuthOpen(false)}
      onSetAuthMode={setAuthMode}
    />}
    </JiyingUserContext.Provider>
  )
}
