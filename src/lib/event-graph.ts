// ─── 思见事件图谱引擎 ────────────────────────────────
// 从长篇文本（小说/剧本/文章）中自动提取结构化事件节点
// 复用 61 条思维线路 + 四层意识识别
// 参考 Toonflow 的章节事件图谱架构

import { detectThinkingLines } from "./thinking-lines"
import { fullCognitionAnalysis } from "./cognition"

export interface EventNode {
  id: string
  label: string
  content: string
  chapter: number
  position: number              // 在原文中的位置比例 0-1
  eventType: "setup" | "conflict" | "turning_point" | "climax" | "resolution" | "exposition" | "character_moment"
  characters: string[]
  emotions: string[]
  thinkingLines: string[]
  importance: number            // 0-1 重要性评分
  preceding: string[]          // 前置事件ID
  following: string[]          // 后续事件ID
  summary: string              // 一句话摘要
}

export interface EventGraph {
  title: string
  totalChapters: number
  totalEvents: number
  nodes: EventNode[]
  edges: { source: string; target: string; type: "causal" | "sequential" | "emotional" | "parallel" }[]
  narrativeStructure: {
    type: string               // "三幕式"/"起承转合"/"章回体"/"非线性"
    turningPoints: string[]    // 转折点事件ID
    pacingHeatmap: number[]    // 每个章节的节奏密度
  }
  keyCharacters: { name: string; appearances: number; arc: string }[]
  generatedAt: string
}

// ═══════════════════════════════════════════════════
// 核心提取引擎
// ═══════════════════════════════════════════════════

export async function extractEventGraph(
  text: string, title: string = "未命名作品",
): Promise<EventGraph> {
  if (!text || text.trim().length < 100) {
    return emptyGraph(title)
  }

  // 按换行符/空行分章节
  const rawChapters = text.split(/\n\n+/).filter(c => c.trim().length > 30)
  const chapters = rawChapters.length > 1 ? rawChapters : splitByParagraphs(text, 5)

  const now = new Date().toISOString()
  const allEvents: EventNode[] = []
  const characters = new Map<string, number>()

  // 逐章提取事件
  for (let ci = 0; ci < chapters.length; ci++) {
    const chapter = chapters[ci]
    try {
      const events = await extractChapterEvents(chapter, ci, chapters.length)
      allEvents.push(...events)
    } catch {
      // 降级: 本地提取
      const events = localExtractEvents(chapter, ci)
      allEvents.push(...events)
    }

    // 角色提取
    const chapterChars = extractCharacters(chapters[ci])
    for (const name of chapterChars) {
      characters.set(name, (characters.get(name) || 0) + 1)
    }
  }

  // 建立事件间关系
  const edges: EventGraph["edges"] = []
  for (let i = 0; i < allEvents.length; i++) {
    const curr = allEvents[i]
    // 同章顺序关系
    if (i > 0 && allEvents[i-1].chapter === curr.chapter) {
      edges.push({ source: allEvents[i-1].id, target: curr.id, type: "sequential" })
    }
    // 跨章因果: 同类型事件关联
    const similar = allEvents.filter(e => e.eventType === curr.eventType && e.id !== curr.id && Math.abs(e.chapter - curr.chapter) <= 2)
    for (const s of similar.slice(0, 2)) {
      if (!edges.some(ed => ed.source === s.id && ed.target === curr.id)) {
        edges.push({ source: s.id, target: curr.id, type: "causal" })
      }
    }
  }

  // 叙事结构判断
  const turningPoints = allEvents.filter(e =>
    e.eventType === "turning_point" || e.eventType === "climax"
  )
  const pacingHeatmap = chapters.map((_, ci) => {
    const chapEvents = allEvents.filter(e => e.chapter === ci)
    return chapEvents.length / Math.max(1, allEvents.length / chapters.length)
  })

  const structureType = chapters.length >= 5 ? "三幕式" : chapters.length >= 3 ? "起承转合" : "片段叙事"

  // 角色弧光
  const keyCharacters = Array.from(characters.entries())
    .filter(([, count]) => count >= 2)
    .slice(0, 8)
    .map(([name, appearances]) => ({
      name,
      appearances,
      arc: appearances >= chapters.length * 0.5 ? "贯穿全篇" : appearances >= 3 ? "主要角色" : "配角",
    }))

  return {
    title,
    totalChapters: chapters.length,
    totalEvents: allEvents.length,
    nodes: allEvents,
    edges,
    narrativeStructure: {
      type: structureType,
      turningPoints: turningPoints.map(e => e.id),
      pacingHeatmap,
    },
    keyCharacters,
    generatedAt: now,
  }
}

// ═══════════════════════════════════════════════════
// 章节事件提取（调用 AI）
// ═══════════════════════════════════════════════════

