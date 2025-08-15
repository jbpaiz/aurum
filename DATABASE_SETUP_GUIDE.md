# 🗄️ Configuração do Banco de Dados - Supabase

## 📋 **Passo a Passo Completo**

### **1. Acesse o Supabase**
1. Vá para [https://supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Acesse o projeto Aurum (ou crie um novo)

### **2. Execute o Script SQL**
1. No dashboard do Supabase, vá para **SQL Editor**
2. Clique em **New Query**
3. **Copie todo o conteúdo** do arquivo `database-setup-complete.sql`
4. **Cole no editor** SQL
5. Clique em **Run** para executar

### **3. Verifique se foi criado corretamente**
No final do script, você verá um resumo:
```
✅ Setup do banco de dados concluído com sucesso!
🏦 Tabelas criadas: bank_accounts, transfers, transactions, categories
🔒 Políticas de segurança (RLS) configuradas
📊 Funções utilitárias disponíveis
```

---

## 🏗️ **Tabelas Criadas**

### **1. `bank_accounts`** - Contas Bancárias
```sql
- id (TEXT) - ID único da conta
- user_id (UUID) - ID do usuário
- name (TEXT) - Nome da conta (ex: "Nubank")  
- type (TEXT) - Tipo: checking, savings, wallet, investment, other
- bank (TEXT) - Banco (opcional)
- icon (TEXT) - Ícone da conta
- color (TEXT) - Cor da conta
- balance (DECIMAL) - Saldo atual
- is_active (BOOLEAN) - Conta ativa
```

### **2. `transfers`** - Transferências Entre Contas
```sql
- id (TEXT) - ID único da transferência
- user_id (UUID) - ID do usuário
- from_account_id (TEXT) - Conta de origem
- to_account_id (TEXT) - Conta de destino
- amount (DECIMAL) - Valor transferido
- description (TEXT) - Descrição
- payment_method (TEXT) - Como foi feita (PIX, TED, etc.)
- date (DATE) - Data da transferência
```

### **3. `transactions`** - Transações
```sql
- id (UUID) - ID único da transação
- user_id (UUID) - ID do usuário
- type (TEXT) - Tipo: income ou expense
- amount (DECIMAL) - Valor da transação
- description (TEXT) - Descrição
- category (TEXT) - Categoria
- date (DATE) - Data da transação
- account_id (TEXT) - Conta movimentada
- payment_method (TEXT) - Método usado
- installments (INTEGER) - Parcelas (padrão: 1)
```

### **4. `categories`** - Categorias Predefinidas
```sql
- id (UUID) - ID único da categoria
- name (TEXT) - Nome da categoria
- type (TEXT) - Tipo: income ou expense
- color (TEXT) - Cor da categoria
- icon (TEXT) - Ícone da categoria
```

---

## 🔒 **Segurança Configurada**

### **Row Level Security (RLS)**
- ✅ **Usuários só veem seus próprios dados**
- ✅ **Políticas automáticas por tabela**
- ✅ **Proteção total contra acesso não autorizado**

### **Relacionamentos**
- ✅ **Foreign Keys** configuradas
- ✅ **Cascade Delete** para limpeza automática
- ✅ **Integridade referencial** garantida

---

## 📊 **Funções Úteis Incluídas**

### **1. Saldo Total**
```sql
SELECT get_total_balance(auth.uid());
```

### **2. Resumo Financeiro**
```sql
SELECT * FROM get_financial_summary(auth.uid(), 30);
-- Retorna: receitas, despesas, saldo, qtd transações dos últimos 30 dias
```

---

## 🎯 **Dados de Exemplo**

O script já inclui:
- ✅ **10 categorias de receita** (verde)
- ✅ **10 categorias de despesa** (vermelho)
- ✅ **3 contas bancárias** de exemplo
- ✅ **Ícones e cores** pré-configurados

---

## ⚙️ **Configurar Variáveis de Ambiente**

Após criar o banco, atualize o arquivo `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase_aqui
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

**Para encontrar essas informações:**
1. No Supabase, vá para **Settings > API**
2. Copie a **URL** e a **anon key**

---

## ✅ **Verificação**

Após executar o script, você deve ver:

### **No SQL Editor:**
- Mensagens de sucesso
- Contagem de registros por tabela

### **No Table Editor:**
- 4 tabelas criadas
- Dados de exemplo inseridos
- Políticas RLS ativas

### **No Authentication:**
- Usuários podem fazer login
- Cada usuário vê apenas seus dados

---

## 🚨 **Importantes**

### **Primeira Vez Usando:**
1. **Execute o script completo** uma vez
2. **Não execute novamente** - tem proteção contra duplicação
3. **Verifique as tabelas** no Table Editor

### **Atualizações:**
- O script pode ser executado **múltiplas vezes** sem problemas
- Usa `IF NOT EXISTS` e `ON CONFLICT DO NOTHING`
- **Seguro para re-execução**

### **Dados de Exemplo:**
- As contas de exemplo são criadas para o **primeiro usuário**
- **Delete-as** após criar suas contas reais
- **Ou modifique** o script para não incluí-las

---

## 🎉 **Pronto!**

Após seguir esses passos, o sistema Aurum estará **100% funcional** com:

- ✅ Banco de dados configurado
- ✅ Tabelas criadas
- ✅ Segurança habilitada  
- ✅ Dados de exemplo
- ✅ Funções utilitárias
- ✅ Pronto para uso!

**O sistema já está em produção em:** https://aurum-evejcwr1e-jbpaizs-projects.vercel.app
