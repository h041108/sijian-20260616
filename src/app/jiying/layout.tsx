export default function JiyingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fafafa]">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/jiying" className="flex items-center gap-2">
            <span className="text-xl">🎬</span>
            <span className="text-base font-bold text-gray-800">即影</span>
            <span className="text-[10px] text-gray-400 hidden sm:inline">15 Agent · 自媒体工厂</span>
          </a>
          <nav className="flex items-center gap-2 text-xs">
            <a href="/jiying/agents" className="text-gray-500 hover:text-indigo-600 px-2 py-1 rounded hover:bg-indigo-50">🤖 Agent中心</a>
            <a href="/" className="text-gray-400 hover:text-gray-600 px-2 py-1">思见首页</a>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
