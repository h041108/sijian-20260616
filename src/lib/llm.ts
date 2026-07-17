// ─── 统一 LLM 调用层 ─────────────────────────
// 支持 Gemini 2.0 Flash（免费优先）+ DeepSeek（备用）
// 所有 API 路由调用 LLM 都走这里，自动切换模型

const MODELS = [
  {
    id: "gemini",
    name: "Gemini 2.0 Flash",
    baseURL: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-2.0-flash",
    key: () => process.env.GEMINI_API_KEY || "",
    free: true,
    rpm: 60,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseURL: "https://api.deepseek.com/v1",
    model: () => process.env.DEEPSEEK_MODEL || "deepseek-chat",
    key: () => process.env.DEEPSEEK_API_KEY || "",
    free: false,
    rpm: 500,
  },
]

interface LLMOptions {
  preferredModel?: "gemini" | "deepseek"
  temperature?: number
  maxTokens?: number
  jsonMode?: boolean
}

/**
 * 统一 LLM 调用
 * 默认 Gemini 优先（免费），不可用时自动降级到 DeepSeek
 */
export async function callLLM(
  systemPrompt: string,
  userMessage: string,
  options: LLMOptions = {},
): Promise<string> {
  const order = options.preferredModel === "deepseek"
    ? ["deepseek", "gemini"]
    : ["gemini", "deepseek"]

  for (const modelId of order) {
    const config = MODELS.find(m => m.id === modelId)
    if (!config) continue
    const apiKey = config.key()
    if (!apiKey) continue

    try {
      if (modelId === "gemini") {
        return await callGemini(config, systemPrompt, userMessage, options)
      } else {
        return await callDeepSeek(config, systemPrompt, userMessage, options)
      }
    } catch (e) {
      continue
    }
  }

  throw new Error("所有 LLM 均不可用，请配置 GEMINI_API_KEY 或 DEEPSEEK_API_KEY")
}

async function callGemini(config: typeof MODELS[0], system: string, user: string, opts: LLMOptions): Promise<string> {
  const url = `${config.baseURL}/models/${config.model}:generateContent?key=${config.key()}`
  const body: any = {
    contents: [
      {
        role: "user",
        parts: [{ text: system + "\n\n" + user }],
      },
    ],
    generationConfig: {
      temperature: opts.temperature ?? 0.5,
      maxOutputTokens: opts.maxTokens ?? 2000,
    },
  }
  if (opts.jsonMode) {
    body.generationConfig.responseMimeType = "application/json"
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`Gemini ${res.status}: ${errText.slice(0, 100)}`)
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""
  if (!text) throw new Error("Gemini 返回空内容")
  return text
}

async function callDeepSeek(config: typeof MODELS[0], system: string, user: string, opts: LLMOptions): Promise<string> {
  const url = `${config.baseURL}/chat/completions`
  const body: any = {
    model: typeof config.model === "function" ? config.model() : config.model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature: opts.temperature ?? 0.5,
    max_tokens: opts.maxTokens ?? 2000,
  }
  if (opts.jsonMode) {
    body.response_format = { type: "json_object" }
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + config.key() },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => "")
    throw new Error(`DeepSeek ${res.status}: ${errText.slice(0, 100)}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ""
}

/**
 * 调用 LLM 并返回 JSON 对象（自动解析）
 */
export async function callLLMJson<T = any>(
  systemPrompt: string,
  userMessage: string,
  options: LLMOptions = {},
): Promise<T> {
  const text = await callLLM(systemPrompt, userMessage, { ...options, jsonMode: true })
  // 处理可能的 markdown 包裹
  const cleaned = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "")
  try {
    return JSON.parse(cleaned) as T
  } catch {
    // 如果 JSON 解析失败，尝试提取 {...}
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0]) as T
    throw new Error("LLM 返回无法解析为 JSON: " + cleaned.slice(0, 100))
  }
}
