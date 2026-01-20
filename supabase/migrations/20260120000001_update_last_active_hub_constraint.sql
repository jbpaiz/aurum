-- Atualizar constraint de last_active_hub para incluir health e vehicles
ALTER TABLE user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_last_active_hub_check;

ALTER TABLE user_preferences
ADD CONSTRAINT user_preferences_last_active_hub_check 
CHECK (last_active_hub IN ('finance', 'tasks', 'health', 'vehicles'));

-- Atualizar comentário
COMMENT ON COLUMN user_preferences.last_active_hub IS 'Último hub acessado pelo usuário (finance, tasks, health ou vehicles)';
