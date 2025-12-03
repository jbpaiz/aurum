# Migração: User Preferences

Esta migração adiciona persistência de preferências do usuário no banco de dados Supabase.

## 📋 O que a migração faz

Cria a tabela `user_preferences` que armazena:
- **Tema** (light/dark/system)
- **Último hub acessado** (finance/tasks)
- **Preferências do módulo de tarefas** (view mode, largura adaptável)
- **Projeto e quadro ativos**

## 🚀 Como executar

### Opção 1: Supabase Dashboard (Recomendado)

1. Acesse https://supabase.com/dashboard
2. Selecione o projeto Aurum
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Copie o conteúdo do arquivo `supabase/migrations/20241203000001_create_user_preferences.sql`
6. Cole no editor e clique em **Run**

### Opção 2: Supabase CLI

```bash
# Se tiver o Supabase CLI instalado
supabase db push
```

### Opção 3: Script direto

```bash
# Usando o script fornecido (requer service role key)
node scripts/migrate-user-preferences.js
```

## ✅ Verificar se funcionou

Após executar a migration, verifique se a tabela foi criada:

```sql
SELECT * FROM user_preferences LIMIT 1;
```

## 🔄 Migração automática do localStorage

Quando o usuário fizer login pela primeira vez após a migration:
- O hook `useUserPreferences` detecta que não há preferências no banco
- Migra automaticamente as configurações do localStorage para o banco
- Limpa o localStorage após migração bem-sucedida

## ⚠️ Importante

- **Usuários não logados**: Continuarão usando localStorage como fallback
- **Sincronização entre dispositivos**: Só funciona para usuários logados
- **RLS habilitado**: Cada usuário só pode ver/editar suas próprias preferências

## 📊 Estrutura da tabela

```sql
user_preferences (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  theme TEXT DEFAULT 'system',
  last_active_hub TEXT DEFAULT 'finance',
  tasks_view_mode TEXT DEFAULT 'kanban',
  tasks_adaptive_width BOOLEAN DEFAULT false,
  tasks_adaptive_width_list BOOLEAN DEFAULT false,
  active_project_id UUID,
  active_board_id UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  UNIQUE(user_id)
)
```

## 🔐 Políticas RLS

- ✅ Usuários podem SELECT/INSERT/UPDATE/DELETE suas próprias preferências
- ❌ Usuários NÃO podem acessar preferências de outros usuários
- 🔒 Cascata de exclusão: preferências são deletadas ao excluir usuário
