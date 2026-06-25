"use client"
import { useState, useCallback } from "react"
import { QAReviewPanel } from "@/components/QAReview"

export default function ScriptReviewPage() {
  const [script, setScript] = useState("")
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [qaResult, setQaResult] = useState<any>(null)
  const [step, setStep] = useState<"input" | "review" | "done">("input")

  const runQA = useCallback(async (text: string) => {
    const lines = text.split(/[。！？\n]+/).filter(s => s.trim().length > 5)
    const hasCausal = /因为|所以|导致|因此|原来|结果|于是/.test(text)
    const hasSeq = /首先|然后|接着|最后|第一|第二|突然/.test(text)
    const hasEmo = /惊喜|震惊|愤怒|感动|悲伤|害怕|紧张|开心/.test(text)
    const hasTrans = /这时|此刻|另一边|与此同时|转眼/.test(text)
    const gaps: string[] = []
    if (!hasSeq) gaps.push("缺少时间顺序")
    if (!hasTrans) gaps.push("场景切换无过渡")

    const score = (hasCausal ? 15 : 0) + (hasSeq ? 15 : 0) + (hasEmo ? 20 : 0) + (hasTrans ? 15 : 0) + Math.min(25, lines.length * 4)
    setQaResult({
      overallScore: Math.min(score, 95),
      grade: score >= 65 ? "good" : "average",
      narrative: { causalClarity: hasCausal ? 0.6 : 0.2, logicalFlow: hasSeq ? 0.6 : 0.3, gaps },
      emotion: { isMonotone: !hasEmo, peakPosition: 0.5, suggestions: hasEmo ? [] : ["加入情绪词增强感染力"] },
      cognitiveLoad: { overloadPoints: text.length > 500 ? ["整体偏长"] : [], boringZones: lines.length < 3 ? ["内容太短"] : [], optimalDuration: Math.min(180, lines.length * 8) },
    })
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!input.trim()) return
    setLoading(true)
    try {
      const res = await fetch("/api/agent/agent_04", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: input.trim(), parameters: { duration: "60" } }),
      })
      const data = await res.json()
      if (data.success) {
        setScript(data.mainOutput)
        setStep("review")
        await runQA(data.mainOutput)
      }
    } catch {}
    setLoading(false)
  }, [input, runQA])

  const handleDirectQA = useCallback(() => {
    if (!script.trim()) return
    setStep("review")
    runQA(script)
  }, [script, runQA])

  const handleEdit = useCallback((newScript: string) => {
    setScript(newScript)
    runQA(newScript)
  }, [runQA])

  const handleAutoFix = useCallback(async () => {
    if (!script) return
    setLoading(true)
    try {
      const res = await fetch("/api/agent/agent_04", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction: "优化以下脚本，让它情节更吸引人、转场更流畅、高潮更突出：\n\n" + script, parameters: { duration: "60" } }),
      })
      const data = await res.json()
      if (data.success && data.mainOutput.length > 50) {
        setScript(data.mainOutput)
        await runQA(data.mainOutput)
      }
    } catch {}
    setLoading(false)
  }, [script, runQA])

  const handleConfirm = useCallback(() => setStep("done"), [])

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <span className="text-3xl">📝</span>
        <div><h1 className="text-xl font-bold text-gray-800">脚本质检中心</h1><p className="text-sm text-gray-400">先写脚本 · AI质检评分 · 过关再出视频</p></div>
      </div>

      {step === "input" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
          <label className="text-xs font-medium text-gray-500">输入一句话，AI生成分镜脚本</label>
          <textarea value={input} onChange={e => setInput(e.target.value)}
            placeholder="例如：一个年轻人发现自己的猫会说话，从此开始了奇幻冒险"
            rows={3} className="w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="flex gap-2">
            <textarea value={script} onChange={e => setScript(e.target.value)}
              placeholder="或者直接粘贴脚本到这里，点直接质检"
              rows={4} className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleGenerate} disabled={loading || !input.trim()}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:bg-gray-300">
              {loading ? "生成中..." : "AI生成分镜脚本"}
            </button>
            <button onClick={handleDirectQA} disabled={!script.trim()}
              className="px-4 py-2.5 bg-white text-gray-700 rounded-xl text-sm border border-gray-200 hover:border-indigo-300 disabled:opacity-50">
              直接质检
            </button>
          </div>
        </div>
      )}

      {step === "review" && qaResult && (
        <div className="space-y-4">
          <details open={qaResult.overallScore < 65} className="bg-white rounded-2xl border border-gray-200">
            <summary className="px-4 py-3 text-xs font-medium text-gray-600 cursor-pointer hover:text-gray-800">
              当前脚本（{script.length}字）
            </summary>
            <div className="px-4 pb-3">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">{script}</pre>
            </div>
          </details>
          <QAReviewPanel script={script} qaResult={qaResult} onEdit={handleEdit} onAutoFix={handleAutoFix} onConfirm={handleConfirm} />
        </div>
      )}

      {step === "done" && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
          <div className="text-4xl">{"🎉"}</div>
          <h2 className="text-lg font-bold text-green-800">脚本已通过质检！</h2>
          <p className="text-sm text-green-600">现在进入视频制作阶段</p>
          <div className="flex gap-2 justify-center pt-2">
            <a href="/jiying/manga" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700">去漫剧引擎制作</a>
            <a href="/jiying/studio" className="px-4 py-2 bg-white text-gray-700 rounded-xl text-sm border border-gray-200 hover:border-indigo-300">去图片工作室</a>
          </div>
        </div>
      )}
    </div>
  )
}
