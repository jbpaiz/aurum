# Guia de Aplicação de Migrações do Módulo de Saúde

## ⚠️ IMPORTANTE: Leia Antes de Executar

Este guia orienta a aplicação das migrações do banco de dados para o módulo de saúde completo do Aurum.

## 📋 Pré-requisitos

1. Acesso ao Supabase Dashboard: https://supabase.com/dashboard
2. Projeto: `difntzsqjzhswyubprsc`
3. Permissões de administrador no projeto

## 📂 Arquivos de Migração

Existem 2 arquivos principais:

1. **`20260116000003_create_health_module.sql`** - Migração base (tabelas principais)
2. **`20260116000004_health_module_complete.sql`** - Migração completa (todas as features)

**Recomendação**: Usar apenas a migração completa (#2) para nova instalação.

## 🚀 Passos para Aplicar as Migrações

### Opção A: Migração Completa (Recomendado)

1. **Acessar o SQL Editor**
   - Abra https://supabase.com/dashboard/project/difntzsqjzhswyubprsc/sql
   - Clique em "New query"

2. **Executar Migração Completa**
   - Abra o arquivo: `20260116000004_health_module_complete.sql`
   - Copie TODO o conteúdo do arquivo
   - Cole no SQL Editor
   - Clique em "Run" (ou pressione Ctrl+Enter)

3. **Verificar Sucesso**
   - Você deve ver: "Success. No rows returned"
   - Verifique se as tabelas foram criadas em "Table Editor"

### Opção B: Migrações Incrementais

Se preferir aplicar em etapas:

1. Execute primeiro: `20260116000003_create_health_module.sql`
2. Depois execute: `20260116000004_health_module_complete.sql`

## 📊 Tabelas Criadas

Após a migração, as seguintes tabelas serão criadas:

### Tabelas Principais
- `health_weight_logs` - Registros de peso
- `health_activities` - Atividades físicas
- `health_sleep_logs` - Registros de sono
- `health_goals` - Metas de saúde

### Medidas e Nutrição
- `health_body_measurements` - Medidas corporais
- `health_hydration` - Registros de hidratação
- `health_hydration_goals` - Metas de hidratação
- `health_meals` - Refeições registradas
- `health_nutrition_goals` - Metas nutricionais

### Gamificação
- `health_badges` - Conquistas desbloqueadas
- `health_user_stats` - Estatísticas do usuário (nível, pontos)
- `health_challenges` - Desafios ativos e completos

## 🔐 Políticas RLS

As migrações incluem políticas de Row Level Security (RLS) para:
- Usuários só podem ver/editar seus próprios dados
- Todas as operações (SELECT, INSERT, UPDATE, DELETE) são protegidas
- Usa `auth.uid()` para validação de propriedade

## 🔄 Regenerar Types TypeScript

Após aplicar as migrações, regenere os tipos:

```powershell
npx supabase gen types typescript --project-id difntzsqjzhswyubprsc > src/lib/database.types.ts
```

**Nota**: Você precisará estar autenticado na Supabase CLI.

## 🧪 Testar a Instalação

Execute no SQL Editor para verificar:

```sql
-- Verificar tabelas criadas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'health_%'
ORDER BY table_name;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'health_%'
ORDER BY tablename, policyname;
```

## ⚠️ Troubleshooting

### Erro: "relation already exists"
- Significa que a tabela já foi criada
- Você pode ignorar ou usar DROP TABLE antes (cuidado: perde dados!)

### Erro: "permission denied"
- Verifique se está usando a role correta
- Use o service_role_key se necessário

### Erro: "syntax error"
- Verifique se copiou TODO o conteúdo do arquivo
- Não inclua comentários antes da primeira linha SQL

## 📝 Verificação Final

Checklist após migração:

- [ ] Todas as 12 tabelas foram criadas
- [ ] Políticas RLS estão ativas em todas as tabelas
- [ ] Triggers foram criados (updated_at)
- [ ] Índices foram criados para otimização
- [ ] Types TypeScript foram regenerados (opcional)

## 🎯 Próximos Passos

Após aplicar as migrações com sucesso:

1. ✅ O módulo de saúde está pronto para uso
2. ✅ Usuários podem começar a registrar dados
3. ✅ Sistema de gamificação funcionará automaticamente
4. ✅ Todas as features do dashboard estarão funcionais

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs no Supabase Dashboard
2. Revise o conteúdo dos arquivos SQL
3. Execute as queries de verificação acima

---

**Data de Criação**: 16/01/2026
**Versão do Módulo**: 1.0.0
**Autor**: Sistema Aurum Financial
