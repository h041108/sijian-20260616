"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

const AGENTS = [
  { id: "a1", name: "文案生成", icon: "📝", group: "recommended", status: "ready" },
  { id: "a2", name: "视频剪辑", icon: "🎬", group: "recommended", status: "ready" },
  { id: "a3", name: "图片美化", icon: "🖼️", group: "recommended", status: "ready" },
  { id: "a4", name: "配音生成", icon: "🎙️", group: "recommended", status: "ready" },
  { id: "a5", name: "字幕生成", icon: "📺", group: "recommended", status: "ready" },
  { id: "a6", name: "数据分析", icon: "📊", group: "optional", status: "inactive" },
  { id: "a7", name: "热点追踪", icon: "🔥", group: "optional", status: "inactive" },
  { id: "a8", name: "合规审核", icon: "⚖️", group: "optional", status: "inactive" },
  { id: "a9", name: "翻译引擎", icon: "🌐", group: "optional", status: "inactive" },
  { id: "a10", name: "脚本策划", icon: "📋", group: "optional", status: "inactive" },
  { id: "a11", name: "封面设计", icon: "🎨", group: "optional", status: "inactive" },
  { id: "a12", name: "互动管理", icon: "💬", group: "optional", status: "inactive" },
  { id: "a13", name: "发布时间", icon: "⏰", group: "optional", status: "inactive" },
  { id: "a14", name: "竞品分析", icon: "🔍", group: "optional", status: "inactive" },
  { id: "a15", name: "变现策略", icon: "💰", group: "optional", status: "inactive" },
]

