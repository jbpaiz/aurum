# 🎯 Sistema de Campo de Prioridade Customizável

## 📋 Descrição

Este sistema permite que os usuários personalizem completamente o campo de "Prioridade" no módulo de tarefas (Kanban). 

### ✨ Funcionalidades

- ✅ **Nome do Campo Customizável**: Altere "Prioridade" para qualquer nome (ex: "Sprint", "Urgência", etc.)
- ✅ **Opções Configuráveis**: Adicione, edite e remova opções com cores personalizadas
- ✅ **Limite de 20 Caracteres**: Tanto o nome do campo quanto as opções são limitados a 20 caracteres
- ✅ **Reordenação**: Arraste e solte para reorganizar as opções
- ✅ **Cores Customizáveis**: 13 opções de cores para os marcadores
- ✅ **Padrão Inteligente**: Sistema usa valores padrão caso não haja configuração

## 🏗️ Arquitetura

### Banco de Dados

**Tabelas Criadas:**

1. **`task_custom_fields`** - Armazena a configuração do campo
   - `id` (UUID) - Chave primária
   - `project_id` (UUID) - Projeto associado
   - `field_type` (TEXT) - Tipo do campo (atualmente apenas 'priority')
   - `field_name` (TEXT) - Nome customizável (max 20 chars)
   - `is_active` (BOOLEAN)
   - `created_at`, `updated_at`

2. **`task_custom_field_options`** - Opções do campo
   - `id` (UUID) - Chave primária
   - `custom_field_id` (UUID) - Referência ao campo
   - `option_value` (TEXT) - Valor técnico (ex: 'low', 'high')
   - `option_label` (TEXT) - Label exibido (max 20 chars)
   - `color` (TEXT) - Cor hexadecimal do marcador
   - `position` (INTEGER) - Ordem de exibição
   - `is_active` (BOOLEAN)
   - `created_at`, `updated_at`

**RLS (Row Level Security):** ✅ Habilitado para ambas as tabelas

**Triggers:**
- Criação automática de campo padrão ao criar projeto
- Atualização automática de timestamps

### Frontend

**Arquivos Modificados:**

1. **`src/types/tasks.ts`**
   - Novos tipos: `TaskCustomField`, `TaskCustomFieldOption`
   - Inputs para CRUD: `CreateCustomFieldInput`, `UpdateCustomFieldInput`, etc.

2. **`src/contexts/tasks-context.tsx`**
   - Estado `priorityField` com as configurações
   - Funções: `updateCustomField`, `createFieldOption`, `updateFieldOption`, `deleteFieldOption`
   - Carregamento automático ao trocar de projeto

3. **`src/components/tasks/task-modal.tsx`**
   - Usa opções customizáveis no select de prioridade
   - Fallback para valores padrão

4. **`src/components/tasks/kanban-card.tsx`**
   - Exibe label e cor configurados
   - Fallback para valores padrão

5. **`src/components/tasks/task-list-view.tsx`**
   - Tabela usa labels customizados
   - Cores dinâmicas baseadas na configuração

6. **`src/components/tasks/custom-field-config-modal.tsx`** ⭐ **NOVO**
   - Modal completo para gerenciar o campo
   - Edição do nome (max 20 chars)
   - CRUD de opções com drag-and-drop
   - Seletor de cores

7. **`src/components/tasks/board-management-view.tsx`**
   - Botão "Configurar Campos" adicionado
   - Abre o modal de configuração

## 📦 Instalação

### 1. Aplicar Migration no Banco de Dados

**Opção A: Via SQL Editor do Supabase (Recomendado)**

1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá em **SQL Editor**
4. Clique em **New Query**
5. Cole o conteúdo do arquivo: `supabase/migrations/20260116000001_create_custom_field_system.sql`
6. Execute o script (botão **Run**)

**Opção B: Via CLI Supabase**

```bash
# Se você tem o Supabase CLI instalado
npx supabase db push

# Ou usando o script npm
npm run db:deploy
```

### 2. Atualizar Types do TypeScript (Opcional)

```bash
npm run supabase:types
```

### 3. Reiniciar o Servidor de Desenvolvimento

```bash
npm run dev
```

## 🎮 Como Usar

### Acessar Configurações

1. Vá para o módulo de **Tarefas** (Kanban)
2. Clique no botão **⚙️ Configurações** (canto superior direito)
3. Clique em **"Configurar Campos"**

