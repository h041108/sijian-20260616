// ─── 61条思维线路引擎 ────────────────────────────
// 从用户输入的语言特征自动识别当前思考方式

export type ThinkingLineId =
  // 基础逻辑类
  | "induction" | "deduction" | "causality" | "analogy" | "contrast" | "dialectic" | "reverse"
  // 学习理解类
  | "timeline" | "layers" | "pipeline" | "memory" | "feynman"
  // 创造发散类
  | "divergent" | "convergent" | "association" | "hypothesis"
  // 分析决策类
  | "critical" | "argumentation" | "proscons" | "priority"
  // 系统思维类
  | "cycle" | "system" | "bottleneck"
  // 目标行动类
  | "goal" | "review" | "trialerror"
  // 沟通表达类
  | "narrative" | "qa" | "example" | "visualization" | "structured" | "nvc" | "empathy"
  // 元认知类
  | "metacognition" | "first_principles"
  // 实战应用类
  | "framework" | "probability" | "game_theory" | "ethics"
  // 个体认知类
  | "emotion" | "insight" | "flow"
  // 科学方法类
  | "modeling" | "experiment" | "fast_slow"
  // 习惯能力类
  | "habit" | "deliberate" | "growth" | "feedback"
  // 策略决策类
  | "second_order" | "leverage" | "scenario" | "opportunity_cost" | "counterintuitive"
  // 认知偏误类
  | "blindspot" | "dunning_kruger" | "confirmation_bias"
  // 综合能力类
  | "simplify" | "practice" | "compound" | "first_step"

export interface ThinkingLine {
  id: ThinkingLineId
  name: string
  category: string
  color: string
  gradient: string[]
  icon: string
  shape: string
  studentScore: number
  coreScore: number
}

export interface LineMatch {
  lineId: ThinkingLineId
  confidence: number     // 0-1
  triggers: string[]     // 匹配到的关键词
}

