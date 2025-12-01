// ============================================
// SERVIÇO DE CONTABILIDADE - CARTÃO DE CRÉDITO
// ============================================
// Implementa lógica de partidas dobradas simplificada
// Cartão de crédito é tratado como conta de PASSIVO

import { supabase } from './supabase'

// ============================================
// 1. MODELO DE DADOS (Data Modeling)
// ============================================

/**
 * Tipos de conta seguindo princípios contábeis:
 * - ATIVO: Recursos que você TEM (Conta Corrente, Poupança, Carteira)
 * - PASSIVO: Obrigações que você DEVE (Cartão de Crédito)
 */
export type AccountCategory = 'ASSET' | 'LIABILITY'

export interface Account {
  id: string
  userId: string
  name: string
  type: 'checking' | 'savings' | 'wallet' | 'investment' | 'credit_card' | 'other'
  accountCategory: AccountCategory // Classificação contábil
  balance: number // Positivo para ATIVO, Negativo para PASSIVO (dívida)
  isActive: boolean
  createdAt: string
}

/**
 * Transação financeira individual
 * Cada transação afeta APENAS UMA conta
 */
export interface Transaction {
  id: string
  userId: string
  type: 'income' | 'expense'
  accountId: string // Conta afetada
  categoryId?: string
  amount: number // Sempre positivo
  description: string
  transactionDate: string
  notes?: string
  isConfirmed: boolean
  createdAt: string
}

/**
 * Transferência entre contas (partida dobrada)
 * Uma transferência cria DUAS transações vinculadas:
 * - Débito (saída) na conta origem
 * - Crédito (entrada) na conta destino
 */
export interface Transfer {
  id: string
  userId: string
  fromAccountId: string // Conta de origem (diminui)
  toAccountId: string // Conta de destino (aumenta)
  amount: number
  description: string
  transferDate: string
  createdAt: string
}

// ============================================
// 2. FUNÇÕES AUXILIARES
// ============================================

/**
 * Determina a categoria contábil de uma conta
 */
export function getAccountCategory(accountType: string): AccountCategory {
  if (accountType === 'credit_card') {
    return 'LIABILITY' // Passivo (dívida)
  }
  return 'ASSET' // Ativo (recurso)
}

/**
 * Calcula saldo líquido do usuário (Patrimônio Líquido)
 * Fórmula: Ativos - Passivos
 */
export async function calculateNetWorth(userId: string): Promise<{
  assets: number
  liabilities: number
  netWorth: number
}> {
  // Buscar todas as contas do usuário
  const { data: accounts, error } = await supabase
    .from('bank_accounts')
    .select('type, balance')
    .eq('user_id', userId)
    .eq('is_active', true)

  if (error) throw error

  let assets = 0
  let liabilities = 0

  accounts?.forEach(account => {
    const category = getAccountCategory(account.type)
    
    if (category === 'ASSET') {
      assets += Number(account.balance)
    } else {
      // Passivo: saldo negativo representa dívida
      // Convertemos para positivo para somar passivos
      liabilities += Math.abs(Number(account.balance))
    }
  })

  return {
    assets,
    liabilities,
    netWorth: assets - liabilities
  }
}

// ============================================
// 3. CENÁRIO A: COMPRA NO CRÉDITO
// ============================================

/**
 * Registra uma compra feita com cartão de crédito
 * 
 * LÓGICA CONTÁBIL:
 * - Cria uma DESPESA vinculada à conta do cartão
 * - Aumenta o PASSIVO (dívida) do cartão
 * - NÃO afeta contas de ATIVO (conta corrente)
 * - A despesa é contabilizada no fluxo de caixa
 * 
 * @param userId ID do usuário
 * @param creditCardId ID da conta do cartão de crédito
 * @param amount Valor da compra (positivo)
 * @param description Descrição da compra
 * @param categoryId Categoria da despesa
 * @param date Data da compra
 */
export async function registerCreditCardPurchase(params: {
  userId: string
  creditCardId: string
  amount: number
  description: string
  categoryId?: string
  date: string
  notes?: string
}): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  const { userId, creditCardId, amount, description, categoryId, date, notes } = params

  try {
    // Validações
    if (amount <= 0) {
      return { success: false, error: 'Valor deve ser maior que zero' }
    }

    // Verificar se a conta é realmente um cartão de crédito
    const { data: account, error: accountError } = await supabase
      .from('bank_accounts')
      .select('type, balance')
      .eq('id', creditCardId)
      .eq('user_id', userId)
      .single()

    if (accountError || !account) {
      return { success: false, error: 'Cartão de crédito não encontrado' }
    }

    // Criar transação de DESPESA
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'expense',
        account_id: creditCardId,
        category_id: categoryId || null,
        amount: amount,
        description: description,
        transaction_date: date,
        notes: notes || null,
        is_confirmed: true
      })
      .select()
      .single()

    if (transactionError) {
      return { success: false, error: transactionError.message }
    }

    // Atualizar saldo do cartão (aumenta PASSIVO = fica mais negativo)
    const newBalance = Number(account.balance) - amount
    
    const { error: updateError } = await supabase
      .from('bank_accounts')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', creditCardId)

    if (updateError) {
      // Rollback: deletar transação criada
      await supabase.from('transactions').delete().eq('id', transaction.id)
      return { success: false, error: updateError.message }
    }

    return { 
      success: true, 
      transactionId: transaction.id 
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao registrar compra' 
    }
  }
}

