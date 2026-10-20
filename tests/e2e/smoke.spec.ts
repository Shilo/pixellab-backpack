import { test, expect } from '@playwright/test';

test('app loads and shows its name', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'PixelLab Backpack' })).toBeVisible();
});
