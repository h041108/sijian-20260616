"use client"
import Link from "next/link"

export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/jiying" className="flex items-center gap-2 shrink-0">
              <span className="text-2xl">🎬</span>
              <span className="text-base font-extrabold text-gray-800 tracking-tight">即影</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 text-lg">
              <Link href="/jiying/agents/agent-router" className="text-gray-500 hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">🤖 Agent智能调度中心</Link>
              <Link href="/jiying/studio" className="text-gray-500 hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">📚 漫剧一键生成</Link>
              <Link href="/jiying/orchestrator" className="text-gray-500 hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">🎙️ 数字人口播</Link>
              <Link href="/jiying/studio?tab=image" className="text-gray-500 hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">🖼️ 超级图片社</Link>
              <Link href="/jiying/portfolio" className="text-gray-500 hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">🖼️ 作品展示</Link>
              <Link href="/jiying/competition" className="text-gray-500 hover:text-indigo-600 px-2 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors">🏆 创作大赛</Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-sm">🔔</button>
            <Link href="/jiying/portfolio" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 text-base transition-colors">
              <span>👤</span>
              <span className="hidden sm:inline">我的作品</span>
            </Link>
            {/* 移动端菜单按钮 */}
            <details className="md:hidden relative">
              <summary className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all text-sm cursor-pointer">☰</summary>
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl border border-gray-200 shadow-lg p-2 z-50 text-sm space-y-1">
                <Link href="/jiying/agents/agent-router" className="block px-3 py-2 rounded-lg hover:bg-indigo-50 text-gray-600">🤖 Agent智能调度中心</Link>
                <Link href="/jiying/studio" className="block px-3 py-2 rounded-lg hover:bg-indigo-50 text-gray-600">📚 漫剧一键生成</Link>
                <Link href="/jiying/orchestrator" className="block px-3 py-2 rounded-lg hover:bg-indigo-50 text-gray-600">🎙️ 数字人口播</Link>
                <Link href="/jiying/studio?tab=image" className="block px-3 py-2 rounded-lg hover:bg-indigo-50 text-gray-600">🖼️ 超级图片社</Link>
                <Link href="/jiying/portfolio" className="block px-3 py-2 rounded-lg hover:bg-indigo-50 text-gray-600">🖼️ 作品展示</Link>
                <Link href="/jiying/competition" className="block px-3 py-2 rounded-lg hover:bg-indigo-50 text-gray-600">🏆 创作大赛</Link>
                <Link href="/" className="block px-3 py-2 rounded-lg hover:bg-indigo-50 text-gray-400 mt-1 border-t border-gray-100 pt-2">思见首页</Link>
              </div>
            </details>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
