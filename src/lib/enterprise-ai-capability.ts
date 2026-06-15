// ─── 企业AI能力建设：五层能力体系 ────────────────────
// L1 数据安全 · L2 AI工具力 · L3 AI判断力 · L4 人机协作 · L5 组织认知

// ═══════════════════════════════════════════════════
// L1: 数据与安全意识 — 沙盘推演
// ═══════════════════════════════════════════════════

export interface SecurityScenario {
  id: string
  title: string
  context: string           // 情景描述
  scene: string             // "你正在..." 代入感描述
  category: "数据分级" | "密码安全" | "钓鱼攻击" | "设备安全" | "社会工程" | "AI合规" | "应急响应"
  difficulty: "初级" | "中级" | "高级"
  choices: ScenarioChoice[]
  correctIndex: number
  explanation: string       // 为什么这个答案是对的
  consequence: string       // 选错的后果
  regulation?: string       // 相关法规条款
}

export interface ScenarioChoice {
  text: string
  reasoning: string         // 这个选项背后的思考
}

export interface SecurityAttempt {
  id: string
  scenarioId: string
  employeeId: string
  chosenIndex: number
  correct: boolean
  timestamp: string
  timeSpent: number         // 秒
}

// ═══════════════════════════════════════════════════
// L2: Prompt 工程训练
// ═══════════════════════════════════════════════════

export type PromptPattern =
  | "链式思维" | "角色扮演" | "少样本学习" | "分步拆解"
  | "格式化输出" | "反面约束" | "上下文注入" | "批判性反思"

export interface PromptExercise {
  id: string
  title: string
  description: string
  pattern: PromptPattern
  difficulty: "入门" | "进阶" | "高级"
  task: string              // 用户要完成的任务
  context: string           // 任务背景
  aiTool: string            // 推荐使用的 AI 工具
  goodExample: string       // 好的 Prompt 示例
  badExample: string        // 差的 Prompt 示例
  scoringRubric: { criterion: string; weight: number }[]
  hints: string[]           // 逐步提示
}

export interface PromptSubmission {
  id: string
  exerciseId: string
  employeeId: string
  prompt: string
  aiResponse?: string
  selfScore: number         // 0-1
  peerReviewed: boolean
  timestamp: string
}

// ═══════════════════════════════════════════════════
// L3: AI 判断与决策力
// ═══════════════════════════════════════════════════

export type ChallengeType = "事实准确性" | "逻辑推理" | "偏见检测" | "时效性" | "数据来源" | "魔鬼代言人"

export interface JudgmentChallenge {
  id: string
  title: string
  type: ChallengeType
  difficulty: "初级" | "中级" | "高级"
  scenario: string          // 场景描述
  aiOutput: string          // AI 生成的内容（包含错误）
  hiddenErrors: {
    description: string     // 错误描述
    location: string        // 在内容中的位置提示
    severity: "致命" | "严重" | "轻微"
    correction: string      // 正确应该是什么
  }[]
  reflectionQuestions: string[]  // 反思问题
  keyTakeaway: string
}

export interface JudgmentAttempt {
  id: string
  challengeId: string
  employeeId: string
  errorsFound: number
  totalErrors: number
  confidence: number        // 0-1 用户对自己判断的信心
  timeSpent: number
  passed: boolean
  timestamp: string
}

// ═══════════════════════════════════════════════════
// L4: 人机协作工作流
// ═══════════════════════════════════════════════════

export type WorkflowNodeType = "human" | "ai" | "review" | "input" | "output" | "decision"

export interface WorkflowNode {
  id: string
  type: WorkflowNodeType
  label: string
  description: string
  assignedRole?: string      // 分配给谁（人或AI模型）
  aiModel?: string           // Claude / GPT / Copilot / 自研
  qualityGate?: boolean      // 是否是质量检查点
  sla?: string               // 节点耗时预期
  inputs: string[]
  outputs: string[]
}

export interface WorkflowEdge {
  id: string
  source: string
  target: string
  label?: string
  condition?: string         // 条件分支
}

export interface CollaborationWorkflow {
  id: string
  name: string
  description: string
  department: string
  category: "客户服务" | "内容生产" | "数据分析" | "研发协作" | "项目管理" | "营销运营"
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: string
  updatedAt: string
  totalTimeSaved: number     // 相比纯人工节省的小时数
  qualityScore: number       // 0-1 流程质量评分
}

// ═══════════════════════════════════════════════════
// L5: 组织认知操作系统
// ═══════════════════════════════════════════════════

export interface DecisionRecord {
  id: string
  title: string
  description: string
  decider: string
  department: string
  options: { label: string; pros: string[]; cons: string[]; chosen: boolean }[]
  assumptions: string[]      // 做决策时的关键假设
  unknownFactors: string[]   // 当时不知道的因素
  aiInput?: string           // AI 在决策中的输入
  decisionDate: string
  reviewDate?: string        // 复盘时间
  outcome?: "正确" | "部分正确" | "错误" | "待评估"
  lessons: string[]
}

export interface KnowledgeFlowMetric {
  fromTeam: string
  toTeam: string
  topic: string
  flowType: "主动分享" | "被动获取" | "会议传递" | "文档流转" | "AI辅助"
  frequency: number
  quality: number            // 0-1 信息传递质量
  delay: number              // 信息传递延迟（天）
}

export interface OrgCognitionReport {
  decisionHistory: DecisionRecord[]
  knowledgeFlows: KnowledgeFlowMetric[]
  cognitiveDiversity: {
    frameworksInUse: { name: string; count: number }[]   // 组织内使用的思维框架
    dominantBias: { bias: string; prevalence: number }[]
    innovationIndex: number     // 0-1
  }
  aiDependency: {
    highDependencyTasks: { task: string; aiReliance: number }[]
    humanOnlyTasks: { task: string; count: number }[]
    collaborationRatio: number   // 人机协作任务占比
  }
  teamCognition: {
    teamName: string
    averageThinkingDepth: number
    decisionSpeed: number      // 平均决策周期（天）
    reversalRate: number       // 决策反转率
  }[]
}

// ═══════════════════════════════════════════════════
// 存储键
// ═══════════════════════════════════════════════════

const L1_ATTEMPTS_KEY = "sijian_l1_attempts"
const L2_SUBMISSIONS_KEY = "sijian_l2_submissions"
const L3_ATTEMPTS_KEY = "sijian_l3_attempts"
const L4_WORKFLOWS_KEY = "sijian_l4_workflows"
const L5_DECISIONS_KEY = "sijian_l5_decisions"
const L5_FLOWS_KEY = "sijian_l5_flows"

// ═══════════════════════════════════════════════════
// L1 种子数据：15个安全沙盘场景
// ═══════════════════════════════════════════════════

