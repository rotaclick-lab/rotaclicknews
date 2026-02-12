import { CarrierRegistrationForm } from '@/components/auth/carrier-registration-form'
import { Suspense } from 'react'

export const metadata = {
  title: 'Cadastro de Transportadora - RotaClick',
  description: 'Complete seu cadastro como transportadora no RotaClick',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <Suspense fallback={
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500"></div>
          </div>
        }>
          <CarrierRegistrationForm />
        </Suspense>
      </div>
    </div>
  )
}
