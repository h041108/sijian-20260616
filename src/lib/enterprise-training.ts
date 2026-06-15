// ─── 企业记忆宫殿：入职培训 / 定期培训 / 考核系统 ───────

import { loadRooms, MemoryRoom, PalaceItem, ReviewSlot } from "./memory-palace"

// ─── 类型 ─────────────────────────────────────────

export interface TrainingModule {
  id: string
  name: string              // "新员工信息安全培训"
  department: string        // "研发部" | "全员"
  category: string          // "入职培训" | "定期复训" | "专项提升" | "合规培训"
  description: string
  knowledgePoints: TrainingPoint[]  // 培训知识点
  assessment: TrainingAssessment    // 结业考核
  passScore: number          // 通过分数线 0-1，默认 0.7
  createdAt: string
  updatedAt: string
}

export interface TrainingPoint {
  id: string
  label: string             // ≤6字概念标签
  content: string           // 完整知识点
  importance: "critical" | "important" | "nice_to_have"
  memoryRoomId?: string     // 关联的记忆宫殿房间ID
  memoryItemId?: string     // 关联的记忆宫殿物品ID
}

export interface TrainingAssessment {
  id: string
  questions: AssessmentQuestion[]
  passingScore: number      // 0-1
  timeLimit?: number        // 分钟，可选
}

export interface AssessmentQuestion {
  id: string
  question: string
  options: string[]          // 4个选项
  correctIndex: number       // 0-3
  explanation: string        // 解析
  knowledgePointId: string   // 关联知识点
}

export interface EmployeeRecord {
  employeeId: string        // 对应用户的 userId
  employeeName: string
  department: string
  trainings: EmployeeTrainingProgress[]
  joinedAt: string
}

export interface EmployeeTrainingProgress {
  trainingModuleId: string
  assignedAt: string
  dueDate?: string
  startedAt?: string
  completedAt?: string
  // 考核记录
  assessmentAttempts: AssessmentAttempt[]
  // 各知识点掌握度
  pointMastery: Record<string, number>  // pointId → mastery 0-1
  overallMastery: number
  status: "assigned" | "in_progress" | "completed" | "overdue"
}

export interface AssessmentAttempt {
  id: string
  date: string
  answers: Record<string, number>  // questionId → chosenIndex
  score: number                    // 0-1
  passed: boolean
  timeSpent?: number               // 秒
}

// ─── 存储键 ──────────────────────────────────────

const MODULES_KEY = "sijian_enterprise_modules"
const RECORDS_KEY = "sijian_enterprise_records"

// ─── 培训模块 CRUD ──────────────────────────────

