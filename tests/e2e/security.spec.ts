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

// Favorites and folders stay on this device (Phase 4): a distinctive folder name, raw PixelLab ids and picture links never reach
// the address bar, history state, the Activity panel or the console; addresses hold route words, keys and 12-hex folder ids.
const NAME = 'Zebra Vault Ünïque 42';
const NAME_FORMS = [NAME, NAME.toLowerCase(), encodeURIComponent(NAME), encodeURIComponent(NAME.toLowerCase()), 'Zebra Vault', 'zebra%20vault'];
const RAW = /\b[ab]-(?:characters|objects|ui|tilesets-side|tilesets|isometric|tiles-pro)-\d+|pixellab\.ai|backblaze|https?:\/\/(?!localhost)/;
/** #/, #/all, #/c/<id>, #/fav, #/f/<12 hex>, each optionally with /a/<12 hex key>, or #/a/<key>. */
const ORG_ROUTE = /^#\/(?:(?:all|fav|c\/[a-z]+|f\/[0-9a-f]{12})(?:\/a\/[0-9a-f]{12})?|a\/[0-9a-f]{12})?$/;
const private_ = (text: string, where: string) => {
  for (const f of NAME_FORMS) expect(text.includes(f), `${where} holds "${f}"`).toBe(false);
  expect(text, where).not.toMatch(RAW);
};

