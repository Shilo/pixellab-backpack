// Visual check: screenshots of the key screen, home, two grids, the menu, Activity and the viewer into test-results/shots/ (git-ignored) for a person
// to look at, plus a crispness check: every drawn picture is scaled by a whole number of device pixels, pixelated.
import { expect, test, type Page } from '@playwright/test';
import { connect, mockPixelLab, settle } from '../fixtures/pixellab-mock';

/** Pictures that are not drawn at a whole device-pixel scale with hard pixel edges (expected: none). */
const blurry = (page: Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('canvas')]
      .filter((c) => c.style.display !== 'none')
      .map((c) => ({ scale: (parseFloat(c.style.width) * devicePixelRatio) / c.width, rendering: getComputedStyle(c).imageRendering }))
      .filter((x) => x.scale < 1 || Math.abs(x.scale - Math.round(x.scale)) > 0.01 || x.rendering !== 'pixelated'),
  );
const drawn = (page: Page) => page.evaluate(() => [...document.querySelectorAll('canvas')].filter((c) => c.style.display !== 'none').length);

for (const dpr of [1, 1.5, 2.625]) {
  test.describe(`device pixel ratio ${dpr}`, () => {
    test.use({ deviceScaleFactor: dpr });

    test('key screen, home and grids: screenshots, crisp pixel art', async ({ page }, info) => {
      const shot = (name: string) => page.screenshot({ path: `test-results/shots/${info.project.name}-${dpr}x-${name}.png` });
      const mock = await mockPixelLab(page);
      await page.goto('/');
      await shot('key');

      await connect(page);
      await settle(page, mock);
      await expect.poll(() => drawn(page)).toBe(16); // 4 tiles x 4 mosaic pictures
      expect(await blurry(page)).toEqual([]);
      await shot('home');

      for (const [name, id] of [['Characters', 'characters'], ['Tilesets & tiles', 'tiles']]) {
        await page.getByRole('link', { name: new RegExp(`^${name}, `) }).click();
        await expect(page).toHaveURL(new RegExp(`#/c/${id}$`));
        await settle(page, mock);
        expect(await drawn(page)).toBeGreaterThan(0);
        expect(await blurry(page)).toEqual([]);
        await shot(`grid-${id}`);
        await page.getByRole('button', { name: 'Library' }).click();
      }

      await page.getByRole('button', { name: 'More' }).click();
      await shot('menu');
      await page.getByRole('menuitem', { name: /Activity/ }).click();
      await expect(page.getByRole('dialog', { name: 'Activity' })).toBeVisible();
      await shot('activity');
    });

    test('viewer: character, picker, Info, "…" and a tileset; crisp pixel art', async ({ page }, info) => {
      const shot = (name: string) => page.screenshot({ path: `test-results/shots/${info.project.name}-${dpr}x-viewer-${name}.png` });
      const mock = await mockPixelLab(page);
      await page.goto('/');
      await connect(page);
      await page.getByRole('link', { name: /^Characters, / }).click();
      await page.getByRole('link', { name: 'Character 1', exact: true }).click();
      const v = page.getByRole('dialog', { name: 'Character 1' });
      await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
      await shot('opening'); // name still shown, frames may still be loading
      await settle(page, mock);
      expect(await blurry(page)).toEqual([]);
      await shot('character');

      await v.locator('.vt-chip').click();
      await expect(page.getByRole('dialog', { name: 'Animation, state and direction' })).toBeVisible();
      await shot('picker');
      await page.keyboard.press('Escape');

      await v.getByRole('button', { name: 'Info', exact: true }).click();
      await expect(v.getByRole('complementary', { name: 'Info' })).toBeVisible();
      await page.waitForTimeout(300); // the art re-fits beside the panel
      expect(await blurry(page)).toEqual([]);
      await shot('info');
      await v.getByRole('button', { name: 'Info', exact: true }).click();

      await v.getByRole('button', { name: 'More' }).click();
      await expect(page.getByRole('dialog', { name: 'Viewer options' })).toBeVisible();
      await page.waitForTimeout(300); // the ⓘ highlight fades out
      await shot('more');
      await page.keyboard.press('Escape');
      await page.keyboard.press('Escape');

      await page.getByRole('button', { name: 'Library' }).click();
      await page.getByRole('link', { name: /^Tilesets & tiles, / }).click();
      await page.getByRole('link', { name: 'Tileset 1', exact: true }).click();
      await expect(page.getByRole('dialog', { name: 'Tileset 1' }).locator('canvas')).toBeVisible();
      await settle(page, mock);
      expect(await blurry(page)).toEqual([]);
      await shot('tileset');
    });
  });
}
