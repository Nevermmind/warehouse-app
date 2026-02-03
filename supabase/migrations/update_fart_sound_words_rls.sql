-- =====================================================
-- 修复拟声词库 RLS 策略 - 允许所有用户读取共享拟声词
-- =====================================================

-- 删除旧策略
DROP POLICY IF EXISTS "Users can manage their own sound words" ON public.fart_sound_words;

-- 新策略：所有用户都可以读取共享拟声词库
CREATE POLICY "All users can read shared sound words"
  ON public.fart_sound_words FOR SELECT
  USING (user_id = '00000000-0000-0000-0000-000000000001');

-- 新策略：用户可以读取自己的拟声词
CREATE POLICY "Users can read their own sound words"
  ON public.fart_sound_words FOR SELECT
  USING (auth.uid() = user_id);

-- 新策略：用户只能插入自己的拟声词（插入到自己的 user_id）
CREATE POLICY "Users can insert their own sound words"
  ON public.fart_sound_words FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 新策略：用户只能更新自己的拟声词
CREATE POLICY "Users can update their own sound words"
  ON public.fart_sound_words FOR UPDATE
  USING (auth.uid() = user_id);

-- 新策略：所有用户都可以更新共享拟声词库
CREATE POLICY "All users can update shared sound words"
  ON public.fart_sound_words FOR UPDATE
  USING (user_id = '00000000-0000-0000-0000-000000000001');

-- 新策略：用户只能删除自己的拟声词
CREATE POLICY "Users can delete their own sound words"
  ON public.fart_sound_words FOR DELETE
  USING (auth.uid() = user_id);
