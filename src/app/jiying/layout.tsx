"use client"
import Link from "next/link"

export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0f1929] text-[#e8edf5] overflow-hidden">
      {/* 环境光晕 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[10%] w-[50%] h-[50%] rounded-full bg-teal-500/5 blur-[140px] animate-pulse-soft" />
        <div className="absolute bottom-[-15%] right-[10%] w-[45%] h-[45%] rounded-full bg-emerald-500/5 blur-[140px] animate-pulse-soft" style={{ animationDelay: "1.5s" }} />
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-amber-500/3 blur-[100px]" />
      </div>
      <header className="relative z-10">
        <div className="border-b border-white/[0.04] backdrop-blur-xl bg-[#0f1929]/70">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/jiying" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-lg shadow-lg shadow-teal-500/15">🎬</div>
                <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">即影</span>
              </Link>
              <nav className="hidden md:flex items-center gap-0.5">
                <Link href="/jiying/agents/agent-router" className="px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">🤖 Agent智能调度中心</Link>
                <Link href="/jiying/manga" className="px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">📚 漫剧一键生成</Link>
                <Link href="/jiying/orchestrator" className="px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">🎙️ 数字人口播</Link>
                <Link href="/jiying/studio?tab=image" className="px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">🖼️ 超级图片社</Link>
                <Link href="/jiying/portfolio" className="px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">🖼️ 作品展示</Link>
                <Link href="/jiying/competition" className="px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors rounded-lg hover:bg-white/[0.04]">🏆 创作大赛</Link>
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <button className="w-8 h-8 flex items-center justify-center rounded-lg text-white/30 hover:text-white/60 hover:bg-white/[0.04] transition-all">🔔</button>
              <Link href="/jiying/portfolio" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] text-white/40 hover:text-white hover:bg-white/[0.06] text-sm transition-all">
                <span>👤</span>
                <span className="hidden sm:inline">我的作品</span>
              </Link>
              <details className="md:hidden relative">
                <summary className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/[0.04] text-white/40 cursor-pointer">☰</summary>
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#0f1929] border border-white/[0.06] rounded-2xl p-2 z-50 backdrop-blur-xl shadow-2xl">
                  <Link href="/jiying/agents/agent-router" className="block px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.04]">🤖 Agent智能调度中心</Link>
                  <Link href="/jiying/manga" className="block px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.04]">📚 漫剧一键生成</Link>
                  <Link href="/jiying/orchestrator" className="block px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.04]">🎙️ 数字人口播</Link>
                  <Link href="/jiying/studio?tab=image" className="block px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.04]">🖼️ 超级图片社</Link>
                  <Link href="/jiying/portfolio" className="block px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.04]">🖼️ 作品展示</Link>
                  <Link href="/jiying/competition" className="block px-3 py-2 rounded-xl text-sm text-white/50 hover:text-white hover:bg-white/[0.04]">🏆 创作大赛</Link>
                  <Link href="/" className="block px-3 py-2 rounded-xl text-sm text-white/30 hover:text-white/50 mt-1 border-t border-white/[0.04] pt-2">思见首页</Link>
                </div>
              </details>
            </div>
          </div>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  )
}
