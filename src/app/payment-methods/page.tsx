import { MainLayout } from '@/components/layout/main-layout'
import { PaymentMethodsPage } from '@/components/payment-methods/payment-methods-page'

export default function PaymentMethodsPageRoute() {
  return (
    <MainLayout>
      <PaymentMethodsPage />
    </MainLayout>
  )
}
