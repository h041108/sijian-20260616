import { createClient } from "@supabase/supabase-js"

// 延迟创建：仅在需求时创建，避免 SSR 时 env 空值报错
let _supabase: ReturnType<typeof createClient> | null = null

export function getSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
    if (!url || !key) {
      // 无 Supabase 配置时返回 mock
      return null as any
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_, prop) {
    const client = getSupabase()
    if (!client) {
      // 返回无操作代理
      const noop = () => Promise.resolve({ data: null, error: null })
      return (...args: any[]) => {
        if (prop === 'from') {
          const table = args[0]
          return new Proxy({} as any, {
            get(_, method) {
              if (['select', 'insert', 'update', 'delete', 'upsert'].includes(method as string)) {
                return (..._a: any[]) => ({
                  eq: () => ({ single: noop, maybeSingle: noop, order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }),
                  single: noop, maybeSingle: noop,
                  order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
                  limit: () => Promise.resolve({ data: [], error: null }),
                  then: (resolve: any) => resolve({ data: [], error: null }),
                })
              }
              if (method === 'then') return undefined
              return () => Promise.resolve({ data: null, error: null })
            }
          })
        }
        if (prop === 'auth') {
          return new Proxy({} as any, {
            get(_, method) {
              if (method === 'getSession') return () => Promise.resolve({ data: { session: null }, error: null })
              if (method === 'getUser') return () => Promise.resolve({ data: { user: null }, error: null })
              if (method === 'signOut') return () => Promise.resolve({ error: null })
              return () => Promise.resolve({ data: null, error: null })
            }
          })
        }
        return noop
      }
    }
    const val = (client as any)[prop]
    return typeof val === 'function' ? val.bind(client) : val
  }
})
