"use client"
import Link from "next/link"

export default function JiyingHome() {
  return (
    <div className="pb-16">

      {/* ─── Hero ─── */}
      <section className="bg-gradient-to-br from-indigo-900 via-purple-900 to-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20 text-center">
          <div className="text-5xl mb-4">🎬</div>
          <p className="text-indigo-300 text-xs font-medium mb-2 tracking-widest">即影 · 所思即所见</p>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-4">
            <span className="bg-gradient-to-r from-amber-300 to-orange-400 bg-clip-text text-transparent">20元</span>
            <span className="text-white"> 开启我的自媒体公司</span>
          </h1>
          <p className="text-base text-gray-300 max-w-2xl mx-auto mb-6">
            一站式AI赋能，从0到1打造个人品牌。<br />
            15个AI专家 + 智能路由引擎 + 每日自动生成内容 = 你的全自动化自媒体公司
          </p>
          <Link href="/jiying/onboarding"
            className="inline-block px-10 py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-base font-bold hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-orange-500/25 transition-all">
            🚀 立即开启
          </Link>
        </div>
      </section>

      {/* ─── 三大核心卡片 ─── */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 赛道选择 */}
          <Link href="/jiying/agents/agent-router"
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg mb-3 group-hover:bg-indigo-100 transition-colors">🎯</div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">赛道选择</h3>
            <p className="text-xs text-gray-400 mb-3">50+赛道覆盖 · 热门赛道推荐</p>
            <span className="text-xs text-indigo-600 group-hover:gap-2 transition-all">点击进入 →</span>
          </Link>

          {/* 账户设立 */}
          <Link href="/jiying/onboarding"
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-lg mb-3 group-hover:bg-green-100 transition-colors">📱</div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">账户设立</h3>
            <p className="text-xs text-gray-400 mb-3">15+平台开户 · 一键跳转注册</p>
            <span className="text-xs text-green-600 group-hover:gap-2 transition-all">点击进入 →</span>
          </Link>

          {/* AI智能启动 */}
          <Link href="/jiying/agents/agent-router"
            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all group">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-lg mb-3 group-hover:bg-purple-100 transition-colors">⚡</div>
            <h3 className="text-sm font-bold text-gray-800 mb-1">AI智能启动</h3>
            <p className="text-xs text-gray-400 mb-3">Agent智能路由引擎 · 智能组合推荐</p>
            <span className="text-xs text-purple-600 group-hover:gap-2 transition-all">点击进入 →</span>
          </Link>
        </div>
      </section>

      {/* ─── 辅助功能快捷入口 ─── */}
      <section className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link href="/jiying/review"
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-amber-200 transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-lg">⚡</div>
            <div>
              <div className="text-sm font-bold text-gray-800">每天30秒审核</div>
              <div className="text-xs text-gray-400">浏览内容 → 点确认 → AI自动发布</div>
            </div>
          </Link>
          <Link href="/jiying/agents/agent-router"
            className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-lg">🤖</div>
            <div>
              <div className="text-sm font-bold text-gray-800">AI持续运营</div>
              <div className="text-xs text-gray-400">15个AI专家24小时自动运营你的账号</div>
            </div>
          </Link>
        </div>
      </section>

      {/* ─── Agent流水线预览 ─── */}
      <section className="max-w-5xl mx-auto px-4 mt-8">
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-3">🧠 你的专属Agent团队</h3>
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2 text-xs">
            {[
              { icon: "🎯", name: "品牌定位", desc: "定位你的方向" },
              { icon: "🏢", name: "商业策略", desc: "规划变现路径" },
              { icon: "👤", name: "人设建模", desc: "打造账号人设" },
              { icon: "🎨", name: "提示词大师", desc: "生成高质量prompt" },
              { icon: "🎬", name: "脚本分镜", desc: "创作分镜脚本" },
              { icon: "🎵", name: "BGM作曲", desc: "匹配背景音乐" },
              { icon: "🔊", name: "音效设计", desc: "设计声音蓝图" },
              { icon: "📊", name: "数据分析", desc: "诊断运营数据" },
              { icon: "📰", name: "标题拆解", desc: "优化爆款标题" },
              { icon: "📋", name: "爆款复刻", desc: "复制爆款基因" },
              { icon: "💬", name: "评论分析", desc: "分析评论数据" },
              { icon: "🖼️", name: "封面灵感", desc: "设计封面方案" },
              { icon: "💡", name: "选题分析", desc: "推荐每日选题" },
              { icon: "🏷️", name: "标签SEO", desc: "优化搜索标签" },
              { icon: "🧠", name: "知识图谱", desc: "行业深度分析" },
            ].slice(0, 15).map(a => (
              <div key={a.name} className="bg-white/80 rounded-xl p-2.5 text-center border border-indigo-100/50">
                <div className="text-lg mb-0.5">{a.icon}</div>
                <div className="text-[10px] font-semibold text-gray-700">{a.name}</div>
                <div className="text-[8px] text-gray-400">{a.desc}</div>
              </div>
            ))}
          </div>
          <div className="text-center mt-3">
            <Link href="/jiying/agents/agent-router" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">查看智能路由配置 →</Link>
          </div>
        </div>
      </section>
    </div>
  )
}
