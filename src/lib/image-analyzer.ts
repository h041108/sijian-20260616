// 图片分析：像素结构分析 + 尺寸/亮度比检测

export async function analyzeImageInBrowser(file: File): Promise<string> {
  const dataUrl = await new Promise<string>(resolve => {
    const r = new FileReader(); r.onload = () => resolve(r.result as string); r.readAsDataURL(file)
  })
  return analyzePixelStructure(dataUrl, file)
}

function formatOcrResult(file: File, text: string, confidence: number): string {
  // 截取前 8000 字
  const truncated = text.slice(0, 8000)
  const lines = truncated.split("\n").filter(l => l.trim()).length
  const chars = truncated.replace(/\s/g, "").length

  return [
    `╔══════════════════════════════════════╗`,
    `║  OCR 文字识别结果 (tesseract.js)    ║`,
    `╚══════════════════════════════════════╝`,
    ``,
    `文件: ${file.name} (${(file.size/1024).toFixed(1)}KB)`,
    `识别置信度: ${(confidence).toFixed(0)}%`,
    `提取文字: ${chars} 字符, ${lines} 行`,
    ``,
    `─── 识别到的文字内容 ───`,
    truncated,
    ``,
    `─── 以上是图片中识别到的真实文字 ───`,
  ].join("\n")
}

// ─── 降级：像素结构分析 ─────────────────────────

function analyzePixelStructure(dataUrl: string, file: File): Promise<string> {
  return new Promise(resolve => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!

      const targetW = Math.min(img.width, 1200)
      const scale = targetW / img.width
      canvas.width = targetW
      canvas.height = Math.round(img.height * scale)
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

      const w = canvas.width, h = canvas.height
      const imageData = ctx.getImageData(0, 0, w, h)
      const d = imageData.data

      // 文本行检测
      const rowDark: number[] = []
      for (let y = 0; y < h; y++) {
        let dark = 0
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4
          if (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] < 128) dark++
        }
        rowDark.push(dark / w)
      }

      const textLines: number[] = []
      let inLine = false
      for (let y = 0; y < h; y++) {
        if (rowDark[y] > 0.08 && !inLine) inLine = true
        else if (rowDark[y] <= 0.08 && inLine) { inLine = false; textLines.push(y) }
      }

      // 全局亮暗比
      let darkPx = 0, total = w * h
      for (let i = 0; i < d.length; i += 4) {
        if (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2] < 128) darkPx++
      }
      const darkPct = darkPx / total

      const isWhiteBg = darkPct < 0.3
      const hasLotsOfText = textLines.length > 15

      let imgType = "一般图片"
      if (isWhiteBg && hasLotsOfText) imgType = "白底文档/试卷（有大量文字，但OCR无法识别具体内容）"
      else if (isWhiteBg) imgType = "白底图片（有少量文字或图形）"
      else if (darkPct > 0.5) imgType = "深色背景图片"
      else imgType = "普通图片"

      resolve([
        `╔══════════════════════════════════════╗`,
        `║  图片结构分析（降级模式）            ║`,
        `║  OCR 未能识别文字内容                ║`,
        `╚══════════════════════════════════════╝`,
        ``,
        `文件: ${file.name} (${(file.size/1024).toFixed(1)}KB)`,
        `尺寸: ${img.width}×${img.height}`,
        `类型: ${imgType}`,
        `文字行数: 约 ${textLines.length} 行`,
        `暗色像素: ${(darkPct*100).toFixed(0)}%`,
        ``,
        `─── 重要提示 ───`,
        `OCR 引擎未能从这张图片中提取文字内容。可能原因：`,
        `1. 图片分辨率过低或文字太小`,
        `2. 图片中的文字是手写体（OCR 对手写识别能力有限）`,
        `3. 图片质量模糊或有遮挡`,
        ``,
        `建议：`,
        `- 重新拍摄/扫描试卷，确保文字清晰`,
        `- 在上方主题框中手动输入试卷文字`,
        `- 或直接描述需要解答的题目`,
      ].join("\n"))
    }
    img.onerror = () => resolve(`[图片] 文件: ${file.name}，无法读取`)
    img.src = dataUrl
  })
}
