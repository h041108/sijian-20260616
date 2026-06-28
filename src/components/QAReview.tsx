"use client"
import { useState, useCallback } from "react"

// ─── 用户友好的质检项 ─────────────────────────
export interface QAReason {
  dimension: string      // 维度名，如"情节"
  score: number          // 0-100
  status: "pass" | "warning" | "fail"
  reason: string         // 不合格的理由，如"情节太平淡，缺乏起承转合"
  suggestion: string     // 怎么改，如"建议加入对比/冲突/悬念元素"
}

export interface QAReport {
  overallScore: number
  grade: "excellent" | "good" | "average" | "weak"
  reasons: QAReason[]
  summary: string
  rawScript: string
  fixedScript?: string
}

// ─── 把质检结果翻译成用户友好的理由 ───────────
export function translateToQAReport(
  scriptText: string,
  analysis: {
    overallScore: number
    grade: string
    narrative: { causalClarity: number; logicalFlow: number; gaps: string[] }
    emotion: { isMonotone: boolean; peakPosition: number; suggestions: string[] }
    cognitiveLoad: { overloadPoints: string[]; boringZones: string[]; optimalDuration: number }
  },
  fixedScript?: string,
): QAReport {
  const reasons: QAReason[] = []

  // 1. 情节跌宕起伏度（来自情绪曲线）
  if (analysis.emotion.isMonotone) {
    reasons.push({
      dimension: "情节",
      score: 35,
      status: "fail",
      reason: "情节不够跌宕起伏，整体太平淡",
      suggestion: "建议加入对比、冲突或悬念元素，让故事有起承转合。比如在中间加入一个意料之外的转折",
    })
  } else if (analysis.emotion.suggestions.length > 0) {
    reasons.push({
      dimension: "情节",
      score: 60,
      status: "warning",
      reason: "情节有一定起伏但不够强烈",
      suggestion: analysis.emotion.suggestions[0],
    })
  } else {
    reasons.push({
      dimension: "情节",
      score: 85,
      status: "pass",
      reason: "情节结构合理，有起有伏",
      suggestion: "继续保持当前叙事节奏",
    })
  }

  // 2. 转场吸引力（来自逻辑跳跃）
  if (analysis.narrative.gaps.length > 2) {
    reasons.push({
      dimension: "转场",
      score: 30,
      status: "fail",
      reason: "段落之间跳跃太大，转场没有吸引力",
      suggestion: `在「${analysis.narrative.gaps.slice(0, 2).join("」「")}」等位置增加过渡句，让场景切换更自然`,
    })
  } else if (analysis.narrative.gaps.length > 0) {
    reasons.push({
      dimension: "转场",
      score: 55,
      status: "warning",
      reason: "部分转场不够流畅",
      suggestion: `在${analysis.narrative.gaps.length}处逻辑跳跃位置添加衔接语句`,
    })
  } else {
    reasons.push({
      dimension: "转场",
      score: 82,
      status: "pass",
      reason: "转场自然流畅",
      suggestion: "继续保持",
    })
  }

  // 3. 高潮吸睛度（来自peakPosition）
  const peak = analysis.emotion.peakPosition
  if (peak < 0.2) {
    reasons.push({
      dimension: "高潮",
      score: 25,
      status: "fail",
      reason: "高潮来得太早，后续乏力",
      suggestion: "建议把最精彩的内容放在故事60%-80%的位置，前段做铺垫、中段蓄势、后段爆发",
    })
  } else if (peak > 0.85) {
    reasons.push({
      dimension: "高潮",
      score: 40,
      status: "fail",
      reason: "高潮来得太晚，观众可能已经失去耐心",
      suggestion: "建议把高潮提前到70%左右位置，给结尾留出收束空间",
    })
  } else if (peak < 0.4) {
    reasons.push({
      dimension: "高潮",
      score: 55,
      status: "warning",
      reason: "高潮位置偏早，需要更多铺垫",
      suggestion: "可以考虑在中段增加一个小的情绪波折来延缓高潮",
    })
  } else {
    reasons.push({
      dimension: "高潮",
      score: 80,
      status: "pass",
      reason: "高潮位置恰当",
      suggestion: "继续保持",
    })
  }

  // 4. 逻辑清晰度（来自causalClarity）
  const causalScore = Math.round(analysis.narrative.causalClarity * 100)
  if (causalScore < 40) {
    reasons.push({
      dimension: "逻辑",
      score: causalScore,
      status: "fail",
      reason: "因果关系不清晰，观众看不懂为什么",
      suggestion: "建议增加「因为」「所以」「导致」「原来」等因果词，把前因后果说清楚",
    })
  } else if (causalScore < 65) {
    reasons.push({
      dimension: "逻辑",
      score: causalScore,
      status: "warning",
      reason: "部分因果关系不够明确",
      suggestion: "检查是否有跳过的推理步骤，补充中间逻辑链",
    })
  } else {
    reasons.push({
      dimension: "逻辑",
      score: causalScore,
      status: "pass",
      reason: "逻辑清晰易懂",
      suggestion: "继续保持",
    })
  }

  // 5. 信息密度（来自cognitiveLoad）
  const overloadCount = analysis.cognitiveLoad.overloadPoints.length
  const boringCount = analysis.cognitiveLoad.boringZones.length
  if (overloadCount > 2) {
    reasons.push({
      dimension: "信息密度",
      score: 30,
      status: "fail",
      reason: overloadCount + "处信息过密，观众消化不了",
      suggestion: "把长句拆短，复杂概念用比喻解释，一段只说一个事",
    })
  } else if (boringCount > 2) {
    reasons.push({
      dimension: "信息密度",
      score: 40,
      status: "fail",
      reason: boringCount + "处信息太稀松，观众可能走神",
      suggestion: "在这些位置增加具体细节、案例或互动提问来拉回注意力",
    })
  } else if (overloadCount > 0 || boringCount > 0) {
    reasons.push({
      dimension: "信息密度",
      score: 60,
      status: "warning",
      reason: "信息节奏有优化空间",
      suggestion: overloadCount > 0 ? "简化学术语，多用短句" : "增加具体案例",
    })
  } else {
    reasons.push({
      dimension: "信息密度",
      score: 82,
      status: "pass",
      reason: "信息密度适中，节奏好",
      suggestion: "继续保持",
    })
  }

  // 6. 镜头语言丰富度（如果有分镜数据）
  const hasShots = /镜头\d/.test(scriptText)
  if (hasShots) {
    const shotCount = (scriptText.match(/镜头\d/g) || []).length
    if (shotCount < 4) {
      reasons.push({
        dimension: "镜头",
        score: 35,
        status: "fail",
        reason: "只有" + shotCount + "个镜头，画面太单调",
        suggestion: "建议增加到6个以上镜头，加入特写、远景、俯拍等不同景别",
      })
    } else {
      reasons.push({
        dimension: "镜头",
        score: 78,
        status: "pass",
        reason: shotCount + "个镜头，画面丰富度不错",
        suggestion: "可以尝试加入更多运镜变化（推拉摇移跟）",
      })
    }
  }

  // 计算总分（从各维度平均，但保留原始分作为参考）
  const avgScore = Math.round(reasons.reduce((s, r) => s + r.score, 0) / reasons.length)
  const finalScore = Math.max(analysis.overallScore, avgScore - 5) // 保守取分
  let grade: "excellent" | "good" | "average" | "weak" = "weak"
  if (finalScore >= 80) grade = "excellent"
  else if (finalScore >= 60) grade = "good"
  else if (finalScore >= 40) grade = "average"

  // 摘要
  const failItems = reasons.filter(r => r.status === "fail")
  const warnItems = reasons.filter(r => r.status === "warning")
  let summary = ""
  if (failItems.length === 0 && warnItems.length === 0) {
    summary = "🎉 脚本质量优秀！所有维度均达标，可以直接进入视频制作。"
  } else if (failItems.length === 0) {
    summary = "⚠️ 脚本基本合格，" + warnItems.length + "个维度有优化空间，建议微调后进入制作。"
  } else {
    summary = "❌ 脚本需要修改！" + failItems.length + "个维度不合格：" + failItems.map(r => r.dimension).join("、") + "。请修改后重新质检。"
  }

  return {
    overallScore: finalScore,
    grade,
    reasons,
    summary,
    rawScript: scriptText,
    fixedScript,
  }
}

