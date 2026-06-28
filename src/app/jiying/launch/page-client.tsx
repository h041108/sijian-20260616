"use client"
import { useState, useEffect } from "react"
import Link from "next/link"

const AGENTS_R = [
  { id: "a1", icon: "📝", name: "文案生成" }, { id: "a2", icon: "🎬", name: "视频剪辑" },
  { id: "a3", icon: "🖼️", name: "图片美化" }, { id: "a4", icon: "🎙️", name: "配音生成" },
  { id: "a5", icon: "📺", name: "字幕生成" },
]
const AGENTS_O = [
  { id: "a6", icon: "📊", name: "数据分析" }, { id: "a7", icon: "🔥", name: "热点追踪" },
  { id: "a8", icon: "⚖️", name: "合规审核" }, { id: "a9", icon: "🌐", name: "翻译引擎" },
  { id: "a10", icon: "📋", name: "脚本策划" }, { id: "a11", icon: "🎨", name: "封面设计" },
  { id: "a12", icon: "💬", name: "互动管理" }, { id: "a13", icon: "⏰", name: "发布时间" },
  { id: "a14", icon: "🔍", name: "竞品分析" }, { id: "a15", icon: "💰", name: "变现策略" },
]

type ScanResult = "auto" | "confirm" | "manual" | "new"
const NICHE_LIST = ["美食", "美妆", "穿搭", "数码", "教育", "生活", "健康", "母婴", "旅行", "家居", "宠物", "汽车", "游戏", "影视", "科技", "健身", "音乐", "摄影", "手工", "园艺"]

