// ─── 多引擎联网搜索 ──────────────────────────────
// 主引擎: Serper.dev (Google)  → 备用: Tavily (AI) → 兜底: Bing HTML
// 用完 Serper 免费额度自动切换 Tavily，Tavily 用完切 Bing

export interface SearchResult {
  title: string
  snippet: string
  url: string
}

const SERPER_KEY = (process.env.SERPER_API_KEY || "").trim()
const TAVILY_KEY = (process.env.TAVILY_API_KEY || "").trim()

async function tryFetch(url: string, opts: RequestInit = {}, timeout = 8000): Promise<Response | null> {
  try { return await fetch(url, { signal: AbortSignal.timeout(timeout), ...opts }) } catch { return null }
}

// ─── 引擎1: Serper.dev ───────────────────────────

async function searchSerper(query: string): Promise<SearchResult[]> {
  if (!SERPER_KEY || SERPER_KEY === "***") return []
  const res = await tryFetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": SERPER_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ q: query, gl: "cn", hl: "zh-cn", num: 10 }),
  }, 8000)
  if (!res) return []
  if (res.status === 403 || res.status === 429) return [] // 额度用完，返回空触发降级

  try {
    const data = await res.json()
    const organic = data.organic || []
    // 如果有知识图谱结果，作为第一个结果
    const results: SearchResult[] = []
    if (data.knowledgeGraph) {
      results.push({
        title: data.knowledgeGraph.title || query,
        snippet: data.knowledgeGraph.description || data.knowledgeGraph.detail?.description || "",
        url: data.knowledgeGraph.website || "",
      })
    }
    for (const r of organic) {
      results.push({
        title: r.title || "",
        snippet: r.snippet || "",
        url: r.link || "",
      })
    }
    return results.slice(0, 10)
  } catch { return [] }
}

// ─── 引擎2: Tavily ───────────────────────────────

async function searchTavily(query: string): Promise<SearchResult[]> {
  if (!TAVILY_KEY || TAVILY_KEY === "***") return []
  const res = await tryFetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: TAVILY_KEY,
      query,
      search_depth: "advanced",
      max_results: 10,
      include_answer: true,
      include_raw_content: false,
    }),
  }, 10000)
  if (!res) return []
  if (res.status === 403 || res.status === 429) return []

  try {
    const data = await res.json()
    const results: SearchResult[] = []

    // Tavily 的 answer 字段：AI 总结的直接答案（高质量）
    if (data.answer) {
      results.push({
        title: "AI 总结",
        snippet: data.answer,
        url: "",
      })
    }

    // Tavily 的搜索结果
    for (const r of (data.results || [])) {
      results.push({
        title: r.title || "",
        snippet: r.content || r.snippet || "",
        url: r.url || "",
      })
    }
    return results.slice(0, 10)
  } catch { return [] }
}

// ─── 引擎3: Bing HTML（兜底） ────────────────────

async function searchBing(query: string): Promise<SearchResult[]> {
  const res = await tryFetch(`https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-cn`, {
    headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36" },
  }, 10000)
  if (!res?.ok) return []
  const html = await res.text()
  if (!html.includes("b_algo")) return []

  const results: SearchResult[] = []
  const blockRegex = /<li class="b_algo"[^>]*>([\s\S]*?)<\/li>/gi
  let m
  while ((m = blockRegex.exec(html)) !== null) {
    const linkMatch = m[1].match(/<a[^>]*href="(https?:\/\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/i)
    const snippetMatch = m[1].match(/<div class="b_caption"[^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)
                      || m[1].match(/<p[^>]*class="b_lineclamp[^"]*"[^>]*>([\s\S]*?)<\/p>/i)
                      || m[1].match(/<p[^>]*>([\s\S]{20,})<\/p>/i)
    if (linkMatch) {
      const url = linkMatch[1].startsWith("http") ? linkMatch[1] : ""
      const title = linkMatch[2].replace(/<[^>]*>/g, "").replace(/&quot;/g, "\"").replace(/&amp;/g, "&").trim()
      const snippet = snippetMatch ? snippetMatch[1].replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim().slice(0, 600) : title
      if (title && url) results.push({ title, snippet, url })
    }
    if (results.length >= 10) break
  }
  return results
}

// ─── 组合搜索（级联降级） ───────────────────────

export async function searchWeb(query: string): Promise<SearchResult[]> {
  // 1. Serper（首选，Google 搜索结果）
  const serper = await searchSerper(query)
  if (serper.length > 0) return serper

  // 2. Tavily（备用，AI 优化的搜索结果）
  const tavily = await searchTavily(query)
  if (tavily.length > 0) return tavily

  // 3. Bing HTML（兜底，免费但质量低）
  return searchBing(query)
}

// ─── 获取来源的完整内容 ────────────────────────

export async function fetchWebContent(url: string): Promise<string> {
  if (!url) return ""

  // Wikipedia 特殊处理
  if (url.includes("wikipedia.org")) {
    const lang = url.includes("zh.wikipedia") ? "zh" : "en"
    const title = url.split("/wiki/").pop() || ""
    const apiRes = await tryFetch(
      `https://${lang}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(decodeURIComponent(title))}&format=json&origin=*`,
      {},
      6000,
    )
    if (apiRes?.ok) {
      try {
        const data = await apiRes.json()
        const pages: any = data.query?.pages || {}
        const extract = Object.values(pages)[0] as any
        if (extract?.extract) return (extract.extract as string).slice(0, 5000)
      } catch {}
    }
  }

  // Tavily 获取完整内容（如果已配置 key）
  if (TAVILY_KEY && TAVILY_KEY !== "***") {
    const tavRes = await tryFetch("https://api.tavily.com/extract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: TAVILY_KEY, urls: [url], extract_depth: "basic" }),
    }, 8000)
    if (tavRes?.ok) {
      try {
        const data = await tavRes.json()
        if (data.results?.[0]?.raw_content) return (data.results[0].raw_content as string).slice(0, 5000)
      } catch {}
    }
  }

  return ""
}

// ─── 完整搜索 + 抓取管线 ──────────────────────

export async function deepSearch(query: string, maxPages: number = 3): Promise<string> {
  const results = await searchWeb(query)
  if (results.length === 0) return ""

  let output = `搜索"${query}"获取到 ${results.length} 个结果：\n\n`
  for (let i = 0; i < Math.min(results.length, 10); i++) {
    output += `${i + 1}. **${results[i].title}**\n   ${results[i].snippet}\n   来源: ${results[i].url}\n\n`
  }

  // 并行抓前 maxPages 个网页全文
  const contents = await Promise.all(
    results.slice(0, maxPages).map(r => fetchWebContent(r.url).then(text => ({ title: r.title, text })))
  )
  const fetched = contents.filter(c => c.text)
  if (fetched.length > 0) {
    output += "\n─── 网页全文 ───\n"
    for (const c of fetched) output += `\n【${c.title}】\n${c.text.slice(0, 4000)}\n`
  }

  return output.slice(0, 15000)
}
