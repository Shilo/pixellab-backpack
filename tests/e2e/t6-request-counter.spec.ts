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

// ---- Viewer (Phase 2): the counts are exact. ----
const details = (hits: Hit[]) => hits.filter((h) => h.detail);
const detailIds = (hits: Hit[]) => details(hits).map((h) => new URL(h.url).pathname.split('/').pop());
/** Image-host paths below /file/a/ (account a). */
const picturesOf = (hits: Hit[]) => hits.filter((h) => h.host === 'image').map((h) => new URL(h.url).pathname.replace('/file/a/', ''));
const dialog = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
const FRAMES = (id: string, anim: string, dir: string) => [0, 1, 2, 3].map((f) => `${id}/${anim}/${dir}/${f}.png`);

async function openGrid(page: Page, category: RegExp): Promise<Mock> {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await page.getByRole('link', { name: category }).click();
  await settle(page, mock, 600);
  return mock;
}

async function openAsset(page: Page, mock: Mock, name: string, ms = 600) {
  await page.getByRole('link', { name, exact: true }).click();
  const v = dialog(page, name);
  await expect(v).toBeVisible();
  await settle(page, mock, ms);
  return v;
}

/** The address bar holds only the card's opaque key: never a PixelLab id or a picture link. */
const cleanAddress = (page: Page) => {
  expect(ids(page.url())).toEqual([]);
  expect(new URL(page.url()).hash).toMatch(/^#\/[\w/-]*$/); // route words and an opaque hex key only: no host, no link
};

/** Every request so far is a GET, carries no key in its URL, and none is for an unfinished row. */
const cleanHits = (mock: Mock) => {
  expect(mock.hits.filter((h) => h.method !== 'GET')).toEqual([]);
  expect(mock.hits.filter((h) => h.url.includes(GOOD_KEY))).toEqual([]);
  const unfinished = new Set(mock.unfinishedIds);
  expect(mock.hits.filter((h) => ids(h.url).some((id) => unfinished.has(id)))).toEqual([]);
};

test('viewer: first open sends 1 detail request, reopen and reload within the hour send 0', async ({ page }) => {
  const mock = await openGrid(page, /^Characters, /);
  let at = mock.hits.length;

  const v = await openAsset(page, mock, 'Character 1');
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  cleanAddress(page);
  let sent = mock.hits.slice(at);
  expect(api(sent)).toHaveLength(1);
  expect(api(sent)[0]).toMatchObject({ method: 'GET', detail: true });
  expect(new URL(api(sent)[0].url).pathname).toBe('/v2/characters/a-characters-0');
  expect(lists(sent)).toEqual([]);
  expect(picturesOf(sent).sort()).toEqual(FRAMES('a-characters-0', 'breathing-idle', 'south').sort()); // only the shown animation x direction

  // Close and reopen the same character.
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);
  at = mock.hits.length;
  await openAsset(page, mock, 'Character 1');
  expect(api(mock.hits.slice(at))).toEqual([]);

  // Reload on the viewer route: the saved detail answers. The grid underneath rebuilds and asks for its own on-screen
  // pictures like any grid reload (image host only), plus the shown frames; nothing else.
  at = mock.hits.length;
  await page.reload();
  await expect(dialog(page, 'Character 1').locator('.vt-chip')).toHaveText('Breathing idle · South');
  await settle(page, mock, 600);
  sent = mock.hits.slice(at);
  expect(api(sent)).toEqual([]);
  const allowed = /^a-characters-\d+\.png$|^a-characters-0\/breathing-idle\/south\/[0-3]\.png$/;
  expect(picturesOf(sent).filter((p) => !allowed.test(p))).toEqual([]);
  cleanAddress(page);
  cleanHits(mock);
});

