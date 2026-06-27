"use client"
import Link from "next/link"

const FAQ = [
  { q: "20元真的可以开一家自媒体公司吗？", a: "是的。20元是7天体验价。你不需要注册公司、不需要租办公室、不需要雇人。即影帮你做3件事：① 诊断你的优劣势，推荐最适合你的赛道 ② 建立账号人设和内容方向 ③ 每天自动生成内容供你审核发布。你只需要有自己的抖音/小红书/视频号/B站账号（大部分用户已经有了），剩下的交给我们。" },
  { q: "我需要做什么？", a: "只需要两步：1️⃣ 填写一份3分钟的偏好问卷（你擅长什么、想在哪个平台做、想怎么赚钱）2️⃣ 每天花30秒审核AI生成的内容，点确认发布。其他一切——选题、写文案、做视频、回复评论、分析数据——AI全自动完成。" },
  { q: "平台怎么帮我建立一个自媒体账号？", a: "你付款后，AI自动执行：① 分析你的优势和赛道 → ② 建立人设和品牌定位 → ③ 生成第一篇内容 → ④ 每天自动选题、创作、优化 → ⑤ AI智能客服自动回复评论和私信 → ⑥ 自动分析数据、优化策略。你只需要每天30秒点头。" },
  { q: "我适合做什么方向？", a: "系统会根据你的问卷自动匹配最佳赛道。比如：喜欢穿搭→小红书穿搭博主、擅长做饭→抖音美食教程、有孩子→母婴好物推荐、爱打游戏→B站游戏解说、退休养生→视频号健康内容。匹配度低于85%会自动调整。" },
  { q: "20元之后呢？", a: "20元是7天体验，让你零门槛看到效果。7天内你会看到AI持续产出内容、开始有自然流量。满意了可以升级为99元/月（每日3条文案+1条视频），或者799元/年（更划算）。不满意随时停。" },
  { q: "和代运营公司比有什么优势？", a: "代运营公司¥3000-15000/月，还要开会签合同。即影20元起步，AI永不休息、不请假、不涨价。内容产量是人工的10倍，成本是1/100。而且AI客服24小时自动回复评论，代运营公司做不到。" },
  { q: "平台禁止全自动运营怎么办？", a: "我们不碰红线。AI做所有脑力工作（选题、创作、优化），但是用户手动发布——你只需要下载内容、粘贴到对应平台、点击发布。这反而让你的账号更有「人味」，不会被认为是机器。" },
  { q: "多久能看到收入？", a: "一般第1-2周积累内容打基础，第3-4周开始有自然流量，第2个月如果有带货/探店需求AI自动承接，第3个月开启私域引流。当然每个人的赛道和执行力不同，结果会有差异。" },
]

