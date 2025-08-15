# 🚀 Guia de Deploy - Aurum Financial

## 📋 Pré-requisitos
- [x] Projeto no GitHub (✅ já está pronto)
- [x] Conta no Supabase configurada
- [x] Variáveis de ambiente configuradas

## 🌐 Option 1: Vercel (RECOMENDADO)

### Passo 1: Preparar o projeto
```bash
# Verificar se tudo está funcionando localmente
npm run build
npm run start
```

### Passo 2: Deploy no Vercel
1. Acesse: https://vercel.com
2. Clique em "Add New Project"
3. Importe o repositório: `jbpaiz/aurum`
4. Configure as variáveis de ambiente

### Passo 3: Variáveis de Ambiente no Vercel
```
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_publica_supabase
```

### Passo 4: Deploy automático
- Cada push no GitHub = deploy automático
- URL: https://aurum-seunome.vercel.app

---

## 🚀 Option 2: Netlify

### Deploy via GitHub
1. Acesse: https://netlify.com
2. "New site from Git"
3. Conecte com GitHub
4. Selecione repositório `aurum`
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`

---

## 🐳 Option 3: Railway (Com banco incluído)

### Deploy completo
1. Acesse: https://railway.app
2. "Deploy from GitHub repo"
3. Selecione `jbpaiz/aurum`
4. Adicione PostgreSQL database
5. Configure variáveis de ambiente

---

## ⚙️ Configurações Necessárias

### Variables de Ambiente (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=https://seuprojetoid.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_aqui
```

### Build Settings
- **Framework**: Next.js
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Install Command**: `npm install`

---

## 🔒 Segurança para Produção

### 1. Configurar domínio no Supabase
- Vá em Authentication > URL Configuration
- Adicione: `https://seusite.vercel.app`

### 2. Configurar RLS (Row Level Security)
- Políticas já estão configuradas ✅
- Dados protegidos por usuário ✅

### 3. SSL e HTTPS
- Automático em todas as plataformas ✅

---

## 📊 Monitoramento

### Vercel Analytics (Grátis)
- Visitantes em tempo real
- Performance metrics
- Core Web Vitals

### Logs e Debugging
- Vercel: Logs automáticos
- Supabase: Database logs
- Next.js: Built-in error tracking

---

## 🎯 Próximos Passos após Deploy

1. ✅ **Testar funcionalidades**
2. ✅ **Configurar domínio custom** (opcional)
3. ✅ **Monitorar performance**
4. ✅ **Backup do banco** (Supabase automático)
5. ✅ **Configurar alertas**

---

## 🚨 Troubleshooting

### Erro de Build
```bash
# Limpar cache
npm run clean
rm -rf .next
npm install
npm run build
```

### Erro de Variáveis
- Verificar se NEXT_PUBLIC_ está correto
- Verificar no painel da plataforma
- Redeploy após adicionar variáveis

### Erro do Supabase
- Verificar URL configuration
- Verificar RLS policies
- Verificar chaves API

---

**🎉 Seu site estará online em menos de 5 minutos!**
