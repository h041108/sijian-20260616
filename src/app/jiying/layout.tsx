"use client"
import Link from "next/link"

export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4F4F6]">
      {/* 顶栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <Link href="/jiying" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2962FF] to-[#5B7FFF] flex items-center justify-center text-sm shadow-md">🎬</div>
            <span className="text-base font-bold text-[#1A1A2E] tracking-tight">即影</span>
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {[
              ["/jiying/manga", "漫剧生成"],
              ["/jiying/digital-human", "数字人口播"],
              ["/jiying/studio?tab=image", "超级图片社"],
              ["/jiying/portfolio", "作品展示"],
              ["/jiying/competition", "创作大赛"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="nav-link">{label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-1.5">
            <Link href="/jiying/agents/agent-router"
              className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[#2962FF] hover:bg-[#1A3DB0] rounded-lg transition-all shadow-sm">
              🤖 Agent智能调度中心
            </Link>
            {/* 移动端菜单 */}
            <details className="md:hidden relative">
              <summary className="w-8 h-8 flex items-center justify-center rounded-lg bg-white border border-black/[0.06] text-[#5A5A72] cursor-pointer">☰</summary>
              <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl border border-black/[0.06] shadow-lg p-1.5 z-50">
                {[
                  ["/jiying/manga", "漫剧生成"],
                  ["/jiying/digital-human", "数字人口播"],
                  ["/jiying/studio?tab=image", "超级图片社"],
                  ["/jiying/portfolio", "作品展示"],
                  ["/jiying/agents/agent-router", "Agent调度"],
                ].map(([href, label]) => (
                  <Link key={href} href={href} className="block px-3 py-2 text-sm text-[#5A5A72] hover:text-[#2962FF] hover:bg-[#2962FF]/5 rounded-lg transition-all">{label}</Link>
                ))}
              </div>
            </details>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
