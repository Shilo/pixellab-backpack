// T8 Viewer (mocked PixelLab): opening an asset, the player, the chip, states, stills, Info, errors, prev/next, closing and deep links.
import { expect, test, type Page } from '@playwright/test';
import { connect, mockPixelLab, settle, type Mock } from '../fixtures/pixellab-mock';

const viewer = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });
const KEY_URL = /#\/c\/characters\/a\/[0-9a-f]{12}$/;

async function openGrid(page: Page, category: RegExp): Promise<Mock> {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await page.getByRole('link', { name: category }).click();
  await settle(page, mock, 600);
  return mock;
}

/** Opens a cell and waits until the animation's frames are all in. */
async function open(page: Page, name: string) {
  await page.getByRole('link', { name, exact: true }).click();
  const v = viewer(page, name);
  await expect(v).toBeVisible();
  return v;
}
const framesIn = (page: Page) => expect(page.getByText(/^Loading frames/)).toHaveCount(0);

test('a character opens by its key, plays at 8 fps; Space pauses, step, loop off and speed work', async ({ page }) => {
  const mock = await openGrid(page, /^Characters, /);
  const v = await open(page, 'Character 1');
  await expect(page).toHaveURL(KEY_URL);
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await framesIn(page);
  expect(page.url()).not.toContain('a-characters');
  expect(mock.hits.filter((h) => h.detail)).toHaveLength(1);

  // The frame counter lives in the "…" menu. Median time per frame over 2 s (robust to a stalled frame under test load).
  await v.getByRole('button', { name: 'More' }).click();
  const menu = page.getByRole('dialog', { name: 'Viewer options' });
  const frame = menu.getByText(/^Frame \d+ of 4$/);
  await expect(frame).toBeAttached();
  const perFrame = await frame.evaluate(
    (el) =>
      new Promise<number>((done) => {
        const at = () => Number(/Frame (\d+)/.exec(el.textContent ?? '')![1]);
        let last = at();
        let lastT = performance.now();
        const gaps: number[] = [];
        const t0 = lastT;
        const step = (now: number) => {
          const i = at();
          if (i !== last) {
            if ((i - last + 4) % 4 === 1) gaps.push(now - lastT);
            last = i;
            lastT = now;
          }
          if (now - t0 < 2000) requestAnimationFrame(step);
          else done(gaps.sort((x, y) => x - y)[gaps.length >> 1]);
        };
        requestAnimationFrame(step);
      }),
  );
  expect(perFrame).toBeGreaterThan(95); // 8 fps = 125 ms, give or take a display frame
  expect(perFrame).toBeLessThan(160);

  // Esc closes only the menu; focus goes back to "…".
  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(v).toBeVisible();
  await expect(v.getByRole('button', { name: 'More' })).toBeFocused();

  // Space (outside a button) pauses.
  await v.locator('#vw-title').focus();
  await page.keyboard.press('Space');
  await v.getByRole('button', { name: 'More' }).click();
  await expect(menu.getByRole('button', { name: 'Play' })).toBeVisible();
  const paused = await frame.textContent();
  await page.waitForTimeout(400);
  await expect(frame).toHaveText(paused!);
  const n = Number(/Frame (\d+)/.exec(paused!)![1]);
  await menu.getByRole('button', { name: 'Step forward' }).click();
  await expect(frame).toHaveText(`Frame ${(n % 4) + 1} of 4`);

  // Loop off: plays to the last frame and stops there.
  await menu.getByRole('switch', { name: 'Loop' }).click();
  await menu.getByRole('button', { name: 'Play' }).click();
  await expect(frame).toHaveText('Frame 4 of 4');
  await expect(menu.getByRole('button', { name: 'Play' })).toBeVisible();
  await page.waitForTimeout(300);
  await expect(frame).toHaveText('Frame 4 of 4');

  await menu.getByRole('button', { name: 'Faster' }).click();
  await expect(menu.getByText('9 fps')).toBeVisible();
  await menu.getByRole('button', { name: 'Reset' }).click();
  await expect(menu.getByText('8 fps')).toBeVisible();
  await expect(menu.getByRole('button', { name: 'Reset' })).toHaveCount(0);
});

