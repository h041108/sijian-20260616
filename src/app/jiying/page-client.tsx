"use client"
import Link from "next/link"

const FAQ = [
  { q: "20元真的可以开一家自媒体公司吗？", a: "是的。20元是7天体验价。AI诊断赛道、建立人设、每日自动生成内容。你只需要有自己的账号，剩下的交给我们。" },
  { q: "我需要做什么？", a: "两步：① 3分钟偏好问卷 ② 每天30秒审核发布。选题、文案、视频、评论回复、数据分析——AI全自动。" },
  { q: "我适合做什么方向？", a: "系统自动匹配。穿搭→小红书、美食→抖音、母婴→好物推荐、游戏→B站、养生→视频号。匹配度低于85%自动调整。" },
  { q: "和代运营公司比有什么优势？", a: "代运营¥3000-15000/月，即影¥20起步。AI不休息、不请假、不涨价。内容产量10倍，成本1/100。" },
]

export default function JiyingHome() {
  return (
    <div className="pb-24">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-600/20 via-transparent to-transparent" />
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full bg-indigo-500/5 blur-[150px]" />
        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/40 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            即影 · AI自媒体工厂
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-6">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">20元开启你的</span>
            <br />
            <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-rose-500 bg-clip-text text-transparent">自媒体公司</span>
          </h1>
          <p className="text-lg text-white/40 max-w-2xl mx-auto mb-10 leading-relaxed">
            15个AI专家 · 智能路由引擎 · 每日自动生成内容<br />
            一站式AI赋能，从0到1打造个人品牌
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/jiying/agents/agent-router"
              className="group relative px-8 py-3.5 rounded-xl font-semibold text-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600" />
              <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative text-white">🚀 立即开启</span>
            </Link>
            <Link href="/jiying/agents/agent-14"
              className="px-8 py-3.5 rounded-xl text-sm font-medium border border-white/10 text-white/60 hover:text-white hover:border-white/20 hover:bg-white/5 transition-all">
              免费体验标签SEO
            </Link>
          </div>
          <p className="text-xs text-white/20 mt-6">无需注册公司 · 无需雇佣团队 · 全自动运营 · 随时可停</p>
        </div>
      </section>

      {/* ─── 5大核心模块 ─── */}
      <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { title: "赛道选择", desc: "50+赛道覆盖", icon: "🎯", href: "/jiying/agents/agent-router", action: "选择赛道" },
            { title: "账户设立", desc: "15+平台开户", icon: "📱", href: "/jiying/onboarding", action: "设立账户" },
            { title: "AI智能启动", desc: "智能路由引擎", icon: "⚡", href: "/jiying/launch", action: "启动" },
            { title: "创作工厂", desc: "AI剧本/图片/成片", icon: "🏭", href: "/jiying/studio", action: "创作" },
            { title: "内容审核", desc: "人工审核发布", icon: "✅", href: "/jiying/review", action: "审核" },
          ].map(s => (
            <Link key={s.title} href={s.href}
              className="group relative rounded-2xl p-5 border border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/10 transition-all text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <div className="text-2xl mb-2">{s.icon}</div>
                <div className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors">{s.title}</div>
                <div className="text-[10px] text-white/30 mt-1">{s.desc}</div>
                <div className="mt-3 text-[10px] text-amber-400/60 group-hover:text-amber-400 transition-colors">{s.action} →</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 付出 vs 得到 ─── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
            <h3 className="text-sm font-semibold text-white/30 mb-6 tracking-widest uppercase">你只需要付出</h3>
            <ul className="space-y-4">
              {["20元（7天体验）","每天30秒审核","3分钟填问卷","下载→粘贴→发布"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/50">
                  <span className="w-5 h-5 rounded-full border border-white/10 flex items-center justify-center text-[10px] text-white/20 shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8">
            <h3 className="text-sm font-semibold text-white/30 mb-6 tracking-widest uppercase">你将得到</h3>
            <ul className="space-y-4">
              {["15个AI专家24小时工作","每日3条原创文案+1条视频","AI智能客服回复评论","数据复盘+策略优化","变现路径自动匹配"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/50">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-[10px] text-white shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 定价 ─── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-center text-white mb-12">定价</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "体验卡", price: "¥20", unit: "一次性", desc: "7天全功能体验", badge: "引流价" },
            { name: "月卡", price: "¥99", unit: "/月", desc: "每日3文+1漫剧", badge: "主力" },
            { name: "年卡", price: "¥799", unit: "/年", desc: "≈¥66/月", badge: "最划算" },
            { name: "Pro", price: "¥299", unit: "/月", desc: "多账号≤5个", badge: "工作室" },
          ].map(p => (
            <div key={p.name} className="group relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 text-center hover:border-white/10 transition-all">
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] font-medium text-white">{p.badge}</span>
              <div className="text-sm font-medium text-white/40">{p.name}</div>
              <div className="mt-3">
                <span className="text-3xl font-extrabold text-white">{p.price}</span>
                <span className="text-xs text-white/30 ml-0.5">{p.unit}</span>
              </div>
              <div className="text-xs text-white/30 mt-2">{p.desc}</div>
              <div className="mt-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-center text-white mb-10">常见问题</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <details key={i} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <summary className="px-5 py-4 text-sm text-white/70 cursor-pointer hover:text-white transition-colors flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-white/20 group-open:rotate-180 transition-transform text-xs">▼</span>
              </summary>
              <div className="px-5 pb-4 text-xs text-white/40 leading-relaxed border-t border-white/[0.04] pt-3">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="max-w-3xl mx-auto px-6 text-center">
        <div className="relative rounded-3xl p-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-indigo-500/10 blur-[80px]" />
          <div className="relative">
            <div className="text-4xl mb-4">🎬</div>
            <h2 className="text-2xl font-bold text-white mb-3">现在就开启你的自媒体公司</h2>
            <p className="text-sm text-white/40 mb-6">20元体验7天 · 不满意随时停 · 无需任何承诺</p>
            <Link href="/jiying/agents/agent-router"
              className="inline-block px-8 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 transition-all shadow-lg shadow-amber-500/20">
              🚀 花20元开公司
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
