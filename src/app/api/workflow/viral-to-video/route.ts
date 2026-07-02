// ─── 端到端工作流：爆款文案 → 改写 → TTS → 数字人视频 ──────
// POST /api/workflow/viral-to-video
//
// 完整链路：
//   1. 爆款文案提取（Tavily搜索 + DeepSeek拆解）
//   2. 结合人设 + 赛道改写（agent_02人设注入）
//   3. 敏感词过滤规避（sensitive-filter）
//   4. 基于爆款话题生成新选题（agent_13选题分析）
//   5. TTS语音合成（/api/video/tts）
//   6. 数字人视频生成（/api/video/digital-human，照片+音频→唇同步视频）
//
// 支持两种模式：
//   - "full": 全链路自动执行
//   - "text-only": 只生成文案+音频（不生成视频）

import { NextRequest, NextResponse } from "next/server"
import { searchViralTrends, buildDeconstructPrompt } from "@/lib/viral-trends"
import { buildRewritePrompt, type ViralTemplate } from "@/lib/prompt-engine"
import { checkSensitive, buildDesensitizePrompt, checkPlatformCompliance } from "@/lib/sensitive-filter"

const DEEPSEEK_KEY = () => process.env.DEEPSEEK_API_KEY || ""
const DEEPSEEK_MODEL = () => process.env.DEEPSEEK_MODEL || "deepseek-chat"

// ── 工作流步骤状态 ──
type StepStatus = "pending" | "running" | "done" | "failed" | "skipped"

interface WorkflowStep {
  name: string
  status: StepStatus
  message: string
  result?: any
  duration?: number
}

interface WorkflowInput {
  niche: string
  platform: string
  persona?: string                // 用户人设描述（来自agent_02）
  personaTags?: string[]          // 人设标签
  tone?: string                   // 语气风格
  userSamples?: string[]          // 用户已有内容样本
  portraitImage?: string          // 数字人照片（base64或URL）
  mode?: "full" | "text-only" | "text-audio"  // 工作流模式
  customTopic?: string            // 自定义选题（跳过话题生成）
  uploadVideo?: boolean           // 是否上传本地视频作为数字人素材
}

