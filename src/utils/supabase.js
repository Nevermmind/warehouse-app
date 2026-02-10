import { createClient } from '@supabase/supabase-js'

// Supabase 项目配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建 Supabase 客户端（延迟检查环境变量）
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '')

// 导出一个函数来检查配置
export function checkSupabaseConfig() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in your environment variables.'
    )
  }
  return true
}
