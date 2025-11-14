import type { Metadata } from 'next'

import PaymentMethodsPage from '@/components/payment-methods/payment-methods-page'

export const metadata: Metadata = {
	title: 'Formas de pagamento | Aurum',
	description:
		'Gerencie cartões, carteiras digitais e limites diretamente do dashboard integrado ao Supabase.',
}

export default function PaymentMethodsRoute() {
	return <PaymentMethodsPage />
}