export default function JiyingHome() {
  return (
    <div className="pb-20">

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative max-w-5xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="text-6xl mb-4">🎬</div>
          <p className="text-indigo-300 text-sm font-medium mb-3 tracking-widest uppercase">即影 · 所思即所见</p>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight mb-4">
            <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">20元</span>
            <span className="text-white"> 开启我的自媒体公司</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            一站式AI赋能，从0到1打造个人品牌
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/jiying/onboarding"
              className="px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-base font-bold hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/25 transition-all">
              🚀 立即开启
            </Link>
            <Link href="/jiying/agents/agent-14"
              className="px-8 py-3.5 bg-white/10 backdrop-blur-sm text-white rounded-xl text-sm font-medium border border-white/20 hover:bg-white/20 transition-all">
              🏷️ 先免费体验标签SEO
            </Link>
          </div>
          <p className="text-xs text-gray-500 mt-4">无需注册公司 · 无需雇佣团队 · AI全自动运营 · 不满意随时停</p>
        </div>
      </section>

      {/* ─── 20元怎么做到一家公司 ─── */}
      <section className="max-w-5xl mx-auto px-4 -mt-10 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { title: "赛道选择", desc: "50+赛道覆盖", icon: "🎯", href: "/jiying/agents/agent-router", extra: "热门赛道推荐", action: "点击进入 →" },
            { title: "账户设立", desc: "15+平台开户", icon: "📱", href: "/jiying/onboarding", extra: "一键跳转注册", action: "点击进入 →" },
            { title: "AI智能启动", desc: "Agent智能路由引擎", icon: "⚡", href: "/jiying/agents/agent-router", extra: "智能组合推荐", action: "点击进入 →" },
            { title: "每天30秒审核", desc: "快捷审核", icon: "✅", href: "/jiying/review", extra: "AI自动发布", action: "点击进入 →" },
            { title: "AI持续运营", desc: "持续运营", icon: "🤖", href: "/jiying/agents", extra: "24小时自动优化", action: "点击进入 →" },
          ].map(s => (
            <Link key={s.title} href={s.href} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all block text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="text-sm font-bold text-gray-800 mb-1">{s.title}</div>
              <div className="text-xs text-gray-400">{s.desc}</div>
              <div className="text-[10px] text-indigo-500 mt-2 font-medium">{s.action}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 用户付出 vs 得到 ─── */}
      <section className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-10">你付出的 vs 你得到的</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-red-100 p-6">
            <h3 className="text-sm font-bold text-red-600 mb-4">你只需要付出</h3>
            <ul className="space-y-3">
              {["💰 20元（7天体验，一杯咖啡钱）","⏱️ 每天30秒审核内容","📝 3分钟填写偏好问卷","📱 下载内容→粘贴到平台→点发布","📸 可选：提供1-3张参考图/产品图"].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-red-400 mt-0.5">✕</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-2xl border border-green-100 p-6">
            <h3 className="text-sm font-bold text-green-600 mb-4">你将得到</h3>
            <ul className="space-y-3">
              {["🤖 15个AI专家为你24小时工作","🧠 1个调度大脑自动分配任务","📝 每日3条原创文案（自动生成）","🎬 每日1条原创视频（AI自动制作）","💬 AI智能客服自动回复评论/私信","📊 每日数据复盘+策略优化","🔗 自动识别高意向用户→引导私域","💰 变现路径AI自动匹配（带货/广告/知识付费）","🔥 对标爆款分析+差异化复刻","🏷️ 标签SEO优化让更多人搜到你"].map(item => (
                <li key={item} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 mt-0.5">✓</span><span>{item}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 定价 ─── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-3">定价</h2>
        <p className="text-sm text-gray-400 text-center mb-8">单用户月成本仅¥4.2 · 毛利率94%+</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: "体验卡", price: "¥20", unit: "一次性", desc: "7天全功能体验", color: "from-amber-500 to-orange-500", badge: "🔥 引流价" },
            { name: "月卡", price: "¥99", unit: "/月", desc: "每日3文+1漫剧+AI客服", color: "from-indigo-500 to-purple-500", badge: "主力" },
            { name: "年卡", price: "¥799", unit: "/年", desc: "≈¥66/月·优先模型", color: "from-purple-500 to-pink-500", badge: "最划算" },
            { name: "Pro", price: "¥299", unit: "/月", desc: "多账号≤5个·数据看板", color: "from-gray-700 to-gray-900", badge: "工作室" },
          ].map(p => (
            <div key={p.name} className="bg-white rounded-2xl border border-gray-100 p-5 text-center hover:shadow-md transition-all relative">
              <span className="absolute -top-2 right-3 text-[9px] px-2 py-0.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium">{p.badge}</span>
              <div className="text-sm font-bold text-gray-800">{p.name}</div>
              <div className="mt-2"><span className="text-3xl font-extrabold text-gray-900">{p.price}</span><span className="text-xs text-gray-400 ml-0.5">{p.unit}</span></div>
              <div className="text-[10px] text-gray-400 mt-2 leading-relaxed">{p.desc}</div>
              <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${p.color}`} />
            </div>
          ))}
        </div>
      </section>

      {/* ─── 竞品对比 ─── */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">即影 vs 其他方案</h2>
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-600">对比维度</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-400">代运营公司</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-400">MoneyPrinter</th>
                <th className="text-center px-4 py-3 font-semibold text-indigo-600 bg-indigo-50">即影</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[["起步价格","¥3000-15000/月","免费（需技术）","¥20"],["启动流程","开会签合同","装Python环境","扫码付20元"],["小白可用","✅","❌","✅"],["内容创作","✅","✅视频","✅图文+视频+漫剧"],["封面设计","✅","❌","✅ 3版对比"],["BGM+音效","❌","❌","✅"],["数据复盘","✅","❌","✅ 每日推送"],["AI智能客服","❌","❌","✅ 自动回复"],["私域引流","⚠️ 另收费","❌","✅ 自动引导"],["对标分析","✅","❌","✅ 自动拆解"],["人设建模","✅","❌","✅ 15个Agent"],["每天耗时","1-2小时沟通","1小时调试","30秒审核"]].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="px-4 py-2.5 text-gray-700 font-medium">{row[0]}</td>
                  <td className="px-4 py-2.5 text-center text-gray-400">{row[1]}</td>
                  <td className="px-4 py-2.5 text-center text-gray-400">{row[2]}</td>
                  <td className="px-4 py-2.5 text-center text-indigo-600 font-semibold bg-indigo-50/50">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 常见问题 ─── */}
      <section className="max-w-3xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-8">常见问题</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <details key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden group">
              <summary className="px-4 py-3.5 text-sm font-medium text-gray-700 cursor-pointer hover:text-indigo-600 hover:bg-indigo-50/30 transition-colors list-none flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-gray-300 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-4 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-3">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── 底部CTA ─── */}
      <section className="max-w-3xl mx-auto px-4 text-center">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
          <div className="text-4xl mb-3">🎬</div>
          <h2 className="text-2xl font-extrabold mb-2">现在就开启你的自媒体公司</h2>
          <p className="text-sm text-indigo-200 mb-6">20元体验7天 · 不满意随时停 · 无需任何承诺</p>
          <Link href="/jiying/onboarding" className="inline-block px-8 py-3.5 bg-white text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-50 shadow-lg transition-all">🚀 花20元开公司</Link>
        </div>
      </section>

    </div>
  )
}
