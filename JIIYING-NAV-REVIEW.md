# 即影（思见子模块）— 一级导航栏代码审查报告

> 审查日期: 2026-07-16
> 仓库: h041108/sijian-20260616 (master)
> 审查范围: src/app/page.tsx（思见主站顶栏）+ src/app/jiying/layout.tsx（即影导航栏）

---

## 一、思见主站顶栏（思见 → 即影入口）

### 代码位置
`src/app/page.tsx` — 内联 JSX，非独立组件

### 当前逻辑

```tsx
{/* 顶栏 — 品牌区 */}
<div className="shrink-0 h-11 px-4 flex items-center justify-between bg-white border-b border-gray-50">
  <div className="flex items-center gap-1.5">
    <span className="text-[22px] font-extrabold tracking-tight ...">思见</span>
    <span className="text-[10px] font-medium hidden sm:inline-block ...">所思即所见</span>
  </div>
  <div className="flex items-center gap-1.5">
    <a href="/jiying" className="...">
      🎬 <span>即影</span>
    </a>
    <button onClick={() => setShowMobileMenu(...)}>☰</button>
  </div>
</div>
```

**元素：** 思见品牌名 → 即影入口按钮 → hamburger菜单

### 下拉菜单（hamburgerLinks）
```tsx
const hamburgerLinks = (
  <>
    <a href="/jiying">🎬 即影</a>
    <hr />
    <a href="/pricing">定价</a>
    <a href="/b-end">B端工作台</a>
    <SharedList />
  </>
)
```

---

## 二、即影子模块一级导航栏（核心审查对象）

### 代码位置
`src/app/jiying/layout.tsx` — 独立 Layout 组件

### 导航菜单项（NAV_ITEMS）

| 序号 | 路由 | 标签 | 说明 |
|:----:|------|------|------|
| 1 | `/jiying/agents` | 🤖 AI引擎 | Agent 调度 |
| 2 | `/jiying/daily-content` | 📋 每日内容 | 30秒审核 |
| 3 | `/jiying/manga` | 🎬 即刻影片工厂 | 漫剧引擎 |
| 4 | `/jiying/digital-human` | 🎙️ 数字人口播 | 数字人 |
| 5 | `/jiying/studio` | 🖼️ 超级图片社 | 图片工作室 |
| 6 | `/jiying/media-library` | 🗂️ 素材库 | 媒体管理 |
| 7 | `/jiying/portfolio` | 🖼️ 作品展示 | 作品集 |

### 导航栏 UI 结构

```tsx
<header className="relative z-10 bg-[#0C0C14]/80 backdrop-blur-xl border-b border-black/[0.04]">
  <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
    <!-- 左侧 -->
    <div>
      <Link href="/jiying">🎬 即影</Link>  <!-- Logo -->
      <nav>                                 <!-- 导航菜单 -->
        {NAV_ITEMS.map(item => (
          <Link href={item.href}>{item.label}</Link>
        ))}
      </nav>
    </div>
    <!-- 右侧 -->
    <div>
      {user ? <button>退出</button> : <button>登录</button>}
      {user && <Link to="/portfolio">👤 {user.nickname}</Link>}
      <button>☰ hamburger</button>  <!-- 移动端 -->
    </div>
  </div>
</header>
```

### 付费引导条

当用户已登录但未付费时，导航栏下方显示：
```tsx
💎 花20元开启你的自媒体公司 — 点击解锁全部功能 →
```

### 登录弹窗
集成 Portal 渲染的 AuthModal，支持：
- 📧 邮箱登录/注册
- 📱 手机号验证（PhoneAuth 组件）
- 绑定自媒体账号

---

## 三、架构特色

### 即影采用"双向入口"设计

```
思见主站（认知层）
  顶栏 → [🎬 即影] 按钮 → 跳转到 /jiying
  下拉菜单 → [🎬 即影] 链接

即影子模块（创作层）
  独立导航栏 → 7个功能模块入口
  独立 Layout（深色主题 #0C0C14）
  独立用户认证（Portal弹窗）
  独立付费墙（20元解锁）
```

### 与思见主站的区别

| 维度 | 思见主站顶栏 | 即影导航栏 |
|------|------------|-----------|
| 主题 | 白色/浅色 | 深色(#0C0C14) |
| 导航项 | 3个外部链接 | 7个功能模块 |
| 用户系统 | AuthBar 组件 | Portal 弹窗 |
| 付费 | 无 | 付费引导条 |
| 定位 | 认知层入口 | 创作层工作台 |

---

## 四、商业化角度分析

### 已做好的
- ✅ **7个功能菜单** — 覆盖Agent调度、内容生产、素材管理全链路
- ✅ **深色品牌主题** — 独立视觉语言，区别于思见主站
- ✅ **Portal 登录弹窗** — 确保不被其他元素遮挡
- ✅ **付费引导条** — 未付费用户的转化路径
- ✅ **用户头像展示** — 导航栏显示昵称
- ✅ **手机/邮箱双认证** — 降低注册门槛

### 可改进的点
- ⚠️ **"升级"按钮缺失** — 没有像之前思见重构版那样的显性付费入口
- ⚠️ **配额/使用量未展示** — PRD中定义的20元定价，导航栏没有展示剩余使用次数
- ⚠️ **搜索功能缺失** — 素材库多但无全局搜索入口
- ⚠️ **通知/消息未接入** — 无系统消息或更新提示
- ⚠️ **导航栏未从思见重构中同步** — 思见主页的重构 NavigationBar 尚未应用到即影

---

## 五、审查结论

即影的一级导航栏代码结构合理，采用独立 Layout 模式，7个导航菜单覆盖了 PRD 中定义的 15 个 Agent 的主要入口。视觉上采用深色主题与思见主站形成品牌区隔。

**相比我们之前对思见导航栏的审查，即影已基本达到了"商业化导航栏"的要求**（有登录、有菜单项、有付费引导），但在配额的可见性和升级转化路径上还有优化空间。


## 实施记录

### 2026-07-16 — P0改造完成 ✅

**改动：** `src/app/jiying/layout.tsx`
1. 新增配额 state（usageCount + USAGE_LIMIT=3）
2. 新增等级 state（userLevel: 青铜/白银/黄金）
3. 导航栏右侧增加：配额显示 + 等级徽章 + 升级按钮
4. 退出时重新初始化配额/等级
5. 数据源：localStorage（待后续对接真实API）

**改后的导航栏右侧布局：**
[● 3/3] [🥉 青铜] [⬆ 升级] [退出] [👤 user] [☰]