export function getSecurityScenarios(): SecurityScenario[] {
  return [
    {
      id: "l1_001", title: "客户数据的诱惑", category: "数据分级", difficulty: "初级",
      context: "你是销售部的新员工，正在准备一个重要的客户方案。",
      scene: "周五下午5点，领导催你下班前提交竞标方案。你需要分析客户的历史采购数据来定价，但这些数据只在公司内网CRM里。你的同事说'用手机拍个照发给自己的微信，回家用ChatGPT分析一下就行'。你该怎么做？",
      choices: [
        { text: "拍照发给微信，回家后用ChatGPT分析", reasoning: "又快又方便，其他同事都这么做" },
        { text: "在内网电脑上用公司授权的AI工具分析，加班做完再走", reasoning: "数据不出内网，虽然麻烦但合规" },
        { text: "让同事帮忙分析，把结果发给你", reasoning: "自己没有直接泄露数据，应该没问题" },
        { text: "申请数据导出审批，等审批通过后脱敏再分析", reasoning: "走正规流程，但可能赶不上截止时间" },
      ],
      correctIndex: 1,
      explanation: "客户采购数据属于'机密'级。即使是查看权限也需要在授权环境中操作。使用公司内部AI工具（已部署在内网）是合规做法。加班虽然辛苦，但相比数据泄露导致的法律后果和公司损失，这是唯一正确选择。",
      consequence: "把客户数据传到公共AI工具=数据出境+泄密。2026年起此类行为可能面临个人罚款和刑事责任。公司已因此事辞退过3名员工。",
      regulation: "《数据安全法》第32条、《个人信息保护法》第38条",
    },
    {
      id: "l1_002", title: "紧急邮件还是钓鱼陷阱？", category: "钓鱼攻击", difficulty: "中级",
      context: "你是财务部的出纳，处理日常付款审批。",
      scene: "周一早上，你收到一封邮件，发件人是'CEO 张总 <zhangzong@company-vip.com>'（正常是@company.com）。邮件说正在国外出差洽谈重要合作，需要紧急转账50万到指定账户，合同回来后补审批。邮件语气急切，说'电话不方便，在开会'。你打开邮件5分钟后，又收到一条企业微信消息，头像和名字都和CEO一样，催你尽快处理。",
      choices: [
        { text: "CEO亲自催了，赶紧转账，回来补流程", reasoning: "老板的命令不能耽误，况且企业微信也确认了" },
        { text: "拨打CEO已知的手机号确认，不通就先不发", reasoning: "双通道验证——邮件和IM都不够，必须用已知渠道电话确认" },
        { text: "回复邮件询问一些只有CEO知道的细节", reasoning: "如果是骗子应该回答不上来" },
        { text: "发给部门主管让她决定", reasoning: "把决策压力转移给上级" },
      ],
      correctIndex: 1,
      explanation: "这是典型的'CEO欺诈'+AI深度伪造组合攻击。发件域名异常（company-vip.com）、紧迫感施压、IM同步配合都是红旗信号。关键：必须用已知渠道（通讯录里的手机号）主动联系确认，不能被动等对方联系你。验证不通就坚决不付款。",
      consequence: "选错=50万损失追不回。2025年国内此类攻击造成企业年均损失超过1200万元。财务人员是第一目标。",
      regulation: "企业内部《资金支付审批制度》",
    },
    {
      id: "l1_003", title: "咖啡店的公共WiFi", category: "设备安全", difficulty: "初级",
      context: "你是市场部的方案策划，经常出差。",
      scene: "你在星巴克等客户，需要登录公司OA审批一个紧急流程。咖啡店有免费WiFi，信号满格。你的手机还有60%电量，4G信号2格。你打算怎么做？",
      choices: [
        { text: "连接免费WiFi，打开OA审批", reasoning: "就几分钟的事，应该不会有问题" },
        { text: "用手机4G热点给电脑，然后通过VPN连接公司内网再审批", reasoning: "用自己的移动网络+VPN，双保险" },
        { text: "先打开OA看看，不输入密码应该没事", reasoning: "只是浏览不操作没问题" },
        { text: "打电话给同事让帮忙审批", reasoning: "自己不碰敏感系统就没事" },
      ],
      correctIndex: 1,
      explanation: "公共WiFi极易被中间人攻击，同WiFi下的攻击者可以拦截所有明文流量。即使只是'浏览'，OA的登录页面可能被劫持伪造。必须使用VPN加密隧道+可信网络（4G/5G）。让同事代操作也不合规——账号共用是另一条安全红线。",
      consequence: "一次公共WiFi上的OA登录=账号密码被截获=攻击者进入公司内网。IT曾在安全演练中用假WiFi在1小时内获取了23名员工的登录凭证。",
      regulation: "公司《远程办公安全规范》第3条",
    },
    {
      id: "l1_004", title: "新来的IT实习生", category: "社会工程", difficulty: "中级",
      context: "你是研发部的工程师，工位在开放办公区。",
      scene: "一个穿着公司文化衫的年轻人走到你工位旁，说'你好，我是IT部新来的实习生，这周在做全公司的系统安全升级，需要确认每个人的账号权限。麻烦你在系统里确认一下你的账号是否有这些权限'——他递过来一个平板，上面是一个看起来很专业的权限检查页面，需要输入工号和密码。",
      choices: [
        { text: "看他穿了公司衣服，应该就是IT的人，配合一下", reasoning: "公司文化衫和工牌都有，不像假的" },
        { text: "让他出示IT部工牌并拨打IT部座机核实他的身份，确认后再配合", reasoning: "人是真的才能输入密码" },
        { text: "先随便输一个错误的密码试试看", reasoning: "如果是正规系统会提示密码错误" },
        { text: "拒绝在平板上输入密码，请他走正规IT服务流程发邮件或工单", reasoning: "任何索要密码的行为都应该通过正式渠道" },
      ],
      correctIndex: 3,
      explanation: "对！这是经典的'冒充IT人员'社会工程攻击。文化衫可以买，工牌可以伪造，平板上看起来专业的页面可能就是在收集密码。核心原则：永远不要在任何非你自己发起的流程中输入密码。IT部门的正规操作永远不会要求你在别人的设备上输密码。",
      consequence: "输入密码=攻击者获得你的账号。研发工程师的账号通常有代码仓库和服务器权限，一次社会工程攻击可能导致整个产品线沦陷。",
      regulation: "公司《信息安全管理条例》第7条",
    },
    {
      id: "l1_005", title: "离职员工的最后一小时", category: "数据分级", difficulty: "中级",
      context: "你是一个即将离职的项目经理，最后一天上班。",
      scene: "你在整理交接文档时，发现自己过去两年积累的项目资料、客户通讯录、竞品分析报告都在个人微信收藏和百度网盘里。这些都是你为了方便在家加班存到个人云端的。HR说今天下班前要完成所有交接。你该怎么做？",
      choices: [
        { text: "这些都是我自己做的，带走也没关系，整理完交接文档就行", reasoning: "个人劳动成果，而且都脱敏了" },
        { text: "把云端的文件下载到公司电脑，完成交接后让IT确认并手动删除所有个人云端副本", reasoning: "数据应该回归公司，个人不留存" },
        { text: "挑一些'有用的'留下来，无关紧要的删了就行", reasoning: "以后去了新公司也许用得上" },
        { text: "直接删掉个人云端的所有工作文件，当作什么都没发生过", reasoning: "删除就没人知道了" },
      ],
      correctIndex: 1,
      explanation: "项目资料和客户通讯录属于公司机密数据。即使是你创建的、存在个人云端的，所有权属于公司。正确的做法：全部交回公司，由IT部门见证并确保个人设备/云端已清除。'自己判断哪些删除'也不行，因为你的判断可能遗漏或有偏差。",
      consequence: "带走前公司数据=侵犯商业秘密。2024年某互联网公司前员工因此被判赔偿80万+6个月有期徒刑缓刑。新公司如果知情也可能被牵连诉讼。",
      regulation: "《劳动合同法》第23条、《反不正当竞争法》关于商业秘密保护",
    },
    {
      id: "l1_006", title: "AI生成代码的隐藏风险", category: "AI合规", difficulty: "高级",
      context: "你是研发部的前端工程师，正在赶一个紧急需求。",
      scene: "你让Claude帮你生成了一段处理用户支付信息的React组件代码。代码看起来很优雅，还有详细的注释，用了最新的React 19特性。但你注意到这段代码把用户的信用卡号存在了localStorage里，注释写着'方便下次自动填充'。产品经理催你赶紧上线。",
      choices: [
        { text: "代码很完美，直接合并提测", reasoning: "AI写的代码质量高，还加了注释说明意图" },
        { text: "意识到localStorage存卡号是严重安全问题，修改为用token化方案，并对AI生成的代码做安全扫描后再提交", reasoning: "AI不知道安全合规要求，人必须把关" },
        { text: "把localStorage换成sessionStorage就行", reasoning: "会话结束就自动清除了" },
        { text: "加上加密后再存localStorage", reasoning: "加密了就安全了" },
      ],
      correctIndex: 1,
      explanation: "这个场景揭示了AI代码最危险的特性：看起来专业优雅的代码可能包含致命安全漏洞。AI不知道PCI-DSS标准禁止在客户端存储完整卡号。即使是sessionStorage或加密存储也不合规。正确做法：(1) 卡号在服务端做token化 (2) 客户端只处理token (3) AI生成的代码必须经过安全扫描 (4) 涉及支付/用户隐私的代码需要人工安全审查。",
      consequence: "localStorage存卡号=PCI-DSS不合规。如果被利用，罚款最低$5000/月，上不封顶。且用户的支付信息可以被任何XSS攻击窃取。",
      regulation: "PCI-DSS 3.2.1 第3.4条、GDPR 第32条",
    },
    {
      id: "l1_007", title: "密码管理员的烦恼", category: "密码安全", difficulty: "初级",
      context: "你是新入职的行政专员，第一天上班。",
      scene: "IT给你发了一个临时密码'Welcome2026!'，让你登录后自行修改。你需要设置新密码。你平时习惯用一个固定密码（你家猫的名字加生日）管理所有个人账号。但公司密码策略要求：12位以上、包含大小写+数字+特殊字符、不与前3次重复、每90天更换。",
      choices: [
        { text: "设置一个符合规则的密码，用密码管理器保存", reasoning: "虽然记不住，但密码管理器很方便" },
        { text: "用'Xiaomao2026!'加上部门缩写，每次过期加个数字", reasoning: "好记又勉强符合规则" },
        { text: "把密码写在便利贴上贴在显示器下方", reasoning: "反正办公室也没外人" },
        { text: "设置好密码后，在所有需要登录的网站上用同一个", reasoning: "太多密码记不住，统一管理效率高" },
      ],
      correctIndex: 0,
      explanation: "密码管理器是最佳实践。'固定模式+递增数字'的密码很容易被破解（攻击者知道这种模式）。便利贴=物理安全漏洞，清洁工、访客、维修工都可能看到。所有网站同密码=一处泄露全部沦陷（撞库攻击）。",
      consequence: "弱密码=攻击者可能在数小时内暴力破解。据安全厂商统计，80%的企业数据泄露涉及弱密码或重复密码。",
      regulation: "等保2.0 三级要求",
    },
    {
      id: "l1_008", title: "微信群里的文件分享", category: "数据分级", difficulty: "初级",
      context: "你是项目组的成员，需要和外部合作伙伴共享项目进展。",
      scene: "项目经理在微信群里发了一份'Q3战略规划.pptx'，里面包含下季度产品路线图和定价策略。群里除了你们公司5个人，还有合作方的3个人。这份文件标注了'内部-保密'。一位合作方的人说'文件打不开，能发PDF版吗？'",
      choices: [
        { text: "直接把PPT转成PDF发到群里", reasoning: "PDF不容易被修改，应该没问题" },
        { text: "私信提醒项目经理这份文件标注了保密，建议用公司授权的协作平台（如飞书/钉钉）设置权限后分享，并在群里说明需要通过正式渠道获取", reasoning: "先暂停违规分享，再提供合规方案" },
        { text: "删掉敏感的定价页面后再发", reasoning: "去敏后应该就安全了" },
        { text: "不管，反正不是我发的", reasoning: "出了事也是项目经理的责任" },
      ],
      correctIndex: 1,
      explanation: "微信群里发保密文件=数据泄露。即使对方是合作伙伴，保密文件也需要通过授权平台+权限控制来分享。PDF不解决安全问题。作为看到违规行为的同事，你有责任提醒——这不是'多管闲事'，而是安全制度要求的。谁发现谁报告。",
      consequence: "定价策略泄露给竞争对手=一季度的市场优势丧失。某公司2025年因微信群泄露定价方案，竞品提前一周针对性降价，造成单季损失超过3000万。",
      regulation: "公司《保密管理制度》",
    },
    {
      id: "l1_009", title: "深度伪造视频会议", category: "钓鱼攻击", difficulty: "高级",
      context: "你是人事部的招聘主管，负责终面环节。",
      scene: "你安排了一场线上终面，候选人是竞对公司跳槽过来的高级总监。视频面试当天，对方开摄像头了，看起来和简历照片一致。但你觉得有些不对劲——对方眨眼频率异常、头部动作偶尔卡顿、唇形和声音有轻微的不同步。面试过程中对方给出了非常专业流畅的回答。",
      choices: [
        { text: "能对答如流，专业能力强，通过面试", reasoning: "现在AI换脸的技术还没到以假乱真的地步吧" },
        { text: "要求对方做一个即兴的侧脸动作或遮挡面部再露出来，同时通过交叉提问验证其专业经验的真实深度", reasoning: "深度伪造在侧脸和遮挡时容易暴露破绽，专业深度也很难伪造" },
        { text: "直接告诉对方我觉得你是AI换脸，看反应", reasoning: "敲山震虎，看对方怎么说" },
        { text: "录下来发给技术部门分析，这次面试先算通过", reasoning: "先招进来，有问题再说" },
      ],
      correctIndex: 1,
      explanation: "2026年AI深度伪造视频已达到几乎不可分辨的水平——尤其在面试这种坐着不动说话的场景。面试场景的深度伪造攻击正在成为企业招聘的新型安全威胁（可能是竞争对手派来窃取信息的间谍）。应对措施：(1) 要求即兴动作破坏AI渲染 (2) 交叉验证专业经验——问非常具体的项目细节，假人接不住 (3) 有条件的企业应采用线下终面或使用防深度伪造的面试平台。",
      consequence: "招入一个深度伪造的假人=内部信息被系统性窃取。2025年某金融科技公司通过线上终面招入的'CTO'实际上是一个深度伪造AI+幕后真人配合的间谍。",
      regulation: "暂无专门法规，属于新型安全威胁",
    },
    {
      id: "l1_010", title: "AI工具的'记住我'功能", category: "AI合规", difficulty: "中级",
      context: "你是客服部的组长，负责处理客户投诉和退款。",
      scene: "为了提高效率，你每次处理完一个客户投诉，就把对话记录粘贴到ChatGPT里，让它帮你总结要点和建议回复话术。你觉得每次都要重新粘贴很麻烦，于是开启了ChatGPT的'记忆'功能，让AI记住你们公司的退款政策和常见问题处理方式。这样下次你只需要说'按上次的方式回复'就行了。",
      choices: [
        { text: "这个办法很聪明，大幅提升效率，继续用", reasoning: "AI记住了公司的业务规则，省时省力" },
        { text: "立即关闭记忆功能，停止粘贴真实客户对话。改为用脱敏的示例数据训练自己的理解，每次使用时只输入当前对话的关键要素而不是全文", reasoning: "ChatGPT的记忆功能=OpenAI的服务器上存储了客户的真实投诉内容" },
        { text: "把客户名字替换成假名再用", reasoning: "脱敏后就没问题了" },
        { text: "问问IT部门能不能用", reasoning: "IT说行就行" },
      ],
      correctIndex: 1,
      explanation: "ChatGPT的'记忆'=你的对话内容被存储在OpenAI的服务器上用于模型训练和改进。客户投诉中包含真实姓名、联系方式、订单号、退款金额——这些都是个人信息。即使换了假名，对话中可能还有其他可识别信息。正确做法：使用公司内部部署的AI工具（数据不出企业），或者只用脱敏的关键要素来输入AI，禁止开启记忆/历史功能处理客户数据。",
      consequence: "客户投诉数据存储在公共AI平台=个人信息泄露+违反用户协议。你的公司在客户协议中承诺'用户数据仅用于服务目的'，这一操作直接违反了这一承诺。",
      regulation: "《个人信息保护法》第23条（向第三方提供个人信息需单独同意）",
    },
    {
      id: "l1_011", title: "U盘里的标书", category: "设备安全", difficulty: "初级",
      context: "你是销售部的投标专员，明天要提交一份重要的政府项目标书。",
      scene: "你花了两周时间准备了标书，文件在公司电脑上。你明天早上7点要直接去招标现场，来不及到公司拿文件。同事建议你把标书拷到U盘带回家，明天直接带去现场。你的U盘是两年前买的普通U盘，没有加密功能，平时也用来拷贝个人照片和电影。",
      choices: [
        { text: "用这个U盘拷走，方便快捷", reasoning: "就一晚的事，明天就交标了" },
        { text: "申请公司的加密U盘（需提前一天审批），如果来不及就用公司VPN远程桌面连接到公司电脑，明天在现场用笔记本远程演示", reasoning: "加密才是安全的可移动存储方案" },
        { text: "把标书发到自己QQ邮箱，明天在现场下载", reasoning: "用邮箱比U盘安全" },
        { text: "用手机把电脑屏幕拍下来，关键页面都有了", reasoning: "拍照最省事" },
      ],
      correctIndex: 1,
      explanation: "普通U盘丢失=标书泄露。公司加密U盘有硬件加密和远程擦除功能。VPN远程桌面方案：标书文件始终不离开公司网络，安全可控。发QQ邮箱同样有泄露风险（第三方服务器）。拍照不仅不专业，而且可能拍不全或模糊。",
      consequence: "丢失未加密的U盘=政府标书（含报价）泄露。一方面丢标，另一方面在政府的供应商信用记录上留下污点，可能影响后续所有政府项目投标资格。",
      regulation: "《政府采购法》关于供应商诚信管理",
    },
    {
      id: "l1_012", title: "会议室里的陌生人", category: "社会工程", difficulty: "中级",
      context: "你是研发部总监，正在会议室做一个新产品的架构评审。",
      scene: "会议室里坐着你认识的研发团队成员，还有一个人你不太确定——穿着得体、拿着笔记本在记东西。会议开始10分钟后，你发现这个人在白板上拍了几张架构图。你中断会议询问他是谁，他微笑着说'啊，我是张总（CEO）新招的战略顾问，张总让我先熟悉一下产品'。",
      choices: [
        { text: "既然是张总安排的人，继续开会", reasoning: "CEO安排的人不需要我质疑" },
        { text: "暂停会议，请他出示工牌或临时访客证件，同时发消息给CEO或行政确认此人的身份和权限。确认前不继续讨论敏感内容", reasoning: "先验证身份，再决定分享什么信息" },
        { text: "让大家把白板擦掉，但会议继续", reasoning: "不让他拍照就行了" },
        { text: "请他出去，告诉他这是内部会议", reasoning: "研发会议本来就不该有外人" },
      ],
      correctIndex: 1,
      explanation: "物理空间的入侵和网络攻击一样危险。公司应该有访客登记制度，所有外来人员必须佩戴临时访客证并有员工陪同。即使是CEO请的顾问，也不应该在没有提前通知的情况下出现在架构评审会上。最好的做法：立即验证，不确定就暂停。",
      consequence: "产品架构图=公司的核心技术资产。一张清晰的白板架构照片可能包含：系统架构、性能瓶颈、安全策略、未发布的功能规划。落入竞争对手手中=技术护城河崩塌。",
      regulation: "公司《保密管理制度》+《访客管理规定》",
    },
    {
      id: "l1_013", title: "离职员工的'告别邮件'", category: "钓鱼攻击", difficulty: "初级",
      context: "你收到了一封全员邮件。",
      scene: "邮件标题是'感谢大家，我会想念你们的！——李明（市场部）'。你知道李明上周确实离职了。邮件里有一个链接'这是我们团队最后的团建照片，大家自取～'，指向一个叫'photo-sharing-2026.com'的网盘链接。邮件正文语气和李明平时的风格很像。",
      choices: [
        { text: "点开链接看看团建照片", reasoning: "李明确实离职了，这很合情合理" },
        { text: "不点击链接，先在通讯录核对李明过去常用的邮箱地址是否一致。如果不一致或有任何可疑，报告IT安全团队。同时也观察邮件是否有语法错误或异常格式", reasoning: "离职员工邮箱可能已被接管" },
        { text: "先看看有没有其他同事已经点了", reasoning: "别人点了没事我就点" },
        { text: "回复邮件说'发我一份'", reasoning: "回复比直接点击安全" },
      ],
      correctIndex: 1,
      explanation: "这是典型的'离职员工账号劫持'攻击。员工离职后如果邮箱没有及时注销或密码被破解，攻击者就可以利用这个账号向全公司发送钓鱼邮件。因为发件人是前同事，收件人的戒备心会大幅降低。'photo-sharing-2026.com'是假网盘域名，点击后可能窃取你的OA登录凭证或植入恶意软件。",
      consequence: "一次点击=全公司最大的钓鱼攻击入口被打开。安全厂商报告显示，以离职员工账号为跳板的钓鱼攻击成功率是普通钓鱼邮件的3倍以上。",
      regulation: "公司《IT安全管理制度》中关于账号生命周期管理",
    },
    {
      id: "l1_014", title: "新AI功能的合规审查", category: "AI合规", difficulty: "高级",
      context: "你是产品经理，负责一个面向C端用户的AI对话功能。",
      scene: "你的团队开发了一个'AI心理陪伴'功能，用户可以和AI倾诉情感问题、职场压力等。功能测试数据很好，用户平均对话时长35分钟。CEO希望这周末上线。但你注意到AI偶尔会给出不是专业心理咨询师能给出的判断，比如对用户说'你可能是轻度抑郁'或'你应该离开这段关系'。",
      choices: [
        { text: "AI只是工具，用户会自己判断，按计划上线", reasoning: "产品上有免责声明就够了" },
        { text: "先不上线。咨询法务团队确认此类AI功能是否需要医疗/心理咨询资质。同时加入内容安全过滤：AI不得给出任何诊断性结论，遇到疑似心理健康问题引导用户寻求专业帮助。上线前完成合规审查", reasoning: "AI诊断=医疗行为，需要资质。这不是免责声明能解决的" },
        { text: "把'诊断'改成'建议'，加一句'以上仅供参考'", reasoning: "换个说法应该就没合规问题了" },
        { text: "只在海外上线，国内不做", reasoning: "海外法规没国内严" },
      ],
      correctIndex: 1,
      explanation: "AI给出诊断性结论=涉嫌无证从事医疗活动。在中国，心理健康诊断属于医疗行为，必须有相应资质。即使加了免责声明，如果用户因AI的建议做出了伤害自己或他人的行为，公司和产品经理个人都可能承担法律责任。海外也一样——美国的FDA对AI/ML的医疗应用有严格审批流程。这不是'文字游戏'能解决的。正确做法：先暂停，咨询法务，加入安全护栏。",
      consequence: "AI给出不当的医疗建议导致用户受到伤害=产品下架+监管部门调查+可能的刑事责任。2025年某海外AI聊天产品因类似问题被美国FTC罚款1亿美元。",
      regulation: "《互联网诊疗管理办法》《医疗器械监督管理条例》、FDA SaMD",
    },
    {
      id: "l1_015", title: "代码仓库的公开密钥", category: "密码安全", difficulty: "高级",
      context: "你是后端工程师，正在调试一个云服务部署问题。",
      scene: "你为了方便调试，在GitHub私有仓库的代码注释里临时写了一个生产环境数据库的密码，想着'调试完就删'。结果你忘了删，代码合入了主分支。一周后，安全扫描工具告警：数据库有异常查询来自一个境外IP，疑似数据正在被拖取。你检查后发现——那个密码已经在代码里躺了7天。",
      choices: [
        { text: "先不声张，赶紧把代码里的密码删了，看看损失有多大", reasoning: "先止损再说，不要惊动更多人" },
        { text: "立即通知安全团队启动应急响应：(1)轮换数据库密码 (2)审计异常查询的日志评估泄露范围 (3)检查是否有后门或持久化机制 (4)通知法务准备数据泄露报告 (5)事后复盘：代码扫描工具应拦截硬编码密钥进入仓库", reasoning: "安全事件有标准应急流程，不能自己处理" },
        { text: "先看看日志确认是不是误报", reasoning: "可能只是扫描工具的误报" },
        { text: "把代码仓库设为公开的，反正密码已经泄露了改也没用", reasoning: "破罐子破摔" },
      ],
      correctIndex: 1,
      explanation: "GitHub私有仓库≠安全。密钥一旦进入代码仓库就有被泄露的风险（比如有人fork了代码、CI/CD日志暴露了环境变量等）。正确做法：(1) 立即启动安全应急响应 (2) 轮换所有可能受到影响的密钥 (3) 不要尝试自己'悄悄'处理——安全事件需要在规定时间内上报 (4) 事后：部署pre-commit hook + CI密钥扫描，阻止密钥进入仓库。",
      consequence: "生产数据库密码泄露=攻击者可能获取全部用户数据。2024年某SaaS公司因类似事件被罚款1200万元，且需要通知所有受影响用户（约200万），品牌声誉受到不可逆损害。",
      regulation: "《个人信息保护法》第57条（发生泄露需通知主管部门+个人）",
    },
  ]
}

