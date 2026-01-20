-- Garantir que drivers tem user_id e constraint correta
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_drivers_user_id ON drivers(user_id);

-- Recriar as políticas RLS para drivers (permitir ver todos, mas só gerenciar os próprios)
DROP POLICY IF EXISTS drivers_select_policy ON drivers;
DROP POLICY IF EXISTS drivers_insert_policy ON drivers;
DROP POLICY IF EXISTS drivers_update_policy ON drivers;
DROP POLICY IF EXISTS drivers_delete_policy ON drivers;

-- Permitir SELECT para todos (qualquer usuário pode ver todos os motoristas)
CREATE POLICY drivers_select_policy ON drivers
  FOR SELECT
  USING (true);

-- Para INSERT, permitir criar com ou sem user_id (para retrocompatibilidade)
CREATE POLICY drivers_insert_policy ON drivers
  FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Para UPDATE e DELETE, só permitir se for dono ou se não tiver dono
CREATE POLICY drivers_update_policy ON drivers
  FOR UPDATE
  USING (user_id IS NULL OR auth.uid() = user_id)
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

CREATE POLICY drivers_delete_policy ON drivers
  FOR DELETE
  USING (user_id IS NULL OR auth.uid() = user_id);
