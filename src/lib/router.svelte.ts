// Hash router: `#/` is home, `#/c/<categoryId>` is a category grid. Anything else is home.
// `#activity` opens the Activity panel over the screen that was showing (the route stays).
// Category ids are the app's own words, never PixelLab ids, so they are safe in the address bar.
import { CATEGORIES, type CategoryId } from './categories';

export type Route = { name: 'home' } | { name: 'category'; id: CategoryId };

export function parseRoute(hash: string): Route {
  const [, id] = /^#\/c\/([^/?]+)\/?$/.exec(hash) ?? [];
  return id && CATEGORIES.some((c) => c.id === id) ? { name: 'category', id: id as CategoryId } : { name: 'home' };
}

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
  history.replaceState(history.state, '', router.route.name === 'category' ? `#/c/${router.route.id}` : '#/');
}

globalThis.addEventListener?.('hashchange', () => {
  router.activity = location.hash === ACTIVITY;
  if (!router.activity) router.route = parseRoute(location.hash);
});