// ============================================
// 4. CENÁRIO B: PAGAMENTO DA FATURA
// ============================================

/**
 * Registra o pagamento da fatura do cartão de crédito
 * 
 * LÓGICA CONTÁBIL (Partida Dobrada):
 * - Cria uma TRANSFERÊNCIA (não é despesa!)
 * - Diminui ATIVO (conta corrente)
 * - Diminui PASSIVO (dívida do cartão)
 * - NÃO aparece como despesa no fluxo de caixa
 *   (as despesas reais já foram lançadas nas compras)
 * 
 * Exemplo:
 * - Fatura do cartão: R$ -1.000,00 (dívida)
 * - Saldo da conta: R$ 5.000,00
 * 
 * Após pagamento:
 * - Conta corrente: R$ 4.000,00 (-1.000)
 * - Cartão: R$ 0,00 (+1.000, dívida zerada)
 * - Patrimônio líquido: continua R$ 4.000,00 (sem mudança)
 * 
 * @param userId ID do usuário
 * @param checkingAccountId ID da conta corrente (origem)
 * @param creditCardId ID do cartão de crédito (destino)
 * @param amount Valor do pagamento (positivo)
 * @param date Data do pagamento
 */
export async function payCreditCardInvoice(params: {
  userId: string
  checkingAccountId: string
  creditCardId: string
  amount: number
  date: string
  description?: string
}): Promise<{ success: boolean; transferId?: string; error?: string }> {
  const { userId, checkingAccountId, creditCardId, amount, date, description } = params

  try {
    // Validações
    if (amount <= 0) {
      return { success: false, error: 'Valor deve ser maior que zero' }
    }

    // Buscar ambas as contas
    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('id, type, balance')
      .eq('user_id', userId)
      .in('id', [checkingAccountId, creditCardId])

    if (accountsError || !accounts || accounts.length !== 2) {
      return { success: false, error: 'Contas não encontradas' }
    }

    const checkingAccount = accounts.find(a => a.id === checkingAccountId)
    const creditCard = accounts.find(a => a.id === creditCardId)

    if (!checkingAccount || !creditCard) {
      return { success: false, error: 'Contas inválidas' }
    }

    // Verificar saldo disponível na conta corrente
    if (Number(checkingAccount.balance) < amount) {
      return { success: false, error: 'Saldo insuficiente na conta corrente' }
    }

    // Criar TRANSFERÊNCIA (tipo 'transfer' com from/to)
    const { data: transfer, error: transferError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'transfer',
        from_account_id: checkingAccountId,
        to_account_id: creditCardId,
        amount: amount,
        description: description || `Pagamento de fatura - ${creditCard.type}`,
        transaction_date: date,
        notes: 'Pagamento de fatura do cartão de crédito',
        is_confirmed: true
      })
      .select()
      .single()

    if (transferError) {
      return { success: false, error: transferError.message }
    }

    // Atualizar saldo da conta corrente (diminui ATIVO)
    const newCheckingBalance = Number(checkingAccount.balance) - amount
    
    // Atualizar saldo do cartão (diminui PASSIVO = fica menos negativo)
    const newCreditCardBalance = Number(creditCard.balance) + amount

    // Executar ambas as atualizações
    const { error: updateError1 } = await supabase
      .from('bank_accounts')
      .update({ 
        balance: newCheckingBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', checkingAccountId)

    const { error: updateError2 } = await supabase
      .from('bank_accounts')
      .update({ 
        balance: newCreditCardBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', creditCardId)

    if (updateError1 || updateError2) {
      // Rollback: deletar transferência
      await supabase.from('transactions').delete().eq('id', transfer.id)
      return { 
        success: false, 
        error: updateError1?.message || updateError2?.message 
      }
    }

    return { 
      success: true, 
      transferId: transfer.id 
    }

  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro ao processar pagamento' 
    }
  }
}

// ============================================
// 5. EXEMPLO DE USO
// ============================================

/**
 * Exemplo de fluxo completo:
 * 
 * 1. Usuário faz compra de R$ 500 no cartão
 * await registerCreditCardPurchase({
 *   userId: 'user-123',
 *   creditCardId: 'card-456',
 *   amount: 500,
 *   description: 'Compra no supermercado',
 *   categoryId: 'cat-alimentacao',
 *   date: '2025-12-01'
 * })
 * 
 * Resultado:
 * - Conta Corrente: R$ 1.000,00 (sem mudança)
 * - Cartão de Crédito: R$ -500,00 (aumentou passivo)
 * - Patrimônio Líquido: R$ 500,00 (1000 - 500)
 * 
 * 2. Usuário paga a fatura
 * await payCreditCardInvoice({
 *   userId: 'user-123',
 *   checkingAccountId: 'acc-789',
 *   creditCardId: 'card-456',
 *   amount: 500,
 *   date: '2025-12-10'
 * })
 * 
 * Resultado:
 * - Conta Corrente: R$ 500,00 (diminuiu R$ 500)
 * - Cartão de Crédito: R$ 0,00 (zerou dívida)
 * - Patrimônio Líquido: R$ 500,00 (sem mudança, pois só transferiu)
 * 
 * 3. Calcular situação patrimonial
 * const netWorth = await calculateNetWorth('user-123')
 * // { assets: 500, liabilities: 0, netWorth: 500 }
 */
