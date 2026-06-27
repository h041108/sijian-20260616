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
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/60">
        <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[60%] rounded-full bg-indigo-200/20 blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[35%] h-[50%] rounded-full bg-purple-200/20 blur-[100px]" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 border border-indigo-100 text-xs text-indigo-400 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />即影 · AI自媒体工厂
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-[1.1] tracking-tight mb-5">
            <span className="text-gray-900">20元开启你的</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent">自媒体公司</span>
          </h1>
          <p className="text-base text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
            15个AI专家 · 智能路由引擎 · 每日自动生成内容<br />一站式AI赋能，从0到1打造个人品牌
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/jiying/agents/agent-router"
              className="btn-primary px-7 py-3 rounded-xl text-sm font-semibold">🚀 立即开启</Link>
            <Link href="/jiying/agents/agent-14"
              className="px-7 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-500 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
              免费体验标签SEO
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 5大核心模块 ─── */}
      <section className="max-w-6xl mx-auto px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { title: "赛道选择", desc: "50+赛道覆盖", icon: "🎯", href: "/jiying/agents/agent-router" },
            { title: "账户设立", desc: "15+平台开户", icon: "📱", href: "/jiying/onboarding" },
            { title: "AI智能启动", desc: "智能路由引擎", icon: "⚡", href: "/jiying/launch" },
            { title: "创作工厂", desc: "AI剧本/图片/成片", icon: "🏭", href: "/jiying/studio" },
            { title: "内容审核", desc: "人工审核发布", icon: "✅", href: "/jiying/review" },
          ].map(s => (
            <Link key={s.title} href={s.href}
              className="glass rounded-2xl p-5 text-center hover:shadow-md transition-all group">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-sm font-semibold text-gray-800 group-hover:text-indigo-600 transition-colors">{s.title}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{s.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 付出 vs 得到 ─── */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/70 border border-gray-100 rounded-2xl p-7">
            <h3 className="text-sm font-semibold text-gray-400 mb-5 tracking-wide">你只需要付出</h3>
            <ul className="space-y-3.5">
              {["20元（7天体验）","每天30秒审核","3分钟填问卷","下载→粘贴→发布"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-500">
                  <span className="w-5 h-5 rounded-full border border-gray-200 flex items-center justify-center text-[10px] text-gray-300 shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 border border-indigo-100/50 rounded-2xl p-7">
            <h3 className="text-sm font-semibold text-indigo-400 mb-5 tracking-wide">你将得到</h3>
            <ul className="space-y-3.5">
              {["15个AI专家24小时工作","每日3条原创文案+1条视频","AI智能客服回复评论","数据复盘+策略优化","变现路径自动匹配"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-[10px] text-white shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 定价 ─── */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-10">定价</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "体验卡", price: "¥20", unit: "一次性", desc: "7天全功能体验", badge: "引流价" },
            { name: "月卡", price: "¥99", unit: "/月", desc: "每日3文+1漫剧", badge: "主力" },
            { name: "年卡", price: "¥799", unit: "/年", desc: "≈¥66/月", badge: "最划算" },
            { name: "Pro", price: "¥299", unit: "/月", desc: "多账号≤5个", badge: "工作室" },
          ].map(p => (
            <div key={p.name} className="glass rounded-2xl p-5 text-center hover:shadow-md transition-all relative">
              <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-[9px] font-medium text-white">{p.badge}</span>
              <div className="text-sm font-medium text-gray-400">{p.name}</div>
              <div className="mt-2"><span className="text-2xl font-extrabold text-gray-800">{p.price}</span><span className="text-xs text-gray-400 ml-0.5">{p.unit}</span></div>
              <div className="text-xs text-gray-400 mt-1.5">{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-center text-gray-800 mb-8">常见问题</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <details key={i} className="glass rounded-2xl overflow-hidden group">
              <summary className="px-5 py-3.5 text-sm text-gray-600 cursor-pointer hover:text-indigo-600 transition-colors flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-gray-300 group-open:rotate-180 transition-transform text-xs">▼</span>
              </summary>
              <div className="px-5 pb-4 text-xs text-gray-400 leading-relaxed border-t border-gray-100 pt-3">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="max-w-3xl mx-auto px-6 text-center">
        <div className="relative rounded-3xl p-10 bg-gradient-to-br from-indigo-50 via-white to-purple-50 border border-indigo-100/50 overflow-hidden">
          <div className="relative">
            <div className="text-4xl mb-3">🎬</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">现在就开启你的自媒体公司</h2>
            <p className="text-sm text-gray-400 mb-6">20元体验7天 · 不满意随时停 · 无需任何承诺</p>
            <Link href="/jiying/agents/agent-router"
              className="btn-primary inline-block px-8 py-3 rounded-xl text-sm font-semibold">🚀 花20元开公司</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
