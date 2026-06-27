"use client"
export default function CompetitionPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EA580C] flex items-center justify-center text-lg">🏆</div>
        <div><h1 className="text-xl font-bold">创作大赛</h1><p className="text-sm text-[#9898B0]">用即影创作，赢取现金大奖</p></div>
      </div>
      <div className="glass-card p-8 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-lg font-bold mb-2">首届即影创作大赛</h2>
        <p className="text-sm text-[#9898B0] mb-6">总奖金池 ¥10,000+ · 即将开启</p>
        <div className="text-xs text-[#5A5A72]">敬请期待</div>
      </div>
    </div>
  )
}
