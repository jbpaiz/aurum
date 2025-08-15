# 🎯 GUIA PASSO A PASSO - CRIAR ESTRUTURA DO BANCO

## 📋 PASSOS PARA EXECUTAR NO SUPABASE:

### 1. 🌐 Abra o SQL Editor
   - O navegador já está aberto em: https://supabase.com/dashboard/project/difntzsqjzhswyubprsc/sql/new
   - Faça login se necessário

### 2. 📋 Copie o SQL Completo
   - Copie TODO o conteúdo do arquivo `database-setup.sql`
   - Ctrl+A para selecionar tudo, depois Ctrl+C

### 3. 📝 Cole no Editor
   - Cole no editor SQL do Supabase (Ctrl+V)
   - Você deve ver todo o código SQL

### 4. ▶️ Execute o Script
   - Clique no botão "Run" (azul)
   - Aguarde a execução (pode levar alguns segundos)

### 5. ✅ Verifique o Resultado
   - Você deve ver mensagens de sucesso
   - Execute: `npm run db:test` para confirmar

## 📊 ESTRUTURA QUE SERÁ CRIADA:

### 🏦 **bank_accounts** (Contas Bancárias)
```
id                 UUID (Chave primária)
user_id           UUID (Referência ao usuário)
name              TEXT (Nome da conta)
type              TEXT (checking/savings/investment/wallet/other)
bank              TEXT (Código do banco)
icon              TEXT (Ícone da conta)
color             TEXT (Cor da conta)
balance           DECIMAL(15,2) (Saldo)
is_active         BOOLEAN (Conta ativa)
created_at        TIMESTAMP (Data criação)
updated_at        TIMESTAMP (Data atualização)
```

### 💳 **payment_methods** (Métodos de Pagamento)
```
id                 UUID (Chave primária)
user_id           UUID (Referência ao usuário)
name              TEXT (Nome do método)
type              TEXT (pix/cash/credit_card/debit_card/bank_transfer/other)
account_id        UUID (Referência à conta)
card_id           UUID (Referência ao cartão, opcional)
icon              TEXT (Ícone do método)
color             TEXT (Cor do método)
is_active         BOOLEAN (Método ativo)
created_at        TIMESTAMP (Data criação)
updated_at        TIMESTAMP (Data atualização)
```

### 📁 **categories** (Categorias)
```
id                 UUID (Chave primária)
user_id           UUID (Referência ao usuário)
name              TEXT (Nome da categoria)
type              TEXT (income/expense)
icon              TEXT (Ícone da categoria)
color             TEXT (Cor da categoria)
parent_id         UUID (Categoria pai, opcional)
is_active         BOOLEAN (Categoria ativa)
created_at        TIMESTAMP (Data criação)
updated_at        TIMESTAMP (Data atualização)
```

### 💸 **transactions** (Transações)
```
id                 UUID (Chave primária)
user_id           UUID (Referência ao usuário)
description       TEXT (Descrição da transação)
amount            DECIMAL(15,2) (Valor)
type              TEXT (income/expense)
category_id       UUID (Referência à categoria)
payment_method_id UUID (Referência ao método de pagamento)
account_id        UUID (Referência à conta)
date              DATE (Data da transação)
notes             TEXT (Observações)
is_recurring      BOOLEAN (Transação recorrente)
recurring_config  JSONB (Configuração de recorrência)
created_at        TIMESTAMP (Data criação)
updated_at        TIMESTAMP (Data atualização)
```

### 💳 **cards** (Cartões)
```
id                 UUID (Chave primária)
user_id           UUID (Referência ao usuário)
nickname          TEXT (Apelido do cartão)
type              TEXT (credit/debit)
provider          TEXT (visa/mastercard/elo/etc)
last_digits       TEXT (Últimos dígitos)
expiry_month      INTEGER (Mês de vencimento)
expiry_year       INTEGER (Ano de vencimento)
color             TEXT (Cor do cartão)
icon              TEXT (Ícone do cartão)
is_active         BOOLEAN (Cartão ativo)
created_at        TIMESTAMP (Data criação)
updated_at        TIMESTAMP (Data atualização)
```

## 🛡️ RECURSOS DE SEGURANÇA:

### 🔒 Row Level Security (RLS)
- Cada tabela tem RLS habilitado
- Usuários só veem seus próprios dados
- Políticas de acesso por usuário autenticado

### 🔄 Triggers Automáticos
- `updated_at` atualizado automaticamente
- Função `insert_default_categories()` para categorias padrão

## 🔍 VERIFICAÇÃO:

Após executar o SQL, teste com:
```bash
npm run db:test
```

Se tudo estiver OK, você verá:
```
✅ Tabela 'bank_accounts': OK
✅ Tabela 'payment_methods': OK
✅ Tabela 'categories': OK
✅ Tabela 'transactions': OK
✅ Tabela 'cards': OK
```
