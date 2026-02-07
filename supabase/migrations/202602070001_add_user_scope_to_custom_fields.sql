-- Add user scoping to task custom fields (per-user configuration)
BEGIN;

-- 1) Add user_id to task_custom_fields
ALTER TABLE task_custom_fields
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2) Backfill existing rows with project owner
UPDATE task_custom_fields tcf
SET user_id = tp.user_id
FROM task_projects tp
WHERE tcf.project_id = tp.id
  AND tcf.user_id IS NULL;

-- 3) Enforce NOT NULL and adjust unique constraint to be per user+project+field_type
ALTER TABLE task_custom_fields
  ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE task_custom_fields
  DROP CONSTRAINT IF EXISTS task_custom_fields_unique;
ALTER TABLE task_custom_fields
  ADD CONSTRAINT task_custom_fields_unique UNIQUE (project_id, user_id, field_type);

-- 4) Index for user queries
CREATE INDEX IF NOT EXISTS idx_task_custom_fields_user ON task_custom_fields(user_id);

-- 5) Update default creation function to set user_id
CREATE OR REPLACE FUNCTION create_default_priority_field(p_project_id UUID, p_user_id UUID DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
  v_field_id UUID;
  v_existing_field_id UUID;
  v_user_id UUID;
BEGIN
  SELECT COALESCE(p_user_id, user_id) INTO v_user_id FROM task_projects WHERE id = p_project_id;

  SELECT id INTO v_existing_field_id
  FROM task_custom_fields
  WHERE project_id = p_project_id
    AND user_id = v_user_id
    AND field_type = 'priority';

  IF v_existing_field_id IS NOT NULL THEN
    RETURN v_existing_field_id;
  END IF;

  INSERT INTO task_custom_fields (project_id, user_id, field_type, field_name)
  VALUES (p_project_id, v_user_id, 'priority', 'Prioridade')
  RETURNING id INTO v_field_id;

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

-- 6) Update trigger to pass user_id
CREATE OR REPLACE FUNCTION handle_task_project_custom_fields()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_priority_field(NEW.id, NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_task_project_custom_fields ON task_projects;
CREATE TRIGGER trigger_task_project_custom_fields
  AFTER INSERT ON task_projects
  FOR EACH ROW
  EXECUTE FUNCTION handle_task_project_custom_fields();

-- 7) Refresh policies to use user_id directly
DROP POLICY IF EXISTS "Users can view own project custom fields" ON task_custom_fields;
CREATE POLICY "Users can view own project custom fields" ON task_custom_fields
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own project custom fields" ON task_custom_fields;
CREATE POLICY "Users can insert own project custom fields" ON task_custom_fields
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own project custom fields" ON task_custom_fields;
CREATE POLICY "Users can update own project custom fields" ON task_custom_fields
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own project custom fields" ON task_custom_fields;
CREATE POLICY "Users can delete own project custom fields" ON task_custom_fields
  FOR DELETE USING (user_id = auth.uid());

-- task_custom_field_options policies (join through user-owned field)
DROP POLICY IF EXISTS "Users can view own project field options" ON task_custom_field_options;
CREATE POLICY "Users can view own project field options" ON task_custom_field_options
  FOR SELECT USING (
    custom_field_id IN (
      SELECT id FROM task_custom_fields WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own project field options" ON task_custom_field_options;
CREATE POLICY "Users can insert own project field options" ON task_custom_field_options
  FOR INSERT WITH CHECK (
    custom_field_id IN (
      SELECT id FROM task_custom_fields WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update own project field options" ON task_custom_field_options;
CREATE POLICY "Users can update own project field options" ON task_custom_field_options
  FOR UPDATE USING (
    custom_field_id IN (
      SELECT id FROM task_custom_fields WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own project field options" ON task_custom_field_options;
CREATE POLICY "Users can delete own project field options" ON task_custom_field_options
  FOR DELETE USING (
    custom_field_id IN (
      SELECT id FROM task_custom_fields WHERE user_id = auth.uid()
    )
  );

COMMIT;
