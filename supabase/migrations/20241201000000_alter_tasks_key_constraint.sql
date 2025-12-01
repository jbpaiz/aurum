-- Alterar constraint de key para permitir keys duplicadas entre usuários
-- mas garantir unicidade por usuário

-- Remover a constraint UNIQUE antiga
ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_key_key;

-- Criar nova constraint UNIQUE composta (key + user_id)
ALTER TABLE tasks ADD CONSTRAINT tasks_key_user_id_unique UNIQUE (key, user_id);

-- Comentário explicativo
COMMENT ON CONSTRAINT tasks_key_user_id_unique ON tasks IS 
'Garante que cada usuário pode ter sua própria sequência de keys (ex: AUR-1, AUR-2) sem conflitar com outros usuários';
