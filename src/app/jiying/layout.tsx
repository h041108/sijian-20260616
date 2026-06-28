"use client"
import Link from "next/link"

export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0C0C14]">
      {/* 环境光晕 */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-15%] left-[10%] w-[50%] h-[50%] rounded-full bg-[#F59E0B]/3 blur-[140px] animate-pulse-soft" />
        <div className="absolute bottom-[-15%] right-[10%] w-[45%] h-[45%] rounded-full bg-[#F97316]/3 blur-[140px] animate-pulse-soft" style={{ animationDelay: "1.5s" }} />
      </div>
      <header className="relative z-10 bg-[#0C0C14]/80 backdrop-blur-xl border-b border-black/[0.04]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/jiying" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#F59E0B] to-[#F97316] flex items-center justify-center text-sm shadow-md">🎬</div>
              <span className="text-base font-bold text-[#1A1A2E] tracking-tight">即影</span>
            </Link>
            <nav className="hidden md:flex items-center gap-0.5">
              <Link href="/jiying/agents/agent-router" className="px-3 py-1.5 text-sm text-[#9898B0] hover:text-[#FBBF24] transition-colors rounded-lg hover:bg-[#F59E0B]/8">🤖 Agent智能调度中心</Link>
              <Link href="/jiying/manga" className="px-3 py-1.5 text-sm text-[#9898B0] hover:text-[#FBBF24] transition-colors rounded-lg hover:bg-[#F59E0B]/8">📚 漫剧一键生成</Link>
              <Link href="/jiying/digital-human" className="px-3 py-1.5 text-sm text-[#9898B0] hover:text-[#FBBF24] transition-colors rounded-lg hover:bg-[#F59E0B]/8">🎙️ 数字人口播</Link>
              <Link href="/jiying/studio?tab=image" className="px-3 py-1.5 text-sm text-[#9898B0] hover:text-[#FBBF24] transition-colors rounded-lg hover:bg-[#F59E0B]/8">🖼️ 超级图片社</Link>
              <Link href="/jiying/portfolio" className="px-3 py-1.5 text-sm text-[#9898B0] hover:text-[#FBBF24] transition-colors rounded-lg hover:bg-[#F59E0B]/8">🖼️ 作品展示</Link>
              <Link href="/jiying/competition" className="px-3 py-1.5 text-sm text-[#9898B0] hover:text-[#FBBF24] transition-colors rounded-lg hover:bg-[#F59E0B]/8">🏆 创作大赛</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/jiying/portfolio" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#0C0C14] text-[#9898B0] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8 text-sm transition-all">
              <span>👤</span>
              <span className="hidden sm:inline">我的作品</span>
            </Link>
            <details className="md:hidden relative">
              <summary className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0C0C14] text-[#9898B0] cursor-pointer">☰</summary>
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl border border-black/[0.06] shadow-lg p-2 z-50">
                <Link href="/jiying/agents/agent-router" className="block px-3 py-2 rounded-xl text-sm text-[#9898B0] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8">🤖 Agent智能调度中心</Link>
                <Link href="/jiying/manga" className="block px-3 py-2 rounded-xl text-sm text-[#9898B0] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8">📚 漫剧一键生成</Link>
                <Link href="/jiying/digital-human" className="block px-3 py-2 rounded-xl text-sm text-[#9898B0] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8">🎙️ 数字人口播</Link>
                <Link href="/jiying/studio?tab=image" className="block px-3 py-2 rounded-xl text-sm text-[#9898B0] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8">🖼️ 超级图片社</Link>
                <Link href="/jiying/portfolio" className="block px-3 py-2 rounded-xl text-sm text-[#9898B0] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8">🖼️ 作品展示</Link>
                <Link href="/jiying/competition" className="block px-3 py-2 rounded-xl text-sm text-[#9898B0] hover:text-[#FBBF24] hover:bg-[#F59E0B]/8">🏆 创作大赛</Link>
                <Link href="/" className="block px-3 py-2 rounded-xl text-sm text-[#9A9AB0] hover:text-[#FBBF24] mt-1 border-t border-black/[0.04] pt-2">思见首页</Link>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main className="relative z-10">{children}</main>
    </div>
  )
}
