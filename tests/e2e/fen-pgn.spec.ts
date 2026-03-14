import { test, expect } from '@playwright/test'

test.describe('FEN and PGN loading', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analysis')
    await page.waitForSelector('[data-testid="move-history"]', { timeout: 15000 })
  })

  test('loads FEN and syncs to input', async ({ page }) => {
    const fen = 'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2'
    await page.fill('[data-testid="fen-input"]', fen)
    await page.click('[data-testid="fen-load-btn"]')

    // FEN input should reflect loaded position
    await expect(page.locator('[data-testid="fen-input"]')).toHaveValue(fen)
  })

  test('loads PGN and shows Unicode piece symbols', async ({ page }) => {
    const pgn = '1. e4 e5 2. Nf3'
    await page.fill('[data-testid="pgn-input"]', pgn)
    await page.click('[data-testid="pgn-load-btn"]')

    // Navigate to the end so all moves are shown
    await page.keyboard.press('ArrowDown')

    const history = page.locator('[data-testid="move-history"]')
    // Nf3 should be displayed as ♘f3
    await expect(history).toContainText('♘f3')
  })
})
