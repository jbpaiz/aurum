# 🚀 Integração Automática com Supabase

Este guia explica como conectar seu projeto Aurum a um banco de dados Supabase real.

## 📋 Pré-requisitos

- Conta gratuita no [Supabase](https://supabase.com)
- Node.js instalado no seu sistema

## 🛠️ Configuração Passo a Passo

### 1. Criar Projeto no Supabase

1. **Acesse** [supabase.com](https://supabase.com)
2. **Faça login** ou crie uma conta gratuita
3. **Clique** em "New Project"
4. **Preencha** os dados:
   - Nome do projeto: `aurum-financial`
   - Senha do banco: `suasenhasegura123`
   - Região: `South America (São Paulo)` (recomendado para Brasil)
5. **Aguarde** a criação do projeto (2-3 minutos)

### 2. Obter Credenciais

1. **Acesse** Settings > API no painel do Supabase
2. **Copie** os seguintes valores:
   - **URL**: `https://seuprojetoid.supabase.co`
   - **anon/public key**: Chave que começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **service_role key**: Chave que começa com `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 3. Configurar Variáveis de Ambiente

1. **Abra** o arquivo `.env.local` na raiz do projeto
2. **Substitua** os valores placeholder pelas suas credenciais:

```env
# Substitua pelos valores reais do seu projeto
NEXT_PUBLIC_SUPABASE_URL=https://seuprojetoid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_DB_PASSWORD=sua-senha-principal-do-banco
DATABASE_URL=postgresql://postgres:[SENHA]@db.[SEU-PROJETO].supabase.co:5432/postgres
```

> 💡 Caso não queira compartilhar a URL completa, basta informar `SUPABASE_DB_PASSWORD`. O script monta automaticamente o valor de `DATABASE_URL` usando o `project-ref` da URL pública. Se preferir colar a URL completa, pode deixar `SUPABASE_DB_PASSWORD` em branco.

### 4. Configurar o Banco de Dados

Execute o script automático de configuração:

```bash
npm run supabase:setup
```

Este comando irá:
- ✅ Validar se as credenciais Supabase estão corretas
- ✅ Criar as tabelas necessárias
- ✅ Inserir categorias padrão
- ✅ Adicionar dados de exemplo
- ✅ Configurar índices para performance
- ✅ Criar as tabelas `financial_reports` e `financial_report_lines` usadas na tela de Relatórios

### 5. Verificar Configuração

1. **Inicie** o projeto:
   ```bash
   npm run dev
   ```

2. **Acesse** http://localhost:3001
3. **Verifique** se o badge "Modo Demo" desapareceu
4. **Teste** adicionando uma nova transação

## 🗄️ Estrutura do Banco

### Tabelas Criadas

#### `transactions`
- `id` (UUID) - Chave primária
- `user_id` (TEXT) - ID do usuário
- `type` (TEXT) - 'income' ou 'expense'
- `amount` (DECIMAL) - Valor da transação
- `description` (TEXT) - Descrição
- `category` (TEXT) - Categoria
- `date` (DATE) - Data da transação
- `created_at` (TIMESTAMPTZ) - Data de criação
- `updated_at` (TIMESTAMPTZ) - Data de atualização

#### `categories`
- `id` (UUID) - Chave primária
- `name` (TEXT) - Nome da categoria
- `type` (TEXT) - 'income' ou 'expense'
- `color` (TEXT) - Cor da categoria
- `created_at` (TIMESTAMPTZ) - Data de criação
- **Constraint**: combinação (`name`, `type`) é única para evitar duplicidades ao aplicar seeds

#### `financial_reports`
- `id` (UUID) - Chave primária
- `user_id` (UUID) - Dono do relatório
- `title` (TEXT) - Título salvo
- `period_start` / `period_end` (DATE) - Intervalo
- `total_income` / `total_expense` / `net_total` (DECIMAL)
- `filters` (JSONB) - Metadados dos filtros aplicados
- `created_at` / `updated_at`

#### `financial_report_lines`
- `id` (UUID) - Chave primária
- `report_id` (UUID) - Referência ao relatório
- `user_id` (UUID)
- `transaction_id` (UUID)
- `type` (TEXT) - income ou expense
- `amount` (DECIMAL)
- `category` / `description` (TEXT)
- `transaction_date` (DATE)
- `created_at`

## 🔧 Scripts Disponíveis

```bash
# Configurar banco de dados
npm run supabase:setup

# Gerar tipos TypeScript (requer project_id configurado)
npm run supabase:types

# Iniciar desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎨 Personalização

### Adicionar Novas Categorias

1. **Acesse** o painel do Supabase
2. **Vá** para Table Editor > categories
3. **Clique** em "Insert" > "Insert row"
4. **Preencha** os campos:
   - `name`: Nome da categoria
   - `type`: 'income' ou 'expense'
   - `color`: Código hexadecimal da cor

### Configurar Autenticação (Opcional)

Para adicionar sistema de login:

1. **Acesse** Authentication > Settings no Supabase
2. **Configure** os provedores desejados (Google, GitHub, etc.)
3. **Atualize** o código para usar `supabase.auth`

## 🔒 Segurança

### Row Level Security (RLS)

Para dados isolados por usuário, configure RLS:

```sql
-- Habilitar RLS na tabela transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Política para usuarios só verem seus dados
CREATE POLICY "Users can view own transactions" ON transactions
    FOR ALL USING (auth.uid()::text = user_id);
```

## 🚨 Troubleshooting

### Erro: "Invalid URL"
- ✅ Verifique se a URL do Supabase está correta
- ✅ Certifique-se de que não há espaços nas variáveis

### Erro: "Invalid API Key"
- ✅ Confirme se copiou a chave correta
- ✅ Verifique se não há quebras de linha na chave

### Erro: "Permission denied"
- ✅ Use a service_role key para configuração inicial
- ✅ Configure RLS apenas após testes iniciais

### Banco não criado
- ✅ Execute o SQL manualmente no SQL Editor do Supabase
- ✅ Verifique se o projeto foi criado corretamente

## 📊 Monitoramento

### Logs e Métricas

1. **Acesse** Logs > Postgres Logs no Supabase
2. **Monitor** Database > Reports para métricas
3. **Configure** alertas se necessário

### Backup

- ✅ Backups automáticos estão habilitados no plano gratuito
- ✅ Para backups manuais: Settings > Database > Download backup

## 🆙 Próximos Passos

1. **Implementar autenticação** com `supabase.auth`
2. **Adicionar upload de arquivos** com Supabase Storage
3. **Configurar realtime** para atualizações automáticas
4. **Implementar relatórios** avançados
5. **Adicionar notificações** push

---

## 💡 Dicas Importantes

- 🔄 O projeto funciona em **modo demo** até você configurar o Supabase
- 🆓 O plano gratuito oferece **500MB** de espaço e **2GB** de transferência
- 📈 Monitore o uso no painel do Supabase
- 🔒 Configure **Row Level Security** antes de ir para produção
- 📱 O Supabase oferece **APIs REST** e **GraphQL** automáticas

**Precisa de ajuda?** Verifique a [documentação oficial do Supabase](https://supabase.com/docs) ou abra uma issue no repositório!
