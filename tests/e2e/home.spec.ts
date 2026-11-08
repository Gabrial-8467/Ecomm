import { expect, test } from '@playwright/test'

test.describe('storefront shell', () => {
  test('home renders the value proposition and primary navigation', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1 })).toContainText(
      'A calmer way to furnish and power your home',
    )
    await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible()
    await expect(page.getByRole('search')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Cart' })).toBeVisible()
  })

  test('skip link is available for keyboard users', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused()
  })

  test('health endpoint reports liveness', async ({ request }) => {
    const response = await request.get('/api/health')
    expect(response.ok()).toBe(true)
    await expect(await response.json()).toMatchObject({ status: 'ok' })
  })

  test('security headers are present', async ({ request }) => {
    const response = await request.get('/')
    const headers = response.headers()
    expect(headers['x-content-type-options']).toBe('nosniff')
    expect(headers['x-frame-options']).toBe('DENY')
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'")
  })

  test('unknown pages return a branded 404', async ({ page }) => {
    const response = await page.goto('/this-page-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('This page is not here')
  })
})
