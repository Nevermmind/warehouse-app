-- ============================================
-- 简化版：所有记录都是公开的
-- 删除隐私功能，所有登录用户都能查看/编辑/删除所有记录
-- ============================================

-- 删除 commute_records 表的所有策略
DROP POLICY IF EXISTS "Users can view commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can insert commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can update commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can delete commute records" ON commute_records;

-- 创建简单的公开策略（所有记录都可见/可编辑/可删除）
CREATE POLICY "Users can view commute records"
  ON commute_records FOR SELECT
  USING (true);  -- 所有登录用户都能查看

CREATE POLICY "Users can insert commute records"
  ON commute_records FOR INSERT
  WITH CHECK (true);  -- 所有登录用户都能插入

CREATE POLICY "Users can update commute records"
  ON commute_records FOR UPDATE
  USING (true);  -- 所有登录用户都能更新

CREATE POLICY "Users can delete commute records"
  ON commute_records FOR DELETE
  USING (true);  -- 所有登录用户都能删除

-- ============================================

-- 删除 commute_routes 表的所有策略
DROP POLICY IF EXISTS "Users can view routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can insert routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can update routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can delete own routes" ON commute_routes;

-- 创建简单的公开策略（所有路线都可见/可编辑/可删除）
CREATE POLICY "Users can view routes"
  ON commute_routes FOR SELECT
  USING (true);  -- 所有登录用户都能查看

CREATE POLICY "Users can insert routes"
  ON commute_routes FOR INSERT
  WITH CHECK (true);  -- 所有登录用户都能插入

CREATE POLICY "Users can update routes"
  ON commute_routes FOR UPDATE
  USING (true);  -- 所有登录用户都能更新

CREATE POLICY "Users can delete own routes"
  ON commute_routes FOR DELETE
  USING (true);  -- 所有登录用户都能删除

-- ============================================
-- 执行完成后：
-- - 所有通勤记录和路线都是公开的
-- - 夫妻俩都能看到、编辑、删除所有记录
-- - is_private 和 created_by 字段保留但不影响权限
-- ============================================
