# Sistema de Cartão de Crédito - Guia de Implementação

## O que foi criado:

### 1. Migration SQL (`20241202000005_create_credit_card_system.sql`)
- ✅ Tabela `credit_card_invoices` - Faturas do cartão
- ✅ Tabela `credit_card_purchases` - Compras no cartão
- ✅ Tabela `credit_card_payments` - Pagamentos de fatura
- ✅ Adicionado campos no `cards`: `due_day`, `closing_day`, `current_balance`
- ✅ Triggers automáticos para atualizar status e valores

### 2. Serviço TypeScript (`credit-card-service.ts`)
- ✅ `registerCreditCardPurchase()` - Registra compra (à vista ou parcelada)
- ✅ `payCreditCardInvoice()` - Paga fatura
- ✅ `listCreditCardInvoices()` - Lista faturas
- ✅ `listInvoicePurchases()` - Lista compras de uma fatura

## Como funciona agora:

### Compra no Cartão de Crédito:
1. **NÃO debita da conta corrente** ✅
2. Cria registro em `credit_card_purchases`
3. Associa à fatura do mês correto (baseado no dia de fechamento)
4. Se for parcelado, cria múltiplas compras (uma por mês)
5. Atualiza `current_balance` do cartão

### Pagamento de Fatura:
1. Cria registro em `credit_card_payments`
2. **Debita da conta bancária** escolhida
3. Atualiza `paid_amount` da fatura
4. Diminui `current_balance` do cartão

## Próximos passos necessários:

### 1. Executar Migration no Supabase
```sql
-- Execute o arquivo: 20241202000005_create_credit_card_system.sql
-- no SQL Editor do Supabase
```

### 2. Atualizar TransactionModal para perguntar:
- "É compra no cartão de crédito?"
- Se SIM:
  - Mostrar seletor de cartão
  - Perguntar número de parcelas
  - **NÃO mostrar seletor de conta bancária**
  - Chamar `registerCreditCardPurchase()`
- Se NÃO:
  - Fluxo normal (debita/credita conta)

### 3. Criar tela de Faturas:
- `/cards/[id]/invoices` - Lista faturas do cartão
- Mostrar fatura atual (aberta)
- Compras da fatura
- Botão "Pagar Fatura" que:
  - Seleciona conta bancária
  - Chama `payCreditCardInvoice()`

### 4. Atualizar Card Detail para mostrar:
- Fatura atual
- Limite disponível
- Próximo vencimento

## Exemplo de Uso:

```typescript
// Compra à vista
await registerCreditCardPurchase({
  userId: user.id,
  cardId: 'card-123',
  amount: 500,
  description: 'Supermercado',
  categoryId: 'cat-alimentacao',
  purchaseDate: '2024-12-02',
  installments: 1
})

// Compra parcelada (12x)
await registerCreditCardPurchase({
  userId: user.id,
  cardId: 'card-123',
  amount: 1200,
  description: 'Notebook',
  categoryId: 'cat-eletronicos',
  purchaseDate: '2024-12-02',
  installments: 12 // Cria 12 compras de R$ 100 cada
})

// Pagar fatura
await payCreditCardInvoice({
  userId: user.id,
  invoiceId: 'invoice-456',
  accountId: 'account-789',
  amount: 500,
  paymentDate: '2024-12-10'
})
```

## Diferenças do sistema antigo:

| Antes | Agora |
|-------|-------|
| Compra debitava conta | Compra vai para fatura |
| Sem controle de parcelas futuras | Parcelas criadas automaticamente |
| Sem data de vencimento | Vencimento por cartão |
| Sem separação de faturas | Fatura por mês |
| Pagamento era "transferência" | Pagamento específico de fatura |