### Alterar Nome do Campo

1. No modal, edite o campo "Nome do Campo"
2. Digite o novo nome (máximo 20 caracteres)
3. Clique em **"Salvar"**

### Adicionar Nova Opção

1. No formulário "Nova Opção":
   - **Valor Técnico**: Identificador único (ex: `sprint_1`, `low`, `urgent`)
   - **Label**: Nome exibido ao usuário (máx. 20 chars)
   - **Cor**: Selecione uma cor para o marcador
2. Clique em **"Adicionar Opção"**

### Editar Opção Existente

1. Clique no ícone **✏️ Editar** da opção
2. Modifique o label ou a cor
3. Clique em **"Salvar Alterações"**

### Reordenar Opções

1. Arraste o ícone **☰** (alça) da opção
2. Solte na posição desejada
3. A ordem é salva automaticamente

### Remover Opção

1. Clique no ícone **🗑️ Deletar** da opção
2. Confirme a remoção

⚠️ **Nota:** A remoção é um "soft delete" (a opção é desativada, não deletada)

## 🔒 Segurança

- ✅ **RLS habilitado**: Usuários só veem/editam campos de seus próprios projetos
- ✅ **Validação de limites**: Nome e labels limitados a 20 caracteres (backend + frontend)
- ✅ **Triggers seguros**: Funções marcadas como `SECURITY DEFINER`
- ✅ **Valores sanitizados**: Input sanitizado antes de salvar

## 🎨 Cores Disponíveis

```javascript
'#94A3B8' // Cinza
'#64748B' // Cinza Escuro
'#3B82F6' // Azul
'#0EA5E9' // Azul Claro
'#6366F1' // Índigo
'#8B5CF6' // Roxo
'#10B981' // Verde
'#14B8A6' // Teal
'#F59E0B' // Âmbar
'#F97316' // Laranja
'#EF4444' // Vermelho
'#DC2626' // Vermelho Escuro
'#EC4899' // Rosa
```

## 📊 Exemplo de Uso

### Cenário 1: Sprint Planning
```
Nome do Campo: "Sprint"
Opções:
  - sprint_1 → "Sprint 1" (Azul)
  - sprint_2 → "Sprint 2" (Verde)
  - sprint_3 → "Sprint 3" (Laranja)
  - backlog → "Backlog" (Cinza)
```

### Cenário 2: Urgência
```
Nome do Campo: "Urgência"
Opções:
  - critical → "Crítica" (Vermelho)
  - high → "Alta" (Laranja)
  - normal → "Normal" (Azul)
  - low → "Baixa" (Cinza)
```

### Cenário 3: Prioridade MoSCoW
```
Nome do Campo: "MoSCoW"
Opções:
  - must → "Must Have" (Vermelho)
  - should → "Should Have" (Laranja)
  - could → "Could Have" (Azul)
  - wont → "Won't Have" (Cinza)
```

## 🐛 Troubleshooting

### Problema: Configuração não aparece

**Solução:**
1. Verifique se a migration foi aplicada corretamente
2. Confirme que o projeto tem um campo criado:
```sql
SELECT * FROM task_custom_fields WHERE project_id = 'seu-projeto-id';
```

### Problema: Opções não são salvas

**Solução:**
1. Verifique o console do navegador para erros
2. Confirme que RLS está configurado:
```sql
SELECT * FROM pg_policies WHERE tablename = 'task_custom_fields';
```

### Problema: Migration falha

**Solução:**
1. Execute a migration manualmente via SQL Editor
2. Verifique conflitos com tabelas existentes
3. Rode linha por linha se necessário

## 🚀 Próximas Melhorias

- [ ] Suporte para outros tipos de campos (labels, status, etc.)
- [ ] Templates de configuração (preset de sprints, prioridades, etc.)
- [ ] Importação/Exportação de configurações
- [ ] Histórico de mudanças
- [ ] Campos por quadro (não apenas por projeto)

## 📝 Notas Técnicas

- **Compatibilidade**: Todas as tarefas existentes continuam funcionando com valores padrão
- **Performance**: Configurações são carregadas uma vez por projeto e cached
- **Extensibilidade**: Sistema projetado para suportar múltiplos tipos de campos no futuro
- **Migração**: Projetos existentes recebem configuração padrão automaticamente

## 📄 Licença

Este sistema faz parte do projeto Aurum Financial Control.
