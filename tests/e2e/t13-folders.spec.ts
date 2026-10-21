// T13 Folders (mocked PixelLab): the New folder tile and name dialog, the empty folder overlay, the duplicate-name error,
// Rename… and Delete folder… from the folder's "…", and a deep link to an unknown folder. Filled folders are Task 8's (card menu).
import { expect, test, type Page } from '@playwright/test';
import { connect, mockPixelLab, settle } from '../fixtures/pixellab-mock';

const said = (page: Page, text: string) => page.getByRole('status').filter({ hasText: text });
const overlay = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });

async function start(page: Page) {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
  return mock;
}

/** New folder tile → name → Create: lands in the new folder's overlay. */
async function newFolder(page: Page, name: string) {
  await page.getByRole('button', { name: 'New folder' }).click();
  const dlg = page.getByRole('dialog', { name: 'New folder' });
  await expect(dlg.getByRole('textbox', { name: 'Folder name' })).toHaveValue('New folder');
  await dlg.getByRole('textbox', { name: 'Folder name' }).fill(name);
  await dlg.getByRole('button', { name: 'Create' }).click();
  await expect(dlg).toBeHidden();
}

test('the New folder tile creates a folder and opens its empty overlay; Go to Library goes home', async ({ page }) => {
  const mock = await start(page);
  const at = mock.hits.length; // from before the folder exists: creating and opening it asks PixelLab nothing
  await newFolder(page, 'Hero party');
  await expect(page).toHaveURL(/#\/f\/[0-9a-f]{12}$/);
  const ov = overlay(page, 'Hero party');
  await expect(ov).toBeVisible();
  await expect(ov.getByRole('heading', { name: 'Hero party', level: 2 })).toBeFocused();
  await expect(ov.getByText('This folder is empty.')).toBeVisible();
  await expect(ov.getByText('Open an asset\'s menu in your library and choose Add to folder.')).toBeVisible();
  await expect(page.locator('h1')).toHaveText('Hero party');
  await expect(page.locator('.vt-dock')).toHaveCount(0); // the dock hides under the overlay
  expect(page.url()).not.toContain('Hero');

  // "/" does nothing while the overlay is open.
  await page.keyboard.press('/');
  await expect(page.getByRole('searchbox', { name: 'Search' })).toHaveCount(0);
  await settle(page, mock, 600);
  expect(mock.hits.length).toBe(at);

  await ov.getByRole('button', { name: 'Go to Library' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(ov).toHaveCount(0);
  const tile = page.getByRole('link', { name: 'Hero party, 0' });
  await expect(tile).toBeFocused(); // focus returns to the folder's tile
  await expect(tile).toHaveAttribute('href', /^#\/f\/[0-9a-f]{12}$/);

  // ✕, Esc and a click on the dim close it too; browser Back as well.
  await tile.click();
  await expect(ov).toBeVisible();
  await page.getByRole('button', { name: 'Close folder' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await tile.click();
  await expect(ov).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(ov).toHaveCount(0);
  await tile.click();
  await expect(ov).toBeVisible();
  await page.mouse.click(4, page.viewportSize()!.height - 30); // the dim, outside the card
  await expect(ov).toHaveCount(0);
  await tile.click();
  await expect(ov).toBeVisible();
  await page.goBack();
  await expect(ov).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
});

test('a duplicate name ignoring case shows the error and disables Create', async ({ page }) => {
  await start(page);
  await newFolder(page, 'Hero party');
  await page.getByRole('button', { name: 'Close folder' }).click();
  await page.getByRole('button', { name: 'New folder' }).click();
  const dlg = page.getByRole('dialog', { name: 'New folder' });
  await dlg.getByRole('textbox', { name: 'Folder name' }).fill('hero PARTY');
  await expect(dlg.getByText('You already have a folder with that name.')).toBeVisible();
  await expect(dlg.getByRole('button', { name: 'Create' })).toBeDisabled();
  await page.keyboard.press('Escape');
  await expect(dlg).toBeHidden();
  await expect(page.getByRole('button', { name: 'New folder' })).toBeFocused();
});

test('Rename… updates the tile; Delete folder… asks first, and deleting goes home and says so', async ({ page }) => {
  await start(page);
  await newFolder(page, 'Boss rush');
  await page.getByRole('button', { name: 'Folder actions' }).click();
  await expect(page.getByRole('menuitem')).toHaveText(['Rename…', 'Delete folder…']);
  await page.getByRole('menuitem', { name: 'Rename…' }).click();
  const ren = page.getByRole('dialog', { name: 'Rename folder' });
  await expect(ren.getByRole('textbox', { name: 'Folder name' })).toHaveValue('Boss rush');
  await ren.getByRole('textbox', { name: 'Folder name' }).fill('Hero party');
  await ren.getByRole('button', { name: 'Save' }).click();
  await expect(ren).toBeHidden();
  const ov = overlay(page, 'Hero party');
  await expect(ov.getByRole('heading', { name: 'Hero party' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Folder actions' })).toBeFocused();

  // Esc closes only the menu, then the overlay.
  await page.getByRole('button', { name: 'Folder actions' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('menuitem')).toHaveCount(0);
  await expect(ov).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(ov).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Hero party, 0' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Boss rush/ })).toHaveCount(0);

  await page.getByRole('link', { name: 'Hero party, 0' }).click();
  await page.getByRole('button', { name: 'Folder actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete folder…' }).click();
  const del = page.getByRole('alertdialog', { name: 'Delete "Hero party"?' });
  await expect(del).toContainText('The 0 assets in it stay in your library. Only the folder goes away.');
  await del.getByRole('button', { name: 'Cancel' }).click();
  await expect(del).toBeHidden();
  await expect(ov).toBeVisible();
  await page.getByRole('button', { name: 'Folder actions' }).click();
  await page.getByRole('menuitem', { name: 'Delete folder…' }).click();
  await del.getByRole('button', { name: 'Delete folder' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await expect(ov).toHaveCount(0);
  await expect(page.getByRole('link', { name: /^Hero party/ })).toHaveCount(0);
  await expect(said(page, 'Deleted "Hero party".')).toBeAttached();
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible(); // home is usable again (not inert)
  await page.getByRole('link', { name: 'Characters, 250' }).click();
  await expect(page).toHaveURL(/#\/c\/characters$/);
});

test('a deep link to an unknown folder lands on home', async ({ page }) => {
  await start(page);
  await page.goto('/#/f/0123456789ab');
  await expect(page).toHaveURL(/#\/$/);
  await page.evaluate(() => history.replaceState(null, '', '#/f/0123456789ab'));
  await page.reload(); // a fresh load: the overlay waits for the folders, then goes home
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('a folder survives a reload, and a deep link to it opens the overlay', async ({ page }) => {
  await start(page);
  await newFolder(page, 'Hero party');
  const url = page.url();
  await page.reload();
  await expect(overlay(page, 'Hero party')).toBeVisible();
  await page.getByRole('button', { name: 'Close folder' }).click();
  await expect(page).toHaveURL(/#\/$/); // not pushed from home in this tab: replaced
  await page.goto(url);
  await expect(overlay(page, 'Hero party')).toBeVisible();
});

/** Rewrites the saved `org` record in IndexedDB as another tab would: 'seed' a folder holding "Object 1", or 'drop' every folder. */
function writeOrg(page: Page, how: 'seed' | 'drop') {
  return page.evaluate(
    (how) =>
      new Promise<void>((done) => {
        const r = indexedDB.open('pixellab-backpack');
        r.onsuccess = () => {
          const kv = r.result.transaction('kv', 'readwrite').objectStore('kv');
          const objs = kv.get('family:objects');
          const org = kv.get('org');
          org.onsuccess = () => {
            const c = objs.result.cards.find((x: { name: string }) => x.name === 'Object 1');
            const seed = { v: 1, favorites: [], cards: { [c.key]: { familyId: 'objects', card: c } }, folders: [{ id: 'aaaaaaaaaaaa', name: 'Hero party', at: 1, items: [c.key] }] };
            kv.put(how === 'seed' ? seed : { ...org.result, folders: [] }, 'org');
          };
          kv.transaction.oncomplete = () => (r.result.close(), done());
        };
      }),
    how,
  );
}

test('a folder deleted in another tab under an open viewer: the viewer stays, and closing it lands on home', async ({ page }) => {
  await start(page);
  // A folder holding "Object 1" (filled folders come from the card menu, Task 8).
  await writeOrg(page, 'seed');
  await page.reload();
  await page.getByRole('link', { name: 'Hero party, 1' }).click();
  const ov = overlay(page, 'Hero party');
  await expect(ov.getByText('1 asset', { exact: true })).toBeVisible();
  await ov.getByRole('link', { name: 'Object 1', exact: true }).click();
  const v = page.getByRole('dialog', { name: 'Object 1', exact: true });
  await expect(v).toBeVisible();

  await writeOrg(page, 'drop');
  await page.evaluate(() => document.dispatchEvent(new Event('visibilitychange'))); // this tab is focused again: it re-reads org
  await expect(ov).toHaveCount(0);
  await page.waitForTimeout(300);
  await expect(v).toBeVisible(); // the viewer is not closed under the user
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.locator('.vt-dock')).toBeVisible();
  await page.getByRole('link', { name: 'Characters, 250' }).click(); // home is usable (not inert)
  await expect(page).toHaveURL(/#\/c\/characters$/);
});
