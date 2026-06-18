// ─── 思见 B端 AI 助手 — 知识库 ────────────────────────
// 涵盖所有 B 端模块的使用指南和常见问题
// 当AI无法解答时自动记录为特征请求

export const B_END_KNOWLEDGE: Record<string, ModuleGuide> = {
  // ── 核心工具 ──
  knowledge: {
    id: "knowledge",
    label: "知识构建",
    icon: "📐",
    usage: "知识构建是知识空间生成器。在输入框中输入你的主题（教育端：科目+年级；企业端：行业+产品），上传或拖拽资料文件到页面，点击构建按钮，AI 将自动生成结构化的知识空间。支持上传图片、PDF、文档。",
    steps: ["1. 输入主题（教育：科目+年级；企业：行业+产品）", "2. 拖拽或粘贴上传参考文件", "3. 点击「构建知识空间」", "4. AI 生成思维节点和关系图"],
    commonQuestions: [
      { q: "如何上传文件？", a: "直接拖拽文件到页面，或 Ctrl+V 粘贴截图，支持图片、PDF、TXT 等格式。" },
      { q: "知识空间可以编辑吗？", a: "生成后可以在思维空间视图中拖拽节点调整位置，点击节点查看详细内容。" },
      { q: "企业端和教育的知识构建有什么区别？", a: "企业端用行业+产品来组织知识，教育端用科目+年级。生成逻辑相同，标签不同。" },
    ],
  },
  solve: {
    id: "solve", label: "解题引擎", icon: "✏️",
    usage: "解题引擎用于拍照或上传试卷/题目图片，AI 自动识别并逐题展示解题思路和答案。仅教育端可见。",
    steps: ["1. 上传题目图片（拖拽/粘贴/点击上传）", "2. 在输入框补充你的解题要求", "3. 点击「解答」", "4. AI 逐题展示推导过程+答案"],
    commonQuestions: [
      { q: "支持什么类型的题目？", a: "支持数学、物理、化学、生物等学科的题目。建议图片清晰、文字可辨。" },
      { q: "图片识别不准怎么办？", a: "可以在输入框中用文字描述题目内容作为补充，AI 会结合图片和文字一起分析。" },
    ],
  },
  training: {
    id: "training", label: "思维训练", icon: "🧠",
    usage: "思维训练分教育端（记忆宫殿）和企业端（企业培训系统）。教育端基于艾宾浩斯遗忘曲线的概念复习系统；企业端包含培训模块管理、员工进度追踪和结业考核。",
    steps: [
      "教育端：选择学生 → 查看掌握度 → 标记复习完成 → 查看遗忘曲线",
      "企业端：创建培训模块 → 添加知识点 → 分配员工 → 员工学习+考核 → 查看培训分析"
    ],
    commonQuestions: [
      { q: "记忆宫殿的复习间隔是怎么设定的？", a: "遵循艾宾浩斯遗忘曲线：1天、3天、7天、30天、90天、180天、365天。" },
      { q: "如何创建培训考核？", a: "创建培训模块时，每个知识点会自动生成对应的选择题。在考核中心选择员工和模块，即可开始考核。" },
      { q: "员工进度数据存在哪里？", a: "所有培训数据存储在浏览器的 localStorage 中，正式版将迁移到云端数据库。" },
    ],
  },
  heatmap: {
    id: "heatmap", label: "课堂热力", icon: "🌡️",
    usage: "课堂热力图展示全班学生的实时思维状态分布（跟上、走偏、超前、卡住、未活跃）。每30秒自动刷新。仅教育端可见。",
    steps: ["1. 先在成员管理中创建班级并让学生加入", "2. 进入课堂热力 → 选择班级", "3. 可选输入当前教学主题来做概念关联", "4. 查看学生状态网格/概念热力图/分析面板"],
    commonQuestions: [
      { q: "热力图多久更新一次？", a: "每30秒自动刷新。你也可以手动点击刷新按钮。" },
      { q: "如何判断学生'卡住了'？", a: "系统根据掌握度、活跃时间、概念相关度自动推断。掌握度<30%且已学习3个以上概念标记为'卡住'。" },
    ],
  },
  institution: {
    id: "institution", label: "机构SaaS", icon: "🏫",
    usage: "机构SaaS是教育培训机构的运营管理中心：教师管理、学生管理、共享知识库、品牌设置、账单记录。首次进入需创建机构账号。",
    steps: [
      "1. 点击创建机构账号 → 填写名称/选择套餐/选培训科目",
      "2. 教师管理：生成教师邀请码 → 老师凭码加入",
      "3. 学生管理：生成学生邀请码 → 学生凭码加入",
      "4. 知识库：添加共享内容 → 发布后全员可见",
      "5. 品牌设置：机构名称/Logo/品牌色",
      "6. 账单记录：查看缴费历史，续费"
    ],
    commonQuestions: [
      { q: "标准版和旗舰版有什么区别？", a: "标准版¥299/月（5教师·500知识空间），旗舰版¥999/月（20教师·无限·API·白标）。" },
      { q: "教师邀请码只能用一次吗？", a: "对，每个教师邀请码一人一码。学生邀请码则可以设置最多邀请人数。" },
    ],
  },
  orchestrator: {
    id: "orchestrator", label: "模型编排", icon: "🔧",
    usage: "模型编排引擎管理接入思见的所有AI模型。支持智能路由（按任务分类自动选最优模型）、多模型流水线（生成→批判→润色）、性能追踪、路由测试。",
    steps: ["1. 在环境变量中配置 API Key（DeepSeek/Claude/OpenAI）", "2. 进入模型状态页面查看各模型状态", "3. 路由测试：输入消息→查看任务分类和路由决策", "4. 性能历史：追踪每个模型的延迟和成功率"],
    commonQuestions: [
      { q: "只配了DeepSeek能用吗？", a: "可以，C端走单模型直连。加了Claude/OpenAI的Key后，重要文案会自动启用多模型交叉验证。" },
      { q: "如何切换默认模型？", a: "在 Vercel 环境变量中修改 DEEPSEEK_MODEL 的值即可。" },
    ],
  },
  intelligence: {
    id: "intelligence", label: "机构智能", icon: "🧬",
    usage: "机构智能是企业的知识资产管理系统。四个面板：知识图谱（Token资本vs人力资本对比）、私有评估（自定义业务指标+AI影响力追踪）、复利指数（知识增长率可视化）、知识导出（模型无关JSON格式）。",
    steps: [
      "知识图谱：查看全机构已编码的概念数/工作流/决策记录",
      "私有评估：创建自定义业务指标 → 定期更新值 → 追踪AI对业务的影响",
      "复利指数：查看本月知识增长率、人力vsToken对比、翻倍时间预测",
      "知识导出：一键导出全机构知识为JSON → 可导入其他环境"
    ],
    commonQuestions: [
      { q: "Token资本是什么？", a: "Token资本是你公司已编码到思见平台的知识资产总和——概念、工作流、决策记录。它独立于任何员工，不会随人员离职而消失。" },
      { q: "如何设置私有业务指标？", a: "点击新建指标 → 填写名称/类别/单位/目标值 → 创建后在日常工作中更新数值 → 系统自动计算AI对指标的提升幅度。" },
    ],
  },
  strategy: {
    id: "strategy", label: "战略增长", icon: "🚀",
    usage: "战略增长包含六个业务增长工具：学生成长对比报告、岗位/教师知识克隆、AI成熟度诊断、思维教案/培训方案生成、家长每周简报、企业能力可视化名片。教育端和企业端各取所需。",
    steps: [
      "学生成长对比：选学生→选周期→查看五维成长雷达+AI总结+家长建议",
      "知识克隆：定义岗位/教师→点击捕获→克隆到新员工/新教师",
      "AI成熟度诊断：自动分析→五维评分→优劣势→12周路线图→ROI预估",
      "教案生成：输入主题→教育端选学科年级/企业端选培训类别→生成完整方案",
      "家长周报：选孩子→自动生成本周思维简报",
      "企业名片：生成数据驱动的能力展示页"
    ],
    commonQuestions: [
      { q: "知识克隆怎么用？", a: "在捕获面板输入岗位名称和部门（或教师和科目），点击捕获，系统自动提取该岗位的所有知识资产。再输入目标员工姓名（或新教师姓名），点击克隆即可将知识一键转移。" },
      { q: "AI成熟度诊断的依据是什么？", a: "诊断基于L1-L5五层能力的实际使用数据：L1数据安全(安全沙盘通过率)、L2工具力(Prompt练习完成率)、L3判断力(挑战通过率)、L4协作(工作流数量)、L5组织认知(决策记录数)。" },
      { q: "教案生成器和培训方案生成器有什么区别？", a: "教育端（教师身份登录）显示教案生成器，选学科+年级。企业端显示培训方案生成器，可选入职培训/产品知识/技能提升/管理培训/合规培训/销售培训六类，每类有对应的五阶段模板。" },
    ],
  },
  video_factory: {
    id: "video_factory", label: "视频工厂", icon: "🎬",
    usage: "视频工厂是一句话→完整视频的六阶段流水线：故事创世→分镜拆解→提示词工程→视觉生成→音频制作→最终合成。每阶段可独立执行，亦可一键全流程。内置脚本质检。",
    steps: [
      "1. 新建项目：输入一句话创意+选择类型/风格/时长/画幅",
      "2. 点击项目进入流水线面板",
      "3. 逐阶段执行（故事创世→分镜拆解→提示词工程→视觉生成→音频→合成）",
      "4. 故事创世和分镜完成后，自动出现内置质检摘要",
      "5. 查看每个阶段的输出结果"
    ],
    commonQuestions: [
      { q: "视觉生成和最终合成为什么显示占位？", a: "这两个阶段需要配置对应的AI模型API Key（Midjourney/即梦/Kling/豆包TTS等）才能实际运行，演示模式下显示占位。" },
      { q: "剧本不好的话会被检测出来吗？", a: "故事创世和分镜拆解完成后，系统自动对输出进行思维质检——评分、逻辑跳跃检测、情绪曲线分析、建议时长。这是视频工厂的内置功能，无需单独打开。" },
    ],
  },
  persona: {
    id: "persona", label: "人格模板", icon: "🎭",
    usage: "AI人格库提供7个预设角色（数学导师、写作教练、批判性朋友、面试对练、产品参谋、编程伙伴、人生向导）。每个角色有独立的系统提示词、思维线路偏好和框架风格。Prompt模板引擎提供4套参数化模板（教案、竞品分析、述职、学生报告）。认知API可将思维诊断以JSON形式输出。",
    steps: [
      "人格库：浏览角色→点击查看详情→复制System Prompt到C端使用",
      "模板引擎：选择模板→填写参数→预览Prompt→执行生成内容",
      "认知API：查看文档→测试端点→/api/cognition直接调用"
    ],
    commonQuestions: [
      { q: "人格库的角色可以在C端直接切换吗？", a: "目前需要手动复制Prompt。未来版本会支持一键切换。" },
      { q: "认知API的调用成本？", a: "纯本地引擎运行，零API调用成本，每月免费10万次。" },
    ],
  },
  metro: {
    id: "metro", label: "思维地铁", icon: "🚇",
    usage: "思维地铁是一个独立的3D思维可视化页面，通过iframe嵌入。用于展示复杂的思维网络和知识关联。",
    steps: ["点击思维地铁即可浏览"],
    commonQuestions: [],
  },
  content: {
    id: "content", label: "内容策略", icon: "🎬",
    usage: "内容策略是一个4步引擎：发散创意（50个内容主题）→ 收敛筛选（精简到5个）→ 叙事结构（设计完整叙事）→ 复盘优化。每步调用AI生成。仅企业端可见。",
    steps: ["1. 输入行业+产品", "2. 点击步骤1：发散创意", "3. 点击步骤2：收敛筛选", "4. 点击步骤3：叙事结构", "5. 点击步骤4：复盘优化"],
    commonQuestions: [
      { q: "每一步要多久？", a: "每步调用AI约10-30秒，取决于内容复杂度。" },
    ],
  },
  experiment: {
    id: "experiment", label: "验证实验", icon: "🧪",
    usage: "验证实验用于对比'用模板'和'不用模板'的任务表现差异。选择任务→选择模式→计时完成→自评→查看统计。仅企业端可见。",
    steps: ["1. 选择任务（客服/评估/演示/分析）", "2. 选择模式（用模板/不用模板）", "3. 计时完成", "4. 自评→提交→查看对比数据"],
    commonQuestions: [],
  },
  ai_capability: {
    id: "ai_capability", label: "AI能力建设", icon: "🚀",
    usage: "AI能力建设是企业的五层AI素养培训体系：L1数据安全沙盘(15个场景推演)、L2 Prompt工程训练(8个实战练习+AI实时反馈)、L3 AI判断力挑战(6个批判审阅练习)、L4人机协作工作流(3个预置模板+自定义设计+逐步执行)、L5组织认知(决策追溯+知识流动+组织认知报告)。",
    steps: [
      "L1：选择安全场景→阅读情境→做出选择→查看对错和法规依据",
      "L2：选择练习→写Prompt→发送给AI看实际效果→AI导师评分",
      "L3：阅读AI输出→找出隐藏错误→揭示真实答案→反思",
      "L4：使用预置模板→切换到运行模式→逐步执行每个节点(AI自执行/人工输入/审核通过)",
      "L5：记录决策→复盘→追踪知识流动→生成组织认知报告"
    ],
    commonQuestions: [
      { q: "L2的Prompt训练有真实AI反馈吗？", a: "有。你的Prompt会真正发给AI，看到AI的实际回复。还可以用优秀示例也发一次做并排对比。AI导师会按评分维度给你打分和建议。" },
      { q: "L4工作流能真正执行吗？", a: "能。切换到运行模式后，点击下一步逐个执行节点。AI节点自动调用API，人工节点弹出输入框，审核节点有通过/驳回。执行完成后显示节点完成数+AI调用数+总耗时。" },
    ],
  },

  // ── 数据管理 ──
  dashboard: {
    id: "dashboard", label: "团队仪表盘", icon: "📊",
    usage: "团队仪表盘提供教育端（班级/学生/掌握度）和企业端（组织/成员/培训进度）的数据总览。",
    steps: ["教育端：查看班级数/学生数/掌握度/待复习", "企业端：查看组织数/成员数/培训模块完成率"],
    commonQuestions: [],
  },
  members: {
    id: "members", label: "成员管理", icon: "👥",
    usage: "成员管理用于创建班级/组织并生成邀请码，管理教师/学生/员工名单。",
    steps: [
      "教育端：创建班级（填名称/科目/年级）→ 生成邀请码 → 学生凭码加入",
      "企业端：创建组织（填名称）→ 生成邀请码 → 教师/员工凭码加入"
    ],
    commonQuestions: [
      { q: "邀请码是几位？", a: "6位数字。教育端教师码一人一码，学生码可多人共用。" },
    ],
  },
  reports: {
    id: "reports", label: "成长报告", icon: "📈",
    usage: "成长报告提供教育端（概念掌握分析+思维成长轨迹）和企业端（培训数据+L1-L3进度+部门统计+机构营收）的数据分析。",
    steps: [
      "教育端：切换概念掌握分析/思维成长轨迹两个视图",
      "企业端：查看培训模块完成率/AI能力建设进度/薄弱知识点/部门统计"
    ],
    commonQuestions: [],
  },
  settings: {
    id: "settings", label: "空间配置", icon: "⚙️",
    usage: "空间配置用于设置空间名称、默认思维框架、数据导出和重置。",
    steps: ["设置空间名称 → 选择默认框架 → 开启/关闭自动保存 → 保存配置", "数据管理：导出所有数据为JSON → 或重置清空所有数据"],
    commonQuestions: [
      { q: "重置数据会删掉什么？", a: "会清空记忆宫殿、用户数据、班级/组织、培训记录等所有localStorage数据。操作不可撤销。" },
    ],
  },
}

