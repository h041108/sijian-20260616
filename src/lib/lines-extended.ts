// ═══ 29-60：32条新线路定义（数据层，不含坐标） ═══

import type { ThinkingLineId, ThinkingLine } from "@/lib/thinking-lines"

// 扩展 ID 范围
export type ExtendedLineId = ThinkingLineId
  | "dialectic" | "reverse"
  | "metacognition" | "first_principles"
  | "framework" | "probability" | "game_theory" | "ethics"
  | "emotion" | "insight" | "flow"
  | "modeling" | "experiment" | "fast_slow"
  | "habit" | "deliberate" | "growth" | "feedback"
  | "structured" | "nvc" | "empathy"
  | "second_order" | "leverage" | "scenario" | "opportunity_cost" | "counterintuitive"
  | "blindspot" | "dunning_kruger" | "confirmation_bias"
  | "simplify" | "practice" | "compound" | "first_step"

export const EXTENDED_LINES: ThinkingLine[] = [
  // ═══ 🧠 基础逻辑类 ═══
  { id:"dialectic" as any, name:"辩证线", category:"逻辑", color:"#EF4444", gradient:["#FCA5A5","#EF4444","#DC2626","#B91C1C","#991B1B"], icon:"🔄", shape:"scale", studentScore:4, coreScore:4 },
  { id:"reverse" as any, name:"逆向线", category:"逻辑", color:"#3B82F6", gradient:["#93C5FD","#60A5FA","#3B82F6","#2563EB","#1E40AF"], icon:"🔵", shape:"mirror", studentScore:4, coreScore:4 },
  // ═══ 🧠 元认知类 ═══
  { id:"metacognition" as any, name:"元认知线", category:"元认知", color:"#A855F7", gradient:["#D8B4FE","#C084FC","#A855F7","#9333EA","#6B21A8"], icon:"💜", shape:"mirror", studentScore:3, coreScore:5 },
  { id:"first_principles" as any, name:"第一性原理线", category:"元认知", color:"#78716C", gradient:["#D6D3D1","#A8A29E","#78716C","#57534E","#44403C"], icon:"⚪", shape:"target", studentScore:3, coreScore:5 },
  // ═══ ⚡ 实战应用类 ═══
  { id:"framework" as any, name:"框架线", category:"实战", color:"#F97316", gradient:["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C"], icon:"📋", shape:"grid", studentScore:5, coreScore:4 },
  { id:"probability" as any, name:"概率统计线", category:"实战", color:"#14B8A6", gradient:["#99F6E4","#5EEAD4","#14B8A6","#0D9488","#0F766E"], icon:"📊", shape:"wave", studentScore:3, coreScore:4 },
  { id:"game_theory" as any, name:"博弈线", category:"实战", color:"#8B5CF6", gradient:["#C4B5FD","#A78BFA","#8B5CF6","#6D28D9","#5B21B6"], icon:"♟️", shape:"grid", studentScore:3, coreScore:4 },
  { id:"ethics" as any, name:"伦理线", category:"实战", color:"#10B981", gradient:["#A7F3D0","#6EE7B7","#34D399","#10B981","#047857"], icon:"🕊️", shape:"scale", studentScore:3, coreScore:3 },
  // ═══ ❤️ 个体认知类 ═══
  { id:"emotion" as any, name:"情绪线", category:"认知", color:"#EF4444", gradient:["#FECACA","#FCA5A5","#EF4444","#DC2626","#991B1B"], icon:"❤️", shape:"heart", studentScore:5, coreScore:3 },
  { id:"insight" as any, name:"洞察线", category:"认知", color:"#F59E0B", gradient:["#FDE68A","#FCD34D","#F59E0B","#D97706","#B45309"], icon:"👁️", shape:"lightning", studentScore:4, coreScore:3 },
  { id:"flow" as any, name:"心流线", category:"认知", color:"#6366F1", gradient:["#C7D2FE","#A5B4FC","#818CF8","#6366F1","#4338CA"], icon:"🌊", shape:"wave", studentScore:4, coreScore:3 },
  // ═══ 🧪 科学方法类 ═══
  { id:"modeling" as any, name:"建模线", category:"科学", color:"#06B6D4", gradient:["#A5F3FC","#67E8F9","#22D3EE","#06B6D4","#0891B2"], icon:"📐", shape:"pyramid", studentScore:3, coreScore:4 },
  { id:"experiment" as any, name:"实验线", category:"科学", color:"#22C55E", gradient:["#BBF7D0","#86EFAC","#4ADE80","#22C55E","#15803D"], icon:"🧪", shape:"pill", studentScore:4, coreScore:4 },
  { id:"fast_slow" as any, name:"快慢思考线", category:"科学", color:"#F59E0B", gradient:["#FDE68A","#FCD34D","#F59E0B","#D97706","#B45309"], icon:"⚡", shape:"lightning", studentScore:3, coreScore:4 },
  // ═══ 🌱 习惯能力类 ═══
  { id:"habit" as any, name:"习惯线", category:"能力", color:"#10B981", gradient:["#A7F3D0","#6EE7B7","#34D399","#10B981","#047857"], icon:"🔄", shape:"ring", studentScore:5, coreScore:3 },
  { id:"deliberate" as any, name:"刻意练习线", category:"能力", color:"#F97316", gradient:["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C"], icon:"🎯", shape:"target", studentScore:5, coreScore:4 },
  { id:"growth" as any, name:"成长思维线", category:"能力", color:"#34D399", gradient:["#D1FAE5","#A7F3D0","#6EE7B7","#34D399","#059669"], icon:"🌱", shape:"seed", studentScore:5, coreScore:4 },
  { id:"feedback" as any, name:"反馈线", category:"能力", color:"#8B5CF6", gradient:["#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#6D28D9"], icon:"🔄", shape:"ring", studentScore:4, coreScore:4 },
  // ═══ 🗣️ 表达协作类 ═══
  { id:"structured" as any, name:"结构化表达线", category:"表达", color:"#3B82F6", gradient:["#BFDBFE","#93C5FD","#60A5FA","#3B82F6","#1E40AF"], icon:"🏗️", shape:"pyramid", studentScore:5, coreScore:4 },
  { id:"nvc" as any, name:"非暴力沟通线", category:"表达", color:"#10B981", gradient:["#A7F3D0","#6EE7B7","#34D399","#10B981","#047857"], icon:"☮️", shape:"bubble", studentScore:4, coreScore:3 },
  { id:"empathy" as any, name:"换位思考线", category:"表达", color:"#EC4899", gradient:["#FBCFE8","#F9A8D4","#F472B6","#EC4899","#BE185D"], icon:"🫂", shape:"bubble", studentScore:5, coreScore:4 },
  // ═══ 🎲 策略决策类 ═══
  { id:"second_order" as any, name:"二阶思维线", category:"策略", color:"#8B5CF6", gradient:["#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#6D28D9"], icon:"🔮", shape:"domino", studentScore:3, coreScore:5 },
  { id:"leverage" as any, name:"杠杆线", category:"策略", color:"#F59E0B", gradient:["#FDE68A","#FCD34D","#F59E0B","#D97706","#B45309"], icon:"⚙️", shape:"lever", studentScore:4, coreScore:4 },
  { id:"scenario" as any, name:"情景线", category:"策略", color:"#EC4899", gradient:["#FBCFE8","#F9A8D4","#F472B6","#EC4899","#BE185D"], icon:"🎭", shape:"fork", studentScore:4, coreScore:4 },
  { id:"opportunity_cost" as any, name:"机会成本线", category:"策略", color:"#F97316", gradient:["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C"], icon:"💰", shape:"fork", studentScore:4, coreScore:4 },
  { id:"counterintuitive" as any, name:"反直觉线", category:"策略", color:"#8B5CF6", gradient:["#E9D5FF","#D8B4FE","#C084FC","#A855F7","#9333EA"], icon:"🔄", shape:"lightning", studentScore:3, coreScore:4 },
  // ═══ 🩺 认知偏误类 ═══
  { id:"blindspot" as any, name:"盲点线", category:"偏误", color:"#EF4444", gradient:["#FECACA","#FCA5A5","#EF4444","#DC2626","#991B1B"], icon:"👁️‍🗨️", shape:"triangle", studentScore:3, coreScore:5 },
  { id:"dunning_kruger" as any, name:"自知线", category:"偏误", color:"#78716C", gradient:["#D6D3D1","#A8A29E","#78716C","#57534E","#44403C"], icon:"📉", shape:"wave", studentScore:3, coreScore:4 },
  { id:"confirmation_bias" as any, name:"证实偏差线", category:"偏误", color:"#F59E0B", gradient:["#FDE68A","#FCD34D","#F59E0B","#D97706","#B45309"], icon:"🚫", shape:"mirror", studentScore:3, coreScore:5 },
  // ═══ 📐 综合能力类 ═══
  { id:"simplify" as any, name:"简化线", category:"综合", color:"#06B6D4", gradient:["#A5F3FC","#67E8F9","#22D3EE","#06B6D4","#0891B2"], icon:"✂️", shape:"pyramid", studentScore:4, coreScore:4 },
  { id:"practice" as any, name:"实践线", category:"综合", color:"#F97316", gradient:["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C"], icon:"🛠️", shape:"square", studentScore:5, coreScore:5 },
  { id:"compound" as any, name:"复利线", category:"综合", color:"#10B981", gradient:["#A7F3D0","#6EE7B7","#34D399","#10B981","#047857"], icon:"📈", shape:"wave", studentScore:4, coreScore:4 },
  { id:"first_step" as any, name:"行动线", category:"综合", color:"#6366F1", gradient:["#C7D2FE","#A5B4FC","#818CF8","#6366F1","#4338CA"], icon:"🚀", shape:"pill", studentScore:5, coreScore:5 },
]
