#!/bin/bash

# 🚀 Script de Deploy Automático - Aurum Financial
# Execute: chmod +x deploy.sh && ./deploy.sh

echo "🚀 Iniciando deploy do Aurum Financial..."

# Verificar se está na branch main
BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
    echo "⚠️  Mudando para branch main..."
    git checkout main
fi

# Atualizar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se o build funciona
echo "🔨 Testando build..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build bem-sucedido!"
else
    echo "❌ Erro no build. Corrija os erros antes de continuar."
    exit 1
fi

# Fazer commit das alterações pendentes
echo "📝 Verificando alterações..."
if [[ -n $(git status -s) ]]; then
    echo "📋 Fazendo commit das alterações..."
    git add .
    git commit -m "chore: prepare for deployment - $(date)"
fi

# Push para GitHub
echo "⬆️  Enviando para GitHub..."
git push origin main

# Instruções para Vercel
echo ""
echo "🎉 Preparação concluída!"
echo ""
echo "🌐 Para fazer deploy no Vercel:"
echo "1. Acesse: https://vercel.com"
echo "2. Clique em 'Add New Project'"
echo "3. Importe: jbpaiz/aurum"
echo "4. Configure as variáveis de ambiente:"
echo "   NEXT_PUBLIC_SUPABASE_URL=sua_url_aqui"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_aqui"
echo "5. Deploy automático!"
echo ""
echo "🔗 Seu site estará em: https://aurum-USERNAME.vercel.app"
echo ""
echo "✅ Deploy realizado com sucesso!"
