-- Criar tabela de preferências do usuário
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Preferências de tema
  theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  
  -- Preferências de navegação
  last_active_hub TEXT DEFAULT 'finance' CHECK (last_active_hub IN ('finance', 'tasks')),
  
  -- Preferências do módulo de tarefas
  tasks_view_mode TEXT DEFAULT 'kanban' CHECK (tasks_view_mode IN ('kanban', 'list', 'metrics')),
  tasks_adaptive_width BOOLEAN DEFAULT false,
  tasks_adaptive_width_list BOOLEAN DEFAULT false,
  active_project_id UUID,
  active_board_id UUID,
  
  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garantir uma única linha de preferências por usuário
  UNIQUE(user_id)
);

-- Índice para busca rápida por user_id
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_preferences_updated_at();

-- RLS Policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver apenas suas próprias preferências
CREATE POLICY "Users can view own preferences"
  ON user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem inserir suas próprias preferências
CREATE POLICY "Users can insert own preferences"
  ON user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias preferências
CREATE POLICY "Users can update own preferences"
  ON user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias preferências
CREATE POLICY "Users can delete own preferences"
  ON user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Comentários para documentação
COMMENT ON TABLE user_preferences IS 'Armazena preferências e configurações personalizadas de cada usuário';
COMMENT ON COLUMN user_preferences.theme IS 'Tema da interface: light, dark ou system';
COMMENT ON COLUMN user_preferences.last_active_hub IS 'Último hub acessado pelo usuário (finance ou tasks)';
COMMENT ON COLUMN user_preferences.tasks_view_mode IS 'Modo de visualização do módulo de tarefas';
COMMENT ON COLUMN user_preferences.tasks_adaptive_width IS 'Se as colunas do kanban devem ter largura adaptável';
COMMENT ON COLUMN user_preferences.tasks_adaptive_width_list IS 'Se a lista de tarefas deve ter largura adaptável';
