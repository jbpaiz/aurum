/**
 * Script de Teste Completo do Módulo de Saúde
 * 
 * Este script testa todas as funcionalidades do módulo após aplicar as migrações.
 * Execute: node scripts/test-health-module.js
 */

import { createClient } from '@supabase/supabase-js'
import { format, subDays } from 'date-fns'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente não configuradas')
  console.error('Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

console.log('🧪 Iniciando testes do módulo de saúde...\n')

// ========================================
// TESTE 1: Verificar Tabelas
// ========================================
async function testTables() {
  console.log('📊 TESTE 1: Verificando tabelas do banco...')
  
  const requiredTables = [
    'health_weight_logs',
    'health_activities',
    'health_sleep_logs',
    'health_goals',
    'health_body_measurements',
    'health_hydration',
    'health_hydration_goals',
    'health_meals',
    'health_nutrition_goals',
    'health_badges',
    'health_user_stats',
    'health_challenges'
  ]
  
  let passed = 0
  let failed = 0
  
  for (const table of requiredTables) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`  ❌ ${table}: ${error.message}`)
      failed++
    } else {
      console.log(`  ✅ ${table}`)
      passed++
    }
  }
  
  console.log(`\nResultado: ${passed}/${requiredTables.length} tabelas OK\n`)
  return failed === 0
}

// ========================================
// TESTE 2: Testar Peso
// ========================================
async function testWeight() {
  console.log('⚖️ TESTE 2: Testando registros de peso...')
  
  try {
    // Criar registro
    const { data: created, error: createError } = await supabase
      .from('health_weight_logs')
      .insert({
        weight: 70.5,
        log_date: format(new Date(), 'yyyy-MM-dd'),
        notes: 'Teste automático'
      })
      .select()
      .single()
    
    if (createError) throw createError
    console.log('  ✅ Criação: OK')
    
    // Ler registro
    const { data: read, error: readError } = await supabase
      .from('health_weight_logs')
      .select('*')
      .eq('id', created.id)
      .single()
    
    if (readError) throw readError
    console.log('  ✅ Leitura: OK')
    
    // Atualizar registro
    const { error: updateError } = await supabase
      .from('health_weight_logs')
      .update({ weight: 71.0 })
      .eq('id', created.id)
    
    if (updateError) throw updateError
    console.log('  ✅ Atualização: OK')
    
    // Deletar registro
    const { error: deleteError } = await supabase
      .from('health_weight_logs')
      .delete()
      .eq('id', created.id)
    
    if (deleteError) throw deleteError
    console.log('  ✅ Exclusão: OK')
    
    console.log('✅ TESTE 2: PASSOU\n')
    return true
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
    console.log('❌ TESTE 2: FALHOU\n')
    return false
  }
}

