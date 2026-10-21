// T12 Phase 3 edge cases (mocked PixelLab): search under a slow or failed check, Forget key in another tab and Refresh,
// odd names, deep links and history, Esc order, All assets with a failed family, and design sizes.
import { expect, test, type Page } from '@playwright/test';
import { connect, mockPixelLab, settle, type Mock } from '../fixtures/pixellab-mock';

const field = (page: Page) => page.getByRole('searchbox', { name: 'Search' });
const panel = (page: Page) => page.locator('.glass-popover.panel');
const results = (page: Page) => panel(page).locator('.res a[data-key]');
const viewer = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });

async function start(page: Page, counts?: Parameters<typeof mockPixelLab>[1]): Promise<Mock> {
  const mock = await mockPixelLab(page, counts);
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  return mock;
}
async function openSearch(page: Page) {
  await page.locator('[data-search]').click();
  await expect(field(page)).toBeFocused();
}

test('"/" typed in the key field stays in the field', async ({ page }) => {
  await mockPixelLab(page);
  await page.goto('/');
  const key = page.getByLabel('PixelLab API key');
  await key.click();
  await page.keyboard.type('ab/cd');
  await expect(key).toHaveValue('ab/cd');
  await expect(field(page)).toHaveCount(0);
});

test('a 429 during the first check: the search says it is still checking, not "No matches"', async ({ page }) => {
  await mockPixelLab(page);
  // Objects answers 429: the open check's Objects page waits out PixelLab's pause (status "slowed"), nothing saved for it.
  await page.route('https://api.pixellab.ai/v2/objects?**', (r) =>
    r.request().method() === 'OPTIONS' ? r.fallback() : r.fulfill({ status: 429, headers: { 'access-control-allow-origin': '*' } }),
  );
  await page.goto('/');
  await connect(page);
  await openSearch(page);
  await expect.poll(() => page.evaluate(() => document.querySelector('.vt-notice') === null)).toBe(true); // the notice gives way to the panel
  await field(page).fill('zzz');
  await expect(panel(page).getByText('Checking for new assets…')).toBeVisible();
  await expect(panel(page).getByRole('heading', { name: /^No matches/ })).toHaveCount(0);
});

test('Forget key in another tab closes the search and drops Recent; signing in again starts clean', async ({ page, context }) => {
  const mock = await mockPixelLab(context);
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  const tab = await context.newPage();
  await tab.goto('/');
  await connect(tab);
  await settle(tab, mock, 600);

  // Each tab is brought to the front before it is used: a background tab throttles its frames, so actions wait.
  await page.bringToFront();
  await openSearch(page);
  await field(page).fill('object 1');
  await field(page).press('Enter');
  await field(page).fill('object');
  await tab.bringToFront();
  await tab.getByRole('button', { name: 'More' }).click();
  await tab.getByRole('menuitem', { name: /Settings/ }).click();
  await tab.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Forget key' }).click();
  await tab.getByRole('dialog', { name: 'Forget your API key?' }).getByRole('button', { name: 'Forget key' }).click();

  await page.bringToFront();
  await expect(page.getByLabel('PixelLab API key')).toBeVisible();
  await expect(field(page)).toHaveCount(0);
  await connect(page);
  await openSearch(page);
  await expect(field(page)).toHaveValue('');
  await expect(panel(page).getByText('Recent', { exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^Characters, / })).toBeVisible();
});

test('after Refresh finds new assets, the search shows them', async ({ page }) => {
  const mock = await start(page);
  await openSearch(page);
  await field(page).fill('object 1');
  await expect(results(page)).toHaveText(['Object 1', 'Object 10', 'Object 11', 'Object 12']);
  await page.keyboard.press('Escape');
  mock.counts.a.objects = 16; // Object 14 (row 13) is still generating
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Refresh/ }).click();
  await settle(page, mock, 600);
  await openSearch(page);
  await field(page).fill('object 1');
  await expect(results(page)).toHaveText(['Object 1', 'Object 10', 'Object 11', 'Object 12', 'Object 13', 'Object 15', 'Object 16']);
  await expect(results(page).last()).toHaveAttribute('title', 'Object 16');
  await expect(results(page).last().locator('canvas')).toBeVisible();
});

