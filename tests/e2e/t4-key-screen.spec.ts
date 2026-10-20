// T4 Key screen (mocked PixelLab): good key, wrong key, offline, can't reach, not answering, welcome back, reconnect;
// the key stays in this tab only.
import { expect, test } from '@playwright/test';
import { GOOD_KEY, connect, deviceStorage, mockPixelLab, settle } from '../fixtures/pixellab-mock';

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

test("a refused connection shows Can't reach PixelLab; Try again recovers", async ({ page }) => {
  test.setTimeout(60_000);
  const mock = await mockPixelLab(page);
  mock.mode = 'blocked';
  await page.goto('/');
  await page.getByLabel('PixelLab API key').fill(GOOD_KEY);
  await page.getByRole('button', { name: 'Test key' }).click();
  // Network failures are retried twice with back-off before the app gives up.
  await expect(page.getByRole('heading', { name: "Can't reach PixelLab right now." })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText('blocking')).toHaveCount(0);
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

test("server errors show PixelLab isn't answering (not a blocked browser); Try again recovers", async ({ page }) => {
  test.setTimeout(60_000);
  const mock = await mockPixelLab(page);
  mock.mode = 'down';
  await page.goto('/');
  await page.getByLabel('PixelLab API key').fill(GOOD_KEY);
  await page.getByRole('button', { name: 'Test key' }).click();
  await expect(page.getByRole('heading', { name: "PixelLab isn't answering right now." })).toBeVisible({ timeout: 20_000 });
  expect(mock.hits.filter((h) => h.host === 'api').length).toBe(3); // 2 retries, then the stop
  mock.mode = 'ok';
  await page.getByRole('button', { name: 'Try again' }).click(); // lifts the stop and tests the key again
  await expect(page.getByRole('link', { name: 'Characters, 250' })).toBeVisible();
});

test('a key that stops working mid-session asks to reconnect, not "Welcome back"', async ({ page }) => {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock); // pictures (Tiles Pro asks the API for its link) are done before the key stops working
  await page.route('https://api.pixellab.ai/v2/**', (route) =>
    route.fulfill({ status: 401, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization' } }),
  );
  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Refresh/ }).click();
  await expect(page.getByText('Reconnect to PixelLab.')).toBeVisible();
  await expect(page.getByText('Your API key stopped working.', { exact: false })).toBeVisible();
  await expect(page.getByText('Welcome back!')).toHaveCount(0);
});
