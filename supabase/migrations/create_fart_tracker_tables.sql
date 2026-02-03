-- =====================================================
-- 放屁记录功能 - 数据库表结构
-- =====================================================

-- =====================================================
-- 表 1: 拟声词库表（先创建，因为 fart_records 表会引用它）
-- =====================================================

CREATE TABLE IF NOT EXISTS public.fart_sound_words (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  word VARCHAR(50) NOT NULL,
  pinyin VARCHAR(100) NOT NULL,
  tone INTEGER NOT NULL CHECK (tone BETWEEN 1 AND 5),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, word, pinyin, tone)
);

-- 索引
CREATE INDEX IF NOT EXISTS fart_sound_words_user_id_idx ON public.fart_sound_words(user_id);

-- RLS 策略
ALTER TABLE public.fart_sound_words ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own sound words" ON public.fart_sound_words;
CREATE POLICY "Users can manage their own sound words"
  ON public.fart_sound_words FOR ALL
  USING (auth.uid() = user_id);

-- 授权
GRANT ALL ON public.fart_sound_words TO authenticated;

-- =====================================================
-- 表 2: 放屁记录表（后创建，引用 fart_sound_words）
-- =====================================================

CREATE TABLE IF NOT EXISTS public.fart_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  record_time TIMESTAMP WITH TIME ZONE NOT NULL,
  sound_level INTEGER NOT NULL CHECK (sound_level BETWEEN 1 AND 5),
  sound_word_id UUID REFERENCES public.fart_sound_words(id),
  is_smelly BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS fart_records_user_id_idx ON public.fart_records(user_id);
CREATE INDEX IF NOT EXISTS fart_records_record_time_idx ON public.fart_records(record_time DESC);
CREATE INDEX IF NOT EXISTS fart_records_sound_word_idx ON public.fart_records(sound_word_id);

-- RLS 策略
ALTER TABLE public.fart_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own fart records" ON public.fart_records;
CREATE POLICY "Users can view their own fart records"
  ON public.fart_records FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own fart records" ON public.fart_records;
CREATE POLICY "Users can insert their own fart records"
  ON public.fart_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own fart records" ON public.fart_records;
CREATE POLICY "Users can update their own fart records"
  ON public.fart_records FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own fart records" ON public.fart_records;
CREATE POLICY "Users can delete their own fart records"
  ON public.fart_records FOR DELETE
  USING (auth.uid() = user_id);

-- 授权
GRANT ALL ON public.fart_records TO authenticated;

-- =====================================================
-- 初始数据：默认拟声词
-- =====================================================

INSERT INTO public.fart_sound_words (user_id, word, pinyin, tone, sort_order)
VALUES
  ('00000000-0000-0000-0000-000000000001', '不', 'bu', 2, 1),
  ('00000000-0000-0000-0000-000000000001', '扑', 'pu', 1, 2),
  ('00000000-0000-0000-0000-000000000001', '巴', 'ba', 1, 3),
  ('00000000-0000-0000-0000-000000000001', '噗', 'pu', 1, 4),
  ('00000000-0000-0000-0000-000000000001', '卜', 'bu', 3, 5)
ON CONFLICT (user_id, word, pinyin, tone) DO NOTHING;
