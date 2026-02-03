-- =====================================================
-- 修改拟声词表为家庭成员共享模式（完全共享）
-- =====================================================

-- 删除旧的策略
DROP POLICY IF EXISTS "Users can manage their own sound words" ON public.fart_sound_words;

-- 创建新策略：所有认证用户都可以查看所有拟声词
CREATE POLICY "Authenticated users can view all sound words"
  ON public.fart_sound_words FOR SELECT
  TO authenticated
  USING (true);

-- 创建新策略：所有认证用户都可以添加拟声词
CREATE POLICY "Authenticated users can add sound words"
  ON public.fart_sound_words FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 创建新策略：所有认证用户都可以修改拟声词
CREATE POLICY "Authenticated users can update sound words"
  ON public.fart_sound_words FOR UPDATE
  TO authenticated
  USING (true);

-- 创建新策略：所有认证用户都可以删除拟声词
CREATE POLICY "Authenticated users can delete sound words"
  ON public.fart_sound_words FOR UPDATE
  TO authenticated
  USING (true);

-- =====================================================
-- 说明：
-- 1. 所有登录用户都可以查看所有拟声词
-- 2. 所有登录用户都可以添加新的拟声词
-- 3. 所有登录用户都可以修改任何拟声词
-- 4. 所有登录用户都可以删除任何拟声词
-- =====================================================