async function extractChapterEvents(
  chapter: string, chapterIdx: number, totalChapters: number,
): Promise<EventNode[]> {
  const prompt = `请从以下小说段落中提取关键叙事事件。每个事件是一个无法继续拆解的故事推进点。

输入：
${chapter.slice(0, 2000)}

请按以下格式输出（每个事件一行）：
E: 事件ID|事件标签≤8字|类型(setup/conflict/turning_point/climax/resolution/exposition/character_moment)|一句话摘要≤30字

只输出 E: 开头的行，最多6个事件。`

  const res = await fetch("/api/chat", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: [{ role: "user", content: prompt }], existingNodes: [] }),
  })

  if (!res.ok) throw new Error("API failed")

  const data = await res.json()
  const text = data.message || ""

  return parseEventLines(text, chapter, chapterIdx, totalChapters)
}

function parseEventLines(
  text: string, chapter: string, chapterIdx: number, totalChapters: number,
): EventNode[] {
  const events: EventNode[] = []
  const lines = text.split("\n").filter(l => l.trim().startsWith("E:"))

  for (let i = 0; i < lines.length; i++) {
    const parts = lines[i].slice(3).split("|")
    if (parts.length < 4) continue

    const id = `evt_c${chapterIdx}_${i}`
    const label = (parts[1] || "事件").trim().slice(0, 8)
    const eventType = (parts[2] || "exposition").trim() as EventNode["eventType"]
    const summary = parts.slice(3).join("|").trim().slice(0, 30)

    events.push({
      id, label, content: summary,
      chapter: chapterIdx,
      position: (chapterIdx + i / Math.max(lines.length, 1)) / totalChapters,
      eventType,
      characters: extractCharacters(chapter.slice(i * 50, i * 50 + 100)),
      emotions: extractMoods(chapter.slice(i * 50, i * 50 + 100)),
      thinkingLines: detectThinkingLines(chapter.slice(i * 50, i * 50 + 100)).slice(0, 2).map(l => l.lineId),
      importance: eventType === "climax" || eventType === "turning_point" ? 0.9 : 0.5,
      preceding: [], following: [],
      summary,
    })
  }

  return events.length > 0 ? events : localExtractEvents(chapter, chapterIdx)
}

function localExtractEvents(chapter: string, chapterIdx: number): EventNode[] {
  const sentences = chapter.split(/[。！？\n]/).map(s => s.trim()).filter(s => s.length >= 6 && s.length <= 40)
  if (sentences.length === 0) return []

  const eventTypes: EventNode["eventType"][] = ["setup","conflict","turning_point","climax","resolution","exposition"]
  return sentences.slice(0, 6).map((s, i) => ({
    id: `evt_c${chapterIdx}_${i}`,
    label: s.slice(0, 8),
    content: s,
    chapter: chapterIdx,
    position: chapterIdx / Math.max(1, chapterIdx + 1) + (i / 6) * 0.1,
    eventType: eventTypes[i % eventTypes.length],
    characters: extractCharacters(s),
    emotions: extractMoods(s),
    thinkingLines: detectThinkingLines(s).slice(0, 2).map(l => l.lineId),
    importance: i === 0 ? 0.8 : i === 3 ? 0.9 : 0.4,
    preceding: [], following: [],
    summary: s,
  }))
}

// ═══════════════════════════════════════════════════
// 辅助函数
// ═══════════════════════════════════════════════════

function extractCharacters(text: string): string[] {
  const patterns = [
    /([一-龥]{2,3})(?:是|说|走|看|想|去|来|到|做|拿|放|站|坐|跑|笑|哭|道|问|回答|喊道)/g,
  ]
  const names = new Set<string>()
  for (const p of patterns) {
    let m; while ((m = p.exec(text)) !== null) names.add(m[1])
  }
  return Array.from(names).slice(0, 5)
}

function extractMoods(text: string): string[] {
  const mWords = ["紧张","温馨","悲伤","愤怒","平静","恐惧","期待","悔恨","狂喜","孤独","迷茫","坚定"]
  return mWords.filter(w => text.includes(w)).slice(0, 3)
}

function splitByParagraphs(text: string, perChapter: number): string[] {
  const lines = text.split(/\n/).filter(l => l.trim().length > 10)
  const chapters: string[] = []
  for (let i = 0; i < lines.length; i += perChapter) {
    chapters.push(lines.slice(i, i + perChapter).join("\n"))
  }
  return chapters.length > 0 ? chapters : [text]
}

function emptyGraph(title: string): EventGraph {
  return {
    title, totalChapters: 0, totalEvents: 0,
    nodes: [], edges: [],
    narrativeStructure: { type: "未知", turningPoints: [], pacingHeatmap: [] },
    keyCharacters: [], generatedAt: new Date().toISOString(),
  }
}