export function loadModules(): TrainingModule[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(MODULES_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveModules(modules: TrainingModule[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(MODULES_KEY, JSON.stringify(modules))
}

export function createModule(
  name: string, department: string, category: string, description: string,
  knowledgePoints: { label: string; content: string; importance: TrainingPoint["importance"] }[],
  passScore: number = 0.7,
): TrainingModule {
  const now = new Date().toISOString()
  const pointId = (i: number) => `tp_${Date.now()}_${i}`

  const points: TrainingPoint[] = knowledgePoints.map((kp, i) => ({
    id: pointId(i),
    label: kp.label.slice(0, 6),
    content: kp.content,
    importance: kp.importance,
  }))

  // 为每个知识点生成考核题目
  const questions: AssessmentQuestion[] = knowledgePoints.map((kp, i) => ({
    id: `q_${Date.now()}_${i}`,
    question: `关于"${kp.label.slice(0, 6)}"，以下哪项描述是正确的？`,
    options: [
      kp.content.slice(0, 40),
      kp.content.slice(0, 30) + "…的反向操作",
      "以上说法都不正确",
      "以上说法都正确"
    ],
    correctIndex: 0,
    explanation: kp.content,
    knowledgePointId: pointId(i),
  }))

  const module: TrainingModule = {
    id: `mod_${Date.now()}`,
    name, department, category, description,
    knowledgePoints: points,
    assessment: {
      id: `assess_${Date.now()}`,
      questions,
      passingScore: passScore,
      timeLimit: questions.length * 2, // 每题2分钟
    },
    passScore,
    createdAt: now, updatedAt: now,
  }

  const modules = loadModules()
  modules.push(module)
  saveModules(modules)
  return module
}

export function updateModule(id: string, updates: Partial<TrainingModule>): void {
  const modules = loadModules()
  const idx = modules.findIndex(m => m.id === id)
  if (idx >= 0) {
    modules[idx] = { ...modules[idx], ...updates, updatedAt: new Date().toISOString() }
    saveModules(modules)
  }
}

export function deleteModule(id: string): void {
  saveModules(loadModules().filter(m => m.id !== id))
}

// ─── 员工培训记录 CRUD ──────────────────────────

export function loadRecords(): EmployeeRecord[] {
  if (typeof window === "undefined") return []
  try { const r = localStorage.getItem(RECORDS_KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveRecords(records: EmployeeRecord[]) {
  if (typeof window === "undefined") return
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records))
}

export function assignTraining(employeeId: string, employeeName: string, department: string, trainingModuleId: string, dueDays: number = 14): void {
  const records = loadRecords()
  let record = records.find(r => r.employeeId === employeeId)
  if (!record) {
    record = { employeeId, employeeName, department, trainings: [], joinedAt: new Date().toISOString() }
    records.push(record)
  }

  const existing = record.trainings.find(t => t.trainingModuleId === trainingModuleId)
  if (existing && existing.status !== "completed") return // 已分配

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + dueDays)

  record.trainings.push({
    trainingModuleId,
    assignedAt: new Date().toISOString(),
    dueDate: dueDate.toISOString(),
    assessmentAttempts: [],
    pointMastery: {},
    overallMastery: 0,
    status: "assigned",
  })

  saveRecords(records)
}

export function startTraining(employeeId: string, trainingModuleId: string): void {
  const records = loadRecords()
  const record = records.find(r => r.employeeId === employeeId)
  if (!record) return
  const tp = record.trainings.find(t => t.trainingModuleId === trainingModuleId)
  if (tp && tp.status === "assigned") {
    tp.status = "in_progress"
    tp.startedAt = new Date().toISOString()
    saveRecords(records)
  }
}

export function updatePointMastery(employeeId: string, trainingModuleId: string, pointId: string, mastery: number): void {
  const records = loadRecords()
  const record = records.find(r => r.employeeId === employeeId)
  if (!record) return
  const tp = record.trainings.find(t => t.trainingModuleId === trainingModuleId)
  if (!tp) return
  tp.pointMastery[pointId] = mastery
  // 计算整体掌握度
  const values = Object.values(tp.pointMastery)
  tp.overallMastery = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0
  saveRecords(records)
}

export function submitAssessment(
  employeeId: string, trainingModuleId: string,
  answers: Record<string, number>, timeSpent?: number,
): AssessmentAttempt {
  const modules = loadModules()
  const mod = modules.find(m => m.id === trainingModuleId)

  let score = 0
  if (mod) {
    const total = mod.assessment.questions.length
    let correct = 0
    for (const q of mod.assessment.questions) {
      if (answers[q.id] === q.correctIndex) correct++
    }
    score = total > 0 ? correct / total : 0
  }

  const passed = score >= (mod?.passScore || 0.7)
  const attempt: AssessmentAttempt = {
    id: `att_${Date.now()}`,
    date: new Date().toISOString(),
    answers,
    score,
    passed,
    timeSpent,
  }

  const records = loadRecords()
  const record = records.find(r => r.employeeId === employeeId)
  if (record) {
    const tp = record.trainings.find(t => t.trainingModuleId === trainingModuleId)
    if (tp) {
      tp.assessmentAttempts.push(attempt)
      if (passed) {
        tp.status = "completed"
        tp.completedAt = new Date().toISOString()
      }
      // 更新掌握度：每道题关联的知识点
      if (mod) {
        for (const q of mod.assessment.questions) {
          const chosen = answers[q.id]
          const isCorrect = chosen === q.correctIndex
          const current = tp.pointMastery[q.knowledgePointId] || 0
          tp.pointMastery[q.knowledgePointId] = Math.min(1, Math.max(0, current + (isCorrect ? 0.2 : -0.1)))
        }
        const values = Object.values(tp.pointMastery)
        tp.overallMastery = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0
      }
      saveRecords(records)
    }
  }

  return attempt
}

export function getEmployeeRecord(employeeId: string): EmployeeRecord | null {
  return loadRecords().find(r => r.employeeId === employeeId) || null
}

// ─── 企业仪表盘聚合 ──────────────────────────────

export interface EnterpriseDashboard {
  totalEmployees: number
  totalModules: number
  totalCompleted: number
  totalInProgress: number
  totalOverdue: number
  averageMastery: number
  departmentStats: DepartmentStat[]
  moduleStats: ModuleStat[]
  weakestPoints: { label: string; avgMastery: number; employeeCount: number }[]
  recentCompletions: { employeeName: string; moduleName: string; date: string; score: number }[]
}

export interface DepartmentStat {
  department: string
  employeeCount: number
  completedRate: number   // 0-1
  avgMastery: number
  overdueCount: number
}

export interface ModuleStat {
  moduleId: string
  moduleName: string
  department: string
  assignedCount: number
  completedCount: number
  inProgressCount: number
  avgScore: number
}

export function getEnterpriseDashboard(): EnterpriseDashboard {
  const modules = loadModules()
  const records = loadRecords()

  // 部门统计
  const deptMap = new Map<string, {
    employees: Set<string>; completed: number; total: number; masterySum: number; masteryCount: number; overdue: number
  }>()
  for (const rec of records) {
    if (!deptMap.has(rec.department)) {
      deptMap.set(rec.department, { employees: new Set(), completed: 0, total: 0, masterySum: 0, masteryCount: 0, overdue: 0 })
    }
    const d = deptMap.get(rec.department)!
    d.employees.add(rec.employeeId)
    for (const tp of rec.trainings) {
      d.total++
      if (tp.status === "completed") d.completed++
      if (tp.status === "overdue") d.overdue++
      d.masterySum += tp.overallMastery
      d.masteryCount++
    }
  }

  const departmentStats: DepartmentStat[] = Array.from(deptMap.entries()).map(([dept, d]) => ({
    department: dept,
    employeeCount: d.employees.size,
    completedRate: d.total > 0 ? d.completed / d.total : 0,
    avgMastery: d.masteryCount > 0 ? d.masterySum / d.masteryCount : 0,
    overdueCount: d.overdue,
  }))

  // 模块统计
  const moduleStats: ModuleStat[] = modules.map(mod => {
    let assigned = 0, completed = 0, inProgress = 0, scoreSum = 0, scoreCount = 0
    for (const rec of records) {
      const tp = rec.trainings.find(t => t.trainingModuleId === mod.id)
      if (tp) {
        assigned++
        if (tp.status === "completed") completed++
        if (tp.status === "in_progress") inProgress++
        const lastAttempt = tp.assessmentAttempts[tp.assessmentAttempts.length - 1]
        if (lastAttempt) { scoreSum += lastAttempt.score; scoreCount++ }
      }
    }
    return {
      moduleId: mod.id, moduleName: mod.name, department: mod.department,
      assignedCount: assigned, completedCount: completed, inProgressCount: inProgress,
      avgScore: scoreCount > 0 ? scoreSum / scoreCount : 0,
    }
  })

  // 最薄弱知识点
  const pointMap = new Map<string, { sum: number; count: number; employees: Set<string> }>()
  for (const rec of records) {
    for (const tp of rec.trainings) {
      for (const [pid, mastery] of Object.entries(tp.pointMastery)) {
        if (!pointMap.has(pid)) pointMap.set(pid, { sum: 0, count: 0, employees: new Set() })
        const p = pointMap.get(pid)!
        p.sum += mastery; p.count++; p.employees.add(rec.employeeName)
      }
    }
  }
  // 从模块中查找知识点标签
  const pointLabelMap = new Map<string, string>()
  for (const mod of modules) {
    for (const kp of mod.knowledgePoints) {
      pointLabelMap.set(kp.id, kp.label)
    }
  }
  const weakestPoints = Array.from(pointMap.entries())
    .map(([pid, d]) => ({ label: pointLabelMap.get(pid) || pid, avgMastery: d.sum / d.count, employeeCount: d.employees.size }))
    .sort((a, b) => a.avgMastery - b.avgMastery)
    .slice(0, 10)

  // 最近完成
  const recentCompletions: EnterpriseDashboard["recentCompletions"] = []
  for (const rec of records) {
    for (const tp of rec.trainings) {
      if (tp.completedAt && tp.assessmentAttempts.length > 0) {
        const lastAttempt = tp.assessmentAttempts[tp.assessmentAttempts.length - 1]
        const modName = modules.find(m => m.id === tp.trainingModuleId)?.name || tp.trainingModuleId
        recentCompletions.push({
          employeeName: rec.employeeName,
          moduleName: modName,
          date: tp.completedAt,
          score: lastAttempt.score,
        })
      }
    }
  }
  recentCompletions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  // 汇总
  let totalInProgress = 0, totalCompleted = 0, totalOverdue = 0, masterySum = 0, masteryCount = 0
  for (const rec of records) {
    for (const tp of rec.trainings) {
      if (tp.status === "completed") totalCompleted++
      if (tp.status === "in_progress") totalInProgress++
      if (tp.status === "overdue") totalOverdue++
      masterySum += tp.overallMastery
      masteryCount++
    }
  }

  return {
    totalEmployees: records.length,
    totalModules: modules.length,
    totalCompleted,
    totalInProgress,
    totalOverdue,
    averageMastery: masteryCount > 0 ? masterySum / masteryCount : 0,
    departmentStats,
    moduleStats,
    weakestPoints,
    recentCompletions: recentCompletions.slice(0, 10),
  }
}

// ─── 种子数据 ───────────────────────────────────

export function seedEnterpriseData(): void {
  const existing = loadModules()
  if (existing.length > 0) return // 已有数据，不重复播种

  // ── 模块1: 新员工信息安全培训 ──
  createModule(
    "新员工信息安全培训", "全员", "入职培训",
    "所有新入职员工必须完成的信息安全基础培训，涵盖数据保护、密码管理和钓鱼防范",
    [
      { label: "数据分级", content: "公司将数据分为公开、内部、机密、绝密四级。机密及以上数据禁止通过个人微信等非授权渠道传输。", importance: "critical" },
      { label: "密码安全", content: "密码长度≥12位，包含大小写字母+数字+特殊字符。每90天更换，不得与之前3次重复。禁止使用生日或手机号。", importance: "critical" },
      { label: "钓鱼邮件", content: "识别钓鱼邮件的5个特征：发件地址拼写异常、紧急/恐吓措辞、要求输入密码的链接、附件类型异常、内部同事怪异语气。发现后立即报告IT部。", importance: "critical" },
      { label: "VPN使用", content: "远程办公时必须使用公司VPN接入内网。禁止在公共WiFi环境下访问内部系统。VPN密钥妥善保管，不与他人共享。", importance: "important" },
      { label: "社会工程", content: "冒充IT人员、快递员或合作方以获取信息是常见攻击手段。任何索要密码、工号或内部信息的电话/消息都应先验证对方身份。", importance: "important" },
      { label: "设备安全", content: "公司设备启用全盘加密和屏幕锁。离开座位时锁定屏幕。禁止在个人设备存储公司数据。U盘等外接存储需提前申请授权。", importance: "important" },
      { label: "数据清理", content: "纸质文件使用碎纸机销毁（机密级需交叉碎纸机）。离职时必须将所有公司数据交回主管，IT部门将远程擦除设备。", importance: "nice_to_have" },
      { label: "合规处罚", content: "违反信息安全规定将按情节给予口头警告、书面通报、扣除绩效直至解除劳动合同。泄露机密数据可能追究法律责任。", importance: "nice_to_have" },
    ],
    0.75,
  )

  // ── 模块2: 产品知识培训 ──
  createModule(
    "产品知识基础培训", "全员", "入职培训",
    "了解公司核心产品线、技术架构、客户群体和竞争格局",
    [
      { label: "核心产品", content: "公司三大产品线：智能教育平台（B端SaaS）、思维训练工具（C端App）、数据中台（PaaS）。每季度版本迭代遵循敏捷开发流程。", importance: "critical" },
      { label: "技术架构", content: "前端React/Next.js，后端Go+Python微服务，数据库PostgreSQL+MongoDB，消息队列Kafka，容器编排K8s。AI服务基于自研大模型。", importance: "important" },
      { label: "客户分层", content: "客户分为战略客户（头部教育集团/500人+）、核心客户（中型学校/100-500人）、标准客户（小型机构/<100人）。不同层级对应不同服务SLA。", importance: "important" },
      { label: "竞品分析", content: "主要竞品：A公司（侧重内容库）、B公司（侧重测评）、C公司（侧重家校沟通）。我司差异化优势在AI驱动的个性化思维训练 + 3D知识空间。", importance: "important" },
      { label: "定价体系", content: "基础版免费（3个知识空间/10人）、专业版¥299/月（无限空间/50人）、旗舰版¥999/月（含AI训练+数据看板+API接入）。企业定制另议。", importance: "nice_to_have" },
      { label: "售后流程", content: "标准SLA：紧急2小时响应、重要4小时、一般8小时。每周五自动推送产品更新周报。客户成功经理每月一次健康度回访。", importance: "important" },
    ],
    0.7,
  )

  // ── 模块3: 季度安全复训 ──
  createModule(
    "Q2安全合规复训", "全员", "定期复训",
    "每季度一次的安全合规复训，强化关键安全意识和更新最新政策",
    [
      { label: "新规解读", content: "根据2026年《数据安全管理办法》修订版，新增AI生成内容的合规审核要求。所有对外AI输出须经过内容安全过滤器。客户数据跨境需脱敏+审批。", importance: "critical" },
      { label: "钓鱼演变", content: "最新钓鱼手法包括AI语音冒充领导、深度伪造视频会议、伪装成HR发工资调整通知。验证方式升级为双通道确认：电话+企业微信双重核实。", importance: "critical" },
      { label: "密码新策", content: "2026年起强制启用Passkey生物识别登录（替代传统密码）。尚未迁移的系统保留密码，但必须启用MFA。管理员账号必须使用硬件安全密钥。", importance: "important" },
      { label: "事件演练", content: "本季度模拟场景：勒索软件攻击。发现后立即断网→通知安全团队→启动备份恢复→48小时内向管理层汇报。演练日期6月25日。", importance: "important" },
      { label: "AI安全", content: "禁止将客户数据或内部代码粘贴到公共AI工具（如ChatGPT网页版）。使用公司内部的AI平台。AI生成的代码必须经过安全扫描才能上线。", importance: "critical" },
    ],
    0.8,
  )

  // ── 为几个模拟员工分配培训 ──
  const modules = loadModules()
  const mockEmployees = [
    { id: "emp_001", name: "张小明", dept: "研发部" },
    { id: "emp_002", name: "李婷婷", dept: "市场部" },
    { id: "emp_003", name: "王建国", dept: "销售部" },
    { id: "emp_004", name: "陈思雨", dept: "行政部" },
    { id: "emp_005", name: "刘大伟", dept: "研发部" },
    { id: "emp_006", name: "赵美玲", dept: "市场部" },
  ]

  for (const emp of mockEmployees) {
    for (const mod of modules) {
      if (mod.department === "全员" || mod.department === emp.dept) {
        assignTraining(emp.id, emp.name, emp.dept, mod.id, 14)
      }
    }
  }

  // 模拟一些培训进度
  const records = loadRecords()
  for (const rec of records) {
    for (const tp of rec.trainings) {
      if (tp.trainingModuleId === modules[0]?.id) {
        // 第一个模块部分完成
        startTraining(rec.employeeId, tp.trainingModuleId)
        const mod = modules[0]
        for (const kp of mod.knowledgePoints) {
          const mastery = 0.3 + Math.random() * 0.6
          updatePointMastery(rec.employeeId, tp.trainingModuleId, kp.id, mastery)
        }
        if (Math.random() > 0.5) {
          // 一些人完成了考核
          const answers: Record<string, number> = {}
          for (const q of mod.assessment.questions) {
            answers[q.id] = Math.random() > 0.3 ? q.correctIndex : (q.correctIndex + 1) % 4
          }
          submitAssessment(rec.employeeId, tp.trainingModuleId, answers, 180 + Math.floor(Math.random() * 300))
        }
      }
      // 检查逾期
      if (tp.dueDate && new Date(tp.dueDate) < new Date() && tp.status !== "completed") {
        tp.status = "overdue"
      }
    }
  }
  saveRecords(records)
}
