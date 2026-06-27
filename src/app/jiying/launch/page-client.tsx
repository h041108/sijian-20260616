"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

const AGENTS = [
  { id: "a1", name: "文案生成", icon: "📝", group: "recommended" },
  { id: "a2", name: "视频剪辑", icon: "🎬", group: "recommended" },
  { id: "a3", name: "图片美化", icon: "🖼️", group: "recommended" },
  { id: "a4", name: "配音生成", icon: "🎙️", group: "recommended" },
  { id: "a5", name: "字幕生成", icon: "📺", group: "recommended" },
  { id: "a6", name: "数据分析", icon: "📊", group: "optional" },
  { id: "a7", name: "热点追踪", icon: "🔥", group: "optional" },
  { id: "a8", name: "合规审核", icon: "⚖️", group: "optional" },
  { id: "a9", name: "翻译引擎", icon: "🌐", group: "optional" },
  { id: "a10", name: "脚本策划", icon: "📋", group: "optional" },
  { id: "a11", name: "封面设计", icon: "🎨", group: "optional" },
  { id: "a12", name: "互动管理", icon: "💬", group: "optional" },
  { id: "a13", name: "发布时间", icon: "⏰", group: "optional" },
  { id: "a14", name: "竞品分析", icon: "🔍", group: "optional" },
  { id: "a15", name: "变现策略", icon: "💰", group: "optional" },
]

export default function LaunchPage() {
  const [phase, setPhase] = useState<"transition" | "dashboard">("transition")
  const [progress, setProgress] = useState(0)
  const [agentStatus, setAgentStatus] = useState(AGENTS.map(a => ({ ...a, status: "pending" })))

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => p >= 100 ? (clearInterval(timer), 100) : p + 2)
    }, 40)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (progress < 40) return
    const rec = AGENTS.filter(a => a.group === "recommended")
    const idx = Math.floor((progress - 40) / 12)
    if (idx < rec.length) {
      setAgentStatus(prev => prev.map((a, i) => {
        const rIdx = AGENTS.findIndex(x => x.id === a.id)
        return rIdx <= idx && a.group === "recommended" ? { ...a, status: "ready" } : a
      }))
    }
    if (progress >= 100) setTimeout(() => setPhase("dashboard"), 400)
  }, [progress])

  if (phase === "transition") {
    return (
      <div className="fixed inset-0 z-50 bg-[#05050A] flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/10 via-transparent to-transparent" />
        <div className="text-center space-y-8 max-w-sm relative">
          <div className="text-7xl animate-bounce">🚀</div>
          <h1 className="text-2xl font-bold tracking-tight">AI智能启动已自动开启</h1>
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-white/30"><span>配置Agent组合...</span><span>{progress}%</span></div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {agentStatus.filter(a => a.group === "recommended").map(a => (
              <div key={a.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${a.status === "ready" ? "bg-white/5 text-white" : "text-white/20"}`}>
                <span>{a.status === "ready" ? "✅" : "⏳"}</span><span>{a.icon} {a.name}</span>
                <span className="ml-auto text-xs">{a.status === "ready" ? "已就绪" : "配置中..."}</span>
              </div>
            ))}
          </div>
        </div>
        {progress > 50 && (
          <button onClick={() => setPhase("dashboard")} className="fixed bottom-8 right-8 px-4 py-2 rounded-xl border border-white/10 text-sm text-white/40 hover:text-white/60 transition-all">跳过 →</button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
      {/* Congrats */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🎉</span>
          <div><h1 className="text-lg font-bold">恭喜！所有账户已激活</h1><p className="text-xs text-white/40 mt-0.5">AI智能启动已自动开启</p></div>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/30 bg-white/[0.02] rounded-xl px-3 py-2">
          <span>🎯 当前赛道：<b className="text-amber-300">美食</b></span>
          <span className="text-white/10">|</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 智能路由运行中</span>
        </div>
      </div>

      {/* Report */}
      <div className="glass rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-white/60">📊 账号分析已完成</span>
          <button className="text-xs text-amber-400/60 hover:text-amber-400">查看完整报告 →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[{ l: "🎯 赛道", v: "美食", s: "置信度95%" },{ l: "🎨 风格", v: "轻松活泼", s: "已学习" },{ l: "📊 阶段", v: "成长期", s: "互动率正常" },{ l: "🔥 竞品", v: "12个", s: "已发现" },{ l: "💡 策略", v: "保持日更", s: "增加烹饪内容" }].map(item => (
            <div key={item.l} className="bg-white/[0.03] rounded-xl p-3 text-center">
              <div className="text-xs text-white/20">{item.l}</div>
              <div className="text-sm font-bold text-white mt-0.5">{item.v}</div>
              <div className="text-[9px] text-white/20 mt-0.5">{item.s}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agents */}
      <div className="glass rounded-2xl p-6">
        <div className="text-xs text-white/30 mb-4">🧠 已为你组合最佳Agent阵容</div>
        <div className="mb-5">
          <div className="text-[10px] text-amber-400/60 font-semibold mb-2">⭐ 推荐组合</div>
          <div className="grid grid-cols-5 gap-2">
            {agentStatus.filter(a => a.group === "recommended").map(a => (
              <div key={a.id} className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{a.icon}</div>
                <div className="text-[10px] text-white/60">{a.name}</div>
                <div className="text-[8px] text-emerald-400/60 mt-1">已就绪</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-white/20 mb-2">其他Agent（可手动开启）</div>
          <div className="grid grid-cols-5 gap-2">
            {agentStatus.filter(a => a.group === "optional").map(a => (
              <button key={a.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-center hover:border-white/10 transition-colors">
                <div className="text-xl mb-1 opacity-30">{a.icon}</div>
                <div className="text-[10px] text-white/30">{a.name}</div>
                <div className="text-[8px] text-white/10 mt-1">待开启</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content preview */}
      <div className="glass rounded-2xl p-6">
        <div className="text-xs text-white/30 mb-3">📝 首批内容已自动生成</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[{ t: "📄", title: "文案1", d: "3种不粘锅用法..." },{ t: "🎬", title: "视频1", d: "[播放预览]" },{ t: "🖼️", title: "封面1", d: "[缩略图预览]" }].map((c, i) => (
            <div key={i} className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-lg">{c.t}</span><span className="text-xs text-white/40">{c.title}</span></div>
              <div className="text-xs text-white/20 mb-3">{c.d}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-[10px] bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">✏️ 编辑</button>
                <button className="px-3 py-1 text-[10px] bg-amber-500/20 text-amber-300 rounded-lg hover:bg-amber-500/30">发布</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-center pt-2">
        <button className="px-6 py-2.5 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/20">一键发布全部</button>
        <Link href="/jiying/portfolio" className="px-6 py-2.5 rounded-xl text-sm text-white/50 border border-white/10 hover:border-white/20 transition-all">我的作品</Link>
        <button className="px-6 py-2.5 rounded-xl text-sm text-white/30 border border-white/[0.06] hover:border-white/10 transition-all">调整Agent</button>
      </div>
    </div>
  )
}
