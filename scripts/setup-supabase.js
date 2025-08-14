#!/usr/bin/env node

// Script para configurar o banco de dados Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function setupSupabase() {
  console.log('🔌 Configurando banco de dados Supabase...\n');

  // Verificar se as credenciais estão configuradas
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('seuprojetoid')) {
    console.log('❌ Credenciais do Supabase não configuradas.');
    console.log('📝 Por favor, edite o arquivo .env.local com suas credenciais reais.');
    console.log('📖 Instruções detalhadas estão no arquivo SUPABASE_SETUP.md');
    console.log('\n💡 Exemplo de configuração:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://seuprojetoid.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_aqui');
    console.log('SUPABASE_SERVICE_ROLE_KEY=sua_chave_de_servico_aqui');
    return;
  }

  console.log('✅ Credenciais encontradas');
  console.log(`🌐 Conectando a: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Testar conexão
    console.log('🧪 Testando conexão...');
    const { data: testData, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (testError) {
      throw new Error(`Erro de conexão: ${testError.message}`);
    }

    console.log('✅ Conexão estabelecida com sucesso');

    // Verificar se as tabelas já existem
    console.log('� Verificando estrutura do banco...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['transactions', 'categories']);

    const existingTables = tables?.map(t => t.table_name) || [];
    
    if (existingTables.includes('transactions') && existingTables.includes('categories')) {
      console.log('ℹ️  Tabelas já existem. Verificando dados...');
      
      // Verificar se há dados nas tabelas
      const { data: categoriesData } = await supabase
        .from('categories')
        .select('count')
        .single();
      
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select('count')
        .single();

      if (categoriesData && transactionsData) {
        console.log('✅ Banco de dados já está configurado e populado!');
        console.log(`📊 ${categoriesData.count || 0} categorias encontradas`);
        console.log(`💰 ${transactionsData.count || 0} transações encontradas`);
        console.log('\n🚀 Seu projeto está pronto para uso!');
        return;
      }
    }

    // Executar configuração do banco
    console.log('📋 Executando configuração do banco...');
    
    // Ler e executar scripts SQL
    const sqlPath = path.join(__dirname, '..', 'supabase-setup.sql');
    if (!fs.existsSync(sqlPath)) {
      throw new Error('Arquivo supabase-setup.sql não encontrado');
    }

    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Executar SQL via function RPC (mais seguro)
    console.log('⚙️  Criando estrutura do banco...');
    
    // Como não podemos executar SQL diretamente, vamos orientar o usuário
    console.log('\n📋 AÇÃO NECESSÁRIA:');
    console.log('Por segurança, você precisa executar o SQL manualmente:');
    console.log('1. 🌐 Acesse seu painel do Supabase');
    console.log('2. � Vá para "SQL Editor"');
    console.log('3. 📄 Copie e cole o conteúdo do arquivo "supabase-setup.sql"');
    console.log('4. ▶️  Execute o script');
    console.log('\n� Alternativamente, você pode:');
    console.log('- Importar o arquivo SQL diretamente no painel');
    console.log('- Usar a CLI do Supabase se estiver instalada');

    console.log('\n🎉 Após executar o SQL, seu projeto estará totalmente configurado!');

  } catch (error) {
    console.error('❌ Erro durante a configuração:', error.message);
    console.log('\n� Soluções possíveis:');
    console.log('- Verifique se as credenciais estão corretas');
    console.log('- Confirme se o projeto Supabase está ativo');
    console.log('- Execute o SQL manualmente no painel do Supabase');
    console.log('- Consulte SUPABASE_SETUP.md para ajuda detalhada');
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  setupSupabase();
}

module.exports = { setupSupabase };