const ALL_LINES: ThinkingLine[] = [
  // ─── 基础逻辑类 ───────────────
  { id:"induction",name:"归纳线",category:"基础逻辑",color:"#6366F1",gradient:["#A78BFA","#818CF8","#6366F1","#4F46E5","#3730A3"],icon:"🟣",shape:"funnel",studentScore:5,coreScore:4 },
  { id:"deduction",name:"演绎线",category:"基础逻辑",color:"#F472B6",gradient:["#F9A8D4","#F472B6","#EC4899","#DB2777","#BE185D"],icon:"🩷",shape:"trapezoid",studentScore:4,coreScore:3 },
  { id:"causality",name:"因果线",category:"基础逻辑",color:"#F59E0B",gradient:["#FCD34D","#FBBF24","#F59E0B","#D97706","#B45309"],icon:"🟡",shape:"arrow",studentScore:5,coreScore:5 },
  { id:"analogy",name:"类比线",category:"基础逻辑",color:"#34D399",gradient:["#6EE7B7","#34D399","#059669","#047857","#064E3B"],icon:"💚",shape:"diamond",studentScore:5,coreScore:5 },
  { id:"contrast",name:"对比线",category:"基础逻辑",color:"#FB923C",gradient:["#FDE68A","#FBBF24","#F97316","#EA580C","#C2410C"],icon:"🟠",shape:"dual",studentScore:5,coreScore:5 },
  // ─── 学习理解类 ───────────────
  { id:"timeline",name:"时间线",category:"学习理解",color:"#14B8A6",gradient:["#99F6E4","#5EEAD4","#14B8A6","#0D9488","#0F766E"],icon:"🩱",shape:"timeline",studentScore:5,coreScore:5 },
  { id:"layers",name:"分层线",category:"学习理解",color:"#06B6D4",gradient:["#CFFAFE","#67E8F9","#22D3EE","#06B6D4","#0284C7"],icon:"🩵",shape:"stack",studentScore:4,coreScore:3 },
  { id:"pipeline",name:"流程线",category:"学习理解",color:"#3B82F6",gradient:["#93C5FD","#60A5FA","#3B82F6","#2563EB","#1E40AF"],icon:"💙",shape:"flow",studentScore:5,coreScore:4 },
  { id:"memory",name:"记忆线",category:"学习理解",color:"#FB7185",gradient:["#FECDD3","#FDA4AF","#FB7185","#F43F5E","#BE123C"],icon:"💗",shape:"curve",studentScore:5,coreScore:5 },
  { id:"feynman",name:"费曼线",category:"学习理解",color:"#EF4444",gradient:["#FCA5A5","#F87171","#EF4444","#DC2626","#991B1B"],icon:"❤️",shape:"bubble",studentScore:5,coreScore:5 },
  // ─── 创造发散类 ───────────────
  { id:"divergent",name:"发散线",category:"创造发散",color:"#8B5CF6",gradient:["#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#6D28D9"],icon:"🟣",shape:"radial",studentScore:5,coreScore:3 },
  { id:"convergent",name:"聚焦线",category:"创造发散",color:"#3B82F6",gradient:["#BFDBFE","#60A5FA","#3B82F6","#2563EB","#1E40AF"],icon:"🔵",shape:"hexagon",studentScore:4,coreScore:4 },
  { id:"association",name:"联想线",category:"创造发散",color:"#A8A29E",gradient:["#D6D3D1","#A8A29E","#78716C","#57534E","#44403C"],icon:"🟤",shape:"jump",studentScore:5,coreScore:3 },
  { id:"hypothesis",name:"假设线",category:"创造发散",color:"#A78BFA",gradient:["#C4B5FD","#A78BFA","#8B5CF6","#6D28D9","#2E1065"],icon:"⚪",shape:"question",studentScore:4,coreScore:3 },
  // ─── 分析决策类 ───────────────
  { id:"critical",name:"批判线",category:"分析决策",color:"#EF4444",gradient:["#FCA5A5","#F87171","#EF4444","#DC2626","#991B1B"],icon:"🔴",shape:"zigzag",studentScore:3,coreScore:4 },
  { id:"argumentation",name:"论证线",category:"分析决策",color:"#22C55E",gradient:["#86EFAC","#4ADE80","#22C55E","#16A34A","#15803D"],icon:"🟢",shape:"pyramid",studentScore:4,coreScore:4 },
  { id:"proscons",name:"利弊线",category:"分析决策",color:"#F97316",gradient:["#FDE68A","#FBBF24","#F97316","#EA580C","#C2410C"],icon:"✳️",shape:"balance",studentScore:5,coreScore:5 },
  { id:"priority",name:"优先级线",category:"分析决策",color:"#F59E0B",gradient:["#FEF08A","#FDE047","#F59E0B","#D97706","#B45309"],icon:"🌀",shape:"quadrant",studentScore:5,coreScore:3 },
  // ─── 系统思维类 ───────────────
  { id:"cycle",name:"循环线",category:"系统思维",color:"#A855F7",gradient:["#E9D5FF","#C084FC","#A855F7","#9333EA","#6B21A8"],icon:"💜",shape:"ring",studentScore:4,coreScore:4 },
  { id:"system",name:"系统线",category:"系统思维",color:"#059669",gradient:["#A7F3D0","#6EE7B7","#34D399","#059669","#047857"],icon:"🌐",shape:"net",studentScore:3,coreScore:3 },
  { id:"bottleneck",name:"瓶颈线",category:"系统思维",color:"#E11D48",gradient:["#FDA4AF","#FB7185","#E11D48","#BE123C","#881337"],icon:"🔶",shape:"hourglass",studentScore:4,coreScore:4 },
  // ─── 目标行动类 ───────────────
  { id:"goal",name:"目标线",category:"目标行动",color:"#10B981",gradient:["#A7F3D0","#6EE7B7","#34D399","#10B981","#047857"],icon:"🎯",shape:"target",studentScore:5,coreScore:5 },
  { id:"review",name:"复盘线",category:"目标行动",color:"#F59E0B",gradient:["#FEF3C7","#FCD34D","#FBBF24","#F59E0B","#D97706"],icon:"🔁",shape:"uturn",studentScore:5,coreScore:5 },
  { id:"trialerror",name:"试错线",category:"目标行动",color:"#EC4899",gradient:["#FDF2F8","#F9A8D4","#F472B6","#DB2777","#831843"],icon:"🔬",shape:"snake",studentScore:4,coreScore:3 },
  // ─── 沟通表达类 ───────────────
  { id:"narrative",name:"叙事线",category:"沟通表达",color:"#14B8A6",gradient:["#99F6E4","#5EEAD4","#14B8A6","#0D9488","#0F766E"],icon:"📖",shape:"arc",studentScore:5,coreScore:3 },
  { id:"qa",name:"问答线",category:"沟通表达",color:"#6366F1",gradient:["#E0E7FF","#C7D2FE","#A5B4FC","#818CF8","#6366F1"],icon:"❓",shape:"qchain",studentScore:5,coreScore:5 },
  { id:"example",name:"举例线",category:"沟通表达",color:"#F97316",gradient:["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C"],icon:"📌",shape:"card",studentScore:5,coreScore:4 },
  { id:"visualization",name:"可视线",category:"沟通表达",color:"#06B6D4",gradient:["#A5F3FC","#67E8F9","#22D3EE","#06B6D4","#0891B2"],icon:"👁️",shape:"axis",studentScore:5,coreScore:5 },
  { id:"dialectic",name:"辩证线",category:"逻辑",color:"#EF4444",gradient:["#FCA5A5","#EF4444","#DC2626","#B91C1C","#991B1B"],icon:"🔄",shape:"scale",studentScore:4,coreScore:4 },
  { id:"reverse",name:"逆向线",category:"逻辑",color:"#3B82F6",gradient:["#93C5FD","#60A5FA","#3B82F6","#2563EB","#1E40AF"],icon:"🔵",shape:"mirror",studentScore:4,coreScore:4 },
  { id:"metacognition",name:"元认知线",category:"元认知",color:"#A855F7",gradient:["#D8B4FE","#C084FC","#A855F7","#9333EA","#6B21A8"],icon:"💜",shape:"mirror",studentScore:3,coreScore:5 },
  { id:"first_principles",name:"第一性原理线",category:"元认知",color:"#78716C",gradient:["#D6D3D1","#A8A29E","#78716C","#57534E","#44403C"],icon:"⚪",shape:"target",studentScore:3,coreScore:5 },
  { id:"framework",name:"框架线",category:"实战",color:"#F97316",gradient:["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C"],icon:"📋",shape:"grid",studentScore:5,coreScore:4 },
  { id:"probability",name:"概率统计线",category:"实战",color:"#14B8A6",gradient:["#99F6E4","#5EEAD4","#14B8A6","#0D9488","#0F766E"],icon:"📊",shape:"wave",studentScore:3,coreScore:4 },
  { id:"game_theory",name:"博弈线",category:"实战",color:"#8B5CF6",gradient:["#C4B5FD","#A78BFA","#8B5CF6","#6D28D9","#5B21B6"],icon:"♟️",shape:"grid",studentScore:3,coreScore:4 },
  { id:"ethics",name:"伦理线",category:"实战",color:"#10B981",gradient:["#A7F3D0","#6EE7B7","#34D399","#10B981","#047857"],icon:"🕊️",shape:"scale",studentScore:3,coreScore:3 },
  { id:"emotion",name:"情绪线",category:"认知",color:"#EF4444",gradient:["#FECACA","#FCA5A5","#EF4444","#DC2626","#991B1B"],icon:"❤️",shape:"heart",studentScore:5,coreScore:3 },
  { id:"insight",name:"洞察线",category:"认知",color:"#F59E0B",gradient:["#FDE68A","#FCD34D","#F59E0B","#D97706","#B45309"],icon:"👁️",shape:"lightning",studentScore:4,coreScore:3 },
  { id:"flow",name:"心流线",category:"认知",color:"#6366F1",gradient:["#C7D2FE","#A5B4FC","#818CF8","#6366F1","#4338CA"],icon:"🌊",shape:"wave",studentScore:4,coreScore:3 },
  { id:"modeling",name:"建模线",category:"科学",color:"#06B6D4",gradient:["#A5F3FC","#67E8F9","#22D3EE","#06B6D4","#0891B2"],icon:"📐",shape:"pyramid",studentScore:3,coreScore:4 },
  { id:"experiment",name:"实验线",category:"科学",color:"#22C55E",gradient:["#BBF7D0","#86EFAC","#4ADE80","#22C55E","#15803D"],icon:"🧪",shape:"pill",studentScore:4,coreScore:4 },
  { id:"fast_slow",name:"快慢思考线",category:"科学",color:"#F59E0B",gradient:["#FDE68A","#FCD34D","#F59E0B","#D97706","#B45309"],icon:"⚡",shape:"lightning",studentScore:3,coreScore:4 },
  { id:"habit",name:"习惯线",category:"能力",color:"#10B981",gradient:["#A7F3D0","#6EE7B7","#34D399","#10B981","#047857"],icon:"🔄",shape:"ring",studentScore:5,coreScore:3 },
  { id:"deliberate",name:"刻意练习线",category:"能力",color:"#F97316",gradient:["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C"],icon:"🎯",shape:"target",studentScore:5,coreScore:4 },
  { id:"growth",name:"成长思维线",category:"能力",color:"#34D399",gradient:["#D1FAE5","#A7F3D0","#6EE7B7","#34D399","#059669"],icon:"🌱",shape:"seed",studentScore:5,coreScore:4 },
  { id:"feedback",name:"反馈线",category:"能力",color:"#8B5CF6",gradient:["#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#6D28D9"],icon:"🔄",shape:"ring",studentScore:4,coreScore:4 },
  { id:"structured",name:"结构化表达线",category:"表达",color:"#3B82F6",gradient:["#BFDBFE","#93C5FD","#60A5FA","#3B82F6","#1E40AF"],icon:"🏗️",shape:"pyramid",studentScore:5,coreScore:4 },
  { id:"nvc",name:"非暴力沟通线",category:"表达",color:"#10B981",gradient:["#A7F3D0","#6EE7B7","#34D399","#10B981","#047857"],icon:"☮️",shape:"bubble",studentScore:4,coreScore:3 },
  { id:"empathy",name:"换位思考线",category:"表达",color:"#EC4899",gradient:["#FBCFE8","#F9A8D4","#F472B6","#EC4899","#BE185D"],icon:"🫂",shape:"bubble",studentScore:5,coreScore:4 },
  { id:"second_order",name:"二阶思维线",category:"策略",color:"#8B5CF6",gradient:["#DDD6FE","#C4B5FD","#A78BFA","#8B5CF6","#6D28D9"],icon:"🔮",shape:"domino",studentScore:3,coreScore:5 },
  { id:"leverage",name:"杠杆线",category:"策略",color:"#F59E0B",gradient:["#FDE68A","#FCD34D","#F59E0B","#D97706","#B45309"],icon:"⚙️",shape:"lever",studentScore:4,coreScore:4 },
  { id:"scenario",name:"情景线",category:"策略",color:"#EC4899",gradient:["#FBCFE8","#F9A8D4","#F472B6","#EC4899","#BE185D"],icon:"🎭",shape:"fork",studentScore:4,coreScore:4 },
  { id:"opportunity_cost",name:"机会成本线",category:"策略",color:"#F97316",gradient:["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C"],icon:"💰",shape:"fork",studentScore:4,coreScore:4 },
  { id:"counterintuitive",name:"反直觉线",category:"策略",color:"#8B5CF6",gradient:["#E9D5FF","#D8B4FE","#C084FC","#A855F7","#9333EA"],icon:"🔄",shape:"lightning",studentScore:3,coreScore:4 },
  { id:"blindspot",name:"盲点线",category:"偏误",color:"#EF4444",gradient:["#FECACA","#FCA5A5","#EF4444","#DC2626","#991B1B"],icon:"👁️‍🗨️",shape:"triangle",studentScore:3,coreScore:5 },
  { id:"dunning_kruger",name:"自知线",category:"偏误",color:"#78716C",gradient:["#D6D3D1","#A8A29E","#78716C","#57534E","#44403C"],icon:"📉",shape:"wave",studentScore:3,coreScore:4 },
  { id:"confirmation_bias",name:"证实偏差线",category:"偏误",color:"#F59E0B",gradient:["#FDE68A","#FCD34D","#F59E0B","#D97706","#B45309"],icon:"🚫",shape:"mirror",studentScore:3,coreScore:5 },
  { id:"simplify",name:"简化线",category:"综合",color:"#06B6D4",gradient:["#A5F3FC","#67E8F9","#22D3EE","#06B6D4","#0891B2"],icon:"✂️",shape:"pyramid",studentScore:4,coreScore:4 },
  { id:"practice",name:"实践线",category:"综合",color:"#F97316",gradient:["#FED7AA","#FDBA74","#FB923C","#F97316","#EA580C"],icon:"🛠️",shape:"square",studentScore:5,coreScore:5 },
  { id:"compound",name:"复利线",category:"综合",color:"#10B981",gradient:["#A7F3D0","#6EE7B7","#34D399","#10B981","#047857"],icon:"📈",shape:"wave",studentScore:4,coreScore:4 },
  { id:"first_step",name:"行动线",category:"综合",color:"#6366F1",gradient:["#C7D2FE","#A5B4FC","#818CF8","#6366F1","#4338CA"],icon:"🚀",shape:"pill",studentScore:5,coreScore:5 },
]

