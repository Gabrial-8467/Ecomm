import type { Metadata } from 'next'
import Link from 'next/link'

import { ResendVerificationForm } from '../resend-verification-form'
import { VerifyEmailForm } from './verify-email-form'

export const metadata: Metadata = {
  title: 'Verify your email',
  robots: { index: false, follow: false },
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : ''

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <VerifyEmailForm token={token} />
        {token ? (
          <p className="mt-6 text-sm text-muted-foreground">
            Need a new link?{' '}
            <Link href="/login" className="font-medium text-accent underline underline-offset-4">
              Sign in to request one
            </Link>
            .
          </p>
        ) : (
          <div className="mt-6 border-t border-border pt-5">
            <ResendVerificationForm />
          </div>
        )}
      </div>
    </div>
  )
}
