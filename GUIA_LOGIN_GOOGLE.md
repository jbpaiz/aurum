# 🔐 Guia Completo: Configurar Login com Google

## 📋 PARTE 1: Configurar Google Cloud Console

### Passo 1: Criar/Selecionar Projeto
1. ✅ Acesse: https://console.cloud.google.com/apis/credentials
2. No topo, clique em **"Selecionar um projeto"** (Select a project) ou no nome do projeto atual
3. Clique em **"Novo projeto"** (New Project)
   - Nome: `Aurum` (ou o nome que preferir)
   - Clique em **"Criar"** (Create)
4. Aguarde criar e selecione o projeto

### Passo 2: Configurar Tela de Consentimento OAuth
1. No menu lateral, vá em: **Tela de permissão OAuth** (OAuth consent screen)
2. Selecione **"Externo"** (External) - para permitir qualquer conta Google
3. Clique em **"Criar"** (Create)
4. Preencha:
   - **Nome do app:** (App name) `Aurum`
   - **E-mail de suporte ao usuário:** (User support email) seu email
   - **E-mail de contato do desenvolvedor:** (Developer contact email) seu email
5. Clique em **"Salvar e continuar"** (Save and Continue)
6. Em **Escopos** (Scopes), clique em **"Salvar e continuar"** (padrão está OK)
7. Em **Usuários de teste** (Test users) (opcional), clique em **"Salvar e continuar"**
8. Revise e clique em **"Voltar ao painel"** (Back to Dashboard)

### Passo 3: Criar Credenciais OAuth
1. No menu lateral, vá em: **Credenciais** (Credentials)
2. Clique em **"+ Criar credenciais"** (Create Credentials) > **"ID do cliente OAuth"** (OAuth client ID)
3. Selecione **Tipo de aplicativo:** (Application type) `Aplicativo da Web` (Web application)
4. Preencha:
   - **Nome:** (Name) `Aurum Web Client`
   
5. **Origens JavaScript autorizadas** (Authorized JavaScript origins) - Adicione:
   ```
   https://aurum-eight.vercel.app
   http://localhost:3000
   ```

6. **URIs de redirecionamento autorizados** (Authorized redirect URIs) - Adicione:
   ```
   https://difntzsqjzhswyubprsc.supabase.co/auth/v1/callback
   http://localhost:54321/auth/v1/callback
   ```

7. Clique em **"Criar"** (Create)

8. 📝 **COPIE E GUARDE:**
   - ✅ ID do cliente (Client ID) - algo como: `123456789-abc.apps.googleusercontent.com`
   - ✅ Chave secreta do cliente (Client Secret) - algo como: `GOCSPX-abc123xyz`

---

## 📋 PARTE 2: Configurar Supabase

### Passo 4: Adicionar Credenciais no Supabase
1. ✅ Acesse: https://supabase.com/dashboard/project/difntzsqjzhswyubprsc/auth/providers
2. Procure por **"Google"** na lista de provedores (providers)
3. Clique para expandir
4. **Habilite o provedor:**
   - Ative o botão **"Ativar login com Google"** (Enable Sign in with Google)
5. **Cole as credenciais:**
   - **ID do cliente:** (Client ID) Cole o Client ID copiado do Google
   - **Chave secreta do cliente:** (Client Secret) Cole o Client Secret copiado do Google
6. Clique em **"Salvar"** (Save)

---

## 📋 PARTE 3: Testar Login

### Passo 5: Testar no seu App
1. Acesse: http://localhost:3000 (desenvolvimento)
   OU
   Acesse: https://aurum-eight.vercel.app (produção)

2. Clique no botão **"Entrar com Google"**

3. Você será redirecionado para a tela de login do Google

4. Após autorizar, voltará para o app autenticado! 🎉

---

## 🔍 VERIFICAÇÃO RÁPIDA

### URLs que você deve ter configurado:

**No Google Cloud Console:**
- ✅ JavaScript origins: 
  - `https://aurum-eight.vercel.app`
  - `http://localhost:3000`
  
- ✅ Redirect URIs:
  - `https://difntzsqjzhswyubprsc.supabase.co/auth/v1/callback`
  - `http://localhost:54321/auth/v1/callback` (se usar local)

**No Supabase:**
- ✅ Site URL: `https://aurum-eight.vercel.app`
- ✅ Redirect URLs: 
  - `https://aurum-eight.vercel.app/**`
  - `http://localhost:3000/**`
- ✅ Google Provider habilitado com Client ID e Secret

---

## ⚠️ PROBLEMAS COMUNS

### Erro: "redirect_uri_mismatch"
**Solução:** Verifique se a URL de callback do Supabase está EXATAMENTE como no Google Console
- Correto: `https://difntzsqjzhswyubprsc.supabase.co/auth/v1/callback`
- ❌ Errado: URLs com espaços, barra extra no final, http em vez de https

### Erro: "Access blocked: This app's request is invalid"
**Solução:** Configure a tela de consentimento OAuth no Google Cloud Console

### Login funciona local mas não em produção
**Solução:** Adicione a URL de produção (`https://aurum-eight.vercel.app`) nas origens autorizadas do Google

---

## 📝 RESUMO DO FLUXO

1. Usuário clica em "Entrar com Google" no seu app
2. É redirecionado para `accounts.google.com` (login Google)
3. Autoriza o app Aurum
4. Google redireciona para: `https://difntzsqjzhswyubprsc.supabase.co/auth/v1/callback`
5. Supabase processa e redireciona para: `https://aurum-eight.vercel.app/auth/callback`
6. Seu app processa o callback e autentica o usuário ✅

---

## 🚀 PRÓXIMOS PASSOS (OPCIONAL)

### Para publicar o app para o público:
1. No Google Cloud Console > Tela de permissão OAuth (OAuth consent screen)
2. Clique em **"Publicar app"** (Publish App)
3. Seu app sairá do modo teste e poderá ser usado por qualquer pessoa

Sem publicar, apenas você e usuários de teste poderão fazer login.

---

## 📞 SUPORTE

Se encontrar algum problema, me avise com a mensagem de erro exata e qual passo você está!
