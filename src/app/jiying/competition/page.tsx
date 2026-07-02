"use client"
import Link from "next/link"

export default function CompetitionPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#F59E0B] to-[#EA580C] flex items-center justify-center text-lg">🏆</div>
        <div><h1 className="text-xl font-bold">创作大赛</h1><p className="text-sm text-[#9898B0]">用即影创作，赢取现金大奖</p></div>
      </div>
      <div className="glass-card p-10 text-center space-y-6">
        <div className="text-6xl mb-2">🏆</div>
        <h2 className="text-lg font-bold bg-gradient-to-r from-[#F59E0B] to-[#F97316] bg-clip-text text-transparent">首届即影创作大赛</h2>
        <p className="text-sm text-[#9898B0]">总奖金池 ¥10,000+ · 即将开启</p>
        <div className="bg-[#18182A] rounded-xl p-6 text-left space-y-3 max-w-md mx-auto">
          <div className="flex items-center gap-2 text-xs text-[#9898B0]"><span className="text-[#F59E0B]">🥇</span> 一等奖 1名：¥3,000 + 年卡会员</div>
          <div className="flex items-center gap-2 text-xs text-[#9898B0]"><span className="text-[#E8E8F0]">🥈</span> 二等奖 3名：¥1,000 + 季卡会员</div>
          <div className="flex items-center gap-2 text-xs text-[#9898B0]"><span className="text-[#EA580C]">🥉</span> 三等奖 10名：¥300 + 月卡会员</div>
          <div className="flex items-center gap-2 text-xs text-[#5A5A72]">🎖️ 参与奖：所有参赛者获赠7天Pro体验</div>
        </div>
        <Link href="/jiying/manga" className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#F59E0B] to-[#F97316] text-[#0C0C14] text-sm font-bold hover:opacity-90 transition-opacity">
          🎬 立即创作参赛
        </Link>
        <p className="text-[10px] text-[#5A5A72]">关注公众号获取大赛最新动态</p>
      </div>
    </div>
  )
}
