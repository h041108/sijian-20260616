"use client"
import Link from "next/link"

export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#070b17] text-[#f0f2f5] overflow-hidden">
      {/* 环境光晕 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[140px] animate-pulse-soft" />
        <div className="absolute bottom-[-15%] right-[10%] w-[45%] h-[45%] rounded-full bg-emerald-500/5 blur-[140px] animate-pulse-soft" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-amber-500/3 blur-[100px]" />
      </div>

      <header className="relative z-10">
        <div className="border-b border-white/[0.04] backdrop-blur-xl bg-[#070b17]/70">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/jiying" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-lg shadow-lg shadow-teal-500/15 group-hover:shadow-teal-500/30 transition-all">🎬</div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">即影</span>
            </Link>
            <nav className="hidden md:flex items-center gap-0.5">
              {[
                ["/jiying/agents/agent-router", "赛道选择"],
                ["/jiying/onboarding", "账户设立"],
                ["/jiying/launch", "智能启动"],
                ["/jiying/studio", "创作工厂"],
                ["/jiying/review", "内容审核"],
                ["/jiying/portfolio", "我的作品"],
              ].map(([href, label]) => (
                <Link key={href} href={href}
                  className="px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">{label}</Link>
              ))}
            </nav>
            <details className="md:hidden relative">
              <summary className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/[0.04] text-white/40 cursor-pointer">☰</summary>
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#0a1120] border border-white/[0.06] rounded-2xl p-2 z-50 backdrop-blur-xl shadow-2xl">
                {[
                  ["/jiying/agents/agent-router", "赛道选择"],
                  ["/jiying/onboarding", "账户设立"],
                  ["/jiying/launch", "智能启动"],
                  ["/jiying/studio", "创作工厂"],
                  ["/jiying/review", "内容审核"],
                  ["/jiying/portfolio", "我的作品"],
                ].map(([href, label]) => (
                  <Link key={href} href={href}
                    className="block px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.04] transition-all">{label}</Link>
                ))}
              </div>
            </details>
          </div>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  )
}
