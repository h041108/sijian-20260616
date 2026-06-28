// ─── 平台验证配置 ─────────────────────────
// 每个平台的验证方式、表单字段、API地址

export type VerifyMethod = "url_parse" | "api" | "manual"

export interface PlatformVerifyConfig {
  supportsBinding: boolean
  supportsRegistration: boolean
  verifyMethod: VerifyMethod
  verifyApi?: string
  formFields: {
    name: string
    label: string
    placeholder: string
    type: "text" | "url"
    required: boolean
  }[]
  domainCheck?: string[]    // 验证链接需包含的域名
}

export const PLATFORM_VERIFY: Record<string, PlatformVerifyConfig> = {
  xiaohongshu: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "url_parse",
    domainCheck: ["xiaohongshu.com", "xhslink.com"],
    formFields: [
      { name: "profileUrl", label: "主页链接", placeholder: "请输入您的小红书主页链接", type: "url", required: true },
      { name: "nickname", label: "账号昵称", placeholder: "请输入您的账号昵称", type: "text", required: true },
    ],
  },
  douyin: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "url_parse",
    domainCheck: ["douyin.com", "iesdouyin.com"],
    formFields: [
      { name: "profileUrl", label: "主页链接或抖音号", placeholder: "请输入您的主页链接或抖音号", type: "text", required: true },
      { name: "nickname", label: "账号昵称", placeholder: "请输入您的账号昵称", type: "text", required: true },
    ],
  },
  shipinhao: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "manual",
    formFields: [
      { name: "nickname", label: "视频号名称", placeholder: "请输入您的视频号名称", type: "text", required: true },
    ],
  },
  kuaishou: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "url_parse",
    domainCheck: ["kuaishou.com"],
    formFields: [
      { name: "profileUrl", label: "快手主页链接或ID", placeholder: "请输入您的主页链接或快手ID", type: "text", required: true },
      { name: "nickname", label: "账号昵称", placeholder: "请输入您的账号昵称", type: "text", required: true },
    ],
  },
  bilibili: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "api",
    verifyApi: "https://api.bilibili.com/x/space/arc/search?mid={uid}",
    formFields: [
      { name: "profileUrl", label: "B站UID或主页链接", placeholder: "请输入您的UID或主页链接", type: "text", required: true },
      { name: "nickname", label: "账号昵称", placeholder: "请输入您的B站昵称", type: "text", required: true },
    ],
  },
  weixin: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "manual",
    formFields: [
      { name: "nickname", label: "公众号名称或原始ID", placeholder: "请输入您的公众号名称", type: "text", required: true },
    ],
  },
  twitter: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "api",
    verifyApi: "https://api.twitter.com/2/users/by/username/{username}",
    formFields: [
      { name: "profileUrl", label: "X用户名", placeholder: "请输入您的@用户名", type: "text", required: true },
    ],
  },
  youtube: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "url_parse",
    domainCheck: ["youtube.com", "youtu.be"],
    formFields: [
      { name: "profileUrl", label: "YouTube频道链接或ID", placeholder: "请输入您的频道链接或频道ID", type: "text", required: true },
      { name: "nickname", label: "频道名称", placeholder: "请输入您的频道名称", type: "text", required: true },
    ],
  },
  tiktok: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "url_parse",
    domainCheck: ["tiktok.com"],
    formFields: [
      { name: "profileUrl", label: "TikTok主页链接或@用户名", placeholder: "请输入您的主页链接或@用户名", type: "text", required: true },
    ],
  },
  facebook: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "manual",
    formFields: [
      { name: "profileUrl", label: "Facebook主页链接", placeholder: "请输入您的主页链接", type: "url", required: true },
    ],
  },
  instagram: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "url_parse",
    domainCheck: ["instagram.com"],
    formFields: [
      { name: "profileUrl", label: "Instagram主页链接或用户名", placeholder: "请输入您的主页链接或用户名", type: "text", required: true },
    ],
  },
  threads: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "manual",
    formFields: [
      { name: "profileUrl", label: "Threads主页链接", placeholder: "请输入您的主页链接", type: "url", required: true },
    ],
  },
  pinterest: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "url_parse",
    domainCheck: ["pinterest.com", "pin.it"],
    formFields: [
      { name: "profileUrl", label: "Pinterest主页链接", placeholder: "请输入您的主页链接", type: "url", required: true },
    ],
  },
  linkedin: {
    supportsBinding: true, supportsRegistration: true, verifyMethod: "url_parse",
    domainCheck: ["linkedin.com"],
    formFields: [
      { name: "profileUrl", label: "LinkedIn主页链接", placeholder: "请输入您的LinkedIn主页链接", type: "url", required: true },
    ],
  },
}

// ─── 验证函数 ───
export function validateAccount(
  platformId: string,
  profileUrl: string,
  nickname: string,
): { passed: boolean; message: string } {
  const config = PLATFORM_VERIFY[platformId]
  if (!config) return { passed: false, message: "该平台暂不支持自动验证" }

  // URL验证
  if (config.domainCheck && profileUrl) {
    const hasDomain = config.domainCheck.some(d => profileUrl.includes(d))
    if (!hasDomain) {
      return { passed: false, message: "主页链接不正确，请检查链接是否包含平台域名" }
    }
  }

  // 昵称验证
  if (config.formFields.some(f => f.name === "nickname" && f.required) && !nickname.trim()) {
    return { passed: false, message: "账号昵称不能为空" }
  }

  return { passed: true, message: "验证通过" }
}

// ─── 获取绑定表单字段 ───
export function getBindingFields(platformId: string) {
  return PLATFORM_VERIFY[platformId]?.formFields || []
}

// ─── 是否支持绑定 ───
export function supportsBinding(platformId: string): boolean {
  return PLATFORM_VERIFY[platformId]?.supportsBinding ?? true
}
