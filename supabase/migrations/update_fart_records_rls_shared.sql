-- =====================================================
-- 修改放屁记录表为家庭成员共享模式
-- =====================================================

-- 删除旧的策略
DROP POLICY IF EXISTS "Users can view their own fart records" ON public.fart_records;
DROP POLICY IF EXISTS "Users can insert their own fart records" ON public.fart_records;
DROP POLICY IF EXISTS "Users can update their own fart records" ON public.fart_records;
DROP POLICY IF EXISTS "Users can delete their own fart records" ON public.fart_records;

-- 创建新策略：所有认证用户都可以查看所有记录
CREATE POLICY "Authenticated users can view all fart records"
  ON public.fart_records FOR SELECT
  TO authenticated
  USING (true);

-- 创建新策略：所有认证用户都可以插入记录
CREATE POLICY "Authenticated users can insert fart records"
  ON public.fart_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 创建新策略：用户只能更新自己插入的记录
CREATE POLICY "Users can update their own fart records"
  ON public.fart_records FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建新策略：用户只能删除自己插入的记录
CREATE POLICY "Users can delete their own fart records"
  ON public.fart_records FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- 说明：
-- 1. 所有登录用户都可以查看所有记录（夫妻共享）
-- 2. 所有登录用户都可以添加记录
-- 3. 用户只能修改/删除自己添加的记录
-- =====================================================