// ─── 质检评分UI组件 ─────────────────────────────
interface QAReviewPanelProps {
  script: string
  qaResult: any
  onEdit: (newScript: string) => void
  onAutoFix: () => Promise<void>
  onConfirm: () => void
}

export function QAReviewPanel({ script, qaResult, onEdit, onAutoFix, onConfirm }: QAReviewPanelProps) {
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(script)
  const [fixing, setFixing] = useState(false)

  const report = translateToQAReport(script, qaResult)
  const isPassed = report.overallScore >= 65

  const handleAutoFix = useCallback(async () => {
    setFixing(true)
    await onAutoFix()
    setFixing(false)
  }, [onAutoFix])

  return (
    <div className="space-y-4">
      {/* 总分 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-extrabold text-white ${
            report.grade === "excellent" ? "bg-green-500" :
            report.grade === "good" ? "bg-blue-500" :
            report.grade === "average" ? "bg-amber-500" : "bg-red-500"
          }`}>
            {report.overallScore}
          </div>
          <div>
            <div className="text-sm font-bold text-gray-800">
              {report.grade === "excellent" ? "🎉 优秀" :
               report.grade === "good" ? "✅ 良好" :
               report.grade === "average" ? "⚠️ 一般" : "❌ 不合格"}
            </div>
            <div className="text-xs text-gray-400">{report.reasons.filter(r => r.status === "fail").length}项不合格 · {report.reasons.filter(r => r.status === "warning").length}项待优化</div>
          </div>
        </div>
        <div className="text-xs text-gray-400">合格线 65分</div>
      </div>

      {/* 评语 */}
      <div className={`rounded-xl px-3 py-2 text-xs ${
        report.overallScore >= 65 ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"
      }`}>
        {report.summary}
      </div>

      {/* 各维度详情 */}
      <div className="space-y-2">
        {report.reasons.filter(r => r.status !== "pass").map((r, i) => (
          <div key={i} className={`rounded-xl border p-3 ${
            r.status === "fail" ? "border-red-200 bg-red-50/50" : "border-amber-200 bg-amber-50/50"
          }`}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-700">{r.dimension}</span>
              <span className={`text-xs font-bold ${
                r.status === "fail" ? "text-red-600" : "text-amber-600"
              }`}>{r.score}分</span>
            </div>
            <p className="text-xs text-gray-600 mb-1">{r.reason}</p>
            <p className="text-[10px] text-indigo-600">💡 {r.suggestion}</p>
          </div>
        ))}
      </div>

      {/* 合格的维度（折叠） */}
      {report.reasons.filter(r => r.status === "pass").length > 0 && (
        <details className="bg-gray-50 rounded-xl border border-gray-200">
          <summary className="px-3 py-2 text-[10px] text-gray-500 cursor-pointer hover:text-gray-700">✅ 合格的维度 {report.reasons.filter(r => r.status === "pass").length}项</summary>
          <div className="px-3 pb-3 space-y-1">
            {report.reasons.filter(r => r.status === "pass").map((r, i) => (
              <div key={i} className="flex justify-between text-[10px] text-gray-500">
                <span>{r.dimension}：{r.reason}</span>
                <span className="text-green-600">{r.score}分</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* 编辑区 */}
      {editing ? (
        <div className="space-y-2">
          <textarea value={editText} onChange={e => setEditText(e.target.value)}
            rows={8}
            className="w-full resize-none rounded-xl border border-indigo-200 bg-indigo-50/30 px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <div className="flex gap-2 justify-end">
            <button onClick={() => { setEditing(false); setEditText(script) }}
              className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500">取消</button>
            <button onClick={() => { onEdit(editText); setEditing(false) }}
              className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white hover:bg-indigo-700">保存修改</button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button onClick={() => setEditing(true)}
            className="flex-1 py-2 bg-white text-gray-700 rounded-xl text-xs border border-gray-200 hover:border-indigo-300">✏️ 手动修改脚本</button>
          {!isPassed && (
            <button onClick={handleAutoFix} disabled={fixing}
              className="flex-1 py-2 bg-amber-600 text-white rounded-xl text-xs font-medium hover:bg-amber-700 disabled:bg-amber-300">
              {fixing ? "AI修复中..." : "🤖 AI自动修复"}
            </button>
          )}
        </div>
      )}

      {/* 确认进入制作 */}
      {isPassed && (
        <button onClick={onConfirm}
          className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
          ✅ 质检通过 · 进入视频制作
        </button>
      )}
    </div>
  )
}
