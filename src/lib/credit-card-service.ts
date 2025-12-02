// ============================================
// SERVIÇO DE CARTÃO DE CRÉDITO COM FATURAS
// ============================================

import { supabase } from './supabase'

// ============================================
// TIPOS
// ============================================

export interface CreditCardInvoice {
  id: string
  userId: string
  cardId: string
  referenceMonth: string // YYYY-MM
  dueDate: string
  closingDate: string
  totalAmount: number
  paidAmount: number
  remainingAmount: number
  status: 'open' | 'closed' | 'paid' | 'overdue'
  createdAt: string
  updatedAt: string
}

export interface CreditCardPurchase {
  id: string
  userId: string
  cardId: string
  invoiceId?: string
  categoryId?: string
  description: string
  purchaseDate: string
  amount: number
  isInstallment: boolean
  installments: number
  currentInstallment: number
  installmentAmount?: number
  parentPurchaseId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface CreditCardPayment {
  id: string
  userId: string
  invoiceId: string
  accountId: string
  paymentDate: string
  amount: number
  description?: string
  createdAt: string
  updatedAt: string
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

/**
 * Calcula a fatura de referência baseado na data da compra e dia de fechamento
 */
export function calculateInvoiceMonth(purchaseDate: Date, closingDay: number): string {
  const day = purchaseDate.getDate()
  let month = purchaseDate.getMonth()
  let year = purchaseDate.getFullYear()
  
  // Se a compra foi após o fechamento, vai para a fatura do mês seguinte
  if (day > closingDay) {
    month++
    if (month > 11) {
      month = 0
      year++
    }
  }
  
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

/**
 * Calcula as datas de fechamento e vencimento para um mês de referência
 */
export function calculateInvoiceDates(referenceMonth: string, closingDay: number, dueDay: number): {
  closingDate: string
  dueDate: string
} {
  const [year, month] = referenceMonth.split('-').map(Number)
  
  // Data de fechamento é no mês anterior
  const closingMonth = month - 1
  const closingYear = closingMonth < 1 ? year - 1 : year
  const finalClosingMonth = closingMonth < 1 ? 12 : closingMonth
  
  const closingDate = new Date(closingYear, finalClosingMonth - 1, closingDay)
  const dueDate = new Date(year, month - 1, dueDay)
  
  return {
    closingDate: closingDate.toISOString().split('T')[0],
    dueDate: dueDate.toISOString().split('T')[0]
  }
}

/**
 * Busca ou cria a fatura do mês
 */
async function getOrCreateInvoice(params: {
  userId: string
  cardId: string
  referenceMonth: string
  closingDay: number
  dueDay: number
}): Promise<{ invoice: any; error?: string }> {
  const { userId, cardId, referenceMonth, closingDay, dueDay } = params
  
  // Tentar buscar fatura existente
  const { data: existing, error: fetchError } = await supabase
    .from('credit_card_invoices' as any)
    .select('*')
    .eq('user_id', userId)
    .eq('card_id', cardId)
    .eq('reference_month', referenceMonth)
    .single()
  
  if (existing) {
    return { invoice: existing }
  }
  
  // Criar nova fatura
  const dates = calculateInvoiceDates(referenceMonth, closingDay, dueDay)
  
  const { data: newInvoice, error: createError } = await supabase
    .from('credit_card_invoices' as any)
    .insert({
      user_id: userId,
      card_id: cardId,
      reference_month: referenceMonth,
      closing_date: dates.closingDate,
      due_date: dates.dueDate,
      total_amount: 0,
      paid_amount: 0,
      remaining_amount: 0,
      status: 'open'
    } as any)
    .select()
    .single()
  
  if (createError) {
    return { invoice: null, error: createError.message }
  }
  
  return { invoice: newInvoice }
}

// ============================================
// OPERAÇÕES PRINCIPAIS
// ============================================

/**
 * Registra uma compra no cartão de crédito
 */
export async function registerCreditCardPurchase(params: {
  userId: string
  cardId: string
  amount: number
  description: string
  categoryId?: string
  purchaseDate: string
  installments?: number
  notes?: string
}): Promise<{ success: boolean; purchaseId?: string; error?: string }> {
  const { userId, cardId, amount, description, categoryId, purchaseDate, installments = 1, notes } = params
  
  try {
    // Validações
    if (amount <= 0) {
      return { success: false, error: 'Valor deve ser maior que zero' }
    }
    
    if (installments < 1) {
      return { success: false, error: 'Número de parcelas inválido' }
    }
    
    // Buscar informações do cartão
    const { data: card, error: cardError } = await supabase
      .from('cards' as any)
      .select('*, closing_day, due_day, credit_limit, current_balance')
      .eq('id', cardId)
      .eq('user_id', userId)
      .single()
    
    if (cardError || !card) {
      return { success: false, error: 'Cartão não encontrado' }
    }
    
    // Verificar limite
    const newBalance = (card.current_balance || 0) + amount
    if (card.credit_limit && newBalance > card.credit_limit) {
      return { success: false, error: 'Limite do cartão excedido' }
    }
    
    const closingDay = card.closing_day || 5
    const dueDay = card.due_day || 10
    const purchaseDateObj = new Date(purchaseDate)
    
    // Se for parcelado, criar múltiplas compras
    if (installments > 1) {
      const installmentAmount = amount / installments
      const purchases = []
      
      for (let i = 0; i < installments; i++) {
        const installmentDate = new Date(purchaseDateObj)
        installmentDate.setMonth(installmentDate.getMonth() + i)
        
        const refMonth = calculateInvoiceMonth(installmentDate, closingDay)
        const { invoice, error: invoiceError } = await getOrCreateInvoice({
          userId,
          cardId,
          referenceMonth: refMonth,
          closingDay,
          dueDay
        })
        
        if (invoiceError) {
          return { success: false, error: invoiceError }
        }
        
        purchases.push({
          user_id: userId,
          card_id: cardId,
          invoice_id: invoice.id,
          category_id: categoryId || null,
          description: `${description} (${i + 1}/${installments})`,
          purchase_date: installmentDate.toISOString().split('T')[0],
          amount: installmentAmount,
          is_installment: true,
          installments: installments,
          current_installment: i + 1,
          installment_amount: installmentAmount,
          parent_purchase_id: i === 0 ? null : undefined, // Será atualizado depois
          notes: notes || null
        })
      }
      
      // Inserir primeira parcela
      const { data: firstPurchase, error: firstError } = await supabase
        .from('credit_card_purchases' as any)
        .insert(purchases[0] as any)
        .select()
        .single()
      
      if (firstError) {
        return { success: false, error: firstError.message }
      }
      
      // Inserir demais parcelas referenciando a primeira
      const remainingPurchases = purchases.slice(1).map(p => ({
        ...p,
        parent_purchase_id: firstPurchase.id
      }))
      
      const { error: remainingError } = await supabase
        .from('credit_card_purchases' as any)
        .insert(remainingPurchases as any)
      
      if (remainingError) {
        // Rollback: deletar primeira parcela
        await supabase
          .from('credit_card_purchases' as any)
          .delete()
          .eq('id', firstPurchase.id)
        return { success: false, error: remainingError.message }
      }
      
      // Atualizar saldo do cartão
      await supabase
        .from('cards' as any)
        .update({ 
          current_balance: newBalance,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', cardId)
      
      // Atualizar total das faturas afetadas
      for (const purchase of purchases) {
        const refMonth = calculateInvoiceMonth(new Date(purchase.purchase_date), closingDay)
        await updateInvoiceTotal(userId, cardId, refMonth)
      }
      
      return { success: true, purchaseId: firstPurchase.id }
      
    } else {
      // Compra única (à vista)
      const refMonth = calculateInvoiceMonth(purchaseDateObj, closingDay)
      const { invoice, error: invoiceError } = await getOrCreateInvoice({
        userId,
        cardId,
        referenceMonth: refMonth,
        closingDay,
        dueDay
      })
      
      if (invoiceError) {
        return { success: false, error: invoiceError }
      }
      
      const { data: purchase, error: purchaseError } = await supabase
        .from('credit_card_purchases' as any)
        .insert({
          user_id: userId,
          card_id: cardId,
          invoice_id: invoice.id,
          category_id: categoryId || null,
          description: description,
          purchase_date: purchaseDate,
          amount: amount,
          is_installment: false,
          installments: 1,
          current_installment: 1,
          notes: notes || null
        } as any)
        .select()
        .single()
      
      if (purchaseError) {
        return { success: false, error: purchaseError.message }
      }
      
      // Atualizar saldo do cartão
      await supabase
        .from('cards' as any)
        .update({ 
          current_balance: newBalance,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', cardId)
      
      // Atualizar total da fatura
      await updateInvoiceTotal(userId, cardId, refMonth)
      
      return { success: true, purchaseId: purchase.id }
    }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao registrar compra'
    }
  }
}

/**
 * Atualiza o total da fatura somando todas as compras
 */
async function updateInvoiceTotal(userId: string, cardId: string, referenceMonth: string) {
  // Buscar fatura
  const { data: invoice } = await supabase
    .from('credit_card_invoices' as any)
    .select('id')
    .eq('user_id', userId)
    .eq('card_id', cardId)
    .eq('reference_month', referenceMonth)
    .single()
  
  if (!invoice) return
  
  // Somar todas as compras
  const { data: purchases } = await supabase
    .from('credit_card_purchases' as any)
    .select('amount')
    .eq('invoice_id', invoice.id)
  
  const total = purchases?.reduce((sum, p) => sum + Number(p.amount), 0) || 0
  
  // Atualizar fatura
  await supabase
    .from('credit_card_invoices' as any)
    .update({ total_amount: total } as any)
    .eq('id', invoice.id)
}

/**
 * Paga uma fatura do cartão
 */
export async function payCreditCardInvoice(params: {
  userId: string
  invoiceId: string
  accountId: string
  amount: number
  paymentDate: string
  description?: string
}): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  const { userId, invoiceId, accountId, amount, paymentDate, description } = params
  
  try {
    // Validações
    if (amount <= 0) {
      return { success: false, error: 'Valor deve ser maior que zero' }
    }
    
    // Buscar fatura
    const { data: invoice, error: invoiceError } = await supabase
      .from('credit_card_invoices' as any)
      .select('*, cards!inner(id, current_balance)')
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .single()
    
    if (invoiceError || !invoice) {
      return { success: false, error: 'Fatura não encontrada' }
    }
    
    // Buscar conta
    const { data: account, error: accountError } = await supabase
      .from('bank_accounts')
      .select('balance')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single()
    
    if (accountError || !account) {
      return { success: false, error: 'Conta não encontrada' }
    }
    
    // Verificar saldo
    if (Number(account.balance) < amount) {
      return { success: false, error: 'Saldo insuficiente' }
    }
    
    // Criar pagamento
    const { data: payment, error: paymentError } = await supabase
      .from('credit_card_payments' as any)
      .insert({
        user_id: userId,
        invoice_id: invoiceId,
        account_id: accountId,
        payment_date: paymentDate,
        amount: amount,
        description: description || 'Pagamento de fatura'
      } as any)
      .select()
      .single()
    
    if (paymentError) {
      return { success: false, error: paymentError.message }
    }
    
    // Atualizar fatura
    const newPaidAmount = Number(invoice.paid_amount) + amount
    await supabase
      .from('credit_card_invoices' as any)
      .update({ 
        paid_amount: newPaidAmount,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', invoiceId)
    
    // Debitar da conta
    const newAccountBalance = Number(account.balance) - amount
    await supabase
      .from('bank_accounts')
      .update({ 
        balance: newAccountBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', accountId)
    
    // Atualizar saldo do cartão
    const card = (invoice as any).cards
    const newCardBalance = Math.max(0, Number(card.current_balance) - amount)
    await supabase
      .from('cards' as any)
      .update({ 
        current_balance: newCardBalance,
        updated_at: new Date().toISOString()
      } as any)
      .eq('id', card.id)
    
    return { success: true, paymentId: payment.id }
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao processar pagamento'
    }
  }
}

/**
 * Lista faturas de um cartão
 */
export async function listCreditCardInvoices(params: {
  userId: string
  cardId?: string
  status?: string
}): Promise<CreditCardInvoice[]> {
  let query = supabase
    .from('credit_card_invoices' as any)
    .select('*')
    .eq('user_id', params.userId)
    .order('reference_month', { ascending: false })
  
  if (params.cardId) {
    query = query.eq('card_id', params.cardId)
  }
  
  if (params.status) {
    query = query.eq('status', params.status)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  
  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    referenceMonth: row.reference_month,
    dueDate: row.due_date,
    closingDate: row.closing_date,
    totalAmount: Number(row.total_amount),
    paidAmount: Number(row.paid_amount),
    remainingAmount: Number(row.remaining_amount),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}

/**
 * Lista compras de uma fatura
 */
export async function listInvoicePurchases(invoiceId: string): Promise<CreditCardPurchase[]> {
  const { data, error } = await supabase
    .from('credit_card_purchases' as any)
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('purchase_date', { ascending: false })
  
  if (error) throw error
  
  return (data || []).map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    cardId: row.card_id,
    invoiceId: row.invoice_id,
    categoryId: row.category_id,
    description: row.description,
    purchaseDate: row.purchase_date,
    amount: Number(row.amount),
    isInstallment: row.is_installment,
    installments: row.installments,
    currentInstallment: row.current_installment,
    installmentAmount: row.installment_amount ? Number(row.installment_amount) : undefined,
    parentPurchaseId: row.parent_purchase_id,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }))
}
