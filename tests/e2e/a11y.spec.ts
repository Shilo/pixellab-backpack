// Accessibility smoke (mocked PixelLab): on the key screen, home, a grid, the viewer (with its menu, picker and Info), Settings, the search panel, All assets,
// Favorites, the folder overlay, the card menu, Add to folder and the folder dialogs,
// Tab reaches every visible control, each shows a focus ring, and on phone every control is at least 44 × 44 px.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { connect, mockPixelLab, seedOrg, settle } from '../fixtures/pixellab-mock';

interface Audit {
  missing: string[];
  noRing: string[];
  small: string[];
}

type Win = { look: (el: Element) => string };

/** Installs window.look: focus styles of a control, the descendants that draw its ring (grid cell) and its next sibling (switch track). */
const installLook = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as Win).look = (el) =>
      [el, ...el.querySelectorAll('*'), el.nextElementSibling]
        .filter((e): e is Element => !!e)
        .map((e) => {
          const cs = getComputedStyle(e);
          return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderColor].join(' ');
        })
        .join('|');
  });

/** Tags every visible, enabled, tabbable control inside `scope` (default: the page), Tabs round, and reports controls Tab
 * missed, controls whose look does not change when focused (no visible ring), and non-inline controls under 44 × 44 px. */
async function audit(page: Page, scope = 'body'): Promise<Audit> {
  const total = await page.evaluate((sel) => {
    const all = [...document.querySelector(sel)!.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, summary, [tabindex]')].filter((el) => {
      const r = el.getBoundingClientRect();
      return (
        el.tabIndex >= 0 &&
        !(el as HTMLButtonElement).disabled &&
        !el.closest('[inert]') &&
        el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) &&
        r.width > 0 &&
        r.height > 0
      );
    });
    all.forEach((el, i) => (el.dataset.a11y = String(i)));
    return all.length;
  }, scope);
  expect(total).toBeGreaterThan(0);
  await installLook(page);
  const focused = new Map<string, string>();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let i = 0; i < total + 12; i++) {
    await page.keyboard.press('Tab');
    const at = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.dataset.a11y ? { id: el.dataset.a11y, look: (window as unknown as Win).look(el) } : null;
    });
    if (!at) continue;
    if (focused.has(at.id)) break;
    focused.set(at.id, at.look);
  }
  return page.evaluate(
    (focused) => {
      (document.activeElement as HTMLElement | null)?.blur();
      const look = (window as unknown as Win).look;
      const name = (el: HTMLElement) =>
        `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? (el as HTMLInputElement).labels?.[0]?.innerText ?? el.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)}"`;
      const els = [...document.querySelectorAll<HTMLElement>('[data-a11y]')];
      const size = (el: HTMLElement) => el.getBoundingClientRect();
      const out = {
        missing: els.filter((el) => !(el.dataset.a11y! in focused)).map(name),
        noRing: els.filter((el) => el.dataset.a11y! in focused && focused[el.dataset.a11y!] === look(el)).map(name),
        // Links inside a sentence are exempt (WCAG 2.5.8 inline exception).
        small: els
          .filter((el) => getComputedStyle(el).display !== 'inline' && (size(el).width < 43.5 || size(el).height < 43.5))
          .map((el) => `${name(el)} ${Math.round(size(el).width)}×${Math.round(size(el).height)}`),
      };
      els.forEach((el) => delete el.dataset.a11y);
      return out;
    },
    Object.fromEntries(focused),
  );
}

async function check(page: Page, phone: boolean, where: string, scope?: string) {
  const a = await audit(page, scope);
  expect.soft(a.missing, `${where}: not reachable by Tab`).toEqual([]);
  expect.soft(a.noRing, `${where}: no visible focus`).toEqual([]);
  if (phone) expect.soft(a.small, `${where}: under 44 px on phone`).toEqual([]);
}

const opened = (l: Locator) => expect(l).toBeVisible();

