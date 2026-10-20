// T6 Request counter (mocked PixelLab): proves how few requests the app sends.
import { expect, test, type Page } from '@playwright/test';
import { GOOD_KEY, OTHER_KEY, connect, deviceStorage, mockPixelLab, settle, type Hit, type Mock } from '../fixtures/pixellab-mock';

const api = (hits: Hit[]) => hits.filter((h) => h.host === 'api');
const lists = (hits: Hit[]) => hits.filter((h) => h.list);
const ids = (url: string) => url.match(/\b[ab]-(?:characters|objects|ui|tilesets-side|tilesets|isometric|tiles-pro)-\d+/g) ?? [];

async function openFirst(page: Page): Promise<Mock> {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  return mock;
}

test('first open: 7 list requests (+ at most 4 tileset helpers); GET only; no key in a URL; nothing for unfinished rows', async ({ page }) => {
  const mock = await openFirst(page);
  expect(lists(mock.hits)).toHaveLength(7);
  expect(api(mock.hits).length - 7).toBeLessThanOrEqual(4);

  // Every grid on screen too, so unfinished rows have every chance to be asked for.
  for (const name of [/^Characters, /, /^Objects, /, /^Tilesets & tiles, /, /^UI, /]) {
    await page.getByRole('link', { name }).click();
    await settle(page, mock);
    await page.getByRole('button', { name: 'Library' }).click();
  }
  expect(mock.hits.length).toBeGreaterThan(7);
  expect(mock.hits.filter((h) => h.method !== 'GET')).toEqual([]);
  expect(mock.hits.filter((h) => h.url.includes(GOOD_KEY))).toEqual([]);
  const unfinished = new Set(mock.unfinishedIds);
  expect(mock.hits.filter((h) => ids(h.url).some((id) => unfinished.has(id)))).toEqual([]);
});

test('every request shows up exactly once in the Activity panel', async ({ page }) => {
  const mock = await openFirst(page);
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Activity/ }).click();
  const panel = page.getByRole('dialog', { name: 'Activity' });
  await expect(panel).toBeVisible();
  const sent = mock.hits.filter((h) => !h.redirected); // a helper's redirect is one request from the app
  await expect(panel.getByText(`${sent.length} requests, newest first`)).toBeVisible();
  await expect(panel.locator('.log li')).toHaveCount(sent.length);
  await expect(panel.locator('.log li', { hasText: 'PixelLab API' })).toHaveCount(api(sent).length);
  await expect(panel.locator('.log li', { hasText: 'Image host' })).toHaveCount(sent.length - api(sent).length);
  await expect(panel.locator('.counters')).toContainText(`API requests this session${api(sent).length}`);
  await expect(panel).not.toContainText(GOOD_KEY);
  await expect(panel).not.toContainText('pixellab.ai');
  for (const id of new Set(mock.hits.flatMap((h) => ids(h.url)))) await expect(panel).not.toContainText(id);
});

test('reload within the hour sends 0 API requests; Activity counts the 7 avoided; #activity opens it over the screen', async ({ page }) => {
  const mock = await openFirst(page);
  const at = mock.hits.length;
  await page.reload();
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await settle(page, mock);
  expect(api(mock.hits.slice(at))).toEqual([]);

  await page.evaluate(() => (location.hash = '#activity'));
  const panel = page.getByRole('dialog', { name: 'Activity' });
  await expect(panel.locator('.counters div', { hasText: 'Requests avoided by the saved copy' })).toContainText('7');
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeAttached(); // the home stays underneath
  await panel.getByRole('button', { name: 'Close' }).click();
  await expect(panel).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
});

test('a key pasted in a new tab within the hour sends 1 API request', async ({ page, context }) => {
  const mock = await mockPixelLab(context);
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  const at = mock.hits.length;
  const tab = await context.newPage();
  await tab.goto('/');
  await connect(tab);
  await settle(tab, mock);
  expect(api(mock.hits.slice(at))).toHaveLength(1);
  expect(lists(mock.hits.slice(at))[0].url).toContain('/v2/characters?');
});

test('Refresh twice within a minute sends 7 requests, not 14', async ({ page }) => {
  const mock = await openFirst(page);
  const at = mock.hits.length;
  for (let i = 0; i < 2; i++) {
    await page.getByRole('button', { name: 'More' }).click();
    await page.getByRole('menuitem', { name: /Refresh/ }).click({ force: true }); // the 2nd tap hits the disabled item
    await settle(page, mock);
  }
  await expect(page.getByRole('menuitem', { name: /Refresh/ })).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  expect(lists(mock.hits.slice(at))).toHaveLength(7);
  expect(api(mock.hits.slice(at))).toHaveLength(7);
});

test("another account's key wipes the saved copy", async ({ page, context }) => {
  const mock = await mockPixelLab(context);
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  expect(await deviceStorage(page)).toContain('a-characters-0');
  const tab = await context.newPage();
  await tab.goto('/');
  await connect(tab, OTHER_KEY);
  await expect(tab.getByRole('link', { name: 'Characters, 3' })).toBeVisible();
  await settle(tab, mock);
  const saved = await deviceStorage(tab);
  expect(saved).toContain('b-characters-0');
  expect(saved).not.toMatch(/\ba-(?:characters|objects|ui|tilesets|isometric|tiles-pro)-\d/);
});

test('at the daily cap the "Paused" notice appears and Keep loading continues', async ({ page }) => {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  // http.ts's own counter: 999 requests in the last 24 h, so the key test is the 1,000th.
  await page.evaluate(() => localStorage.setItem('pixellab-backpack:api-count', JSON.stringify({ t: Array(999).fill(Date.now()), taps: [] })));
  await page.getByLabel('PixelLab API key').fill(GOOD_KEY);
  await page.getByRole('button', { name: 'Test key' }).click();
  const notice = page.getByRole('status').filter({ hasText: "Paused to go easy on PixelLab's servers." });
  await expect(notice).toBeVisible();
  await settle(page, mock);
  expect(api(mock.hits)).toHaveLength(1);
  await notice.getByRole('button', { name: 'Keep loading' }).click();
  await expect(page.getByRole('link', { name: 'Objects, 12' })).toBeVisible();
  await expect(notice).toHaveCount(0);
  await settle(page, mock);
  expect(lists(mock.hits)).toHaveLength(7);
});
