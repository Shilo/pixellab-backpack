// T15 Keyboard polish (mocked PixelLab): ↑/↓/Home/End in the "…" menus (More, viewer, folder), the direction rose's arrow keys
// (roving tabindex over the enabled directions), and More's Esc closing only itself.
import { expect, test, type Page } from '@playwright/test';
import { connect, mockPixelLab, settle } from '../fixtures/pixellab-mock';

const viewer = (page: Page, name: string) => page.getByRole('dialog', { name, exact: true });

async function start(page: Page) {
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await connect(page);
  await settle(page, mock, 600);
}

test('More menu: ↑/↓ wrap, Home/End jump; Esc closes only the menu and gives focus back to the dock button', async ({ page }) => {
  await start(page);
  // Counts Esc presses that reach the page after the menu (bubbling window listener): the menu must keep them to itself.
  await page.evaluate(() => {
    (window as unknown as { escs: number }).escs = 0;
    window.addEventListener('keydown', (e) => e.key === 'Escape' && (window as unknown as { escs: number }).escs++);
  });
  const more = page.getByRole('button', { name: 'More' });
  await more.click();
  const item = (name: string) => page.getByRole('menuitem', { name: new RegExp(`^${name}`) });
  await expect(item('Refresh')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(item('Activity')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(item('Settings')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(item('Refresh')).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(item('Settings')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(item('Refresh')).toBeFocused();
  await page.keyboard.press('End');
  await expect(item('Settings')).toBeFocused();

  await page.keyboard.press('Escape');
  await expect(page.getByRole('menu', { name: 'More' })).toHaveCount(0);
  await expect(more).toBeFocused();
  expect(await page.evaluate(() => (window as unknown as { escs: number }).escs)).toBe(0);
});

test('viewer menu: ↑/↓ and Home/End move between its controls; closing returns focus to the viewer\'s "…"', async ({ page }) => {
  await start(page);
  await page.getByRole('link', { name: /^Characters, / }).click();
  await page.getByRole('link', { name: 'Character 1', exact: true }).click();
  const v = viewer(page, 'Character 1');
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await expect(page.getByText(/^Loading frames/)).toHaveCount(0);
  const more = v.getByRole('button', { name: 'More' });
  await more.click();
  const menu = page.getByRole('dialog', { name: 'Viewer options' });
  const link = menu.getByRole('link', { name: /^Open in PixelLab/ });

  await page.keyboard.press('End');
  await expect(link).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(menu.getByRole('button', { name: 'Add to folder…' })).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(menu.getByRole('radio', { name: 'Black' })).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('ArrowDown');
  await expect(link).toBeFocused();
  await page.keyboard.press('ArrowDown'); // wraps to the first control
  await expect(link).not.toBeFocused();
  await page.keyboard.press('End');
  await page.keyboard.press('Home');
  expect(await menu.evaluate((m) => document.activeElement === m.querySelector('button:not(:disabled), a, input'))).toBe(true);

  await page.keyboard.press('Escape');
  await expect(menu).toHaveCount(0);
  await expect(more).toBeFocused();
});

test('folder "…" menu: ↑/↓ wrap and Home/End between Rename… and Delete folder…', async ({ page }) => {
  await start(page);
  await page.getByRole('button', { name: 'New folder' }).click();
  const dlg = page.getByRole('dialog', { name: 'New folder' });
  await dlg.getByRole('textbox', { name: 'Folder name' }).fill('Hero party');
  await dlg.getByRole('button', { name: 'Create' }).click();
  await page.getByRole('button', { name: 'Folder actions' }).click();
  const rename = page.getByRole('menuitem', { name: 'Rename…' });
  const del = page.getByRole('menuitem', { name: 'Delete folder…' });
  await expect(rename).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(del).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(rename).toBeFocused();
  await page.keyboard.press('ArrowUp');
  await expect(del).toBeFocused();
  await page.keyboard.press('Home');
  await expect(rename).toBeFocused();
  await page.keyboard.press('End');
  await expect(del).toBeFocused();
});

test('direction rose: one tab stop, arrows move between the enabled directions only and select them', async ({ page }) => {
  await start(page);
  await page.getByRole('link', { name: /^Characters, / }).click();
  await page.getByRole('link', { name: 'Character 2', exact: true }).click(); // 4 directions: south, east, north, west
  const v = viewer(page, 'Character 2');
  await expect(v.locator('.vt-chip')).toHaveText(/· South\s*$/); // the chip's text ends in whitespace
  await v.locator('.vt-chip').click();
  const pick = page.getByRole('dialog', { name: 'Animation, state and direction' });
  const dir = (name: string) => pick.getByRole('radio', { name, exact: true });
  await expect(dir('South')).toHaveAttribute('tabindex', '0');
  await expect(dir('North')).toHaveAttribute('tabindex', '-1');

  // Document order of the rose is NW, N, NE, W, E, SW, S, SE: the enabled ones are North, West, East, South.
  await dir('South').focus();
  await page.keyboard.press('ArrowRight'); // wraps past the end
  await expect(dir('North')).toBeFocused();
  await expect(dir('North')).toHaveAttribute('aria-checked', 'true');
  await expect(v.locator('.vt-chip')).toHaveText(/· North\s*$/);
  await page.keyboard.press('ArrowDown'); // North-east is disabled and skipped
  await expect(dir('West')).toBeFocused();
  await expect(dir('West')).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('ArrowLeft');
  await expect(dir('North')).toBeFocused();
  await expect(dir('North')).toHaveAttribute('tabindex', '0');
  await expect(dir('West')).toHaveAttribute('tabindex', '-1');
  await expect(pick.getByRole('radio', { name: 'North-east', exact: true })).toBeDisabled();
});
