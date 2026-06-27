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
      <section className="relative overflow-hidden pt-20 pb-16">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-teal-500/8 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-emerald-500/6 blur-[150px]" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs text-white/40 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            即影 · AI自媒体工厂
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            <span className="text-white/90">20元开启你的</span>
            <br />
            <span className="bg-gradient-to-r from-teal-300 via-emerald-300 to-amber-300 bg-clip-text text-transparent">自媒体公司</span>
          </h1>
          <p className="text-base md:text-lg text-white/30 max-w-2xl mx-auto mb-10 leading-relaxed">
            15个AI专家 · 智能路由引擎 · 每日自动生成内容<br className="hidden sm:block" />
            一站式AI赋能，从0到1打造个人品牌
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/jiying/agents/agent-router" className="btn-accent px-8 py-3.5 rounded-xl text-sm font-semibold shadow-lg">🚀 立即开启</Link>
            <Link href="/jiying/agents/agent-14"
              className="px-8 py-3.5 rounded-xl text-sm font-medium border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 hover:bg-white/[0.04] transition-all">免费体验标签SEO</Link>
          </div>
          <p className="text-xs text-white/15 mt-6">无需注册公司 · 无需雇佣团队 · 全自动运营 · 随时可停</p>
        </div>
      </section>

      {/* ─── 5大核心 ─── */}
      <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { t: "🎯", title: "赛道选择", desc: "50+赛道", h: "/jiying/agents/agent-router" },
            { t: "📱", title: "账户设立", desc: "15+平台", h: "/jiying/onboarding" },
            { t: "⚡", title: "AI智能启动", desc: "路由引擎", h: "/jiying/launch" },
            { t: "🏭", title: "创作工厂", desc: "AI剧本/图片", h: "/jiying/studio" },
            { t: "✅", title: "内容审核", desc: "人工发布", h: "/jiying/review" },
          ].map(s => (
            <Link key={s.title} href={s.h}
              className="glass rounded-2xl p-5 text-center hover:shadow-lg hover:shadow-teal-500/5 transition-all group">
              <div className="text-2xl mb-2">{s.t}</div>
              <div className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors">{s.title}</div>
              <div className="text-[10px] text-white/30 mt-0.5">{s.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 付出vs得到 ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass rounded-2xl p-8">
            <h3 className="text-sm font-semibold text-white/30 mb-5 tracking-wider">你只需要付出</h3>
            <ul className="space-y-4">
              {["20元（7天体验）","每天30秒审核","3分钟填问卷","下载→粘贴→发布"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/50">
                  <span className="w-5 h-5 rounded-full border border-white/[0.06] flex items-center justify-center text-[10px] text-white/20 shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="card-elevated rounded-2xl p-8 border-teal-500/10">
            <h3 className="text-sm font-semibold text-teal-400/60 mb-5 tracking-wider">你将得到</h3>
            <ul className="space-y-4">
              {["15个AI专家24小时工作","每日3条文案+1条视频","AI智能客服回复评论","数据复盘+策略优化","变现路径自动匹配"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center text-[10px] text-white shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 定价 ─── */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-center text-white/80 mb-10">定价</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { n: "体验卡", p: "¥20", u: "一次性", d: "7天全功能", b: "引流价" },
            { n: "月卡", p: "¥99", u: "/月", d: "每日3文+1漫剧", b: "主力" },
            { n: "年卡", p: "¥799", u: "/年", d: "≈¥66/月", b: "最划算" },
            { n: "Pro", p: "¥299", u: "/月", d: "多账号≤5个", b: "工作室" },
          ].map(c => (
            <div key={c.n} className="glass rounded-2xl p-6 text-center hover:shadow-lg hover:shadow-teal-500/5 transition-all relative">
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 text-[9px] font-medium text-white">{c.b}</span>
              <div className="text-sm font-medium text-white/40">{c.n}</div>
              <div className="mt-2"><span className="text-2xl font-extrabold text-white">{c.p}</span><span className="text-xs text-white/30 ml-0.5">{c.u}</span></div>
              <div className="text-xs text-white/30 mt-1.5">{c.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-center text-white/80 mb-8">常见问题</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <details key={i} className="glass rounded-2xl overflow-hidden group">
              <summary className="px-5 py-3.5 text-sm text-white/60 cursor-pointer hover:text-white transition-colors flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-white/20 group-open:rotate-180 transition-transform text-xs">▼</span>
              </summary>
              <div className="px-5 pb-4 text-xs text-white/30 leading-relaxed border-t border-white/[0.04] pt-3">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="max-w-3xl mx-auto px-6 text-center">
        <div className="relative rounded-3xl p-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-60 h-60 rounded-full bg-teal-400/8 blur-[80px]" />
          <div className="relative">
            <div className="text-4xl mb-4">🎬</div>
            <h2 className="text-xl font-bold text-white/90 mb-2">现在就开启你的自媒体公司</h2>
            <p className="text-sm text-white/30 mb-6">20元体验7天 · 不满意随时停 · 无需任何承诺</p>
            <Link href="/jiying/agents/agent-router"
              className="btn-accent inline-block px-8 py-3 rounded-xl text-sm font-semibold shadow-lg">🚀 花20元开公司</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