test('viewer: prev/next sends 1 detail request for the asset landed on, never for neighbours or unfinished rows', async ({ page }) => {
  const mock = await openGrid(page, /^Characters, /);
  await openAsset(page, mock, 'Character 12'); // index 11
  let at = mock.hits.length;

  await page.keyboard.press('ArrowRight');
  await expect(dialog(page, 'Character 13')).toBeVisible(); // index 12
  await settle(page, mock, 600);
  expect(api(mock.hits.slice(at))).toHaveLength(1);
  expect(detailIds(mock.hits.slice(at))).toEqual(['a-characters-12']);

  // Three presses inside 0.3 s: only the asset landed on (index 16; index 13 is unfinished and skipped).
  at = mock.hits.length;
  for (let i = 0; i < 3; i++) await page.keyboard.press('ArrowRight');
  await expect(dialog(page, 'Character 17')).toBeVisible();
  await settle(page, mock, 600);
  expect(api(mock.hits.slice(at))).toHaveLength(1);
  expect(detailIds(mock.hits.slice(at))).toEqual(['a-characters-16']);
  cleanAddress(page);
  cleanHits(mock);
});

test("viewer: a direction change sends 0 API requests and only that direction's frames", async ({ page }) => {
  const mock = await openGrid(page, /^Characters, /);
  const v = await openAsset(page, mock, 'Character 1');
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  const at = mock.hits.length;
  await v.locator('.vt-chip').click();
  await dialog(page, 'Animation, state and direction').getByRole('radio', { name: 'East', exact: true }).click();
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · East');
  await settle(page, mock, 600);
  const sent = mock.hits.slice(at);
  expect(api(sent)).toEqual([]);
  expect(picturesOf(sent).sort()).toEqual(FRAMES('a-characters-0', 'breathing-idle', 'east').sort());
  cleanAddress(page);
});

test("viewer: a grouped character's state switch sends 1 detail request the first time and 0 switching back", async ({ page }) => {
  const mock = await openGrid(page, /^Characters, /);
  const v = await openAsset(page, mock, 'Character 7');
  await expect(v.locator('.vt-chip')).toContainText('Breathing idle');
  const group = dialog(page, 'Animation, state and direction').getByRole('group', { name: 'State' });

  let at = mock.hits.length;
  await v.locator('.vt-chip').click();
  await group.getByRole('button', { name: 'Armored', exact: true }).click();
  await expect(v.locator('.vt-chip')).toContainText('Armored');
  await settle(page, mock, 600);
  expect(api(mock.hits.slice(at))).toHaveLength(1);
  expect(detailIds(mock.hits.slice(at))).toEqual(['a-characters-7']);
  cleanAddress(page);

  at = mock.hits.length;
  if (!(await group.isVisible())) await v.locator('.vt-chip').click();
  await group.locator('button[aria-pressed="false"]').click();
  await expect(v.locator('.vt-chip')).not.toContainText('Armored');
  await settle(page, mock, 600);
  expect(api(mock.hits.slice(at))).toEqual([]);
  cleanAddress(page);
  cleanHits(mock);
});

test('viewer: opening a tileset, side tileset, Tiles Pro, isometric tile and UI asset after their grid sends 0 API requests', async ({ page }) => {
  const mock = await openGrid(page, /^Tilesets & tiles, /);
  const check = async (name: string) => {
    const at = mock.hits.length;
    const v = await openAsset(page, mock, name, 800);
    await expect(v.locator('canvas')).toBeVisible();
    expect(api(mock.hits.slice(at))).toEqual([]);
    cleanAddress(page);
    await page.keyboard.press('Escape');
    await expect(v).toHaveCount(0);
  };
  for (const name of ['Tileset 1', 'Side tileset 1', 'Pro tile 1', 'Iso tile 1']) await check(name);
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('link', { name: /^UI, / }).click();
  await settle(page, mock, 600);
  await check('UI piece 1');
  cleanHits(mock);
});

