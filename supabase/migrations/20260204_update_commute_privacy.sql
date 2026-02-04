-- ============================================
-- 上下班时间追踪 - 添加私密记录功能
-- ============================================

-- 添加私密标记字段到 commute_records 表
ALTER TABLE commute_records
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

-- 添加创建者字段（用于标记谁创建的记录）
ALTER TABLE commute_records
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 删除旧的 RLS 策略
DROP POLICY IF EXISTS "Users can view own commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can insert own commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can update own commute records" ON commute_records;
DROP POLICY IF EXISTS "Users can delete own commute records" ON commute_records;

-- 创建新的 RLS 策略（支持私密记录）

-- 查看策略：
-- - 公开记录：所有人都能看到
-- - 私密记录：只有创建者能看到
CREATE POLICY "Users can view commute records"
  ON commute_records FOR SELECT
  USING (
    NOT is_private OR  -- 非私密记录，所有人可见
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())  -- 私密记录，只有创建者可见
  );

-- 插入策略：所有已登录用户都能插入
CREATE POLICY "Users can insert commute records"
  ON commute_records FOR INSERT
  WITH CHECK (true);

-- 更新策略：所有已登录用户都能更新非私密记录，只有创建者能更新私密记录
CREATE POLICY "Users can update commute records"
  ON commute_records FOR UPDATE
  USING (
    NOT is_private OR
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- 删除策略：所有已登录用户都能删除非私密记录，只有创建者能删除私密记录
CREATE POLICY "Users can delete commute records"
  ON commute_records FOR DELETE
  USING (
    NOT is_private OR
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================

-- 添加私密标记字段到 commute_routes 表
ALTER TABLE commute_routes
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

ALTER TABLE commute_routes
ADD COLUMN IF NOT EXISTS created_by TEXT;

-- 删除旧的 RLS 策略
DROP POLICY IF EXISTS "Users can view own routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can insert own routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can update own routes" ON commute_routes;
DROP POLICY IF EXISTS "Users can delete own routes" ON commute_routes;

-- 创建新的 RLS 策略

CREATE POLICY "Users can view routes"
  ON commute_routes FOR SELECT
  USING (
    NOT is_private OR
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can insert routes"
  ON commute_routes FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update routes"
  ON commute_routes FOR UPDATE
  USING (
    NOT is_private OR
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Users can delete own routes"
  ON commute_routes FOR DELETE
  USING (
    NOT is_private OR
    created_by = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- ============================================
-- 执行完成后，所有记录默认是公开的（夫妻共享）
-- 在记录/路线时勾选"私密"选项，只有创建者能看到
-- ============================================
