// T13 Favorites (mocked PixelLab): the viewer's ♡, the heart on cells, the home tile, the Favorites page and its empty state,
// character groups, snapshots after the deep pages expired, and the search from Favorites.
import { expect, test, type Page } from '@playwright/test';
import { ageSaved, connect, mockPixelLab, settle, type Mock } from '../fixtures/pixellab-mock';

const viewer = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
const heart = (page: Page) => page.getByRole('button', { name: 'Favorite', exact: true });
const said = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });
const field = (page: Page) => page.getByRole('searchbox', { name: 'Search' });
const results = (page: Page) => page.locator('.glass-popover.panel .res a[data-key]');
const api = (mock: Mock) => mock.hits.filter((h) => h.host === 'api').length;
const toBottom = (page: Page) => page.locator('main.grid').evaluate((el) => el.scrollTo(0, el.scrollHeight));
const HOUR = 3_600_000;

/** True when Chromium's own accessibility tree exposes this text (not hidden by a modal or inert layer), as a screen reader gets it. */
async function exposed(page: Page, text: string): Promise<boolean> {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: { ignored: boolean; name?: { value?: unknown } }[] };
  await cdp.detach();
  return nodes.some((n) => !n.ignored && String(n.name?.value ?? '').includes(text));
}

async function start(page: Page, groups?: number[][]): Promise<Mock> {
  const mock = await mockPixelLab(page);
  if (groups) mock.groups = groups;
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  return mock;
}

async function openFavorites(page: Page, count: number) {
  await page.getByRole('link', { name: `Favorites, ${count}` }).click();
  await expect(page).toHaveURL(/#\/fav$/);
}

test('the viewer ♡ favorites a character everywhere, opening Favorites asks PixelLab nothing, and ♡ again removes it', async ({ page }) => {
  const mock = await start(page);
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await page.getByRole('link', { name: 'Character 1', exact: true }).click();
  const v = viewer(page, 'Character 1');
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'false');
  await heart(page).click();
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(said(page, 'Added to Favorites.')).toBeAttached();
  await expect.poll(() => exposed(page, 'Added to Favorites.')).toBe(true); // the live region is read while the viewer is open
  expect(await exposed(page, 'Character 2')).toBe(false); // while the inert grid under it is not (the check can tell)
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);
  const cell = page.getByRole('link', { name: 'Character 1, favorite', exact: true });
  await expect(cell.locator('.fav')).toBeVisible();

  await page.getByRole('button', { name: 'Library' }).click();
  await settle(page, mock, 600);
  const before = api(mock);
  await openFavorites(page, 1);
  await expect(page.locator('h1')).toHaveText('Favorites');
  await expect(page.locator('.crumb')).toHaveText('Favorites1');
  await expect(page.locator('main.grid a.cell')).toHaveCount(1);
  await expect(cell).toBeVisible();
  await settle(page, mock, 600);
  expect(api(mock)).toBe(before); // pictures seen once: 0 API requests

  await cell.click();
  await heart(page).click();
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(said(page, 'Removed from Favorites.')).toBeAttached();
  await expect(v).toBeVisible(); // still a live card: the viewer stays
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'No favorites yet.' })).toBeVisible();
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page.getByRole('link', { name: 'Favorites, 0' })).toBeVisible();
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await expect(page.getByRole('link', { name: 'Character 1', exact: true })).toBeVisible();
  await expect(page.locator('a.cell .fav')).toHaveCount(0);
});

test('a grouped character: favoriting its Armored state marks the group cell, and Favorites shows one cell', async ({ page }) => {
  await start(page);
  await page.locator('[data-search]').click();
  await field(page).fill('armored');
  await results(page).click();
  const v = viewer(page, 'Character 7');
  await expect(v.getByText('Character · Armored')).toBeVisible();
  await heart(page).click();
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);

  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await expect(page.getByRole('link', { name: 'Character 7, favorite', exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: 'Library' }).click();
  await openFavorites(page, 1);
  await expect(page.locator('main.grid a.cell')).toHaveCount(1);
  await expect(page.getByRole('link', { name: 'Character 7, favorite', exact: true })).toBeVisible();
});

