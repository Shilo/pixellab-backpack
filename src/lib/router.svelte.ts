// Hash router: `#/` is home, `#/c/<categoryId>` is a category grid. Anything else is home.
// Category ids are the app's own words, never PixelLab ids, so they are safe in the address bar.
import { CATEGORIES, type CategoryId } from './categories';

export type Route = { name: 'home' } | { name: 'category'; id: CategoryId };

export function parseRoute(hash: string): Route {
  const [, id] = /^#\/c\/([^/?]+)\/?$/.exec(hash) ?? [];
  return id && CATEGORIES.some((c) => c.id === id) ? { name: 'category', id: id as CategoryId } : { name: 'home' };
}

// Read `router.route`; it follows the address bar (Back and Forward included).
export const router = $state<{ route: Route }>({ route: parseRoute(globalThis.location?.hash ?? '') });

// A hash change is a history entry, so go() makes browser Back work.
export const go = (path: string): void => {
  location.hash = path;
};

globalThis.addEventListener?.('hashchange', () => {
  router.route = parseRoute(location.hash);
});
