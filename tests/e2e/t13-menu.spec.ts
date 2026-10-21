// T13 Card menu (mocked PixelLab): right-click, Shift+F10 and a touch long press on cells; Favorite and Add to folder from it;
// Add to folder from the viewer's "…"; the viewer over a filled folder (Esc and Back); items gone from PixelLab; the menu over
// search results and the folder overlay.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { ageSaved, connect, mockPixelLab, settle, type Mock } from '../fixtures/pixellab-mock';

const said = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });
const overlay = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
const items = (page: Page) => page.getByRole('menuitem');
const cell = (page: Page, name: string) => page.getByRole('link', { name: new RegExp(`^${name}(, favorite)?$`) });
const box = (page: Page, folder: string) => page.getByRole('checkbox', { name: new RegExp(`^${folder}`) });
const HOUR = 3_600_000;

async function start(page: Page): Promise<Mock> {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  return mock;
}

/** New folder tile → name → Create, then back home. */
async function newFolder(page: Page, name: string) {
  await page.getByRole('button', { name: 'New folder' }).click();
  const dlg = page.getByRole('dialog', { name: 'New folder' });
  await dlg.getByRole('textbox', { name: 'Folder name' }).fill(name);
  await dlg.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('button', { name: 'Close folder' }).click();
  await expect(page).toHaveURL(/#\/$/);
}

const objects = (page: Page) => page.getByRole('link', { name: 'Objects, 12' }).click();

/** Right-click a cell, Add to folder…, toggle a folder, Done. */
async function toggleIn(page: Page, c: Locator, folder: string, on: boolean) {
  await c.click({ button: 'right' });
  await items(page).filter({ hasText: 'Add to folder…' }).click();
  await (on ? box(page, folder).check() : box(page, folder).uncheck());
  await expect(said(page, `${on ? 'Added to' : 'Removed from'} ${folder}.`)).toBeAttached();
  await page.getByRole('button', { name: 'Done' }).click();
  await expect(page.getByRole('dialog', { name: 'Add to folder' })).toHaveCount(0);
}

test('right-click a cell: Open, Favorite and Add to folder… only; Favorite marks the cell; Esc gives focus back to it', async ({ page }) => {
  const mock = await start(page);
  await objects(page);
  const c = cell(page, 'Object 2');
  const at = mock.hits.filter((h) => h.host === 'api').length;
  await c.click({ button: 'right' });
  const m = page.getByRole('dialog', { name: 'Object 2' });
  await expect(m).toBeVisible();
  await expect(items(page)).toHaveText(['Open', 'Favorite', 'Add to folder…']);
  await expect(items(page).first()).toBeFocused();
  await items(page).filter({ hasText: 'Favorite' }).click();
  await expect(m).toHaveCount(0);
  await expect(said(page, 'Added to Favorites.')).toBeAttached();
  await expect(page.getByRole('link', { name: 'Object 2, favorite', exact: true }).locator('.fav')).toBeVisible();
  await expect(c).toBeFocused();

  await c.click({ button: 'right' });
  await expect(items(page)).toHaveText(['Open', 'Unfavorite', 'Add to folder…']);
  await page.keyboard.press('Escape');
  await expect(m).toHaveCount(0);
  await expect(c).toBeFocused();
  await expect(page).toHaveURL(/#\/c\/objects$/); // Esc closed only the menu
  expect(mock.hits.filter((h) => h.host === 'api').length).toBe(at); // the menu and Favorite ask PixelLab nothing

  await c.click({ button: 'right' });
  await items(page).filter({ hasText: 'Open' }).click();
  await expect(page.getByRole('dialog', { name: 'Object 2', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#\/c\/objects\/a\/[0-9a-f]{12}$/);
});

test('Shift+F10 opens the menu; Add to folder checks a folder; the overlay lists it; unchecking from the overlay removes it', async ({ page }) => {
  await start(page);
  await newFolder(page, 'Hero party');
  await objects(page);
  const c = cell(page, 'Object 2');
  await c.focus();
  await page.keyboard.press('Shift+F10');
  await expect(items(page).first()).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(items(page).nth(2)).toBeFocused();
  await page.keyboard.press('Enter');
  const atf = page.getByRole('dialog', { name: 'Add to folder' });
  await expect(atf).toBeVisible();
  await expect(atf.locator('.ph')).toContainText('Object 2'); // the header names the asset
  await expect(box(page, 'Hero party')).not.toBeChecked();
  await box(page, 'Hero party').check();
  await expect(said(page, 'Added to Hero party.')).toBeAttached();
  await expect(atf.getByText('1 asset', { exact: true })).toBeVisible();
  await atf.getByRole('button', { name: 'Done' }).click();
  await expect(atf).toHaveCount(0);
  await expect(c).toBeFocused();

  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('link', { name: 'Hero party, 1' }).click();
  const ov = overlay(page, 'Hero party');
  await expect(ov.getByText('1 asset', { exact: true })).toBeVisible();
  const inside = ov.getByRole('link', { name: 'Object 2', exact: true });
  await expect(inside).toBeVisible();

  // The menu opens over the overlay too; Esc closes only the menu.
  await inside.click({ button: 'right' });
  await expect(items(page)).toHaveCount(3);
  await page.keyboard.press('Escape');
  await expect(items(page)).toHaveCount(0);
  await expect(ov).toBeVisible();
  await expect(inside).toBeFocused();
  await toggleIn(page, inside, 'Hero party', false);
  await expect(ov.getByText('This folder is empty.')).toBeVisible();
  await expect(ov).toBeVisible(); // Done and Esc in the menu never close the overlay under it
});

test('the New folder row makes a folder with the asset in it, in one step', async ({ page }) => {
  await start(page);
  await objects(page);
  await cell(page, 'Object 3').click({ button: 'right' });
  await items(page).filter({ hasText: 'Add to folder…' }).click();
  await page.getByRole('button', { name: 'New folder' }).click();
  const dlg = page.getByRole('dialog', { name: 'New folder' });
  await dlg.getByRole('textbox', { name: 'Folder name' }).fill('Boss rush');
  await dlg.getByRole('button', { name: 'Create' }).click();
  await expect(dlg).toBeHidden();
  await expect(box(page, 'Boss rush')).toBeChecked();
  await expect(said(page, 'Added to Boss rush.')).toBeAttached();
  await page.getByRole('button', { name: 'Done' }).click();
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page.getByRole('link', { name: 'Boss rush, 1' })).toBeVisible();
});

test("the viewer's \"…\" → Add to folder… adds the current card; focus returns to the \"…\"", async ({ page }) => {
  await start(page);
  await newFolder(page, 'Hero party');
  await objects(page);
  await cell(page, 'Object 3').click();
  const v = page.getByRole('dialog', { name: 'Object 3', exact: true });
  await expect(v).toBeVisible();
  const more = v.getByRole('button', { name: 'More' });
  await more.click();
  await page.getByRole('button', { name: 'Add to folder…' }).click();
  const atf = page.getByRole('dialog', { name: 'Add to folder' });
  await expect(atf).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Viewer options' })).toHaveCount(0);
  await box(page, 'Hero party').check();
  await expect(said(page, 'Added to Hero party.')).toBeAttached();
  await page.keyboard.press('Escape'); // closes only Add to folder
  await expect(atf).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Object 3', exact: true })).toBeVisible();
  await expect(more).toBeFocused();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page.getByRole('link', { name: 'Hero party, 1' })).toBeVisible();
});

test('the viewer over a filled folder: Esc, then Esc again; Back, then Back again', async ({ page }) => {
  await start(page);
  await newFolder(page, 'Hero party');
  await objects(page);
  await toggleIn(page, cell(page, 'Object 5'), 'Hero party', true);
  await page.getByRole('button', { name: 'Library' }).click();
  const tile = page.getByRole('link', { name: 'Hero party, 1' });
  const ov = overlay(page, 'Hero party');
  const inside = ov.getByRole('link', { name: 'Object 5', exact: true });
  const v = page.getByRole('dialog', { name: 'Object 5', exact: true });

  await tile.click();
  await inside.click();
  await expect(v).toBeVisible();
  await expect(page).toHaveURL(/#\/f\/[0-9a-f]{12}\/a\/[0-9a-f]{12}$/);
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);
  await expect(ov).toBeVisible();
  await expect(inside).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(ov).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);

  await tile.click();
  await inside.click();
  await expect(v).toBeVisible();
  await page.goBack();
  await expect(v).toHaveCount(0);
  await expect(ov).toBeVisible();
  await expect(inside).toBeFocused();
  await page.goBack();
  await expect(ov).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
});

test('an item gone from PixelLab: the folder says so and Remove them clears it; Favorites hides it', async ({ page }) => {
  const mock = await start(page);
  await newFolder(page, 'Hero party');
  await objects(page);
  const c = cell(page, 'Object 12');
  await toggleIn(page, c, 'Hero party', true);
  await c.click({ button: 'right' });
  await items(page).filter({ hasText: 'Favorite' }).click();
  await expect(said(page, 'Added to Favorites.')).toBeAttached();
  await settle(page, mock, 600);

  mock.counts.a.objects = 11; // deleted in PixelLab: the next check finds the whole family without it
  await ageSaved(page, 'objects', { checkedMs: 2 * HOUR });
  await page.goto('/'); // a fresh load (the address had a hash)
  await settle(page, mock, 600);
  await expect(page.getByRole('link', { name: 'Favorites, 0' })).toBeVisible();
  await page.getByRole('link', { name: 'Hero party, 0' }).click();
  const ov = overlay(page, 'Hero party');
  await expect(ov.getByText("1 item in this folder isn't in your PixelLab library anymore.")).toBeVisible();
  await ov.getByRole('button', { name: 'Remove them' }).click();
  await expect(ov.getByText("isn't in your PixelLab library anymore.")).toHaveCount(0);
  await expect(said(page, 'Removed from Hero party.')).toBeAttached();
  await expect(ov.getByText('This folder is empty.')).toBeVisible();

  await page.getByRole('button', { name: 'Close folder' }).click();
  await page.getByRole('link', { name: 'Favorites, 0' }).click();
  await expect(page.getByRole('heading', { name: 'No favorites yet.' })).toBeVisible();
});

test('phone: a 600 ms touch press opens the sheet and does not open the viewer; moving first cancels it; a short tap still opens the viewer', async ({ page }, info) => {
  test.skip(info.project.name !== 'phone', 'touch only');
  // iOS fires no contextmenu: hide Chromium's own long-press one from the app, so only the 500 ms timer can open the menu.
  await page.addInitScript(() => addEventListener('contextmenu', (e) => e.stopImmediatePropagation(), true));
  await start(page);
  await objects(page);
  const c = cell(page, 'Object 2');
  const b = (await c.boundingBox())!;
  const x = b.x + b.width / 2;
  const y = b.y + b.width / 2;
  const cdp = await page.context().newCDPSession(page);
  const touch = (type: 'touchStart' | 'touchMove' | 'touchEnd', at: { x: number; y: number }[]) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: at });
  const m = page.getByRole('dialog', { name: 'Object 2' });

  // Moved more than 10 px (sideways, or a scroll) before 500 ms: no menu, no viewer.
  for (const to of [{ x: x + 20, y }, { x, y: y - 40 }]) {
    await touch('touchStart', [{ x, y }]);
    await page.waitForTimeout(100);
    await touch('touchMove', [to]);
    await page.waitForTimeout(600);
    await touch('touchEnd', []);
    await page.waitForTimeout(300);
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page).toHaveURL(/#\/c\/objects$/);
    await page.locator('main.grid').evaluate((el) => el.scrollTo(0, 0));
  }

  await touch('touchStart', [{ x, y }]);
  await page.waitForTimeout(600);
  await touch('touchEnd', []);
  await expect(m).toBeVisible();
  await expect(items(page)).toHaveText(['Open', 'Favorite', 'Add to folder…']);
  await page.waitForTimeout(300);
  await expect(m).toBeVisible(); // the release did not close it
  await expect(page).toHaveURL(/#\/c\/objects$/);
  // A sheet: full width at the bottom.
  const sheet = (await m.locator('.panel').boundingBox())!;
  expect(sheet.width).toBeGreaterThan(360);
  expect(sheet.y + sheet.height).toBeGreaterThan(page.viewportSize()!.height - 60);
  await page.keyboard.press('Escape');
  await expect(m).toHaveCount(0);

  await c.tap();
  await expect(page.getByRole('dialog', { name: 'Object 2', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/#\/c\/objects\/a\/[0-9a-f]{12}$/);
});

test('the menu opens over search results and works there; Esc closes only the menu', async ({ page }) => {
  await start(page);
  await page.locator('[data-search]').click();
  await page.getByRole('searchbox', { name: 'Search' }).fill('object 2');
  const res = page.locator('.glass-popover.panel .res a[data-key]').first();
  await expect(res).toBeVisible();
  await res.click({ button: 'right' });
  await expect(items(page)).toHaveText(['Open', 'Favorite', 'Add to folder…']);
  await items(page).filter({ hasText: 'Favorite' }).click();
  await expect(said(page, 'Added to Favorites.')).toBeAttached();
  await expect(res).toBeFocused(); // the result, not the inert grid's copy under the search
  await res.click({ button: 'right' });
  await page.keyboard.press('Escape');
  await expect(items(page)).toHaveCount(0);
  await expect(page.getByRole('searchbox', { name: 'Search' })).toBeVisible();
  await expect(res).toBeFocused();
});
