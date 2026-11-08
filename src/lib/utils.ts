import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

export function absoluteUrl(path: string, base?: string): string {
  const origin = base ?? process.env.APP_URL ?? 'http://localhost:3000'
  return new URL(path, origin).toString()
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

export function initials(first?: string | null, last?: string | null): string {
  return [first, last]
    .filter(Boolean)
    .map((part) => part!.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2)
}
