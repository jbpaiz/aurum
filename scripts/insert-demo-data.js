require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const { randomUUID } = require('crypto')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function insertDemoData() {
  console.log('🚀 Inserindo dados de demonstração...')
  
  t    const { data: transactionsResult, error: transactionsError } = await supabase
      .from('transactions')
      .upsert(transactions)

    if (transactionsError) {
      console.log('❌ Erro ao inserir transações:', transactionsError.message)
    } else {
      console.log('✅ Transações inseridas com sucesso!')
    }

    console.log('\n🎉 Dados de demonstração inseridos com sucesso!')
    console.log('📊 Resumo dos dados inseridos:')
    console.log(`   • ${bankAccounts.length} contas bancárias`)
    console.log(`   • ${cards.length} cartões`)
    console.log(`   • ${categories.length} categorias`)
    console.log(`   • ${paymentMethods.length} métodos de pagamento`)
    console.log(`   • ${transactions.length} transações`)

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

insertDemoData()    // Primeiro, vamos criar um usuário de teste (simular)
    // Para fins de demonstração, vamos usar um UUID fixo
    const testUserId = '550e8400-e29b-41d4-a716-446655440000'
    
    console.log('🏦 Inserindo contas bancárias...')
    
    // Gerar UUIDs para as contas
    const accountIds = {
      carteira: randomUUID(),
      cofrinho: randomUUID(),
      nubank: randomUUID(),
      bb: randomUUID(),
      caixa: randomUUID(),
      itau: randomUUID(),
      inter: randomUUID()
    }
    
    // 1. Inserir contas bancárias
    const bankAccounts = [
      {
        id: accountIds.carteira,
        user_id: testUserId,
        name: 'Carteira',
        type: 'wallet',
        icon: '💰',
        color: '#10B981',
        balance: 120.00,
        is_active: true
      },
      {
        id: accountIds.cofrinho, 
        user_id: testUserId,
        name: 'Cofrinho',
        type: 'wallet',
        icon: '🐷',
        color: '#F59E0B',
        balance: 450.00,
        is_active: true
      },
      {
        id: accountIds.nubank,
        user_id: testUserId,
        name: 'Nubank',
        type: 'checking',
        bank: 'nubank',
        icon: '💜',
        color: '#8A05BE',
        balance: 2500.00,
        is_active: true
      },
      {
        id: accountIds.bb,
        user_id: testUserId,
        name: 'BB Poupança',
        type: 'savings',
        bank: 'bb',
        icon: '🟡',
        color: '#FFED00',
        balance: 8750.00,
        is_active: true
      },
      {
        id: accountIds.caixa,
        user_id: testUserId,
        name: 'Caixa Poupança',
        type: 'savings',
        bank: 'caixa',
        icon: '🔵',
        color: '#0072CE',
        balance: 15200.00,
        is_active: true
      },
      {
        id: accountIds.itau,
        user_id: testUserId,
        name: 'Itaú Conta Corrente',
        type: 'checking',
        bank: 'itau',
        icon: '🔶',
        color: '#EC7000',
        balance: 3200.00,
        is_active: true
      },
      {
        id: accountIds.inter,
        user_id: testUserId,
        name: 'Inter Investimentos',
        type: 'investment',
        bank: 'inter',
        icon: '📈',
        color: '#FF7A00',
        balance: 12500.00,
        is_active: true
      }
    ]

    const { data: bankAccountsResult, error: bankAccountsError } = await supabase
      .from('bank_accounts')
      .upsert(bankAccounts)

    if (bankAccountsError) {
      console.log('❌ Erro ao inserir contas:', bankAccountsError.message)
    } else {
      console.log('✅ Contas bancárias inseridas com sucesso!')
    }

    console.log('💳 Inserindo cartões...')

    // Gerar UUIDs para os cartões
    const cardIds = {
      nubank: randomUUID(),
      itau: randomUUID(),
      bb: randomUUID(),
      inter: randomUUID()
    }

    // 2. Inserir cartões
    const cards = [
      {
        id: cardIds.nubank,
        user_id: testUserId,
        nickname: 'Nubank Roxinho',
        type: 'credit',
        provider: 'mastercard',
        last_digits: '1234',
        expiry_month: 12,
        expiry_year: 2027,
        color: '#8A05BE',
        icon: '💳',
        is_active: true
      },
      {
        id: cardIds.itau,
        user_id: testUserId,
        nickname: 'Itaú Visa',
        type: 'credit',
        provider: 'visa',
        last_digits: '5678',
        expiry_month: 8,
        expiry_year: 2026,
        color: '#EC7000',
        icon: '💳',
        is_active: true
      },
      {
        id: cardIds.bb,
        user_id: testUserId,
        nickname: 'BB Débito',
        type: 'debit',
        provider: 'visa',
        last_digits: '9012',
        expiry_month: 5,
        expiry_year: 2028,
        color: '#FFED00',
        icon: '🏧',
        is_active: true
      },
      {
        id: cardIds.inter,
        user_id: testUserId,
        nickname: 'Inter Gold',
        type: 'credit',
        provider: 'mastercard',
        last_digits: '3456',
        expiry_month: 10,
        expiry_year: 2029,
        color: '#FF7A00',
        icon: '💳',
        is_active: true
      }
    ]

    const { data: cardsResult, error: cardsError } = await supabase
      .from('cards')
      .upsert(cards)

    if (cardsError) {
      console.log('❌ Erro ao inserir cartões:', cardsError.message)
    } else {
      console.log('✅ Cartões inseridos com sucesso!')
    }

    console.log('📁 Inserindo categorias...')

    // Gerar UUIDs para as categorias
    const categoryIds = {
      salario: randomUUID(),
      freelance: randomUUID(),
      investimentos: randomUUID(),
      outros_receita: randomUUID(),
      alimentacao: randomUUID(),
      transporte: randomUUID(),
      moradia: randomUUID(),
      saude: randomUUID(),
      educacao: randomUUID(),
      lazer: randomUUID(),
      compras: randomUUID(),
      contas: randomUUID()
    }

    // 3. Inserir categorias
    const categories = [
      // Receitas
      { id: categoryIds.salario, user_id: testUserId, name: 'Salário', type: 'income', icon: '💰', color: '#10B981', is_active: true },
      { id: categoryIds.freelance, user_id: testUserId, name: 'Freelance', type: 'income', icon: '💼', color: '#059669', is_active: true },
      { id: categoryIds.investimentos, user_id: testUserId, name: 'Investimentos', type: 'income', icon: '📈', color: '#0D9488', is_active: true },
      { id: categoryIds.outros_receita, user_id: testUserId, name: 'Outros', type: 'income', icon: '💵', color: '#06B6D4', is_active: true },
      
      // Despesas
      { id: categoryIds.alimentacao, user_id: testUserId, name: 'Alimentação', type: 'expense', icon: '🍽️', color: '#EF4444', is_active: true },
      { id: categoryIds.transporte, user_id: testUserId, name: 'Transporte', type: 'expense', icon: '🚗', color: '#F97316', is_active: true },
      { id: categoryIds.moradia, user_id: testUserId, name: 'Moradia', type: 'expense', icon: '🏠', color: '#F59E0B', is_active: true },
      { id: categoryIds.saude, user_id: testUserId, name: 'Saúde', type: 'expense', icon: '🏥', color: '#84CC16', is_active: true },
      { id: categoryIds.educacao, user_id: testUserId, name: 'Educação', type: 'expense', icon: '📚', color: '#06B6D4', is_active: true },
      { id: categoryIds.lazer, user_id: testUserId, name: 'Lazer', type: 'expense', icon: '🎯', color: '#8B5CF6', is_active: true },
      { id: categoryIds.compras, user_id: testUserId, name: 'Compras', type: 'expense', icon: '🛍️', color: '#EC4899', is_active: true },
      { id: categoryIds.contas, user_id: testUserId, name: 'Contas', type: 'expense', icon: '📄', color: '#6B7280', is_active: true }
    ]

    const { data: categoriesResult, error: categoriesError } = await supabase
      .from('categories')
      .upsert(categories)

    if (categoriesError) {
      console.log('❌ Erro ao inserir categorias:', categoriesError.message)
    } else {
      console.log('✅ Categorias inseridas com sucesso!')
    }

    console.log('💰 Inserindo métodos de pagamento...')

    // Gerar UUIDs para métodos de pagamento
    const paymentMethodIds = {
      dinheiro: randomUUID(),
      pix_nubank: randomUUID(),
      pix_itau: randomUUID(),
      transferencia_bb: randomUUID(),
      cartao_nubank: randomUUID(),
      cartao_itau: randomUUID(),
      debito_bb: randomUUID(),
      cartao_inter: randomUUID()
    }

    // 4. Inserir métodos de pagamento
    const paymentMethods = [
      {
        id: paymentMethodIds.dinheiro,
        user_id: testUserId,
        name: 'Dinheiro - Carteira',
        type: 'cash',
        account_id: accountIds.carteira,
        icon: '💵',
        color: '#10B981',
        is_active: true
      },
      {
        id: paymentMethodIds.pix_nubank,
        user_id: testUserId,
        name: 'PIX - Nubank',
        type: 'pix',
        account_id: accountIds.nubank,
        icon: '📱',
        color: '#8A05BE',
        is_active: true
      },
      {
        id: paymentMethodIds.pix_itau,
        user_id: testUserId,
        name: 'PIX - Itaú',
        type: 'pix',
        account_id: accountIds.itau,
        icon: '📱',
        color: '#EC7000',
        is_active: true
      },
      {
        id: paymentMethodIds.transferencia_bb,
        user_id: testUserId,
        name: 'Transferência BB',
        type: 'bank_transfer',
        account_id: accountIds.bb,
        icon: '🔄',
        color: '#FFED00',
        is_active: true
      },
      {
        id: paymentMethodIds.cartao_nubank,
        user_id: testUserId,
        name: 'Nubank Roxinho',
        type: 'credit_card',
        account_id: accountIds.nubank,
        card_id: cardIds.nubank,
        icon: '💳',
        color: '#8A05BE',
        is_active: true
      },
      {
        id: paymentMethodIds.cartao_itau,
        user_id: testUserId,
        name: 'Itaú Visa',
        type: 'credit_card',
        account_id: accountIds.itau,
        card_id: cardIds.itau,
        icon: '💳',
        color: '#EC7000',
        is_active: true
      },
      {
        id: paymentMethodIds.debito_bb,
        user_id: testUserId,
        name: 'BB Débito',
        type: 'debit_card',
        account_id: accountIds.bb,
        card_id: cardIds.bb,
        icon: '🏧',
        color: '#FFED00',
        is_active: true
      },
      {
        id: paymentMethodIds.cartao_inter,
        user_id: testUserId,
        name: 'Inter Gold',
        type: 'credit_card',
        account_id: accountIds.inter,
        card_id: cardIds.inter,
        icon: '💳',
        color: '#FF7A00',
        is_active: true
      }
    ]

    const { data: paymentMethodsResult, error: paymentMethodsError } = await supabase
      .from('payment_methods')
      .upsert(paymentMethods)

    if (paymentMethodsError) {
      console.log('❌ Erro ao inserir métodos de pagamento:', paymentMethodsError.message)
    } else {
      console.log('✅ Métodos de pagamento inseridos com sucesso!')
    }

    console.log('💸 Inserindo transações de exemplo...')

    // 5. Inserir algumas transações de exemplo
    const transactions = [
      {
        id: randomUUID(),
        user_id: testUserId,
        description: 'Salário Janeiro',
        amount: 5000.00,
        type: 'income',
        category_id: categoryIds.salario,
        payment_method_id: paymentMethodIds.pix_nubank,
        account_id: accountIds.nubank,
        date: '2025-01-05',
        notes: 'Salário mensal',
        is_recurring: true
      },
      {
        id: randomUUID(),
        user_id: testUserId,
        description: 'Supermercado',
        amount: 280.50,
        type: 'expense',
        category_id: categoryIds.alimentacao,
        payment_method_id: paymentMethodIds.cartao_nubank,
        account_id: accountIds.nubank,
        date: '2025-01-15',
        notes: 'Compras da semana'
      },
      {
        id: randomUUID(),
        user_id: testUserId,
        description: 'Gasolina',
        amount: 120.00,
        type: 'expense',
        category_id: categoryIds.transporte,
        payment_method_id: paymentMethodIds.debito_bb,
        account_id: accountIds.bb,
        date: '2025-01-16',
        notes: 'Abastecimento'
      },
      {
        id: randomUUID(),
        user_id: testUserId,
        description: 'Freelance Design',
        amount: 800.00,
        type: 'income',
        category_id: categoryIds.freelance,
        payment_method_id: paymentMethodIds.pix_itau,
        account_id: accountIds.itau,
        date: '2025-01-18',
        notes: 'Projeto de logo'
      },
      {
        id: randomUUID(),
        user_id: testUserId,
        description: 'Conta de Luz',
        amount: 150.75,
        type: 'expense',
        category_id: categoryIds.contas,
        payment_method_id: paymentMethodIds.pix_nubank,
        account_id: accountIds.nubank,
        date: '2025-01-20',
        notes: 'CPFL Janeiro'
      },
      {
        id: randomUUID(),
        user_id: testUserId,
        description: 'Cinema',
        amount: 45.00,
        type: 'expense',
        category_id: categoryIds.lazer,
        payment_method_id: paymentMethodIds.cartao_itau,
        account_id: accountIds.itau,
        date: '2025-01-22',
        notes: 'Filme com a família'
      },
      {
        id: randomUUID(),
        user_id: testUserId,
        description: 'Dividendos',
        amount: 200.00,
        type: 'income',
        category_id: categoryIds.investimentos,
        payment_method_id: paymentMethodIds.transferencia_bb,
        account_id: accountIds.inter,
        date: '2025-01-25',
        notes: 'Rendimento mensal'
      }
    ]

    const { data: transactionsResult, error: transactionsError } = await supabase
      .from('transactions')
      .upsert(transactions)

    if (transactionsError) {
      console.log('❌ Erro ao inserir transações:', transactionsError.message)
    } else {
      console.log('✅ Transações inseridas com sucesso!')
    }

    console.log('')
    console.log('🎉 DADOS INSERIDOS COM SUCESSO!')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 RESUMO DOS DADOS:')
    console.log(`✅ ${bankAccounts.length} contas bancárias`)
    console.log(`✅ ${cards.length} cartões`)
    console.log(`✅ ${categories.length} categorias`)
    console.log(`✅ ${paymentMethods.length} métodos de pagamento`)
    console.log(`✅ ${transactions.length} transações`)
    console.log('')
    console.log('🎯 PRÓXIMOS PASSOS:')
    console.log('1. Acesse a aplicação: http://localhost:3000')
    console.log('2. Faça login com qualquer conta')
    console.log('3. Veja todos os dados carregados!')
    console.log('')
    console.log('💡 OBSERVAÇÃO:')
    console.log('Os dados foram inseridos com um user_id de teste.')
    console.log('Quando você fizer login real, o sistema criará dados específicos para seu usuário.')

  } catch (error) {
    console.error('❌ Erro geral:', error.message)
  }
}

insertDemoData()
