import type { Metadata } from 'next'

import { ResetPasswordForm } from './reset-password-form'

export const metadata: Metadata = {
  title: 'Choose a new password',
  robots: { index: false, follow: false },
}

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>
}) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : ''

  return (
    <div className="container-page flex min-h-[70vh] items-center justify-center py-12">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div className="space-y-4">
            <h1 className="font-display text-2xl font-semibold">Reset link incomplete</h1>
            <p className="text-sm text-muted-foreground">
              This page needs a valid reset token. Request a new link from the sign-in page.
            </p>
            <a
              href="/forgot-password"
              className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Request a new link
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
