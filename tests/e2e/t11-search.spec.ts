// T11 Search and All assets (mocked PixelLab): "/", the empty panel, typing, scope, groups, Recent, the viewer and Back,
// the saved-only note, the All assets end and deep links.
import { expect, test, type Page } from '@playwright/test';
import { connect, mockPixelLab, settle, type Mock } from '../fixtures/pixellab-mock';

const field = (page: Page) => page.getByRole('searchbox', { name: 'Search' });
const panel = (page: Page) => page.locator('.glass-popover.panel');
const results = (page: Page) => panel(page).locator('.res a[data-key]');
const viewer = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
const noSideways = (page: Page) =>
  page.evaluate(() => [document.documentElement, ...document.querySelectorAll('main, .panel, .scroll')].every((el) => el.scrollWidth <= el.clientWidth));

async function start(page: Page, counts?: Parameters<typeof mockPixelLab>[1]): Promise<Mock> {
  const mock = await mockPixelLab(page, counts);
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  return mock;
}

/** Opens the search from the dock (the home pill or a grid's Search icon). */
async function openSearch(page: Page) {
  await page.locator('[data-search]').click();
  await expect(field(page)).toBeFocused();
}

test('"/" focuses an empty search on home, in a grid and on All assets, but not over Settings or the viewer', async ({ page }) => {
  await start(page);
  await page.keyboard.press('/');
  await expect(field(page)).toBeFocused();
  await expect(field(page)).toHaveValue('');
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Search your library' })).toBeFocused();

  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await expect(page.getByTitle('Character 1', { exact: true })).toBeVisible();
  await page.keyboard.press('/');
  await expect(field(page)).toBeFocused();
  await expect(field(page)).toHaveValue('');
  // Esc closes it even when focus fell to the page itself.
  await page.evaluate(() => (document.activeElement as HTMLElement).blur());
  await expect(field(page)).not.toBeFocused();
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);

  // Open the viewer from the grid and close it: "/" still lands in the field, not on the cell.
  await page.getByRole('link', { name: 'Character 2', exact: true }).click();
  await expect(viewer(page, 'Character 2')).toBeVisible();
  await page.keyboard.press('/');
  await expect(field(page)).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(viewer(page, 'Character 2')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Character 2', exact: true })).toBeFocused();
  await page.keyboard.press('/');
  await expect(field(page)).toBeFocused();
  await page.keyboard.press('Escape');

  await page.evaluate(() => (location.hash = '#/all'));
  await expect(page.locator('.crumb')).toHaveText('All assets283');
  await page.keyboard.press('/');
  await expect(field(page)).toBeFocused();
  await expect(field(page)).toHaveValue('');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Settings/ }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await page.keyboard.press('/');
  await expect(field(page)).toHaveCount(0);
});

