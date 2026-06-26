"use client"
import { useState } from "react"

const PLATFORMS = [
  { id: "douyin", name: "抖音", icon: "🎵", desc: "短视频，强算法推荐", users: "8亿+" },
  { id: "xiaohongshu", name: "小红书", icon: "📕", desc: "图文+视频，女性用户多", users: "3亿+" },
  { id: "shipinhao", name: "视频号", icon: "💬", desc: "微信生态，中年用户多", users: "5亿+" },
  { id: "bilibili", name: "B站", icon: "📺", desc: "中长视频，年轻人社区", users: "3亿+" },
]

const NICHES = [
  { id: "meishi", name: "美食", icon: "🍳", desc: "美食教程、探店、测评" },
  { id: "meizhuang", name: "美妆", icon: "💄", desc: "化妆教程、护肤品测评" },
  { id: "chuanda", name: "穿搭", icon: "👗", desc: "穿搭技巧、开箱测评" },
  { id: "shuma", name: "数码", icon: "📱", desc: "手机/电脑评测、科技资讯" },
  { id: "jiaoyu", name: "教育", icon: "📚", desc: "知识分享、学习方法" },
  { id: "jiankang", name: "健康", icon: "🏃", desc: "养生、健身、食疗" },
  { id: "qinzi", name: "母婴", icon: "👶", desc: "育儿经验、好物推荐" },
  { id: "lvyou", name: "旅行", icon: "✈️", desc: "旅游攻略、探店打卡" },
  { id: "jiating", name: "家居", icon: "🏠", desc: "装修、收纳、好物" },
  { id: "chongwu", name: "宠物", icon: "🐱", desc: "宠物日常、养宠知识" },
]

const GOALS = [
  { id: "daibao", name: "带货赚钱", icon: "🛒", desc: "通过卖产品赚佣金" },
  { id: "guanggao", name: "广告分成", icon: "📢", desc: "靠播放量赚平台收益" },
  { id: "siyu", name: "私域引流", icon: "🔗", desc: "引流到微信做高客单价" },
  { id: "zhishi", name: "知识付费", icon: "📖", desc: "卖课程/咨询服务" },
  { id: "pinpai", name: "品牌合作", icon: "🤝", desc: "接品牌广告商单" },
]

