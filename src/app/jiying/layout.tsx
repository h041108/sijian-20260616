"use client"
import Link from "next/link"

export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#05050A] text-white overflow-hidden">
      {/* 背景光效 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/8 blur-[120px]" />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] rounded-full bg-amber-500/5 blur-[100px]" />
      </div>

      {/* 顶栏 */}
      <header className="relative z-10">
        <div className="border-b border-white/[0.06] backdrop-blur-xl bg-black/20">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <Link href="/jiying" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-lg shadow-lg shadow-amber-500/20 group-hover:shadow-amber-500/40 transition-all">🎬</div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">即影</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {[
                { href: "/jiying/agents/agent-router", label: "赛道选择" },
                { href: "/jiying/onboarding", label: "账户设立" },
                { href: "/jiying/launch", label: "智能启动" },
                { href: "/jiying/studio", label: "创作工厂" },
                { href: "/jiying/review", label: "内容审核" },
                { href: "/jiying/portfolio", label: "我的作品" },
              ].map((item, i) => (
                <Link key={item.href} href={item.href}
                  className="relative px-3 py-1.5 text-sm text-white/50 hover:text-white transition-colors group">
                  {item.label}
                  <span className="absolute inset-x-3 bottom-0 h-[2px] bg-gradient-to-r from-amber-400 to-orange-500 scale-x-0 group-hover:scale-x-100 transition-transform rounded-full" />
                </Link>
              ))}
            </nav>
            {/* 移动端菜单 */}
            <details className="md:hidden relative">
              <summary className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-white/60 cursor-pointer">☰</summary>
              <div className="absolute right-0 top-full mt-2 w-48 bg-[#0c0c1e] border border-white/10 rounded-2xl p-2 z-50 backdrop-blur-xl shadow-2xl">
                {[
                  { href: "/jiying/agents/agent-router", label: "赛道选择" },
                  { href: "/jiying/onboarding", label: "账户设立" },
                  { href: "/jiying/launch", label: "智能启动" },
                  { href: "/jiying/studio", label: "创作工厂" },
                  { href: "/jiying/review", label: "内容审核" },
                  { href: "/jiying/portfolio", label: "我的作品" },
                ].map(item => (
                  <Link key={item.href} href={item.href}
                    className="block px-3 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all">{item.label}</Link>
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
