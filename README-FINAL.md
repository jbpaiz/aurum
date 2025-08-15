# 🌟 Aurum - Controle Financeiro Robusto

Sistema completo de controle financeiro inspirado no Mobills, com persistência total de dados no Supabase.

## ✨ Funcionalidades Implementadas

### 🔐 Sistema de Autenticação
- ✅ Login/Cadastro com email e senha
- ✅ Login social (Google e GitHub)
- ✅ Recuperação de senha
- ✅ Gestão completa de usuários

### 💳 Gestão de Cartões
- ✅ Cartões de crédito e débito
- ✅ Múltiplos provedores (Visa, Mastercard, etc.)
- ✅ Validação completa de dados
- ✅ Interface visual atrativa

### 🏦 Sistema de Contas Bancárias
- ✅ Contas corrente, poupança, investimentos e carteiras
- ✅ Múltiplos bancos brasileiros (Nubank, BB, Itaú, etc.)
- ✅ Controle de saldos em tempo real
- ✅ Cores e ícones personalizados

### 💰 Métodos de Pagamento
- ✅ PIX, dinheiro, cartões, transferências
- ✅ Vinculação automática com contas e cartões
- ✅ Sistema inteligente de sugestões

### 💸 Transações Financeiras
- ✅ Receitas e despesas
- ✅ Categorização automática
- ✅ Histórico completo
- ✅ Filtros e buscas avançadas

### 🎯 Sistema Robusto
- ✅ Persistência completa no Supabase
- ✅ Row Level Security (RLS)
- ✅ Backup automático (localStorage + banco)
- ✅ Interface responsiva e moderna

## 🚀 Como Executar

### 1. Instalação das Dependências
```bash
npm install
```

### 2. Configuração do Banco de Dados

#### Opção A: Configuração Manual (Recomendada)
1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/difntzsqjzhswyubprsc/sql/new)
2. Copie o conteúdo do arquivo `database-setup.sql`
3. Cole no SQL Editor do Supabase
4. Clique em "Run" para executar
5. Aguarde a confirmação de sucesso

#### Opção B: Via Scripts
```bash
# Testar conexão
npm run db:test

# Ver instruções de configuração
npm run db:setup

# Migração (requer service role key)
npm run db:migrate
```

### 3. Iniciar o Projeto
```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3001`

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build para produção
npm run start            # Inicia servidor de produção

# Banco de Dados
npm run db:test          # Testa conexão com Supabase
npm run db:setup         # Mostra instruções de configuração
npm run db:migrate       # Executa migrações (requer service key)

# Supabase Local (requer Docker)
npm run supabase:start   # Inicia Supabase local
npm run supabase:stop    # Para Supabase local
npm run supabase:reset   # Reseta banco local
```

## 📊 Estrutura do Banco de Dados

### Tabelas Principais
- **bank_accounts**: Contas bancárias dos usuários
- **payment_methods**: Métodos de pagamento vinculados às contas
- **cards**: Cartões de crédito e débito
- **transactions**: Todas as transações financeiras
- **categories**: Categorias de receitas e despesas

### Segurança
- **Row Level Security (RLS)** habilitado em todas as tabelas
- **Políticas de acesso** por usuário autenticado
- **Triggers automáticos** para atualização de timestamps

## 🎨 Interface

### Componentes Implementados
- **LandingWithAuth**: Página principal com autenticação
- **AccountsManagement**: Gestão completa de contas
- **CardsManagement**: Gestão de cartões
- **TransactionModal**: Criação de transações
- **UserMenu**: Menu do usuário autenticado

### Design System
- **Tailwind CSS** para estilização
- **shadcn/ui** para componentes base
- **Lucide React** para ícones
- **Design responsivo** e moderno

## 🔄 Estados da Aplicação

### Context API
- **AuthContext**: Autenticação e gestão de usuários
- **AccountsContext**: Contas bancárias e métodos de pagamento
- **CardsContext**: Gestão de cartões

### Persistência Híbrida
- **Primário**: Supabase (banco PostgreSQL)
- **Fallback**: localStorage (backup local)
- **Sincronização automática** entre fontes

## 📱 Experiência do Usuário

### Modo Demo
- ✅ Funciona sem configuração inicial
- ✅ Dados de demonstração pré-carregados
- ✅ Transição suave para dados reais

### Modo Produção
- ✅ Dados persistidos no Supabase
- ✅ Sincronização em tempo real
- ✅ Backup automático local

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 14** (App Router)
- **React 18** com TypeScript
- **Tailwind CSS** + **shadcn/ui**
- **Context API** para estado global

### Backend
- **Supabase** (PostgreSQL + Auth)
- **Row Level Security (RLS)**
- **Real-time subscriptions**
- **Triggers e Functions**

### Ferramentas
- **ESLint** para qualidade de código
- **TypeScript** para type safety
- **Git** para versionamento

## 🎯 Próximos Passos

### Funcionalidades Planejadas
- [ ] Dashboard com gráficos e relatórios
- [ ] Planejamento financeiro e metas
- [ ] Exportação de dados (PDF, Excel)
- [ ] Notificações e lembretes
- [ ] Categorias personalizadas
- [ ] Transações recorrentes
- [ ] Controle de orçamento por categoria

### Melhorias Técnicas
- [ ] Testes automatizados (Jest + Testing Library)
- [ ] PWA (Progressive Web App)
- [ ] Otimizações de performance
- [ ] Deploy automatizado
- [ ] Monitoramento de erros

## 📞 Suporte

Se você encontrar algum problema:

1. **Banco não configurado**: Execute `npm run db:setup`
2. **Erro de conexão**: Verifique o arquivo `.env.local`
3. **Tabelas não encontradas**: Execute o SQL no Supabase Dashboard
4. **Problemas de login**: Verifique se a autenticação está habilitada no Supabase

## 🎉 Status do Projeto

✅ **Sistema Completo e Funcional**
- Autenticação implementada
- Banco de dados configurado
- Interface moderna e responsiva
- Persistência robusta e confiável
- Pronto para uso em produção

---

*Desenvolvido com 💜 usando Next.js, Supabase e muito café ☕*