export default function LaunchPage() {
  const [phase, setPhase] = useState<"transition" | "dashboard">("transition")
  const [progress, setProgress] = useState(0)
  const [scanResult, setScanResult] = useState<ScanResult | null>(null)
  const [confirmedNiche, setConfirmedNiche] = useState("")

  // 模拟扫描
  useEffect(() => {
    const t = setInterval(() => setProgress(p => p >= 100 ? (clearInterval(t), 100) : p + 1.5), 50)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (progress >= 30 && !scanResult) {
      // 模拟扫描结果 - 高置信度
      const r: ScanResult = "auto"
      setScanResult(r)
    }
  }, [progress, scanResult])

  useEffect(() => {
    if (progress >= 100) setTimeout(() => setPhase("dashboard"), 600)
  }, [progress])

  // 场景选择（调试用）
  const [demoScenario, setDemoScenario] = useState<ScanResult>("auto")

  if (phase === "transition") {
    const scanSteps = [
      { label: "账号内容扫描", done: progress >= 20 },
      { label: "赛道识别", done: progress >= 40 },
      { label: "风格学习", done: progress >= 60 },
      { label: "竞品发现", done: progress >= 80 },
    ]

    return (
      <div className="fixed inset-0 z-50 bg-[#070b17] flex flex-col items-center justify-center">
        <div className="text-center space-y-6 max-w-sm">
          <div className="text-6xl animate-bounce">🚀</div>
          <h1 className="text-xl font-bold text-white/90">AI智能启动已自动开启</h1>
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-white/30"><span>正在分析您的账号内容...</span><span>{Math.round(progress)}%</span></div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="space-y-2 text-sm">
            {scanSteps.map((s, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${s.done ? "bg-white/[0.04] text-white/70" : "text-white/20"}`}>
                <span>{s.done ? "✅" : "⏳"}</span>
                <span>{s.label}</span>
                <span className="ml-auto text-xs">{s.done ? "已完成" : "进行中..."}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2 mt-8">
          {(["auto", "confirm", "manual", "new"] as ScanResult[]).map(s => (
            <button key={s} onClick={() => { setDemoScenario(s); setPhase("dashboard") }}
              className={`px-2 py-1 text-[9px] rounded border ${s === scanResult ? "border-teal-500/30 text-teal-400" : "border-white/[0.06] text-white/20"} hover:border-white/20`}>场景:{s}</button>
          ))}
          <button onClick={() => setPhase("dashboard")} className="px-3 py-1 text-[10px] rounded border border-white/[0.06] text-white/30 hover:text-white/50">跳过</button>
        </div>
      </div>
    )
  }

  // ─── AI智能启动仪表盘 ───
  const showScenario = demoScenario

  return (
    <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
      {/* 恭喜条 */}
      <div className="card-elevated rounded-2xl p-5">
        <div className="flex items-center gap-3 mb-2"><span className="text-3xl">🎉</span><div><h1 className="text-lg font-bold text-white/90">恭喜！所有账户已激活</h1><p className="text-xs text-white/30 mt-0.5">AI智能启动已自动开启，智能路由引擎运行中</p></div></div>
      </div>

      {/* 场景A：高置信度自动锁定 */}
      {showScenario === "auto" && (
        <div className="card-elevated rounded-2xl p-5 border-teal-500/10">
          <div className="text-sm font-semibold text-white/60 mb-4">📊 账号分析已完成</div>
          <div className="bg-teal-500/5 rounded-xl p-4 border border-teal-500/10">
            <div className="text-xs text-teal-400 font-semibold mb-2">🎯 赛道锁定结果</div>
            <div className="text-lg font-bold text-white">🍱 美食</div>
            <div className="text-xs text-white/40 mt-0.5">置信度：95%</div>
            <p className="text-[10px] text-white/30 mt-2">基于您小红书账号的47条内容，高频关键词"探店""烹饪""菜谱"等</p>
            <div className="mt-3 text-[10px] text-teal-400/60">✅ 系统已自动锁定，无需操作</div>
          </div>
        </div>
      )}

      {/* 场景B：中等置信度需确认 */}
      {showScenario === "confirm" && (
        <div className="card-elevated rounded-2xl p-5 border-amber-500/10">
          <div className="text-sm font-semibold text-white/60 mb-4">📊 账号分析已完成</div>
          <div className="bg-amber-500/5 rounded-xl p-4 border border-amber-500/10">
            <div className="text-xs text-amber-400 font-semibold mb-2">🤔 赛道识别需要您确认</div>
            <p className="text-[10px] text-white/40 mb-3">系统已扫描您的账号内容，识别到以下可能赛道：</p>
            <div className="space-y-2">
              {[
                { name: "☕ 生活Vlog", conf: "62%", desc: "日常记录、咖啡馆探店" },
                { name: "🍱 美食", conf: "45%", desc: "美食制作、餐厅探店" },
                { name: "✈️ 旅行", conf: "38%", desc: "旅行攻略、风景摄影" },
              ].map((n, i) => (
                <button key={i} onClick={() => setConfirmedNiche(n.name)}
                  className={`w-full text-left px-3 py-2 rounded-xl border text-xs transition-all ${confirmedNiche === n.name ? "bg-teal-500/10 border-teal-500/20" : "border-white/[0.04] hover:border-white/10"}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">{n.name}</span>
                    <span className="text-white/30">置信度 {n.conf}</span>
                  </div>
                  <div className="text-[9px] text-white/30 mt-0.5">{n.desc}</div>
                </button>
              ))}
            </div>
            {confirmedNiche && <div className="mt-3 text-[10px] text-teal-400">已选择：{confirmedNiche}</div>}
          </div>
        </div>
      )}

      {/* 场景C/D：低置信度/新账号 → 手动选择赛道 */}
      {(showScenario === "manual" || showScenario === "new") && (
        <div className="card-elevated rounded-2xl p-5">
          <div className="text-sm font-semibold text-white/60 mb-4">
            {showScenario === "new" ? "📝 您已成功注册新账号，请选择您要深耕的赛道方向" : "📝 系统未能自动识别您的赛道，请手动选择"}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
            {NICHE_LIST.map(n => (
              <button key={n} onClick={() => setConfirmedNiche(n)}
                className={`px-3 py-1.5 text-xs rounded-full border transition-all ${confirmedNiche === n ? "bg-teal-500/15 border-teal-500/25 text-teal-300" : "border-white/[0.06] text-white/40 hover:text-white/60 hover:border-white/20"}`}>
                {n}
              </button>
            ))}
          </div>
          {confirmedNiche && <div className="mt-3 text-[10px] text-teal-400">已选择：{confirmedNiche}</div>}
        </div>
      )}

      {/* Agent展示 */}
      <div className="card-elevated rounded-2xl p-5">
        <div className="text-xs text-white/30 mb-3">🧠 智能路由系统已为您组合最佳Agent阵容</div>
        <div className="grid grid-cols-5 gap-2 mb-4">
          {AGENTS_R.map(a => (
            <div key={a.id} className="bg-teal-500/5 border border-teal-500/10 rounded-xl p-3 text-center">
              <div className="text-xl mb-1">{a.icon}</div>
              <div className="text-[10px] text-white/60">{a.name}</div>
              <div className="text-[8px] text-emerald-400/60 mt-1">已就绪</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {AGENTS_O.slice(0, 5).map(a => (
            <button key={a.id} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3 text-center hover:border-white/10">
              <div className="text-xl mb-1 opacity-30">{a.icon}</div>
              <div className="text-[10px] text-white/30">{a.name}</div>
              <div className="text-[8px] text-white/10 mt-1">待开启</div>
            </button>
          ))}
        </div>
      </div>

      {/* 内容预览 */}
      <div className="card-elevated rounded-2xl p-5">
        <div className="text-xs text-white/30 mb-3">📝 首批内容已自动生成</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[{ t: "📄", title: "文案1", d: "3种不粘锅用法..." },{ t: "🎬", title: "视频1", d: "[播放预览]" },{ t: "🖼️", title: "封面1", d: "[缩略图预览]" }].map((c, i) => (
            <div key={i} className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-4">
              <div className="flex items-center justify-between mb-2"><span className="text-lg">{c.t}</span><span className="text-xs text-white/40">{c.title}</span></div>
              <div className="text-xs text-white/20 mb-3">{c.d}</div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-[10px] bg-white/5 border border-white/10 rounded-lg hover:bg-white/10">✏️ 编辑</button>
                <button className="px-3 py-1 text-[10px] bg-teal-500/20 text-teal-300 rounded-lg hover:bg-teal-500/30">发布</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 操作 */}
      <div className="flex gap-3 justify-center">
        <button className="btn-accent px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg">一键发布全部</button>
        <Link href="/jiying/portfolio" className="px-6 py-2.5 rounded-xl text-sm border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all">我的作品</Link>
      </div>
    </div>
  )
}