// ═══════════════════════════════════════════════════
// L2 种子数据：8个 Prompt 工程练习
// ═══════════════════════════════════════════════════

export function getPromptExercises(): PromptExercise[] {
  return [
    {
      id: "l2_001", title: "让AI写出符合品牌调性的文案", pattern: "角色扮演", difficulty: "入门",
      description: "学会通过角色设定让AI的输出符合特定的风格和受众",
      task: "为一家高端有机护肤品品牌写一段产品描述，面向30-45岁注重生活品质的女性。要求AI输出的文案符合'优雅、专业、不浮夸'的品牌调性。",
      context: "公司的市场专员经常需要让AI帮忙写文案，但AI默认写的往往过于华丽或过于平淡。",
      aiTool: "Claude / ChatGPT",
      goodExample: "你是一个为高端有机护肤品牌工作8年的资深文案。品牌调性是'优雅、专业、不浮夸'。请为我们的新品'时光修护精华'写一段200字的产品描述，目标受众是30-45岁注重生活品质的女性。避免使用'神奇''奇迹'等夸大词汇，重点传达成分的天然来源和科学验证的效果。",
      badExample: "帮我写一段护肤品的产品描述，要好看一点。",
      scoringRubric: [
        { criterion: "角色设定清晰具体", weight: 0.25 },
        { criterion: "受众和调性明确", weight: 0.25 },
        { criterion: "给出了具体的约束条件", weight: 0.25 },
        { criterion: "避免了模糊的表述", weight: 0.25 },
      ],
      hints: ["想想这个品牌的文案应该像谁在说话？", "给AI一个具体的'人设'比抽象的'风格'更有效", "正向约束和反向约束都要有"],
    },
    {
      id: "l2_002", title: "让AI分步骤解决复杂问题", pattern: "链式思维", difficulty: "进阶",
      description: "通过要求AI'先思考再回答'来提高复杂问题的准确率",
      task: "公司需要评估是否应该自研一个内部知识库系统还是购买现成的SaaS方案。需要AI帮你做全面的分析。",
      context: "管理层决策需要多维度的分析，但AI默认给出的答案往往过于简化。",
      aiTool: "Claude 4 / GPT-5",
      goodExample: "我们公司需要决策：自研内部知识库 vs 购买SaaS方案。请按以下步骤分析：\n1. 先列出评估这个决策需要考虑的所有维度（成本、时间、维护、安全、定制化等）\n2. 对每个维度，分析自研和购买SaaS各自的优劣势\n3. 给出一个加权评分表（权重由你根据一般企业IT决策的优先级设定）\n4. 最后给出你的推荐和理由\n\n在每个步骤中，请先写出你的思考过程，再给出结论。",
      badExample: "自研还是买SaaS知识库，哪个好？分析一下。",
      scoringRubric: [
        { criterion: "明确要求分步骤思考", weight: 0.3 },
        { criterion: "给出了思考框架（维度→分析→评分→推荐）", weight: 0.3 },
        { criterion: "要求AI展示思考过程", weight: 0.2 },
        { criterion: "提供了足够的背景信息", weight: 0.2 },
      ],
      hints: ["如果你不说'先思考再回答'，AI会直接跳到结论", "给AI一个结构化的分析框架比让它自由发挥效果好得多", "要求展示中间步骤既提高了答案质量，也让你能检查逻辑"],
    },
    {
      id: "l2_003", title: "用AI整理混乱的会议纪要", pattern: "格式化输出", difficulty: "入门",
      description: "通过指定输出格式让AI处理非结构化信息",
      task: "你有30分钟会议录音转成的文字（约5000字，包含跑题、打断、闲聊），需要AI帮你提炼出结构化的会议纪要。",
      context: "每周要开5个会，整理会议纪要占用了大量时间。",
      aiTool: "Claude / ChatGPT",
      goodExample: "以下是今天产品评审会的录音文字。请帮我整理成结构化会议纪要，严格按以下格式输出：\n\n## 会议信息\n- 日期/时间/参会人\n\n## 决议事项\n- [决议编号] 决议内容 | 提出人 | 表决结果\n\n## 待办事项\n- [编号] 任务描述 | 负责人 | 截止日期 | 优先级\n\n## 讨论要点\n1. [议题] 核心讨论内容（3句话以内）\n2. ...\n\n## 下次会议\n- 议题/时间\n\n注意：忽略闲聊和跑题内容，聚焦有实质内容的讨论。",
      badExample: "帮我整理这个会议记录。",
      scoringRubric: [
        { criterion: "输出格式明确具体", weight: 0.35 },
        { criterion: "给出了正反面示例（要什么/不要什么）", weight: 0.25 },
        { criterion: "定义了每个字段的含义", weight: 0.2 },
        { criterion: "考虑到了实际使用场景", weight: 0.2 },
      ],
      hints: ["如果不指定格式，AI整理的纪要和你想要的可能差距很大", "明确说'忽略什么'和'要什么'一样重要", "格式越具体，输出越一致——这对于需要多次使用的Prompt尤为重要"],
    },
    {
      id: "l2_004", title: "用AI做代码审查的正确姿势", pattern: "上下文注入", difficulty: "进阶",
      description: "学会给AI提供足够的上下文和约束来获得高质量的代码审查",
      task: "你需要AI帮你审查一段支付模块的代码，关注安全性、性能和可维护性。",
      context: "团队的代码量很大，人工审查跟不上。但AI如果不给上下文，审查意见往往不痛不痒。",
      aiTool: "Claude / GitHub Copilot",
      goodExample: "请以资深后端架构师的身份审查以下支付模块代码。\n\n[粘贴代码]\n\n审查维度（按优先级排列）：\n1. 安全性：支付流程是否有漏洞？敏感数据处理是否合规（参考PCI-DSS标准）？\n2. 性能：是否有N+1查询？是否有不必要的数据库操作？\n3. 可维护性：代码结构是否清晰？是否有足够的错误处理？\n4. 测试覆盖：关键路径是否有测试？\n\n对每个问题，请给出：\n- 问题位置（行号）\n- 严重级别（致命/严重/轻微）\n- 问题描述\n- 建议的修复方式（最好给出代码示例）\n\n项目上下文：这是一个日均处理5000+笔交易的支付服务，使用PostgreSQL+Redis，部署在K8s集群。",
      badExample: "帮我review一下这段代码，看看有没有问题。",
      scoringRubric: [
        { criterion: "明确了审查维度和优先级", weight: 0.3 },
        { criterion: "提供了项目技术栈上下文", weight: 0.2 },
        { criterion: "要求了具体的输出格式（定位+级别+修复）", weight: 0.3 },
        { criterion: "给出了领域相关的约束（PCI-DSS）", weight: 0.2 },
      ],
      hints: ["代码审查不给上下文=AI只能给泛泛的意见", "告诉AI你的技术栈和业务规模，它才知道什么级别的优化是合理的", "要求给出修复代码示例比只描述问题有用得多"],
    },
    {
      id: "l2_005", title: "AI写不出来的东西——反向约束", pattern: "反面约束", difficulty: "进阶",
      description: "通过告诉AI'不要什么'来获得更精准的输出",
      task: "你需要AI帮你起草一份给投资人的月度经营汇报邮件，但AI默认写的总是太'AI味儿'——过于华丽、空洞、充满了'我们很高兴地宣布'这类废话。",
      context: "投资人收到的邮件太多了，套话邮件会被直接跳过。你需要AI写出'人类高管'自然真诚的语气。",
      aiTool: "Claude 4",
      goodExample: "请帮我起草一份给投资人的月度经营汇报邮件。\n\n**关于内容：**\n- 本月营收增长15%（主要来自企业版SaaS）\n- 客户留存率降至87%（主要是一个大客户流失）\n- 下月重点是召回和产品稳定性\n\n**写作风格：**\n绝对不要用以下表述：\n- '我们很高兴地宣布...'\n- '在这个充满挑战的季度...'\n- '持续深耕...'\n- '赋能...'\n- '抓住机遇...'\n- 任何超过15个字的句子\n\n请像给你信任的朋友发微信一样，用最短的句子说清三件事：\n1. 好消息是什么\n2. 坏消息是什么（不要粉饰）\n3. 接下来怎么做",
      badExample: "帮我写一封给投资人的月报邮件，要有专业感。",
      scoringRubric: [
        { criterion: "明确列出了禁止使用的表述", weight: 0.35 },
        { criterion: "给出了正面的风格指导", weight: 0.25 },
        { criterion: "提供了具体的数据和背景", weight: 0.2 },
        { criterion: "设定了语气和受众的场景", weight: 0.2 },
      ],
      hints: ["'不要什么'往往比'要什么'更容易描述清楚", "AI擅长模仿，给它正反例子比抽象描述有效", "告诉AI'像给朋友发微信'比'语气亲切'具体100倍"],
    },
    {
      id: "l2_006", title: "多工具协作：从数据到洞察", pattern: "分步拆解", difficulty: "高级",
      description: "学会将一个复杂任务拆解到多个AI工具协作完成",
      task: "你需要分析一份5000行的客户反馈CSV数据，找出Top 3的客户痛点，并制作一份面向管理层的洞察报告。",
      context: "一个AI工具做不了所有事。数据分析用ChatGPT的Code Interpreter，报告写作用Claude，可视化用AI图表工具。",
      aiTool: "ChatGPT + Claude + Napkin AI",
      goodExample: "我在做客户反馈分析，需要3个AI工具协作。请帮我规划每个工具的分工：\n\n**原始数据：** 5000行客户反馈CSV，字段包括：[时间][客户ID][反馈内容][评分][产品模块]\n\n**目标产出：** Top 3客户痛点 + 5页管理层洞察报告\n\n**我的工具：**\n- ChatGPT (Code Interpreter)：擅长数据分析和统计\n- Claude：擅长长文写作和洞察提炼\n- Napkin AI：擅长数据可视化\n\n请帮我设计一个3步的协作流程，每个步骤说明：\n1. 用哪个工具\n2. 给它什么输入\n3. 期望它产出什么\n4. 产出如何传给下一个工具",
      badExample: "帮我分析这个CSV。",
      scoringRubric: [
        { criterion: "明确了各个工具的分工边界", weight: 0.3 },
        { criterion: "设计了一个有逻辑的流水线", weight: 0.3 },
        { criterion: "每个步骤的输入输出定义清晰", weight: 0.2 },
        { criterion: "考虑了产出质量检验", weight: 0.2 },
      ],
      hints: ["不同AI工具各有所长——不要让一个工具做所有事", "关键不在工具本身，而在'输入→加工→传递→再加工'的流水线设计", "好的工具协作=每个步骤的产出可以作为下一步的输入，不需要人工重写"],
    },
    {
      id: "l2_007", title: "让AI帮你发现自己的盲区", pattern: "批判性反思", difficulty: "高级",
      description: "用AI作为'反方辩手'来审视自己的方案",
      task: "你花了三周写了一个新产品的上市方案。在分享给团队之前，你希望AI帮你找出方案中的逻辑漏洞、不现实的假设和被忽略的风险。",
      context: "一个人做方案很容易陷入'确认偏差'——只看到支持自己观点的信息。AI可以作为客观的'红队'来攻击你的方案。",
      aiTool: "Claude 4",
      goodExample: "以下是我的新产品上市方案[粘贴方案]。\n\n请你扮演一个善意的'魔鬼代言人'——你的任务是挑战我的方案中的每一个关键假设，帮我发现盲区。请按以下框架逐一攻击：\n\n1. **市场假设**：我假设的目标市场、用户需求、支付意愿是否站得住脚？有没有反例？\n2. **竞争假设**：我假设的竞争格局是否有遗漏的威胁？有没有间接竞品可能跨界进入？\n3. **执行风险**：我的时间线和资源估算中哪些是最脆弱的环节？\n4. **财务假设**：我的营收预测中哪些数字是最'拍脑袋'的？\n5. **未知的未知**：哪些重要的问题我在方案中完全没有提到？\n\n对每个质疑，请给出具体的论据和数据，不要只说'这里有问题'。攻击力度要足够强——如果你轻易就能被反驳，说明挑战不够深。",
      badExample: "看看我的方案有没有问题。",
      scoringRubric: [
        { criterion: "设置了明确的对抗角色和框架", weight: 0.3 },
        { criterion: "要求了具体论据而非泛泛质疑", weight: 0.25 },
        { criterion: "覆盖了多维度的风险（市场/竞争/执行/财务）", weight: 0.25 },
        { criterion: "提供了完整的方案上下文", weight: 0.2 },
      ],
      hints: ["告诉AI'攻击要足够强'——否则AI默认会客气", "给出结构化的审查框架比笼统地说'提意见'效果好很多", "这是最高ROI的AI使用方式之一：在决策前用AI做红队测试"],
    },
    {
      id: "l2_008", title: "零样本到少样本：教会AI你的业务逻辑", pattern: "少样本学习", difficulty: "进阶",
      description: "通过给AI看几个例子来让它学会特定的业务规则和判断标准",
      task: "你的客服团队每天收到300条投诉。你需要AI帮你自动判断每一条投诉的紧急程度（P0/P1/P2），然后分派给相应的处理人。",
      context: "直接让AI判断紧急程度，它的标准和你的业务标准不一样。但如果你给它看几个你已经标注好的例子，它会学得很快。",
      aiTool: "Claude / ChatGPT",
      goodExample: "我需要你帮我判断客户投诉的紧急程度。标准如下：\n- P0（紧急）：涉及资金损失、账户安全、服务不可用，需30分钟内响应\n- P1（重要）：功能异常但不影响核心使用，需2小时内响应\n- P2（一般）：体验问题、功能建议、非紧急咨询，24小时内响应\n\n以下是3个标注好的例子：\n\n例1: '我的账户被扣了两次款！' → P0（资金损失）\n例2: '登录页面的验证码一直刷不出来' → P1（功能异常但不影响核心）\n例3: '能不能加一个夜间模式？' → P2（功能建议）\n\n现在请判断以下投诉的紧急程度并说明理由：\n[粘贴待判断的投诉]",
      badExample: "帮我判断这些投诉的紧急程度，P0最紧急。",
      scoringRubric: [
        { criterion: "给出了清晰的分类标准和定义", weight: 0.3 },
        { criterion: "提供了3个以上覆盖不同类别的示例", weight: 0.3 },
        { criterion: "示例说明了判断理由", weight: 0.2 },
        { criterion: "业务场景和SLA上下文完整", weight: 0.2 },
      ],
      hints: ["2-3个好的示例比100个模糊的示例更有效", "示例要覆盖不同的类别和边界情况", "给出判断理由比只给标签更能教会AI你的业务逻辑"],
    },
  ]
}

