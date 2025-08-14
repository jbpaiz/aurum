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
- 📱 Interface responsiva e moderna
- 🎨 Design system consistente com shadcn/ui

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

### 2. Configuração AUTOMÁTICA do Supabase 🚀

**NOVO!** Agora temos configuração automática do Supabase:

```bash
# Execute o configurador automático
node scripts/configure-supabase.js
```

**Método Manual:**
1. **Crie um projeto no [Supabase](https://supabase.com)**
2. **Configure o banco**:
   - Vá para Settings > API e copie suas credenciais
   - Edite `.env.local` com suas credenciais reais
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
│   ├── landing.tsx          # Componente principal do dashboard
│   ├── transaction-form.tsx # Formulário de transações
│   └── transaction-list.tsx # Lista de transações
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
```

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