// ========================================
// TESTE 3: Testar Atividades
// ========================================
async function testActivities() {
  console.log('🏃 TESTE 3: Testando atividades físicas...')
  
  try {
    const { data, error } = await supabase
      .from('health_activities')
      .insert({
        activity_type: 'running',
        duration_minutes: 30,
        calories_burned: 250,
        distance_km: 5,
        activity_date: format(new Date(), 'yyyy-MM-dd'),
        activity_time: '07:00'
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Limpar
    await supabase
      .from('health_activities')
      .delete()
      .eq('id', data.id)
    
    console.log('✅ TESTE 3: PASSOU\n')
    return true
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
    console.log('❌ TESTE 3: FALHOU\n')
    return false
  }
}

// ========================================
// TESTE 4: Testar Sono
// ========================================
async function testSleep() {
  console.log('😴 TESTE 4: Testando registros de sono...')
  
  try {
    const { data, error } = await supabase
      .from('health_sleep_logs')
      .insert({
        sleep_date: format(new Date(), 'yyyy-MM-dd'),
        bed_time: '23:00',
        wake_time: '07:00',
        duration_hours: 8,
        quality: 4
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Limpar
    await supabase
      .from('health_sleep_logs')
      .delete()
      .eq('id', data.id)
    
    console.log('✅ TESTE 4: PASSOU\n')
    return true
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
    console.log('❌ TESTE 4: FALHOU\n')
    return false
  }
}

// ========================================
// TESTE 5: Testar Medidas Corporais
// ========================================
async function testBodyMeasurements() {
  console.log('📏 TESTE 5: Testando medidas corporais...')
  
  try {
    const { data, error } = await supabase
      .from('health_body_measurements')
      .insert({
        measurement_date: format(new Date(), 'yyyy-MM-dd'),
        chest_cm: 95,
        waist_cm: 80,
        hips_cm: 100
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Limpar
    await supabase
      .from('health_body_measurements')
      .delete()
      .eq('id', data.id)
    
    console.log('✅ TESTE 5: PASSOU\n')
    return true
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
    console.log('❌ TESTE 5: FALHOU\n')
    return false
  }
}

// ========================================
// TESTE 6: Testar Hidratação
// ========================================
async function testHydration() {
  console.log('💧 TESTE 6: Testando hidratação...')
  
  try {
    // Criar meta
    const { data: goal, error: goalError } = await supabase
      .from('health_hydration_goals')
      .upsert({
        daily_goal_ml: 2000
      })
      .select()
      .single()
    
    if (goalError) throw goalError
    console.log('  ✅ Meta de hidratação: OK')
    
    // Criar registro
    const { data: log, error: logError } = await supabase
      .from('health_hydration')
      .insert({
        log_date: format(new Date(), 'yyyy-MM-dd'),
        log_time: format(new Date(), 'HH:mm'),
        amount_ml: 250
      })
      .select()
      .single()
    
    if (logError) throw logError
    console.log('  ✅ Registro de hidratação: OK')
    
    // Limpar
    await supabase.from('health_hydration').delete().eq('id', log.id)
    
    console.log('✅ TESTE 6: PASSOU\n')
    return true
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
    console.log('❌ TESTE 6: FALHOU\n')
    return false
  }
}

// ========================================
// TESTE 7: Testar Nutrição
// ========================================
async function testNutrition() {
  console.log('🍽️ TESTE 7: Testando nutrição...')
  
  try {
    // Criar meta nutricional
    const { data: goal, error: goalError } = await supabase
      .from('health_nutrition_goals')
      .upsert({
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbohydrates: 200,
        daily_fats: 67
      })
      .select()
      .single()
    
    if (goalError) throw goalError
    console.log('  ✅ Meta nutricional: OK')
    
    // Criar refeição
    const { data: meal, error: mealError } = await supabase
      .from('health_meals')
      .insert({
        meal_date: format(new Date(), 'yyyy-MM-dd'),
        meal_time: format(new Date(), 'HH:mm'),
        meal_type: 'breakfast',
        description: 'Teste',
        calories: 400,
        protein: 20,
        carbohydrates: 50,
        fats: 10
      })
      .select()
      .single()
    
    if (mealError) throw mealError
    console.log('  ✅ Registro de refeição: OK')
    
    // Limpar
    await supabase.from('health_meals').delete().eq('id', meal.id)
    
    console.log('✅ TESTE 7: PASSOU\n')
    return true
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
    console.log('❌ TESTE 7: FALHOU\n')
    return false
  }
}

// ========================================
// TESTE 8: Testar Gamificação
// ========================================
async function testGamification() {
  console.log('🏆 TESTE 8: Testando gamificação...')
  
  try {
    // Criar/atualizar stats
    const { data: stats, error: statsError } = await supabase
      .from('health_user_stats')
      .upsert({
        total_points: 500,
        level: 1,
        current_streak: 3,
        longest_streak: 5
      })
      .select()
      .single()
    
    if (statsError) throw statsError
    console.log('  ✅ User stats: OK')
    
    // Criar badge
    const { data: badge, error: badgeError } = await supabase
      .from('health_badges')
      .insert({
        badge_type: 'first_weight',
        earned_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (badgeError) throw badgeError
    console.log('  ✅ Badge: OK')
    
    // Criar desafio
    const { data: challenge, error: challengeError } = await supabase
      .from('health_challenges')
      .insert({
        challenge_type: 'weight_streak_7',
        target_value: 7,
        current_value: 3,
        status: 'active',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(subDays(new Date(), -7), 'yyyy-MM-dd'),
        reward_points: 100
      })
      .select()
      .single()
    
    if (challengeError) throw challengeError
    console.log('  ✅ Challenge: OK')
    
    // Limpar
    await supabase.from('health_badges').delete().eq('id', badge.id)
    await supabase.from('health_challenges').delete().eq('id', challenge.id)
    
    console.log('✅ TESTE 8: PASSOU\n')
    return true
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
    console.log('❌ TESTE 8: FALHOU\n')
    return false
  }
}

// ========================================
// TESTE 9: Testar Metas
// ========================================
async function testGoals() {
  console.log('🎯 TESTE 9: Testando metas...')
  
  try {
    const { data, error } = await supabase
      .from('health_goals')
      .insert({
        goal_type: 'weight',
        target_value: 70,
        current_value: 75,
        deadline: format(subDays(new Date(), -30), 'yyyy-MM-dd')
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Limpar
    await supabase.from('health_goals').delete().eq('id', data.id)
    
    console.log('✅ TESTE 9: PASSOU\n')
    return true
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
    console.log('❌ TESTE 9: FALHOU\n')
    return false
  }
}

// ========================================
// EXECUTAR TODOS OS TESTES
// ========================================
async function runAllTests() {
  const results = []
  
  results.push(await testTables())
  results.push(await testWeight())
  results.push(await testActivities())
  results.push(await testSleep())
  results.push(await testBodyMeasurements())
  results.push(await testHydration())
  results.push(await testNutrition())
  results.push(await testGamification())
  results.push(await testGoals())
  
  const passed = results.filter(r => r).length
  const total = results.length
  
  console.log('═══════════════════════════════════════')
  console.log(`RESULTADO FINAL: ${passed}/${total} testes passaram`)
  console.log('═══════════════════════════════════════\n')
  
  if (passed === total) {
    console.log('🎉 SUCESSO! Todos os testes passaram!')
    console.log('✅ O módulo de saúde está funcionando corretamente.')
    console.log('✅ Você pode começar a usar o sistema.\n')
  } else {
    console.log('⚠️ ATENÇÃO! Alguns testes falharam.')
    console.log('❌ Verifique as migrações e configurações do Supabase.')
    console.log('❌ Consulte o MIGRATION_GUIDE.md para mais informações.\n')
  }
  
  process.exit(passed === total ? 0 : 1)
}

// Executar
runAllTests().catch(error => {
  console.error('❌ Erro fatal:', error)
  process.exit(1)
})