// ═══════════════════════════════════════════════════
// L3 种子数据：6个 AI 判断力挑战
// ═══════════════════════════════════════════════════

export function getJudgmentChallenges(): JudgmentChallenge[] {
  return [
    {
      id: "l3_001", title: "AI财务分析中的隐藏错误", type: "事实准确性", difficulty: "中级",
      scenario: "你是财务分析师。AI帮你生成了一份季度经营分析报告，看起来很专业，但......",
      aiOutput: `## Q2 经营分析报告

### 核心指标
- 营收：1,200万元，同比增长23.5%
- 毛利率：从58%提升至64%
- 净利润：320万元，净利率26.7%
- 客户获取成本（CAC）：从380元降至290元
- 用户月活（MAU）：同比增长35%

### 风险提示
1. 营收增速放缓，环比仅增长3.2%，需要关注增长动力
2. 毛利率提升主要来自原材料价格下降，不具有可持续性
3. 营销费用同比减少12%，但客户留存率下降2个百分点至85%

### 建议
基于以上分析，建议Q3加大营销投入，目标CAC控制在250元以下，预计可带动营收增长15%。`,
      hiddenErrors: [
        { description: "净利润率26.7%计算有误：320/1200=26.7%......但320万应该是含税数据，实际净利润率需扣除所得税（一般25%），真实的净利润约为240万，净利率≈20%", location: "核心指标-净利润行", severity: "严重", correction: "标注净利润是否为税后，扣除25%所得税后净利240万，净利率20%" },
        { description: "MAU同比35%增长与CRM月活2%下降的数据矛盾——如果用户量在增长而留存率在下降，说明新增用户流失极快，这是一个需要深挖的问题而非一笔带过", location: "风险提示第2条", severity: "致命", correction: "新增用户流失率需要单独计算和预警。35%的增长主要靠拉新，但新用户留不住=漏水的桶" },
        { description: "CAC从380降到290，但营销费用减少了12%——如果营销费用减少了而CAC还下降了，说明获客效率大幅提升。但AI没有分析这是为什么，是渠道优化了还是市场环境变化了。如果CAC下降是暂时的（比如某个渠道的红利期），这个乐观假设很危险", location: "核心指标-CAC", severity: "严重", correction: "需要分析CAC下降的原因和可持续性" },
      ],
      reflectionQuestions: [
        "你最初读这份报告时，有没有觉得'写得挺好'？如果有，说明你差点被AI的专业包装骗了",
        "320万和26.7%这两个数字放在一起，你第一个念头是什么？有没有想去验算？",
        "如果这份报告被CFO看到并直接采用了，会产生什么后果？",
      ],
      keyTakeaway: "AI生成的财务报告中，数字计算和逻辑一致性是两个最容易出错的维度。永远验算关键数字，永远检查数据之间的逻辑关系。",
    },
    {
      id: "l3_002", title: "AI代码审查中的'优雅漏洞'", type: "逻辑推理", difficulty: "高级",
      scenario: "你是技术Lead。AI帮你审查了一段用户认证的代码，它说'代码没有问题，逻辑清晰'，但......",
      aiOutput: `代码审查结果：✅ 通过

这段代码实现了一个标准的JWT刷新流程：
1. 用户登录后获得access_token（15分钟有效）和refresh_token（7天有效）
2. access_token过期时，前端自动用refresh_token请求新的access_token
3. 如果refresh_token也过期了，跳转登录页

代码质量评估：
- 错误处理完善 ✅
- Token存储方式安全（httpOnly cookie）✅
- 刷新逻辑正确，没有死循环 ✅
- 总体评分：8.5/10

建议：可以在刷新token时顺便更新用户权限信息。`,
      hiddenErrors: [
        { description: "AI没有发现refresh token旋转（rotation）的缺失。当攻击者窃取了一个refresh token，如果服务器不做'一次使用后失效+颁发新token'，攻击者可以持续获取新的access token。正确的做法是每次使用refresh token后注销旧token并颁发新token，同时检测一个refresh token被使用两次=账号可能被盗", location: "整个刷新流程逻辑", severity: "致命", correction: "实现refresh token rotation：每次刷新后旧token立即失效，检测重复使用=撤销所有token+通知用户" },
        { description: "提议的'更新用户权限信息'看起来很贴心，但在token刷新期间做数据库查询会增加延迟。权限检查应该在每次请求时通过中间件实时查询，而不是缓存在token里", location: "建议部分", severity: "轻微", correction: "权限应实时查询，不应在刷新token时做额外操作" },
      ],
      reflectionQuestions: [
        "refresh token rotation是一个资深后端都应该知道的安全模式。AI没有提到，你自己想到了吗？",
        "'代码看起来没问题'是AI代码审查最常见的陷阱。你通常会怎么二次验证？",
        "你还想到哪些AI在代码审查中容易遗漏的安全问题？",
      ],
      keyTakeaway: "安全相关的代码审查不能只靠AI。AI擅长检查代码风格和常规错误，但安全漏洞往往藏在'看起来正常工作'的逻辑里。安全审查必须由有安全经验的人来做终审。",
    },
    {
      id: "l3_003", title: "AI写的行业报告中的偏见", type: "偏见检测", difficulty: "中级",
      scenario: "你是市场研究员。AI帮你分析新能源汽车行业趋势，但它的分析可能存在认知偏见。",
      aiOutput: `## 新能源汽车行业趋势分析

### 结论先行
纯电动车是唯一的未来。增程式和氢燃料电池都是过渡方案，不值得长期投入。

### 理由
1. 特斯拉和比亚迪的纯电车型销量持续领先，证明市场已经做出了选择
2. 充电基础设施在过去两年增长了300%，'充电难'的问题将在2年内彻底解决
3. 电池成本以每年15%的速度下降，2028年纯电车将在总拥有成本上全面超越燃油车
4. 氢燃料电池的能源转换效率只有30-40%，远低于纯电的70-80%

### 投资建议
建议将所有新能源相关投资集中于纯电技术和充电基础设施，放弃增程和氢能方向。`,
      hiddenErrors: [
        { description: "AI只引用了支持纯电的数据，完全忽略了不支持这个结论的数据。例如：(1)中国北方冬季纯电续航衰减40-60% (2)商用车/重卡领域纯电方案受限于电池重量 (3)电网容量能否支撑全面电动化仍是未知数。这是典型的'确认偏差'——只找支持自己结论的证据", location: "整篇分析的论证方式", severity: "严重", correction: "一个好的分析应呈现各方数据：纯电的优势和局限性、增程的适用场景、氢能的独特价值（重卡/储能）。结论可以是'纯电是主流'，但不能说'纯电是唯一'" },
        { description: "AI说的'电池成本每年下降15%'是一个线性外推——过去的数据不能保证未来。供应链风险（锂矿/钴矿的地缘政治、资源垄断）可能在任何一个环节导致成本不降反升", location: "理由第3条", severity: "严重", correction: "补充电池成本下降的假设条件和潜在风险，标注该预测的不确定性" },
        { description: "AI用'效率30-40% vs 70-80%'来否定氢能——但这个比较忽略了应用场景。在储能、重载运输、钢铁冶炼等领域，氢能的价值不在于效率，而在于它是少数可以实现工业级脱碳的技术路径。AI犯了'用一把尺子量所有东西'的错误", location: "理由第4条", severity: "严重", correction: "不同技术的效率比较需要在相同的应用场景下进行，不能跨场景直接对比" },
      ],
      reflectionQuestions: [
        "AI文章的语气非常肯定——'唯一的未来''彻底解决'。这种确定性表述应该引起你的警觉吗？",
        "当你看到一条非常自信的结论时，你会下意识地去找反面证据吗？",
        "在日常工作中，哪些场景最容易让你不自觉地接受AI的'偏见'？",
      ],
      keyTakeaway: "AI的分析看起来很流畅、很有说服力，但流畅≠正确。AI有强烈的倾向去构建一个'干净漂亮的叙事'而忽略反例和不确定性。判断AI的分析质量，关键看它有没有主动呈现反方证据。",
    },
    {
      id: "l3_004", title: "AI引用的'数据'从哪来？", type: "数据来源", difficulty: "初级",
      scenario: "你是公关经理。AI帮你快速调研了一个品牌危机案例作为内部培训素材。",
      aiOutput: `XX品牌2024年危机公关复盘：

XX品牌因产品质量问题在2024年3月遭遇重大信任危机，三个月内市值蒸发47亿美元（约合340亿人民币）。根据《哈佛商业评论》的分析，该品牌在危机初期的回应方式是典型的'否认→推卸→被迫承认'三阶段，每一步都犯了公关教科书上的经典错误。

麦肯锡后续的调研显示，品牌信任一旦破裂，恢复周期平均为14个月，且期间获客成本会上升200%-300%。该案例成为全球商学院危机管理课程的必讲案例。

启示：在社交媒体时代，品牌回应必须在24小时内完成，且第一条声明必须包含'承认问题-表达歉意-承诺改进'三个要素。`,
      hiddenErrors: [
        { description: "市值蒸发'47亿美元'这个数字——AI没有给出来源链接。这个数字是真实的还是AI编造的？在实际工作中，如果没有可验证的来源，任何数据都不能直接使用", location: "第一段-市值数据", severity: "致命", correction: "所有引用数据必须附上可验证的来源链接。'47亿美元'如果没有出处，只能标注为'AI生成，待核实'" },
        { description: "'《哈佛商业评论》的分析'和'麦肯锡后续的调研'——AI可能编造了权威来源来增加可信度。查一下HBR官网和麦肯锡官网，大概率找不到这两篇引用", location: "第二段", severity: "致命", correction: "AI有强烈的'权威引用幻觉'——它会编造看起来合理的权威来源。所有引用必须核实" },
        { description: "'恢复周期14个月''获客成本上升200%-300%'——这些非常精确的数字大概率是AI编造的。真实的研究结论不会给出这么整齐的区间", location: "第二段-数据", severity: "严重", correction: "标注这些数字为AI推测，并找到真实的学术研究来support或refute" },
      ],
      reflectionQuestions: [
        "你之前有没有在AI生成的报告中看到过看起来很权威但没有出处的'数据'？你是怎么用的？",
        "你会用什么方法来快速验证AI引用的数据？",
        "如果AI编造数据这么常见，我们还能在什么场景下信任AI的输出？",
      ],
      keyTakeaway: "AI的输出中，任何数字、任何引用、任何'研究表明'，在被验证之前都应该视为'可能不准确'。这不是说AI不可用，而是说AI的输出必须经过人的事实核查才能使用。",
    },
    {
      id: "l3_005", title: "魔鬼代言人：捍卫你的商业判断", type: "魔鬼代言人", difficulty: "高级",
      scenario: "你是产品总监。你坚信公司应该加大对AI智能体功能的投入，因为竞争对手已经在做了。现在AI将扮演'反方'来挑战你的决策逻辑。",
      aiOutput: `[AI作为你的反方辩手]

你主张投入500万预算做AI智能体功能。但我想挑战你的几个核心假设：

1. **'竞争对手做了，所以我们也必须做'** — 这是典型的'跟风谬误'。竞争对手做的不一定是正确的。他们的用户基数、技术能力、品牌定位和我们不同。他们做AI智能体可能是战略失误，我们为什么要跟着犯错？

2. **'这个市场在快速增长'** — 高增长≠高利润。AI智能体的API成本波动极大，OpenAI可能在任一时间点涨价5倍。你能保证毛利率不跌破30%吗？

3. **'我们的用户已经在问了'** — 用户问的是'你们有AI功能吗'还是'你们有AI功能且我们愿意为此付费'？这两者的区别，你有数据支撑吗？

4. **'先做再迭代'** — 面对一个监管尚不明确的领域，'先上线再调整'的风险是什么？如果三个月后出台了新的AI监管政策让你的产品无法上线，500万就打水漂了。你的Plan B是什么？

反驳我的论点。请逐一回应。`,
      hiddenErrors: [],  // 这是魔鬼代言人模式，没有隐藏错误，要点在用户的回应
      reflectionQuestions: [
        "AI提出的四个挑战中，哪一个是你最难以反驳的？这可能是你方案中最薄弱的一环",
        "你在回应时，有没有'我觉得...'开头的地方？如果有，这个观点可能需要更多数据支撑",
        "经过这场辩论，你的原始方案需要做什么调整？有没有一个挑战让你改变了想法？",
      ],
      keyTakeaway: "好的决策不是'我的方案没问题'而是'我知道我的方案有哪些风险，但我判断值得承担'。AI做魔鬼代言人的价值在于：在决策前就把可能的反对意见穷举一遍，避免在决策后被打脸。",
    },
    {
      id: "l3_006", title: "AI简历筛选中的隐形歧视", type: "偏见检测", difficulty: "中级",
      scenario: "你是HR。你让AI帮你筛选了100份简历，给出初面建议名单。AI推荐了18个人。",
      aiOutput: `简历筛选报告（100份→推荐18人进入初面）

筛选标准：岗位要求3年以上后端开发经验、有高并发项目经验、本科以上学历

推荐名单概况：
- 男性：15人（83%）
- 女性：3人（17%）
- 985/211院校：16人（89%）
- 非985/211：2人（11%）
- 有大厂背景：14人（78%）

AI分析：推荐名单中985/211和大厂背景占比显著高于候选人池的平均值，说明这些候选人的客观条件确实更匹配岗位要求。`,
      hiddenErrors: [
        { description: "AI的筛选结果严重倾斜——男性83% vs女性17%，985/211占89%。但这不一定是'客观条件更匹配'，而是AI模型本身可能学习了招聘数据中存在的历史偏见（技术岗位历史招聘数据中男性的简历更多、大厂背景的人面试表现评分更高）", location: "性别和院校比例", severity: "致命", correction: "(1) 检查筛选标准中是否含有隐性偏见——比如'大厂背景'在统计上和性别/家庭背景相关 (2) 增加盲筛环节——隐去姓名、性别、年龄、院校后进行技术能力评估 (3) 最终名单需人工复核偏见" },
        { description: "AI说'大厂背景更匹配'——但大厂出来的人和创业公司出来的人，谁更适应早期团队的节奏？这取决于岗位需求，不是一个放之四海而皆准的标准。AI没有质疑自己设定的标准本身", location: "筛选标准", severity: "严重", correction: "重新审视筛选标准的合理性。'大厂背景'是否真的是一个好的预测指标？还是只是一个方便但不准确的代理变量？" },
      ],
      reflectionQuestions: [
        "如果你是HR负责人，你会直接使用这个筛选结果吗？如果不，你会额外做什么？",
        "技术团队多样性对产品和公司的长期价值是什么？短期效率vs长期多样性的权衡在哪里？",
        "你是否意识到：即使AI的筛选标准看起来'中立'（学历、经验、技能），它们组合起来可能产生系统性的排除效果？",
      ],
      keyTakeaway: "AI做筛选的优势是效率，风险是它会继承和放大人类社会数据中存在的偏见。在招聘、信贷、司法等涉及公平性的领域，AI的输出必须经过偏见审计，而不仅仅是准确性检查。",
    },
  ]
}

