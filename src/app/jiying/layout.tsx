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
          <nav className="flex items-center gap-0.5 text-xs">
            <Link href="/jiying/onboarding" className="text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">👤 自媒体账号设立</Link>
            <Link href="/jiying/orchestrator" className="text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">🩺 赛道医生</Link>
            <Link href="/jiying/studio" className="text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">🏭 自媒体工厂</Link>
            <Link href="/jiying/review" className="text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">✅ 人工审核</Link>
            <Link href="/jiying/portfolio" className="text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">🖼️ 作品展示</Link>
            <Link href="/jiying/compass" className="text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">💰 收益罗盘</Link>
            <Link href="/" className="text-gray-400 hover:text-gray-600 px-2 py-1 ml-1">首页</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
