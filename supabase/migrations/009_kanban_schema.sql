-- ================================================
-- 009 - KANBAN / TASK MANAGEMENT MODULE
-- ================================================

-- ENUMS -----------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority') THEN
    CREATE TYPE task_priority AS ENUM ('lowest', 'low', 'medium', 'high', 'highest');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_type') THEN
    CREATE TYPE task_type AS ENUM ('task', 'bug', 'story', 'epic');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_sprint_status') THEN
    CREATE TYPE task_sprint_status AS ENUM ('planned', 'active', 'completed');
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_column_category') THEN
    CREATE TYPE task_column_category AS ENUM ('backlog', 'todo', 'in_progress', 'waiting', 'review', 'done');
  END IF;
END$$;

-- TABLES ----------------------------------------------------------------
CREATE TABLE task_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL DEFAULT '#2563EB',
  icon TEXT NOT NULL DEFAULT '📋',
  issue_counter INTEGER NOT NULL DEFAULT 0,
  sort_order DOUBLE PRECISION NOT NULL DEFAULT EXTRACT(EPOCH FROM clock_timestamp()),
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_projects_code_unique UNIQUE (user_id, code),
  CONSTRAINT task_projects_code_upper CHECK (code = UPPER(code))
);

CREATE TABLE task_boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES task_projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  view_mode TEXT NOT NULL DEFAULT 'kanban',
  swimlane_mode TEXT NOT NULL DEFAULT 'assignee',
  filter JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order DOUBLE PRECISION NOT NULL DEFAULT EXTRACT(EPOCH FROM clock_timestamp()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_boards_project_name_unique UNIQUE (project_id, name)
);

CREATE TABLE task_sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES task_projects(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  status task_sprint_status NOT NULL DEFAULT 'planned',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_sprints_unique_name UNIQUE (board_id, name)
);

