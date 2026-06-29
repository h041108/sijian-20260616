// ─── 知识讲解动画引擎 ──────────────────────────────
// 解析 AI 文案 → 结构化幻灯片 → 动画渲染 → 录制 MP4

export interface Slide {
  id: string
  type: "title" | "bullet" | "image" | "quote" | "cta"
  content: string
  subContent?: string
  duration: number       // 此幻灯片显示时长（秒）
  animation?: string     // "fadeIn" | "slideUp" | "zoomIn"
}

export interface SlideDeckConfig {
  title: string
  subtitle: string
  slides: Slide[]
  bgColor: string
  textColor: string
  accentColor: string
  fontFamily: string
  totalDuration: number  // 总时长（秒）
}

// ═══════════════════════════════════════════════════
// 文案解析器：把 AI 生成的文章转成结构化幻灯片
// ═══════════════════════════════════════════════════

export function parseContentToSlides(content: string, title: string): SlideDeckConfig {
  const lines = content.split("\n").filter(l => l.trim().length > 0)
  const slides: Slide[] = []
  let currentBullets: string[] = []
  let currentBulletStart = ""

  // 标题幻灯片
  slides.push({
    id: "slide_title",
    type: "title",
    content: title,
    duration: 3,
    animation: "zoomIn",
  })

  for (const line of lines) {
    const clean = line.replace(/^[#\s*\-•]+/, "").trim()
    if (!clean || clean.length < 4) continue

    // 检测是否为标题行（短于15字符，或无标点结尾）
    if (clean.length < 20 && !clean.endsWith("。") && !clean.endsWith("？") && !clean.endsWith("！")) {
      // 如果有正在收集的要点，先保存
      if (currentBullets.length > 0) {
        slides.push({
          id: `slide_bullet_${slides.length}`,
          type: "bullet",
          content: currentBulletStart,
          subContent: currentBullets.slice(0, 4).join("\n"),
          duration: Math.max(4, currentBullets.length * 2),
        })
        currentBullets = []
        currentBulletStart = ""
      }
      currentBulletStart = clean
      continue
    }

    // 普通段落 → 作为要点收集
    if (currentBulletStart) {
      currentBullets.push(clean)
    } else {
      slides.push({
        id: `slide_text_${slides.length}`,
        type: "bullet",
        content: clean,
        duration: 4,
      })
    }
  }

  // 最后一批要点
  if (currentBullets.length > 0) {
    slides.push({
      id: `slide_bullet_last_${slides.length}`,
      type: "bullet",
      content: currentBulletStart || "要点",
      subContent: currentBullets.slice(0, 4).join("\n"),
      duration: Math.max(4, currentBullets.length * 2),
    })
  }

  // CTA 结尾
  slides.push({
    id: "slide_cta",
    type: "cta",
    content: "关注我，获取更多干货",
    subContent: "点赞·收藏·转发",
    duration: 3,
    animation: "fadeIn",
  })

  const totalDuration = slides.reduce((s, sl) => s + sl.duration, 0)

  return {
    title,
    subtitle: "AI 知识讲解",
    slides,
    bgColor: "#0F172A",
    textColor: "#E2E8F0",
    accentColor: "#F59E0B",
    fontFamily: "system-ui, sans-serif",
    totalDuration,
  }
}

// ═══════════════════════════════════════════════════
// 生成纯色背景帧（用于 MediaRecorder 开始前占位）
// ═══════════════════════════════════════════════════

export function renderSolidFrame(canvas: HTMLCanvasElement, color: string) {
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.fillStyle = color
  ctx.fillRect(0, 0, canvas.width, canvas.height)
}
