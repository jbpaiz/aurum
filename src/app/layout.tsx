import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { CardsProvider } from '@/contexts/cards-context'
import { AccountsProvider } from '@/contexts/accounts-context'
import { ThemeProvider } from '@/contexts/theme-context'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Aurum - Controle Financeiro',
  description: 'Sistema completo de controle financeiro para gerenciar receitas e despesas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            <CardsProvider>
              <AccountsProvider>
                {children}
                <Toaster />
              </AccountsProvider>
            </CardsProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
