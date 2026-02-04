-- ============================================
-- 上下班时间追踪功能 - 数据库表创建脚本
-- ============================================
-- 执行方式：在 Supabase 控制台的 SQL Editor 中执行
-- ============================================

-- 表 1: commute_routes - 通勤路线表（先创建，因为 commute_records 会引用它）
CREATE TABLE IF NOT EXISTS commute_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  route_type TEXT NOT NULL CHECK (route_type IN ('work', 'home')),  -- work=上班路线, home=下班路线
  route_name TEXT NOT NULL,                     -- 路线名称（如：地铁1号线、公交+步行）
  start_point TEXT NOT NULL,                     -- 起点
  end_point TEXT NOT NULL,                       -- 终点
  notes TEXT,                                    -- 备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_commute_routes_user_type ON commute_routes(user_id, route_type);

-- 启用RLS
ALTER TABLE commute_routes ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能读写自己的路线
CREATE POLICY "Users can view own routes"
  ON commute_routes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own routes"
  ON commute_routes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own routes"
  ON commute_routes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own routes"
  ON commute_routes FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================

-- 表 2: commute_records - 通勤记录表（后创建，因为引用了 commute_routes）
CREATE TABLE IF NOT EXISTS commute_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  record_date DATE NOT NULL,                    -- 通勤日期
  commute_type TEXT NOT NULL CHECK (commute_type IN ('work', 'home')),  -- work=上班, home=下班
  departure_time TIME NOT NULL,                 -- 出发时间
  arrival_time TIME NOT NULL,                   -- 到达时间
  route_id UUID REFERENCES commute_routes(id),  -- 路线ID
  weather TEXT,                                  -- 天气（晴、雨、雪等）
  notes TEXT,                                    -- 备注
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_commute_records_user_date ON commute_records(user_id, record_date);
CREATE INDEX IF NOT EXISTS idx_commute_records_type ON commute_records(commute_type);
CREATE INDEX IF NOT EXISTS idx_commute_records_route ON commute_records(route_id);

-- 启用RLS
ALTER TABLE commute_records ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能读写自己的记录
CREATE POLICY "Users can view own commute records"
  ON commute_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own commute records"
  ON commute_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commute records"
  ON commute_records FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own commute records"
  ON commute_records FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 执行完成后，请验证：
-- 1. 在 Supabase 控制台的 Table Editor 中查看这两个表
-- 2. 确认 RLS 策略已正确配置
-- 3. 测试插入、查询、更新、删除操作
-- ============================================
