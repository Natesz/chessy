import { test, expect } from '@playwright/test'

test.describe('Analysis page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analysis')
    // Wait for Nuxt hydration and chessground to init
    await page.waitForSelector('[data-testid="move-history"]', { timeout: 15000 })
  })

  test('loads PGN and shows moves in history', async ({ page }) => {
    const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6'
    await page.fill('[data-testid="pgn-input"]', pgn)
    await page.click('[data-testid="pgn-load-btn"]')

    const history = page.locator('[data-testid="move-history"]')
    await expect(history).toContainText('e4')
    await expect(history).toContainText('a6')
  })

  test('navigation buttons move through history', async ({ page }) => {
    const pgn = '1. e4 e5 2. Nf3 Nc6 3. Bb5 a6'
    await page.fill('[data-testid="pgn-input"]', pgn)
    await page.click('[data-testid="pgn-load-btn"]')

    // Start at beginning after load
    await page.click('[data-testid="nav-start"]')

    // Forward twice (now at e4)
    await page.click('[data-testid="nav-forward"]')
    await page.click('[data-testid="nav-forward"]')

    // Back once (now at e4 — move 1 white)
    await page.click('[data-testid="nav-back"]')

    const activeMove = page.locator('.bg-amber-500')
    await expect(activeMove).toContainText('e4')
  })
})
