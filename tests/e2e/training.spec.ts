import { test, expect } from '@playwright/test'

// Opera-játszma (Morphy, 1858) – mockolt Lichess game export
const GAME = {
  id: 'testgame1',
  variant: 'standard',
  moves: 'e4 e5 Nf3 d6 d4 Bg4 dxe5 Bxf3 Qxf3 dxe5 Bc4 Nf6 Qb3 Qe7 Nc3 c6 Bg5 b5 Nxb5 cxb5 Bxb5+ Nbd7 O-O-O Rd8 Rxd7 Rxd7 Rd1 Qe6 Bxd7+ Nxd7 Qb8+ Nxb8 Rd8#',
  players: {
    white: { user: { name: 'Morphy' }, rating: 2600 },
    black: { user: { name: 'Duke' }, rating: 2000 },
  },
  opening: { eco: 'C41', name: 'Philidor Defense', ply: 4 },
}

const EXPLORER = {
  moves: [],
  topGames: [{ id: 'testgame1', white: { name: 'Morphy', rating: 2600 }, black: { name: 'Duke', rating: 2000 } }],
  recentGames: [],
  opening: null,
}

test.describe('Training page', () => {
  test('shows Lichess login when not logged in', async ({ page }) => {
    await page.goto('/training')
    await expect(page.locator('[data-testid="lichess-login-card"]')).toBeVisible()
    await expect(page.locator('[data-testid="lichess-login"]')).toBeVisible()
  })

  test('nav contains Edzés link', async ({ page }) => {
    await page.goto('/analysis')
    await page.locator('nav >> text=Edzés').click()
    await expect(page).toHaveURL(/\/training/)
  })

  test('generates a position, accepts an answer and links to Lichess', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chessy-lichess-auth', JSON.stringify({
        token: 'test-token', expiresAt: Date.now() + 86400_000, username: 'tester',
      }))
      // Bármely pozíció megfeleljen: klasszikus mód, 0–∞ előny, gyors mélység
      localStorage.setItem('chessy-training-settings', JSON.stringify({
        openingId: 'any', mode: 'classic', minAdvantage: 0, maxAdvantage: 10,
        minPly: 16, maxPly: 20, quietOnly: false, depth: 8,
      }))
      localStorage.removeItem('chessy-training-stats')
    })
    await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: EXPLORER }))
    await page.route('https://lichess.org/game/export/**', route => route.fulfill({ json: GAME }))
    await page.route('https://lichess.org/api/account', route => route.fulfill({ json: { username: 'tester' } }))

    await page.goto('/training')
    await page.click('[data-testid="training-start"]')

    await expect(page.locator('[data-testid="answer-white"]')).toBeEnabled({ timeout: 30000 })
    await page.click('[data-testid="answer-white"]')

    await expect(page.locator('[data-testid="training-result"]')).toBeVisible()
    const href = await page.locator('[data-testid="lichess-game-link"]').getAttribute('href')
    expect(href).toMatch(/^https:\/\/lichess\.org\/testgame1(\/black)?#(1[6-9]|20)$/)
    await expect(page.locator('[data-testid="training-stats"]')).toContainText('1 válasz')
  })
})