// ─── 第1层：语言特征匹配 ───────────────────────

interface PatternRule {
  keywords: string[]
  weight: number
}

const LINE_PATTERNS: Record<ThinkingLineId, PatternRule[]> = {
  induction: [
    { keywords:["总结","归纳","规律","发现","一般来说","由此得出","经验","共性","共同点","普遍","模式"], weight:1 },
  ],
  deduction: [
    { keywords:["推导","根据","按照","因为...所以","由...得","已知","定理","公式","原理","前提","推论"], weight:1 },
  ],
  causality: [
    { keywords:["原因","导致","因为","所以","影响","造成","后果","结果","根源","为什么","因素","引发了"], weight:1 },
  ],
  analogy: [
    { keywords:["就像","好比","类似","相当于","比喻","像...一样","打个比方","如同"], weight:1 },
  ],
  contrast: [
    { keywords:["对比","区别","不同","差异","比较","相反","不一样","vs","versus","而","然而","但是","另一方面"], weight:1 },
  ],
  timeline: [
    { keywords:["以前","过去","曾经","将来","未来","后来","历史","时间线","发展","演变","趋势"], weight:1 },
  ],
  layers: [
    { keywords:["层次","分层","层面","级别","上层","下层","底层","顶层","维度","角度"], weight:1 },
  ],
  pipeline: [
    { keywords:["步骤","先","然后","接着","最后","第一步","第二步","流程","顺序","方法"], weight:1 },
  ],
  memory: [
    { keywords:["记住","忘记","复习","记忆","遗忘","艾宾浩斯","背诵","背","忘了","记不住"], weight:1 },
  ],
  feynman: [
    { keywords:["讲给别人","用...话解释","简单说","教别人","给...听","通俗","白话","用...话说"], weight:1 },
  ],
  divergent: [
    { keywords:["发散","头脑风暴","随便","什么都可以","可能","各种","任意","所有","一切可能","不妨"], weight:1 },
  ],
  convergent: [
    { keywords:["聚焦","核心","关键","最","归根结底","关键是","本质上","最重要的是","说到底是"], weight:1 },
  ],
  association: [
    { keywords:["联想到","突然想到","......","等等","说起"], weight:1 },
  ],
  hypothesis: [
    { keywords:["如果","假设","假如","要是","万一","会不会","难道"], weight:1 },
  ],
  critical: [
    { keywords:["质疑","不对","有漏洞","反驳","问题在于","但是","错误","批评","有问题","值得怀疑"], weight:1 },
  ],
  argumentation: [
    { keywords:["论证","论据","论点","证明","证据","因为","数据显示","事实证明","支持"], weight:1 },
  ],
  proscons: [
    { keywords:["利弊","优劣","好处","坏处","优点","缺点","选A","选B","综合","权衡"], weight:1 },
  ],
  priority: [
    { keywords:["优先","排序","重要","紧急","不重要","不紧急","先做","后做","四象限"], weight:1 },
  ],
  cycle: [
    { keywords:["循环","循环","闭环","反馈","越...越","回到","周而复始","轮回"], weight:1 },
  ],
  system: [
    { keywords:["系统","整体","全局","网络","联系","互联","交互","依赖","生态"], weight:1 },
  ],
  bottleneck: [
    { keywords:["瓶颈","限制","卡住","制约","约束","障碍","最大的问题","根本问题"], weight:1 },
  ],
  goal: [
    { keywords:["目标","计划","分解","达成","实现","做到","做到","完成","达到"], weight:1 },
  ],
  review: [
    { keywords:["复盘","回顾","总结","反思","吸取教训","上次","这次要"], weight:1 },
  ],
  trialerror: [
    { keywords:["试试","尝试","实验","试错","调试","debug","不行就换","调整"], weight:1 },
  ],
  narrative: [
    { keywords:["故事","开头","结尾","高潮","转折","铺垫","叙述","情节","起承转合"], weight:1 },
  ],
  qa: [
    { keywords:["为什么","怎么","什么是","什么样","哪里","什么时候","谁","哪一个","如何"], weight:1 },
  ],
  example: [
    { keywords:["例如","比如","举个例子","比如说","举例","来说"], weight:1 },
  ],
  visualization: [
    { keywords:["坐标系","图表","可视化"], weight:1 },
  ],
  // ═══ 32条新线路关键词 ═══
  dialectic: [{keywords:["对立","矛盾","转化","一面","另一面","既","又","相反相成"],weight:2}],
  reverse: [{keywords:["反过来","倒推","如果不想","相反方向","镜像"],weight:2}],
  metacognition: [{keywords:["我为什么这样想","反思","审视自己的想法","思考过程","觉察","我怎么想","思考方式","元认知"],weight:3}],
  first_principles: [{keywords:["本质","根本原因","底层逻辑","拆到不可再拆","最基础","回归"],weight:2}],
  framework: [{keywords:["SWOT","5W1H","PEST","框架","模型","MECE","分析维度"],weight:2}],
  probability: [{keywords:["概率","可能性","统计","大多数","平均","风险"],weight:2}],
  game_theory: [{keywords:["对手","策略","博弈","如果对方","竞争","合作"],weight:2}],
  ethics: [{keywords:["道德","伦理","对还是错","价值观","责任","应该"],weight:2}],
  emotion: [{keywords:["焦虑","害怕","开心","难过","烦躁","情绪","感觉","我觉得"],weight:2}],
  insight: [{keywords:["突然想到","灵光一闪","本质上","意识到","灵感"],weight:2}],
  flow: [{keywords:["心流","太简单了","太难了","刚刚好","专注状态","投入进去","挑战能力","难度合适"],weight:3}],
  modeling: [{keywords:["抽象","模型","公式","系统","此系统","建模"],weight:2}],
  experiment: [{keywords:["假设","验证","数据","测试","对照","观察","实验"],weight:2}],
  fast_slow: [{keywords:["直觉","第一反应","仔细想想","慢下来","下意识"],weight:2}],
  habit: [{keywords:["习惯","每天","坚持","复利","积累","一次次"],weight:2}],
  deliberate: [{keywords:["反复","刻意","薄弱","针对","提升","训练"],weight:2}],
  growth: [{keywords:["还不会","暂时","还没","可以学","尝试","成长"],weight:2}],
  feedback: [{keywords:["反馈","建议","别人说","评价","改进","调整"],weight:2}],
  structured: [{keywords:["先说结论","三点","第一","第二","第三","金字塔","总结"],weight:2}],
  nvc: [{keywords:["感受","需要","请求","观察","沟通","非暴力"],weight:2}],
  empathy: [{keywords:["站在对方","从ta","如果我是","理解别人","换位"],weight:2}],
  second_order: [{keywords:["然后会怎样","再往后会","长期来看","后果的后果","二阶效应","连锁反应","间接影响","长远看"],weight:3}],
  leverage: [{keywords:["最大回报","关键点","杠杆","投入产出","事半功倍"],weight:2}],
  scenario: [{keywords:["最好情况","最差情况","多种可能","万一","不同情况"],weight:1}],
  opportunity_cost: [{keywords:["放弃","代价","机会成本","值不值得","选择"],weight:1}],
  counterintuitive: [{keywords:["实际上","其实","相反","跟直觉相反","没想到"],weight:1}],
  blindspot: [{keywords:["没看到","盲点","遗漏","忽略了","还有别的"],weight:1}],
  dunning_kruger: [{keywords:["自信","其实我不懂","知道得越多","以为自己会了","无知","我以为"],weight:1}],
  confirmation_bias: [{keywords:["早就知道","果然不出所料","支持我的证据","相反的证据"],weight:1}],
  simplify: [{keywords:["简化","本质","一句话","核心","去掉多余的"],weight:1}],
  practice: [{keywords:["试试","动手","做一遍","实操","执行","落地"],weight:1}],
  compound: [{keywords:["正向循环","越做越好","越来越容易","雪球效应","指数增长","滚雪球","良性循环","自我增强"],weight:3}],
  first_step: [{keywords:["第一步做什么","从哪开始","现在就开始","立即行动","该怎么开始","先做什么","起步","入门"],weight:3}],
}

