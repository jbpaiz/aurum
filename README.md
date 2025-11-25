# Aurum - Sistema de Controle Financeiro

Um sistema completo de controle financeiro desenvolvido com React, Next.js, TypeScript, shadcn/ui e Supabase.

## 🚀 Tecnologias

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI/UX**: shadcn/ui, Tailwind CSS, Lucide React
- **Backend**: Supabase (PostgreSQL)
- **Estilização**: Tailwind CSS com sistema de design tokens
- **Ícones**: Lucide React

## 📋 Funcionalidades

### ✅ Implementadas
- 📊 Dashboard com visão geral das finanças
- 💰 Cadastro de receitas e despesas
- 📝 Categorização automática de transações
- 📈 Cálculo automático de saldo, receitas e despesas totais
- � Relatório de receitas x despesas com exportação CSV e salvamento no Supabase
- �📱 Interface responsiva e moderna
- 🎨 Design system consistente com shadcn/ui
- 🔗 Sincronização em tempo real com Supabase para contas, cartões e transações
- 🗂️ Kanban de tarefas estilo Jira com quadros, colunas configuráveis e drag-and-drop

### 🔄 Em Desenvolvimento
- 📊 Gráficos e relatórios detalhados
- 🔍 Filtros avançados por período e categoria
- 📱 Progressive Web App (PWA)
- 🔐 Sistema de autenticação
- 📤 Exportação de dados
- 🎯 Metas financeiras
- 💡 Insights e sugestões automáticas

## 🛠️ Configuração do Projeto

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta no Supabase (gratuita)

### 1. Clone e Instale as Dependências

```bash
# As dependências já estão instaladas no projeto atual
npm install
```

> ℹ️ **Kanban**: versões anteriores do Aurum não tinham `@dnd-kit/*`. Rode `npm install` para baixar as novas libs e `npm run db:deploy` para aplicar a migration `009_kanban_schema.sql` no Supabase.

### 2. Configuração AUTOMÁTICA do Supabase 🚀

**NOVO!** Agora temos configuração automática do Supabase:

```bash
# Execute o configurador automático
node scripts/configure-supabase.js
```

Depois de atualizar o `.env.local` com as credenciais reais, rode:

```bash
npm run supabase:setup
```

Esse comando agora conecta automaticamente ao banco do Supabase e aplica as migrations em `supabase/migrations`.
Ele precisa encontrar no `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- **E** uma das opções abaixo
    - `DATABASE_URL` completo do Postgres, **ou**
    - `SUPABASE_DB_PASSWORD` (o script monta a URL usando o `project-ref` da URL pública)

**Método Manual:**
1. **Crie um projeto no [Supabase](https://supabase.com)**
2. **Configure o banco**:
   - Vá para Settings > API e copie suas credenciais
    - Edite `.env.local` com suas credenciais reais (inclusive `DATABASE_URL` ou `SUPABASE_DB_PASSWORD`)
    - Execute: `npm run supabase:setup`

3. **Documentação detalhada**: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

### 3. Execute o Projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

> 💡 **Modo Demo**: O projeto funciona perfeitamente em modo demonstração enquanto você não configura o Supabase!

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── globals.css          # Estilos globais e tokens CSS
│   ├── layout.tsx           # Layout principal da aplicação
│   └── page.tsx             # Página inicial
├── components/
│   ├── ui/                  # Componentes shadcn/ui
│   │   ├── button.tsx
│   │   └── card.tsx
│   ├── dashboard/           # Dashboard autenticado
│   ├── tasks/               # Kanban (board, coluna, cartão e modal)
│   ├── reports/             # Relatórios e análises financeiras
│   ├── landing-with-auth.tsx# Landing page com demo + auth
│   ├── modals/              # Modais reutilizáveis (transactions, auth, etc.)
│   └── transactions/        # Lista e página dedicada de transações
├── hooks/
│   ├── use-dashboard-data.ts# Consolida contas + transações para cards
│   └── use-transactions.ts  # CRUD tipado com Supabase para transações
├── contexts/
│   ├── accounts-context.tsx # Contas bancárias carregadas do Supabase
│   ├── cards-context.tsx    # Cartões sincronizados com Supabase
│   └── tasks-context.tsx    # Projetos, quadros e tarefas (board Jira-like)
└── lib/
    ├── supabase.ts          # Configuração do Supabase
    └── utils.ts             # Utilitários (cn function)
```

## 🗄️ Esquema do Banco de Dados

### Tabela `transactions`
- `id` (UUID) - Chave primária
- `user_id` (TEXT) - ID do usuário
- `type` (TEXT) - Tipo: 'income' ou 'expense'
- `amount` (DECIMAL) - Valor da transação
- `description` (TEXT) - Descrição
- `category` (TEXT) - Categoria
- `date` (DATE) - Data da transação
- `created_at` (TIMESTAMPTZ) - Data de criação
- `updated_at` (TIMESTAMPTZ) - Data de atualização

