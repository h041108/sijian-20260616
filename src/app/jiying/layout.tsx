"use client"
import Link from "next/link"

export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/jiying" className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <span className="text-base font-bold text-gray-800">即影</span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">自媒体工厂</span>
          </Link>
          <div className="flex items-center gap-1 text-xs">
            <Link href="/jiying/orchestrator" className="text-gray-500 hover:text-indigo-600 px-1.5 py-1 rounded hover:bg-indigo-50">🧠 调度</Link>
            <Link href="/jiying/studio" className="text-gray-500 hover:text-indigo-600 px-1.5 py-1 rounded hover:bg-indigo-50">🖼️ 图片</Link>
            <Link href="/jiying/manga" className="text-gray-500 hover:text-indigo-600 px-1.5 py-1 rounded hover:bg-indigo-50">📚 漫剧</Link>
            <Link href="/jiying/script-review" className="text-gray-500 hover:text-indigo-600 px-1.5 py-1 rounded hover:bg-indigo-50">📝 质检</Link>
            <Link href="/jiying/review" className="text-gray-500 hover:text-indigo-600 px-1.5 py-1 rounded hover:bg-indigo-50">✅ 审核</Link>
            <Link href="/jiying/compass" className="text-gray-500 hover:text-indigo-600 px-1.5 py-1 rounded hover:bg-indigo-50">🧭 赚钱</Link>
            <Link href="/jiying/portfolio" className="text-gray-500 hover:text-indigo-600 px-1.5 py-1 rounded hover:bg-indigo-50">🖼️ 作品</Link>
            <Link href="/jiying/competition" className="text-gray-500 hover:text-indigo-600 px-1.5 py-1 rounded hover:bg-indigo-50">🏆 大赛</Link>
            <Link href="/jiying/agents" className="text-gray-500 hover:text-indigo-600 px-1.5 py-1 rounded hover:bg-indigo-50">🤖 Agent</Link>
            <Link href="/" className="text-gray-400 hover:text-gray-600 px-1.5 py-1">首页</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
