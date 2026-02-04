-- ============================================
-- 修复通勤记录隐私功能 - 最终版本
-- 使用 user_id 而不是 created_by 来判断私密记录
-- ============================================

-- 删除 commute_records 表的旧策略
DROP POLICY IF EXISTS "Users can view commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can insert commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can update commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can delete commute records" ON commute_records;

-- 创建新的 commute_records 策略（使用 user_id 判断）
CREATE POLICY "Users can view commute records"
  ON commute_records FOR SELECT
  USING (
    is_private = false OR  -- 公开记录，所有人可见
    user_id = auth.uid()   -- 私密记录，只有创建者可见
  );

CREATE POLICY "Users can insert commute records"
  ON commute_records FOR INSERT
  WITH CHECK (true);  -- 所有登录用户都能插入

CREATE POLICY "Users can update commute records"
  ON commute_records FOR UPDATE
  USING (
    is_private = false OR  -- 公开记录，所有人可编辑
    user_id = auth.uid()   -- 私密记录，只有创建者可编辑
  );

CREATE POLICY "Users can delete commute records"
  ON commute_records FOR DELETE
  USING (
    is_private = false OR  -- 公开记录，所有人可删除
    user_id = auth.uid()   -- 私密记录，只有创建者可删除
  );

-- ============================================

-- 删除 commute_routes 表的旧策略
DROP POLICY IF EXISTS "Users can view routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can insert routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can update routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can delete own routes" ON commute_routes;

-- 创建新的 commute_routes 策略（使用 user_id 判断）
CREATE POLICY "Users can view routes"
  ON commute_routes FOR SELECT
  USING (
    is_private = false OR  -- 公开路线，所有人可见
    user_id = auth.uid()   -- 私密路线，只有创建者可见
  );

CREATE POLICY "Users can insert routes"
  ON commute_routes FOR INSERT
  WITH CHECK (true);  -- 所有登录用户都能插入

CREATE POLICY "Users can update routes"
  ON commute_routes FOR UPDATE
  USING (
    is_private = false OR  -- 公开路线，所有人可编辑
    user_id = auth.uid()   -- 私密路线，只有创建者可编辑
  );

CREATE POLICY "Users can delete own routes"
  ON commute_routes FOR DELETE
  USING (
    is_private = false OR  -- 公开路线，所有人可删除
    user_id = auth.uid()   -- 私密路线，只有创建者可删除
  );

-- ============================================
-- 执行完成后：
-- 1. 所有现有记录应该都能正常显示
-- 2. 公开记录（is_private=false）：夫妻都能看到
-- 3. 私密记录（is_private=true）：只有创建者能看到
-- ============================================
