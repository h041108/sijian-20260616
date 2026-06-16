"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Institution, InstitutionDashboard, InstitutionTier,
  loadInstitution, createInstitution, updateInstitution,
  generateTeacherInviteCode, addTeacher, removeTeacher,
  generateStudentInviteCode, enrollStudent, removeStudent,
  addToLibrary, removeFromLibrary, updateLibraryItem,
  recordPayment, upgradeTier,
  getInstitutionDashboard, seedInstitutionData,
  ContentItem, TeacherInviteCode, StudentInviteCode,
} from "@/lib/institution"
import { loadUsers } from "@/lib/sijian-user"
import { loadRooms } from "@/lib/memory-palace"

const SUBJECT_OPTIONS = [
  "数学","物理","化学","生物","历史","地理","政治","语文","英语","编程","美术","音乐","通用",
]
const GRADE_OPTIONS = ["小学","初中","高一","高二","高三","大学","成人"]
const TIER_LABELS: Record<InstitutionTier, string> = { org_standard: "标准版", org_flagship: "旗舰版" }
const TIER_PRICES: Record<InstitutionTier, { monthly: number; yearly: number }> = {
  org_standard: { monthly: 299, yearly: 2699 },
  org_flagship: { monthly: 999, yearly: 8999 },
}

export default function InstitutionManager() {
  const [inst, setInst] = useState<Institution | null>(null)
  const [dash, setDash] = useState<InstitutionDashboard | null>(null)
  const [tab, setTab] = useState<"dashboard" | "teachers" | "students" | "library" | "branding" | "billing">("dashboard")
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState("")
  const [createTier, setCreateTier] = useState<InstitutionTier>("org_standard")
  const [createCategories, setCreateCategories] = useState<string[]>([])
  const [catInput, setCatInput] = useState("")

  const refresh = useCallback(() => {
    const i = loadInstitution()
    setInst(i)
    if (i) setDash(getInstitutionDashboard())
  }, [])

  useEffect(() => {
    seedInstitutionData()
    refresh()
  }, [refresh])

  if (!inst) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#e8e5df] p-12 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
            <span className="text-3xl opacity-30">🏫</span>
          </div>
          <h2 className="text-lg font-bold text-gray-800 mb-2">还没有机构账号</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            创建机构账号后，可以管理教师团队、学生名单、共享知识库，并获得专属品牌展示和数据看板。
          </p>
          <button onClick={() => setShowCreate(true)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-medium transition-all">
            创建机构账号
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowCreate(false)}>
            <div className="bg-white rounded-2xl shadow-2xl w-[480px] p-8" onClick={e => e.stopPropagation()}>
              <h2 className="text-lg font-bold text-gray-800 mb-6">🏫 创建机构账号</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">机构名称</label>
                  <input value={createName} onChange={e => setCreateName(e.target.value)}
                    placeholder="如：星辰思维训练中心"
                    className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">套餐方案</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setCreateTier("org_standard")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        createTier === "org_standard" ? "border-blue-400 bg-blue-50" : "border-[#e8e5df]"
                      }`}>
                      <div className="text-sm font-bold text-gray-800">标准版</div>
                      <div className="text-2xl font-bold text-blue-600 mt-1">¥299<span className="text-xs text-gray-400">/月</span></div>
                      <div className="text-xs text-gray-400 mt-1">5教师 · 500知识空间</div>
                    </button>
                    <button onClick={() => setCreateTier("org_flagship")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        createTier === "org_flagship" ? "border-purple-400 bg-purple-50" : "border-[#e8e5df]"
                      }`}>
                      <div className="text-sm font-bold text-gray-800">旗舰版</div>
                      <div className="text-2xl font-bold text-purple-600 mt-1">¥999<span className="text-xs text-gray-400">/月</span></div>
                      <div className="text-xs text-gray-400 mt-1">20教师 · 无限 · API</div>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">培训科目</label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {createCategories.map(c => (
                      <span key={c} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1">
                        {c} <button onClick={() => setCreateCategories(prev => prev.filter(x => x !== c))} className="text-blue-400 hover:text-red-500">✕</button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <select value={catInput} onChange={e => { setCatInput(e.target.value); if (e.target.value) { setCreateCategories(prev => [...new Set([...prev, e.target.value])]); setCatInput("") } }}
                      className="flex-1 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm">
                      <option value="">选择科目</option>
                      {SUBJECT_OPTIONS.filter(s => !createCategories.includes(s)).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setShowCreate(false)}
                  className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-5 py-2.5 text-sm">取消</button>
                <button onClick={() => { createInstitution(createName.trim(), createTier, createCategories); refresh(); setShowCreate(false) }}
                  disabled={!createName.trim() || createCategories.length === 0}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-medium disabled:opacity-40">
                  创建机构 · {createTier === "org_flagship" ? "¥999/月" : "¥299/月"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!dash) return null

  return (
    <div className="space-y-6">
      {/* ═══ 顶部导航 ═══ */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white"
              style={{ background: `linear-gradient(135deg, ${inst.primaryColor}, ${inst.primaryColor}cc)` }}>
              {inst.shortName[0]}
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-800">{inst.name}</h2>
              <p className="text-[11px] text-gray-400">
                {TIER_LABELS[inst.tier]} · 创建于 {new Date(inst.createdAt).toLocaleDateString("zh")} · 到期 {new Date(inst.expiryDate).toLocaleDateString("zh")}
              </p>
            </div>
          </div>
          <button onClick={() => upgradeTier(inst.tier === "org_standard" ? "org_flagship" : "org_standard")}
            className="text-xs text-blue-500 hover:text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg">
            升级到{inst.tier === "org_standard" ? "旗舰版" : "标准版"}
          </button>
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {[
            { id: "dashboard" as const, icon: "📊", label: "运营看板" },
            { id: "teachers" as const, icon: "👩‍🏫", label: "教师管理" },
            { id: "students" as const, icon: "👥", label: "学生管理" },
            { id: "library" as const, icon: "📚", label: "知识库" },
            { id: "branding" as const, icon: "🎨", label: "品牌设置" },
            { id: "billing" as const, icon: "💰", label: "账单记录" },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                tab === t.id ? "bg-blue-100 text-blue-700" : "text-gray-500 hover:bg-gray-100"
              }`}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════
          运营看板
          ════════════════════════════════════════ */}
      {tab === "dashboard" && (
        <div className="space-y-4">
          {/* 紧急提醒 */}
          {dash.operations.alerts.length > 0 && (
            <div className="space-y-1.5">
              {dash.operations.alerts.map((a, i) => (
                <div key={i} className={`px-4 py-2.5 rounded-xl text-sm ${a.startsWith("⚠") ? "bg-yellow-50 border border-yellow-200 text-yellow-700" : a.startsWith("📅") ? "bg-red-50 border border-red-200 text-red-700" : "bg-blue-50 border border-blue-200 text-blue-700"}`}>
                  {a}
                </div>
              ))}
            </div>
          )}

          {/* 营收卡片 */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: "💰", label: "月营收", value: `¥${dash.revenue.monthly}`, color: "text-green-700", bg: "bg-green-50" },
              { icon: "📈", label: "年营收", value: `¥${dash.revenue.yearly}`, color: "text-blue-700", bg: "bg-blue-50" },
              { icon: "👤", label: "学生ARPU", value: `¥${dash.revenue.avgRevenuePerStudent.toFixed(1)}`, color: "text-purple-700", bg: "bg-purple-50" },
              { icon: "🔮", label: "下月预测", value: `¥${Math.round(dash.revenue.projectedNextMonth)}`, color: "text-orange-700", bg: "bg-orange-50" },
            ].map((c, i) => (
              <div key={i} className={`${c.bg} rounded-xl p-4 text-center`}>
                <div className="text-2xl font-bold mt-1 mb-0.5" style={{ color: c.color.replace("text-", "#").replace("-700","") }}>
                  {c.value}
                </div>
                <div className="text-xs text-gray-500">{c.icon} {c.label}</div>
              </div>
            ))}
          </div>

          {/* 学生 + 教师 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">👥 学生数据</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "总数", value: dash.students.total },
                  { label: "周活跃", value: dash.students.activeWeek },
                  { label: "月活跃", value: dash.students.activeMonth },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-700">{s.value}</div>
                    <div className="text-[10px] text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">本月新增</span>
                  <span className="text-green-600 font-medium">{dash.students.newThisMonth} 人</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">留存率</span>
                  <span className="font-medium">{Math.round(dash.students.retentionRate * 100)}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">流失率</span>
                  <span className={dash.students.churnRate > 0.3 ? "text-red-600" : "text-green-600"}>
                    {Math.round(dash.students.churnRate * 100)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-4">👩‍🏫 教师数据</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: "总数", value: dash.teachers.total },
                  { label: "活跃", value: dash.teachers.activeWeek },
                  { label: "内容数", value: dash.teachers.contentPublished },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-xl font-bold text-gray-700">{s.value}</div>
                    <div className="text-[10px] text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">满意度评分</span>
                  <span className="text-yellow-600 font-medium">★ {dash.teachers.avgSatisfaction.toFixed(1)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">最佳教师</span>
                  <span className="font-medium">{dash.teachers.topTeacher}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">NPS</span>
                  <span className="font-medium">{dash.operations.npsScore}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 内容 + 运营 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">📚 内容数据</h3>
              {dash.content.popularSubjects.length > 0 ? (
                <div className="space-y-2">
                  {dash.content.popularSubjects.slice(0, 5).map(s => (
                    <div key={s.subject} className="flex items-center gap-2 text-xs">
                      <span className="text-gray-600 w-12">{s.subject}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-gray-100">
                        <div className="h-full bg-blue-400 rounded-full" style={{ width: `${Math.min(100, (s.avgView / (dash.content.popularSubjects[0]?.avgView || 1)) * 100)}%` }} />
                      </div>
                      <span className="text-gray-400">{Math.round(s.avgView)} 观看</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 py-4 text-center">还没有发布内容</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-[#e8e5df] p-5">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">⚡ 运营指标</h3>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "总场次", value: dash.operations.totalSessions },
                  { label: "均时长(分)", value: dash.operations.avgSessionDuration },
                  { label: "高峰时段", value: dash.operations.peakHour },
                ].map(s => (
                  <div key={s.label} className="text-center p-2 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-700">{s.value}</div>
                    <div className="text-[10px] text-gray-400">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════
          教师管理
          ════════════════════════════════════════ */}
      {tab === "teachers" && <TeachersPanel inst={inst} refresh={refresh} />}

      {/* ════════════════════════════════════════
          学生管理
          ════════════════════════════════════════ */}
      {tab === "students" && <StudentsPanel inst={inst} refresh={refresh} />}

      {/* ════════════════════════════════════════
          知识库
          ════════════════════════════════════════ */}
      {tab === "library" && <LibraryPanel inst={inst} refresh={refresh} />}

      {/* ════════════════════════════════════════
          品牌设置
          ════════════════════════════════════════ */}
      {tab === "branding" && <BrandingPanel inst={inst} refresh={refresh} />}

      {/* ════════════════════════════════════════
          账单记录
          ════════════════════════════════════════ */}
      {tab === "billing" && <BillingPanel inst={inst} refresh={refresh} />}
    </div>
  )
}

// ═══════════════════════════════════════════════════
// 子面板组件
// ═══════════════════════════════════════════════════

function TeachersPanel({ inst, refresh }: { inst: Institution; refresh: () => void }) {
  const [teacherCode, setTeacherCode] = useState("")
  const users = useMemo(() => {
    if (typeof window === "undefined") return []
    return loadUsers()
  }, [])
  const teacherUsers = useMemo(() => users.filter(u => inst.teachers.includes(u.id)), [users, inst.teachers])

  return (
    <div className="space-y-4">
      {/* 生成邀请码 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🔗 生成教师邀请码</h3>
        <p className="text-xs text-gray-400 mb-3">每位教师使用一个独立邀请码加入。邀请码只限教师角色使用，不影响邀请次数限制。</p>
        <div className="flex gap-3 items-end">
          <button onClick={() => setTeacherCode(generateTeacherInviteCode())}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 text-sm font-medium transition-all">
            生成邀请码
          </button>
          {teacherCode && (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-xl border border-green-200">
              <span className="text-xl font-bold tracking-[6px] text-green-800">{teacherCode}</span>
              <button onClick={() => { navigator.clipboard.writeText(teacherCode); setTeacherCode("") }}
                className="text-xs text-green-600 hover:text-green-800 underline">复制</button>
            </div>
          )}
        </div>
        {inst.teacherCodes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {inst.teacherCodes.map((tc, i) => (
              <span key={i} className={`text-xs px-3 py-1 rounded-full border ${tc.used ? "bg-gray-50 text-gray-400 border-gray-200" : "bg-blue-50 text-blue-700 border-blue-200"}`}>
                {tc.code} {tc.used ? "(已使用)" : "(可用)"}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 教师列表 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">👩‍🏫 教师团队 ({teacherUsers.length}人)</h3>
        {teacherUsers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">还没有教师加入</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {teacherUsers.map(t => {
              const rooms = loadRooms()
              const teacherRooms = rooms.filter(r => r.name.startsWith(t.nickname))
              const items = teacherRooms.flatMap(r => r.items)
              const avgMastery = items.length > 0 ? items.reduce((s, i) => s + i.mastery, 0) / items.length : 0
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-[#e8e5df]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: t.avatar || "#6366F1" }}>{t.nickname[0]}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-gray-800">{t.nickname}</div>
                    <div className="text-xs text-gray-400">{items.length}概念 · 均掌握{Math.round(avgMastery * 100)}%</div>
                  </div>
                  <button onClick={() => { removeTeacher(t.id); refresh() }}
                    className="text-xs text-red-400 hover:text-red-600">移除</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function StudentsPanel({ inst, refresh }: { inst: Institution; refresh: () => void }) {
  const [studentCode, setStudentCode] = useState("")
  const [maxUses, setMaxUses] = useState(30)
  const users = useMemo(() => { if (typeof window === "undefined") return []; return loadUsers() }, [])
  const studentUsers = useMemo(() => users.filter(u => inst.students.includes(u.id)), [users, inst.students])

  return (
    <div className="space-y-4">
      {/* 生成学生邀请码 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">🔗 生成学生邀请码</h3>
        <p className="text-xs text-gray-400 mb-3">一个邀请码可以让多名学生加入。建议按班级生成不同的邀请码，方便管理。</p>
        <div className="flex gap-3 items-end">
          <div>
            <label className="text-[10px] text-gray-400 block mb-1">可邀请人数</label>
            <input type="number" min={1} max={500} value={maxUses} onChange={e => setMaxUses(Number(e.target.value))}
              className="w-24 rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2 text-sm text-center" />
          </div>
          <button onClick={() => setStudentCode(generateStudentInviteCode(maxUses))}
            className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 text-sm font-medium transition-all">
            生成邀请码
          </button>
          {studentCode && (
            <div className="flex items-center gap-2 p-2.5 bg-green-50 rounded-xl border border-green-200">
              <span className="text-xl font-bold tracking-[6px] text-green-800">{studentCode}</span>
              <button onClick={() => { navigator.clipboard.writeText(studentCode); setStudentCode("") }}
                className="text-xs text-green-600 hover:text-green-800 underline">复制</button>
            </div>
          )}
        </div>
        {inst.studentCodes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {inst.studentCodes.map((sc, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                {sc.code} · {sc.usedCount}/{sc.maxUses} 已用
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 学生列表 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">👥 学生名单 ({studentUsers.length}人)</h3>
          <span className="text-xs text-gray-400">
            周活跃 {studentUsers.filter(s => {
              const rooms = loadRooms()
              const weekAgo = new Date(Date.now() - 7 * 86400000)
              return rooms.some(r => r.name.startsWith(s.nickname) &&
                r.items.some(i => i.lastReviewedAt && new Date(i.lastReviewedAt) >= weekAgo))
            }).length} 人
          </span>
        </div>
        {studentUsers.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">还没有学生通过邀请码加入</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b">
                  <th className="pb-2 text-left">学生</th>
                  <th className="pb-2 text-left">加入时间</th>
                  <th className="pb-2 text-left">概念数</th>
                  <th className="pb-2 text-left">掌握度</th>
                  <th className="pb-2 text-left">状态</th>
                  <th className="pb-2 text-left">操作</th>
                </tr>
              </thead>
              <tbody>
                {studentUsers.map(s => {
                  const rooms = loadRooms()
                  const studentRooms = rooms.filter(r => r.name.startsWith(s.nickname))
                  const items = studentRooms.flatMap(r => r.items)
                  const avgMastery = items.length > 0 ? items.reduce((a, i) => a + i.mastery, 0) / items.length : 0
                  const weekAgo = new Date(Date.now() - 7 * 86400000)
                  const active = rooms.some(r => r.name.startsWith(s.nickname) &&
                    r.items.some(i => i.lastReviewedAt && new Date(i.lastReviewedAt) >= weekAgo))
                  const overdue = items.filter(i => i.nextReviewAt && new Date(i.nextReviewAt) < new Date()).length
                  return (
                    <tr key={s.id} className="border-b border-gray-50">
                      <td className="py-2.5 font-medium text-gray-800">{s.nickname}</td>
                      <td className="py-2.5 text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString("zh")}</td>
                      <td className="py-2.5 text-xs">{items.length}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 rounded-full bg-gray-100">
                            <div className={`h-full rounded-full ${avgMastery >= 0.7 ? "bg-green-500" : avgMastery >= 0.4 ? "bg-yellow-500" : "bg-red-500"}`}
                              style={{ width: `${avgMastery * 100}%` }} />
                          </div>
                          <span className="text-xs">{Math.round(avgMastery * 100)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5">
                        {active ? (
                          <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">活跃</span>
                        ) : overdue > 3 ? (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{overdue}逾期</span>
                        ) : (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">未活跃</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <button onClick={() => { removeStudent(s.id); refresh() }}
                          className="text-xs text-red-400 hover:text-red-600">移除</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function LibraryPanel({ inst, refresh }: { inst: Institution; refresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newSubject, setNewSubject] = useState("数学")
  const [newGrade, setNewGrade] = useState("高一")
  const [newTags, setNewTags] = useState("")
  const [filterSubject, setFilterSubject] = useState("")

  const filtered = inst.contentLibrary
    .filter(c => !filterSubject || c.subject === filterSubject)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700">📚 共享知识库 ({inst.contentLibrary.length})</h3>
          <div className="flex items-center gap-2">
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}
              className="text-xs rounded-lg border border-[#e8e5df] bg-gray-50 px-3 py-1.5">
              <option value="">全部科目</option>
              {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={() => setShowAdd(true)}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-all">
              + 添加内容
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">知识库还没有内容</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map(c => (
              <div key={c.id} className={`p-4 rounded-xl border-2 transition-all ${c.published ? "border-green-200 bg-white" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {c.subject} · {c.grade}
                    </span>
                    {c.published ? (
                      <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded">已发布</span>
                    ) : (
                      <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded">草稿</span>
                    )}
                  </div>
                  <button onClick={() => removeFromLibrary(c.id)} className="text-xs text-red-400 hover:text-red-600">删除</button>
                </div>
                <h4 className="text-sm font-semibold text-gray-800 mb-1">{c.title}</h4>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <span>作者: {c.authorName}</span>
                  <span>{c.nodeCount} 节点</span>
                  <span>{c.studentViews} 查看</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  {!c.published && (
                    <button onClick={() => { updateLibraryItem(c.id, { published: true }); refresh() }}
                      className="text-xs bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-lg">
                      发布
                    </button>
                  )}
                  {c.published && (
                    <button onClick={() => { updateLibraryItem(c.id, { published: false }); refresh() }}
                      className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-600 px-2.5 py-1 rounded-lg">
                      取消发布
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800 mb-4">+ 添加到知识库</h3>
            <div className="space-y-3">
              <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                placeholder="内容标题" className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
              <div className="grid grid-cols-2 gap-3">
                <select value={newSubject} onChange={e => setNewSubject(e.target.value)}
                  className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm">
                  {SUBJECT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={newGrade} onChange={e => setNewGrade(e.target.value)}
                  className="rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-3 py-2.5 text-sm">
                  {GRADE_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <input value={newTags} onChange={e => setNewTags(e.target.value)}
                placeholder="标签 (逗号分隔)" className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <button onClick={() => setShowAdd(false)}
                className="rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 text-sm">取消</button>
              <button onClick={() => {
                addToLibrary({
                  title: newTitle.trim(), subject: newSubject, grade: newGrade,
                  type: "knowledge_space", authorId: inst.adminId, authorName: "管理员",
                  nodeCount: 0, tags: newTags.split(",").map(s => s.trim()).filter(Boolean),
                  published: false,
                })
                refresh(); setShowAdd(false); setNewTitle("")
              }} disabled={!newTitle.trim()}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-sm disabled:opacity-40">添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BrandingPanel({ inst, refresh }: { inst: Institution; refresh: () => void }) {
  const [name, setName] = useState(inst.name)
  const [shortName, setShortName] = useState(inst.shortName)
  const [slogan, setSlogan] = useState(inst.slogan)
  const [desc, setDesc] = useState(inst.description)
  const [primaryColor, setPrimaryColor] = useState(inst.primaryColor)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    updateInstitution({ name, shortName, slogan, description: desc, primaryColor })
    refresh()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e8e5df] p-6 space-y-4 max-w-2xl">
      <h3 className="text-sm font-semibold text-gray-700 mb-4">🎨 品牌设置</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">机构全称</label>
          <input value={name} onChange={e => setName(e.target.value)}
            className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">简称 (≤6字)</label>
          <input value={shortName} onChange={e => setShortName(e.target.value.slice(0, 6))}
            className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
        </div>
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">Slogan</label>
        <input value={slogan} onChange={e => setSlogan(e.target.value)}
          className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] px-4 py-2.5 text-sm" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">机构简介</label>
        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
          className="w-full rounded-xl border border-[#e8e5df] bg-[#f8faf3] p-3 text-sm resize-none" />
      </div>
      <div>
        <label className="text-xs text-gray-500 mb-1 block">品牌色</label>
        <div className="flex items-center gap-3">
          <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)}
            className="w-10 h-10 rounded-lg border cursor-pointer" />
          <span className="text-xs text-gray-400">{primaryColor}</span>
          <div className="flex gap-1">
            {["#5b5f97", "#4C51BF", "#E53E3E", "#38A169", "#DD6B20", "#805AD5", "#1A1A2E"].map(c => (
              <button key={c} onClick={() => setPrimaryColor(c)}
                className="w-6 h-6 rounded-full border-2 transition-all"
                style={{ backgroundColor: c, borderColor: primaryColor === c ? "#333" : "transparent" }} />
            ))}
          </div>
        </div>
      </div>
      <button onClick={handleSave}
        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 text-sm font-medium transition-all">
        {saved ? "✅ 已保存" : "保存品牌设置"}
      </button>
    </div>
  )
}

function BillingPanel({ inst, refresh }: { inst: Institution; refresh: () => void }) {
  const [showPay, setShowPay] = useState(false)
  const [payAmount, setPayAmount] = useState(inst.tier === "org_flagship" ? 999 : 299)
  const [payPeriod, setPayPeriod] = useState<"月" | "年">("月")

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">💰 当前套餐</h3>
            <p className="text-xs text-gray-400 mt-1">
              {TIER_LABELS[inst.tier]} · 到期 {new Date(inst.expiryDate).toLocaleDateString("zh")}
            </p>
          </div>
          <button onClick={() => setShowPay(true)}
            className="rounded-xl bg-green-600 hover:bg-green-700 text-white px-4 py-2 text-sm font-medium transition-all">
            💳 续费
          </button>
        </div>
        {inst.tier === "org_flagship" && (
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-xs text-purple-700">
            🚀 旗舰版特权：20教师 · 无限构建 · API 接入 · 白标定制 · 定制域名 · 优先支持
          </div>
        )}
      </div>

      {/* 账单历史 */}
      <div className="bg-white rounded-2xl border border-[#e8e5df] p-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">📋 账单历史</h3>
        {inst.billingHistory.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">还没有账单记录</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-400 border-b">
                <th className="pb-2 text-left">日期</th>
                <th className="pb-2 text-left">金额</th>
                <th className="pb-2 text-left">套餐</th>
                <th className="pb-2 text-left">周期</th>
                <th className="pb-2 text-left">状态</th>
              </tr>
            </thead>
            <tbody>
              {[...inst.billingHistory].reverse().map(b => (
                <tr key={b.id} className="border-b border-gray-50">
                  <td className="py-2.5 text-xs text-gray-600">{new Date(b.date).toLocaleDateString("zh")}</td>
                  <td className="py-2.5 text-sm font-bold text-gray-800">¥{b.amount}</td>
                  <td className="py-2.5 text-xs">{TIER_LABELS[b.plan]}</td>
                  <td className="py-2.5 text-xs text-gray-500">{b.period}</td>
                  <td className="py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      b.status === "paid" ? "bg-green-100 text-green-700" : b.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"
                    }`}>{b.status === "paid" ? "已支付" : b.status === "pending" ? "待支付" : "逾期"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showPay && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setShowPay(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-800 mb-4">💳 续费</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => { setPayPeriod("月"); setPayAmount(inst.tier === "org_flagship" ? 999 : 299) }}
                  className={`p-3 rounded-xl border-2 text-center ${payPeriod === "月" ? "border-blue-400 bg-blue-50" : "border-[#e8e5df]"}`}>
                  <div className="text-lg font-bold text-gray-800">月付</div>
                  <div className="text-sm text-blue-600">¥{inst.tier === "org_flagship" ? 999 : 299}</div>
                </button>
                <button onClick={() => { setPayPeriod("年"); setPayAmount(inst.tier === "org_flagship" ? 8999 : 2699) }}
                  className={`p-3 rounded-xl border-2 text-center ${payPeriod === "年" ? "border-green-400 bg-green-50" : "border-[#e8e5df]"}`}>
                  <div className="text-lg font-bold text-gray-800">年付</div>
                  <div className="text-sm text-green-600">¥{inst.tier === "org_flagship" ? 8999 : 2699}</div>
                  <div className="text-[10px] text-green-500">省 {Math.round((1 - (inst.tier === "org_flagship" ? 8999 : 2699) / ((inst.tier === "org_flagship" ? 999 : 299) * 12)) * 100)}%</div>
                </button>
              </div>
              <p className="text-center text-2xl font-bold text-gray-800">¥{payAmount}</p>
            </div>
            <p className="text-xs text-gray-400 text-center mt-3 mb-4">内测期间，点击按钮模拟支付</p>
            <div className="flex gap-3">
              <button onClick={() => setShowPay(false)}
                className="flex-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 py-2.5 text-sm">取消</button>
              <button onClick={() => { recordPayment(payAmount, payPeriod); refresh(); setShowPay(false) }}
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-700 text-white py-2.5 text-sm font-medium">
                确认支付 ¥{payAmount}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