test('viewer: Activity lists each detail as "Characters · details" / "Objects · details", and its entries equal the requests sent', async ({ page }) => {
  const mock = await openGrid(page, /^Characters, /);
  const v = await openAsset(page, mock, 'Character 1');
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('link', { name: /^Objects, / }).click();
  await settle(page, mock, 600);
  const o = await openAsset(page, mock, 'Object 1');
  await expect(o.locator('.vt-chip')).toHaveText('Gently bobbing');
  await page.keyboard.press('Escape');
  await expect(o).toHaveCount(0);

  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Activity/ }).click();
  const panel = dialog(page, 'Activity');
  await expect(panel).toBeVisible();
  const sent = mock.hits.filter((h) => !h.redirected);
  expect(details(sent)).toHaveLength(2);
  await expect(panel.getByText(`${sent.length} requests, newest first`)).toBeVisible();
  await expect(panel.locator('.log li')).toHaveCount(sent.length);
  await expect(panel.locator('.log li .what', { hasText: /^Characters · details$/ })).toHaveCount(1);
  await expect(panel.locator('.log li .what', { hasText: /^Objects · details$/ })).toHaveCount(1);
  await expect(panel.locator('.counters')).toContainText(`API requests this session${api(sent).length}`);
  await expect(panel).not.toContainText(GOOD_KEY);
  for (const id of new Set(mock.hits.flatMap((h) => ids(h.url)))) await expect(panel).not.toContainText(id);
  cleanHits(mock);
});

// ---- Search and All assets (Phase 3): the counts are exact. Each test seeds what it needs. ----
const field = (page: Page) => page.getByRole('searchbox', { name: 'Search' });
const panel = (page: Page) => page.locator('.glass-popover.panel');
const results = (page: Page) => panel(page).locator('.res a[data-key]');
/** Path of each list request (next pages start one row early, to catch a shifted list). */
const listPaths = (hits: Hit[]) => lists(hits).map((h) => new URL(h.url).pathname);

/** Opens the search from the dock (the home pill or a grid's Search icon). */
async function openSearch(page: Page) {
  await page.locator('[data-search]').click();
  await expect(field(page)).toBeFocused();
}

