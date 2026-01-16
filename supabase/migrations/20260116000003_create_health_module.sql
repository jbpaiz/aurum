-- ================================================
-- MÓDULO DE SAÚDE - AURUM
-- ================================================
-- Registro de peso, atividades físicas, sono e metas

-- TABELA: health_weight_logs
-- Registros de peso (múltiplos por dia permitidos)
CREATE TABLE IF NOT EXISTS health_weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight < 500), -- kg
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA: health_activities
-- Registro de atividades físicas
CREATE TABLE IF NOT EXISTS health_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('walking', 'gym', 'cycling', 'swimming', 'sport', 'yoga', 'running', 'other')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0 AND duration_minutes <= 1440),
  intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
  calories_burned INTEGER,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- TABELA: health_sleep_logs
-- Registro de sono
CREATE TABLE IF NOT EXISTS health_sleep_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_date DATE NOT NULL, -- data da noite (quando dormiu)
  bedtime TIMESTAMPTZ NOT NULL,
  wake_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes >= 0 AND duration_minutes <= 1440),
  quality TEXT CHECK (quality IN ('poor', 'normal', 'good')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT wake_after_bedtime CHECK (wake_time > bedtime)
);

-- TABELA: health_goals
-- Metas de saúde do usuário
CREATE TABLE IF NOT EXISTS health_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('weight', 'activity', 'sleep')),
  target_value DECIMAL(10,2) NOT NULL,
  target_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÍNDICES para performance
CREATE INDEX IF NOT EXISTS idx_health_weight_user_date ON health_weight_logs(user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_activities_user_date ON health_activities(user_id, activity_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_sleep_user_date ON health_sleep_logs(user_id, sleep_date DESC);
CREATE INDEX IF NOT EXISTS idx_health_goals_user_active ON health_goals(user_id, is_active) WHERE is_active = TRUE;

-- TRIGGERS para updated_at
CREATE OR REPLACE FUNCTION update_health_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER health_weight_logs_updated_at BEFORE UPDATE ON health_weight_logs
  FOR EACH ROW EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER health_activities_updated_at BEFORE UPDATE ON health_activities
  FOR EACH ROW EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER health_sleep_logs_updated_at BEFORE UPDATE ON health_sleep_logs
  FOR EACH ROW EXECUTE FUNCTION update_health_updated_at();

CREATE TRIGGER health_goals_updated_at BEFORE UPDATE ON health_goals
  FOR EACH ROW EXECUTE FUNCTION update_health_updated_at();

-- RLS (Row Level Security)
ALTER TABLE health_weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_goals ENABLE ROW LEVEL SECURITY;

-- Policies: usuário só vê seus próprios dados
CREATE POLICY health_weight_logs_user_policy ON health_weight_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY health_activities_user_policy ON health_activities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY health_sleep_logs_user_policy ON health_sleep_logs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY health_goals_user_policy ON health_goals
  FOR ALL USING (auth.uid() = user_id);

-- VIEWS úteis
-- View: Resumo diário de saúde
CREATE OR REPLACE VIEW health_daily_summary AS
SELECT 
  user_id,
  DATE(recorded_at) as date,
  COUNT(*) as weight_count,
  MIN(weight) as min_weight,
  MAX(weight) as max_weight,
  AVG(weight) as avg_weight,
  FIRST_VALUE(weight) OVER (PARTITION BY user_id, DATE(recorded_at) ORDER BY recorded_at ASC) as first_weight,
  FIRST_VALUE(weight) OVER (PARTITION BY user_id, DATE(recorded_at) ORDER BY recorded_at DESC) as last_weight
FROM health_weight_logs
GROUP BY user_id, DATE(recorded_at), weight, recorded_at;

-- COMENTÁRIOS
COMMENT ON TABLE health_weight_logs IS 'Registros de peso corporal dos usuários';
COMMENT ON TABLE health_activities IS 'Registro de atividades físicas realizadas';
COMMENT ON TABLE health_sleep_logs IS 'Registro de sono dos usuários';
COMMENT ON TABLE health_goals IS 'Metas de saúde definidas pelos usuários';
