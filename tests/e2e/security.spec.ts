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

// Search text stays in memory (Phase 3): a distinctive query (an accent and capitals that no saved name holds; it still
// matches "Character 100") never reaches the address bar, history, device storage, the Activity panel or a request.
const Q = '100 CHÄRACTER';
const Q_FORMS = [Q, Q.toLowerCase(), Q.normalize('NFD'), '100 character', 'CHÄRACTER', 'chäracter', encodeURIComponent('CHÄRACTER'), encodeURIComponent('chäracter')];
const noQuery = (text: string, where: string) => {
  for (const f of Q_FORMS) expect(text.includes(f), `${where} holds "${f}"`).toBe(false);
};
/** Routes words and opaque 12-hex keys only: #/, #/all, #/c/<id>, each optionally with /a/<key>, or #/a/<key>. */
const KEY_ROUTE = /^#\/(?:(?:all|c\/[a-z]+)(?:\/a\/[0-9a-f]{12})?|a\/[0-9a-f]{12})?$/;

test('search text stays in memory: never in the address bar, history, device storage, Activity or a request', async ({ page, context }) => {
  test.setTimeout(60_000);
  const mock = await mockPixelLab(page);
  const requests: Request[] = [];
  const urls: string[] = [];
  context.on('request', (r) => requests.push(r));
  page.on('framenavigated', (f) => f === page.mainFrame() && urls.push(f.url()));
  const stored = async (where: string) => {
    noQuery(await deviceStorage(page), `${where}: localStorage + IndexedDB`);
    noQuery(await page.evaluate(() => JSON.stringify(Object.entries(sessionStorage))), `${where}: sessionStorage`);
    noQuery(await page.evaluate(() => JSON.stringify(history.state) + location.href + document.title), `${where}: history state, address and title`);
  };

  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  await page.locator('[data-search]').click();
  const field = page.getByRole('searchbox', { name: 'Search' });
  await expect(field).toBeFocused();

  // The field's privacy attributes: no form, no name, no autofill, spellcheck or capitals.
  for (const [k, v] of Object.entries({ autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off', enterkeyhint: 'search' })) await expect(field).toHaveAttribute(k, v);
  expect(await field.evaluate((el) => ({ name: el.hasAttribute('name'), form: !!el.closest('form'), search: !!el.closest('search') }))).toEqual({ name: false, form: false, search: true });

  const href = page.url();
  await field.fill(Q);
  const result = page.locator('.glass-popover.panel .res a[data-key]');
  await expect(result).toHaveText(['Character 100']);
  await field.press('Enter'); // remembered in Recent (memory only)
  await expect(result).toBeFocused();
  expect(page.url()).toBe(href);
  await stored('after Enter');

  await result.click();
  const v = page.getByRole('dialog', { name: 'Character 100', exact: true });
  await expect(v).toBeVisible();
  await expect(page).toHaveURL(/#\/a\/[0-9a-f]{12}$/);
  await settle(page, mock, 600);
  await stored('viewer open');
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);
  await expect(field).toHaveValue(Q); // still in the tab's memory
  await stored('viewer closed');

  await page.keyboard.press('Escape');
  await expect(field).toHaveCount(0);
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Activity/ }).click();
  const activity = page.getByRole('dialog', { name: 'Activity' });
  await expect(activity).toBeVisible();
  noQuery(await activity.innerText(), 'Activity panel');
  await activity.getByRole('button', { name: 'Close' }).click();

  await page.reload();
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await settle(page, mock);
  await stored('after reload');

  // Every address this tab showed holds only route words and keys; every request is a GET with no key or query in its URL.
  expect(urls.some((u) => /#\/a\/[0-9a-f]{12}$/.test(u))).toBe(true); // hash changes are recorded
  for (const u of [...urls, page.url()]) {
    noQuery(decodeURIComponent(u), `address ${u}`);
    expect(new URL(u).hash || '#/', `address ${u}`).toMatch(KEY_ROUTE);
  }
  for (const r of requests) {
    noQuery(decodeURIComponent(r.url()), `URL ${r.url()}`);
    clean(r.url(), `URL ${r.url()}`);
    expect(r.method(), r.url()).toBe('GET');
  }
});