test('odd names: emoji, accents, non-Latin, regex characters and very long names match, highlight and fit', async ({ page }) => {
  const long = `Ancient banner ${'very '.repeat(40)}long`; // names are kept to 60 code points (families.ts)
  const names = ['🐉 Dragon egg', 'Café sign', 'Дракон', '龍の旗', 'a.b(c)*[d]', long];
  await page.route('https://api.pixellab.ai/v2/ui-assets?**', (r) =>
    r.request().method() === 'OPTIONS'
      ? r.fallback()
      : r.fulfill({
          headers: { 'access-control-allow-origin': '*' },
          contentType: 'application/json',
          body: JSON.stringify({
            ui_assets: names.map((name, i) => ({ id: `a-ui-x${i}`, name, status: 'completed', created_at: '2026-01-01T00:00:00Z', image_url: `https://backblaze.pixellab.ai/file/a/ui-x${i}.png` })),
            total: names.length,
          }),
        }),
  );
  await start(page);
  await openSearch(page);
  const one = async (q: string, name: string, mark: string) => {
    await field(page).fill(q);
    await expect(results(page)).toHaveCount(1);
    await expect(results(page)).toHaveAttribute('title', name);
    await expect(results(page).locator('mark')).toHaveText(mark);
  };
  await one('🐉', '🐉 Dragon egg', '🐉');
  await one('CAFE', 'Café sign', 'Café');
  await one('café', 'Café sign', 'Café'); // a decomposed é typed
  await one('дРаК', 'Дракон', 'Драк');
  await one('龍', '龍の旗', '龍');
  await one('(c)*[', 'a.b(c)*[d]', '(c)*[');
  await one('banner', long.slice(0, 60), 'banner');
  await field(page).fill('.*');
  await expect(panel(page).getByRole('heading', { name: 'No matches for ".*".' })).toBeVisible();
  await field(page).fill('very very');
  await expect(results(page)).toHaveCount(1);
  expect(await page.evaluate(() => [document.documentElement, ...document.querySelectorAll('.panel, .scroll, .res')].every((el) => el.scrollWidth <= el.clientWidth))).toBe(true);
});

test('one letter: at most 100 cells, the cap line, and → stops at the 100th', async ({ page }) => {
  const mock = await start(page);
  await openSearch(page);
  await field(page).fill('e');
  await expect(results(page)).toHaveCount(100);
  const count = await panel(page).locator('.gh .glass-list__section-header').last().innerText();
  expect(Number(count.replace(/\D/g, ''))).toBeGreaterThan(100);
  await expect(panel(page).getByText('Showing the first 100. Type more words to narrow it down.')).toBeVisible();
  const lastName = (await results(page).last().getAttribute('title'))!;
  await results(page).last().click();
  await expect(viewer(page, lastName)).toBeVisible();
  const at = mock.hits.length;
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  await expect(viewer(page, lastName)).toBeVisible();
  expect(mock.hits.slice(at).filter((h) => h.list)).toEqual([]);
});

