import { NextRequest, NextResponse } from "next/server"
import { AgentRegistry } from "@/lib/agents/registry"
import { AGENT_META } from "@/lib/agents/types"
import type { AgentId } from "@/lib/agents/types"

const VALID_IDS = Object.keys(AGENT_META)

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const agentId = params.id as AgentId
    if (!VALID_IDS.includes(agentId)) {
      return NextResponse.json({ success: false, error: `未知Agent: ${agentId}` }, { status: 400 })
    }
    const body = await request.json()
    if (!body.instruction?.trim()) {
      return NextResponse.json({ success: false, error: "缺少必填字段: instruction" }, { status: 400 })
    }
    const output = await AgentRegistry.execute(agentId, {
      instruction: body.instruction.trim(),
      context: body.context,
      referenceImages: body.referenceImages,
      referenceText: body.referenceText,
      referenceLinks: body.referenceLinks,
      parameters: body.parameters,
    })
    return NextResponse.json(output)
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || "服务器错误" }, { status: 500 })
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const meta = AGENT_META[params.id as AgentId]
  return meta
    ? NextResponse.json({ id: params.id, ...meta })
    : NextResponse.json({ error: "未知Agent" }, { status: 404 })
}