test('the chip lists Rotations and the animations; a direction change loads and shows only that direction', async ({ page }) => {
  const mock = await openGrid(page, /^Characters, /);
  const v = await open(page, 'Character 1');
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await framesIn(page);

  await v.locator('.vt-chip').click();
  const pick = page.getByRole('dialog', { name: 'Animation, state and direction' });
  for (const name of ['Rotations', 'Walk · 4f', 'Breathing idle · 4f']) await expect(pick.getByRole('button', { name: new RegExp(`^${name}`) })).toBeVisible();
  await pick.getByRole('radio', { name: 'East', exact: true }).click();
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · East');
  await framesIn(page);
  const frames = mock.hits.filter((h) => h.url.includes('/a-characters-0/')).map((h) => new URL(h.url).pathname.split('/a-characters-0/')[1]);
  expect(new Set(frames)).toEqual(new Set([0, 1, 2, 3].flatMap((f) => [`breathing-idle/south/${f}.png`, `breathing-idle/east/${f}.png`])));

  await page.keyboard.press('Escape');
  await expect(pick).toHaveCount(0);
  await expect(v).toBeVisible();
  await expect(v.locator('.vt-chip')).toBeFocused();
});

test('a grouped character shows one cell, and its chip switches to the Armored state', async ({ page }) => {
  await openGrid(page, /^Characters, /);
  await expect(page.getByTitle('Character 7', { exact: true })).toHaveCount(1);
  const v = await open(page, 'Character 7');
  const url = page.url();
  await expect(v.locator('.vt-chip')).toContainText('Breathing idle');
  await v.locator('.vt-chip').click();
  const pick = page.getByRole('dialog', { name: 'Animation, state and direction' });
  await pick.getByRole('group', { name: 'State' }).getByRole('button', { name: 'Armored' }).click();
  await expect(v.locator('.vt-chip')).toContainText('Armored');
  expect(page.url()).not.toBe(url);
  await expect(page).toHaveURL(KEY_URL);
  // Closing from the other state returns focus to the group's one cell.
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Character 7', exact: true })).toBeFocused();
});

