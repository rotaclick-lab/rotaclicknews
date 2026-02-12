import Image from 'next/image'
import { CarrierRegistrationForm } from '@/components/auth/carrier-registration-form'
import { Suspense } from 'react'

export const metadata = {
  title: 'Cadastro de Transportadora - RotaClick',
  description: 'Complete seu cadastro como transportadora no RotaClick',
}

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 py-6 px-4">
      <div className="w-full">
        <div className="flex justify-center mb-6">
          <Image src="/logo.png" alt="RotaClick" width={200} height={100} priority />
        </div>
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
