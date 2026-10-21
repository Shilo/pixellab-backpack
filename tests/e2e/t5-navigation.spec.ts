// T5 Navigation (mocked PixelLab): home -> category -> scroll loads more -> back, by ‹ Library and by browser Back;
// no sideways scroll; the keyboard reaches every working control; inert controls do nothing.
import { expect, test, type Page } from '@playwright/test';
import { connect, mockPixelLab, settle } from '../fixtures/pixellab-mock';

const noSideways = (page: Page) =>
  page.evaluate(() => [document.documentElement, ...document.querySelectorAll('main')].every((el) => el.scrollWidth <= el.clientWidth));

const toBottom = (page: Page) => page.locator('main.grid').evaluate((el) => el.scrollTo(0, el.scrollHeight));

/** Names of the elements Tab visits, in order, until focus comes back round. */
async function tabStops(page: Page): Promise<string[]> {
  const names: string[] = [];
  await page.locator('body').focus();
  for (let i = 0; i < 30; i++) {
    await page.keyboard.press('Tab');
    const name = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el && el !== document.body ? (el.getAttribute('aria-label') ?? el.textContent ?? '').replace(/\s+/g, ' ').trim() : '';
    });
    if (!name || names.includes(name)) break;
    names.push(name);
  }
  return names;
}

