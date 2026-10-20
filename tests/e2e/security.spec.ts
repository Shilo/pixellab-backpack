// Security (mocked PixelLab): through a full tour, the API key appears only in the Authorization header of API requests and in
// sessionStorage (this-tab mode). Never in a URL, another header, a body, localStorage, IndexedDB, cookies, the console,
// the Activity panel or its copied log, or the DOM (only the "••••" + last 4 hint in Settings).
import { expect, test, type Page, type Request } from '@playwright/test';
import { GOOD_KEY, connect, deviceStorage, mockPixelLab, settle } from '../fixtures/pixellab-mock';

const PARTS = [GOOD_KEY, GOOD_KEY.slice(0, 12), GOOD_KEY.slice(-5)]; // the whole key, its start, and more than the 4-character hint

const dom = (page: Page) =>
  page.evaluate(() => {
    const values = [...document.querySelectorAll('input, textarea')].map((el) => (el as HTMLInputElement).value);
    return [document.documentElement.outerHTML, document.title, location.href, ...values].join('\n');
  });

const clean = (text: string, where: string) => {
  for (const p of PARTS) expect(text.includes(p), `${where} holds "${p}"`).toBe(false);
};

test('the key appears only in the Authorization header and the tab store', async ({ page, context }) => {
  test.setTimeout(90_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  const mock = await mockPixelLab(page);
  const requests: Request[] = [];
  const consoleText: string[] = [];
  context.on('request', (r) => requests.push(r));
  page.on('console', (m) => consoleText.push(m.text()));
  page.on('pageerror', (e) => consoleText.push(String(e)));

  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  clean(await dom(page), 'home DOM');

  // Every screen that shows data: a grid, the viewer with Info and its technical details, a still, Settings, Activity.
  await page.getByRole('link', { name: /^Characters, / }).click();
  await settle(page, mock, 600);
  await page.getByRole('link', { name: 'Character 1', exact: true }).click();
  const v = page.getByRole('dialog', { name: 'Character 1', exact: true });
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await v.getByRole('complementary', { name: 'Info' }).getByText('Technical details').click();
  clean(await dom(page), 'viewer + Info DOM');
  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('link', { name: /^Tilesets & tiles, / }).click();
  await settle(page, mock, 600);
  await page.getByRole('button', { name: 'Library' }).click();

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Settings/ }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings.getByText(`API key ending ••••${GOOD_KEY.slice(-4)}`)).toBeVisible();
  clean(await dom(page), 'Settings DOM');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Activity/ }).click();
  const activity = page.getByRole('dialog', { name: 'Activity' });
  await activity.getByRole('button', { name: 'Copy log' }).click();
  await expect(activity.getByRole('button', { name: 'Copied' })).toBeVisible();
  clean(await page.evaluate(() => navigator.clipboard.readText()), 'copied Activity log');
  clean(await activity.innerText(), 'Activity panel');
  await activity.getByRole('button', { name: 'Close' }).click();

  // Storage: the key lives only in sessionStorage in this-tab mode.
  clean(await deviceStorage(page), 'localStorage + IndexedDB');
  clean(JSON.stringify(await context.cookies()), 'cookies');
  expect(await page.evaluate(() => Object.values(sessionStorage).filter((v) => v.includes('synthetic')))).toEqual([GOOD_KEY]);
  clean(consoleText.join('\n'), 'console');

  // Requests: the key only as "Bearer <key>" in Authorization, only to the API host.
  expect(requests.length).toBeGreaterThan(10);
  for (const r of requests) {
    const url = r.url();
    clean(url, `URL ${url}`);
    clean(r.postData() ?? '', `body of ${url}`);
    const headers = await r.allHeaders();
    const auth = headers['authorization'];
    for (const [k, val] of Object.entries(headers)) if (k !== 'authorization') clean(val, `${k} header of ${url}`);
    if (auth !== undefined) {
      expect(new URL(url).host, `Authorization sent to ${url}`).toBe('api.pixellab.ai');
      expect(auth).toBe(`Bearer ${GOOD_KEY}`);
    }
  }
  expect(requests.filter((r) => r.headers()['authorization'] && r.method() !== 'GET')).toEqual([]);
});
