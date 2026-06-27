"use client"
import Link from "next/link"

const FAQ = [
  { q: "20元真的可以开一家自媒体公司吗？", a: "是的。20元是7天体验价。AI诊断赛道、建立人设、每日自动生成内容。你只需要有自己的账号，剩下的交给我们。" },
  { q: "我需要做什么？", a: "两步：① 3分钟偏好问卷 ② 每天30秒审核发布。选题、文案、视频、评论回复、数据分析——AI全自动。" },
  { q: "我适合做什么方向？", a: "系统自动匹配。穿搭→小红书、美食→抖音、母婴→好物推荐、游戏→B站、养生→视频号。匹配度低于85%自动调整。" },
  { q: "和代运营公司比有什么优势？", a: "代运营¥3000-15000/月，即影¥20起步。AI不休息、不请假、不涨价。内容产量10倍，成本1/100。" },
]

const FEATURES = [
  { icon: "🎬", title: "AI自动剪辑", desc: "智能识别精彩片段，自动生成短视频" },
  { icon: "📱", title: "多平台分发", desc: "一键同步抖音/小红书/B站/视频号" },
  { icon: "⏰", title: "定时发布", desc: "AI分析最佳发布时间，自动排期推送" },
  { icon: "📊", title: "数据复盘", desc: "每日自动生成运营报告，策略持续优化" },
  { icon: "🤖", title: "AI智能客服", desc: "24小时自动回复评论，引导私域转化" },
  { icon: "📈", title: "矩阵管理", desc: "多账号统一管理，批量内容生产" },
]

