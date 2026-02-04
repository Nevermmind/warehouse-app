-- ============================================
-- 上下班时间追踪 - 简化版数据库设置
-- 所有记录对所有登录用户可见和可编辑
-- ============================================

-- ============================================
-- 第一步：删除所有旧策略
-- ============================================

DROP POLICY IF EXISTS "Users can view commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can insert commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can update commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can delete commute records" ON commute_records;

DROP POLICY IF EXISTS "Users can view routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can insert routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can update routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can delete own routes" ON commute_routes;

DROP POLICY IF EXISTS "Users can view own routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can insert own routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can update own routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can delete own routes" ON commute_routes;

-- ============================================
-- 第二步：删除隐私相关字段（可选，如果想保留字段就注释掉）
-- ============================================

-- 删除 commute_records 表的隐私字段
ALTER TABLE commute_records DROP COLUMN IF EXISTS is_private;
ALTER TABLE commute_records DROP COLUMN IF EXISTS created_by;

-- 删除 commute_routes 表的隐私字段
ALTER TABLE commute_routes DROP COLUMN IF EXISTS is_private;
ALTER TABLE commute_routes DROP COLUMN IF EXISTS created_by;

-- ============================================
-- 第三步：创建新的简单策略
-- ============================================

-- commute_records 表策略（所有记录公开）
CREATE POLICY "Enable all access for commute_records"
  ON commute_records FOR ALL
  USING (true)
  WITH CHECK (true);

-- commute_routes 表策略（所有路线公开）
CREATE POLICY "Enable all access for commute_routes"
  ON commute_routes FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 验证设置
-- ============================================

-- 查看最终策略
SELECT
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename IN ('commute_records', 'commute_routes')
ORDER BY tablename, cmd;

-- ============================================
-- 完成！现在所有记录都是公开的：
-- - 所有登录用户都能查看所有记录
-- - 所有登录用户都能添加/编辑/删除所有记录
-- - 没有隐私限制
-- ============================================
