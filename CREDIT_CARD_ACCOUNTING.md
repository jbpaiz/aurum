# Sistema de Contabilidade - Cartão de Crédito

## 📊 Visão Geral

Implementação completa de gestão financeira seguindo **princípios contábeis de partidas dobradas (simplificado)**, onde o cartão de crédito é tratado como uma **Conta de Passivo** e não apenas um método de pagamento.

## 🏗️ Arquitetura

### 1. Modelo de Dados (Data Modeling)

#### Classificação Contábil das Contas

```typescript
// Tipos de conta seguindo princípios contábeis
type AccountCategory = 'ASSET' | 'LIABILITY'

// Mapeamento
- checking (Conta Corrente) → ASSET (Ativo)
- savings (Poupança) → ASSET (Ativo)
- wallet (Carteira) → ASSET (Ativo)
- investment (Investimentos) → ASSET (Ativo)
- credit_card (Cartão de Crédito) → LIABILITY (Passivo)
- other (Outros) → ASSET (Ativo)
```

#### Entidades

**Accounts (bank_accounts)**
```sql
CREATE TABLE bank_accounts (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('checking', 'savings', 'wallet', 'investment', 'credit_card', 'other')),
  balance DECIMAL(15,2) NOT NULL DEFAULT 0,
  -- Saldo positivo para ATIVO, negativo para PASSIVO (dívida)
  ...
)
```

**Transactions**
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT CHECK (type IN ('income', 'expense', 'transfer')),
  amount DECIMAL(15,2) NOT NULL,
  account_id UUID,  -- Para income/expense
  from_account_id UUID,  -- Para transfer
  to_account_id UUID,  -- Para transfer
  ...
)
```

### 2. Regras de Negócio

#### Cenário A: Compra no Cartão de Crédito

**Problema:** Como registrar uma compra feita com cartão de crédito?

**Solução:**
```typescript
await registerCreditCardPurchase({
  userId: 'user-123',
  creditCardId: 'card-456',
  amount: 500,
  description: 'Compra no supermercado',
  categoryId: 'cat-alimentacao',
  date: '2025-12-01'
})
```

**Impactos:**
- ✅ Cria uma DESPESA vinculada ao cartão
- ✅ Aumenta o PASSIVO (dívida fica mais negativa)
- ✅ Conta corrente NÃO muda
- ✅ Despesa aparece nos relatórios de fluxo de caixa

**Exemplo:**
```
Antes:
- Conta Corrente: R$ 1.000,00
- Cartão Nubank: R$ 0,00
- Patrimônio Líquido: R$ 1.000,00

Depois da compra de R$ 500:
- Conta Corrente: R$ 1.000,00 (sem mudança ✓)
- Cartão Nubank: R$ -500,00 (aumentou dívida ✓)
- Patrimônio Líquido: R$ 500,00 (1000 - 500)
```

#### Cenário B: Pagamento da Fatura

**Problema:** Como registrar o pagamento da fatura SEM duplicar a despesa?

**Solução Errada ❌:**
```typescript
// NÃO FAÇA ISSO!
await createExpense({
  type: 'expense',
  description: 'Pagamento de fatura',
  amount: 500,
  accountId: checkingAccountId
})
// Isso duplicaria a despesa nos relatórios!
```

**Solução Correta ✅:**
```typescript
await payCreditCardInvoice({
  userId: 'user-123',
  checkingAccountId: 'acc-789',
  creditCardId: 'card-456',
  amount: 500,
  date: '2025-12-10'
})
```

**Impactos:**
- ✅ Cria uma TRANSFERÊNCIA (tipo 'transfer')
- ✅ Diminui ATIVO (conta corrente)
- ✅ Diminui PASSIVO (dívida do cartão)
- ✅ NÃO aparece como despesa nos relatórios
- ✅ Patrimônio líquido não muda (só transferiu dinheiro)

**Exemplo:**
```
Antes:
- Conta Corrente: R$ 1.000,00
- Cartão Nubank: R$ -500,00 (dívida)
- Patrimônio Líquido: R$ 500,00

Depois do pagamento de R$ 500:
- Conta Corrente: R$ 500,00 (-500 ✓)
- Cartão Nubank: R$ 0,00 (zerou dívida ✓)
- Patrimônio Líquido: R$ 500,00 (sem mudança ✓)
```

### 3. Cálculo do Patrimônio Líquido

**Fórmula Contábil:**
```
Patrimônio Líquido = Ativos - Passivos
```

**Implementação:**
```typescript
const { assets, liabilities, netWorth } = await calculateNetWorth(userId)

