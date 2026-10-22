// Keyboard and focus rules shared by the menus and panels.

/** ↑/↓/Home/End move focus between a menu's items, wrapping (K10). */
export function moveFocus(e: KeyboardEvent, items: HTMLElement[]): void {
  const i = items.indexOf(document.activeElement as HTMLElement);
  const n = items.length;
  const next = { ArrowDown: (i + 1) % n, ArrowUp: i < 0 ? n - 1 : (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
  if (next === undefined || !n) return;
  e.preventDefault();
  items[next].focus();
}

/** Focus left a layer for something outside it (U3): its owner closes it. Not when nothing gets focus (a click on blank space,
 * Safari not focusing a clicked button, a button disabling itself, the window losing focus), nor for the layer's own dim, which
 * closes it on click: closing on its mousedown would let that click land on the screen under it. */
export const leaves = (e: FocusEvent & { currentTarget: HTMLElement }): boolean => {
  const to = e.relatedTarget as Element | null;
  return !!to && !e.currentTarget.contains(to) && !to.classList.contains('backdrop');
};
