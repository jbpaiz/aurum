-- Corrigir trigger para respeitar key personalizado fornecido pelo usuário
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
  -- Validar board
  SELECT tb.project_id
  INTO board_project_id
  FROM task_boards tb
  WHERE tb.id = NEW.board_id;

  IF board_project_id IS NULL THEN
    RAISE EXCEPTION 'Quadro % não encontrado para tarefa', NEW.board_id;
  END IF;

  -- Validar coluna
  SELECT tc.board_id
  INTO column_board_id
  FROM task_columns tc
  WHERE tc.id = NEW.column_id;

  IF column_board_id IS NULL OR column_board_id <> NEW.board_id THEN
    RAISE EXCEPTION 'Coluna % não pertence ao quadro %', NEW.column_id, NEW.board_id;
  END IF;

  -- Buscar dados do projeto
  SELECT tp.user_id, tp.code, tp.issue_counter
  INTO project_owner, project_code, next_number
  FROM task_projects tp
  WHERE tp.id = board_project_id
  FOR UPDATE;

  IF project_code IS NULL THEN
    RAISE EXCEPTION 'Projeto % não encontrado para tarefa', board_project_id;
  END IF;

  -- Preencher campos obrigatórios
  NEW.project_id := board_project_id;
  NEW.user_id := project_owner;
  NEW.reporter_id := COALESCE(NEW.reporter_id, project_owner);
  NEW.assignee_id := COALESCE(NEW.assignee_id, project_owner);

  -- SOMENTE gerar key se não foi fornecido
  IF NEW.key IS NULL OR NEW.key = '' THEN
    next_number := COALESCE(next_number, 0) + 1;
    UPDATE task_projects SET issue_counter = next_number WHERE id = board_project_id;
    NEW.key := CONCAT(project_code, '-', next_number::TEXT);
  END IF;

  -- Calcular sort_order se necessário
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