test('a 1-direction object plays its animation with no direction rose', async ({ page }) => {
  const mock = await openGrid(page, /^Objects, /);
  const v = await open(page, 'Object 1');
  await expect(v.locator('.vt-chip')).toHaveText('Gently bobbing');
  await framesIn(page);
  expect(mock.hits.filter((h) => h.url.includes('/bob/unknown/'))).toHaveLength(3);
  await v.locator('.vt-chip').click();
  await expect(page.getByRole('radiogroup', { name: 'Direction' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await v.getByRole('button', { name: 'More' }).click();
  await expect(page.getByRole('dialog', { name: 'Viewer options' }).getByRole('button', { name: 'Pause' })).toBeVisible();
});

test('a tileset, Tiles Pro, isometric tile and UI asset each show a still with no chip and no Playback', async ({ page }) => {
  const mock = await openGrid(page, /^Tilesets & tiles, /);
  const check = async (name: string) => {
    const at = mock.hits.filter((h) => h.detail).length;
    const v = await open(page, name);
    await expect(v.locator('canvas')).toBeVisible();
    await page.waitForTimeout(500);
    await expect(v.locator('.vt-chip')).toHaveCount(0);
    await v.getByRole('button', { name: 'More' }).click();
    const menu = page.getByRole('dialog', { name: 'Viewer options' });
    await expect(menu.getByText('Zoom')).toBeVisible();
    await expect(menu.getByText('Playback')).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await expect(v).toHaveCount(0);
    expect(mock.hits.filter((h) => h.detail).length).toBe(at);
  };
  for (const name of ['Tileset 1', 'Pro tile 1', 'Iso tile 1']) await check(name);
  await page.getByRole('button', { name: 'Library' }).click();
  await page.getByRole('link', { name: /^UI, / }).click();
  await check('UI piece 1');
});

test('Info opens as a side panel or sheet with the documented rows, copies the prompt and shows only a masked id', async ({ page, context }, info) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await openGrid(page, /^Characters, /);
  const v = await open(page, 'Character 1');
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await expect(v.getByRole('button', { name: 'Info', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const panel = v.getByRole('complementary', { name: 'Info' });
  await expect(panel).toBeVisible();
  const box = (await panel.boundingBox())!;
  const vp = page.viewportSize()!;
  if (info.project.name === 'desktop') expect(box.x).toBeGreaterThan(vp.width / 2); // side panel
  else expect(box.y).toBeGreaterThan(vp.height / 3); // bottom sheet
  for (const label of ['State', 'Canvas', 'Directions', 'Animation', 'Created', 'Playback']) await expect(panel.locator('dt', { hasText: label }).first()).toBeVisible();
  await expect(panel.locator('.fact', { has: page.locator('dt', { hasText: 'Directions' }) })).toContainText('8 · S, SE, E, NE, N, NW, W, SW');

  await panel.getByRole('button', { name: 'Copy prompt' }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('synthetic courier 1');

  await panel.getByText('Technical details').click();
  await expect(panel).toContainText('a-ch…rs-0');
  await expect(v).not.toContainText('a-characters-0');

  // Esc inside the panel closes the panel only; the toggle follows.
  await panel.focus();
  await page.keyboard.press('Escape');
  await expect(panel).toHaveCount(0);
  await expect(v).toBeVisible();
  await expect(v.getByRole('button', { name: 'Info', exact: true })).toHaveAttribute('aria-pressed', 'false');
});

test("a detail that fails shows the error with Try again, which loads it", async ({ page }) => {
  const mock = await openGrid(page, /^Characters, /);
  mock.fail = ['/v2/characters/a-characters-0'];
  const v = await open(page, 'Character 1');
  const msg = v.getByRole('status').filter({ hasText: "Couldn't load this asset's animations." });
  await expect(msg).toBeVisible();
  await expect(v.locator('canvas')).toBeVisible(); // the static picture stays
  mock.fail = [];
  await msg.getByRole('button', { name: 'Try again' }).click();
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await expect(msg).toHaveCount(0);
});

test("after three 503s stop the network, the viewer's Try again lifts the stop and loads; offline, it comes back once online", async ({ page, context }) => {
  const mock = await openGrid(page, /^Characters, /);
  mock.mode = 'down';
  const v = await open(page, 'Character 1');
  const msg = v.getByRole('status').filter({ hasText: "Couldn't load this asset's animations." });
  await expect(msg).toBeVisible({ timeout: 15_000 }); // first try + 2 retries with backoff
  expect(mock.hits.filter((h) => h.detail)).toHaveLength(3);
  mock.mode = 'ok';
  await msg.getByRole('button', { name: 'Try again' }).click();
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await expect(msg).toHaveCount(0);
  expect(mock.hits.filter((h) => h.detail)).toHaveLength(4);

  await context.setOffline(true);
  await page.keyboard.press('ArrowRight');
  const next = viewer(page, 'Character 2');
  const off = next.getByRole('status').filter({ hasText: "This animation isn't saved on this device. Connect to the internet to see it." });
  await expect(off).toBeVisible();
  await expect(off.getByRole('button', { name: 'Try again' })).toHaveCount(0);
  await context.setOffline(false);
  await off.getByRole('button', { name: 'Try again' }).click();
  await expect(off).toHaveCount(0);
  await expect.poll(() => mock.hits.filter((h) => h.detail && h.url.endsWith('/a-characters-1')).length).toBe(1);
});

test("during PixelLab's 429 pause the viewer's Try again keeps the pause, and a second 429 still stops everything", async ({ page }) => {
  await page.clock.install(); // time flows normally; fastForward skips the 60 s pause
  const mock = await openGrid(page, /^Characters, /);
  const cors = { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'authorization' };
  // Character 1's frames fail on the image host (Try again shows, no API involved); Character 2's detail answers 429 twice.
  await page.route('https://backblaze.pixellab.ai/file/a/a-characters-0/**', (route) => route.fulfill({ status: 404, headers: cors }));
  let asked = 0;
  await page.route('https://api.pixellab.ai/v2/characters/a-characters-1', (route) =>
    route.request().method() === 'GET' && asked++ < 2 ? route.fulfill({ status: 429, headers: cors }) : route.fallback(),
  );
  const failed = (name: string) => viewer(page, name).getByRole('status').filter({ hasText: "Couldn't load this asset's animations." });

  await open(page, 'Character 1');
  await expect(failed('Character 1')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect.poll(() => asked).toBe(1); // first 429: one at a time, 60 s pause
  await page.keyboard.press('ArrowLeft');
  await failed('Character 1').getByRole('button', { name: 'Try again' }).click();

  await page.keyboard.press('ArrowRight');
  await expect(viewer(page, 'Character 2')).toBeVisible();
  await page.waitForTimeout(1500);
  expect(asked).toBe(1); // the pause still holds: nothing sent
  await page.clock.fastForward('01:05');
  await expect.poll(() => asked).toBe(2);
  await expect(failed('Character 2')).toBeVisible(); // a second 429 within 5 minutes stopped the queue
  expect(mock.hits.filter((h) => h.detail && h.url.endsWith('/a-characters-1'))).toHaveLength(0); // never reached the mock
});

test('←/→ and swipes change the asset; Esc and Back close with one Back step; focus returns to the cell; the grid scroll is kept', async ({ page }) => {
  await openGrid(page, /^Characters, /);
  const grid = page.locator('main.grid');
  await grid.evaluate((el) => (el.scrollTop = 300));
  await page.waitForTimeout(200);
  const top = await grid.evaluate((el) => el.scrollTop);

  await open(page, 'Character 12');
  await page.keyboard.press('ArrowRight');
  await expect(viewer(page, 'Character 13')).toBeVisible();
  await page.keyboard.press('ArrowRight'); // Character 14 is still generating: skipped
  await expect(viewer(page, 'Character 15')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(viewer(page, 'Character 13')).toBeVisible();

  const swipe = async (dx: number) => {
    const vp = page.viewportSize()!;
    const [x, y] = [vp.width / 2, vp.height / 2];
    await page.mouse.move(x, y);
    await page.mouse.down();
    await page.mouse.move(x + dx / 2, y + 5);
    await page.mouse.move(x + dx, y + 10);
    await page.mouse.up();
  };
  await swipe(-160);
  await expect(viewer(page, 'Character 15')).toBeVisible();
  await swipe(160);
  await expect(viewer(page, 'Character 13')).toBeVisible();
  await swipe(160);
  await expect(viewer(page, 'Character 12')).toBeVisible();

  // Esc: back to the grid, where it was, focus on the cell; then one more Back is home (prev/next added no history).
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/c\/characters$/);
  await expect(page.getByRole('link', { name: 'Character 12', exact: true })).toBeFocused();
  expect(await grid.evaluate((el) => el.scrollTop)).toBe(top);

  // Browser Back closes it too, in one step.
  await open(page, 'Character 12');
  await page.goBack();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/c\/characters$/);
  await expect(page.getByRole('link', { name: 'Character 12', exact: true })).toBeFocused();
  expect(await grid.evaluate((el) => el.scrollTop)).toBe(top);
  await page.goBack();
  await expect(page).toHaveURL(/#\/$/);
});

test('a deep link reload opens the viewer; closing it lands on its grid', async ({ page }) => {
  const mock = await openGrid(page, /^Characters, /);
  await open(page, 'Character 1');
  await expect(page).toHaveURL(KEY_URL);
  await page.reload();
  const v = viewer(page, 'Character 1');
  await expect(v).toBeVisible();
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await settle(page, mock, 600);
  await v.getByRole('button', { name: 'Close' }).click();
  await expect(page).toHaveURL(/#\/c\/characters$/);
  await expect(page.getByRole('link', { name: 'Character 1', exact: true })).toBeFocused();
});
