BEGIN;

-- ================================================================
-- Task board collaboration (owner invites editors)
-- ================================================================

CREATE TABLE IF NOT EXISTS task_board_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_board_members_unique UNIQUE (board_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_task_board_members_board ON task_board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_task_board_members_user ON task_board_members(user_id);

ALTER TABLE task_board_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION can_access_task_board(p_board_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM task_boards tb
    JOIN task_projects tp ON tp.id = tb.project_id
    WHERE tb.id = p_board_id
      AND tp.user_id = (SELECT auth.uid())
  )
  OR EXISTS (
    SELECT 1
    FROM task_board_members tbm
    WHERE tbm.board_id = p_board_id
      AND tbm.user_id = (SELECT auth.uid())
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION can_manage_task_board(p_board_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM task_boards tb
    JOIN task_projects tp ON tp.id = tb.project_id
    WHERE tb.id = p_board_id
      AND tp.user_id = (SELECT auth.uid())
  );
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

ALTER FUNCTION can_access_task_board(UUID) SET search_path = public, auth;
ALTER FUNCTION can_manage_task_board(UUID) SET search_path = public, auth;

DROP POLICY IF EXISTS "Board owner manages members" ON task_board_members;
CREATE POLICY "Board owner manages members"
  ON task_board_members
  FOR ALL
  USING (can_manage_task_board(board_id))
  WITH CHECK (can_manage_task_board(board_id));

DROP POLICY IF EXISTS "Members can view own membership" ON task_board_members;
CREATE POLICY "Members can view own membership"
  ON task_board_members
  FOR SELECT
  USING (user_id = (SELECT auth.uid()));

-- ================================================================
-- RPC helpers for easy invite/list by email
-- ================================================================

CREATE OR REPLACE FUNCTION invite_task_board_member(p_board_id UUID, p_email TEXT)
RETURNS task_board_members AS $$
DECLARE
  v_owner_id UUID;
  v_target_user_id UUID;
  v_row task_board_members;
BEGIN
  IF p_email IS NULL OR btrim(p_email) = '' THEN
    RAISE EXCEPTION 'Email inválido';
  END IF;

  SELECT tp.user_id
  INTO v_owner_id
  FROM task_boards tb
  JOIN task_projects tp ON tp.id = tb.project_id
  WHERE tb.id = p_board_id;

  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Quadro não encontrado';
  END IF;

  IF v_owner_id <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'Apenas o dono do quadro pode convidar usuários';
  END IF;

  SELECT au.id
  INTO v_target_user_id
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(btrim(p_email))
  LIMIT 1;

  IF v_target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado no Aurum';
  END IF;

  IF v_target_user_id = v_owner_id THEN
    RAISE EXCEPTION 'O dono já possui acesso ao quadro';
  END IF;

  INSERT INTO task_board_members (board_id, user_id, invited_by)
  VALUES (p_board_id, v_target_user_id, (SELECT auth.uid()))
  ON CONFLICT (board_id, user_id)
  DO UPDATE SET invited_by = EXCLUDED.invited_by
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION list_task_board_members(p_board_id UUID)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  invited_by UUID,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  IF NOT can_manage_task_board(p_board_id) THEN
    RAISE EXCEPTION 'Apenas o dono do quadro pode ver a lista de membros';
  END IF;

  RETURN QUERY
  SELECT
    tbm.user_id,
    au.email::TEXT,
    tbm.invited_by,
    tbm.created_at
  FROM task_board_members tbm
  JOIN auth.users au ON au.id = tbm.user_id
  WHERE tbm.board_id = p_board_id
  ORDER BY tbm.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER FUNCTION invite_task_board_member(UUID, TEXT) SET search_path = public, auth;
ALTER FUNCTION list_task_board_members(UUID) SET search_path = public, auth;

GRANT EXECUTE ON FUNCTION invite_task_board_member(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION list_task_board_members(UUID) TO authenticated;

-- ================================================================
-- RLS update: shared access to boards/tasks, owner-only structure
-- ================================================================

DROP POLICY IF EXISTS "Users manage own task projects" ON task_projects;
CREATE POLICY "Users select own or shared task projects"
  ON task_projects
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM task_boards tb
      JOIN task_board_members tbm ON tbm.board_id = tb.id
      WHERE tb.project_id = task_projects.id
        AND tbm.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users insert own task projects"
  ON task_projects
  FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users update own task projects"
  ON task_projects
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users delete own task projects"
  ON task_projects
  FOR DELETE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users manage own task boards" ON task_boards;
CREATE POLICY "Users select accessible task boards"
  ON task_boards
  FOR SELECT
  USING (can_access_task_board(id));

CREATE POLICY "Owners insert task boards"
  ON task_boards
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM task_projects tp
      WHERE tp.id = task_boards.project_id
        AND tp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Owners update task boards"
  ON task_boards
  FOR UPDATE
  USING (can_manage_task_board(id))
  WITH CHECK (can_manage_task_board(id));

CREATE POLICY "Owners delete task boards"
  ON task_boards
  FOR DELETE
  USING (can_manage_task_board(id));

DROP POLICY IF EXISTS "Users manage own task sprints" ON task_sprints;
CREATE POLICY "Users select accessible task sprints"
  ON task_sprints
  FOR SELECT
  USING (can_access_task_board(board_id));

CREATE POLICY "Owners manage task sprints"
  ON task_sprints
  FOR ALL
  USING (can_manage_task_board(board_id))
  WITH CHECK (can_manage_task_board(board_id));

DROP POLICY IF EXISTS "Users manage own task columns" ON task_columns;
CREATE POLICY "Users select accessible task columns"
  ON task_columns
  FOR SELECT
  USING (can_access_task_board(board_id));

CREATE POLICY "Owners manage task columns"
  ON task_columns
  FOR ALL
  USING (can_manage_task_board(board_id))
  WITH CHECK (can_manage_task_board(board_id));

DROP POLICY IF EXISTS "Users manage own tasks" ON tasks;
CREATE POLICY "Users manage tasks on accessible boards"
  ON tasks
  FOR ALL
  USING (can_access_task_board(board_id))
  WITH CHECK (can_access_task_board(board_id));

DROP POLICY IF EXISTS "Users manage own task comments" ON task_comments;
CREATE POLICY "Users manage comments on accessible boards"
  ON task_comments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM tasks t
      WHERE t.id = task_comments.task_id
        AND can_access_task_board(t.board_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM tasks t
      WHERE t.id = task_comments.task_id
        AND can_access_task_board(t.board_id)
    )
  );

-- ================================================================
-- Custom field visibility: shared users can read owner's config
-- ================================================================

DROP POLICY IF EXISTS "Users can view own project custom fields" ON task_custom_fields;
CREATE POLICY "Users can view own or shared project custom fields"
  ON task_custom_fields
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM task_projects tp
      JOIN task_boards tb ON tb.project_id = tp.id
      JOIN task_board_members tbm ON tbm.board_id = tb.id
      WHERE tp.id = task_custom_fields.project_id
        AND tp.user_id = task_custom_fields.user_id
        AND tbm.user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view own project field options" ON task_custom_field_options;
CREATE POLICY "Users can view own or shared project field options"
  ON task_custom_field_options
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM task_custom_fields tcf
      WHERE tcf.id = task_custom_field_options.custom_field_id
        AND (
          tcf.user_id = (SELECT auth.uid())
          OR EXISTS (
            SELECT 1
            FROM task_projects tp
            JOIN task_boards tb ON tb.project_id = tp.id
            JOIN task_board_members tbm ON tbm.board_id = tb.id
            WHERE tp.id = tcf.project_id
              AND tp.user_id = tcf.user_id
              AND tbm.user_id = (SELECT auth.uid())
          )
        )
    )
  );

COMMIT;
