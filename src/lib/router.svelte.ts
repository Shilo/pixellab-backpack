// Hash router: `#/` is home, `#/c/<categoryId>` is a category grid. Anything else is home.
// `#activity` opens the Activity panel over the screen that was showing (the route stays).
// `#/c/<id>/a/<key>` is the viewer for one asset; <key> is the card's opaque 12-hex key (a bad key is dropped).
// Category ids and keys are the app's own words, never PixelLab ids, so they are safe in the address bar.
import { CATEGORIES, type CategoryId } from './categories';

export type Route = { name: 'home' } | { name: 'category'; id: CategoryId; key?: string };

export function parseRoute(hash: string): Route {
  const [, id, key] = /^#\/c\/([^/?]+)(?:\/a\/([^/?]+))?\/?$/.exec(hash) ?? [];
  if (!id || !CATEGORIES.some((c) => c.id === id)) return { name: 'home' };
  return key && /^[0-9a-f]{12}$/.test(key) ? { name: 'category', id: id as CategoryId, key } : { name: 'category', id: id as CategoryId };
}

export const pathOf = (r: Route): string =>
  r.name === 'home' ? '#/' : r.key ? `#/c/${r.id}/a/${r.key}` : `#/c/${r.id}`;

const ACTIVITY = '#activity';
const hash = globalThis.location?.hash ?? '';

// Read `router.route`; it follows the address bar (Back and Forward included).
export const router = $state<{ route: Route; activity: boolean }>({ route: parseRoute(hash), activity: hash === ACTIVITY });

// A hash change is a history entry, so go() makes browser Back work.
export const go = (path: string): void => {
  location.hash = path;
};

/** Closes a panel opened by `#activity`: the address bar goes back to the screen, without a new history entry. */
export function closeActivity(): void {
  if (!router.activity) return;
  router.activity = false;
  history.replaceState(history.state, '', pathOf(router.route));
}

// True when this tab pushed the viewer on top of its grid, so Back returns to that grid.
let pushed = false;

/** Closes the viewer: Back when this tab opened it from the grid, else the grid replaces it in place. */
export function closeViewer(): void {
  if (router.route.name !== 'category' || !router.route.key) return;
  if (pushed) return history.back();
  const grid: Route = { name: 'category', id: router.route.id };
  history.replaceState(history.state, '', pathOf(grid));
  router.route = grid;
}

/** Previous/next: swaps the key in place, with no new history entry. */
export function replaceViewer(key: string): void {
  if (router.route.name !== 'category') return;
  router.route = { name: 'category', id: router.route.id, key };
  history.replaceState(history.state, '', pathOf(router.route));
}

globalThis.addEventListener?.('hashchange', () => {
  router.activity = location.hash === ACTIVITY;
  if (router.activity) return;
  const next = parseRoute(location.hash);
  const prev = router.route;
  pushed = next.name === 'category' && !!next.key && prev.name === 'category' && prev.id === next.id && (!prev.key || pushed);
  router.route = next;
});
