# 🎯 ROTEIRO: Sistema de Cartão de Crédito Correto

## ✅ O QUE FOI FEITO:

### 1. Estrutura do Banco de Dados
Criadas 3 novas tabelas:
- `credit_card_invoices` - Faturas mensais do cartão
- `credit_card_purchases` - Compras realizadas no cartão
- `credit_card_payments` - Pagamentos das faturas

### 2. Serviço TypeScript
Arquivo: `src/lib/credit-card-service.ts`
- Registrar compras (à vista ou parceladas)
- Pagar faturas
- Listar faturas e compras

---

## 📋 PASSO A PASSO - EXECUTE AGORA:

### PASSO 1: Executar Migration no Supabase

1. Abra o Supabase SQL Editor:
   https://supabase.com/dashboard/project/difntzsqjzhswyubprsc/sql/new

2. Copie e cole o conteúdo do arquivo:
   `supabase/migrations/20241202000005_create_credit_card_system.sql`

3. Execute o SQL (botão RUN ou Ctrl+Enter)

4. Verifique se as tabelas foram criadas:
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%credit_card%';
```

Deve retornar:
- credit_card_invoices
- credit_card_purchases
- credit_card_payments

---

## 🔧 O QUE MUDA NA PRÁTICA:

### ANTES (Errado):
```
Compra R$ 1.000 no cartão
  ↓
Debita R$ 1.000 da conta corrente ❌
  ↓
Saldo conta: -R$ 1.000
```

### AGORA (Correto):
```
Compra R$ 1.000 no cartão
  ↓
Cria registro na FATURA do mês ✅
  ↓
Conta corrente NÃO é afetada
  ↓
Fatura fica com R$ 1.000 para pagar no vencimento
```

### Pagamento da Fatura:
```
Chegou o vencimento
  ↓
Usuário escolhe pagar da Conta Corrente
  ↓
AÍ SIM debita R$ 1.000 da conta ✅
  ↓
Fatura fica paga
```

---

## 📝 PRÓXIMAS TAREFAS (Para o Copilot implementar):

### Tarefa 1: Atualizar Modal de Transação
**Arquivo**: `src/components/modals/transaction-modal.tsx`

Adicionar:
- [ ] Checkbox: "É compra no cartão de crédito?"
- [ ] Se marcado:
  - Mostrar: Seletor de Cartão
  - Mostrar: Input "Número de parcelas" (padrão: 1)
  - **OCULTAR**: Seletor de conta bancária
  - **USAR**: `registerCreditCardPurchase()` em vez de `addTransaction()`

### Tarefa 2: Criar Página de Faturas
**Novo arquivo**: `src/app/cards/[id]/invoices/page.tsx`

Mostrar:
- [ ] Lista de faturas do cartão (abertas e pagas)
- [ ] Fatura atual destacada
- [ ] Compras de cada fatura
- [ ] Botão "Pagar Fatura"

### Tarefa 3: Atualizar Detalhe do Cartão
**Arquivo**: `src/components/cards/card-detail.tsx` (ou similar)

Adicionar:
- [ ] Fatura atual aberta
- [ ] Limite disponível (limite - current_balance)
- [ ] Próxima data de vencimento
- [ ] Botão "Ver Faturas"

### Tarefa 4: Criar Hook Personalizado
**Novo arquivo**: `src/hooks/use-credit-card.ts`

```typescript
export function useCreditCard(cardId: string) {
  const [invoices, setInvoices] = useState([])
  const [currentInvoice, setCurrentInvoice] = useState(null)
  const [purchases, setPurchases] = useState([])
  
  // Funções para gerenciar cartão, faturas e compras
  return {
    invoices,
    currentInvoice,
    purchases,
    registerPurchase,
    payInvoice,
    refreshInvoices
  }
}
```

---

## 🎓 RESPOSTA PARA SUAS PERGUNTAS:

### "Quando comprar algo no cartão não deve debitar da conta diretamente"
✅ **RESOLVIDO**: Agora cria registro em `credit_card_purchases` vinculado à fatura

### "Quando comprar parcelado deve entrar o valor para faturar futuras"
✅ **RESOLVIDO**: Se `installments > 1`, cria múltiplas compras (uma por mês)

### "Controle de faturas e data de vencimento da fatura"
✅ **RESOLVIDO**: Tabela `credit_card_invoices` com `due_date`, `closing_date`, `reference_month`

### "Na transação quando for cartão de crédito devo adicionar a conta?"
❌ **NÃO**: Quando é compra no cartão, NÃO adiciona conta. A conta só é usada quando for PAGAR a fatura.

---

## 🚀 PRÓXIMO COMANDO:

Depois de executar a migration no Supabase:

```bash
git push origin main
```

E peça ao Copilot:
"Implemente as Tarefas 1, 2, 3 e 4 do ROTEIRO. Comece atualizando o TransactionModal para suportar compras no cartão de crédito."
