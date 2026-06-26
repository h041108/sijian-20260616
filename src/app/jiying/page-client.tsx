"use client"
import Link from "next/link"

const PLANS = [
  { name: "体验卡", price: "¥20", unit: "一次性", desc: "7天全功能体验", color: "from-amber-500 to-orange-500" },
  { name: "月卡", price: "¥99", unit: "/月", desc: "每日3文+1漫剧", color: "from-indigo-500 to-purple-500" },
  { name: "年卡", price: "¥799", unit: "/年", desc: "≈¥66/月 优先模型", color: "from-purple-500 to-pink-500" },
  { name: "Pro", price: "¥299", unit: "/月", desc: "多账号≤5个", color: "from-gray-700 to-gray-900" },
]

const HIGHLIGHTS = [
  { icon: "🤖", title: "15个AI专家", desc: "品牌定位、人设建模、提示词大师…各司其职", href: "/jiying/agents" },
  { icon: "🧠", title: "1个调度大脑", desc: "主调度Agent自动拆解任务、分配、审核、汇总", href: "/jiying/orchestrator" },
  { icon: "⏱️", title: "每天30秒", desc: "打开→审核→发布，AI做99%的工作", href: "/jiying/review" },
  { icon: "🖼️", title: "图片+漫剧", desc: "王炸级图片工作室+漫剧生成引擎", href: "/jiying/studio" },
  { icon: "📊", title: "数据驱动", desc: "每日数据复盘，AI自动优化内容策略", href: "/jiying/compass" },
  { icon: "💬", title: "智能客服", desc: "自动回复评论/私信，引导私域转化", href: "/jiying/agents" },
]

export default function JiyingHome() {
  return (
    <div className="space-y-12 pb-16">
      <section className="text-center pt-12 pb-8 px-4 max-w-3xl mx-auto space-y-5">
        <div className="text-5xl mb-2">🎬</div>
        <h1 className="text-3xl font-extrabold text-gray-900 leading-tight">20元 = 一家线上自媒体公司</h1>
        <p className="text-base text-gray-500">15个AI自媒体专家 + 1个智能调度大脑 + 每天30秒审核 = 一个王炸级自媒体账号</p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/jiying/agents" className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">🤖 探索15个Agent</Link>
          <Link href="/jiying/agents/agent-14" className="px-6 py-2.5 bg-white text-gray-700 rounded-xl text-sm font-medium border border-gray-200 hover:border-indigo-300">🏷️ 先试试标签SEO</Link>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4">
        <h2 className="text-center text-base font-bold text-gray-700 mb-6">为什么是王炸级？</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {HIGHLIGHTS.map(h => (
            <Link key={h.title} href={h.href}
              className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-sm hover:border-indigo-200 transition-all block">
              <div className="text-2xl mb-1">{h.icon}</div>
              <div className="text-sm font-semibold text-gray-800">{h.title}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{h.desc}</div>
            </Link>
          ))}
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4">
        <h2 className="text-center text-base font-bold text-gray-700 mb-6">定价</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {PLANS.map(p => (
            <div key={p.name} className="bg-white rounded-2xl border border-gray-100 p-4 text-center hover:shadow-md">
              <div className="text-sm font-bold text-gray-800">{p.name}</div>
              <div className="mt-1"><span className="text-2xl font-extrabold text-gray-900">{p.price}</span><span className="text-xs text-gray-400 ml-0.5">{p.unit}</span></div>
              <div className="text-[10px] text-gray-400 mt-1">{p.desc}</div>
              <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${p.color}`} />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
