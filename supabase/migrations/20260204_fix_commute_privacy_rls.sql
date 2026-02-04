-- ============================================
-- 修复通勤记录隐私RLS策略
-- ============================================

-- 删除旧的策略
DROP POLICY IF EXISTS "Users can view commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can update commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can delete commute records" ON commute_records;

-- 创建新的查看策略（修复NULL处理问题）
CREATE POLICY "Users can view commute records"
  ON commute_records FOR SELECT
  USING (
    is_private = false OR  -- 公开记录，所有人可见
    created_by IS NULL OR  -- 旧记录（没有created_by字段），默认公开
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())  -- 自己的私密记录
  );

-- 创建新的更新策略（修复NULL处理问题）
CREATE POLICY "Users can update commute records"
  ON commute_records FOR UPDATE
  USING (
    is_private = false OR  -- 公开记录，所有人可编辑
    created_by IS NULL OR  -- 旧记录，所有人可编辑
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())  -- 自己的私密记录
  );

-- 创建新的删除策略（修复NULL处理问题）
CREATE POLICY "Users can delete commute records"
  ON commute_records FOR DELETE
  USING (
    is_private = false OR  -- 公开记录，所有人可删除
    created_by IS NULL OR  -- 旧记录，所有人可删除
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())  -- 自己的私密记录
  );

-- ============================================
-- 修复通勤路线隐私RLS策略
-- ============================================

-- 删除旧的策略
DROP POLICY IF EXISTS "Users can view routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can update routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can delete own routes" ON commute_routes;

-- 创建新的查看策略（修复NULL处理问题）
CREATE POLICY "Users can view routes"
  ON commute_routes FOR SELECT
  USING (
    is_private = false OR  -- 公开路线，所有人可见
    created_by IS NULL OR  -- 旧路线，默认公开
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())  -- 自己的私密路线
  );

-- 创建新的更新策略（修复NULL处理问题）
CREATE POLICY "Users can update routes"
  ON commute_routes FOR UPDATE
  USING (
    is_private = false OR  -- 公开路线，所有人可编辑
    created_by IS NULL OR  -- 旧路线，所有人可编辑
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())  -- 自己的私密路线
  );

-- 创建新的删除策略（修复NULL处理问题）
CREATE POLICY "Users can delete own routes"
  ON commute_routes FOR DELETE
  USING (
    is_private = false OR  -- 公开路线，所有人可删除
    created_by IS NULL OR  -- 旧路线，所有人可删除
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())  -- 自己的私密路线
  );

-- ============================================
-- 执行完成后，所有记录应该都能正常显示了
-- ============================================