test('empty Favorites says so; favorites survive a reload; the heading reads Favorites', async ({ page }) => {
  await start(page);
  await openFavorites(page, 0);
  await expect(page.getByRole('heading', { name: 'No favorites yet.' })).toBeVisible();
  await expect(page.getByText('Use the heart on any asset to keep it here.')).toBeVisible();
  await expect(page.locator('h1')).toHaveText('Favorites');
  await expect(page.locator('.crumb')).toHaveText('Favorites0');

  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('link', { name: 'Objects, 12' }).click();
  await page.getByRole('link', { name: 'Object 2', exact: true }).click();
  await heart(page).click();
  await expect(said(page, 'Added to Favorites.')).toBeAttached();
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('link', { name: 'Object 2, favorite', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Library' }).click();
  await openFavorites(page, 1);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Object 2, favorite', exact: true })).toBeVisible();
  await expect(page.locator('h1')).toHaveText('Favorites');
});

test('favorites from page 2 still show after the deep pages expired; a snapshot-only group state keeps its heart; unfavoriting keeps the viewer open', async ({ page }) => {
  const mock = await start(page, [[6, 7], [8, 160]]); // row 160 is "Character 9 · Armored", row 8 its base on page 1
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  const deep = () => mock.hits.some((h) => h.url.includes('/v2/characters?') && h.url.endsWith('offset=99'));
  await expect.poll(async () => (await toBottom(page), deep()), { timeout: 15_000 }).toBe(true);
  await settle(page, mock, 600);
  await page.locator('[data-search]').click();
  await field(page).fill('character 151');
  await results(page).filter({ hasText: 'Character 151' }).click();
  await heart(page).click();
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);
  await page.locator('[data-search]').click();
  await field(page).fill('armored');
  await results(page).filter({ hasText: 'Character 9' }).click();
  await expect(viewer(page, 'Character 9').getByText('Character · Armored')).toBeVisible();
  await heart(page).click();
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);
  await settle(page, mock, 600);

  await ageSaved(page, 'characters', { checkedMs: 2 * HOUR, deepMs: 8 * 24 * HOUR });
  await page.reload();
  await page.getByRole('button', { name: 'Library' }).click();
  await settle(page, mock, 600);
  await openFavorites(page, 2);
  const cell = page.getByRole('link', { name: 'Character 151, favorite', exact: true });
  await expect(cell).toBeVisible();
  expect(mock.hits.filter((h) => h.url.includes('offset=99')).length).toBe(1); // a snapshot, never a list page

  // The Armored state is snapshot-only now: its live base cell still carries the heart, and the ♡ removes the favorite.
  const group = page.getByRole('link', { name: 'Character 9, favorite', exact: true });
  await expect(group.locator('.fav')).toBeVisible();
  await group.click();
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'true');
  await heart(page).click();
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('main.grid a.cell')).toHaveCount(1);
  await expect(page.locator('.crumb')).toHaveText('Favorites1');

  await cell.click();
  const v = viewer(page, 'Character 151');
  await expect(v).toBeVisible();
  await heart(page).click();
  await expect(heart(page)).toHaveAttribute('aria-pressed', 'false');
  await expect(said(page, 'Removed from Favorites.')).toBeAttached();
  await page.waitForTimeout(500);
  await expect(v).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('heading', { name: 'No favorites yet.' })).toBeVisible();
});

test('the search from Favorites opens a result in the viewer, and ←/→ step through the results', async ({ page }) => {
  await start(page);
  await openFavorites(page, 0);
  await page.locator('[data-search]').click();
  await field(page).fill('object 1');
  await results(page).filter({ hasText: 'Object 11' }).click();
  await expect(viewer(page, 'Object 11')).toBeVisible();
  await expect(page).toHaveURL(/#\/fav\/a\/[0-9a-f]{12}$/);
  await page.keyboard.press('ArrowRight');
  await expect(viewer(page, 'Object 12')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(viewer(page, 'Object 11')).toBeVisible();
});