test('history: search → result → Back → Back → Forward → Forward, then Esc; the app never leaves', async ({ page }) => {
  await start(page);
  await openSearch(page);
  await field(page).fill('object 1');
  await results(page).filter({ hasText: 'Object 10' }).click();
  await expect(viewer(page, 'Object 10')).toBeVisible();
  await page.goBack();
  await expect(viewer(page, 'Object 10')).toHaveCount(0);
  await page.goBack();
  await expect(field(page)).toHaveCount(0);
  await page.goForward();
  await expect(page).toHaveURL(/#\/$/);
  await page.goForward();
  await expect(viewer(page, 'Object 10')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer(page, 'Object 10')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await page.keyboard.press('/');
  await expect(field(page)).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
});

test('deep links: bad and unknown keys on every screen, reloaded, land on the screen', async ({ page }) => {
  const mock = await start(page);
  for (const [hash, crumb] of [
    ['#/a/toString', null],
    ['#/a/0123456789AB', null],
    ['#/all/a/0123456789a', 'All assets283'],
    ['#/all/a/0123456789ab', 'All assets283'],
    ['#/c/objects/a/0123456789ab', 'Objects12'],
  ] as const) {
    await page.evaluate((h) => (location.hash = h), hash);
    await page.reload();
    await settle(page, mock, 400);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    if (crumb) await expect(page.locator('.crumb')).toHaveText(crumb);
    else await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  }
});

test('Esc order over a viewer opened from the search: picker, menu, Info, viewer, then the search', async ({ page }) => {
  await start(page);
  await openSearch(page);
  await field(page).fill('character 1');
  await results(page).first().click();
  const v = viewer(page, 'Character 1');
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await v.locator('.vt-chip').click();
  await expect(page.getByRole('dialog', { name: 'Animation, state and direction' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Animation, state and direction' })).toHaveCount(0);
  await expect(v).toBeVisible();
  await v.getByRole('button', { name: 'More' }).click();
  await expect(page.getByRole('dialog', { name: 'Viewer options' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Viewer options' })).toHaveCount(0);
  await expect(v).toBeVisible();
  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await expect(v.getByRole('complementary', { name: 'Info' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(v.getByRole('complementary', { name: 'Info' })).toHaveCount(0);
  await expect(v).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);
  await expect(field(page)).toHaveValue('character 1');
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);
});

test("All assets with a family whose first page failed: no end line, no false \"That's everything\"", async ({ page }) => {
  const mock = await mockPixelLab(page, { a: { characters: 40 } });
  mock.fail = ['/v2/ui-assets?'];
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  await page.evaluate(() => (location.hash = '#/all'));
  const grid = page.locator('main.grid');
  await expect(page.getByTitle('Character 1', { exact: true })).toBeVisible();
  for (let i = 0; i < 5; i++) {
    await grid.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    await page.waitForTimeout(200);
  }
  await settle(page, mock, 600);
  await expect(page.getByTitle('Pro tile 3', { exact: true })).toBeVisible();
  await expect(page.getByText("That's everything")).toHaveCount(0);
  await expect(page.locator('.note a')).toHaveCount(0);
});

test('All assets: jump to the bottom loads the partial family, and closing a viewer restores the scroll and focus', async ({ page }) => {
  const mock = await start(page);
  await page.evaluate(() => (location.hash = '#/all'));
  const grid = page.locator('main.grid');
  await expect(page.getByTitle('Character 1', { exact: true })).toBeVisible();
  await settle(page, mock, 600);
  const at = mock.hits.length;
  const end = page.getByText("That's everything");
  await expect.poll(async () => (await grid.evaluate((el) => el.scrollTo(0, el.scrollHeight)), await end.count()), { timeout: 30_000 }).toBe(1);
  expect(mock.hits.slice(at).filter((h) => h.list).map((h) => new URL(h.url).pathname)).toEqual(['/v2/characters', '/v2/characters']);

  // The last page can land between the poll's scroll and its count: the grid then sits at the old bottom, and the cells
  // below it are not in the page (only rows on screen are). Everything is loaded now, so one more scroll is the real bottom.
  await grid.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  const cell = page.getByTitle('Iso tile 2', { exact: true }); // near the end, so on screen
  await cell.scrollIntoViewIfNeeded();
  const top = await grid.evaluate((el) => el.scrollTop);
  await cell.click();
  await expect(viewer(page, 'Iso tile 2')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(viewer(page, 'Iso tile 2')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/all$/);
  await expect(cell).toBeFocused();
  expect(await grid.evaluate((el) => el.scrollTop)).toBe(top);
});

test('viewer on All assets: → at the last saved character whose next page fails stays put (no card skipped)', async ({ page }) => {
  const mock = await start(page);
  await openSearch(page);
  await field(page).fill('character 100');
  const key = await results(page).getAttribute('data-key');
  await page.keyboard.press('Escape');
  await page.evaluate((k) => (location.hash = `#/all/a/${k}`), key);
  await expect(viewer(page, 'Character 100')).toBeVisible();
  await settle(page, mock, 600);
  mock.fail = ['/v2/characters?'];
  const at = mock.hits.length;
  await page.keyboard.press('ArrowRight');
  await settle(page, mock, 600);
  await expect(viewer(page, 'Character 100')).toBeVisible();
  expect(mock.hits.slice(at).filter((h) => h.list)).toHaveLength(1);
});

test('design sizes: Open in PixelLab is a small button (44 px); the phone field pads for ✕ only while it shows', async ({ page, isMobile }) => {
  await start(page);
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await page.getByRole('link', { name: 'Character 1', exact: true }).click();
  const v = viewer(page, 'Character 1');
  await v.getByRole('button', { name: 'Info', exact: true }).click();
  const open = v.getByRole('link', { name: /^Open in PixelLab/ });
  await expect(open).toBeVisible();
  expect(Math.round((await open.boundingBox())!.height)).toBe(44);
  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);

  await openSearch(page);
  const pad = () => field(page).evaluate((el) => getComputedStyle(el).paddingInlineEnd);
  expect(await pad()).toBe(isMobile ? '16px' : '44px');
  await field(page).fill('object');
  await expect(page.locator('search .clear')).toBeVisible();
  await expect.poll(pad).toBe(isMobile ? '50px' : '90px');
});

test('Back closes a search opened over a leftover search entry (after Go to and Back, or a reload)', async ({ page }) => {
  await start(page);
  await openSearch(page);
  await panel(page).locator('.gotos a').filter({ hasText: 'Objects' }).click();
  await expect(page).toHaveURL(/#\/c\/objects$/);
  await page.goBack(); // onto the search's leftover entry: home, no search
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await expect(field(page)).toHaveCount(0);
  await openSearch(page);
  await page.goBack();
  await expect(field(page)).toHaveCount(0);

  await openSearch(page);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await openSearch(page);
  await page.goBack();
  await expect(field(page)).toHaveCount(0);
});

test('IME: Enter and Esc while composing (Japanese, Chinese input) stay in the field', async ({ page }) => {
  await start(page);
  await openSearch(page);
  await field(page).fill('object');
  const press = (key: string) =>
    field(page).evaluate((el, key) => el.dispatchEvent(new KeyboardEvent('keydown', { key, isComposing: true, bubbles: true, cancelable: true })), key);
  await press('Enter');
  await press('Escape');
  await expect(field(page)).toBeFocused();
  await expect(field(page)).toHaveValue('object');
  await field(page).fill('');
  await expect(panel(page).getByText('Recent', { exact: true })).toHaveCount(0); // the composing Enter remembered nothing
});

test('a very long query with no spaces fits the no-results card and its Recent chip (nothing scrolls sideways)', async ({ page }) => {
  await start(page);
  await openSearch(page);
  await field(page).fill('x'.repeat(300));
  await expect(panel(page).getByRole('heading', { name: /^No matches for "x+"\.$/ })).toBeVisible();
  expect(await page.evaluate(() => [document.documentElement, ...document.querySelectorAll('.panel, .scroll, .none')].every((el) => el.scrollWidth <= el.clientWidth))).toBe(true);
  // The same query as a Recent chip.
  await field(page).press('Enter');
  await field(page).fill('');
  await expect(panel(page).locator('.recent button')).toHaveCount(1);
  expect(await page.evaluate(() => [document.documentElement, ...document.querySelectorAll('.panel, .scroll, .recent')].every((el) => el.scrollWidth <= el.clientWidth))).toBe(true);
});
