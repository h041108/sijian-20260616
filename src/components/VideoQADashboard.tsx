"use client"

import { useState, useCallback, useEffect } from "react"
import {
  analyzeScript, ScriptCognitionReport,
  scoreShots, ShotIQ,
  extractBrandFingerprint, BrandThinkingFingerprint,
  analyzeBrandConsistency, ConsistencyReport,
  matchAudience, AudienceCognitionMatch,
} from "@/lib/video-cognition-qa"

export default function VideoQADashboard() {
  const [tab, setTab] = useState<"script" | "shots" | "consistency" | "audience">("script")

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-3 flex gap-1.5 flex-wrap">
        {[
          { id: "script" as const, icon: "📝", label: "脚本思维诊断" },
          { id: "shots" as const, icon: "🎬", label: "分镜智商评分" },
          { id: "consistency" as const, icon: "🎯", label: "品牌一致性" },
          { id: "audience" as const, icon: "👥", label: "受众认知匹配" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${tab === t.id ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === "script" && <ScriptDiagnosticPanel />}
      {tab === "shots" && <ShotIQPanel />}
      {tab === "consistency" && <ConsistencyPanel />}
      {tab === "audience" && <AudiencePanel />}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 1. 脚本思维诊断
// ═══════════════════════════════════════════════════

function ScriptDiagnosticPanel() {
  const [script, setScript] = useState("")
  const [report, setReport] = useState<ScriptCognitionReport | null>(null)

  const handleAnalyze = () => {
    if (!script.trim()) return
    setReport(analyzeScript(script.trim()))
  }

  const gradeColors: Record<string, string> = {
    excellent: "text-green-700 bg-green-50 border-green-200",
    good: "text-blue-700 bg-blue-50 border-blue-200",
    average: "text-yellow-700 bg-yellow-50 border-yellow-200",
    weak: "text-red-700 bg-red-50 border-red-200",
  }
  const gradeLabels: Record<string, string> = {
    excellent: "优秀", good: "良好", average: "一般", weak: "待改进",
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📝 脚本思维诊断</h3>
        <p className="text-xs text-gray-400 mb-3">粘贴脚本/字幕文本，认知引擎分析叙事逻辑、情绪曲线、认知负荷分布</p>
        <textarea value={script} onChange={e => setScript(e.target.value)}
          placeholder="粘贴短视频脚本或字幕文本……（至少50字）"
          rows={6}
          className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-4 text-sm resize-none mb-3" />
        <button onClick={handleAnalyze} disabled={!script.trim()}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40">
          🔍 分析脚本
        </button>
      </div>

      {report && (
        <div className="space-y-4">
          {/* 总分卡片 */}
          <div className={`rounded-2xl border-2 p-6 text-center ${gradeColors[report.grade]}`}>
            <div className="text-4xl font-extrabold mb-1">{report.overallScore}</div>
            <div className="text-sm font-semibold">{gradeLabels[report.grade]}</div>
            <div className="text-xs mt-2 max-w-md mx-auto">{report.aiAdvice}</div>
          </div>

          {/* 五维分析 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5">
              <h4 className="text-xs font-semibold text-gray-600 mb-3">📊 叙事逻辑</h4>
              <div className="space-y-2">
                {[
                  { label: "因果清晰度", value: report.narrative.causalClarity },
                  { label: "逻辑流畅度", value: report.narrative.logicalFlow },
                ].map(d => (
                  <div key={d.label} className="flex items-center gap-2 text-xs">
                    <span className="text-gray-500 w-20">{d.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100">
                      <div className={`h-full rounded-full ${d.value >= 0.7 ? "bg-green-500" : d.value >= 0.4 ? "bg-yellow-500" : "bg-red-500"}`}
                        style={{ width: `${d.value * 100}%` }} />
                    </div>
                    <span className="text-gray-400">{Math.round(d.value * 100)}%</span>
                  </div>
                ))}
              </div>
              {report.narrative.gaps.length > 0 && (
                <div className="mt-3 p-2 bg-red-50 rounded-lg text-[11px] text-red-700">
                  ⚠️ {report.narrative.gaps.length} 处逻辑跳跃
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5">
              <h4 className="text-xs font-semibold text-gray-600 mb-3">💭 情绪曲线</h4>
              {report.emotion.isMonotone ? (
                <div className="p-3 bg-yellow-50 rounded-lg text-xs text-yellow-700">
                  ⚠️ 情绪曲线过于平缓，建议增加冲突或反转
                </div>
              ) : (
                <div className="flex items-end gap-1 h-16">
                  {report.emotion.curve.map((c, i) => (
                    <div key={i} className="flex-1 rounded-t transition-all"
                      style={{ height: `${c.intensity * 100}%`, backgroundColor: `hsl(${260 + c.intensity * 40}, 70%, ${50 + c.intensity * 20}%)`, opacity: 0.6 + c.intensity * 0.4 }} />
                  ))}
                </div>
              )}
              <div className="mt-2 text-[10px] text-gray-400">
                情绪高潮在 {Math.round(report.emotion.peakPosition * 100)}% 位置
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5">
              <h4 className="text-xs font-semibold text-gray-600 mb-3">🧠 认知负荷</h4>
              <div className="space-y-1.5 mb-3">
                {report.cognitiveLoad.segments.slice(0, 4).map((seg, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${seg.load > 0.7 ? "bg-red-400" : seg.load > 0.4 ? "bg-yellow-400" : "bg-green-400"}`} />
                    <span className="text-[10px] text-gray-400 truncate flex-1">{seg.start}...</span>
                    <span className="text-[10px] text-gray-500">{seg.label}</span>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-gray-400">
                建议时长：{report.cognitiveLoad.optimalDuration} 秒
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5">
              <h4 className="text-xs font-semibold text-gray-600 mb-3">🎯 思维框架</h4>
              <div className="space-y-2">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <div className="text-[10px] text-indigo-500">最佳匹配</div>
                  <div className="text-sm font-bold text-indigo-700">{report.thinkingFramework.bestMatch}</div>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <div className="text-[10px] text-purple-500">替代方案</div>
                  <div className="text-sm font-bold text-purple-700">{report.thinkingFramework.alternative}</div>
                </div>
                <div className="flex flex-wrap gap-1">
                  {report.thinkingFramework.detected.map(f => (
                    <span key={f} className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 2. 分镜智商评分
// ═══════════════════════════════════════════════════

function ShotIQPanel() {
  const [shots, setShots] = useState<{ label: string; description: string; duration: number; dialogue: string }[]>([])
  const [results, setResults] = useState<ShotIQ[]>([])
  const [label, setLabel] = useState(""); const [desc, setDesc] = useState("")
  const [duration, setDuration] = useState(5); const [dialogue, setDialogue] = useState("")

  const addShot = () => {
    if (!label.trim() || !desc.trim()) return
    setShots(prev => [...prev, { label: label.trim(), description: desc.trim(), duration, dialogue: dialogue.trim() }])
    setLabel(""); setDesc(""); setDialogue("")
  }

  const handleScore = () => {
    if (shots.length === 0) return
    setResults(scoreShots(shots))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🎬 分镜智商评分</h3>
        <p className="text-xs text-gray-400 mb-3">添加每个镜头的描述和参数，认知引擎给每个镜头打分</p>

        <div className="flex gap-2 mb-3 flex-wrap">
          <input value={label} onChange={e => setLabel(e.target.value)} placeholder="镜头名" className="w-24 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="画面描述" className="flex-1 min-w-[160px] rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm" />
          <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} placeholder="秒" className="w-16 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-2 py-2 text-sm text-center" />
          <input value={dialogue} onChange={e => setDialogue(e.target.value)} placeholder="对白(选填)" className="w-32 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm" />
          <button onClick={addShot} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 text-sm">+ 添加</button>
        </div>

        {shots.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {shots.map((s, i) => (
              <span key={i} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                {s.label} · {s.duration}s
                <button onClick={() => setShots(prev => prev.filter((_, j) => j !== i))} className="ml-1 text-red-400 hover:text-red-600">✕</button>
              </span>
            ))}
          </div>
        )}

        <button onClick={handleScore} disabled={shots.length === 0}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40">
          🧠 分镜评分
        </button>
      </div>

      {results.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">📊 评分结果</h3>
          <div className="space-y-3">
            {results.map(r => (
              <div key={r.shotIndex} className={`p-4 rounded-xl border-2 ${
                r.heatLevel === "hot" ? "border-red-200 bg-red-50/30" :
                r.heatLevel === "warm" ? "border-yellow-200 bg-yellow-50/30" :
                "border-green-200 bg-green-50/30"
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">镜头{r.shotIndex + 1}: {r.label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.scores.overall >= 80 ? "bg-green-100 text-green-700" :
                      r.scores.overall >= 60 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    }`}>{r.scores.overall}分</span>
                  </div>
                  <span className="text-[10px] text-gray-400">{r.duration}s</span>
                </div>
                <p className="text-xs text-gray-500 mb-2">{r.description}</p>
                <div className="flex items-center gap-3 text-[10px] text-gray-400 mb-2">
                  <span>信息密度 {Math.round(r.scores.informationDensity * 100)}%</span>
                  <span>叙事清晰度 {Math.round(r.scores.narrativeClarity * 100)}%</span>
                  <span>情感力 {Math.round(r.scores.emotionalImpact * 100)}%</span>
                  <span>视觉引导 {Math.round(r.scores.visualGuidance * 100)}%</span>
                </div>
                {r.issues.length > 0 && (
                  <div className="text-[10px] text-red-500">
                    问题：{r.issues.join(" · ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 3. 品牌一致性
// ═══════════════════════════════════════════════════

function ConsistencyPanel() {
  const [brandScripts, setBrandScripts] = useState("")
  const [testScript, setTestScript] = useState("")
  const [fingerprint, setFingerprint] = useState<BrandThinkingFingerprint | null>(null)
  const [report, setReport] = useState<ConsistencyReport | null>(null)

  const handleExtractFingerprint = () => {
    if (!brandScripts.trim()) return
    const scripts = brandScripts.split("\n\n").filter(s => s.trim().length > 10)
    setFingerprint(extractBrandFingerprint("我的品牌", scripts))
  }

  const handleTest = () => {
    if (!fingerprint || !testScript.trim()) return
    setReport(analyzeBrandConsistency(fingerprint, testScript, [
      { label: "开篇", description: testScript.slice(0, 50), duration: 6 },
      { label: "中段", description: testScript.slice(50, 100) || testScript.slice(-30), duration: 8 },
      { label: "收尾", description: testScript.slice(-50), duration: 5 },
    ]))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🎯 品牌思维一致性检测</h3>
        <p className="text-xs text-gray-400 mb-3">第一步：粘贴品牌历史爆款脚本（多条用空行分隔）→ 提取品牌思维指纹</p>
        <textarea value={brandScripts} onChange={e => setBrandScripts(e.target.value)}
          placeholder="粘贴品牌历史爆款视频的脚本（多条用空行分隔）"
          rows={4}
          className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-3 text-sm resize-none mb-2" />
        <button onClick={handleExtractFingerprint} disabled={!brandScripts.trim()}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40 mb-4">
          🔍 提取品牌指纹
        </button>

        {fingerprint && (
          <div className="p-4 bg-indigo-50 rounded-xl mb-4 animate-fade-in">
            <div className="text-xs text-indigo-600 font-medium mb-2">🧬 品牌思维指纹</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-indigo-400">主导框架：</span>
                <span className="text-indigo-700 font-medium">{fingerprint.dominantFrameworks.slice(0, 3).map(f => f.name).join(" · ")}</span>
              </div>
              <div>
                <span className="text-indigo-400">情绪特征：</span>
                <span className="text-indigo-700 font-medium">{fingerprint.emotionalSignature.slice(0, 2).map(e => e.emotion).join(" · ")}</span>
              </div>
              <div>
                <span className="text-indigo-400">平均镜头：</span>
                <span className="text-indigo-700 font-medium">{fingerprint.pacingProfile.avgShotDuration.toFixed(1)}秒</span>
              </div>
            </div>
          </div>
        )}

        {fingerprint && (
          <>
            <p className="text-xs text-gray-400 mb-3">第二步：粘贴要检测的新视频脚本</p>
            <textarea value={testScript} onChange={e => setTestScript(e.target.value)}
              placeholder="粘贴要检测的脚本"
              rows={4}
              className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-3 text-sm resize-none mb-2" />
            <button onClick={handleTest} disabled={!testScript.trim()}
              className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40">
              🎯 检测一致性
            </button>
          </>
        )}
      </div>

      {report && (
        <div className="bg-white rounded-2xl border-2 border-indigo-200 p-6 animate-fade-in">
          <h3 className="text-sm font-bold text-gray-800 mb-2">一致性报告</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className={`text-3xl font-extrabold ${report.matchScore >= 80 ? "text-green-600" : report.matchScore >= 60 ? "text-yellow-600" : "text-red-600"}`}>
              {report.matchScore}
            </div>
            <div className="text-xs text-gray-400">/100 一致性评分</div>
          </div>
          {report.deviations.length > 0 ? (
            <div className="space-y-2 mb-3">
              {report.deviations.map((d, i) => (
                <div key={i} className={`p-2.5 rounded-lg text-xs ${
                  d.severity === "major" ? "bg-red-50 text-red-700 border border-red-100" :
                  d.severity === "moderate" ? "bg-yellow-50 text-yellow-700 border border-yellow-100" :
                  "bg-blue-50 text-blue-700 border border-blue-100"
                }`}>
                  <span className="font-medium">{d.category}</span>：{d.description}
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-green-600 mb-3">✅ 所有维度均与品牌一致</p>}
          {report.recommendations.length > 0 && (
            <div className="p-3 bg-indigo-50 rounded-xl text-xs text-indigo-700">
              {report.recommendations.map((r, i) => <p key={i} className="mb-1 last:mb-0">💡 {r}</p>)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 4. 受众认知匹配
// ═══════════════════════════════════════════════════

function AudiencePanel() {
  const [script, setScript] = useState("")
  const [duration, setDuration] = useState(60)
  const [result, setResult] = useState<AudienceCognitionMatch | null>(null)

  const handleMatch = () => {
    if (!script.trim()) return
    setResult(matchAudience(script.trim(), Array.from({ length: 5 }, () => ({ duration: duration / 5 }))))
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">👥 受众认知匹配</h3>
        <textarea value={script} onChange={e => setScript(e.target.value)}
          placeholder="粘贴视频脚本"
          rows={4}
          className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-3 text-sm resize-none mb-3" />
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs text-gray-400">视频时长(秒)：</span>
          <input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))}
            className="w-20 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm text-center" />
        </div>
        <button onClick={handleMatch} disabled={!script.trim()}
          className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-sm font-medium disabled:opacity-40">
          🔍 分析
        </button>
      </div>

      {result && (
        <div className="space-y-4 animate-fade-in">
          {/* 概述 */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-5">
            <p className="text-sm text-gray-700 leading-relaxed">{result.summary}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {result.cognitiveTags.map(t => (
                <span key={t} className="text-[10px] bg-white/80 text-indigo-600 px-2 py-0.5 rounded-full">{t}</span>
              ))}
            </div>
          </div>

          {/* 受众匹配 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h4 className="text-xs font-semibold text-gray-600 mb-3">🎯 最适合的受众（按匹配度降序）</h4>
            <div className="space-y-2">
              {result.suitableAudiences.map(a => (
                <div key={a.profile} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#e8e5df]">
                  <div className={`text-sm font-bold w-10 ${a.matchScore >= 80 ? "text-green-600" : a.matchScore >= 60 ? "text-yellow-600" : "text-gray-400"}`}>
                    {a.matchScore}%
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-semibold text-gray-700">{a.profile}</div>
                    <div className="text-[10px] text-gray-400">{a.reason}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 平台建议 */}
          <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
            <h4 className="text-xs font-semibold text-gray-600 mb-3">📱 最佳投放平台</h4>
            <div className="grid grid-cols-2 gap-3">
              {result.optimalPlatforms.map(p => (
                <div key={p.platform} className="p-3 rounded-xl border border-[#e8e5df]">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-gray-700">{p.platform}</span>
                    <span className={`text-xs font-bold ${p.fit >= 80 ? "text-green-600" : p.fit >= 60 ? "text-yellow-600" : "text-gray-400"}`}>{p.fit}%</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{p.reason}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 时长建议 */}
          <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-xs text-amber-700">
            💡 {result.durationAdvice}
          </div>
        </div>
      )}
    </div>
  )
}
