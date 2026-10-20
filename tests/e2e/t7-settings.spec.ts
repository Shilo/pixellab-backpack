// T7 Settings (mocked PixelLab): menu, key hint, Keep me signed in, Forget key, About, no sideways scroll, keyboard.
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { GOOD_KEY, connect, deviceStorage, mockPixelLab, settle, type Hit } from '../fixtures/pixellab-mock';

const api = (hits: Hit[]) => hits.filter((h) => h.host === 'api');
const keptKey = (page: Page) => page.evaluate(() => localStorage.getItem('pixellab-backpack:key-kept'));

async function open(page: Page) {
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Settings/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  return dialog;
}

async function start(page: Page) {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock);
  return mock;
}

test('the menu has three items; Settings opens, Esc closes it, focus is back on "…"', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'More' }).click();
  await expect(page.getByRole('menuitem')).toHaveText([/Refresh/, /Activity/, /Settings/]);
  await expect(page.getByRole('menuitem', { name: /Settings/ })).toContainText('Key, privacy and about');
  await page.getByRole('menuitem', { name: /Settings/ }).click();
  const dialog = page.getByRole('dialog', { name: 'Settings' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'PixelLab connection' })).toBeVisible();
  for (const hidden of ['Test', 'Plan', 'Library', 'Appearance', 'Keyboard', 'Storage']) {
    await expect(dialog.getByRole('heading', { name: hidden, exact: true })).toHaveCount(0);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'More' })).toBeFocused();

  await open(page);
  await page.getByRole('button', { name: 'Close settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeHidden();
  await expect(page.getByRole('button', { name: 'More' })).toBeFocused();
});

test('the key hint shows exactly the last 4 characters, never the key', async ({ page }) => {
  await start(page);
  const dialog = await open(page);
  await expect(dialog.getByText(`API key ending ••••${GOOD_KEY.slice(-4)}`)).toBeVisible();
  expect(await dialog.innerHTML()).not.toContain(GOOD_KEY);
  expect(await dialog.innerText()).not.toContain(GOOD_KEY.slice(-5));
});

test('Keep me signed in: on survives a new tab with 0 requests; off asks first; Stop removes only the saved key', async ({ page, context }) => {
  const mock = await start(page);
  const dialog = await open(page);
  const keep = dialog.getByRole('switch', { name: 'Keep me signed in' });
  await expect(dialog.getByText("Kept in this tab only. You'll paste it again in a new tab.")).toBeVisible();
  await keep.check(); // applies at once, no confirm
  await expect(dialog.getByText(/Saved in this browser so you don't need to paste it again/)).toBeVisible();
  expect(await keptKey(page)).toBe(GOOD_KEY);
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0); // never both

  const at = mock.hits.length;
  const tab = await context.newPage();
  await tab.goto('/');
  await expect(tab.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await settle(tab, mock);
  expect(api(mock.hits.slice(at))).toEqual([]);
  await tab.close();

  // Off with Cancel keeps it on.
  await keep.click();
  const confirm = page.getByRole('dialog', { name: 'Stop keeping you signed in?' });
  await expect(confirm).toContainText("Backpack will delete your saved API key from this browser. You'll stay connected in this tab.");
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirm).toBeHidden();
  await expect(keep).toBeChecked();
  expect(await keptKey(page)).toBe(GOOD_KEY);

  // Off with Stop: saved key gone, tab stays connected, saved library stays.
  await keep.click();
  await confirm.getByRole('button', { name: 'Stop' }).click();
  await expect(keep).not.toBeChecked();
  expect(await keptKey(page)).toBeNull();
  expect(await deviceStorage(page)).not.toContain(GOOD_KEY);
  expect(await deviceStorage(page)).toContain('family:characters');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  const before = mock.hits.length;
  await page.reload(); // the tab copy of the key is still here
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await settle(page, mock);
  expect(api(mock.hits.slice(before))).toEqual([]);
});

test('Forget key: Cancel does nothing; confirm shows the key screen, wipes the copy and sends no request', async ({ page }) => {
  const mock = await start(page);
  const dialog = await open(page);
  await dialog.getByRole('button', { name: 'Forget key' }).click();
  const confirm = page.getByRole('dialog', { name: 'Forget your API key?' });
  await expect(confirm).toContainText("Backpack will disconnect on this device and delete its saved copy of your library. Your PixelLab account isn't affected.");
  await expect(confirm).toContainText('Your browser may still keep some images in its own cache.');
  await expect(confirm).not.toContainText('folders');
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(confirm).toBeHidden();
  await expect(dialog).toBeVisible();
  expect(await deviceStorage(page)).toContain('family:characters');

  const at = mock.hits.length;
  await dialog.getByRole('button', { name: 'Forget key' }).click();
  await confirm.getByRole('button', { name: 'Forget key' }).click();
  await expect(page.getByRole('heading', { name: 'Your PixelLab art, all in one place' })).toBeVisible();
  await expect(page.getByText('Welcome back!')).toHaveCount(0);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const stored = await deviceStorage(page);
  expect(stored).not.toContain('family:');
  expect(stored).not.toContain('detail:');
  expect(stored).not.toContain(GOOD_KEY);
  expect(await page.evaluate(() => sessionStorage.length)).toBe(0);
  await settle(page, mock);
  expect(mock.hits.length).toBe(at);
});

test('About shows the version and the outbound links, all safe', async ({ page }) => {
  await start(page);
  const dialog = await open(page);
  const version = JSON.parse(await readFile('package.json', 'utf8')).version;
  await expect(dialog.getByText(`Version ${version}`)).toBeVisible();
  await expect(dialog.getByText("PixelLab Backpack is an unofficial gallery for your PixelLab assets.")).toBeVisible();
  await expect(dialog.getByText('No analytics, no tracking, no servers.')).toBeVisible();
  const want = [
    ['Fonts', 'https://www.pixellab.ai/create'],
    ['Effects', 'https://www.pixellab.ai/create-vfx'],
    ['Portraits', 'https://www.pixellab.ai/create-character'],
    ['Talking animations', 'https://www.pixellab.ai/create-character'],
    ['Licences', '/licenses.txt'],
    ['Generate a new API key in your PixelLab account', 'https://www.pixellab.ai/account'],
  ];
  for (const [name, href] of want) {
    const link = dialog.getByRole('link', { name: new RegExp(`^${name}`) });
    await expect(link).toHaveAttribute('href', href);
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  }
  expect((await page.request.get('/licenses.txt')).ok()).toBe(true);
});

test('no sideways scroll, and the keyboard reaches every control', async ({ page }) => {
  await start(page);
  const dialog = await open(page);
  const fits = await page.evaluate(() => {
    const d = document.querySelector('dialog[open]')!;
    return d.scrollWidth <= d.clientWidth && document.documentElement.scrollWidth <= innerWidth;
  });
  expect(fits).toBe(true);
  const seen: string[] = [];
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    seen.push(
      await page.evaluate(() => {
        const el = document.activeElement as HTMLInputElement;
        return (el.getAttribute('aria-label') ?? el.labels?.[0]?.innerText ?? el.innerText).trim();
      }),
    );
  }
  for (const name of ['Close settings', 'Keep me signed in', 'Forget key', 'Generate a new API key', 'Fonts', 'Effects', 'Portraits', 'Talking animations', 'Licences']) {
    expect(seen.some((t) => t.startsWith(name)), `${name} in ${JSON.stringify(seen)}`).toBe(true);
  }
  await expect(dialog.getByRole('switch', { name: 'Keep me signed in' })).toBeVisible();
});
