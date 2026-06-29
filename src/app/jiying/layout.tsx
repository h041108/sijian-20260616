"use client"
import Link from "next/link"
import { useState, useEffect, createContext, useContext } from "react"
import JiyingAuth from "@/components/JiyingAuth"
import type { SijianUser } from "@/lib/auth"

export const JiyingUserContext = createContext<{ user: SijianUser | null; setUser: (u: SijianUser | null) => void }>({
  user: null, setUser: () => {},
})
export const useJiyingUser = () => useContext(JiyingUserContext)

const NAV_ITEMS = [
  { href: "/jiying/agents/agent-router", label: "🤖 AI引擎" },
  { href: "/jiying/daily-content", label: "📋 每日内容" },
  { href: "/jiying/manga", label: "🎬 即刻影片工厂" },
  { href: "/jiying/digital-human", label: "🎙️ 数字人口播" },
  { href: "/jiying/studio", label: "🖼️ 超级图片社" },
  { href: "/jiying/media-library", label: "🗂️ 素材库" },
  { href: "/jiying/portfolio", label: "🖼️ 作品展示" },
]

const MEMBER_PATHS = [
  "/jiying/daily-content", "/jiying/manga", "/jiying/digital-human",
  "/jiying/studio", "/jiying/media-library", "/jiying/agents/agent-",
]

function isMemberOnly(path: string): boolean {
  return MEMBER_PATHS.some(p => path.startsWith(p))
}

export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SijianUser | null>(null)
  const [isPaid, setIsPaid] = useState(false)

  useEffect(() => {
    const raw = localStorage.getItem("sijian_session")
    if (raw) {
      try {
        const u = JSON.parse(raw) as SijianUser
        setUser(u)
      } catch {}
    }
    const paid = localStorage.getItem("sijian_paid") === "true"
    setIsPaid(paid)
  }, [])

  return (
    <JiyingUserContext.Provider value={{ user, setUser }}>
    <div className="min-h-screen bg-[#0C0C14]">
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[10%] w-[50%] h-[50%] rounded-full bg-[#F59E0B]/3 blur-[140px] animate-pulse-soft" />
        <div className="absolute bottom-[-15%] right-[10%] w-[45%] h-[45%] rounded-full bg-[#F97316]/3 blur-[140px] animate-pulse-soft" style={{ animationDelay: "1.5s" }} />
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
                <Link key={item.href} href={item.href}
                  className="px-3 py-1.5 text-sm text-[#9898B0] hover:text-[#FBBF24] transition-colors rounded-lg hover:bg-[#F59E0B]/8">
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <JiyingAuth onUserChange={setUser} />
            {user && (
              <Link href="/jiying/portfolio" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0C0C14] text-[#9898B0] hover:text-[#FBBF24] transition-all text-sm">
                <span>👤</span>
                <span className="hidden sm:inline">{user.nickname}</span>
              </Link>
            )}
            <details className="md:hidden relative">
              <summary className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0C0C14] text-[#9898B0] cursor-pointer">☰</summary>
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#1A1A2E] rounded-xl border border-white/[0.06] shadow-lg p-2 z-50">
                {NAV_ITEMS.map(item => (
                  <Link key={item.href} href={item.href}
                    className="block px-3 py-2 rounded-xl text-sm text-[#9898B0] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8">
                    {item.label}
                  </Link>
                ))}
                <hr className="my-1 border-white/[0.06]" />
                <Link href="/" className="block px-3 py-2 rounded-xl text-sm text-[#5A5A72] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8">← 思见首页</Link>
              </div>
            </details>
          </div>
        </div>
      </header>

      {/* 非会员提示横幅 — 显示在所有功能页顶部 */}
      {user && !isPaid && (
        <div className="relative z-10 bg-gradient-to-r from-[#F59E0B]/10 to-[#F97316]/10 border-b border-[#F59E0B]/20 px-4 py-2 text-center">
          <Link href="/jiying" className="text-xs text-[#F59E0B] hover:text-[#FBBF24] transition-colors">
            💎 花20元开启你的自媒体公司 — 点击解锁全部功能 →
          </Link>
        </div>
      )}

      <main className="relative z-10">{children}</main>
    </div>
    </JiyingUserContext.Provider>
  )
}
