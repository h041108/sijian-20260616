"use client"
import { useState, useCallback } from "react"

const PLATFORMS = [
  { id: "douyin", name: "抖音", icon: "🎵", desc: "短视频，强算法推荐" },
  { id: "xiaohongshu", name: "小红书", icon: "📕", desc: "图文+视频，女性用户多" },
  { id: "shipinhao", name: "视频号", icon: "💬", desc: "微信生态，中年用户多" },
  { id: "bilibili", name: "B站", icon: "📺", desc: "中长视频，年轻人社区" },
]

const NICHES = [
  { id: "meishi", name: "美食", icon: "🍳" },
  { id: "meizhuang", name: "美妆", icon: "💄" },
  { id: "chuanda", name: "穿搭", icon: "👗" },
  { id: "shuma", name: "数码", icon: "📱" },
  { id: "jiankang", name: "健康", icon: "🏃" },
  { id: "lvyou", name: "旅行", icon: "✈️" },
  { id: "qinzi", name: "母婴", icon: "👶" },
  { id: "jiating", name: "家居", icon: "🏠" },
]

const PLATFORM_NAMES: Record<string, string> = {
  douyin: "抖音", xiaohongshu: "小红书", shipinhao: "视频号", bilibili: "B站",
  meishi: "美食", meizhuang: "美妆", chuanda: "穿搭", shuma: "数码",
  jiankang: "健康", lvyou: "旅行", qinzi: "母婴", jiating: "家居",
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState({ platforms: [] as string[], niches: [] as string[] })
  const [status, setStatus] = useState<"form" | "diagnosing" | "ready" | "generating" | "done" | "error">("form")
  const [report, setReport] = useState<any>(null)
  const [dailyContent, setDailyContent] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState("")
  const [userId] = useState(() => "user_" + Date.now())

  const [itemStatuses, setItemStatuses] = useState<Record<number, string>>({})

  const toggleArray = (key: "platforms" | "niches", value: string) => {
    setAnswers(prev => ({
      ...prev,
      [key]: prev[key].includes(value)
        ? prev[key].filter(v => v !== value)
        : [...prev[key], value],
    }))
  }

  const handleDiagnose = useCallback(async () => {
    setStatus("diagnosing")
    setErrorMsg("")
    const platform = PLATFORM_NAMES[answers.platforms[0]] || "小红书"
    const niche = PLATFORM_NAMES[answers.niches[0]] || "美食"
    try {
      const res = await fetch("/api/agent/agent_01", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instruction: `我准备在${platform}做${niche}方向的自媒体，请给我一份创业诊断报告`,
          context: { userProfile: { platform, niche } },
        }),
      })
      const data = await res.json()
      if (!data.success) {
        setErrorMsg(data.error || "诊断失败")
        setStatus("error")
        return
      }
      setReport(data.structuredOutput || data.mainOutput || { raw: "诊断完成" })
      setStatus("ready")
    } catch (e: any) {
      setErrorMsg(e.message || "网络错误")
      setStatus("error")
    }
  }, [answers])

  const handleGenerateDailyContent = useCallback(async () => {
    setStatus("generating")
    setErrorMsg("")
    const platform = PLATFORM_NAMES[answers.platforms[0]] || "小红书"
    const niche = PLATFORM_NAMES[answers.niches[0]] || "美食"
    try {
      const res = await fetch("/api/daily-content", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, platform, niche }),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || "HTTP " + res.status)
      }
      const data = await res.json()
      if (!data.items || data.items.length === 0) {
        throw new Error("生成的内容为空")
      }
      setDailyContent(data)
      setStatus("done")
    } catch (e: any) {
      setErrorMsg(e.message || "生成失败，请重试")
      setStatus("error")
    }
  }, [answers, userId])

  if (status === "error") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center space-y-4">
        <div className="text-3xl">😅</div>
        <h2 className="text-base font-bold text-gray-800">出错了</h2>
        <p className="text-sm text-gray-500">{errorMsg || "未知错误，请重试"}</p>
        <button onClick={() => setStatus("form")}
          className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm hover:bg-gray-800">重新开始</button>
      </div>
    )
  }

  if (status === "diagnosing") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">AI正在分析你的赛道...</p>
      </div>
    )
  }

  if (status === "ready" && report) {
    const r = report
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-4xl">🎉</span>
          <h1 className="text-xl font-bold text-gray-900">诊断完成！你的创业方案</h1>
        </div>
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-2xl p-5">
          <div className="text-xs font-semibold text-indigo-600 mb-1">推荐方向</div>
          <div className="text-sm font-bold text-gray-800 whitespace-pre-wrap">{r.insight || r.recommendedPlatform || r.raw || "已生成方案"}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-semibold text-gray-500 mb-1">IP方向</div>
          <div className="text-xs text-gray-700 whitespace-pre-wrap">{(r.ipDirections?.map((d: any) => d.name).join("、")) || r.personaAdvice || "已生成"}</div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <div className="text-xs font-semibold text-gray-500 mb-1">变现路径</div>
          <div className="text-xs text-gray-700 whitespace-pre-wrap">{r.monetization?.shortTerm || r.monetizationPath || "已生成"}</div>
        </div>
        <button onClick={handleGenerateDailyContent}
          className="w-full py-3 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all">
          🚀 立即生成今日内容
        </button>
      </div>
    )
  }

  if (status === "generating") {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500">正在生成今日内容（AI选题→分镜→出图）...</p>
      </div>
    )
  }

  if (status === "done" && dailyContent) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <div className="text-center space-y-2">
          <span className="text-4xl">✅</span>
          <h1 className="text-xl font-bold text-gray-900">今日内容已就绪！</h1>
          <p className="text-sm text-gray-400">{dailyContent.date} · {dailyContent.platform} · {dailyContent.niche}</p>
        </div>
        {dailyContent.items?.map((item: any, i: number) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-600">{item.type === "text" ? "📝 文案" : "🖼️ 配图"}</span>
              <span className={"text-[10px] px-2 py-0.5 rounded-full " + (itemStatuses[i] === "confirmed" ? "bg-green-100 text-green-700" : itemStatuses[i] === "skipped" ? "bg-gray-100 text-gray-500" : "bg-amber-100 text-amber-700")}>{itemStatuses[i] === "confirmed" ? "已确认" : itemStatuses[i] === "skipped" ? "已跳过" : itemStatuses[i] === "edited" ? "已修改" : "待审核"}</span>
            </div>
            <div className="text-sm font-medium text-gray-800">{item.title}</div>
            <p className="text-xs text-gray-600 line-clamp-3">{item.content}</p>
            {item.imageUrls?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.imageUrls.map((url: string, j: number) => (
                  <div key={j} className="w-20 h-28 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-200">
                    {url ? <img src={url} alt="" className="w-full h-full object-cover" /> : <span className="text-[8px] text-gray-300">图片</span>}
                  </div>
                ))}
              </div>
            )}
            {item.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.hashtags.map((tag: string, j: number) => (
                  <span key={j} className="text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button onClick={() => setItemStatuses(s => ({...s, [i]: "confirmed"}))}
                className="flex-1 py-1.5 bg-indigo-600 text-white rounded-lg text-xs hover:bg-indigo-700">✅ 确认发布</button>
              <button onClick={() => setItemStatuses(s => ({...s, [i]: "edited"}))}
                className="px-3 py-1.5 bg-white text-gray-600 rounded-lg text-xs border border-gray-200 hover:border-indigo-300">✏️ 修改</button>
              <button onClick={() => setItemStatuses(s => ({...s, [i]: "skipped"}))}
                className="px-3 py-1.5 bg-white text-gray-400 rounded-lg text-xs border border-gray-200 hover:border-red-300">🗑️ 跳过</button>
            </div>
          </div>
        ))}
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-xs text-green-700 text-center">
          🎯 明天早上8:00会推送新的内容到审核页面
        </div>
        <div className="flex gap-2 justify-center">
          <button onClick={handleGenerateDailyContent}
            className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl text-xs hover:bg-indigo-200">
            🔄 重新生成
          </button>
          <a href="/jiying/review"
            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-xs hover:bg-gray-800">
            📋 去审核页面
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="text-center space-y-2">
        <span className="text-4xl">🎬</span>
        <h1 className="text-2xl font-extrabold text-gray-900">20元开启你的自媒体公司</h1>
        <p className="text-sm text-gray-400">选平台 → 选赛道 → AI诊断 → 每日自动生成内容</p>
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold">你在哪个平台做？</h2>
          <div className="grid grid-cols-2 gap-2">
            {PLATFORMS.map(p => (
              <button key={p.id} onClick={() => toggleArray("platforms", p.id)}
                className={`text-left p-3 rounded-xl border transition-all ${answers.platforms.includes(p.id) ? "bg-indigo-50 border-indigo-300" : "bg-white border-gray-200"}`}>
                <span className="text-lg mr-2">{p.icon}</span>
                <span className="text-sm font-medium text-gray-800">{p.name}</span>
                <span className="text-[10px] text-gray-400 ml-1">{p.desc}</span>
                {answers.platforms.includes(p.id) && <span className="float-right text-indigo-500">✓</span>}
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} disabled={answers.platforms.length === 0}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400">下一步</button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-3">
          <h2 className="text-base font-bold">你擅长什么领域？</h2>
          <div className="grid grid-cols-2 gap-2">
            {NICHES.map(n => (
              <button key={n.id} onClick={() => toggleArray("niches", n.id)}
                className={`text-left p-3 rounded-xl border transition-all ${answers.niches.includes(n.id) ? "bg-indigo-50 border-indigo-300" : "bg-white border-gray-200"}`}>
                <span className="text-lg mr-2">{n.icon}</span>
                <span className="text-sm font-medium text-gray-800">{n.name}</span>
                {answers.niches.includes(n.id) && <span className="float-right text-indigo-500">✓</span>}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(0)} className="px-4 py-2.5 bg-white text-gray-600 rounded-xl text-sm border border-gray-200">上一步</button>
            <button onClick={handleDiagnose} disabled={answers.niches.length === 0}
              className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold hover:from-amber-600 hover:to-orange-600 disabled:bg-gray-200 disabled:text-gray-400 shadow-lg shadow-orange-500/20">
              🚀 AI诊断 → 生成每日内容
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
