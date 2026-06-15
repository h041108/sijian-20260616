"use client"

import { useMemo } from "react"
import katex from "katex"

interface LatexRendererProps {
  text: string
}

export default function LatexRenderer({ text }: LatexRendererProps) {
  const parts = useMemo(() => {
    // 匹配 KaTeX 块 \[...\] 和行内 \(...\)
    const regex = /(\\\[([\s\S]*?)\\\]|\\\(([\s\S]*?)\\\))/g
    const segments: { type: "text" | "latex"; content: string; display?: boolean }[] = []

    let lastIdx = 0
    let match
    while ((match = regex.exec(text)) !== null) {
      // 前置文本
      if (match.index > lastIdx) {
        segments.push({ type: "text", content: text.slice(lastIdx, match.index) })
      }
      const isDisplay = match[0].startsWith("\\[")
      const latex = isDisplay ? match[2] : match[3]
      segments.push({ type: "latex", content: latex || "", display: isDisplay })
      lastIdx = match.index + match[0].length
    }
    // 尾部文本
    if (lastIdx < text.length) {
      segments.push({ type: "text", content: text.slice(lastIdx) })
    }
    return segments
  }, [text])

  // 纯文本优化
  if (!parts.some(p => p.type === "latex")) {
    return <span className="whitespace-pre-wrap">{text}</span>
  }

  return (
    <span>
      {parts.map((part, i) => {
        if (part.type === "text") {
          return <span key={i} className="whitespace-pre-wrap">{part.content}</span>
        }
        try {
          const html = katex.renderToString(part.content!, {
            throwOnError: false,
            displayMode: part.display ?? false,
            output: "html",
          })
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: html }}
              className={part.display ? "block my-2 text-center" : "inline"}
            />
          )
        } catch {
          return <span key={i} className="text-red-500">[公式渲染错误]</span>
        }
      })}
    </span>
  )
}
