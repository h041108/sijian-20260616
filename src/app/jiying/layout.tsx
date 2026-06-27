"use client"
import Link from "next/link"

export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f7f4]">
      {/* 顶栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/jiying" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-lg shadow-lg shadow-indigo-500/10">🎬</div>
            <span className="text-lg font-bold tracking-tight text-gray-800">即影</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {[
              { href: "/jiying/agents/agent-router", label: "赛道选择" },
              { href: "/jiying/onboarding", label: "账户设立" },
              { href: "/jiying/launch", label: "智能启动" },
              { href: "/jiying/studio", label: "创作工厂" },
              { href: "/jiying/review", label: "内容审核" },
              { href: "/jiying/portfolio", label: "我的作品" },
            ].map(item => (
              <Link key={item.href} href={item.href}
                className="px-3 py-1.5 text-sm text-gray-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50/50">{item.label}</Link>
            ))}
          </nav>
          <details className="md:hidden relative">
            <summary className="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 text-gray-500 cursor-pointer">☰</summary>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-2xl p-2 z-50 shadow-xl">
              {[
                { href: "/jiying/agents/agent-router", label: "赛道选择" },
                { href: "/jiying/onboarding", label: "账户设立" },
                { href: "/jiying/launch", label: "智能启动" },
                { href: "/jiying/studio", label: "创作工厂" },
                { href: "/jiying/review", label: "内容审核" },
                { href: "/jiying/portfolio", label: "我的作品" },
              ].map(item => (
                <Link key={item.href} href={item.href}
                  className="block px-3 py-2 rounded-xl text-sm text-gray-500 hover:text-indigo-600 hover:bg-indigo-50/50 transition-all">{item.label}</Link>
              ))}
            </div>
          </details>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
