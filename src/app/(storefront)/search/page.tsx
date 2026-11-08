import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Search',
  robots: { index: false, follow: false },
}

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function toParams(input: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(input)) {
    if (typeof value === 'string') params.append(key, value)
    else if (Array.isArray(value)) for (const item of value) params.append(key, item)
  }
  return params
}

export default async function SearchPage({ searchParams }: PageProps) {
  const params = toParams(await searchParams)
  const search = params.toString()
  redirect(search ? `/products?${search}` : '/products')
}