export default function LaunchPage() {
  const [phase, setPhase] = useState<"transition" | "dashboard">("transition")
  const [progress, setProgress] = useState(0)
  const [agentStatus, setAgentStatus] = useState(AGENTS.map(a => ({ ...a, status: "pending" as string })))

  // 过渡动画
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          return 100
        }
        return prev + 3
      })
    }, 60)
    return () => clearInterval(timer)
  }, [])

  // Agent逐个点亮
  useEffect(() => {
    if (progress < 40) return
    const recommended = AGENTS.filter(a => a.group === "recommended")
    const idx = Math.floor((progress - 40) / 12)
    if (idx < recommended.length) {
      setAgentStatus(prev => prev.map((a, i) => {
        const rIdx = AGENTS.findIndex(x => x.id === a.id)
        if (rIdx <= idx && a.group === "recommended") return { ...a, status: "ready" }
        return a
      }))
    }
    if (progress >= 100) {
      setTimeout(() => setPhase("dashboard"), 500)
    }
  }, [progress])

  if (phase === "transition") {
    return (
      <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 flex flex-col items-center justify-center text-white">
        <div className="text-center space-y-6 max-w-md">
          <div className="text-6xl animate-bounce">🚀</div>
          <h1 className="text-2xl font-extrabold">AI智能启动已自动开启</h1>

          {/* 进度条 */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-indigo-200">
              <span>{progress < 40 ? "正在为您配置专属Agent组合..." : "Agent配置中..."}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Agent状态 */}
          <div className="space-y-2 text-sm">
            {agentStatus.filter(a => a.group === "recommended").map((a, i) => (
              <div key={a.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${a.status === "ready" ? "bg-white/10 text-white" : "text-white/30"}`}>
                <span>{a.status === "ready" ? "✅" : "⏳"}</span>
                <span>{a.icon}</span>
                <span>{a.name}</span>
                <span className="ml-auto text-xs">{a.status === "ready" ? "已就绪" : "配置中..."}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 跳过按钮 */}
        {progress > 50 && (
          <button onClick={() => setPhase("dashboard")}
            className="fixed bottom-8 right-8 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl text-sm text-white/70 hover:bg-white/20 transition-all">
            跳过，直接进入 →
          </button>
        )}
      </div>
    )
  }

  // ─── AI智能启动仪表盘 ───
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

      {/* 顶部恭喜区 */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🎉</span>
          <div>
            <h1 className="text-lg font-bold text-gray-800">恭喜！3个账户已全部激活，AI智能启动已自动开启！</h1>
            <p className="text-xs text-green-700 mt-1">已激活账户：小红书-美食主号 · 抖音-美食号 · B站-美食日常</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-white/60 rounded-xl px-3 py-2">
          <span>🎯 当前赛道：</span>
          <span className="font-semibold text-indigo-600">美食（系统自动识别，置信度95%）</span>
          <span className="text-gray-300">|</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> 智能路由引擎运行中</span>
        </div>
      </div>

      {/* 账号分析报告 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-bold text-gray-700">📊 账号分析已完成</span>
          <button className="text-xs text-indigo-600 hover:text-indigo-800">查看完整分析报告 →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: "🎯 赛道", value: "美食", sub: "置信度95%" },
            { label: "🎨 风格", value: "轻松活泼", sub: "已学习" },
            { label: "📊 阶段", value: "成长期", sub: "互动率正常" },
            { label: "🔥 竞品", value: "12个", sub: "已发现" },
            { label: "💡 策略", value: "保持日更", sub: "增加烹饪教学内容" },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-xl p-3 text-center">
              <div className="text-xs text-gray-400">{item.label}</div>
              <div className="text-sm font-bold text-gray-800 mt-0.5">{item.value}</div>
              <div className="text-[9px] text-gray-400 mt-0.5">{item.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Agent展示 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="text-xs text-gray-500 mb-3">
          🧠 智能路由系统已为您组合最佳Agent阵容（基于<b className="text-gray-700">美食</b>赛道）：
        </div>

        {/* 推荐组合 */}
        <div className="mb-4">
          <div className="text-[10px] text-indigo-500 font-semibold mb-2">⭐ 推荐组合</div>
          <div className="grid grid-cols-5 gap-2">
            {agentStatus.filter(a => a.group === "recommended").map(a => (
              <div key={a.id} className="bg-indigo-50 border border-indigo-200 rounded-xl p-3 text-center">
                <div className="text-xl mb-1">{a.icon}</div>
                <div className="text-[10px] font-medium text-gray-700">{a.name}</div>
                <div className="text-[8px] text-green-600 bg-green-100 rounded-full px-1.5 py-0.5 inline-block mt-1">已就绪</div>
              </div>
            ))}
          </div>
        </div>

        {/* 可选Agent */}
        <div>
          <div className="text-[10px] text-gray-400 font-semibold mb-2">其他Agent（点击开启）</div>
          <div className="grid grid-cols-5 gap-2">
            {agentStatus.filter(a => a.group === "optional").map(a => (
              <button key={a.id}
                className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-center hover:border-indigo-200 transition-colors">
                <div className="text-xl mb-1 opacity-40">{a.icon}</div>
                <div className="text-[10px] text-gray-400">{a.name}</div>
                <div className="text-[8px] text-gray-300 mt-1">待开启</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 内容预览 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="text-xs text-gray-500 mb-3">📝 首批内容已自动生成（基于您的账号风格学习）</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { type: "📄", title: "文案1", desc: "3种不粘锅用法..." },
            { type: "🎬", title: "视频1", desc: "[播放预览]" },
            { type: "🖼️", title: "封面1", desc: "[缩略图预览]" },
          ].map((c, i) => (
            <div key={i} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg">{c.type}</span>
                <span className="text-xs font-medium text-gray-700">{c.title}</span>
              </div>
              <div className="text-xs text-gray-400 mb-3">{c.desc}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-[10px] bg-white border border-gray-200 rounded-lg hover:border-indigo-300">✏️ 编辑</button>
                <button className="px-3 py-1 text-[10px] bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">发布</button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-[10px] text-gray-400 mt-3">💡 所有内容已自动保存至「我的作品」，您可以随时编辑后一键发布</div>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 justify-center">
        <button className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">一键发布全部</button>
        <Link href="/jiying/portfolio" className="px-6 py-2.5 bg-white text-gray-700 rounded-xl text-sm border border-gray-200 hover:border-indigo-300">进入我的作品查看</Link>
        <button className="px-6 py-2.5 bg-white text-gray-700 rounded-xl text-sm border border-gray-200 hover:border-indigo-300">手动调整Agent配置</button>
      </div>
    </div>
  )
}