// ─── 检测函数 ─────────────────────────────────

export function detectThinkingLines(input: string): LineMatch[] {
  const results: LineMatch[] = []

  for (const [lineId, patterns] of Object.entries(LINE_PATTERNS)) {
    const matched: string[] = []
    let totalWeight = 0

    for (const pattern of patterns) {
      for (const kw of pattern.keywords) {
        if (input.includes(kw)) {
          matched.push(kw)
          // 高权重关键词加成：weight³ 让精准匹配大幅领先泛化匹配
          totalWeight += pattern.weight * pattern.weight
        }
      }
    }

    if (matched.length > 0) {
      // 置信度 = 匹配权重的平方根缩放 + 匹配数量加成
      const rawConf = (totalWeight / 200)
      const matchBonus = Math.min(matched.length * 0.03, 0.15)
      const confidence = Math.min(1, rawConf + matchBonus)
      results.push({ lineId: lineId as ThinkingLineId, confidence, triggers: matched })
    }
  }

  // 按置信度排序
  results.sort((a, b) => b.confidence - a.confidence)

  // 如果没有匹配，默认问答线+因果线
  if (results.length === 0) {
    results.push({ lineId:"qa", confidence:0.5, triggers:["默认"] })
    if (input.includes("？") || input.includes("?")) {
      results.push({ lineId:"causality", confidence:0.3, triggers:["疑问"] })
    }
  }

  return results
}

