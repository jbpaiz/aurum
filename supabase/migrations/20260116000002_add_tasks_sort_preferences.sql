-- ================================================
-- ADICIONAR PREFERÊNCIAS DE ORDENAÇÃO DE TAREFAS
-- ================================================
-- Adiciona campos para salvar a ordenação escolhida pelo usuário na lista de tarefas

-- Adicionar colunas de ordenação à tabela user_preferences
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS tasks_sort_key TEXT DEFAULT 'startDate',
ADD COLUMN IF NOT EXISTS tasks_sort_direction TEXT DEFAULT 'asc';

-- Comentários explicativos
COMMENT ON COLUMN user_preferences.tasks_sort_key IS 'Chave de ordenação da lista de tarefas (key, title, labels, startDate, endDate, columnName, priority)';
COMMENT ON COLUMN user_preferences.tasks_sort_direction IS 'Direção da ordenação (asc, desc)';
