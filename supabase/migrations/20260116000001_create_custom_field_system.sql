-- ================================================
-- SISTEMA DE CAMPOS CUSTOMIZÁVEIS PARA TAREFAS
-- ================================================
-- Permite que usuários configurem o campo "Prioridade"
-- com nome personalizado e opções customizáveis

-- TABELA: task_custom_fields
-- Armazena a configuração do campo (ex: nome "Sprint" ou "Prioridade")
CREATE TABLE IF NOT EXISTS task_custom_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES task_projects(id) ON DELETE CASCADE,
  field_type TEXT NOT NULL DEFAULT 'priority', -- Tipo do campo (priority, etc)
  field_name TEXT NOT NULL CHECK (LENGTH(field_name) <= 20), -- Nome customizável (max 20 chars)
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_custom_fields_unique UNIQUE (project_id, field_type)
);

-- TABELA: task_custom_field_options
-- Armazena as opções do campo (ex: "Baixa", "Alta", "Sprint 1")
CREATE TABLE IF NOT EXISTS task_custom_field_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_field_id UUID NOT NULL REFERENCES task_custom_fields(id) ON DELETE CASCADE,
  option_value TEXT NOT NULL CHECK (LENGTH(option_value) <= 50), -- Valor técnico (ex: 'low', 'high')
  option_label TEXT NOT NULL CHECK (LENGTH(option_label) <= 20), -- Label exibido (max 20 chars)
  color TEXT NOT NULL DEFAULT '#94A3B8', -- Cor do marcador
  position INTEGER NOT NULL DEFAULT 0, -- Ordem de exibição
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_custom_field_options_unique UNIQUE (custom_field_id, option_value)
);

-- ÍNDICES
CREATE INDEX IF NOT EXISTS idx_task_custom_fields_project ON task_custom_fields(project_id);
CREATE INDEX IF NOT EXISTS idx_task_custom_field_options_field ON task_custom_field_options(custom_field_id);

-- FUNÇÃO: Criar configuração padrão de prioridade para projeto
CREATE OR REPLACE FUNCTION create_default_priority_field(p_project_id UUID)
RETURNS UUID AS $$
DECLARE
  v_field_id UUID;
BEGIN
  -- Criar campo "Prioridade"
  INSERT INTO task_custom_fields (project_id, field_type, field_name)
  VALUES (p_project_id, 'priority', 'Prioridade')
  RETURNING id INTO v_field_id;
  
  -- Criar opções padrão
  INSERT INTO task_custom_field_options (custom_field_id, option_value, option_label, color, position)
  VALUES
    (v_field_id, 'lowest', 'Muito Baixa', '#94A3B8', 1),
    (v_field_id, 'low', 'Baixa', '#64748B', 2),
    (v_field_id, 'medium', 'Média', '#3B82F6', 3),
    (v_field_id, 'high', 'Alta', '#F97316', 4),
    (v_field_id, 'highest', 'Muito Alta', '#EF4444', 5);
  
  RETURN v_field_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER: Criar campo padrão ao criar projeto
CREATE OR REPLACE FUNCTION handle_task_project_custom_fields()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_priority_field(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_task_project_custom_fields ON task_projects;
CREATE TRIGGER trigger_task_project_custom_fields
  AFTER INSERT ON task_projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_project_custom_fields();

-- FUNÇÃO: Atualizar timestamp
CREATE OR REPLACE FUNCTION update_custom_field_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_custom_field_timestamp ON task_custom_fields;
CREATE TRIGGER trigger_update_custom_field_timestamp
  BEFORE UPDATE ON task_custom_fields
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_field_timestamp();

DROP TRIGGER IF EXISTS trigger_update_custom_field_option_timestamp ON task_custom_field_options;
CREATE TRIGGER trigger_update_custom_field_option_timestamp
  BEFORE UPDATE ON task_custom_field_options
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_field_timestamp();

-- RLS (Row Level Security)
ALTER TABLE task_custom_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_custom_field_options ENABLE ROW LEVEL SECURITY;

-- Políticas para task_custom_fields
DROP POLICY IF EXISTS "Users can view own project custom fields" ON task_custom_fields;
CREATE POLICY "Users can view own project custom fields" ON task_custom_fields
  FOR SELECT USING (
    project_id IN (
      SELECT id FROM task_projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own project custom fields" ON task_custom_fields;
CREATE POLICY "Users can insert own project custom fields" ON task_custom_fields
  FOR INSERT WITH CHECK (
    project_id IN (
      SELECT id FROM task_projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own project custom fields" ON task_custom_fields;
CREATE POLICY "Users can update own project custom fields" ON task_custom_fields
  FOR UPDATE USING (
    project_id IN (
      SELECT id FROM task_projects WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own project custom fields" ON task_custom_fields;
CREATE POLICY "Users can delete own project custom fields" ON task_custom_fields
  FOR DELETE USING (
    project_id IN (
      SELECT id FROM task_projects WHERE user_id = auth.uid()
    )
  );

-- Políticas para task_custom_field_options
DROP POLICY IF EXISTS "Users can view own project field options" ON task_custom_field_options;
CREATE POLICY "Users can view own project field options" ON task_custom_field_options
  FOR SELECT USING (
    custom_field_id IN (
      SELECT tcf.id FROM task_custom_fields tcf
      INNER JOIN task_projects tp ON tcf.project_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own project field options" ON task_custom_field_options;
CREATE POLICY "Users can insert own project field options" ON task_custom_field_options
  FOR INSERT WITH CHECK (
    custom_field_id IN (
      SELECT tcf.id FROM task_custom_fields tcf
      INNER JOIN task_projects tp ON tcf.project_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own project field options" ON task_custom_field_options;
CREATE POLICY "Users can update own project field options" ON task_custom_field_options
  FOR UPDATE USING (
    custom_field_id IN (
      SELECT tcf.id FROM task_custom_fields tcf
      INNER JOIN task_projects tp ON tcf.project_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own project field options" ON task_custom_field_options;
CREATE POLICY "Users can delete own project field options" ON task_custom_field_options
  FOR DELETE USING (
    custom_field_id IN (
      SELECT tcf.id FROM task_custom_fields tcf
      INNER JOIN task_projects tp ON tcf.project_id = tp.id
      WHERE tp.user_id = auth.uid()
    )
  );

-- Migrar projetos existentes
DO $$
DECLARE
  project_record RECORD;
BEGIN
  FOR project_record IN SELECT id FROM task_projects LOOP
    PERFORM create_default_priority_field(project_record.id);
  END LOOP;
END $$;

COMMENT ON TABLE task_custom_fields IS 'Configuração de campos customizáveis para projetos de tarefas';
COMMENT ON TABLE task_custom_field_options IS 'Opções disponíveis para campos customizáveis';