export default function JiyingHome() {
  return (
    <div className="pb-16">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#F4F4F6] via-white to-[#E8F0FE] pt-16 pb-12 md:pt-20 md:pb-16">
        <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[60%] rounded-full bg-[#2962FF]/3 blur-[120px] animate-flow" />
        <div className="absolute bottom-[-15%] left-[-5%] w-[40%] h-[40%] rounded-full bg-[#5B7FFF]/3 blur-[100px] animate-flow" style={{ animationDelay: "1.5s" }} />
        <div className="relative max-w-6xl mx-auto px-4 md:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#2962FF]/10 text-xs text-[#2962FF] mb-5 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2962FF] animate-pulse" />
            AI自媒体自动化运营平台
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.08] tracking-tight mb-4">
            <span className="text-[#1A1A2E]">20元开启你的</span>
            <br />
            <span className="bg-gradient-to-r from-[#2962FF] via-[#5B7FFF] to-[#2962FF] bg-clip-text text-transparent">自媒体公司</span>
          </h1>
          <p className="text-base md:text-lg text-[#5A5A72] max-w-2xl mx-auto mb-8 leading-relaxed">
            15个AI专家 · 智能路由引擎 · 每日自动生成内容<br className="hidden sm:block" />
            一站式AI赋能，从0到1打造个人品牌
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/jiying/onboarding" className="btn-primary px-6 py-3 text-sm">🚀 立即开启</Link>
            <Link href="/jiying/agents/agent-14" className="btn-ghost px-6 py-3 text-sm">免费体验标签SEO</Link>
          </div>
          <p className="text-xs text-[#9A9AB0] mt-5">无需注册公司 · 无需雇佣团队 · AI全自动运营 · 随时可停</p>
        </div>
      </section>

      {/* ─── 核心功能 ─── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 -mt-6 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {FEATURES.map((f, i) => (
            <div key={f.title} className="glass-card p-4 text-center group" style={{ animationDelay: `${i * 0.05}s` }}>
              <div className="text-2xl mb-2">{f.icon}</div>
              <div className="text-sm font-semibold text-[#1A1A2E] group-hover:text-[#2962FF] transition-colors">{f.title}</div>
              <div className="text-[10px] text-[#9A9AB0] mt-1 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 自动化流程 ─── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pt-16 pb-12">
        <div className="glass-card p-6 md:p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#1A1A2E]">AI自动化工作流</h2>
            <p className="text-sm text-[#5A5A72] mt-1">从内容生成到发布复盘，全链路AI自动化</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: "01", title: "AI选题", desc: "热点分析·智能推荐", color: "#2962FF" },
              { step: "02", title: "AI创作", desc: "文案·视频·封面一键生成", color: "#5B7FFF" },
              { step: "03", title: "AI发布", desc: "多平台定时自动分发", color: "#2962FF" },
              { step: "04", title: "AI复盘", desc: "数据追踪·策略优化", color: "#5B7FFF" },
            ].map((s, i) => (
              <div key={s.step} className="flow-line relative text-center">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white text-sm font-bold mx-auto mb-2" style={{ background: `linear-gradient(135deg, ${s.color}, ${s.color}dd)` }}>{s.step}</div>
                <div className="text-sm font-semibold text-[#1A1A2E]">{s.title}</div>
                <div className="text-[10px] text-[#9A9AB0] mt-0.5">{s.desc}</div>
                {i < 3 && <div className="hidden md:block absolute top-5 -right-2 w-4 h-px bg-gradient-to-r from-[#2962FF]/40 to-transparent" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 付出 vs 得到 ─── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-[#9A9AB0] mb-4 tracking-wide">你只需要付出</h3>
            <ul className="space-y-3">
              {["20元（7天体验）","每天30秒审核","3分钟填问卷","下载→粘贴→发布"].map(item => (
                <li key={item} className="flex items-center gap-3 text-sm text-[#5A5A72]">
                  <span className="w-5 h-5 rounded-full border border-[#E8E8EE] flex items-center justify-center text-[10px] text-[#9A9AB0] shrink-0">✕</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="glass-card p-6 border-[#2962FF]/10" style={{ background: "rgba(41,98,255,0.03)" }}>
            <h3 className="text-sm font-semibold text-[#2962FF] mb-4 tracking-wide">你将得到</h3>
            <ul className="space-y-3">
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
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-xl font-bold text-center text-[#1A1A2E] mb-8">即影 vs 其他方案</h2>
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
                ["小白可用","✅","❌","✅"],
                ["内容创作","✅","✅视频","✅图文+视频+漫剧"],
                ["封面设计","✅","❌","✅ 3版对比"],
                ["AI智能客服","❌","❌","✅ 自动回复"],
                ["私域引流","⚠️ 另收费","❌","✅ 自动引导"],
                ["对标分析","✅","❌","✅ 自动拆解"],
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
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-xl font-bold text-center text-[#1A1A2E] mb-8">定价</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { n: "体验卡", p: "¥20", u: "一次性", d: "7天全功能", b: "引流价", c: "from-[#2962FF] to-[#5B7FFF]" },
            { n: "月卡", p: "¥99", u: "/月", d: "每日3文+1漫剧", b: "主力", c: "from-[#1A3DB0] to-[#2962FF]" },
            { n: "年卡", p: "¥799", u: "/年", d: "≈¥66/月", b: "最划算", c: "from-[#5B7FFF] to-[#2962FF]" },
            { n: "Pro", p: "¥299", u: "/月", d: "多账号≤5个", b: "工作室", c: "from-[#1E1E2E] to-[#3A3A52]" },
          ].map(c => (
            <div key={c.n} className="glass-card p-5 text-center hover:shadow-hover transition-all relative">
              <span className={`absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r ${c.c} text-[9px] font-medium text-white`}>{c.b}</span>
              <div className="text-sm font-medium text-[#9A9AB0]">{c.n}</div>
              <div className="mt-2"><span className="text-2xl font-extrabold text-[#1A1A2E]">{c.p}</span><span className="text-xs text-[#9A9AB0] ml-0.5">{c.u}</span></div>
              <div className="text-xs text-[#9A9AB0] mt-1.5">{c.d}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 实操教程 ─── */}
      <section className="max-w-6xl mx-auto px-4 md:px-6 pb-12">
        <h2 className="text-xl font-bold text-center text-[#1A1A2E] mb-8">3分钟上手</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { icon: "📝", title: "添加账号", desc: "绑定或注册您的自媒体平台账号", time: "2分钟" },
            { icon: "⚡", title: "AI智能启动", desc: "系统自动完成赛道分析和Agent配置", time: "30秒" },
            { icon: "✅", title: "每日审核发布", desc: "每天30秒审核AI生成的内容，一键发布", time: "每天" },
          ].map(t => (
            <div key={t.title} className="glass-card p-5 flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#2962FF]/5 flex items-center justify-center text-lg shrink-0">{t.icon}</div>
              <div>
                <div className="text-sm font-semibold text-[#1A1A2E]">{t.title}</div>
                <div className="text-xs text-[#9A9AB0] mt-0.5">{t.desc}</div>
                <div className="text-[10px] text-[#2962FF] mt-1">⏱ {t.time}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 pb-8">
        <h2 className="text-xl font-bold text-center text-[#1A1A2E] mb-6">常见问题</h2>
        <div className="space-y-2">
          {FAQ.map((item, i) => (
            <details key={i} className="glass-card overflow-hidden group">
              <summary className="px-5 py-3.5 text-sm text-[#1A1A2E] cursor-pointer hover:text-[#2962FF] transition-colors flex items-center justify-between list-none">
                <span>{item.q}</span>
                <span className="text-[#9A9AB0] group-open:rotate-180 transition-transform text-xs">▼</span>
              </summary>
              <div className="px-5 pb-4 text-xs text-[#5A5A72] leading-relaxed border-t border-[#E8E8EE] pt-3">{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ─── CTA + 返回思见 ─── */}
      <section className="max-w-3xl mx-auto px-4 md:px-6 text-center pb-12">
        <div className="glass-card p-8 md:p-10">
          <div className="text-4xl mb-4">🎬</div>
          <h2 className="text-xl font-bold text-[#1A1A2E] mb-2">现在就开启你的自媒体公司</h2>
          <p className="text-sm text-[#5A5A72] mb-6">20元体验7天 · 不满意随时停 · 无需任何承诺</p>
          <Link href="/jiying/onboarding" className="btn-primary inline-block px-8 py-3 text-sm font-semibold">🚀 花20元开公司</Link>
        </div>
        <div className="mt-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-[#9A9AB0] hover:text-[#2962FF] transition-colors">
            ← 返回思见
          </Link>
          <p className="text-xs text-[#9A9AB0] mt-2">有事问思见</p>
        </div>
      </section>
    </div>
  )
}
