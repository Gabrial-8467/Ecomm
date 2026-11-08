import type { Metadata } from 'next'

import { RegisterForm } from './register-form'

export const metadata: Metadata = {
  title: 'Create an account',
  description: 'Create a CasaCircuit account to save addresses, track orders and manage returns.',
  robots: { index: false, follow: false },
}

export default function RegisterPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <RegisterForm />
      </div>
    </div>
  )
}
