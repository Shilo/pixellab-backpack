// T10 Viewer extras (mocked PixelLab): the 0.3 s dwell for one arrow press, reduced motion, and integer zoom at three pixel ratios
// and at the two real window sizes.
// 8 fps timing, frame step and loop-off are covered by t8-viewer.spec.ts's first test.
import { expect, test, type Page } from '@playwright/test';
import { connect, mockPixelLab, settle, type Mock } from '../fixtures/pixellab-mock';

const viewer = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
const framesIn = (page: Page) => expect(page.getByText(/^Loading frames/)).toHaveCount(0);

async function openCharacter(page: Page, name: string, size = 16): Promise<Mock> {
  const mock = await mockPixelLab(page);
  mock.size = size;
  await page.goto('/');
  await connect(page);
  await page.getByRole('link', { name: /^Characters, / }).click();
  await settle(page, mock, 600);
  await page.getByRole('link', { name, exact: true }).click();
  await expect(viewer(page, name).locator('.vt-chip')).not.toHaveText('Loading animations…');
  await framesIn(page);
  return mock;
}

test('one arrow press sends nothing for the new asset before 0.3 s, then exactly one detail request', async ({ page }) => {
  const mock = await openCharacter(page, 'Character 12');
  await settle(page, mock, 600);
  const asked: number[] = [];
  page.on('request', (r) => r.url().endsWith('/v2/characters/a-characters-12') && r.method() === 'GET' && asked.push(Date.now()));
  const t0 = Date.now();
  await page.keyboard.press('ArrowRight');
  await expect(viewer(page, 'Character 13')).toBeVisible();
  await expect.poll(() => asked.length).toBe(1);
  expect(asked[0] - t0).toBeGreaterThanOrEqual(300);
  await settle(page, mock, 600);
  expect(asked).toHaveLength(1);
});

test('under reduced motion the animation opens paused on its first frame', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCharacter(page, 'Character 1');
  const v = viewer(page, 'Character 1');
  await v.getByRole('button', { name: 'More' }).click();
  const menu = page.getByRole('dialog', { name: 'Viewer options' });
  await expect(menu.getByRole('button', { name: 'Play' })).toBeVisible();
  const frame = menu.getByText(/^Frame \d+ of 4$/);
  await expect(frame).toHaveText('Frame 1 of 4');
  await page.waitForTimeout(500);
  await expect(frame).toHaveText('Frame 1 of 4');
  await menu.getByRole('button', { name: 'Play' }).click(); // a user choice still plays
  await expect(frame).not.toHaveText('Frame 1 of 4');
});

/** The drawn canvas: its laid-out CSS width × dpr over the art width (16 px). Must be a whole number ≥ 1. */
const scale = (page: Page) =>
  page.locator('.viewer canvas').evaluate((c: HTMLCanvasElement) => ({
    k: (c.getBoundingClientRect().width * devicePixelRatio) / c.width,
    kh: (c.getBoundingClientRect().height * devicePixelRatio) / c.height,
    rendering: getComputedStyle(c).imageRendering,
  }));

/** Waits until the canvas is drawn at a whole device-pixel scale with hard edges (a resize lands a frame later), and returns it. */
const crisp = async (page: Page) => {
  let last = { k: 0, kh: 0, rendering: '' };
  await expect
    .poll(async () => {
      last = await scale(page);
      return last.k >= 1 && Math.abs(last.k - Math.round(last.k)) < 0.02 && Math.abs(last.kh - last.k) < 0.02 && last.rendering === 'pixelated';
    }, { message: 'whole device-pixel scale' })
    .toBe(true);
  return Math.round(last.k);
};
/** Waits until the canvas scale is exactly k device px per art px. */
const scaleIs = (page: Page, k: number) => expect.poll(() => crisp(page)).toBe(k);