// Exemplo:
// assets: 7.000 (Conta Corrente: 5.000 + Poupança: 2.000)
// liabilities: 1.500 (Cartão Nubank: -1.500)
// netWorth: 5.500 (7.000 - 1.500)
```

## 📂 Estrutura de Arquivos

```
src/
├── lib/
│   └── credit-card-accounting.ts       # Serviço principal de contabilidade
├── hooks/
│   └── use-credit-card-accounting.ts   # Hook React para componentes
├── components/
│   └── dashboard/
│       └── net-worth-card.tsx          # Componente de Patrimônio Líquido
└── types/
    └── accounts.ts                     # Tipos atualizados
```

## 🚀 Como Usar

### 1. Registrar Compra no Cartão

```tsx
import { useCreditCardAccounting } from '@/hooks/use-credit-card-accounting'

function PurchaseForm() {
  const { registerPurchase, isLoading, error } = useCreditCardAccounting()

  const handleSubmit = async () => {
    const result = await registerPurchase({
      creditCardId: selectedCard.id,
      amount: 150.00,
      description: 'Compra na Amazon',
      categoryId: 'cat-compras',
      date: '2025-12-01'
    })

    if (result.success) {
      toast.success('Compra registrada!')
    }
  }

  return (
    // Seu formulário aqui
  )
}
```

### 2. Pagar Fatura do Cartão

```tsx
function PayInvoiceButton() {
  const { payInvoice, isLoading } = useCreditCardAccounting()

  const handlePay = async () => {
    const result = await payInvoice({
      checkingAccountId: checkingAccount.id,
      creditCardId: creditCard.id,
      amount: 500.00,
      date: '2025-12-10'
    })

    if (result.success) {
      toast.success('Fatura paga!')
    }
  }

  return (
    <button onClick={handlePay} disabled={isLoading}>
      Pagar Fatura
    </button>
  )
}
```

### 3. Exibir Patrimônio Líquido

```tsx
import { NetWorthCard } from '@/components/dashboard/net-worth-card'

function Dashboard() {
  return (
    <div>
      <NetWorthCard />
      {/* Outros cards do dashboard */}
    </div>
  )
}
```

## 🗄️ Migrações do Banco de Dados

Execute as migrações na ordem:

1. **20241201000004_add_credit_card_account_type.sql**
   - Adiciona tipo 'credit_card' às contas

## ✅ Validações Implementadas

- ✅ Valor deve ser maior que zero
- ✅ Conta deve existir e pertencer ao usuário
- ✅ Saldo suficiente para pagamento de fatura
- ✅ Rollback automático em caso de erro
- ✅ Tratamento de erros com mensagens descritivas

## 📊 Relatórios e Fluxo de Caixa

**Importante:** Ao gerar relatórios de fluxo de caixa:

- **Incluir:** Transações do tipo 'income' e 'expense'
- **Excluir:** Transações do tipo 'transfer' (pagamento de fatura)

```typescript
// Exemplo de query para relatório
const { data } = await supabase
  .from('transactions')
  .select('*')
  .eq('user_id', userId)
  .in('type', ['income', 'expense']) // NÃO incluir 'transfer'
  .gte('transaction_date', startDate)
  .lte('transaction_date', endDate)
```

## 🎯 Benefícios da Implementação

1. **Contabilmente Correto:** Segue princípios contábeis reais
2. **Sem Duplicidade:** Pagamento de fatura não aparece como despesa extra
3. **Patrimônio Real:** Cálculo correto de Ativos - Passivos
4. **Rastreabilidade:** Histórico completo de compras e pagamentos
5. **Escalável:** Fácil adicionar novos tipos de passivo (empréstimos, etc)

## 🔍 Fluxo de Dados Completo

```
Usuário faz compra de R$ 500 no cartão
↓
registerCreditCardPurchase()
↓
1. Cria transaction (type: 'expense', account_id: cartão)
2. Atualiza saldo do cartão: 0 → -500
↓
Usuário paga fatura de R$ 500
↓
payCreditCardInvoice()
↓
1. Cria transaction (type: 'transfer', from: conta, to: cartão)
2. Atualiza conta corrente: 1000 → 500
3. Atualiza cartão: -500 → 0
↓
Relatório mensal
↓
calculateNetWorth()
↓
Ativos: R$ 500 | Passivos: R$ 0 | Líquido: R$ 500
```

## 📝 Notas Importantes

- **Saldo Negativo:** No cartão de crédito, saldo negativo = dívida
- **Transferência ≠ Despesa:** Pagamento de fatura não é contabilizado como despesa adicional
- **Partidas Dobradas:** Toda transferência afeta exatamente 2 contas
- **Consistência:** Sempre use os serviços fornecidos, não crie lógica customizada

---

**Autor:** Sistema de Contabilidade Aurum  
**Data:** Dezembro 2025  
**Versão:** 1.0