test('search: five queries, Recent, Clear search, Search all types and closing send 0 API requests', async ({ page }) => {
  const mock = await openFirst(page);
  for (const name of [/^Characters, /, /^Objects, /, /^Tilesets & tiles, /, /^UI, /]) {
    await page.getByRole('link', { name }).click();
    await settle(page, mock, 600);
    await page.getByRole('button', { name: 'Library' }).click();
  }
  await page.getByRole('link', { name: /^Characters, / }).click();
  await settle(page, mock, 600);
  const at = mock.hits.length;

  await openSearch(page);
  for (const q of ['character 1', 'character 2', 'armored']) {
    await field(page).fill(q);
    await expect(results(page).first()).toBeVisible();
    await field(page).press('Enter'); // remembered in Recent
  }
  await field(page).fill('slime');
  await expect(panel(page).getByRole('heading', { name: 'No matches for "slime" in Characters.' })).toBeVisible();
  await panel(page).getByRole('button', { name: 'Search all types' }).click();
  await expect(panel(page).getByRole('heading', { name: 'No matches for "slime".' })).toBeVisible();
  await panel(page).getByRole('button', { name: 'Clear search' }).click();
  await expect(field(page)).toHaveValue('');
  await field(page).fill('object');
  await expect(results(page)).toHaveCount(11);
  await page.getByRole('button', { name: 'Clear search' }).click(); // the field's ✕
  await panel(page).getByRole('button', { name: 'armored' }).click(); // a Recent chip
  await expect(field(page)).toHaveValue('armored');
  await field(page).fill('');
  await panel(page).getByRole('button', { name: 'Clear', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);
  await settle(page, mock);
  expect(api(mock.hits.slice(at))).toEqual([]);
});

test('search: "t", "ti", "til" typed within 0.3 s and cleared send 0 API requests', async ({ page }) => {
  const mock = await openFirst(page);
  await openSearch(page);
  const at = mock.hits.length;
  // In the page, so the timing holds on a loaded machine: tileset cells are on screen for well under 0.3 s.
  const tiles = await field(page).evaluate(async (el: HTMLInputElement) => {
    const type = (v: string) => ((el.value = v), el.dispatchEvent(new Event('input', { bubbles: true })));
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    type('t');
    await wait(40);
    type('ti');
    await wait(40);
    type('til');
    await new Promise(requestAnimationFrame);
    const n = document.querySelectorAll('.res a[data-key][title*="ile"]').length;
    type('');
    return n;
  });
  expect(tiles).toBeGreaterThan(0); // the costly cells really were on screen
  await expect(field(page)).toHaveValue('');
  await settle(page, mock);
  expect(api(mock.hits.slice(at))).toEqual([]);
});

test('search: "tileset" results ask at most one costly picture per visible tileset cell; repeating the search asks 0', async ({ page }) => {
  const mock = await openFirst(page);
  await openSearch(page);
  let at = mock.hits.length;
  await field(page).fill('tileset');
  await expect(results(page)).toHaveText(['Tileset 1', 'Tileset 2', 'Tileset 3', 'Tileset 5', 'Side tileset 1', 'Side tileset 2', 'Side tileset 3']);
  await settle(page, mock);
  const visible = await results(page).evaluateAll((els) => {
    const p = els[0].closest('.panel')!.getBoundingClientRect();
    return els.filter((e) => e.getBoundingClientRect().bottom > p.top && e.getBoundingClientRect().top < p.bottom).map((e) => e.getAttribute('title')!);
  });
  const visibleIds = visible.map((t) => {
    const [, fam, n] = /^(Side tileset|Tileset) (\d+)$/.exec(t)!;
    return `a-${fam === 'Tileset' ? 'tilesets' : 'tilesets-side'}-${Number(n) - 1}`;
  });
  const costly = api(mock.hits.slice(at));
  const asked = costly.flatMap((h) => ids(h.url));
  expect(asked).toHaveLength(costly.length); // each request names one asset
  expect(new Set(asked).size).toBe(asked.length); // at most one per cell
  expect(asked.filter((id) => !visibleIds.includes(id))).toEqual([]); // only cells on screen

  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);
  at = mock.hits.length;
  await openSearch(page);
  await field(page).fill('tileset');
  await expect(results(page)).toHaveCount(7);
  await settle(page, mock);
  expect(api(mock.hits.slice(at))).toEqual([]);
});

