"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

const AGENTS_R = [
  { id: "a1", name: "文案生成", icon: "📝" }, { id: "a2", name: "视频剪辑", icon: "🎬" },
  { id: "a3", name: "图片美化", icon: "🖼️" }, { id: "a4", name: "配音生成", icon: "🎙️" },
  { id: "a5", name: "字幕生成", icon: "📺" }, { id: "a6", name: "数据分析", icon: "📊", o: true },
  { id: "a7", name: "热点追踪", icon: "🔥", o: true }, { id: "a8", name: "合规审核", icon: "⚖️", o: true },
  { id: "a9", name: "翻译引擎", icon: "🌐", o: true }, { id: "a10", name: "脚本策划", icon: "📋", o: true },
  { id: "a11", name: "封面设计", icon: "🎨", o: true }, { id: "a12", name: "互动管理", icon: "💬", o: true },
  { id: "a13", name: "发布时间", icon: "⏰", o: true }, { id: "a14", name: "竞品分析", icon: "🔍", o: true },
  { id: "a15", name: "变现策略", icon: "💰", o: true },
]
const REC = AGENTS_R.filter(a => !a.o)
const OPT = AGENTS_R.filter(a => a.o)

export default function LaunchPage() {
  const [phase, setPhase] = useState<"transition" | "dashboard">("transition")
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setProgress(p => p >= 100 ? (clearInterval(t), 100) : p + 2), 40)
    return () => clearInterval(t)
  }, [])

  useEffect(() => { if (progress >= 100) setTimeout(() => setPhase("dashboard"), 500) }, [progress])

  if (phase === "transition") {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-6xl animate-bounce">🚀</div>
          <h1 className="text-xl font-bold text-gray-800">AI智能启动已自动开启</h1>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400"><span>配置Agent组合...</span><span>{progress}%</span></div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {REC.slice(0, 5).map((a, i) => (
              <div key={a.id} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${progress > 40 + i * 12 ? "bg-indigo-50 text-indigo-700" : "text-gray-300"}`}>
                <span>{progress > 40 + i * 12 ? "✅" : "⏳"}</span><span>{a.icon} {a.name}</span>
                <span className="ml-auto text-xs">{progress > 40 + i * 12 ? "已就绪" : "配置中..."}</span>
              </div>
            ))}
          </div>
        </div>
        {progress > 50 && (
          <button onClick={() => setPhase("dashboard")} className="fixed bottom-8 right-8 px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-400 hover:text-gray-600">跳过 →</button>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🎉</span><div><h1 className="text-lg font-bold text-gray-800">恭喜！所有账户已激活</h1><p className="text-xs text-gray-400 mt-0.5">AI智能启动已自动开启</p></div></div>
        <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/60 rounded-xl px-3 py-2"><span>🎯 当前赛道：<span className="text-indigo-600 font-medium">美食</span></span><span className="text-gray-200">|</span><span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />智能路由运行中</span></div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold text-gray-600">📊 账号分析已完成</span><button className="text-xs text-indigo-500 hover:text-indigo-600">查看完整报告 →</button></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {[{ l: "🎯 赛道", v: "美食", s: "置信度95%" },{ l: "🎨 风格", v: "轻松活泼", s: "已学习" },{ l: "📊 阶段", v: "成长期", s: "互动率正常" },{ l: "🔥 竞品", v: "12个", s: "已发现" },{ l: "💡 策略", v: "保持日更", s: "增加烹饪内容" }].map(item => (
            <div key={item.l} className="bg-gray-50 rounded-xl p-3 text-center"><div className="text-xs text-gray-400">{item.l}</div><div className="text-sm font-bold text-gray-800 mt-0.5">{item.v}</div><div className="text-[9px] text-gray-400 mt-0.5">{item.s}</div></div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="text-xs text-gray-400 mb-3">🧠 已为你组合最佳Agent阵容</div>
        <div className="mb-4"><div className="text-[10px] text-indigo-500 font-semibold mb-2">⭐ 推荐组合</div><div className="grid grid-cols-5 gap-2">{REC.slice(0, 5).map(a => (
          <div key={a.id} className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-3 text-center"><div className="text-xl mb-1">{a.icon}</div><div className="text-[10px] text-gray-600">{a.name}</div><div className="text-[8px] text-emerald-500 mt-1">已就绪</div></div>
        ))}</div></div>
        <div><div className="text-[10px] text-gray-400 mb-2">其他Agent</div><div className="grid grid-cols-5 gap-2">{OPT.map(a => (
          <button key={a.id} className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center hover:border-indigo-200"><div className="text-xl mb-1 opacity-30">{a.icon}</div><div className="text-[10px] text-gray-400">{a.name}</div><div className="text-[8px] text-gray-300 mt-1">待开启</div></button>
        ))}</div></div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5">
        <div className="text-xs text-gray-400 mb-3">📝 首批内容已自动生成</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[{ t: "📄", title: "文案1", d: "3种不粘锅用法..." },{ t: "🎬", title: "视频1", d: "[播放预览]" },{ t: "🖼️", title: "封面1", d: "[缩略图预览]" }].map((c, i) => (
            <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4"><div className="flex items-center justify-between mb-2"><span className="text-lg">{c.t}</span><span className="text-xs text-gray-500">{c.title}</span></div><div className="text-xs text-gray-400 mb-3">{c.d}</div><div className="flex gap-2"><button className="px-3 py-1 text-[10px] bg-white border border-gray-200 rounded-lg hover:border-indigo-200">✏️ 编辑</button><button className="px-3 py-1 text-[10px] btn-primary rounded-lg">发布</button></div></div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 justify-center">
        <button className="px-6 py-2.5 btn-primary rounded-xl text-sm font-semibold">一键发布全部</button>
        <Link href="/jiying/portfolio" className="px-6 py-2.5 rounded-xl text-sm border border-gray-200 text-gray-500 hover:border-indigo-200 hover:text-indigo-600">我的作品</Link>
        <button className="px-6 py-2.5 rounded-xl text-sm border border-gray-100 text-gray-400 hover:border-gray-200">调整Agent</button>
      </div>
    </div>
  )
}