for (const dpr of [1, 1.5, 2.625]) {
  test.describe(`device pixel ratio ${dpr}`, () => {
    // A short window so 16 px art fits at a small scale, with zoom steps on both sides of Fit.
    test.use({ deviceScaleFactor: dpr, viewport: { width: 480, height: 320 } });

    test('zoom Fit, 1:1 and every step keep a whole device-pixel scale', async ({ page }) => {
      await openCharacter(page, 'Character 1');
      const v = viewer(page, 'Character 1');
      const fitK = await crisp(page);
      await v.getByRole('button', { name: 'More' }).click();
      const menu = page.getByRole('dialog', { name: 'Viewer options' });
      const readout = menu.getByRole('button', { name: /^Zoom: / });
      await expect(readout).toHaveText(`Fit · ${Math.round((fitK / dpr) * 10) / 10}×`);

      // 1:1 toggle: one CSS px per art px, rounded to whole device px.
      await readout.click();
      await expect(readout).toHaveText('1×');
      await scaleIs(page, Math.max(1, Math.round(dpr)));
      await readout.click();
      await expect(readout).toHaveText(/^Fit/);
      await scaleIs(page, fitK);

      // Steps in until the top, each crisp and larger; then out to the bottom (1×, below Fit), each crisp and smaller.
      const zin = menu.getByRole('button', { name: 'Zoom in' });
      const zout = menu.getByRole('button', { name: 'Zoom out' });
      let last = fitK;
      for (let i = 0; i < 9 && (await zin.isEnabled()); i++) {
        await zin.click();
        await expect.poll(() => crisp(page)).toBeGreaterThan(last);
        last = await crisp(page);
      }
      await expect(readout).toHaveText('16×');
      for (let i = 0; i < 9 && (await zout.isEnabled()); i++) {
        await zout.click();
        await expect.poll(() => crisp(page)).toBeLessThan(last);
        last = await crisp(page);
      }
      await expect(readout).toHaveText('1×');
      await readout.click();
      await expect(readout).toHaveText(/^Fit/);
      await scaleIs(page, fitK);
    });
  });
}

// The projects' own windows (1440×900 and 390×844) with the usual PixelLab sizes, where Fit is often above 16×:
// − and + step by device scale through every step, below Fit too, and each is disabled at its end (02 §6.3).
for (const size of [16, 32]) {
  test(`zoom at the real window size with ${size} px art steps through every step and disables each button at its end`, async ({ page }) => {
    await openCharacter(page, 'Character 1', size);
    const fitK = await crisp(page);
    const dpr = await page.evaluate(() => devicePixelRatio);
    const kOf = (m: number) => Math.max(1, Math.round(m * dpr));
    const STEPS = [1, 2, 3, 4, 6, 8, 12, 16];
    await viewer(page, 'Character 1').getByRole('button', { name: 'More' }).click();
    const menu = page.getByRole('dialog', { name: 'Viewer options' });
    const readout = menu.getByRole('button', { name: /^Zoom: / });
    const zin = menu.getByRole('button', { name: 'Zoom in' });
    const zout = menu.getByRole('button', { name: 'Zoom out' });

    // At Fit, + works only if a step is larger than Fit; − goes to the largest step below it.
    await expect(zin).toBeEnabled({ enabled: STEPS.some((m) => kOf(m) > fitK) });
    const below = STEPS.filter((m) => kOf(m) < fitK);
    for (const m of below.reverse()) {
      await zout.click();
      await expect(readout).toHaveText(`${m}×`);
      await scaleIs(page, kOf(m));
    }
    await expect(zout).toBeDisabled();
    await expect(readout).toBeFocused(); // the disabled button gives its focus to the readout
    for (const m of STEPS.slice(1)) {
      await zin.click();
      await expect(readout).toHaveText(`${m}×`);
      await scaleIs(page, kOf(m));
    }
    await expect(zin).toBeDisabled();
    await expect(readout).toBeFocused();
    await readout.click();
    await expect(readout).toHaveText(/^Fit/);
    await scaleIs(page, fitK);
  });
}
