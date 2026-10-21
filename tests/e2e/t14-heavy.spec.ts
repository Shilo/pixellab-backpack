// T14 Phase 4 heavy-test regressions (mocked PixelLab): each test pins a bug found while testing favorites and folders hard.
import { expect, test, type Page } from '@playwright/test';
import { ageSaved, connect, mockPixelLab, seedOrg, settle } from '../fixtures/pixellab-mock';

const h1 = (page: Page) => page.locator('h1');

async function start(page: Page) {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  return mock;
}

test('after a route change focus lands on the new screen heading, never on <body>', async ({ page }) => {
  await start(page);
  const onH1 = async (text: string) => {
    await expect(h1(page)).toHaveText(text);
    await expect(h1(page)).toBeFocused();
  };
  await page.getByRole('link', { name: /^Characters, / }).click(); // a tile
  await onH1('Characters');
  await page.getByRole('button', { name: 'Library' }).click(); // the dock's ‹ Library
  await onH1('PixelLab Backpack');
  await page.getByRole('link', { name: 'Favorites, 0' }).click();
  await onH1('Favorites');
  await page.goBack(); // browser Back
  await onH1('PixelLab Backpack');
  await page.goForward();
  await onH1('Favorites');

  // The viewer keeps focus itself: → with focus on <body> swaps the key and never moves focus behind it to the page heading.
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('link', { name: /^Objects, / }).click();
  await page.getByRole('link', { name: 'Object 2', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Object 2', exact: true })).toBeVisible();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('dialog', { name: 'Object 3', exact: true })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(h1(page)).not.toBeFocused();
});

test("Unfavorite from a cell's menu in Favorites: the cell goes and focus lands on the heading, not <body>", async ({ page }) => {
  await start(page);
  await seedOrg(page, { favorites: ['Object 2', 'Object 3'], folders: [] });
  await page.reload();
  await page.getByRole('link', { name: 'Favorites, 2' }).click();
  const cells = page.locator('main.grid a.cell');
  await expect(cells).toHaveCount(2);
  await cells.first().focus();
  await page.keyboard.press('Shift+F10');
  await page.getByRole('menuitem', { name: 'Unfavorite' }).click();
  await expect(cells).toHaveCount(1);
  await expect(h1(page)).toBeFocused();
});

test("Forget key in another tab closes this tab's open card menu: no asset stays on screen over the key screen", async ({ page, context }) => {
  const mock = await mockPixelLab(context);
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  const tab = await context.newPage();
  await tab.goto('/');
  await connect(tab); // its own tab-only copy of the key
  await tab.getByRole('link', { name: /^Objects, / }).click();
  await tab.getByRole('link', { name: 'Object 2', exact: true }).focus();
  await tab.keyboard.press('Shift+F10');
  await tab.getByRole('menuitem', { name: 'Add to folder…' }).click();
  await expect(tab.getByRole('dialog', { name: 'Add to folder' })).toBeVisible();

  await page.bringToFront(); // a background tab throttles its frames, so actions wait
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Settings/ }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Forget key' }).click();
  await page.getByRole('dialog', { name: 'Forget your API key?' }).getByRole('button', { name: 'Forget key' }).click();
  await tab.bringToFront();
  await expect(tab.getByLabel('PixelLab API key')).toBeVisible();
  await expect(tab.locator('dialog[open]')).toHaveCount(0);
  await expect(tab.getByText('Object 2')).toHaveCount(0);
});

test('a favorited character state deleted in PixelLab: the live base cell shows no heart, as Favorites leaves it out (R3, R7)', async ({ page }) => {
  const mock = await mockPixelLab(page, { a: { characters: 20 } }); // one page: the family is fully saved
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  await page.locator('[data-search]').click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('armored');
  await page.locator('.res a[data-key]').click();
  await page.getByRole('button', { name: 'Favorite', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Favorite', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await settle(page, mock, 600);

  mock.counts.a.characters = 7; // row 7, "Character 7 · Armored", is deleted in PixelLab; its base row 6 stays
  await ageSaved(page, 'characters', { checkedMs: 2 * 3_600_000 });
  await page.goto('/#/');
  await page.reload();
  await expect(page.getByRole('link', { name: 'Characters, 7' })).toBeVisible();
  await settle(page, mock, 600);
  await expect(page.getByRole('link', { name: 'Favorites, 0' })).toBeVisible();
  await page.getByRole('link', { name: 'Characters, 7' }).click();
  const base = page.locator('main.grid a.cell', { hasText: 'Character 7' });
  await expect(base).toHaveCount(1);
  await expect(base).not.toHaveAttribute('aria-label', /favorite/);
  await base.click();
  await expect(page.getByRole('button', { name: 'Favorite', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test('browser Back while a search result’s card menu is open closes the search and the menu with it', async ({ page }) => {
  await start(page);
  await page.locator('[data-search]').click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('object 2');
  const result = page.locator('.res a[data-key]').first();
  await result.focus();
  await page.keyboard.press('Shift+F10');
  await expect(page.locator('dialog.cm[open]')).toHaveCount(1);
  await page.goBack(); // off the search's own history entry: same address, no hashchange
  await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveCount(0);
  await expect(page.locator('dialog.cm[open]')).toHaveCount(0);
});

test('a 401 keeps favorites and folders on the device; reconnecting the same key brings them back (R4)', async ({ page }) => {
  const mock = await start(page);
  await seedOrg(page, { favorites: ['Object 2'], folders: [{ name: 'Hero party', items: ['Object 3'] }] });
  await ageSaved(page, 'characters', { checkedMs: 2 * 3_600_000 });
  await page.route('https://api.pixellab.ai/v2/characters?**', (r) =>
    r.fulfill({ status: 401, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization' } }),
  );
  await page.reload();
  await expect(page.getByLabel('PixelLab API key')).toBeVisible();
  await settle(page, mock, 600);
  await page.unroute('https://api.pixellab.ai/v2/characters?**');
  await connect(page);
  await expect(page.getByRole('link', { name: 'Hero party, 1' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Favorites, 1' })).toBeVisible();
});
