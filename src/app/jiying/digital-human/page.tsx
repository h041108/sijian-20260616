"use client"
import DigitalHumanPanel from "@/components/DigitalHumanPanel"

export default function DigitalHumanPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="flex items-center gap-4 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-400 to-indigo-400 flex items-center justify-center text-lg shadow-lg shadow-purple-500/15">🎭</div>
        <div>
          <h1 className="text-xl font-bold text-white/90">数字人口播</h1>
          <p className="text-sm text-white/30 mt-0.5">一张照片 + 一段音频 → 会说话的数字人</p>
        </div>
      </div>
      <DigitalHumanPanel />
    </div>
  )
}