test('keyboard reaches every control with a visible focus ring; phone targets are at least 44 px', async ({ page }, info) => {
  test.setTimeout(90_000);
  const phone = info.project.name === 'phone';
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await check(page, phone, 'key screen');

  mock.fail = ['/v2/ui-assets?']; // home also shows a notice with its Try again button
  await connect(page);
  await settle(page, mock);
  await expect(page.getByRole('status').filter({ hasText: "Some assets didn't load" })).toBeVisible();
  await check(page, phone, 'home');

  // Objects: a short grid that fits on screen, so Tab can come round to the dock.
  await page.getByRole('link', { name: /^Objects, / }).click();
  await settle(page, mock, 600);
  await check(page, phone, 'grid');
  await page.getByRole('button', { name: 'Library' }).click();

  await page.getByRole('link', { name: /^Characters, / }).click();
  await page.getByRole('link', { name: 'Character 1', exact: true }).click();
  const v = page.getByRole('dialog', { name: 'Character 1', exact: true });
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await check(page, phone, 'viewer');

  await v.getByRole('button', { name: 'More' }).click();
  await opened(page.getByRole('dialog', { name: 'Viewer options' }));
  await check(page, phone, 'viewer menu', '.menu');
  await page.keyboard.press('Escape');

  await v.locator('.vt-chip').click();
  await opened(page.getByRole('dialog', { name: 'Animation, state and direction' }));
  await check(page, phone, 'picker', '.pick');
  await page.keyboard.press('Escape');

  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await opened(v.getByRole('complementary', { name: 'Info' }));
  await v.getByRole('complementary', { name: 'Info' }).getByText('Technical details').click();
  await check(page, phone, 'info panel', 'aside.info');
  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Settings/ }).click();
  await opened(page.getByRole('dialog', { name: 'Settings' }));
  await check(page, phone, 'settings', 'dialog[open]');
});

