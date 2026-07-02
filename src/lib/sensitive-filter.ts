// ─── 敏感词过滤与规避模块 ──────────────────────────────
// 支持中英文敏感词检测，可用于内容发布前预检
// 策略：字典匹配 + 谐音/变体检测 + LLM辅助判断

// ═══════════════════════════════════════════════════
// 敏感词库（示例词库，实际应接入第三方敏感词服务）
// ═══════════════════════════════════════════════════

const SENSITIVE_WORDS: Set<string> = new Set([
  // 通用违禁词
  "毒品", "枪支", "赌博", "色情", "暴力恐怖", "传销",
  // 平台敏感词
  "微信号", "QQ号", "手机号", "加V",
  "免费领取", "点击下载", "关注领",
  // 医疗违规
  "治愈", "根治", "一疗程见效", "包治百病",
  // 金融违规
  "稳赚", "保本", "零风险", "高收益", "年化收益",
  // 竞品词（可按需添加）
  // "快手", "抖音", "TikTok",
])

// 谐音/变体映射（中文常见规避写法）
const VARIANT_MAP: Record<string, string[]> = {
  "微信": ["威信", "薇信", "V信", "VX", "vx", "wx"],
  "赚钱": ["賺钱", "转钱", "zq", "ZQ"],
  "免费": ["免废", "mianfei", "MF"],
  "加群": ["+群", "jia群", "进群"],
}

// 反向索引：变体 → 原词
const REVERSE_VARIANT_MAP: Record<string, string> = {}
for (const [original, variants] of Object.entries(VARIANT_MAP)) {
  for (const v of variants) {
    REVERSE_VARIANT_MAP[v.toLowerCase()] = original
  }
}

// ═══════════════════════════════════════════════════
// 检测结果
// ═══════════════════════════════════════════════════

export interface SensitiveCheckResult {
  passed: boolean              // 是否通过检测
  hitWords: string[]           // 命中的敏感词
  hitVariants: { variant: string; original: string }[]  // 命中的变体
  riskLevel: "safe" | "low" | "medium" | "high"  // 风险等级
  suggestion: string           // 修改建议
  filteredText: string         // 脱敏后的文本（敏感词用 *** 替换）
}

// ═══════════════════════════════════════════════════
// 检测函数
// ═══════════════════════════════════════════════════

export function checkSensitive(text: string): SensitiveCheckResult {
  const hitWords: string[] = []
  const hitVariants: { variant: string; original: string }[] = []
  let filteredText = text

  // 1. 直接匹配
  for (const word of SENSITIVE_WORDS) {
    if (text.includes(word)) {
      hitWords.push(word)
      filteredText = filteredText.replaceAll(word, "***")
    }
  }

  // 2. 变体检测
  for (const [variant, original] of Object.entries(REVERSE_VARIANT_MAP)) {
    if (text.toLowerCase().includes(variant)) {
      hitVariants.push({ variant, original })
      // 标记但不替换（让AI自行改写）
    }
  }

  // 3. 风险等级评估
  const totalHits = hitWords.length + hitVariants.length
  let riskLevel: SensitiveCheckResult["riskLevel"] = "safe"
  let suggestion = ""

  if (totalHits >= 3) {
    riskLevel = "high"
    suggestion = `检测到 ${totalHits} 个敏感词/变体，建议重新改写以下内容：${[...hitWords, ...hitVariants.map(v => v.variant)].join("、")}`
  } else if (totalHits === 2) {
    riskLevel = "medium"
    suggestion = `检测到 ${totalHits} 个敏感词，建议替换：${[...hitWords, ...hitVariants.map(v => v.variant)].join("、")}`
  } else if (totalHits === 1) {
    riskLevel = "low"
    suggestion = `检测到 1 个敏感词，建议检查：${[...hitWords, ...hitVariants.map(v => v.variant)].join("、")}`
  }

  return {
    passed: totalHits === 0,
    hitWords,
    hitVariants,
    riskLevel,
    suggestion,
    filteredText,
  }
}

// ═══════════════════════════════════════════════════
// AI改写规避敏感词
// ═══════════════════════════════════════════════════

export function buildDesensitizePrompt(
  text: string,
  hitWords: string[],
  platform: string,
): string {
  const wordList = hitWords.join("、")
  return `你是${platform}平台的合规内容审核专家。以下文案需要改写，避开敏感词同时保持原意：

原文案：
"""
${text}
"""

需要规避的敏感词/表达：${wordList}

改写要求：
1. 用更自然、合规的表达替换敏感词
2. 保持原文的语气、风格和核心信息
3. 不要简单地删除，而是用其他表达传递同样意思
4. 如果涉及联系方式，改为引导用户私信或评论互动
5. 保持字数与原文字数接近

请直接输出改写后的文案（不要解释改了什么）：`
}

// ═══════════════════════════════════════════════════
// 平台合规校验
// ═══════════════════════════════════════════════════

export interface PlatformRule {
  platform: string
  maxHashtags: number
  forbiddenPatterns: RegExp[]
  tips: string
}

export const PLATFORM_RULES: Record<string, PlatformRule> = {
  "小红书": {
    platform: "小红书",
    maxHashtags: 10,
    forbiddenPatterns: [/微信号/, /QQ号/, /手机号/, /加V/, /引流/, /私信我/],
    tips: "小红书对营销内容审核严格，避免直接引流话术，用「私信」「评论区见」等含蓄表达。",
  },
  "抖音": {
    platform: "抖音",
    maxHashtags: 5,
    forbiddenPatterns: [/微信号/, /二维码/, /加群/, /免费领/],
    tips: "抖音对硬广敏感，用软植入方式，避免「购买」「下单」等直接转化词。",
  },
  "B站": {
    platform: "B站",
    maxHashtags: 8,
    forbiddenPatterns: [/低俗/, /引战/, /人身攻击/],
    tips: "B站用户反感硬广，保持内容真诚，用「三连支持」代替「关注点赞」。",
  },
  "快手": {
    platform: "快手",
    maxHashtags: 5,
    forbiddenPatterns: [/微信号/, /QQ/, /引流/, /诱导/],
    tips: "快手社区规范较严，避免争议话题和敏感社会事件。",
  },
  "视频号": {
    platform: "视频号",
    maxHashtags: 5,
    forbiddenPatterns: [/微信号/, /加群/, /诱导分享/],
    tips: "视频号与微信生态联动，注意微信内容安全规范。",
  },
}

export function checkPlatformCompliance(
  text: string,
  platform: string,
): { passed: boolean; violations: string[]; tips: string } {
  const rule = PLATFORM_RULES[platform]
  if (!rule) return { passed: true, violations: [], tips: "" }

  const violations: string[] = []
  for (const pattern of rule.forbiddenPatterns) {
    if (pattern.test(text)) {
      violations.push(pattern.source)
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    tips: rule.tips,
  }
}
