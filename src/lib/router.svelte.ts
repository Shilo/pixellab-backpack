// Hash router: `#/` is home, `#/all` is All assets, `#/c/<categoryId>` is a category grid. Anything else is home.
// `#activity` opens the Activity panel over the screen that was showing (the route stays).
// The viewer nests under the screen it was opened from: `#/a/<key>`, `#/all/a/<key>` or `#/c/<id>/a/<key>`;
// <key> is the card's opaque 12-hex key (a bad key is dropped).
// Category ids and keys are the app's own words, never PixelLab ids, so they are safe in the address bar.
import { CATEGORIES, type CategoryId } from './categories';

export type Route = { name: 'home'; key?: string } | { name: 'all'; key?: string } | { name: 'category'; id: CategoryId; key?: string };

const keyOf = (k?: string) => (k && /^[0-9a-f]{12}$/.test(k) ? { key: k } : {});

export function parseRoute(hash: string): Route {
  const [, homeKey] = /^#\/a\/([^/?]+)\/?$/.exec(hash) ?? [];
  if (homeKey) return { name: 'home', ...keyOf(homeKey) };
  const [, screen, key] = /^#\/(all|c\/[^/?]+)(?:\/a\/([^/?]+))?\/?$/.exec(hash) ?? [];
  if (screen === 'all') return { name: 'all', ...keyOf(key) };
  const id = screen?.slice(2);
  return CATEGORIES.some((c) => c.id === id) ? { name: 'category', id: id as CategoryId, ...keyOf(key) } : { name: 'home' };
}

export const pathOf = (r: Route): string => {
  const tail = r.key ? `/a/${r.key}` : '';
  return r.name === 'home' ? (r.key ? `#/a/${r.key}` : '#/') : r.name === 'all' ? `#/all${tail}` : `#/c/${r.id}${tail}`;
};

/** The route without its viewer key. */
export const screenOf = (r: Route): Route => (r.name === 'category' ? { name: 'category', id: r.id } : { name: r.name });

/** The category id, else 'all' (home and All assets cover everything). */
export const scopeOf = (r: Route): CategoryId | 'all' => (r.name === 'category' ? r.id : 'all');

const ACTIVITY = '#activity';
const hash = globalThis.location?.hash ?? '';
// An empty hash is home: write it as '#/' so going Back from a pushed screen (Activity) lands on '#/' too.
if (globalThis.location && !hash) history.replaceState(history.state, '', '#/');

// Read `router.route`; it follows the address bar (Back and Forward included).
export const router = $state<{ route: Route; activity: boolean }>({ route: parseRoute(hash), activity: hash === ACTIVITY });

// A hash change is a history entry, so go() makes browser Back work.
export const go = (path: string): void => {
  location.hash = path;
};

// True when this tab pushed `#activity` onto history (false for a direct load on it).
let activityPushed = false;

/** Closes a panel opened by `#activity`: Back when this tab opened it, else the address bar is replaced with the screen. */
export function closeActivity(): void {
  if (!router.activity) return;
  router.activity = false; // at once: a second Esc before the browser reports Back must not step back twice
  if (activityPushed) return history.back();
  history.replaceState(history.state, '', pathOf(router.route));
}

// True when this tab pushed the viewer on top of its screen, so Back returns to that screen.
// ponytail: module memory, so a reload on a viewer opened from the grid forgets it and closing leaves a duplicate grid
// entry in history; keep the flag in history.state if that matters.
let pushed = false;

/** Closes the viewer: Back when this tab opened it from its screen, else the screen replaces it in place. */
export function closeViewer(): void {
  if (!router.route.key) return;
  if (pushed) return history.back();
  const screen = screenOf(router.route);
  history.replaceState(history.state, '', pathOf(screen));
  router.route = screen;
}

/** Previous/next: swaps the key in place, with no new history entry. */
export function replaceViewer(key: string): void {
  if (!router.route.key) return;
  router.route = { ...router.route, key };
  history.replaceState(history.state, '', pathOf(router.route));
}

globalThis.addEventListener?.('hashchange', () => {
  router.activity = location.hash === ACTIVITY;
  activityPushed = router.activity;
  if (router.activity) return;
  const next = parseRoute(location.hash);
  const prev = router.route;
  pushed = !!next.key && pathOf(screenOf(prev)) === pathOf(screenOf(next)) && (!prev.key || pushed);
  router.route = next;
});