test('search panel, no-results panel and All assets end: Tab reaches every control with a ring; phone targets at least 44 px', async ({ page }, info) => {
  test.setTimeout(90_000);
  const phone = info.project.name === 'phone';
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  const field = page.getByRole('searchbox', { name: 'Search' });
  const panel = page.locator('.glass-popover.panel');

  // Empty field, with a Recent chip and its Clear seeded here (R12: chips and every glass-btn--sm).
  await page.locator('[data-search]').click();
  await field.fill('object');
  await field.press('Enter');
  await field.fill('');
  await expect(panel.locator('.recent button')).toHaveCount(1);
  await check(page, phone, 'search panel (empty)');

  await field.fill('object');
  await expect(panel.locator('.res a[data-key]')).toHaveCount(11);
  await expect(page.getByRole('button', { name: 'Clear search text' })).toBeVisible(); // the field's ✕
  await check(page, phone, 'search panel (results)');
  await page.keyboard.press('Escape');

  // No results in a category: Clear search and Search all types.
  await page.getByRole('link', { name: /^Characters, / }).click();
  await page.locator('[data-search]').click();
  await field.fill('slime');
  await expect(panel.getByRole('button', { name: 'Search all types' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Clear search', exact: true })).toHaveCount(1); // the ✕ has its own name
  await check(page, phone, 'no-results panel');
  await page.keyboard.press('Escape');

  // All assets at its end. Tab starts after the last cell, so it reaches the note's links before any cell scrolls the grid.
  await page.evaluate(() => (location.hash = '#/all'));
  const grid = page.locator('main.grid');
  const end = page.getByText("That's everything");
  await expect.poll(async () => (await grid.evaluate((el) => el.scrollTo(0, el.scrollHeight)), await end.count()), { timeout: 30_000 }).toBe(1);
  await grid.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await settle(page, mock, 600);
  await grid.locator('a[data-key]').last().focus();
  await check(page, phone, 'All assets end', '.end');
});

/** True when Chromium's accessibility tree exposes this text (not hidden by a modal or inert layer), as a screen reader gets it. */
async function exposed(page: Page, text: string): Promise<boolean> {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as { nodes: { ignored: boolean; name?: { value?: unknown } }[] };
  await cdp.detach();
  return nodes.some((n) => !n.ignored && String(n.name?.value ?? '').includes(text));
}

test('Favorites, folders, the card menu, Add to folder and the folder dialogs: Tab, focus rings, 44 px phone targets; the menu by keyboard', async ({ page }, info) => {
  test.setTimeout(120_000);
  const phone = info.project.name === 'phone';
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  await page.getByRole('link', { name: 'Favorites, 0' }).click();
  await expect(page.getByRole('heading', { name: 'No favorites yet.' })).toBeVisible();
  await check(page, phone, 'Favorites (empty)');

  await seedOrg(page, {
    favorites: ['Character 1', 'Object 2', 'UI piece 1', 'Tileset 1'],
    folders: [
      { name: 'Empty shelf', items: [] },
      { name: 'Hero party', items: ['Character 2', 'Object 3', 'Object 5'] },
      { name: 'Lost and found', items: ['gone', 'Object 9'] },
    ],
  });
  await page.reload();
  await expect(page.locator('main.grid a.cell')).toHaveCount(4);
  await settle(page, mock, 600);
  await check(page, phone, 'Favorites');

  // The overlay: full, empty, and with the unavailable-items note.
  await page.getByRole('button', { name: 'Library' }).click();
  for (const [tile, where] of [['Hero party, 3', 'folder'], ['Empty shelf, 0', 'empty folder'], ['Lost and found, 1', 'folder with the note']]) {
    await page.getByRole('link', { name: tile }).click();
    await expect(page.locator('.ov h2')).toBeFocused();
    await settle(page, mock, 600);
    await check(page, phone, where, '.ov');
    await page.getByRole('button', { name: 'Close folder' }).click();
    await expect(page.locator('.ov')).toHaveCount(0);
  }

  // The folder's "…", the name dialog and the delete confirm.
  await page.getByRole('link', { name: 'Hero party, 3' }).click();
  await page.getByRole('button', { name: 'Folder actions' }).click();
  await opened(page.getByRole('menu', { name: 'Folder actions' }));
  await check(page, phone, 'folder menu', '.ov [role="menu"]');
  await page.getByRole('menuitem', { name: 'Rename…' }).click();
  await opened(page.getByRole('dialog', { name: 'Rename folder' }));
  await check(page, phone, 'folder name dialog', 'dialog[open]');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Folder actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete folder…' }).click();
  await opened(page.getByRole('alertdialog', { name: 'Delete "Hero party"?' }));
  await check(page, phone, 'delete confirm', 'dialog[open]');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Close folder' }).click();

  // The card menu by keyboard: Tab to a cell, Shift+F10, ↓, Enter on Favorite: focus back on the cell, the live region speaks.
  await page.getByRole('link', { name: /^Objects, / }).click();
  await settle(page, mock, 600);
  const cell = page.getByRole('link', { name: /^Object 3(, favorite)?$/ });
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let i = 0; i < 20 && !(await cell.evaluate((el) => el === document.activeElement)); i++) await page.keyboard.press('Tab');
  await expect(cell).toBeFocused();
  await page.keyboard.press('Shift+F10');
  const menu = page.getByRole('dialog', { name: 'Object 3' });
  await expect(page.getByRole('menuitem', { name: 'Open' })).toBeFocused();
  await check(page, phone, 'card menu', 'dialog.cm');
  await page.getByRole('menuitem', { name: 'Open' }).focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.getByRole('menuitem', { name: 'Favorite', exact: true })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Object 3, favorite', exact: true })).toBeFocused();
  await expect.poll(() => exposed(page, 'Added to Favorites.')).toBe(true);
  await page.keyboard.press('Shift+F10');
  await expect(page.getByRole('menuitem').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Object 3, favorite', exact: true })).toBeFocused();

  // Add to folder: Tab, rings and sizes; each folder's real checkbox shows a ring on its box and sits in a row of at least 44 px.
  await page.keyboard.press('Shift+F10');
  await page.getByRole('menuitem', { name: 'Add to folder…' }).click();
  const atf = page.getByRole('dialog', { name: 'Add to folder' });
  await opened(atf);
  await check(page, phone, 'Add to folder', 'dialog.cm');
  const boxes = atf.getByRole('checkbox');
  await expect(boxes).toHaveCount(3);
  await atf.getByRole('button', { name: 'New folder' }).focus();
  for (let i = 0; i < 3; i++) {
    await page.keyboard.press('ArrowDown');
    await expect(boxes.nth(i)).toBeFocused();
    const look = await boxes.nth(i).evaluate((el) => ({ ring: getComputedStyle(el.nextElementSibling!).boxShadow, row: el.closest('label')!.getBoundingClientRect().height }));
    expect.soft(look.ring, `checkbox ${i}: no visible focus`).not.toBe('none');
    if (phone) expect.soft(look.row, `checkbox ${i}: row under 44 px`).toBeGreaterThanOrEqual(44);
  }
  await page.keyboard.press('Escape');
  await expect(atf).toHaveCount(0);
});
