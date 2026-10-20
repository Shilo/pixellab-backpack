// T9 Resilience (mocked PixelLab): mid-session slowed / paused / blocked, the all-families-failed card and an empty category.
// The mid-session stop with Try again is covered by t5-navigation.spec.ts.
import { expect, test, type Page } from '@playwright/test';
import { GOOD_KEY, connect, mockPixelLab, settle, type Hit } from '../fixtures/pixellab-mock';

const lists = (hits: Hit[]) => hits.filter((h) => h.list);
const tryAgainNotice = (page: Page) => page.getByRole('status').filter({ hasText: 'Try again' });

async function refresh(page: Page) {
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Refresh/ }).click();
}

test('mid-session 429: "slowed" shows, then the check continues once the pause is over', async ({ page }) => {
  await page.clock.install(); // time flows normally; fastForward skips the 60 s pause
  const mock = await mockPixelLab(page);
  let once = true;
  await page.route('https://api.pixellab.ai/v2/objects?**', (route) => {
    if (route.request().method() !== 'GET' || !once) return route.fallback();
    once = false;
    return route.fulfill({ status: 429, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization' } });
  });
  await page.goto('/');
  await connect(page);
  const slowed = page.getByRole('status').filter({ hasText: 'PixelLab asked us to slow down.' });
  await expect(slowed).toBeVisible();
  const at = mock.hits.length;
  await page.clock.fastForward('01:05');
  await expect(slowed).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Objects, 12' })).toBeVisible();
  await expect(tryAgainNotice(page)).toHaveCount(0);
  expect(lists(mock.hits.slice(at)).some((h) => h.url.includes('/v2/objects?'))).toBe(true);
});

test('mid-session daily cap: "Paused" shows, and Keep loading finishes the check with no error left', async ({ page }) => {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  // http.ts's own counter, full for today: the next request is over the cap.
  await page.evaluate(() => localStorage.setItem('pixellab-backpack:api-count', JSON.stringify({ t: Array(1000).fill(Date.now()), taps: [] })));
  await refresh(page);
  const paused = page.getByRole('status').filter({ hasText: "Paused to go easy on PixelLab's servers." });
  await expect(paused).toBeVisible();
  await settle(page, mock);
  const at = mock.hits.length;
  await paused.getByRole('button', { name: 'Keep loading' }).click();
  await expect(paused).toHaveCount(0);
  await settle(page, mock);
  expect(lists(mock.hits.slice(at))).toHaveLength(7); // the refresh that hit the cap is finished
  await expect(tryAgainNotice(page)).toHaveCount(0);
});

test("mid-session refused connections: \"Can't reach PixelLab\" with Try again, which recovers with no error left", async ({ page }) => {
  test.setTimeout(60_000);
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  mock.mode = 'blocked';
  await refresh(page);
  const blocked = page.getByRole('heading', { name: "Can't reach PixelLab right now." });
  await expect(blocked).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('blocking')).toHaveCount(0);
  await settle(page, mock);
  mock.mode = 'ok';
  const at = mock.hits.length;
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(blocked).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await settle(page, mock);
  expect(lists(mock.hits.slice(at)).length).toBeGreaterThan(0); // the failed check is asked again
  await expect(tryAgainNotice(page)).toHaveCount(0);
});

test('every family failing with nothing saved shows the error card; Try again loads the library', async ({ page }) => {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  // Same tab (the key stays), saved copy gone, every list answers 404 (no retry).
  await page.evaluate(
    () =>
      new Promise((done) => {
        const r = indexedDB.open('pixellab-backpack');
        r.onsuccess = () => {
          const tx = r.result.transaction('kv', 'readwrite');
          tx.objectStore('kv').clear();
          tx.oncomplete = () => (r.result.close(), done(null));
        };
      }),
  );
  mock.fail = ['/v2/'];
  await page.reload();
  const card = page.getByRole('heading', { name: "Couldn't reach PixelLab." });
  await expect(card).toBeVisible();
  await expect(page.getByRole('link', { name: /^Characters, / })).toHaveCount(0);
  await expect(page.getByRole('status').filter({ hasText: "Some assets didn't load" })).toHaveCount(0); // the card replaces the notice
  mock.fail = [];
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await expect(card).toHaveCount(0);
});

test('an empty category says "Nothing here yet." and sends no extra request', async ({ page }) => {
  const mock = await mockPixelLab(page, { a: { ui: 0 } });
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  await expect(page.getByRole('link', { name: /^UI, / })).toHaveCount(0); // empty categories are hidden on home
  const at = mock.hits.length;
  await page.evaluate(() => (location.hash = '#/c/ui'));
  await expect(page.getByRole('heading', { name: 'Nothing here yet.' })).toBeVisible();
  await expect(page.getByText("Create something in PixelLab and it'll show up here.")).toBeVisible();
  await settle(page, mock, 600);
  expect(mock.hits.slice(at)).toEqual([]);
  expect(mock.hits.filter((h) => h.url.includes(GOOD_KEY))).toEqual([]);
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page).toHaveURL(/#\/$/);
});