export interface ModuleGuide {
  id: string
  label: string
  icon: string
  usage: string
  steps: string[]
  commonQuestions: { q: string; a: string }[]
}

// ═══════════════════════════════════════════════════
// 特征请求记录器
// ═══════════════════════════════════════════════════

export interface FeatureRequest {
  id: string
  userMessage: string
  module: string
  requestedAt: string
  status: "pending" | "implemented" | "rejected"
  notes: string
}

const REQUESTS_KEY = "sijian_feature_requests"

export function logFeatureRequest(userMessage: string, module: string): void {
  if (typeof window === "undefined") return
  try {
    const existing = JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]") as FeatureRequest[]
    existing.push({
      id: `fr_${Date.now()}`,
      userMessage: userMessage.slice(0, 200),
      module,
      requestedAt: new Date().toISOString(),
      status: "pending",
      notes: "",
    })
    localStorage.setItem(REQUESTS_KEY, JSON.stringify(existing.slice(-50)))
  } catch {}
}

export function loadFeatureRequests(): FeatureRequest[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(REQUESTS_KEY) || "[]") } catch { return [] }
}

export function getTopRequestedFeatures(): { module: string; count: number }[] {
  const requests = loadFeatureRequests().filter(r => r.status === "pending")
  const map = new Map<string, number>()
  for (const r of requests) {
    map.set(r.module, (map.get(r.module) || 0) + 1)
  }
  return Array.from(map.entries())
    .map(([module, count]) => ({ module, count }))
    .sort((a, b) => b.count - a.count)
}