CREATE TABLE task_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  category task_column_category NOT NULL DEFAULT 'todo',
  color TEXT NOT NULL DEFAULT '#E5E7EB',
  wip_limit INTEGER,
  position DOUBLE PRECISION NOT NULL DEFAULT EXTRACT(EPOCH FROM clock_timestamp()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT task_columns_slug_unique UNIQUE (board_id, slug)
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES task_projects(id) ON DELETE CASCADE,
  board_id UUID NOT NULL REFERENCES task_boards(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES task_columns(id) ON DELETE RESTRICT,
  sprint_id UUID REFERENCES task_sprints(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  type task_type NOT NULL DEFAULT 'task',
  priority task_priority NOT NULL DEFAULT 'medium',
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  start_date DATE,
  labels TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_reason TEXT,
  story_points NUMERIC(6,2),
  estimate_hours NUMERIC(6,2),
  sort_order DOUBLE PRECISION NOT NULL DEFAULT EXTRACT(EPOCH FROM clock_timestamp()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES ----------------------------------------------------------------
CREATE INDEX idx_task_projects_user ON task_projects(user_id);
CREATE INDEX idx_task_boards_project ON task_boards(project_id);
CREATE INDEX idx_task_columns_board ON task_columns(board_id);
CREATE INDEX idx_task_sprints_board ON task_sprints(board_id);
CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_board_column ON tasks(board_id, column_id);
CREATE INDEX idx_tasks_column ON tasks(column_id);
CREATE INDEX idx_tasks_sprint ON tasks(sprint_id);
CREATE INDEX idx_task_comments_task ON task_comments(task_id);

-- FUNCTIONS --------------------------------------------------------------
CREATE OR REPLACE FUNCTION create_default_task_columns(p_board_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO task_columns (board_id, name, slug, category, color, position)
  VALUES
    (p_board_id, 'A Fazer', 'a-fazer', 'todo', '#2563EB', 1000),
    (p_board_id, 'Fazendo', 'fazendo', 'in_progress', '#7C3AED', 2000),
    (p_board_id, 'Aguardando', 'aguardando', 'waiting', '#F97316', 3000),
    (p_board_id, 'Concluído', 'concluido', 'done', '#16A34A', 4000)
  ON CONFLICT (board_id, slug) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_task_board_insert()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_task_columns(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_task_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  board_project_id UUID;
  project_owner UUID;
  project_code TEXT;
  next_number INTEGER;
  column_board_id UUID;
  calculated_order DOUBLE PRECISION;
BEGIN
  SELECT tb.project_id
  INTO board_project_id
  FROM task_boards tb
  WHERE tb.id = NEW.board_id;

  IF board_project_id IS NULL THEN
    RAISE EXCEPTION 'Quadro % não encontrado para tarefa', NEW.board_id;
  END IF;

  SELECT tc.board_id
  INTO column_board_id
  FROM task_columns tc
  WHERE tc.id = NEW.column_id;

  IF column_board_id IS NULL OR column_board_id <> NEW.board_id THEN
    RAISE EXCEPTION 'Coluna % não pertence ao quadro %', NEW.column_id, NEW.board_id;
  END IF;

  SELECT tp.user_id, tp.code, tp.issue_counter
  INTO project_owner, project_code, next_number
  FROM task_projects tp
  WHERE tp.id = board_project_id
  FOR UPDATE;

  IF project_code IS NULL THEN
    RAISE EXCEPTION 'Projeto % não encontrado para tarefa', board_project_id;
  END IF;

  next_number := COALESCE(next_number, 0) + 1;

  UPDATE task_projects SET issue_counter = next_number WHERE id = board_project_id;

  NEW.project_id := board_project_id;
  NEW.user_id := project_owner;
  NEW.reporter_id := COALESCE(NEW.reporter_id, project_owner);
  NEW.assignee_id := COALESCE(NEW.assignee_id, project_owner);
  NEW.key := CONCAT(project_code, '-', next_number::TEXT);

  IF NEW.sort_order IS NULL OR NEW.sort_order = 0 THEN
    SELECT COALESCE(MAX(sort_order), 0) + 1000
    INTO calculated_order
    FROM tasks
    WHERE column_id = NEW.column_id;

    NEW.sort_order := COALESCE(calculated_order, 1000);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION handle_task_sprint_before_insert()
RETURNS TRIGGER AS $$
DECLARE
  board_project_id UUID;
BEGIN
  SELECT project_id
  INTO board_project_id
  FROM task_boards
  WHERE id = NEW.board_id;

  IF board_project_id IS NULL THEN
    RAISE EXCEPTION 'Quadro % não encontrado para sprint', NEW.board_id;
  END IF;

  NEW.project_id := board_project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGERS ---------------------------------------------------------------
CREATE TRIGGER trg_task_board_defaults
AFTER INSERT ON task_boards
FOR EACH ROW EXECUTE FUNCTION handle_task_board_insert();

CREATE TRIGGER trg_task_projects_updated_at
BEFORE UPDATE ON task_projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_task_boards_updated_at
BEFORE UPDATE ON task_boards
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_task_sprints_before_insert
BEFORE INSERT ON task_sprints
FOR EACH ROW EXECUTE FUNCTION handle_task_sprint_before_insert();

CREATE TRIGGER trg_task_sprints_updated_at
BEFORE UPDATE ON task_sprints
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_task_columns_updated_at
BEFORE UPDATE ON task_columns
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_task_comments_updated_at
BEFORE UPDATE ON task_comments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_tasks_before_insert
BEFORE INSERT ON tasks
FOR EACH ROW EXECUTE FUNCTION handle_task_before_insert();

-- RLS --------------------------------------------------------------------
ALTER TABLE task_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own task projects"
  ON task_projects
  FOR ALL
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users manage own task boards"
  ON task_boards
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM task_projects tp
      WHERE tp.id = task_boards.project_id
        AND tp.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM task_projects tp
      WHERE tp.id = task_boards.project_id
        AND tp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users manage own task sprints"
  ON task_sprints
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM task_projects tp
      WHERE tp.id = task_sprints.project_id
        AND tp.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM task_projects tp
      WHERE tp.id = task_sprints.project_id
        AND tp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users manage own task columns"
  ON task_columns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM task_boards tb
      JOIN task_projects tp ON tp.id = tb.project_id
      WHERE tb.id = task_columns.board_id
        AND tp.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM task_boards tb
      JOIN task_projects tp ON tp.id = tb.project_id
      WHERE tb.id = task_columns.board_id
        AND tp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users manage own tasks"
  ON tasks
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM task_projects tp
      WHERE tp.id = tasks.project_id
        AND tp.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM task_projects tp
      WHERE tp.id = tasks.project_id
        AND tp.user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users manage own task comments"
  ON task_comments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM tasks t
      JOIN task_projects tp ON tp.id = t.project_id
      WHERE t.id = task_comments.task_id
        AND tp.user_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM tasks t
      JOIN task_projects tp ON tp.id = t.project_id
      WHERE t.id = task_comments.task_id
        AND tp.user_id = (SELECT auth.uid())
    )
  );

-- SEARCH PATHS -----------------------------------------------------------
ALTER FUNCTION create_default_task_columns(UUID) SET search_path = public, auth;
ALTER FUNCTION handle_task_board_insert() SET search_path = public, auth;
ALTER FUNCTION handle_task_before_insert() SET search_path = public, auth;
ALTER FUNCTION handle_task_sprint_before_insert() SET search_path = public, auth;