test('phone basics: the Search button opens it, Cancel shows and closes it, nothing scrolls sideways', async ({ page, isMobile }) => {
  await start(page);
  await openSearch(page);
  const cancel = page.getByRole('button', { name: 'Cancel' });
  if (isMobile) {
    await expect(cancel).toBeVisible();
    expect(await noSideways(page)).toBe(true);
    await field(page).fill('object');
    expect(await noSideways(page)).toBe(true);
    await cancel.click();
    await expect(field(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Search your library' })).toBeFocused();
  } else {
    await expect(cancel).toBeHidden();
    await page.getByRole('button', { name: 'Library', exact: true }).click(); // the leading button
    await expect(field(page)).toHaveCount(0);
  }
});

test('empty field: Go to with counts, Recently added, Show all', async ({ page, isMobile }) => {
  await start(page);
  await openSearch(page);
  const rows = panel(page).locator('.gotos a');
  await expect(rows).toHaveText([/Characters\s*Type · 250/, /Objects\s*Type · 12/, /Tilesets & tiles\s*Type · 15/, /UI\s*Type · 6/]);
  await expect(panel(page).locator('.added a[data-key]')).toHaveCount(6);
  await expect(panel(page).locator('.added a[data-key]:visible')).toHaveCount(isMobile ? 3 : 6);
  // Newest first across families (the mock's Objects are newer than its Characters, which come first on screen); Object 4 is in review.
  await expect(panel(page).locator('.added a[data-key]')).toHaveText(['Object 1', 'Object 2', 'Object 3', 'Object 5', 'Object 6', 'Object 7']);

  // The heading takes focus after its text changes, so a screen reader reads the new screen.
  await page.evaluate(() => document.querySelector('h1')!.addEventListener('focus', (e) => ((window as unknown as { h1Said: string }).h1Said = (e.target as HTMLElement).textContent!), { once: true }));
  await rows.filter({ hasText: 'Objects' }).click();
  await expect(page).toHaveURL(/#\/c\/objects$/);
  await expect(field(page)).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 1, name: 'Objects' })).toBeFocused();
  expect(await page.evaluate(() => (window as unknown as { h1Said: string }).h1Said)).toBe('Objects');

  await page.getByRole('button', { name: 'Library' }).click();
  await openSearch(page);
  await panel(page).getByRole('link', { name: 'Show all 283 assets' }).click();
  await expect(page).toHaveURL(/#\/all$/);
  await expect(page.locator('.crumb')).toHaveText('All assets283');
  await expect(page.getByRole('heading', { level: 1, name: 'All assets' })).toBeFocused();
  // On All assets itself, Show all is not offered.
  await openSearch(page);
  await expect(panel(page).getByRole('link', { name: /^Show all/ })).toHaveCount(0);
});

test('typing: matching cells with the match in bold, accents ignored, cells keep their picture, lone state names ignored', async ({ page }) => {
  await start(page);
  await openSearch(page);
  await field(page).fill('object 1');
  await expect(results(page)).toHaveText(['Object 1', 'Object 10', 'Object 11', 'Object 12']);
  await expect(panel(page).getByText('4 results')).toBeVisible();
  await expect(results(page).first().locator('mark')).toHaveText(['Object', '1']);
  const keys = await results(page).evaluateAll((els) => els.map((e) => e.getAttribute('data-key')));

  await field(page).fill('öbject 1');
  await expect(results(page)).toHaveText(['Object 1', 'Object 10', 'Object 11', 'Object 12']);

  // The remaining cell is the same card with its own picture (keyed cells never reuse another card's picture).
  await field(page).fill('object 1');
  const last = results(page).last();
  await expect(last.locator('canvas')).toBeVisible();
  await field(page).fill('object 12');
  await expect(results(page)).toHaveText(['Object 12']);
  await expect(results(page)).toHaveAttribute('data-key', keys[3]!);
  await expect(results(page).locator('canvas')).toBeVisible();
  expect(await results(page).getAttribute('title')).toBe('Object 12');

  // An object's state name, and a lone character's "Idle", are neither shown nor searched (R6, live data).
  for (const q of ['open', 'base', 'idle']) {
    await field(page).fill(q);
    await expect(panel(page).getByRole('heading', { name: `No matches for "${q}".` })).toBeVisible();
  }
  await field(page).fill('character 1');
  await expect(results(page).first()).toHaveText('Character 1');
  await field(page).fill('object 5');
  await expect(results(page)).toHaveText(['Object 5']);

  // ✕ clears and keeps focus.
  await page.getByRole('button', { name: 'Clear search text' }).click();
  await expect(field(page)).toHaveValue('');
  await expect(field(page)).toBeFocused();
});

test('scope: a category searches only itself; Search all types widens it; Clear search empties the field', async ({ page }) => {
  await start(page);
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await openSearch(page);
  await expect(page.getByRole('button', { name: 'Back to Characters' })).toBeVisible();
  await field(page).fill('slime');
  await expect(panel(page).getByRole('heading', { name: 'No matches for "slime" in Characters.' })).toBeVisible();
  await expect(panel(page).getByText("Looking for fonts or effects? They aren't in PixelLab's public API yet.")).toBeVisible();
  await panel(page).getByRole('button', { name: 'Search all types' }).click();
  await expect(panel(page).getByRole('heading', { name: 'No matches for "slime".' })).toBeVisible();
  await expect(panel(page).getByRole('button', { name: 'Search all types' })).toHaveCount(0);
  await panel(page).getByRole('button', { name: 'Clear search' }).click();
  await expect(field(page)).toHaveValue('');
  await expect(field(page)).toBeFocused();
});

test('scope: a widened result opened from a category keeps the viewer open, and Esc returns to the search', async ({ page }) => {
  await start(page);
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await openSearch(page);
  await field(page).fill('object 1');
  await panel(page).getByRole('button', { name: 'Search all types' }).click();
  await results(page).filter({ hasText: 'Object 10' }).click();
  await expect(page).toHaveURL(/#\/c\/characters\/a\/[0-9a-f]{12}$/);
  await expect(viewer(page, 'Object 10')).toBeVisible();
  await page.waitForTimeout(800); // the open check is long over: a key it could not find would have closed the viewer
  await expect(viewer(page, 'Object 10')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer(page, 'Object 10')).toHaveCount(0);
  await expect(field(page)).toHaveValue('object 1');
  await expect(results(page).filter({ hasText: 'Object 10' })).toBeFocused();
});

test('groups: one cell per character, showing and opening the state that matched', async ({ page }) => {
  await start(page);
  await openSearch(page);
  await field(page).fill('armored');
  await expect(results(page)).toHaveText(['Character 7 · Armored']);
  await expect(results(page).locator('mark')).toHaveText('Armored');
  await results(page).click();
  await expect(viewer(page, 'Character 7').getByText('Character · Armored')).toBeVisible();
});

test('recent: Enter remembers, a chip refills the field, Clear empties it, gone after a reload', async ({ page }) => {
  await start(page);
  await openSearch(page);
  await field(page).fill('object 1');
  await field(page).press('Enter');
  await expect(results(page).first()).toBeFocused();
  await field(page).fill('');
  const chip = panel(page).getByRole('button', { name: 'object 1' });
  await expect(chip).toBeVisible();
  await chip.click();
  await expect(field(page)).toHaveValue('object 1');
  await expect(field(page)).toBeFocused();
  await field(page).fill('');
  await panel(page).getByRole('button', { name: 'Clear', exact: true }).click();
  await expect(panel(page).getByText('Recent', { exact: true })).toHaveCount(0);

  await field(page).fill('open');
  await field(page).press('Enter');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await openSearch(page);
  await expect(panel(page).getByText('Recent', { exact: true })).toHaveCount(0);
});

test('viewer from a result: Esc twice returns to the search, then to the dock; the grid keeps its scroll', async ({ page }) => {
  await start(page);
  await openSearch(page);
  await field(page).fill('object 1');
  await results(page).filter({ hasText: 'Object 10' }).click();
  await expect(page).toHaveURL(/#\/a\/[0-9a-f]{12}$/);
  await expect(viewer(page, 'Object 10')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer(page, 'Object 10')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
  await expect(field(page)).toHaveValue('object 1');
  await expect(results(page).filter({ hasText: 'Object 10' })).toBeFocused();
  // The same result again: focus comes back to it again.
  await page.keyboard.press('Enter');
  await expect(viewer(page, 'Object 10')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(results(page).filter({ hasText: 'Object 10' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Search your library' })).toBeFocused();

  // Same in a grid: the grid under the search keeps its scroll position.
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  const grid = page.locator('main.grid');
  await expect(page.getByTitle('Character 1', { exact: true })).toBeVisible();
  await grid.evaluate((el) => (el.scrollTop = 400));
  const top = await grid.evaluate((el) => el.scrollTop);
  await openSearch(page);
  await field(page).fill('character 2');
  await results(page).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(results(page).first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeFocused();
  expect(await grid.evaluate((el) => el.scrollTop)).toBe(top);
});

test('browser Back takes the same two steps, and from home the app stays open', async ({ page }) => {
  await start(page);
  await openSearch(page);
  await field(page).fill('object 1');
  await results(page).filter({ hasText: 'Object 11' }).click();
  await expect(viewer(page, 'Object 11')).toBeVisible();
  await page.goBack();
  await expect(viewer(page, 'Object 11')).toHaveCount(0);
  await expect(field(page)).toHaveValue('object 1');
  await expect(results(page).filter({ hasText: 'Object 11' })).toBeFocused();
  await page.goBack();
  await expect(field(page)).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Search your library' })).toBeFocused();
});

test('→ steps through the shown results and stops at the last one, with no list request', async ({ page }) => {
  const mock = await start(page);
  await openSearch(page);
  await field(page).fill('object 1');
  await results(page).filter({ hasText: 'Object 11' }).click();
  await expect(viewer(page, 'Object 11')).toBeVisible();
  const at = mock.hits.length;
  await page.keyboard.press('ArrowRight');
  await expect(viewer(page, 'Object 12')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  await expect(viewer(page, 'Object 12')).toBeVisible();
  expect(mock.hits.slice(at).filter((h) => h.list)).toEqual([]);
});

test('saved-only note: shown while a family is only partly saved', async ({ page }) => {
  await start(page); // 250 characters, 100 saved
  const note = () => panel(page).getByText('Only assets saved on this device are searched. Scroll through All assets to load the rest.');
  await openSearch(page);
  await field(page).fill('character 1');
  await expect(results(page).first()).toBeVisible();
  await expect(note()).toBeVisible();
  await field(page).fill('slime');
  await expect(note()).toBeVisible();
});

test('saved-only note: absent when a family has nothing saved (its first page failed)', async ({ page }) => {
  const mock = await mockPixelLab(page);
  mock.fail = ['/v2/objects?'];
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  await openSearch(page);
  await field(page).fill('character 1');
  await expect(results(page).first()).toBeVisible();
  await expect(panel(page).getByText(/^Only assets saved on this device/)).toHaveCount(0);
});

test("while searching, a failed family's notice shows in the panel instead of a silent No matches", async ({ page }) => {
  const mock = await mockPixelLab(page);
  mock.fail = ['/v2/objects?'];
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  await openSearch(page);
  await field(page).fill('object');
  await expect(panel(page).getByRole('heading', { name: 'No matches for "object".' })).toBeVisible();
  await expect(panel(page).getByText("Some assets didn't load")).toBeVisible();
});

test('while searching offline, the offline notice replaces the saved-only advice (scrolling cannot load now)', async ({ page, context }) => {
  await start(page); // 250 characters, 100 saved
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await context.setOffline(true);
  await page.locator('main.grid').evaluate((el) => el.scrollTo(0, el.scrollHeight)); // a next page, asked offline
  await expect(page.getByRole('status').filter({ hasText: "You're offline." })).toBeVisible();
  await openSearch(page);
  await field(page).fill('character 1');
  await expect(results(page).first()).toBeVisible();
  await expect(panel(page).getByText("You're offline. Showing your saved library.")).toBeVisible();
  await expect(panel(page).getByText(/^Only assets saved on this device/)).toHaveCount(0);
  await context.setOffline(false);
});

test('a count over 999 reads the same in Show all and the All assets crumb', async ({ page }) => {
  await start(page, { a: { characters: 1200 } });
  await openSearch(page);
  await panel(page).getByRole('link', { name: 'Show all 1,233 assets' }).click();
  await expect(page.locator('.crumb')).toHaveText('All assets1,233');
});

test('All assets: scrolling to the end shows "That\'s everything" and the note with its four links', async ({ page }) => {
  await start(page);
  await page.evaluate(() => (location.hash = '#/all'));
  const grid = page.locator('main.grid');
  const end = page.getByText("That's everything");
  await expect.poll(async () => (await grid.evaluate((el) => el.scrollTo(0, el.scrollHeight)), await end.count()), { timeout: 20_000 }).toBe(1);
  await end.scrollIntoViewIfNeeded();
  await expect(end).toBeVisible();
  const links = page.locator('.note a');
  await expect(links).toHaveCount(4);
  for (const l of await links.all()) await expect(l).toHaveAttribute('rel', 'noopener noreferrer');
});

test('deep links: #/all/a/<key> and #/a/<key> open the viewer; an unknown key closes to the screen', async ({ page }) => {
  const mock = await start(page);
  await page.getByRole('link', { name: 'Objects, 12' }).click();
  await page.getByRole('link', { name: 'Object 2', exact: true }).click();
  const key = /\/a\/([0-9a-f]{12})$/.exec(page.url())![1];
  await page.keyboard.press('Escape');

  await page.evaluate((k) => (location.hash = `#/all/a/${k}`), key);
  await page.reload();
  await expect(viewer(page, 'Object 2')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#\/all$/);

  await page.evaluate((k) => (location.hash = `#/a/${k}`), key);
  await page.reload();
  await expect(viewer(page, 'Object 2')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'PixelLab Backpack' })).toBeFocused(); // home has no cell to reveal

  await page.evaluate(() => (location.hash = '#/all/a/0123456789ab'));
  await page.reload();
  await settle(page, mock, 600);
  await expect(page).toHaveURL(/#\/all$/);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Go to lists Favorites and folders; typing keeps only matching folders; a folder row opens its overlay', async ({ page }) => {
  await start(page);
  // A favorite and an empty folder (made through the home tiles).
  await page.getByRole('link', { name: 'Objects, 12' }).click();
  await page.getByRole('link', { name: 'Object 2', exact: true }).click();
  await page.getByRole('button', { name: 'Favorite', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('button', { name: 'New folder' }).click();
  const dlg = page.getByRole('dialog', { name: 'New folder' });
  await dlg.getByRole('textbox', { name: 'Folder name' }).fill('Hero party');
  await dlg.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('dialog', { name: 'Hero party', exact: true }).getByRole('button', { name: 'Go to Library' }).click();
  await expect(page).toHaveURL(/#\/$/);

  await openSearch(page);
  const goto = panel(page).locator('.goto');
  await expect(goto.filter({ hasText: 'Favorites' }).locator('.glass-list__subtitle')).toHaveText('1 asset'); // singular (heavy test: it read "1 assets")
  await expect(goto.filter({ hasText: 'Favorites' }).locator('canvas, img')).not.toHaveCount(0);
  await expect(goto.filter({ hasText: 'Hero party' })).toContainText('Folder · 0');

  await field(page).fill('fav');
  await expect(goto).toHaveCount(1);
  await expect(goto.locator('mark')).toHaveText('Fav');

  await field(page).fill('hero');
  await expect(goto).toHaveCount(1);
  await expect(goto.locator('mark')).toHaveText('Hero');
  await expect(results(page)).toHaveCount(0);

  await goto.getByRole('link', { name: /Hero party/ }).click();
  await expect(page).toHaveURL(/#\/f\/[0-9a-f]{12}$/);
  await expect(field(page)).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Hero party', exact: true }).getByRole('heading', { name: 'Hero party', level: 2 })).toBeFocused();
});

test('a failed family shows the hint in the idle panel and in a typed panel after Search all types', async ({ page }) => {
  const mock = await mockPixelLab(page);
  mock.fail = ['/v2/tilesets?'];
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  const hint = panel(page).getByText("Some assets didn't load, so they can't be searched.");
  await openSearch(page);
  await expect(hint).toBeVisible();
  await page.keyboard.press('Escape');

  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await openSearch(page);
  await expect(hint).toHaveCount(0); // tilesets are not in this scope
  await field(page).fill('zzzz');
  await page.getByRole('button', { name: 'Search all types' }).click();
  await expect(hint).toBeVisible();
});

test('from Favorites the search covers everything and its leading button reads "Back to Favorites"', async ({ page }) => {
  await start(page);
  await page.getByRole('link', { name: 'Favorites, 0' }).click();
  await openSearch(page);
  await expect(page.getByRole('button', { name: 'Back to Favorites' })).toBeVisible();
  await expect(panel(page).locator('.goto').first()).toBeVisible(); // Go to shows: the scope is all
});