test('All assets: Show all sends 0 API requests at the top of the grid; a reload on #/all within the hour sends 0', async ({ page }) => {
  const mock = await openFirst(page);
  await openSearch(page);
  let at = mock.hits.length;
  await panel(page).getByRole('link', { name: 'Show all 283 assets' }).click();
  await expect(page).toHaveURL(/#\/all$/);
  await expect(page.getByTitle('Character 1', { exact: true })).toBeVisible();
  await settle(page, mock);
  expect(lists(mock.hits.slice(at))).toEqual([]);
  expect(api(mock.hits.slice(at))).toEqual([]);

  at = mock.hits.length;
  await page.reload();
  await expect(page.locator('.crumb')).toHaveText('All assets283');
  await expect(page.getByTitle('Character 1', { exact: true })).toBeVisible();
  await settle(page, mock);
  expect(api(mock.hits.slice(at))).toEqual([]);
});

test('All assets: scrolling to the end in steps asks exactly the next pages the counts imply, none while idle', async ({ page }) => {
  test.setTimeout(90_000);
  const mock = await openFirst(page);
  await page.evaluate(() => (location.hash = '#/all'));
  const grid = page.locator('main.grid');
  await expect(page.getByTitle('Character 1', { exact: true })).toBeVisible();
  await settle(page, mock);
  const at = mock.hits.length;
  await page.waitForTimeout(2000); // idle at the top
  expect(lists(mock.hits.slice(at))).toEqual([]);

  for (let i = 0; ; i++) {
    expect(i, 'steps to reach the end').toBeLessThan(400);
    const done = await grid.evaluate((el) => {
      el.scrollBy(0, el.clientHeight * 0.8);
      return el.scrollTop + el.clientHeight >= el.scrollHeight - 1 && !!el.querySelector('.end');
    });
    if (done) break;
    await page.waitForTimeout(150);
  }
  await expect(page.getByText("That's everything")).toBeVisible();
  await settle(page, mock);
  // Characters: 250 at 100 per page, 100 saved by the first open: 2 next pages. Every other family is fully saved: 0.
  expect(listPaths(mock.hits.slice(at))).toEqual(['/v2/characters', '/v2/characters']);
  const n = mock.hits.length;
  await page.waitForTimeout(2000); // idle at the bottom
  expect(lists(mock.hits.slice(n))).toEqual([]);
});

test('All assets: → at the last saved character sends exactly 1 list request and moves to the next card', async ({ page }) => {
  // Characters only: with other families saved after it, the last saved character would not be the last card of All
  // assets (R4: family after family), and → would move to the next family's first card instead.
  const mock = await mockPixelLab(page, { a: { objects: 0, ui: 0, tilesets: 0, 'tilesets-side': 0, isometric: 0, 'tiles-pro': 0 } });
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  await openSearch(page);
  await field(page).fill('character 100');
  await expect(results(page)).toHaveText(['Character 100']); // index 99: the last of the 100 saved
  const key = await results(page).getAttribute('data-key');
  await page.keyboard.press('Escape');
  await expect(field(page)).toHaveCount(0);

  await page.evaluate((k) => (location.hash = `#/all/a/${k}`), key);
  await expect(dialog(page, 'Character 100')).toBeVisible();
  await settle(page, mock, 600);
  const at = mock.hits.length;
  await page.keyboard.press('ArrowRight');
  await expect(dialog(page, 'Character 101')).toBeVisible();
  await settle(page, mock, 600);
  expect(listPaths(mock.hits.slice(at))).toEqual(['/v2/characters']);
  cleanAddress(page);
  cleanHits(mock);
});

test('viewer from a result: first open sends 1 detail request, reopen 0; → through results never asks for a list page', async ({ page }) => {
  const mock = await openFirst(page);
  await openSearch(page);
  await field(page).fill('character 10');
  await expect(results(page)).toHaveText(['Character 10', 'Character 100']);
  let at = mock.hits.length;
  await results(page).first().click();
  await expect(dialog(page, 'Character 10')).toBeVisible();
  await settle(page, mock, 600);
  const sent = api(mock.hits.slice(at));
  expect(sent).toHaveLength(1);
  expect(sent[0]).toMatchObject({ method: 'GET', detail: true });
  expect(new URL(sent[0].url).pathname).toBe('/v2/characters/a-characters-9');

  await page.keyboard.press('Escape');
  await expect(dialog(page, 'Character 10')).toHaveCount(0);
  await expect(results(page).first()).toBeFocused();
  at = mock.hits.length;
  await results(page).first().click();
  await expect(dialog(page, 'Character 10')).toBeVisible();
  await settle(page, mock, 600);
  expect(api(mock.hits.slice(at))).toEqual([]);

  // → to the last result (also the last saved character: from a grid, → there would load a page), then → again.
  at = mock.hits.length;
  await page.keyboard.press('ArrowRight');
  await expect(dialog(page, 'Character 100')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(500);
  await expect(dialog(page, 'Character 100')).toBeVisible();
  await settle(page, mock, 600);
  expect(lists(mock.hits.slice(at))).toEqual([]);
  cleanAddress(page);
  cleanHits(mock);
});