export function getLineInfo(lineId: ThinkingLineId): ThinkingLine | undefined {
  return ALL_LINES.find(l => l.id === lineId)
}

export function getAllLines(): ThinkingLine[] {
  return ALL_LINES
}

export function getLinesByCategory(): Record<string, ThinkingLine[]> {
  const cats: Record<string, ThinkingLine[]> = {}
  for (const line of ALL_LINES) {
    if (!cats[line.category]) cats[line.category] = []
    cats[line.category].push(line)
  }
  return cats
}

// ─── 第2层：用户画像 ───────────────────────────

export interface LineUsageProfile {
  lineId: ThinkingLineId
  count: number
  percentage: number
  recentCount: number  // 最近7天
  trend: "up" | "down" | "stable"
}

const PROFILE_KEY = "sijian_line_profile"

export function updateLineProfile(lineId: ThinkingLineId): LineUsageProfile[] {
  if (typeof window === "undefined") return []

  const raw = localStorage.getItem(PROFILE_KEY)
  const data: Record<string, { total: number; recent: Record<string, number> }> = raw ? JSON.parse(raw) : {}

  if (!data[lineId]) data[lineId] = { total: 0, recent: {} }
  data[lineId].total++

  const today = new Date().toISOString().slice(0, 10)
  data[lineId].recent[today] = (data[lineId].recent[today] || 0) + 1

  localStorage.setItem(PROFILE_KEY, JSON.stringify(data))

  return getLineProfile()
}

export function getLineProfile(): LineUsageProfile[] {
  if (typeof window === "undefined") return getAllLines().map(l => ({ lineId: l.id, count: 0, percentage: 0, recentCount: 0, trend: "stable" }))

  const raw = localStorage.getItem(PROFILE_KEY)
  const data: Record<string, { total: number; recent: Record<string, number> }> = raw ? JSON.parse(raw) : {}
  const total = Object.values(data).reduce((s, d) => s + d.total, 0)

  const today = new Date()
  const sevenDaysAgo = new Date(today.getTime() - 7 * 86400000).toISOString().slice(0, 10)

  return getAllLines().map(line => {
    const d = data[line.id] || { total: 0, recent: {} }
    const recentCount = Object.entries(d.recent)
      .filter(([date]) => date >= sevenDaysAgo)
      .reduce((s, [, c]) => s + c, 0)
    return {
      lineId: line.id,
      count: d.total,
      percentage: total > 0 ? d.total / total * 100 : 0,
      recentCount,
      trend: "stable",
    }
  })
}