### Tabela `financial_reports`
- `id` (UUID) - Chave primária
- `user_id` (UUID) - Dono do relatório
- `title` (TEXT) - Nome amigável do relatório
- `period_start` / `period_end` (DATE) - Período coberto
- `total_income` / `total_expense` / `net_total` (DECIMAL) - Resumo numérico
- `filters` (JSONB) - Filtros aplicados na geração
- `created_at` / `updated_at` (TIMESTAMPTZ)

### Tabela `financial_report_lines`
- `id` (UUID) - Chave primária
- `report_id` (UUID) - Referência ao relatório salvo
- `user_id` (UUID) - Dono da linha
- `transaction_id` (UUID) - Transação original
- `type` (TEXT) - income ou expense
- `amount` (DECIMAL) - Valor
- `category` / `description` (TEXT)
- `transaction_date` (DATE)
- `created_at` (TIMESTAMPTZ)

### Tabela `categories`
- `id` (UUID) - Chave primária
- `name` (TEXT) - Nome da categoria
- `type` (TEXT) - Tipo: 'income' ou 'expense'
- `color` (TEXT) - Cor da categoria
- `created_at` (TIMESTAMPTZ) - Data de criação

## 🎨 Sistema de Design

O projeto utiliza o shadcn/ui como base para o sistema de design, proporcionando:

- **Consistência visual**: Componentes padronizados e reutilizáveis
- **Acessibilidade**: Componentes desenvolvidos com foco em acessibilidade
- **Customização**: Sistema de tokens CSS para fácil personalização
- **Dark mode**: Suporte nativo a tema escuro (configurável)

### Paleta de Cores

```css
/* Receitas */
--income-color: #10b981 (Verde)

/* Despesas */
--expense-color: #ef4444 (Vermelho)

/* Cores principais */
--primary: #222.2 47.4% 11.2%
--secondary: #210 40% 96%
--background: #0 0% 100%
```

## 📱 Componentes Principais

### Dashboard (`landing.tsx`)
- Exibe cards com resumo financeiro
- Lista transações recentes
- Botão para adicionar novas transações

### Formulário de Transação (`transaction-form.tsx`)
- Modal para cadastro de receitas/despesas
- Validação de campos obrigatórios
- Categorias pré-definidas

### Lista de Transações (`transaction-list.tsx`)
- Exibição formatada das transações
- Ícones diferenciados para receitas/despesas
- Formatação de data em português

### Módulo de Tarefas (`/tasks`)
- **Kanban completo** com múltiplos projetos/quadros, colunas configuráveis e ordenação por `sort_order`
- **Drag-and-drop** com `@dnd-kit/*` para mover cartões entre colunas, semelhante ao Jira
- **Modal avançado de tarefas** com prioridade, tipo, etiquetas, checklist e anexos
- **Contexto dedicado** com Supabase (tabelas `task_projects`, `task_boards`, `task_columns`, `tasks`, `task_comments` e `task_sprints`)
- **Criação automática** de projeto/board padrão para novos usuários e políticas RLS alinhadas

## 🧠 Hooks e Contextos Principais

- `useTransactions`: encapsula toda a comunicação com a tabela `transactions`, incluindo criação de categorias sob demanda e parsing de notas (forma de pagamento).
- `useDashboardData`: agrega contas, transações e categorias para montar o overview do dashboard.
- `AccountsProvider` / `CardsProvider`: sincronizam contas e cartões do Supabase e expõem helpers para criação, edição e exclusão soft-delete.

## 🚀 Próximos Passos

1. **Autenticação**: Implementar login/cadastro com Supabase Auth
2. **Filtros**: Adicionar filtros por período, categoria e tipo
3. **Gráficos**: Implementar visualizações com Recharts
4. **PWA**: Configurar service worker para uso offline
5. **Testes**: Adicionar testes unitários e de integração

## 📄 Scripts Disponíveis

```bash
npm run dev          # Inicia o servidor de desenvolvimento
npm run build        # Gera build de produção
npm run start        # Inicia servidor de produção
npm run lint         # Executa linter
npm run db:deploy    # Aplica as migrações no banco Supabase definido em .env.prod
```

## 🚢 Deploy Automatizado do Banco

1. Copie `.env.prod.example` para `.env.prod` e preencha `SUPABASE_REMOTE_DB_URL` com a string de conexão do projeto Supabase (ex.: `postgresql://postgres:senha@db.<project-ref>.supabase.co:5432/postgres?sslmode=require`).
2. Execute `npm run db:deploy` para aplicar localmente as migrações em `supabase/migrations` diretamente no banco remoto.
3. Para CI/CD, configure o secret `SUPABASE_REMOTE_DB_URL` no GitHub e habilite o workflow `deploy-db.yml`. Ele roda automaticamente em pushes para `main` (ou manualmente via *workflow_dispatch*) e executa o mesmo comando de deploy.

> O arquivo `.env.prod` está listado no `.gitignore` para evitar vazamento de credenciais. Compartilhe apenas o `.env.prod.example`.

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ usando as melhores práticas de desenvolvimento web moderno.**
