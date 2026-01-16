# Guia de Implementação do Módulo de Saúde

## ✅ Arquivos Criados

### 1. Migração do Banco de Dados
- `supabase/migrations/20260116000003_create_health_module.sql` - Criação das tabelas, RLS policies e triggers

### 2. Types TypeScript
- `src/types/health.ts` - Interfaces e tipos completos para o módulo de saúde

### 3. Context
- `src/contexts/health-context.tsx` - Gerenciamento de estado com CRUD operations e cálculos

### 4. Página
- `src/app/health/page.tsx` - Página principal do módulo

### 5. Componentes

**Dashboard:**
- `src/components/health/health-dashboard.tsx` - Dashboard principal com tabs

**Cards:**
- `src/components/health/weight-card.tsx` - Card de peso
- `src/components/health/activity-card.tsx` - Card de atividades
- `src/components/health/sleep-card.tsx` - Card de sono
- `src/components/health/goals-card.tsx` - Card de metas
- `src/components/health/insights-card.tsx` - Card de insights

**Modais:**
- `src/components/health/weight-log-modal.tsx` - Modal para registrar peso
- `src/components/health/activity-modal.tsx` - Modal para registrar atividade
- `src/components/health/sleep-log-modal.tsx` - Modal para registrar sono
- `src/components/health/goal-modal.tsx` - Modal para criar metas

### 6. Integração
- `src/components/layout/hub-config.ts` - Adicionado módulo de saúde ao Hub
- `src/types/preferences.ts` - Adicionado 'health' ao HubId

## 📋 Passos para Implementação

### Passo 1: Aplicar Migrações no Supabase

Você precisa aplicar TODAS as 3 migrações pendentes no Supabase SQL Editor:

```sql
-- 1. Aplicar custom field system (se ainda não aplicado)
-- Arquivo: supabase/migrations/20260116000001_create_custom_field_system.sql

-- 2. Aplicar sort preferences (se ainda não aplicado)
-- Arquivo: supabase/migrations/20260116000002_add_tasks_sort_preferences.sql

-- 3. Aplicar health module
-- Arquivo: supabase/migrations/20260116000003_create_health_module.sql
```

**Como aplicar:**
1. Acesse https://supabase.com/dashboard
2. Vá em seu projeto → SQL Editor
3. Abra cada arquivo de migração
4. Copie todo o conteúdo
5. Cole no SQL Editor
6. Execute (Run)

### Passo 2: Gerar Types do Supabase

Depois de aplicar todas as migrações, você precisa gerar os tipos TypeScript:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/database.types.ts
```

OU, se tiver configurado localmente:

```bash
npm run generate-types
```

**Obs:** Substitua `YOUR_PROJECT_ID` pelo seu ID de projeto do Supabase.

### Passo 3: Instalar Dependências Faltantes

```bash
npm install sonner date-fns
```

### Passo 4: Criar Componentes UI Faltantes

Se não existirem, crie:

**Tabs** (provavelmente já existe, mas verificar):
```bash
npx shadcn-ui@latest add tabs
```

**Dialog** (provavelmente já existe, mas verificar):
```bash
npx shadcn-ui@latest add dialog
```

### Passo 5: Compilar e Testar

```bash
npm run build
```

Se houver erros de types após gerar database.types.ts, os types devem incluir:

- `health_weight_logs`
- `health_activities`
- `health_sleep_logs`
- `health_goals`

## 🎯 Funcionalidades Implementadas

### 1. Peso
- ✅ Registro de múltiplas medições por dia
- ✅ Histórico de peso com gráfico de tendência
- ✅ Estatísticas (min, max, média, tendência)
- ✅ Comparação com dia anterior
- ✅ Notas opcionais

### 2. Atividades
- ✅ 12 tipos de atividade (caminhada, corrida, bike, etc.)
- ✅ Registro de duração, intensidade e calorias
- ✅ Meta semanal (recomendação OMS: 150min)
- ✅ Progresso visual da meta
- ✅ Estatísticas da semana

### 3. Sono
- ✅ Registro de horário de dormir e acordar
- ✅ Cálculo automático de duração
- ✅ Qualidade do sono (ruim, normal, boa)
- ✅ Estatísticas da semana (média, melhor, pior)
- ✅ Notas opcionais

### 4. Metas
- ✅ Metas de peso, atividade ou sono
- ✅ Acompanhamento de progresso
- ✅ Data alvo opcional
- ✅ Ativação/desativação de metas

### 5. Insights
- ✅ Geração automática de insights baseados em dados
- ✅ Alertas de tendências (peso subindo/descendo)
- ✅ Avisos de sono insuficiente
- ✅ Celebração de metas atingidas

## 🎨 Design

- **Mobile-first**: Interface otimizada para celular
- **Tabs**: Organização em abas (Visão Geral, Peso, Atividades, Sono)
- **Cards**: Cada métrica em card independente
- **Modais**: Formulários rápidos para registro
- **Cores**: Verde/Teal (tema saúde)
- **Ícones**: Lucide icons consistentes

## 📊 Dados Armazenados

### weight_logs
- Peso em kg
- Timestamp da medição
- Nota opcional

### activities
- Tipo (12 opções)
- Duração em minutos
- Intensidade (leve, moderada, intensa)
- Calorias queimadas
- Data da atividade

### sleep_logs
- Data do sono
- Horário de dormir
- Horário de acordar
- Duração calculada
- Qualidade

### goals
- Tipo (peso, atividade, sono)
- Valor alvo
- Data alvo
- Status ativo/inativo

## 🔒 Segurança

- RLS (Row Level Security) ativado em todas as tabelas
- Policies para INSERT, SELECT, UPDATE, DELETE
- Usuário só acessa seus próprios dados
- Triggers para `updated_at` automático

## 🚀 Próximos Passos Sugeridos

1. **Gráficos visuais** - Implementar com recharts
2. **Exportação de dados** - PDF/CSV
3. **Metas mais avançadas** - Com sub-metas
4. **Integração com wearables** - Importar dados de smartwatches
5. **Lembretes** - Notificações para registrar dados

## 💡 Como Usar

Após aplicar as migrações e gerar os types:

1. Faça login no app
2. Navegue para o módulo **Saúde** no menu
3. Use os botões **Adicionar** em cada card
4. Configure suas **Metas** na aba de Visão Geral
5. Veja **Insights** automáticos baseados em seus dados

## ⚠️ Importante

- As tabelas só existirão após aplicar a migração no Supabase
- Os types TypeScript precisam ser regenerados após a migração
- Certifique-se de estar logado para ver os dados (RLS ativo)
- Os dados são privados e isolados por usuário

---

**Status Atual:** Código completo, aguardando aplicação de migrações no Supabase.
