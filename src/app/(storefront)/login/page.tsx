import type { Metadata } from 'next'

import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Sign in',
  description: 'Sign in to your CasaCircuit account to manage orders, addresses and returns.',
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <LoginForm />
      </div>
    </div>
  )
}