const TIME_OPTIONS = [
  { id: "15min", label: "每天15分钟", desc: "时间比较少" },
  { id: "30min", label: "每天30分钟", desc: "可以稳定更新" },
  { id: "1hour", label: "每天1小时", desc: "时间充裕" },
]

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({
    platforms: [] as string[],
    niches: [] as string[],
    goal: "",
    time: "",
    hasAccount: true,
  })

  const [report, setReport] = useState<any>(null)
  const [generating, setGenerating] = useState(false)

  const toggleArray = (key: "platforms" | "niches", value: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }))
  }

  const handleGenerate = async () => {
    setGenerating(true)
    const prompt = `我是一名想做自媒体的新手。请帮我做一份完整的自媒体创业诊断报告。

我的情况：
- 目标平台：${answers.platforms.join("、")}
- 感兴趣的赛道：${answers.niches.join("、")}
- 变现目标：${GOALS.find(g => g.id === answers.goal)?.name || ""}
- 每天可用时间：${TIME_OPTIONS.find(t => t.id === answers.time)?.label || ""}
- 已有账号：${answers.hasAccount ? "已有账号" : "需要注册"}

请输出以下格式的JSON诊断报告：
{
  "recommendedPlatform": "推荐主攻平台及理由",
  "recommendedNiche": "推荐赛道及理由",
  "personaAdvice": "人设建议（账号定位、内容风格、视觉方向）",
  "contentPlan": "内容规划（每周发什么类型的内容）",
  "monetizationPath": "变现路径（第1-3月做什么，第3-6月做什么）",
  "dailyWorkflow": "每天需要做什么（配合即影AI工具）",
  "estimatedTimeToFirstIncome": "预计多久能看到收入",
  "advantage": "你的优势在哪里",
  "challenge": "可能遇到的挑战及应对方案"
}`

    try {
      const res = await fetch("/api/agent/agent_01", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: prompt }),
      })
      const data = await res.json()
      if (data.structuredOutput) setReport(data.structuredOutput)
      else if (data.mainOutput) setReport({ raw: data.mainOutput })
    } catch {}
    setGenerating(false)
  }

  if (report) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🎉</span>
          <div><h1 className="text-xl font-bold text-gray-800">你的自媒体创业诊断报告</h1><p className="text-sm text-gray-400">基于你的回答，AI为你量身定制</p></div>
        </div>

        {report.recommendedPlatform && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
            <div className="text-xs text-indigo-500 font-semibold mb-1">🎯 推荐主攻平台</div>
            <div className="text-sm font-bold text-gray-800">{report.recommendedPlatform}</div>
          </div>
        )}

        {report.recommendedNiche && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-semibold mb-1">💡 推荐赛道</div>
            <div className="text-sm font-bold text-gray-800">{report.recommendedNiche}</div>
          </div>
        )}

        {report.personaAdvice && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-semibold mb-1">👤 人设建议</div>
            <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{report.personaAdvice}</div>
          </div>
        )}

        {report.contentPlan && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-semibold mb-1">📅 内容规划</div>
            <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{report.contentPlan}</div>
          </div>
        )}

        {report.monetizationPath && (
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <div className="text-xs text-gray-500 font-semibold mb-1">💰 变现路径</div>
            <div className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{report.monetizationPath}</div>
          </div>
        )}

        {report.estimatedTimeToFirstIncome && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            ⏱️ 预计首次收入时间：{report.estimatedTimeToFirstIncome}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setReport(null)}
            className="flex-1 py-2.5 bg-white text-gray-700 rounded-xl text-sm border border-gray-200 hover:border-indigo-300">
            🔄 重新诊断
          </button>
          <button
            className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800">
            🚀 开启即影（20元体验）
          </button>
        </div>
      </div>
    )
  }

  const progress = [
    { label: "选择平台", done: answers.platforms.length > 0 },
    { label: "选择赛道", done: answers.niches.length > 0 },
    { label: "变现目标", done: !!answers.goal },
    { label: "时间投入", done: !!answers.time },
  ]

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* 顶部引导 */}
      <div className="text-center space-y-2 pb-2">
        <span className="text-4xl">🎬</span>
        <h1 className="text-2xl font-extrabold text-gray-900">20元开启你的自媒体公司</h1>
        <p className="text-sm text-gray-400 max-w-lg mx-auto">
          花3分钟填写这份问卷，AI帮你诊断赛道、建立人设、规划内容
        </p>
      </div>

      {/* 进度条 */}
      <div className="flex gap-2">
        {progress.map((p, i) => (
          <div key={i} className="flex-1">
            <div className={`h-1.5 rounded-full ${p.done ? "bg-indigo-500" : i === step ? "bg-indigo-300" : "bg-gray-200"}`} />
            <div className={`text-[9px] mt-1 ${i === step ? "text-indigo-600 font-semibold" : "text-gray-300"}`}>{p.label}</div>
          </div>
        ))}
      </div>

      {/* Step 1: 选择平台 */}
      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-800">你在哪个平台做？</h2>
          <p className="text-xs text-gray-400">可以多选，建议先主攻1-2个</p>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => toggleArray("platforms", p.id)}
                className={`text-left p-3 rounded-xl border transition-all ${answers.platforms.includes(p.id) ? "bg-indigo-50 border-indigo-300" : "bg-white border-gray-200 hover:border-indigo-200"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{p.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{p.name}</div>
                    <div className="text-[10px] text-gray-400">{p.users}用户</div>
                  </div>
                  {answers.platforms.includes(p.id) && <span className="ml-auto text-indigo-500">✓</span>}
                </div>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} disabled={answers.platforms.length === 0}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400">下一步</button>
        </div>
      )}

      {/* Step 2: 选择赛道 */}
      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-800">你擅长或喜欢什么领域？</h2>
          <p className="text-xs text-gray-400">选择1-3个你感兴趣的赛道</p>
          <div className="grid grid-cols-2 gap-2">
            {NICHES.map(n => (
              <button key={n.id} onClick={() => toggleArray("niches", n.id)}
                className={`text-left p-3 rounded-xl border transition-all ${answers.niches.includes(n.id) ? "bg-indigo-50 border-indigo-300" : "bg-white border-gray-200 hover:border-indigo-200"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{n.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{n.name}</div>
                    <div className="text-[10px] text-gray-400">{n.desc}</div>
                  </div>
                  {answers.niches.includes(n.id) && <span className="ml-auto text-indigo-500">✓</span>}
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="px-4 py-2.5 bg-white text-gray-600 rounded-xl text-sm border border-gray-200">上一步</button>
            <button onClick={() => setStep(2)} disabled={answers.niches.length === 0}
              className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400">下一步</button>
          </div>
        </div>
      )}

      {/* Step 3: 变现目标 */}
      {step === 2 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-800">你想怎么赚钱？</h2>
          <p className="text-xs text-gray-400">选一个你最想尝试的方式</p>
          <div className="space-y-2">
            {GOALS.map(g => (
              <button key={g.id} onClick={() => setAnswers(prev => ({ ...prev, goal: g.id }))}
                className={`w-full text-left p-3 rounded-xl border transition-all ${answers.goal === g.id ? "bg-indigo-50 border-indigo-300" : "bg-white border-gray-200 hover:border-indigo-200"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{g.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{g.name}</div>
                    <div className="text-[10px] text-gray-400">{g.desc}</div>
                  </div>
                  {answers.goal === g.id && <span className="ml-auto text-indigo-500">✓</span>}
                </div>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="px-4 py-2.5 bg-white text-gray-600 rounded-xl text-sm border border-gray-200">上一步</button>
            <button onClick={() => setStep(3)} disabled={!answers.goal}
              className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400">下一步</button>
          </div>
        </div>
      )}

      {/* Step 4: 时间投入 */}
      {step === 3 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-800">你每天能花多少时间？</h2>
          <p className="text-xs text-gray-400">即影帮你做99%的工作，你只需要每天审核+发布</p>
          <div className="space-y-2">
            {TIME_OPTIONS.map(t => (
              <button key={t.id} onClick={() => setAnswers(prev => ({ ...prev, time: t.id }))}
                className={`w-full text-left p-3 rounded-xl border transition-all ${answers.time === t.id ? "bg-indigo-50 border-indigo-300" : "bg-white border-gray-200 hover:border-indigo-200"}`}>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm">{t.label.slice(2, 4)}</div>
                  <div>
                    <div className="text-sm font-medium text-gray-800">{t.label}</div>
                    <div className="text-[10px] text-gray-400">{t.desc}</div>
                  </div>
                  {answers.time === t.id && <span className="ml-auto text-indigo-500">✓</span>}
                </div>
              </button>
            ))}
          </div>

          {/* 账号确认 */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={answers.hasAccount} onChange={e => setAnswers(prev => ({ ...prev, hasAccount: e.target.checked }))} className="rounded" />
              我已经有想要做的平台账号
            </label>
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="px-4 py-2.5 bg-white text-gray-600 rounded-xl text-sm border border-gray-200">上一步</button>
            <button onClick={handleGenerate} disabled={!answers.time || generating}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-amber-600 hover:to-orange-600 disabled:bg-gray-200 disabled:text-gray-400 shadow-lg shadow-orange-500/20">
              {generating ? "AI诊断中..." : "🚀 生成创业诊断报告"}
            </button>
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-300 text-center">完成问卷后，AI会根据你的回答生成一份完整的自媒体创业诊断报告</p>
    </div>
  )
}