// ── 调用 DeepSeek ──
async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  opts: { temperature?: number; maxTokens?: number; jsonMode?: boolean } = {},
): Promise<string> {
  const key = DEEPSEEK_KEY()
  if (!key) throw new Error("DEEPSEEK_API_KEY 未配置")

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL(),
      messages,
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.maxTokens ?? 2000,
      ...(opts.jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  })

  if (!res.ok) {
    const err = await res.text().catch(() => "")
    throw new Error(`DeepSeek API error: ${res.status} ${err.slice(0, 200)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

// ── 解析 JSON（容错） ──
function safeParseJSON(raw: string): any {
  try {
    // 去除 markdown 代码块标记
    const cleaned = raw.replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/gi, "").trim()
    return JSON.parse(cleaned)
  } catch {
    // 尝试提取第一个 JSON 对象
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch {}
    }
    return null
  }
}

// ═══════════════════════════════════════════════════
// POST — 端到端工作流
// ═══════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  const t0 = Date.now()
  const steps: WorkflowStep[] = []

  try {
    const body: WorkflowInput = await req.json()
    const {
      niche = "美妆",
      platform = "小红书",
      persona = "",
      personaTags = [],
      tone = "",
      userSamples = [],
      portraitImage,
      mode = "text-only",
      customTopic,
    } = body

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://jiying.cc.cd"
    const results: Record<string, any> = {}

    // ── Step 1: 爆款搜索 ──
    const step1: WorkflowStep = { name: "爆款搜索", status: "running", message: "" }
    steps.push(step1)
    try {
      const viralResults = await searchViralTrends(niche, platform)
      if (viralResults.length === 0) {
        step1.status = "failed"
        step1.message = "未搜索到爆款内容，使用通用结构"
      } else {
        step1.status = "done"
        step1.message = `搜索到 ${viralResults.length} 条爆款内容`
        step1.result = viralResults.slice(0, 3).map(r => ({ title: r.title, url: r.url }))
        results.viralResults = viralResults
      }
    } catch (err: any) {
      step1.status = "failed"
      step1.message = `搜索失败: ${err.message}`
    }

    // ── Step 2: 爆款拆解 ──
    const step2: WorkflowStep = { name: "爆款拆解", status: "running", message: "" }
    steps.push(step2)
    let viralTemplate: ViralTemplate | null = null

    if (results.viralResults?.length > 0) {
      try {
        const deconPrompt = buildDeconstructPrompt(results.viralResults, niche)
        const rawDecon = await callDeepSeek(
          "你是爆款内容拆解专家。只输出JSON。",
          deconPrompt,
          { temperature: 0.3, maxTokens: 1500, jsonMode: true },
        )
        const parsed = safeParseJSON(rawDecon)
        if (parsed?.viralTemplates?.[0]) {
          const t = parsed.viralTemplates[0]
          viralTemplate = {
            hookStyle: t.hookStyle || "",
            scriptStructure: t.scriptStructure || "",
            pacing: t.pacing || "",
            emotionalCurve: t.emotionalCurve || "",
            conversionTactic: t.conversionTactic || "",
            visualStyle: t.visualStyle || "",
            keywords: t.keywords || [],
            sourceTitle: results.viralResults[0]?.title || "",
          }
          step2.status = "done"
          step2.message = `拆解完成: ${viralTemplate.hookStyle.slice(0, 30)}...`
          step2.result = viralTemplate
        } else {
          step2.status = "failed"
          step2.message = "拆解结果为空"
        }
      } catch (err: any) {
        step2.status = "failed"
        step2.message = `拆解失败: ${err.message}`
      }
    } else {
      step2.status = "skipped"
      step2.message = "无爆款数据，跳过拆解"
    }

    // ── Step 3: 生成新话题（agent_13 选题分析） ──
    const step3: WorkflowStep = { name: "话题生成", status: "running", message: "" }
    steps.push(step3)
    let generatedTopic = customTopic || ""

    if (!customTopic) {
      try {
        const topicSystem = `你是${platform}平台${niche}领域的选题专家。基于爆款趋势，生成3个有潜力的新选题。直接输出JSON。`
        const topicPrompt = `基于以下爆款趋势，为${platform}平台${niche}赛道生成3个新的内容选题：
${viralTemplate ? `爆款结构：钩子=${viralTemplate.hookStyle}，脚本=${viralTemplate.scriptStructure}，情绪=${viralTemplate.emotionalCurve}` : `赛道：${niche}`}

输出JSON格式：
{"topics":[{"title":"选题标题（≤20字）","angle":"切入角度","why":"为什么这个选题有潜力（≤50字）"}],"bestTopic":"推荐最佳选题的标题"}`

        const rawTopics = await callDeepSeek(topicSystem, topicPrompt, { temperature: 0.8, maxTokens: 1000, jsonMode: true })
        const parsed = safeParseJSON(rawTopics)

        if (parsed?.topics?.length > 0) {
          generatedTopic = parsed.bestTopic || parsed.topics[0].title
          step3.status = "done"
          step3.message = `生成 ${parsed.topics.length} 个选题，推荐: "${generatedTopic}"`
          step3.result = { topics: parsed.topics, bestTopic: generatedTopic }
        } else {
          generatedTopic = `${niche}爆款选题`
          step3.status = "failed"
          step3.message = "选题解析失败，使用默认选题"
        }
      } catch (err: any) {
        generatedTopic = `${niche}爆款选题`
        step3.status = "failed"
        step3.message = `选题生成失败: ${err.message}`
      }
    } else {
      step3.status = "skipped"
      step3.message = `使用自定义选题: "${customTopic}"`
    }

    results.generatedTopic = generatedTopic

    // ── Step 4: 文案改写（人设注入 + 爆款结构 + 赛道适配） ──
    const step4: WorkflowStep = { name: "文案改写", status: "running", message: "" }
    steps.push(step4)
    let rewrittenText = ""

    try {
      let rewriteSystem = `你是${platform}平台${niche}领域的专业创作者。`
      
      // 注入人设信息
      if (persona) {
        rewriteSystem += `\n\n你的创作者人设：${persona}`
      }
      if (personaTags.length > 0) {
        rewriteSystem += `\n人设标签：${personaTags.join("、")}`
      }
      if (tone) {
        rewriteSystem += `\n语气风格：${tone}`
      }

      rewriteSystem += `\n\n创作要求：
- 保持人设一致性和风格调性
- 内容原创，不抄袭不洗稿
- 适合${platform}平台的阅读习惯
- 标题要有吸引力，正文300-500字
- 避免敏感词和违规表达
- 输出格式：第一行是标题，空一行后是正文，最后是话题标签`

      let rewritePrompt = `请创作一篇关于「${generatedTopic}」的${platform}文案。`

      // 注入爆款结构
      if (viralTemplate) {
        rewritePrompt += `\n\n参考爆款结构（内容必须原创）：`
        rewritePrompt += `\n钩子策略：${viralTemplate.hookStyle}`
        rewritePrompt += `\n脚本结构：${viralTemplate.scriptStructure}`
        rewritePrompt += `\n节奏控制：${viralTemplate.pacing}`
        rewritePrompt += `\n情绪曲线：${viralTemplate.emotionalCurve}`
        rewritePrompt += `\n转化话术：${viralTemplate.conversionTactic}`
        if (viralTemplate.keywords.length > 0) {
          rewritePrompt += `\n热门关键词：${viralTemplate.keywords.join("、")}`
        }
      }

      // 注入用户内容样本
      if (userSamples.length > 0) {
        rewritePrompt += `\n\n你已有的内容风格（新内容必须保持）：`
        userSamples.forEach((s, i) => {
          rewritePrompt += `\n${i + 1}. ${s.slice(0, 300)}`
        })
        rewritePrompt += `\n\n重要：新内容必须保持你账号原有的风格和专业深度。`
      }

      rewritePrompt += `\n\n请直接输出完整的文案内容。`

      rewrittenText = await callDeepSeek(rewriteSystem, rewritePrompt, { temperature: 0.7, maxTokens: 2000 })

      if (rewrittenText) {
        step4.status = "done"
        step4.message = `文案生成完成，共 ${rewrittenText.length} 字`
        step4.result = { length: rewrittenText.length, preview: rewrittenText.slice(0, 100) }
      } else {
        step4.status = "failed"
        step4.message = "文案为空"
      }
    } catch (err: any) {
      step4.status = "failed"
      step4.message = `改写失败: ${err.message}`
    }

    results.rewrittenText = rewrittenText

    // ── Step 5: 敏感词过滤 ──
    const step5: WorkflowStep = { name: "敏感词过滤", status: "running", message: "" }
    steps.push(step5)

    if (rewrittenText) {
      const checkResult = checkSensitive(rewrittenText)
      const platformCheck = checkPlatformCompliance(rewrittenText, platform)

      if (checkResult.passed && platformCheck.passed) {
        step5.status = "done"
        step5.message = "通过敏感词和平台合规检测 ✅"
      } else {
        // 有敏感词，尝试AI改写规避
        const allHits = [...checkResult.hitWords, ...checkResult.hitVariants.map(v => v.variant)]
        if (allHits.length > 0) {
          try {
            const desenPrompt = buildDesensitizePrompt(rewrittenText, allHits, platform)
            const desensitized = await callDeepSeek(
              `你是${platform}平台合规内容改写专家。`,
              desenPrompt,
              { temperature: 0.5, maxTokens: 2000 },
            )
            if (desensitized && desensitized.length > 50) {
              rewrittenText = desensitized
              results.rewrittenText = desensitized
              // 再次检查
              const recheck = checkSensitive(desensitized)
              if (recheck.passed) {
                step5.status = "done"
                step5.message = `已自动规避敏感词并改写 ✅（原命中: ${allHits.join(", ")}）`
                step5.result = { originalHits: allHits, rewritten: true }
              } else {
                step5.status = "done"
                step5.message = `⚠️ 部分敏感词已处理，剩余: ${recheck.hitWords.join(", ")}`
                step5.result = { remainingHits: recheck.hitWords, rewritten: true }
              }
            } else {
              step5.status = "done"
              step5.message = `⚠️ 检测到敏感词: ${allHits.join(", ")}，改写未生效`
              step5.result = { hits: allHits, rewritten: false }
            }
          } catch {
            step5.status = "done"
            step5.message = `⚠️ 检测到敏感词: ${allHits.join(", ")}，改写服务不可用`
            step5.result = { hits: allHits, rewritten: false }
          }
        }
      }
    } else {
      step5.status = "skipped"
      step5.message = "无文案，跳过过滤"
    }

    // ── Step 6: TTS 语音合成 ──
    const step6: WorkflowStep = { name: "语音合成", status: "running", message: "" }
    steps.push(step6)
    let ttsResult: any = null

    if (mode !== "text-only" && rewrittenText) {
      try {
        // 提取纯文本用于TTS（去掉标题和标签）
        const ttsText = rewrittenText
          .replace(/#[^\s#,\n]+/g, "")      // 去掉话题标签
          .replace(/^[^\n]*\n\n?/, "")       // 去掉第一行标题
          .trim()
          .slice(0, 500)

        const ttsRes = await fetch(`${baseUrl}/api/video/tts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: ttsText || rewrittenText.slice(0, 500) }),
        })

        if (ttsRes.ok) {
          ttsResult = await ttsRes.json()
          if (ttsResult.audio && !ttsResult.fallback) {
            step6.status = "done"
            step6.message = `TTS 生成成功 (${ttsResult.source})`
            step6.result = { source: ttsResult.source, format: ttsResult.format }
          } else if (ttsResult.fallback) {
            step6.status = "failed"
            step6.message = `TTS 回退: ${ttsResult.message}`
            step6.result = { fallback: true }
          }
        } else {
          step6.status = "failed"
          step6.message = "TTS API 请求失败"
        }
      } catch (err: any) {
        step6.status = "failed"
        step6.message = `TTS 失败: ${err.message}`
      }
    } else {
      step6.status = "skipped"
      step6.message = mode === "text-only" ? "text-only模式跳过TTS" : "无文案跳过TTS"
    }

    results.tts = ttsResult

    // ── Step 7: 数字人视频 ──
    const step7: WorkflowStep = { name: "数字人视频", status: "running", message: "" }
    steps.push(step7)
    let digitalHumanResult: any = null

    if (mode === "full" && ttsResult?.audio && portraitImage) {
      try {
        // 先上传音频获取可访问URL
        let audioUrl = ""
        if (ttsResult.audio?.startsWith("data:")) {
          // base64音频，上传到服务器
          const audioBytes = Buffer.from(ttsResult.audio.split(",")[1] || "", "base64")
          const audioFd = new FormData()
          audioFd.append("file", new Blob([audioBytes], { type: "audio/mp3" }), `tts-${Date.now()}.mp3`)
          const upRes = await fetch(`${baseUrl}/api/upload`, { method: "POST", body: audioFd })
          if (upRes.ok) {
            const upData = await upRes.json()
            audioUrl = upData.url || ""
          }
        }

        // 处理照片
        let imageUrl = portraitImage
        if (portraitImage.startsWith("data:")) {
          const imgBytes = Buffer.from(portraitImage.split(",")[1] || "", "base64")
          const imgFd = new FormData()
          imgFd.append("file", new Blob([imgBytes], { type: "image/png" }), `portrait-${Date.now()}.png`)
          const upRes = await fetch(`${baseUrl}/api/upload`, { method: "POST", body: imgFd })
          if (upRes.ok) {
            const upData = await upRes.json()
            imageUrl = upData.url || portraitImage
          }
        }

        if (imageUrl && audioUrl) {
          const dhRes = await fetch(`${baseUrl}/api/video/digital-human`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl, audioUrl }),
          })

          if (dhRes.ok) {
            const dhData = await dhRes.json()
            if (dhData.taskId) {
              // 轮询等待结果
              for (let i = 0; i < 30; i++) {
                await new Promise(r => setTimeout(r, 3000))
                const pollRes = await fetch(`${baseUrl}/api/video/digital-human?task_id=${dhData.taskId}`)
                const pollData = await pollRes.json()
                if (pollData.status === "done" && pollData.videoUrl) {
                  digitalHumanResult = { videoUrl: pollData.videoUrl, taskId: dhData.taskId }
                  step7.status = "done"
                  step7.message = "数字人视频生成完成 ✅"
                  step7.result = digitalHumanResult
                  break
                }
                if (pollData.status === "failed" || pollData.status === "expired") {
                  step7.status = "failed"
                  step7.message = `数字人失败: ${pollData.status}`
                  break
                }
              }
              if (!digitalHumanResult) {
                step7.status = "failed"
                step7.message = "数字人超时（90秒未完成）"
              }
            } else {
              step7.status = "failed"
              step7.message = `数字人提交失败: ${JSON.stringify(dhData).slice(0, 200)}`
            }
          } else {
            step7.status = "failed"
            step7.message = "数字人API请求失败"
          }
        } else {
          step7.status = "failed"
          step7.message = `素材上传失败（audioUrl=${!!audioUrl}, imageUrl=${!!imageUrl})`
        }
      } catch (err: any) {
        step7.status = "failed"
        step7.message = `数字人失败: ${err.message}`
      }
    } else {
      step7.status = "skipped"
      if (mode !== "full") {
        step7.message = `${mode}模式跳过数字人`
      } else if (!ttsResult?.audio) {
        step7.message = "无TTS音频，跳过数字人"
      } else if (!portraitImage) {
        step7.message = "未提供照片，跳过数字人"
      }
    }

    results.digitalHuman = digitalHumanResult

    // ── 计算总耗时 ──
    const totalDuration = Date.now() - t0

    return NextResponse.json({
      success: true,
      mode,
      niche,
      platform,
      topic: generatedTopic,
      steps: steps.map(s => ({
        name: s.name,
        status: s.status,
        message: s.message,
        result: s.result,
      })),
      results: {
        rewrittenText: results.rewrittenText,
        ttsAudio: ttsResult?.audio || null,
        ttsFormat: ttsResult?.format || null,
        digitalHumanVideoUrl: digitalHumanResult?.videoUrl || null,
        viralKeywords: viralTemplate?.keywords || [],
        viralSource: viralTemplate?.sourceTitle || "",
      },
      meta: {
        totalDuration,
        personaUsed: !!persona,
        viralTemplateUsed: !!viralTemplate,
        ttsSource: ttsResult?.source || "none",
      },
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
        steps: steps.map(s => ({ name: s.name, status: s.status, message: s.message })),
      },
      { status: 500 },
    )
  }
}
