// T4 Key screen (mocked PixelLab): good key, wrong key, offline, blocked, welcome back; the key stays in this tab only.
import { expect, test } from '@playwright/test';
import { GOOD_KEY, connect, deviceStorage, mockPixelLab } from '../fixtures/pixellab-mock';

const keyNowhere = async (page: import('@playwright/test').Page, key: string) => {
  expect(page.url()).not.toContain(key);
  expect(await deviceStorage(page)).not.toContain(key);
};

test('good key opens the library; the key is not in the address bar or device storage', async ({ page }) => {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your PixelLab art, all in one place' })).toBeVisible();
  await expect(page.getByText('Welcome back!')).toHaveCount(0);
  await connect(page);
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
  await keyNowhere(page, GOOD_KEY);
  expect(mock.hits.every((h) => !h.url.includes(GOOD_KEY))).toBe(true);
  await page.reload(); // same tab: the key is kept for this tab
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
});

test('wrong key shows the inline error and stays on the key screen', async ({ page }) => {
  await mockPixelLab(page);
  await page.goto('/');
  await page.getByLabel('PixelLab API key').fill('not-a-valid-key');
  await page.getByLabel('PixelLab API key').press('Enter');
  await expect(page.getByText("That API key didn't work. Copy it again from your PixelLab account page and paste it here.")).toBeVisible();
  await expect(page.getByLabel('PixelLab API key')).toHaveAttribute('aria-invalid', 'true');
  await keyNowhere(page, 'not-a-valid-key');
});

test('offline shows the offline hint, and the key works once back online', async ({ page, context }) => {
  await mockPixelLab(page);
  await page.goto('/');
  await context.setOffline(true);
  await page.getByLabel('PixelLab API key').fill(GOOD_KEY);
  await page.getByRole('button', { name: 'Test key' }).click();
  await expect(page.getByText("You're offline. Connect to the internet and try again.")).toBeVisible();
  await context.setOffline(false);
  await page.getByRole('button', { name: 'Test key' }).click();
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
});

test('a blocked connection shows the blocked state; Try again recovers', async ({ page }) => {
  test.setTimeout(60_000);
  const mock = await mockPixelLab(page);
  mock.mode = 'blocked';
  await page.goto('/');
  await page.getByLabel('PixelLab API key').fill(GOOD_KEY);
  await page.getByRole('button', { name: 'Test key' }).click();
  // Network failures are retried twice with back-off before the app calls it blocked.
  await expect(page.getByRole('heading', { name: 'PixelLab is blocking this browser' })).toBeVisible({ timeout: 20_000 });
  expect(mock.hits.filter((h) => h.host === 'api').length).toBe(3);
  mock.mode = 'ok';
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
});

test('a new tab says welcome back, keeps the saved list and asks for the key again', async ({ page, context }) => {
  await mockPixelLab(context);
  await page.goto('/');
  await connect(page);
  const tab = await context.newPage();
  await tab.goto('/');
  await expect(tab.getByText('Welcome back! Your API key was kept for one tab only, so paste it again here.')).toBeVisible();
  await keyNowhere(tab, GOOD_KEY);
  await connect(tab);
  await keyNowhere(tab, GOOD_KEY);
});
