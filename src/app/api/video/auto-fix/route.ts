// ─── POST /api/video/auto-fix ────────────────────────
// 质检报告 → DeepSeek自动修复脚本
// 支持 story（故事大纲）和 script_breakdown（分镜脚本）两个阶段

import { NextRequest, NextResponse } from "next/server"
import { autoFixScript } from "@/lib/script-auto-fix"
import type { ScriptCognitionReport } from "@/lib/video-cognition-qa"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      originalScript,
      stage = "story",
      qaReport,
    } = body

    if (!originalScript) {
      return NextResponse.json({ error: "originalScript is required" }, { status: 400 })
    }

    if (!qaReport) {
      return NextResponse.json({ error: "qaReport is required" }, { status: 400 })
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      return NextResponse.json({
        error: true,
        message: "需要配置 DEEPSEEK_API_KEY 环境变量",
      }, { status: 402 })
    }

    const input = {
      originalScript,
      stage: stage as "story" | "script_breakdown",
      qaReport: qaReport as ScriptCognitionReport,
      style: body.style,
      genre: body.genre,
      targetDuration: body.targetDuration,
    }

    const result = await autoFixScript(input)

    if (!result) {
      return NextResponse.json({
        error: true,
        message: "自动修复失败，请检查脚本内容",
      }, { status: 500 })
    }

    return NextResponse.json({
      fixedScript: result.fixedScript,
      changes: result.changes,
      beforeScore: result.beforeScore,
      afterScore: result.afterScore,
      message: `脚本已自动修复，预估评分从${result.beforeScore}提升至${result.afterScore}`,
    })
  } catch (err: any) {
    return NextResponse.json({ error: "自动修复失败", detail: err.message }, { status: 500 })
  }
}
