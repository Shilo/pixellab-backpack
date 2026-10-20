// Accessibility smoke (mocked PixelLab): on the key screen, home, a grid, the viewer (with its menu, picker and Info) and Settings,
// Tab reaches every visible control, each shows a focus ring, and on phone every control is at least 44 × 44 px.
import { expect, test, type Locator, type Page } from '@playwright/test';
import { connect, mockPixelLab, settle } from '../fixtures/pixellab-mock';

interface Audit {
  missing: string[];
  noRing: string[];
  small: string[];
}

type Win = { look: (el: Element) => string };

/** Installs window.look: focus styles of a control, the descendants that draw its ring (grid cell) and its next sibling (switch track). */
const installLook = (page: Page) =>
  page.evaluate(() => {
    (window as unknown as Win).look = (el) =>
      [el, ...el.querySelectorAll('*'), el.nextElementSibling]
        .filter((e): e is Element => !!e)
        .map((e) => {
          const cs = getComputedStyle(e);
          return [cs.outlineStyle, cs.outlineWidth, cs.outlineColor, cs.boxShadow, cs.borderColor].join(' ');
        })
        .join('|');
  });

/** Tags every visible, enabled, tabbable control inside `scope` (default: the page), Tabs round, and reports controls Tab
 * missed, controls whose look does not change when focused (no visible ring), and non-inline controls under 44 × 44 px. */
async function audit(page: Page, scope = 'body'): Promise<Audit> {
  const total = await page.evaluate((sel) => {
    const all = [...document.querySelector(sel)!.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, summary, [tabindex]')].filter((el) => {
      const r = el.getBoundingClientRect();
      return (
        el.tabIndex >= 0 &&
        !(el as HTMLButtonElement).disabled &&
        !el.closest('[inert]') &&
        el.checkVisibility({ visibilityProperty: true, opacityProperty: true }) &&
        r.width > 0 &&
        r.height > 0
      );
    });
    all.forEach((el, i) => (el.dataset.a11y = String(i)));
    return all.length;
  }, scope);
  expect(total).toBeGreaterThan(0);
  await installLook(page);
  const focused = new Map<string, string>();
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let i = 0; i < total + 12; i++) {
    await page.keyboard.press('Tab');
    const at = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      return el?.dataset.a11y ? { id: el.dataset.a11y, look: (window as unknown as Win).look(el) } : null;
    });
    if (!at) continue;
    if (focused.has(at.id)) break;
    focused.set(at.id, at.look);
  }
  return page.evaluate(
    (focused) => {
      (document.activeElement as HTMLElement | null)?.blur();
      const look = (window as unknown as Win).look;
      const name = (el: HTMLElement) =>
        `${el.tagName.toLowerCase()} "${(el.getAttribute('aria-label') ?? (el as HTMLInputElement).labels?.[0]?.innerText ?? el.innerText ?? '').replace(/\s+/g, ' ').trim().slice(0, 40)}"`;
      const els = [...document.querySelectorAll<HTMLElement>('[data-a11y]')];
      const size = (el: HTMLElement) => el.getBoundingClientRect();
      const out = {
        missing: els.filter((el) => !(el.dataset.a11y! in focused)).map(name),
        noRing: els.filter((el) => el.dataset.a11y! in focused && focused[el.dataset.a11y!] === look(el)).map(name),
        // Links inside a sentence are exempt (WCAG 2.5.8 inline exception).
        small: els
          .filter((el) => getComputedStyle(el).display !== 'inline' && (size(el).width < 43.5 || size(el).height < 43.5))
          .map((el) => `${name(el)} ${Math.round(size(el).width)}×${Math.round(size(el).height)}`),
      };
      els.forEach((el) => delete el.dataset.a11y);
      return out;
    },
    Object.fromEntries(focused),
  );
}

async function check(page: Page, phone: boolean, where: string, scope?: string) {
  const a = await audit(page, scope);
  expect.soft(a.missing, `${where}: not reachable by Tab`).toEqual([]);
  expect.soft(a.noRing, `${where}: no visible focus`).toEqual([]);
  if (phone) expect.soft(a.small, `${where}: under 44 px on phone`).toEqual([]);
}

const opened = (l: Locator) => expect(l).toBeVisible();

test('keyboard reaches every control with a visible focus ring; phone targets are at least 44 px', async ({ page }, info) => {
  test.setTimeout(90_000);
  const phone = info.project.name === 'phone';
  const mock = await mockPixelLab(page);
  await page.goto('/');
  await check(page, phone, 'key screen');

  mock.fail = ['/v2/ui-assets?']; // home also shows a notice with its Try again button
  await connect(page);
  await settle(page, mock);
  await expect(page.getByRole('status').filter({ hasText: "Some assets didn't load" })).toBeVisible();
  await check(page, phone, 'home');

  // Objects: a short grid that fits on screen, so Tab can come round to the dock.
  await page.getByRole('link', { name: /^Objects, / }).click();
  await settle(page, mock, 600);
  await check(page, phone, 'grid');
  await page.getByRole('button', { name: 'Library' }).click();

  await page.getByRole('link', { name: /^Characters, / }).click();
  await page.getByRole('link', { name: 'Character 1', exact: true }).click();
  const v = page.getByRole('dialog', { name: 'Character 1', exact: true });
  await expect(v.locator('.vt-chip')).toHaveText('Breathing idle · South');
  await check(page, phone, 'viewer');

  await v.getByRole('button', { name: 'More' }).click();
  await opened(page.getByRole('dialog', { name: 'Viewer options' }));
  await check(page, phone, 'viewer menu', '.menu');
  await page.keyboard.press('Escape');

  await v.locator('.vt-chip').click();
  await opened(page.getByRole('dialog', { name: 'Animation, state and direction' }));
  await check(page, phone, 'picker', '.pick');
  await page.keyboard.press('Escape');

  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await opened(v.getByRole('complementary', { name: 'Info' }));
  await v.getByRole('complementary', { name: 'Info' }).getByText('Technical details').click();
  await check(page, phone, 'info panel', 'aside.info');
  await v.getByRole('button', { name: 'Info', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(v).toHaveCount(0);

  await page.getByRole('button', { name: 'More' }).click();
  await page.getByRole('menuitem', { name: /Settings/ }).click();
  await opened(page.getByRole('dialog', { name: 'Settings' }));
  await check(page, phone, 'settings', 'dialog[open]');
});
