# 思见/即影 部署指南

## 前置条件

1. Node.js 18+ 
2. Supabase 账号（免费层即可）
3. 火山引擎 ARK 账号（即梦图片+Seedance视频）

## 快速部署步骤

### 1. 克隆并安装依赖

```bash
cd sijian
npm install
```

### 2. 配置 Supabase

1. 在 [supabase.com](https://supabase.com) 创建项目
2. 进入 SQL Editor，依次执行 `supabase/migrations/` 下的 SQL 文件：
   - `001_complete_schema.sql`
   - `002_fix_auth_trigger.sql`  
   - `003_disable_email_confirm.sql`
3. 在 Settings → API 中获取：
   - `Project URL` → 填入 `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → 填入 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role key` → 填入 `SUPABASE_SERVICE_ROLE_KEY`

### 3. 配置 API Keys

复制 `.env.local.example` 为 `.env.local`，填入实际的 API Key：

```bash
cp .env.local.example .env.local
# 编辑 .env.local，填入你的 API Key
```

必填的 API Key：
- `DEEPSEEK_API_KEY` — DeepSeek API（文本生成）
- `JIMENG_API_KEY` — 火山引擎 ARK（即梦图片+Seedance视频）
- `VOLC_ACCESS_KEY` + `VOLC_SECRET_KEY` — 火山引擎 IAM（TTS+数字人）
- `TAVILY_API_KEY` 或 `SERPER_API_KEY` — 搜索API

### 4. 本地开发

```bash
npm run dev
```

访问 http://localhost:3000 （思见）或 http://localhost:3000/jiying （即影）

### 5. 部署到 Vercel

```bash
npm run build
```

或直接关联 GitHub 仓库到 Vercel，自动部署。

## 域名配置（可选）

在 `middleware.ts` 中已配置多域名路由：
- `jiying.cc.cd` → 自动路由到即影模块
- 主域名 → 思见模块

如果使用自定义域名，在 Vercel 中添加域名后，更新 `NEXT_PUBLIC_BASE_URL`。

## 常见问题

**Q: 图片生成返回占位图？**
A: 检查 `JIMENG_API_KEY` 是否正确配置。火山引擎 ARK 需要在控制台开通即梦和 Seedance 服务。

**Q: 注册后需要邮箱验证？**
A: 配置 `SUPABASE_SERVICE_ROLE_KEY` 后会自动确认邮箱。或在 Supabase Dashboard → Authentication → Settings 中关闭 "Confirm email"。

**Q: 视频合成无服务端 FFmpeg？**
A: 当前视频合成走客户端 Canvas + MediaRecorder API，导出 WebM 格式。如需 MP4 服务端合成，需部署 FFmpeg 服务。