test('folders and favorites stay private: never in the address, history, Activity or console; Forget key wipes them in both tabs', async ({ page, context }) => {
  test.setTimeout(90_000);
  const mock = await mockPixelLab(context);
  const urls: string[] = [];
  const consoleText: string[] = [];
  page.on('framenavigated', (f) => f === page.mainFrame() && urls.push(f.url()));
  page.on('console', (m) => consoleText.push(m.text()));
  page.on('pageerror', (e) => consoleText.push(String(e)));
  const here = async (where: string) => private_(await page.evaluate(() => location.href + '\n' + JSON.stringify(history.state)), `${where}: address and history state`);
  const said = (text: string) => page.getByRole('status').filter({ hasText: text });

  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  await page.getByRole('button', { name: 'New folder' }).click();
  await page.getByRole('textbox', { name: 'Folder name' }).fill(NAME);
  await page.getByRole('button', { name: 'Create' }).click();
  const ov = page.getByRole('dialog', { name: NAME, exact: true });
  await expect(ov).toBeVisible();
  await here('new folder');
  await page.getByRole('button', { name: 'Close folder' }).click();

  // Favorites and folder items: a character, an object and a tileset (its picture is a resolved link).
  for (const [grid, name] of [[/^Characters, /, 'Character 1'], [/^Objects, /, 'Object 2'], [/^Tilesets & tiles, /, 'Tileset 1']] as const) {
    await page.getByRole('link', { name: grid }).click();
    await settle(page, mock, 600);
    const cell = page.getByRole('link', { name: new RegExp(`^${name}(, favorite)?$`) });
    await cell.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Favorite', exact: true }).click();
    await expect(said('Added to Favorites.')).toBeAttached();
    await cell.click({ button: 'right' });
    await page.getByRole('menuitem', { name: 'Add to folder…' }).click();
    await page.getByRole('checkbox', { name: new RegExp(`^${NAME}`) }).check();
    await expect(said(`Added to ${NAME}.`)).toBeAttached();
    await page.getByRole('button', { name: 'Done' }).click();
    await page.getByRole('button', { name: 'Library' }).click();
  }

  // Every screen and viewer route of Phase 4.
  await page.getByRole('link', { name: `${NAME}, 3` }).click();
  await here('folder');
  await ov.getByRole('link', { name: /^Character 1/ }).click();
  await expect(page.getByRole('dialog', { name: 'Character 1', exact: true })).toBeVisible();
  await settle(page, mock, 600);
  await here('viewer over the folder');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Character 1', exact: true })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(ov).toHaveCount(0);
  await page.getByRole('link', { name: 'Favorites, 3' }).click();
  await page.getByRole('link', { name: 'Tileset 1, favorite', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Tileset 1', exact: true })).toBeVisible();
  await settle(page, mock, 600);
  await here('viewer from Favorites');
  await page.keyboard.press('Escape');
  await page.locator('[data-search]').click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('zebra');
  await page.locator('.glass-popover.panel .gotos a').filter({ hasText: NAME }).click();
  await expect(ov).toBeVisible();
  await here('Go to the folder');
  await page.getByRole('button', { name: 'Close folder' }).click();

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Activity/ }).click();
  const activity = page.getByRole('dialog', { name: 'Activity' });
  await expect(activity).toBeVisible();
  private_(await activity.innerText(), 'Activity panel');
  await activity.getByRole('button', { name: 'Close' }).click();
  expect(urls.some((u) => /#\/f\/[0-9a-f]{12}\/a\/[0-9a-f]{12}$/.test(u))).toBe(true); // hash changes are recorded
  for (const u of [...urls, page.url()]) {
    private_(decodeURIComponent(u).replace(/^http:\/\/localhost:\d+\//, ''), `address ${u}`);
    expect(new URL(u).hash || '#/', `address ${u}`).toMatch(ORG_ROUTE);
  }

  // A second tab of the same key holds the folder too; Forget key here wipes it there as well.
  const tab = await context.newPage();
  await tab.goto('/');
  await connect(tab);
  await expect(tab.getByRole('link', { name: `${NAME}, 3` })).toBeVisible();
  expect(await deviceStorage(tab)).toContain('"org"');
  await page.bringToFront();
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Settings/ }).click();
  await page.getByRole('dialog', { name: 'Settings' }).getByRole('button', { name: 'Forget key' }).click();
  await page.getByRole('dialog', { name: 'Forget your API key?' }).getByRole('button', { name: 'Forget key' }).click();
  await expect(page.getByLabel('PixelLab API key')).toBeVisible();
  for (const [p, where] of [[page, 'this tab'], [tab, 'second tab']] as const) {
    await p.bringToFront();
    await expect(p.getByRole('link', { name: `${NAME}, 3` })).toHaveCount(0);
    await p.waitForTimeout(500); // nothing written back late
    const stored = await deviceStorage(p);
    expect(stored, where).not.toContain('"org"');
    private_(stored, `${where}: device storage`);
  }
  private_(consoleText.join('\n'), 'console');
});

// The production CSP (public/_headers, served by `vite preview`): a normal session breaks none of it. Report-only would hide a
// break, so the page itself listens for `securitypolicyviolation` from before its first script.
test('a normal session under the production CSP causes no policy violation', async ({ page }) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    const w = window as unknown as { cspHits: string[] };
    w.cspHits = [];
    document.addEventListener('securitypolicyviolation', (e) => w.cspHits.push(`${e.effectiveDirective} ${e.blockedURI} ${e.sourceFile}:${e.lineNumber}`));
  });
  const hits = () => page.evaluate(() => (window as unknown as { cspHits: string[] }).cspHits);
  const mock = await mockPixelLab(page);
  const res = await page.goto('/');
  expect(res!.headers()['content-security-policy']).toContain("default-src 'none'");
  await connect(page);
  await settle(page, mock, 600);

  await page.getByRole('link', { name: /^Characters, / }).click();
  await settle(page, mock, 600);
  await page.getByRole('link', { name: 'Character 1', exact: true }).click();
  const v = page.getByRole('dialog', { name: 'Character 1', exact: true });
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await v.getByRole('button', { name: 'Favorite', exact: true }).click();
  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await v.getByRole('complementary', { name: 'Info' }).getByText('Technical details').click();
  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);
  await page.getByRole('button', { name: 'Library' }).click();

  await page.locator('[data-search]').click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('object 1');
  await page.locator('.glass-popover.panel .res a[data-key]').filter({ hasText: 'Object 10' }).click();
  const obj = page.getByRole('dialog', { name: 'Object 10', exact: true });
  await expect(obj).toBeVisible();
  await settle(page, mock, 600);
  await page.keyboard.press('Escape');
  await expect(obj).toHaveCount(0); // the viewer closes on the browser's Back: an Esc sent before that lands on the closing viewer
  await page.keyboard.press('Escape');

  await page.getByRole('link', { name: 'Favorites, 1' }).click();
  await expect(page.locator('main.grid a.cell')).toHaveCount(1);
  await settle(page, mock, 600);
  expect(await hits()).toEqual([]);

  // The listener works: an inline style is a violation, once per policy (the _headers header and the build's <meta> copy).
  await page.evaluate(() => document.head.append(Object.assign(document.createElement('style'), { textContent: 'a{}' })));
  await expect.poll(hits).toEqual([expect.stringMatching(/^style-src-elem inline/), expect.stringMatching(/^style-src-elem inline/)]);
});
