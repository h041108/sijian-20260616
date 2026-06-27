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
        <div className="absolute inset-0 bg-gradient-to-br from-[#2962FF]/3 via-transparent to-[#5B7FFF]/3 animate-gradient" style={{backgroundSize:'200% 200%'}} />
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[70%] rounded-full bg-[#2962FF]/5 blur-[150px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-[#5B7FFF]/4 blur-[150px]" />
        <div className="relative max-w-6xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-[#2962FF]/10 text-xs text-[#2962FF] mb-6 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2962FF] animate-pulse" />
            即影 · AI自媒体工厂
          </div>
          <h1 className="text-4xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6">
            <span className="bg-gradient-to-r from-[#1A1A2E] via-[#2962FF] to-[#1A1A2E] bg-clip-text text-transparent animate-gradient">20元开启你的</span>
            <br />
            <span className="bg-gradient-to-r from-[#2962FF] via-[#5B7FFF] to-[#2962FF] bg-clip-text text-transparent animate-gradient" style={{ backgroundSize: '200% 100%', animation: 'gradient 4s ease infinite' }}>自媒体公司</span>
          </h1>
          <p className="text-base md:text-lg text-[#5A5A72] max-w-2xl mx-auto mb-10 leading-relaxed">
            15个AI专家 · 智能路由引擎 · 每日自动生成内容<br className="hidden sm:block" />
            一站式AI赋能，从0到1打造个人品牌
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/jiying/onboarding" className="btn-primary px-8 py-3.5 rounded-xl text-sm font-semibold">🚀 立即开启</Link>
            <Link href="/jiying/agents/agent-14"
              className="btn-ghost px-8 py-3.5 rounded-xl text-sm font-medium">免费体验标签SEO</Link>
          </div>
          <p className="text-xs text-[#9A9AB0] mt-6">无需注册公司 · 无需雇佣团队 · 全自动运营 · 随时可停</p>
        </div>
      </section>

      {/* ─── 4大核心 ─── */}
      <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { t: "📱", title: "账户设立", desc: "15+平台开户", h: "/jiying/onboarding" },
            { t: "⚡", title: "AI智能启动", desc: "Agent组合推荐", h: "/jiying/launch" },
            { t: "✅", title: "每天30秒审核", desc: "快捷审核发布", h: "/jiying/review" },
            { t: "🤖", title: "AI持续运营", desc: "运营工作台", h: "/jiying/agents" },
          ].map(s => (
            <Link key={s.title} href={s.h}
              className="glass-card p-5 text-center hover:shadow-hover transition-all group">
              <div className="text-2xl mb-2">{s.t}</div>
              <div className="text-sm font-semibold bg-gradient-to-r from-[#1A1A2E] via-[#2962FF] to-[#1A1A2E] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient group-hover:from-[#2962FF] group-hover:via-[#5B7FFF] group-hover:to-[#2962FF]">{s.title}</div>
              <div className="text-[10px] text-[#9A9AB0] mt-0.5">{s.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      {/* ─── 付出vs得到 ─── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-8">
          <h3 className="text-sm font-semibold bg-gradient-to-r from-[#9A9AB0] to-[#2962FF] bg-clip-text text-transparent mb-5 tracking-wider">你只需要付出</h3>
            <ul className="space-y-4">
              {["20元（7天体验）","每天30秒审核","3分钟填问卷","下载→粘贴→发布"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#5A5A72]">
                  <span className="w-5 h-5 rounded-full border border-[#E8E8EE] flex items-center justify-center text-[10px] text-[#9A9AB0] shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-8 border-[#2962FF]/10 bg-[#2962FF]/[0.02]">
            <h3 className="text-sm font-semibold bg-gradient-to-r from-[#2962FF] to-[#5B7FFF] bg-clip-text text-transparent mb-5 tracking-wider">你将得到</h3>
            <ul className="space-y-4">
              {["15个AI专家24小时工作","每日3条文案+1条视频","AI智能客服回复评论","数据复盘+策略优化","变现路径自动匹配"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#1A1A2E]">
                  <span className="w-5 h-5 rounded-full bg-gradient-to-br from-[#2962FF] to-[#5B7FFF] flex items-center justify-center text-[10px] text-white shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── 竞品对比 ─── */}
      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-center bg-gradient-to-r from-[#1A1A2E] via-[#2962FF] to-[#5B7FFF] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient mb-8">即影 vs 其他方案</h2>
        <div className="glass-card overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F8F8FA] border-b border-[#E8E8EE]">
                <th className="text-left px-4 py-3 font-semibold text-[#5A5A72]">对比维度</th>
                <th className="text-center px-4 py-3 font-semibold text-[#9A9AB0]">代运营公司</th>
                <th className="text-center px-4 py-3 font-semibold text-[#9A9AB0]">MoneyPrinter</th>
                <th className="text-center px-4 py-3 font-semibold text-[#2962FF] bg-[#2962FF]/5">即影</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E8EE]">
              {[
                ["起步价格","¥3000-15000/月","免费（需技术）","¥20"],
                ["启动流程","开会签合同","装Python环境","扫码付20元"],
                ["小白可用","✅","❌","✅"],
                ["内容创作","✅","✅视频","✅图文+视频+漫剧"],
                ["封面设计","✅","❌","✅ 3版对比"],
                ["BGM+音效","❌","❌","✅"],
                ["数据复盘","✅","❌","✅ 每日推送"],
                ["AI智能客服","❌","❌","✅ 自动回复"],
                ["私域引流","⚠️ 另收费","❌","✅ 自动引导"],
                ["对标分析","✅","❌","✅ 自动拆解"],
                ["人设建模","✅","❌","✅ 15个Agent"],
                ["每天耗时","1-2小时沟通","1小时调试","30秒审核"],
              ].map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#F8F8FA]/50"}>
                  <td className="px-4 py-2.5 text-[#1A1A2E] font-medium">{row[0]}</td>
                  <td className="px-4 py-2.5 text-center text-[#9A9AB0]">{row[1]}</td>
                  <td className="px-4 py-2.5 text-center text-[#9A9AB0]">{row[2]}</td>
                  <td className="px-4 py-2.5 text-center text-[#2962FF] font-semibold bg-[#2962FF]/5">{row[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─── 定价 ─── */}
      <section className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-center bg-gradient-to-r from-[#1A1A2E] via-[#2962FF] to-[#5B7FFF] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient mb-10">定价</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { n: "体验卡", p: "¥20", u: "一次性", d: "7天全功能", b: "引流价", c: "from-[#2962FF] to-[#5B7FFF]" },
            { n: "月卡", p: "¥99", u: "/月", d: "每日3文+1漫剧", b: "主力", c: "from-[#1A3DB0] to-[#2962FF]" },
            { n: "年卡", p: "¥799", u: "/年", d: "≈¥66/月", b: "最划算", c: "from-[#5B7FFF] to-[#2962FF]" },
            { n: "Pro", p: "¥299", u: "/月", d: "多账号≤5个", b: "工作室", c: "from-[#1E1E2E] to-[#3A3A52]" },
          ].map(c => (
            <div key={c.n} className="glass-card p-6 text-center hover:shadow-hover transition-all relative">
              <span className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r ${c.c} text-[9px] font-medium text-white`}>{c.b}</span>
              <div className="text-sm font-medium text-[#9A9AB0]">{c.n}</div>
              <div className="mt-2"><span className="text-2xl font-extrabold text-[#1A1A2E]">{c.p}</span><span className="text-xs text-[#9A9AB0] ml-0.5">{c.u}</span></div>
              <div className="text-xs text-[#9A9AB0] mt-1.5">{c.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-3xl mx-auto px-6 py-10">
        <h2 className="text-xl font-bold text-center bg-gradient-to-r from-[#1A1A2E] via-[#2962FF] to-[#5B7FFF] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient mb-8">常见问题</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <details key={i} className="glass-card overflow-hidden group">
              <summary className="px-5 py-3.5 text-sm bg-gradient-to-r from-[#1A1A2E] to-[#1A1A2E] bg-clip-text text-transparent bg-[length:200%_100%] animate-gradient cursor-pointer hover:from-[#2962FF] hover:to-[#5B7FFF] transition-all flex items-center justify-between">
                <span>{item.q}</span>
                <span className="text-[#9A9AB0] group-open:rotate-180 transition-transform text-xs">▼</span>
              </summary>
              <div className="px-5 pb-4 text-xs text-[#5A5A72] leading-relaxed border-t border-[#E8E8EE] pt-3">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="max-w-3xl mx-auto px-6 text-center">
        <div className="glass-card p-10">
          <div className="text-4xl mb-4">🎬</div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-[#1A1A2E] to-[#2962FF] bg-clip-text text-transparent mb-2">现在就开启你的自媒体公司</h2>
          <p className="text-sm text-[#5A5A72] mb-6">20元体验7天 · 不满意随时停 · 无需任何承诺</p>
          <Link href="/jiying/onboarding"
            className="btn-primary inline-block px-8 py-3 rounded-xl text-sm font-semibold">🚀 花20元开公司</Link>
        </div>
        <div className="mt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#9A9AB0] hover:text-[#2962FF] transition-colors">← 返回思见</Link>
          <p className="text-xs text-[#9A9AB0] mt-2">有事问思见</p>
        </div>
      </section>
    </div>
  )
}
