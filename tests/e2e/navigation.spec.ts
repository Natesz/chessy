import { test, expect } from '@playwright/test'

test.describe('Keyboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analysis')
    await page.waitForSelector('[data-testid="move-history"]', { timeout: 15000 })
  })

  test('arrow keys navigate through moves', async ({ page }) => {
    const pgn = '1. d4 d5 2. c4'
    await page.fill('[data-testid="pgn-input"]', pgn)
    await page.click('[data-testid="pgn-load-btn"]')

    // Go to start
    await page.click('[data-testid="nav-start"]')

    // Arrow right twice → should be at d5
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')

    const activeMove = page.locator('.bg-amber-500')
    await expect(activeMove).toContainText('d5')
  })

  test('ArrowUp navigates to root (no active move)', async ({ page }) => {
    const pgn = '1. d4 d5 2. c4'
    await page.fill('[data-testid="pgn-input"]', pgn)
    await page.click('[data-testid="pgn-load-btn"]')

    // Go to start
    await page.keyboard.press('ArrowUp')

    // At root — no amber highlighted move
    const activeMove = page.locator('.bg-amber-500')
    await expect(activeMove).toHaveCount(0)
  })
})
