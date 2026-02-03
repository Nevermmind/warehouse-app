import { createClient } from '@supabase/supabase-js'

// Supabase 项目配置（从环境变量读取，如果未配置则使用默认值）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xalchjoarpvtbnegjkqm.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbGNoam9hcnB2dGJuZWdqa3FtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4NzcxMTYsImV4cCI6MjA4NDQ1MzExNn0.fHwcmg3oykWLdfapItp35CVBlRMN_v0aaXjshoNAjtE'

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