// ═══════════════════════════════════════════════════
// L4: 人机协作工作流 — 存储操作
// ═══════════════════════════════════════════════════

export function loadWorkflows(): CollaborationWorkflow[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(L4_WORKFLOWS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveWorkflows(workflows: CollaborationWorkflow[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(L4_WORKFLOWS_KEY, JSON.stringify(workflows))
}

export function createWorkflow(name: string, description: string, department: string, category: CollaborationWorkflow["category"]): CollaborationWorkflow {
  const wf: CollaborationWorkflow = {
    id: `wf_${Date.now()}`,
    name, description, department, category,
    nodes: [
      { id: "start", type: "input", label: "任务输入", description: "接收任务或数据", inputs: [], outputs: ["任务描述"] },
      { id: "end", type: "output", label: "结果输出", description: "交付最终产出", inputs: ["最终产出"], outputs: [] },
    ],
    edges: [{ id: "e_start_end", source: "start", target: "end" }],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalTimeSaved: 0,
    qualityScore: 0.5,
  }
  const wfs = loadWorkflows()
  wfs.push(wf)
  saveWorkflows(wfs)
  return wf
}

export function updateWorkflow(id: string, updates: Partial<CollaborationWorkflow>): void {
  const wfs = loadWorkflows()
  const idx = wfs.findIndex(w => w.id === id)
  if (idx >= 0) {
    wfs[idx] = { ...wfs[idx], ...updates, updatedAt: new Date().toISOString() }
    saveWorkflows(wfs)
  }
}

export function deleteWorkflow(id: string): void {
  saveWorkflows(loadWorkflows().filter(w => w.id !== id))
}

export function addWorkflowNode(workflowId: string, node: WorkflowNode): void {
  const wfs = loadWorkflows()
  const wf = wfs.find(w => w.id === workflowId)
  if (wf) { wf.nodes.push(node); wf.updatedAt = new Date().toISOString(); saveWorkflows(wfs) }
}

export function addWorkflowEdge(workflowId: string, edge: WorkflowEdge): void {
  const wfs = loadWorkflows()
  const wf = wfs.find(w => w.id === workflowId)
  if (wf) { wf.edges.push(edge); wf.updatedAt = new Date().toISOString(); saveWorkflows(wfs) }
}

export function removeWorkflowNode(workflowId: string, nodeId: string): void {
  const wfs = loadWorkflows()
  const wf = wfs.find(w => w.id === workflowId)
  if (wf) { wf.nodes = wf.nodes.filter(n => n.id !== nodeId); wf.edges = wf.edges.filter(e => e.source !== nodeId && e.target !== nodeId); wf.updatedAt = new Date().toISOString(); saveWorkflows(wfs) }
}

// ═══════════════════════════════════════════════════
// L5: 组织认知 — 存储操作
// ═══════════════════════════════════════════════════

export function loadDecisions(): DecisionRecord[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(L5_DECISIONS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveDecisions(decisions: DecisionRecord[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(L5_DECISIONS_KEY, JSON.stringify(decisions))
}

export function recordDecision(decision: Omit<DecisionRecord, "id" | "lessons">): DecisionRecord {
  const d: DecisionRecord = {
    ...decision,
    id: `dec_${Date.now()}`,
    lessons: [],
  }
  const ds = loadDecisions()
  ds.push(d)
  saveDecisions(ds)
  return d
}

export function reviewDecision(id: string, outcome: DecisionRecord["outcome"], lessons: string[]): void {
  const ds = loadDecisions()
  const idx = ds.findIndex(d => d.id === id)
  if (idx >= 0) {
    ds[idx].outcome = outcome
    ds[idx].reviewDate = new Date().toISOString()
    ds[idx].lessons = lessons
    saveDecisions(ds)
  }
}

export function loadKnowledgeFlows(): KnowledgeFlowMetric[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(L5_FLOWS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
export function saveKnowledgeFlows(flows: KnowledgeFlowMetric[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(L5_FLOWS_KEY, JSON.stringify(flows))
}

export function getOrgCognitionReport(): OrgCognitionReport {
  const decisions = loadDecisions()
  const flows = loadKnowledgeFlows()

  const frameworks = new Map<string, number>()
  const biases = new Map<string, number>()
  for (const d of decisions) {
    for (const a of d.assumptions) {
      const fw = a.includes("SWOT") ? "SWOT" : a.includes("ROI") ? "ROI分析" : a.includes("竞品") ? "竞品对标" : a.includes("用户") ? "用户调研" : "经验判断"
      frameworks.set(fw, (frameworks.get(fw) || 0) + 1)
    }
    // 从复盘教训中提取偏见
    for (const l of d.lessons) {
      if (l.includes("乐观") || l.includes("过于自信")) biases.set("过度乐观", (biases.get("过度乐观") || 0) + 1)
      if (l.includes("确认") || l.includes("只看了")) biases.set("确认偏差", (biases.get("确认偏差") || 0) + 1)
      if (l.includes("跟风") || l.includes("别人")) biases.set("从众效应", (biases.get("从众效应") || 0) + 1)
    }
  }

  // 团队认知
  const teamMap = new Map<string, { count: number; totalSpeed: number; reversals: number }>()
  for (const d of decisions) {
    if (!teamMap.has(d.department)) teamMap.set(d.department, { count: 0, totalSpeed: 0, reversals: 0 })
    const t = teamMap.get(d.department)!
    t.count++
    if (d.outcome === "错误") t.reversals++
  }

  // AI依赖度
  const aiTasks = new Map<string, number>()
  const humanTasks = new Map<string, number>()
  for (const f of flows) {
    aiTasks.set(f.topic, (aiTasks.get(f.topic) || 0) + (f.flowType === "AI辅助" ? 1 : 0))
    humanTasks.set(f.topic, (humanTasks.get(f.topic) || 0) + (f.flowType !== "AI辅助" ? 1 : 0))
  }
  const totalTasks = [...aiTasks.values()].reduce((s, v) => s + v, 0) + [...humanTasks.values()].reduce((s, v) => s + v, 0)

  return {
    decisionHistory: decisions,
    knowledgeFlows: flows,
    cognitiveDiversity: {
      frameworksInUse: Array.from(frameworks.entries()).map(([name, count]) => ({ name, count })),
      dominantBias: Array.from(biases.entries()).map(([bias, prevalence]) => ({ bias, prevalence: prevalence / decisions.length })),
      innovationIndex: decisions.length > 0 ? Math.min(1, (frameworks.size / Math.max(decisions.length, 1)) * 3) : 0.3,
    },
    aiDependency: {
      highDependencyTasks: Array.from(aiTasks.entries()).filter(([, v]) => v > 3).map(([task, v]) => ({ task, aiReliance: v })),
      humanOnlyTasks: Array.from(humanTasks.entries()).filter(([, v]) => v > 2).map(([task, v]) => ({ task, count: v })),
      collaborationRatio: totalTasks > 0 ? [...aiTasks.values()].reduce((s, v) => s + v, 0) / totalTasks : 0,
    },
    teamCognition: Array.from(teamMap.entries()).map(([teamName, data]) => ({
      teamName,
      averageThinkingDepth: Math.min(1, 0.3 + Math.random() * 0.5),
      decisionSpeed: data.count > 0 ? 3 + Math.random() * 10 : 0,
      reversalRate: data.count > 0 ? data.reversals / data.count : 0,
    })),
  }
}

// ═══════════════════════════════════════════════════
// L1-L3 员工进度存储
// ═══════════════════════════════════════════════════

export function loadL1Attempts(): SecurityAttempt[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(L1_ATTEMPTS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
export function saveL1Attempt(attempt: SecurityAttempt) {
  const arr = loadL1Attempts()
  arr.push(attempt)
  localStorage.setItem(L1_ATTEMPTS_KEY, JSON.stringify(arr))
}

export function loadL2Submissions(): PromptSubmission[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(L2_SUBMISSIONS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
export function saveL2Submission(submission: PromptSubmission) {
  const arr = loadL2Submissions()
  arr.push(submission)
  localStorage.setItem(L2_SUBMISSIONS_KEY, JSON.stringify(arr))
}

export function loadL3Attempts(): JudgmentAttempt[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(L3_ATTEMPTS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
export function saveL3Attempt(attempt: JudgmentAttempt) {
  const arr = loadL3Attempts()
  arr.push(attempt)
  localStorage.setItem(L3_ATTEMPTS_KEY, JSON.stringify(arr))
}
