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
      // Bármely pozíció megfeleljen: klasszikus mód, 0–∞ előny
      localStorage.setItem('chessy-training-settings', JSON.stringify({
        openingId: 'any', mode: 'classic', minAdvantage: 0, maxAdvantage: 10,
        minPly: 16, maxPly: 20, quietOnly: false,
      }))
      localStorage.removeItem('chessy-training-stats')
    })
    await page.route('https://explorer.lichess.ovh/**', route => route.fulfill({ json: EXPLORER }))
    await page.route('https://lichess.org/api/games/export/_ids**', route => route.fulfill({
      contentType: 'application/x-ndjson',
      body: `${JSON.stringify(GAME)}\n`,
    }))
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

  test('custom move list in Hungarian notation is sent to the explorer', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('chessy-lichess-auth', JSON.stringify({
        token: 'test-token', expiresAt: Date.now() + 86400_000, username: 'tester',
      }))
      localStorage.removeItem('chessy-training-settings')
    })
    const plays: string[] = []
    await page.route('https://explorer.lichess.ovh/**', (route) => {
      plays.push(new URL(route.request().url()).searchParams.get('play') ?? '')
      return route.fulfill({ json: { moves: [], topGames: [], recentGames: [] } })
    })
    await page.route('https://lichess.org/api/account', route => route.fulfill({ json: { username: 'tester' } }))

    await page.goto('/training')
    await page.selectOption('[data-testid="training-opening"]', 'custom')
    const input = page.locator('[data-testid="training-custom-moves"]')
    const error = page.locator('[data-testid="training-custom-error"]')

    // B = bástya (magyar) → "Bf4" itt szabálytalan, nem futóként értelmezzük
    await input.fill('1. d4, d5 2. Bf4')
    await expect(error).toContainText('Bf4')

    // Túl hosszú lépéssor (11 lépés)
    await input.fill('1. Hf3, Hf6 2. Hg1, Hg8 3. Hf3, Hf6 4. Hg1, Hg8 5. Hf3, Hf6 6. Hg1, Hg8 7. Hf3, Hf6 8. Hg1, Hg8 9. Hf3, Hf6 10. Hg1, Hg8 11. e4')
    await expect(error).toContainText('Legfeljebb 10')

    // Sánc 0-0, futó F, huszár H
    await input.fill('1. e4, e5 2. Hf3, Hc6 3. Fc4, Fc5 4. 0-0, Hf6')
    await expect(error).toHaveCount(0)
    await page.click('[data-testid="training-start"]')
    await expect(page.locator('[data-testid="training-error"]')).toBeVisible({ timeout: 15000 })
    expect(plays[0]).toBe('e2e4,e7e5,g1f3,b8c6,f1c4,f8c5,e1g1,g8f6')
  })
})
