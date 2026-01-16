-- =====================================================
-- MIGRATION: Extensão Completa do Módulo de Saúde
-- Data: 2026-01-16
-- Descrição: Adiciona medidas corporais, hidratação, 
--            alimentação e gamificação
-- =====================================================

-- 1. MEDIDAS CORPORAIS
CREATE TABLE IF NOT EXISTS health_body_measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  measurement_date DATE NOT NULL,
  
  -- Medidas principais (cm)
  waist DECIMAL(5,2), -- cintura
  hips DECIMAL(5,2), -- quadril
  chest DECIMAL(5,2), -- peitoral
  arm_left DECIMAL(5,2), -- braço esquerdo
  arm_right DECIMAL(5,2), -- braço direito
  thigh_left DECIMAL(5,2), -- coxa esquerda
  thigh_right DECIMAL(5,2), -- coxa direita
  calf_left DECIMAL(5,2), -- panturrilha esquerda
  calf_right DECIMAL(5,2), -- panturrilha direita
  neck DECIMAL(5,2), -- pescoço
  
  -- Cálculos
  body_fat_percentage DECIMAL(4,2), -- % gordura corporal
  muscle_mass DECIMAL(5,2), -- massa muscular (kg)
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_body_measurements_user_date ON health_body_measurements(user_id, measurement_date DESC);

-- RLS para medidas corporais
ALTER TABLE health_body_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own body measurements"
  ON health_body_measurements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own body measurements"
  ON health_body_measurements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own body measurements"
  ON health_body_measurements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own body measurements"
  ON health_body_measurements FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_body_measurements_updated_at
  BEFORE UPDATE ON health_body_measurements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. HIDRATAÇÃO
CREATE TABLE IF NOT EXISTS health_hydration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0),
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hydration_user_date ON health_hydration(user_id, log_date DESC);
CREATE INDEX idx_hydration_user_logged_at ON health_hydration(user_id, logged_at DESC);

-- Configuração de metas de hidratação
CREATE TABLE IF NOT EXISTS health_hydration_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  daily_goal_ml INTEGER NOT NULL DEFAULT 2000 CHECK (daily_goal_ml > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para hidratação
ALTER TABLE health_hydration ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_hydration_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hydration logs"
  ON health_hydration FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hydration logs"
  ON health_hydration FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hydration logs"
  ON health_hydration FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own hydration logs"
  ON health_hydration FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own hydration goals"
  ON health_hydration_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own hydration goals"
  ON health_hydration_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own hydration goals"
  ON health_hydration_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_hydration_updated_at
  BEFORE UPDATE ON health_hydration
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hydration_goals_updated_at
  BEFORE UPDATE ON health_hydration_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 3. ALIMENTAÇÃO
CREATE TYPE meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack');

CREATE TABLE IF NOT EXISTS health_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_date DATE NOT NULL,
  meal_time TIME NOT NULL,
  meal_type meal_type NOT NULL,
  
  description TEXT NOT NULL,
  calories INTEGER CHECK (calories >= 0),
  
  -- Macronutrientes (gramas)
  protein DECIMAL(6,2) CHECK (protein >= 0),
  carbohydrates DECIMAL(6,2) CHECK (carbohydrates >= 0),
  fats DECIMAL(6,2) CHECK (fats >= 0),
  fiber DECIMAL(6,2) CHECK (fiber >= 0),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_meals_user_date ON health_meals(user_id, meal_date DESC, meal_time DESC);

-- Metas nutricionais
CREATE TABLE IF NOT EXISTS health_nutrition_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  daily_calories INTEGER CHECK (daily_calories > 0),
  daily_protein DECIMAL(6,2) CHECK (daily_protein >= 0),
  daily_carbohydrates DECIMAL(6,2) CHECK (daily_carbohydrates >= 0),
  daily_fats DECIMAL(6,2) CHECK (daily_fats >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para alimentação
ALTER TABLE health_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_nutrition_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meals"
  ON health_meals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meals"
  ON health_meals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meals"
  ON health_meals FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meals"
  ON health_meals FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own nutrition goals"
  ON health_nutrition_goals FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition goals"
  ON health_nutrition_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition goals"
  ON health_nutrition_goals FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_meals_updated_at
  BEFORE UPDATE ON health_meals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_goals_updated_at
  BEFORE UPDATE ON health_nutrition_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 4. GAMIFICAÇÃO
CREATE TYPE badge_type AS ENUM (
  'first_weight', 'weight_streak_7', 'weight_streak_30', 'weight_goal',
  'first_activity', 'activity_streak_7', 'activity_streak_30', 'activity_100h',
  'first_sleep', 'sleep_streak_7', 'sleep_streak_30', 'sleep_quality',
  'hydration_streak_7', 'hydration_streak_30',
  'meal_logged_100', 'balanced_week',
  'all_in_one_week', 'health_champion'
);

CREATE TABLE IF NOT EXISTS health_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type badge_type NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_type)
);

CREATE INDEX idx_badges_user ON health_badges(user_id, earned_at DESC);

-- Pontos e nível
CREATE TABLE IF NOT EXISTS health_user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  total_points INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Desafios
CREATE TYPE challenge_status AS ENUM ('active', 'completed', 'failed');

CREATE TABLE IF NOT EXISTS health_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL, -- 'weight_loss_30_days', 'activity_daily_week', etc
  target_value DECIMAL(10,2),
  current_value DECIMAL(10,2) DEFAULT 0,
  status challenge_status DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reward_points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_challenges_user_status ON health_challenges(user_id, status, end_date DESC);

-- RLS para gamificação
ALTER TABLE health_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own badges"
  ON health_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own badges"
  ON health_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own stats"
  ON health_user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own stats"
  ON health_user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own stats"
  ON health_user_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own challenges"
  ON health_challenges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own challenges"
  ON health_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own challenges"
  ON health_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER update_user_stats_updated_at
  BEFORE UPDATE ON health_user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_challenges_updated_at
  BEFORE UPDATE ON health_challenges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FIM DA MIGRATION
-- =====================================================