test('home -> category -> more pages -> back home by ‹ Library and by browser Back', async ({ page }) => {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await expect(page.getByRole('link', { name: 'Objects, 12' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'UI, 6' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Tilesets & tiles, 15' })).toBeVisible();
  expect(await noSideways(page)).toBe(true);

  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await expect(page).toHaveURL(/#\/c\/characters$/);
  await expect(page.locator('.crumb')).toHaveText('Characters250');
  await expect(page.getByTitle('Character 1', { exact: true })).toBeVisible();
  await expect(page.getByTitle('Character 4', { exact: true })).toHaveCount(0); // still generating: hidden
  expect(await noSideways(page)).toBe(true);

  // Scrolling to the end asks for the next page, starting one row back; then the last one.
  const pages = () => mock.hits.filter((h) => h.url.includes('/v2/characters?') && !h.url.endsWith('offset=0')).map((h) => new URL(h.url).searchParams.get('offset'));
  await expect.poll(async () => (await toBottom(page), pages()), { timeout: 15_000 }).toEqual(['99', '198']);
  await toBottom(page);
  await expect(page.getByTitle('Character 250', { exact: true })).toBeVisible();
  expect(await noSideways(page)).toBe(true);

  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();

  await page.getByRole('link', { name: 'Objects, 12' }).click();
  await expect(page.getByTitle('Object 1', { exact: true })).toBeVisible();
  // A card with a state name shows it after the name ("Name · state"); the link is named by that whole line.
  const open = page.getByRole('link', { name: 'Object 5 · open', exact: true });
  await expect(open).toHaveAttribute('title', 'Object 5 · open');
  await expect(open.locator('small')).toHaveText('· open');
  await page.goBack();
  await expect(page.getByRole('link', { name: 'Objects, 12' })).toBeVisible();
  await expect(page).toHaveURL(/#\/$/);
});

test('jumping straight to the bottom of a multi-family grid asks the next page of each family scrolled past, once', async ({ page }) => {
  const mock = await mockPixelLab(page, { a: { tilesets: 150, isometric: 80, 'tiles-pro': 50 } }); // 100 tilesets saved; ~120 fully saved cells below them
  await page.goto('/');
  await connect(page);
  await page.getByRole('link', { name: /^Tilesets & tiles, / }).click();
  await expect(page.getByTitle('Tileset 1', { exact: true })).toBeVisible();
  await settle(page, mock, 600);
  const pages = () => mock.hits.filter((h) => h.url.includes('/v2/tilesets?') && !h.url.endsWith('offset=0')).length;
  expect(pages()).toBe(0);

  // The End key or a scrollbar drag lands past the tilesets' saved end without passing through it.
  await expect.poll(async () => (await toBottom(page), pages()), { timeout: 15_000 }).toBe(1);
  await settle(page, mock, 600);
  await toBottom(page);
  await settle(page, mock, 600);
  expect(pages()).toBe(1); // the family is now fully saved: no second ask
  expect(mock.hits.filter((h) => h.list && !h.url.endsWith('offset=0') && !h.url.includes('/v2/tilesets?'))).toEqual([]); // the others were already full
});

test('the keyboard reaches every working control; inert controls cause no request and no navigation', async ({ page }) => {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock);

  const home = await tabStops(page);
  for (const name of ['Characters, 250', 'Objects, 12', 'Tilesets & tiles, 15', 'UI, 6', 'More']) expect(home).toContain(name);

  // "…" opens the menu from the keyboard; Escape closes it.
  await page.getByRole('button', { name: 'More' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('menuitem', { name: /Refresh/ })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('menuitem', { name: /Activity/ })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu')).toHaveCount(0);

  // Search is real now (no "coming soon"); opening and closing it asks PixelLab nothing (its new cells may load pictures).
  const api = () => mock.hits.filter((h) => h.host === 'api').length;
  const before = api();
  await expect(page.getByRole('button', { name: /coming soon/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Search your library' }).click();
  await expect(page.getByRole('searchbox', { name: 'Search' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveCount(0);
  await page.waitForTimeout(600);
  expect(api()).toBe(before);

  await page.getByRole('link', { name: 'Objects, 12' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/c\/objects$/);
  await settle(page, mock);
  const cat = await tabStops(page);
  for (const name of ['Library', 'More']) expect(cat).toContain(name);

  const inCategory = mock.hits.length;
  await expect(page.getByRole('button', { name: 'Search, coming soon' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Search', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Select, coming soon', exact: true }).click({ force: true });
  await page.waitForTimeout(600);
  await expect(page).toHaveURL(/#\/c\/objects$/);
  expect(mock.hits.length).toBe(inCategory);

  await page.getByRole('button', { name: 'Library' }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/$/);
});

test('failed lists show a notice with Try again, which asks again once', async ({ page }) => {
  const mock = await mockPixelLab(page);
  mock.fail = ['/v2/objects?'];
  await page.goto('/');
  await connect(page);
  const partial = page.getByRole('status').filter({ hasText: "Some assets didn't load" });
  await expect(partial).toBeVisible();
  await expect(page.getByRole('link', { name: /^Objects, / })).toHaveCount(0);
  mock.fail = [];
  await partial.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('link', { name: 'Objects, 12' })).toBeVisible();
  await expect(partial).toHaveCount(0);

  // A failed next page: "Couldn't load more", no automatic retry, Try again loads it.
  mock.fail = ['/v2/characters?limit=100&offset=99'];
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await toBottom(page);
  const more = page.getByRole('status').filter({ hasText: "Couldn't load more" });
  await expect(more).toBeVisible();
  await settle(page, mock);
  const asked = mock.hits.length;
  await toBottom(page);
  await page.waitForTimeout(600);
  expect(mock.hits.length).toBe(asked);
  mock.fail = [];
  await more.getByRole('button', { name: 'Try again' }).click();
  await expect(more).toHaveCount(0);
  await expect.poll(() => mock.hits.filter((h) => h.url.includes('offset=99')).length).toBe(2);
});

test('a stop shows Try again, survives going offline and back, and Try again recovers without a reload', async ({ page, context }) => {
  test.setTimeout(60_000);
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await settle(page, mock);
  mock.mode = 'down';
  await toBottom(page);
  const stopped = page.getByRole('status').filter({ hasText: "PixelLab isn't answering right now." });
  await expect(stopped).toBeVisible({ timeout: 20_000 });
  // Offline, open Objects (pictures not seen yet fail), then come back online. Mocked routes still answer while
  // offline, so the picture failures are made explicit.
  const noNet = (route: import('@playwright/test').Route) => route.abort('internetdisconnected');
  await page.route('https://backblaze.pixellab.ai/**', noNet);
  await context.setOffline(true);
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('link', { name: 'Objects, 12' }).click();
  await page.waitForTimeout(800);
  await page.unroute('https://backblaze.pixellab.ai/**', noNet);
  await context.setOffline(false);
  await page.waitForTimeout(300);
  await expect(stopped).toBeVisible(); // still stopped: the way out stays on screen
  mock.mode = 'ok';
  const asked = mock.hits.length;
  await stopped.getByRole('button', { name: 'Try again' }).click();
  await expect(stopped).toHaveCount(0);
  await expect.poll(() => mock.hits.slice(asked).some((h) => h.url.includes('/v2/characters?limit=100&offset=99'))).toBe(true);
  await expect(page.getByRole('status').filter({ hasText: 'Try again' })).toHaveCount(0);
});

test('one failed picture leaves the library on screen', async ({ page }) => {
  const mock = await mockPixelLab(page);
  await page.route('https://backblaze.pixellab.ai/file/a/a-characters-0.png', (route) => route.abort('connectionreset'));
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await expect(page.getByRole('heading', { name: "Can't reach PixelLab right now." })).toHaveCount(0);
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await expect(page.getByTitle('Character 2', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: "Can't reach PixelLab right now." })).toHaveCount(0);
});

test('Esc pressed twice on an Activity panel opened by #activity closes it with one Back step only', async ({ page }) => {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await page.getByRole('link', { name: 'Objects, 12' }).click();
  await expect(page).toHaveURL(/#\/c\/objects$/);
  await settle(page, mock, 600);
  await page.evaluate(() => (location.hash = '#activity'));
  const panel = page.getByRole('dialog', { name: 'Activity' });
  await expect(panel).toBeVisible();
  // Two presses before the browser reports the first Back (a fast double tap or key repeat).
  await page.evaluate(() => {
    for (let i = 0; i < 2; i++) window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  });
  await expect(panel).toHaveCount(0);
  await page.waitForTimeout(300); // a second history step would land after the first
  await expect(page).toHaveURL(/#\/c\/objects$/);
  await expect(page.getByTitle('Object 1', { exact: true })).toBeVisible();
});
