import { test, expect } from '@playwright/test';

test('app loads and shows its name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'PixelLab Backpack' })).toBeVisible();
});

test('category opens, Library and browser Back return home, inert controls do nothing', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (r) => requests.push(r.url()));
  await page.goto('/');
  await page.getByRole('link', { name: 'Objects' }).click();
  await expect(page).toHaveURL(/#\/c\/objects$/);
  await page.getByRole('button', { name: /^Select/ }).click({ force: true });
  await page.getByRole('button', { name: /^Search/ }).click({ force: true });
  await expect(page).toHaveURL(/#\/c\/objects$/);
  await page.getByRole('button', { name: 'Library' }).click();
  await expect(page).toHaveURL(/#\/$/);
  await page.goBack();
  await expect(page).toHaveURL(/#\/c\/objects$/);
  await page.goBack();
  await expect(page.getByRole('link', { name: 'Objects' })).toBeVisible();
  expect(requests.filter((u) => !u.startsWith('http://localhost:4173'))).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
