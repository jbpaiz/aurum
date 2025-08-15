#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Lista de arquivos que foram removidos
const removedFiles = [
  'src/components/transaction-form.tsx',
  'src/components/transaction-list.tsx', 
  'src/components/supabase-config.tsx',
  'src/components/landing.tsx',
  'src/components/transfers/transfer-modal.tsx',
  'src/components/transactions/transaction-list-fixed.tsx'
]

// Função para encontrar todos os arquivos TypeScript/JavaScript
function findTSFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir)
  
  files.forEach(file => {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
      findTSFiles(filePath, fileList)
    } else if (file.match(/\.(ts|tsx|js|jsx)$/)) {
      fileList.push(filePath)
    }
  })
  
  return fileList
}

// Função para limpar imports não utilizados
function cleanImportsInFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    let newContent = content
    
    // Remove imports dos arquivos que foram deletados
    removedFiles.forEach(removedFile => {
      const importPattern = new RegExp(`import.*from\\s+['"](.*${removedFile.replace(/\//g, '/')}.*)?['"]\\s*;?\\n?`, 'gm')
      if (importPattern.test(newContent)) {
        newContent = newContent.replace(importPattern, '')
        modified = true
        console.log(`✅ Removido import de ${removedFile} em ${filePath}`)
      }
    })
    
    // Remove imports duplicados
    const importLines = []
    const seenImports = new Set()
    
    newContent = newContent.replace(/^import.*$/gm, (match) => {
      const normalizedImport = match.replace(/\s+/g, ' ').trim()
      if (seenImports.has(normalizedImport)) {
        modified = true
        console.log(`✅ Removido import duplicado: ${match} em ${filePath}`)
        return ''
      }
      seenImports.add(normalizedImport)
      return match
    })
    
    // Remove linhas vazias excessivas
    newContent = newContent.replace(/\n\n\n+/g, '\n\n')
    
    if (modified) {
      fs.writeFileSync(filePath, newContent, 'utf8')
      console.log(`📝 Arquivo atualizado: ${filePath}`)
    }
    
  } catch (error) {
    console.error(`❌ Erro processando ${filePath}:`, error.message)
  }
}

// Executar limpeza
console.log('🧹 Iniciando limpeza de imports...\n')

const srcPath = path.join(__dirname, 'src')
if (!fs.existsSync(srcPath)) {
  console.error('❌ Pasta src/ não encontrada!')
  process.exit(1)
}

const tsFiles = findTSFiles(srcPath)
console.log(`📁 Encontrados ${tsFiles.length} arquivos para verificar\n`)

tsFiles.forEach(cleanImportsInFile)

console.log('\n✨ Limpeza de imports concluída!')
console.log('\n📋 Resumo dos arquivos removidos:')
removedFiles.forEach(file => console.log(`   - ${file}`))
