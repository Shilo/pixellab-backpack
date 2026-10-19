/* Vitrine — Option B "Gallery Wall" interactive mockup.
   Classic script so it runs from file://. Behaviour + copy: docs/design/02-ux-spec.md.
   Layout + tokens: docs/design/04-design-options.md §0 and §2. Data: ../shared/sample-data.js. */
(function () {
'use strict';

// ============================================================ helpers
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ic = (n, c) => `<svg class="ic${c ? ' ' + c : ''}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const mq = q => matchMedia(q).matches;
const isFine = () => mq('(hover: hover) and (pointer: fine)');
const isCoarse = () => mq('(pointer: coarse)');
const reduced = () => mq('(prefers-reduced-motion: reduce)');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nf = n => Number(n).toLocaleString('en-US');
const plural = (n, one, many) => `${nf(n)} ${n === 1 ? one : (many || one + 's')}`;
const cap = s => s ? String(s)[0].toUpperCase() + String(s).slice(1) : '';
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const slug = (s, fb) => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || fb || 'asset';
const pad2 = n => String(n).padStart(2, '0');
const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const fmtFull = iso => new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const fmtDay = iso => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const store = {
  get(k, d) { try { const v = localStorage.getItem('vitrine-b:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('vitrine-b:' + k, JSON.stringify(v)); } catch (e) { /* storage blocked: stay in memory */ } }
};
// 12-char opaque asset key (02 §0, R-9). ponytail: a cyrb53-style hash stands in for base64url(SHA-256(type:uuid)); production uses SubtleCrypto.
function key12(s) {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < s.length; i++) { const k = s.charCodeAt(i); h1 = Math.imul(h1 ^ k, 2654435761); h2 = Math.imul(h2 ^ k, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return ((h2 >>> 0).toString(36).padStart(7, '0') + (h1 >>> 0).toString(36).padStart(7, '0')).slice(0, 12);
}
// Form factor (02 §0); styles.css mirrors these breakpoints.
const ff = () => innerHeight < 480 ? 'compact' : innerWidth < 600 ? 'phone' : innerWidth < 1200 ? 'tablet' : innerWidth < 1600 ? 'laptop' : 'desktop';
const small = () => /phone|compact/.test(ff());
const visible = e => e.getClientRects().length > 0;   // works for position:fixed too
function announce(msg, assertive) { const el = $(assertive ? '#live-a' : '#live'); el.textContent = ''; setTimeout(() => { el.textContent = msg; }, 30); }

// The "vitrine" mark (04 §6.2): a display case on a plinth, crisp rects in currentColor.
const MARK = ['.##########.', '.#........#.', '.#........#.', '.#...##...#.', '.#...##...#.', '.#........#.', '############', '############', '.##......##.', '.##......##.'];
function markSVG(cell) {
  let r = '';
  MARK.forEach((row, y) => { for (let x = 0; x < 12; x++) if (row[x] === '#') r += `<rect x="${x}" y="${y}" width="1" height="1"/>`; });
  return `<svg class="mark" width="${12 * cell}" height="${10 * cell}" viewBox="0 0 12 10" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`;
}

// ============================================================ data (03 §2 data rules)
const D = window.SAMPLE_DATA;
const TYPES = {
  character: ['characters', 'Character', 'person-standing'], object: ['objects', 'Object', 'box'], map_object: ['objects', 'Object', 'box'],
  creator_image: ['images', 'Image', 'image'], tileset_topdown: ['tilesets', 'Tileset', 'grid-2x2'], tileset_sidescroller: ['tilesets', 'Tileset', 'grid-2x2'],
  tiles_pro: ['tiles', 'Tiles', 'layers'], tile_isometric: ['tiles', 'Isometric tile', 'layers'], map: ['maps', 'Map', 'map'], ui_asset: ['ui', 'UI', 'panels-top-left']
};
const CHIPS = [['all', 'All'], ['characters', 'Characters'], ['objects', 'Objects'], ['images', 'Images'], ['tilesets', 'Tilesets'], ['tiles', 'Tiles'], ['maps', 'Maps'], ['ui', 'UI'], ['other', 'Other']];
const CHIP_LABEL = Object.fromEntries(CHIPS);
const NOUN = { all: ['asset', 'assets'], characters: ['character', 'characters'], objects: ['object', 'objects'], images: ['image', 'images'], tilesets: ['tileset', 'tilesets'], tiles: ['tile', 'tiles'], maps: ['map', 'maps'], ui: ['UI asset', 'UI assets'] };
const pickAnim = a => { const an = a.animations || []; return an.find(x => /idle|breath/i.test(x.name)) || an[0] || null; };
function previewSrcs(a) {
  if (a.frames && a.frames.length > 1) return a.frames;
  const an = pickAnim(a); if (!an) return null;
  return an.frames.south || an.frames[Object.keys(an.frames)[0]];
}
const CARDS = [], cardById = new Map();
(function buildCards() {
  const groups = new Map();
  const add = states => {
    const a = states[0], t = TYPES[a.type];
    const c = { id: a.id, a, states, type: a.type, chip: t[0], label: t[1], icon: t[2], key: key12(a.type + ':' + a.id),
      title: a.name, caption: a.type === 'object' && a.meta.state_name ? `${a.name} · ${a.meta.state_name}` : a.name,
      w: a.width, h: a.height, area: a.width * a.height, date: a.type === 'map' ? null : a.createdAt, preview: previewSrcs(a) };
    CARDS.push(c); states.forEach(s => cardById.set(s.id, c));
  };
  for (const a of D.assets) {
    if (!TYPES[a.type] || a.status !== 'completed') continue;             // drops vfx/font (R-5) and review/processing (C10)
    if (a.type === 'character' && a.meta.group_id) { if (!groups.has(a.meta.group_id)) groups.set(a.meta.group_id, []); groups.get(a.meta.group_id).push(a); }
    else add([a]);                                                           // objects stay one card per state (R-7)
  }
  for (const g of groups.values()) add(g.sort((x, y) => (x.meta.state_name == null ? -1 : y.meta.state_name == null ? 1 : x.createdAt < y.createdAt ? -1 : 1)));
})();
const byKey = new Map(CARDS.map(c => [c.key, c]));
if (byKey.size !== CARDS.length) throw new Error('asset key collision');
const INPROG = D.assets.filter(a => TYPES[a.type] && a.status !== 'completed');

function badge(c, short) {
  const a = c.a, m = a.meta;
  switch (c.type) {
    case 'character': {
      const d = Object.keys(a.directions).length, n = a.animations.length, s = c.states.length;
      return short ? (n ? `${n} anim` : `${d} dir`) : [d && `${d} dir`, n && `${n} anim`, s > 1 && `${s} states`].filter(Boolean).join(' · ');
    }
    case 'object': {
      const d = Object.keys(a.directions).filter(k => k !== 'unknown').length, n = a.animations.length;
      return short ? (d > 1 ? `${d} dir` : '') : [d > 1 && `${d} dir`, n && `${n} anim`].filter(Boolean).join(' · ');
    }
    case 'creator_image': return a.frames && a.frames.length > 1 ? `${a.frames.length} frames` : '';
    case 'tileset_topdown': case 'tileset_sidescroller': return short ? `${m.total_tiles} tiles` : `${m.total_tiles} tiles · ${a.tileSize} px`;
    case 'tiles_pro': return short ? `${m.n_tiles} var` : `${m.n_tiles} variations · ${a.tileSize} px`;
    case 'tile_isometric': return short ? `${m.size} px` : `${cap(m.tile_shape)} · ${m.size} px`;
    case 'map': return short ? `${a.grid.cols}×${a.grid.rows}` : `${a.grid.cols} × ${a.grid.rows} cells`;
    case 'ui_asset': return short ? '' : `${a.width} × ${a.height}`;
  }
  return '';
}

// ============================================================ state
const S = {
  connected: false, remember: false, sample: false, welcome: false, r: null,
  q: '', sort: store.get('sort', 'newest'), size: store.get('size', 'M'), animate: store.get('animate', false),
  theme: store.get('theme', 'system'), bgDefault: store.get('bg', 'stage'), viewBg: null, shortcuts: store.get('shortcuts', true),
  fps: store.get('fps', {}), selecting: false, sel: new Set(), anchor: null,
  favs: new Set(D.favorites), folders: D.folders.map(f => ({ id: f.id, name: f.name, ids: f.assetIds.slice() })),
  arrived: null, sync: { running: false }, flags: {}, tipDismissed: false, exp: null, ctx: null, memo: {}, lastKey: null,
  fromList: false, searchOpen: false, mapsShown: new Set(), protect: false
};
const avail = c => !S.flags.empty && !(S.flags.gate && c.chip === 'images') && (!S.arrived || S.arrived.has(c.id));
const library = () => CARDS.filter(avail);
const folderById = id => S.folders.find(f => f.id === id);
const sortedFolders = () => S.folders.slice().sort((x, y) => x.name.localeCompare(y.name, 'en', { sensitivity: 'base' }));
function uniqCards(ids) { const out = []; for (const id of ids) { const c = cardById.get(id); if (c && avail(c) && !out.includes(c)) out.push(c); } return out; }
const favCards = () => S.flags.emptyFav ? [] : uniqCards([...S.favs]);
const folderCards = f => uniqCards(f.ids);
const missing = ids => S.sync.running ? 0 : ids.filter(id => !cardById.has(id)).length;
const inFolder = (f, c) => f.ids.some(id => cardById.get(id) === c);

// ============================================================ search + sort (02 §11)
const SORTS = [['newest', 'Newest'], ['oldest', 'Oldest'], ['az', 'Name A–Z'], ['za', 'Name Z–A'], ['largest', 'Largest'], ['smallest', 'Smallest'], ['updated', 'Recently updated']];
const coll = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const effSort = chip => S.sort === 'updated' && chip !== 'characters' ? 'newest' : S.sort;
function sortCards(cs, chip) {
  const undated = (x, y) => (!x.date) - (!y.date);                      // maps have no date: after dated items, list order
  const cmpDate = (x, y) => x.date && y.date ? (x.date < y.date ? -1 : x.date > y.date ? 1 : 0) : 0;
  const newest = (x, y) => undated(x, y) || -cmpDate(x, y);
  const f = {
    newest, oldest: (x, y) => undated(x, y) || cmpDate(x, y),
    az: (x, y) => coll.compare(x.caption, y.caption), za: (x, y) => coll.compare(y.caption, x.caption),
    largest: (x, y) => y.area - x.area || newest(x, y), smallest: (x, y) => x.area - y.area || newest(x, y),
    updated: (x, y) => String(y.a.updatedAt || '').localeCompare(String(x.a.updatedAt || ''))
  }[effSort(chip)];
  return cs.slice().sort(f);
}
function hay(c) {
  if (c._hay) return c._hay;
  const a = c.a, m = a.meta, p = [c.title, `${c.w}x${c.h}`, `${c.w}×${c.h}`];
  switch (c.type) {
    case 'character': c.states.forEach(s => p.push(s.prompt, s.meta.state_name)); p.push(m.view, m.template_id, ...a.tags); break;
    case 'object': p.push(a.prompt, m.state_name, m.view, ...a.tags); break;
    case 'creator_image': p.push(a.prompt, a.frames && a.frames.length > 1 ? 'animated' : ''); break;
    case 'tileset_topdown': case 'tileset_sidescroller': p.push(m.lower_description, m.upper_description, m.transition_description, m.view); break;
    case 'tiles_pro': p.push(a.prompt, m.tile_type); break;
    case 'tile_isometric': p.push(m.description, m.tile_shape); break;
    case 'ui_asset': p.push(a.prompt); break;
  }
  return (c._hay = norm(p.filter(Boolean).join(' ')));
}
function matches(c, q) {
  return norm(q).trim().split(/\s+/).filter(t => t && t !== '#').every(t => t[0] === '#'
    ? c.states.some(s => (s.tags || []).some(tag => norm(tag) === t.slice(1)))
    : hay(c).includes(t) || norm(c.label).split(' ').some(w => w.startsWith(t) || t.startsWith(w)));
}
// ponytail: type labels match by word prefix (not substring) so "mage" doesn't hit every "Image" (02 §11.2 deviation, see README).

// ============================================================ routing (02 §1.1; hash routes, opaque keys)
function route() {
  const s = location.hash.slice(1) || '/', qi = s.indexOf('?');
  const parts = (qi < 0 ? s : s.slice(0, qi)).split('/').filter(Boolean), q = new URLSearchParams(qi < 0 ? '' : s.slice(qi + 1));
  let key = null; const ai = parts.indexOf('a');
  if (ai >= 0) { key = parts[ai + 1] || null; parts.length = ai; }
  const view = ['collections', 'favorites', 'folder', 'connect'].includes(parts[0]) ? parts[0] : 'library';
  const chip = q.get('type') || null;
  return { view, id: parts[1], parts, chip, key, q, parent: '#/' + parts.join('/') + (chip ? '?type=' + chip : '') };
}
function detailHash(r, key, extra) {
  const qs = new URLSearchParams(); if (r.chip) qs.set('type', r.chip);
  for (const k in extra || {}) if (extra[k] != null) qs.set(k, extra[k]);
  const s = qs.toString(); return '#/' + [...r.parts, 'a', key].join('/') + (s ? '?' + s : '');
}
function go(hash, replace) {
  if (replace) { history.replaceState(null, '', hash); onRoute(); } else if (location.hash === hash) onRoute(); else location.hash = hash;
}
const shelvesMode = r => r.view === 'library' && !r.chip && !S.q;
function viewBase(r) { return r.view === 'favorites' ? favCards() : r.view === 'folder' ? folderCards(folderById(r.id) || { ids: [] }) : library(); }
function viewCards(r) {
  if (r.chip === 'other') return [];
  let cs = viewBase(r); if (r.chip && r.chip !== 'all') cs = cs.filter(c => c.chip === r.chip);
  if (S.q) cs = cs.filter(c => matches(c, S.q));
  return sortCards(cs, r.chip);
}
function onRoute() {
  let r = route();
  if (!S.connected && r.view !== 'connect') { history.replaceState(null, '', '#/connect'); r = route(); }
  if (S.connected && r.view === 'connect') { history.replaceState(null, '', '#/'); r = route(); }
  const prev = S.r;
  if (prev && !prev.key && prev.view !== 'connect') saveMemo(prev);
  S.fromList = !!(r.key && prev && (!prev.key ? true : S.fromList));
  const same = prev && ((prev.key && r.key) || (!prev.key && !r.key && prev.view === r.view && prev.id === r.id));
  const f = same ? focusSel() : null;
  S.r = r;
  closePop();
  const swap = () => { render(prev); if (f) restoreFocus(f); };
  if (prev && !!prev.key !== !!r.key && document.startViewTransition && !reduced()) document.startViewTransition(swap);
  else swap();
}
function saveMemo(r) { S.memo[r.parent] = { y: scrollY, shelves: Object.fromEntries($$('.track').map(t => [t.dataset.shelf, t.scrollLeft])) }; }
function restoreMemo(r) {
  const m = S.memo[r.parent]; if (!m) { scrollTo(0, 0); return; }
  scrollTo(0, m.y); $$('.track').forEach(t => { if (m.shelves[t.dataset.shelf] != null) t.scrollLeft = m.shelves[t.dataset.shelf]; });
}
function focusSel() {
  const a = document.activeElement;
  if (!a || a === document.body || a.closest('dialog, [popover]')) return null;
  if (a.classList.contains('q-input')) return '.q-input';
  if (a.dataset.key) return `.card-link[data-key="${a.dataset.key}"]`;
  if (a.dataset.act) { let s = `[data-act="${a.dataset.act}"]`; for (const k of ['chip', 'size', 'dir', 'ai', 'si', 'bg', 'i', 'shelf']) if (a.dataset[k] != null) s += `[data-${k}="${a.dataset[k]}"]`; return s; }
  return a.id ? '#' + a.id : null;
}
function restoreFocus(sel) {
  if (!sel || (document.activeElement && document.activeElement.closest('dialog'))) return;
  const el = $$(sel).find(visible); if (el) el.focus({ preventScroll: true });
}
function rerender() {
  if (!S.r) return;
  const f = focusSel(), list = !S.r.key && S.r.view !== 'connect';
  if (list) saveMemo(S.r);
  render(S.r, true);
  restoreFocus(f);
}

// ============================================================ render
function updateChrome(r) {
  const dest = r.view === 'library' ? 'library' : 'collections';
  $$('[data-nav]').forEach(a => a.dataset.nav === dest ? a.setAttribute('aria-current', 'page') : a.removeAttribute('aria-current'));
  document.body.className = [`v-${r.view}`, r.key ? 'is-detail' : '', S.selecting ? 'selecting' : ''].filter(Boolean).join(' ');
  $$('[data-act="select"]').forEach(b => { b.setAttribute('aria-pressed', S.selecting); const lbl = S.selecting ? 'Done' : 'Select'; if (b.classList.contains('rail-item')) b.lastChild.textContent = lbl; else b.textContent = lbl; });
  const n = library().length; $$('.q-input').forEach(i => { i.placeholder = `Search ${plural(n, 'asset')}`; if (i.value !== S.q) i.value = S.q; }); $$('.q-clear').forEach(b => { b.hidden = !S.q; });
}
function render(prev, soft) {
  const r = S.r, main = $('#main');
  stopAllPreviews(); teardownDetail(); updateChrome(r);
  if (r.view === 'connect') { main.innerHTML = connectHTML(); bindConnect(); document.title = 'Connect · Vitrine'; renderSelbar(); return; }
  if (r.key) { renderDetail(r, prev); renderSelbar(); return; }
  if (r.view === 'collections') main.innerHTML = collectionsHTML();
  else main.innerHTML = `<div id="lh">${listHeaderHTML(r)}</div><div class="page" id="lb">${listBody(r)}</div>`;
  const fl = r.view === 'folder' && folderById(r.id);
  document.title = `${r.view === 'collections' ? 'Collections' : r.view === 'favorites' ? 'Favorites' : fl ? fl.name : 'Library'} · Vitrine`;
  afterList();
  restoreMemo(r);
  renderSelbar();
  if (soft) return;
  const card = prev && prev.key && $(`.card-link[data-key="${S.lastKey}"]`);     // back from detail → its card (02 §10.2)
  if (card) { card.focus({ preventScroll: true }); const b = card.getBoundingClientRect(); if (b.top < 0 || b.bottom > innerHeight || b.left < 0 || b.right > innerWidth) card.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  else if (prev && prev.view !== 'connect' && (prev.view !== r.view || prev.id !== r.id)) { const h = $$('h1[tabindex]').find(visible); h && h.focus({ preventScroll: true }); }
}
function afterList() { layoutGrids(); fitAll(); setupAnimate(); scheduleMaps(); markOverflow(); }
function markOverflow() { $$('.chips').forEach(c => c.classList.toggle('overflow', c.scrollWidth > c.clientWidth + 1)); }
function updateListBody() {
  const r = S.r; if (!r || r.key || r.view === 'collections') return;
  stopAllPreviews(); $('#lb').innerHTML = listBody(r);
  const res = resultHTML(r); $$('.result').forEach(el => { el.outerHTML = res; });
  afterList(); renderSelbar();
}

// ---- library header (search · chips · result line · toolbar)
function chipsFor(r) {
  if (r.view === 'library') { const lib = library(); return CHIPS.filter(([id]) => id === 'all' || id === 'other' || S.sync.running || (id === 'images' && S.flags.gate) || lib.some(c => c.chip === id)); }
  const base = viewBase(r); return CHIPS.filter(([id]) => id === 'all' || base.some(c => c.chip === id));
}
function chipsHTML(r) {
  const cur = r.chip === 'all' || !r.chip ? 'all' : r.chip;
  return `<div class="chips" role="radiogroup" aria-label="Asset type">${chipsFor(r).map(([id, label]) => { const on = id === cur;
    return `<button class="chip" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-act="chip" data-chip="${id}">${on ? ic('check', 'sm') : ''}${id === 'other' ? ic('circle-help', 'sm') : ''}${label}</button>`; }).join('')}</div>`;
}
const animateBtn = () => `<button class="btn" data-act="animate" aria-pressed="${S.animate}">${ic('circle-play', 'sm')}Animate</button>`;
const moreBtn = () => `<button class="ibtn" data-act="more" aria-label="More library actions" aria-haspopup="menu">${ic('ellipsis')}</button>`;
const sizeSeg = act => `<div class="seg" role="radiogroup" aria-label="Grid size">${['S', 'M', 'L', 'XL'].map(z => `<button role="radio" aria-checked="${S.size === z}" tabindex="${S.size === z ? 0 : -1}" data-act="${act || 'size'}" data-size="${z}">${z}</button>`).join('')}</div>`;
function toolsFull(r) {
  const label = SORTS.find(s => s[0] === effSort(r.chip))[1];
  return `<div class="tools"><button class="btn" data-act="sort" aria-haspopup="menu" aria-label="Sort: ${label}">${label}${ic('chevron-down', 'sm')}</button>${sizeSeg()}${animateBtn()}${moreBtn()}</div>`;
}
const toolsCompact = () => `<div class="tools">${animateBtn()}<button class="btn" data-act="view" aria-haspopup="menu">View${ic('chevron-down', 'sm')}</button>${moreBtn()}</div>`;
const searchField = cls => `<div class="${cls}" role="search">${ic('search')}<input class="q-input" type="search" placeholder="Search ${plural(library().length, 'asset')}" aria-label="Search assets" value="${esc(S.q)}" autocomplete="off" spellcheck="false"><button class="ibtn q-clear" data-act="q-clear" aria-label="Clear search"${S.q ? '' : ' hidden'}>${ic('x', 'sm')}</button></div>`;
const selectBtn = () => `<button class="btn" data-act="select" aria-pressed="${S.selecting}">${S.selecting ? 'Done' : 'Select'}</button>`;
function viewTitle(r) { if (r.view === 'favorites') return 'Favorites'; if (r.view === 'folder') { const f = folderById(r.id); return f ? f.name : 'Folder'; } return r.chip === 'all' ? 'All assets' : r.chip ? CHIP_LABEL[r.chip] : 'Library'; }
function resultHTML(r) {
  const n = shelvesMode(r) ? library().length : viewCards(r).length;
  let status;
  if (S.flags.rate) status = '<span>PixelLab asked us to slow down. Continuing shortly…</span>';
  else if (S.sync.running) status = `<span class="syncbar" aria-hidden="true"><i style="width:${Math.round(S.arrived.size / CARDS.length * 100)}%"></i></span><button class="status-btn" data-act="sync-pop">Syncing… ${S.arrived.size} of ~${CARDS.length}</button>`;
  else status = `<button class="status-btn" data-act="sync-pop">${S.flags.offline ? 'Offline' : 'Synced<span class="not-phone"> just now</span>'}</button>`;
  const warn = S.flags.partial ? `<button class="inprog warn" data-act="sync-pop">${ic('triangle-alert', 'sm')}Some assets didn't load</button>` : '';
  const ip = INPROG.length && !S.flags.empty ? `<button class="inprog" data-act="inprog-pop" aria-haspopup="dialog">${ic('loader-circle', 'sm')}${INPROG.length} in PixelLab</button>` : '';
  return `<div class="result">${plural(n, 'asset')}<span aria-hidden="true">·</span>${status}${warn}${ip}</div>`;
}
function listHeaderHTML(r) {
  const res = resultHTML(r);
  return `<div class="lhead"><div class="page-in">
    <div class="ph-title-row only-phone"><h1 class="ph-title" tabindex="-1">${esc(viewTitle(r))}</h1>${selectBtn()}<button class="ibtn" data-act="settings" aria-label="Settings">${ic('settings')}</button></div>
    ${searchField('ph-search only-phone')}${S.searchOpen || S.q ? searchField('ph-search only-compact') : ''}
    <div class="chipbar">${chipsHTML(r)}<div class="only-wide">${toolsFull(r)}</div><div class="only-compact">${toolsCompact()}</div></div>
    <div class="statusbar only-phone">${res}<div class="tools">${animateBtn()}${moreBtn()}</div></div>
  </div></div>
  <div class="page-in"><div class="statusbar not-phone">${res}<div class="only-tn">${toolsFull(r)}</div></div></div>`;
}

// ---- list bodies
let CTX = {};
function emptyHTML(title, body, actions, extra) {
  return `<div class="empty">${markSVG(6)}<h2>${title}</h2>${body ? `<p>${body}</p>` : ''}${extra || ''}${actions ? `<div class="row">${actions}</div>` : ''}</div>`;
}
const plLink = (label, cls) => `<a class="${cls == null ? 'btn' : cls}" href="#" target="_blank" rel="noopener noreferrer" data-act="open-pl">${label} ↗<span class="sr-only"> (opens PixelLab in a new tab)</span></a>`;
function listBody(r) {
  CTX = {};
  if (S.flags.offlineEmpty) return emptyHTML("You're offline.", 'Connect to the internet to load your PixelLab library.', '<button class="btn" data-act="retry">Try again</button>');
  if (S.flags.cors) return emptyHTML('PixelLab is blocking this browser.', 'PixelLab may have changed how its API works with websites. Nothing is wrong with your account.', '<button class="btn" data-act="retry">Try again</button>');
  const banner = S.flags.offline ? `<div class="banner" role="status">${ic('triangle-alert', 'sm')}You're offline. Showing your saved library.</div>` : '';
  if (r.view === 'library') {
    if (r.chip === 'other') return banner + titleRow(r, 'Other', null) + emptyHTML('Other PixelLab content.', "Fonts, effects, portraits and talking animations aren't available through PixelLab's public API yet, so Vitrine can't show them. Find them in PixelLab:", '',
      `<ul class="links-list">${['Fonts', 'Effects', 'Portraits', 'Talking animations'].map(l => `<li>${plLink(l, '')}</li>`).join('')}</ul>`);
    if (r.chip === 'images' && S.flags.gate) return banner + titleRow(r, 'Images', null) + emptyHTML("Creator images aren't available yet.", 'The only public way to read them might also save data to your account. Vitrine stays strictly view-only, so it leaves them out for now.', plLink('Open your Creator gallery in PixelLab'));
    if (S.flags.empty) return emptyHTML('Nothing here yet.', "Create something in PixelLab and it'll show up here.", plLink('Open PixelLab') + '<button class="btn" data-act="sync-now">Sync again</button>');
    if (shelvesMode(r)) return banner + `<h1 class="sr-only not-phone" tabindex="-1">Library</h1>` + shelvesHTML();
  }
  const cs = viewCards(r);
  let head = '', pre = '';
  if (r.view === 'folder') {
    const f = folderById(r.id);
    if (!f) return emptyHTML('This folder is gone.', '', '<a class="btn" href="#/collections">Go to Collections</a>');
    head = `<button class="btn" data-act="folder-export">${ic('download', 'sm')}Export</button><button class="ibtn" data-act="folder-menu" data-id="${f.id}" aria-label="Folder actions" aria-haspopup="menu">${ic('ellipsis')}</button>`;
    const m = missing(f.ids);
    if (m) pre = `<div class="banner">${m === 1 ? "1 item in this folder isn't" : `${m} items in this folder aren't`} in your PixelLab library anymore. <button class="linkbtn" data-act="unavail-remove">Remove them</button></div>`;
  }
  if (r.view === 'favorites') { const m = missing([...S.favs]); if (m && !S.flags.emptyFav) pre = `<div class="banner">${m === 1 ? "1 favorite isn't" : `${m} favorites aren't`} in your PixelLab library anymore. <button class="linkbtn" data-act="unavail-remove">Remove them</button></div>`; }
  let body;
  if (!cs.length && S.q) body = noResultsHTML(r);
  else if (!cs.length && r.view === 'folder' && !S.sync.running) body = emptyHTML('This folder is empty.', 'Select assets in your library, then choose Add to folder.', '<a class="btn" href="#/">Go to Library</a>');
  else if (!cs.length && r.view === 'favorites' && !S.sync.running) body = emptyHTML('No favorites yet.', 'Use the heart on any asset to keep it here.');
  else body = gridHTML(r, cs);
  return banner + titleRow(r, viewTitle(r), cs.length, head) + pre + body;
}
function titleRow(r, title, n, extra) {
  const back = r.view === 'library' ? ['#/', 'Library'] : ['#/collections', 'Collections'];
  return `<div class="title-row"><a class="back" href="${back[0]}">${ic('chevron-left', 'sm')}${back[1]}</a><h1 class="page-title not-phone" tabindex="-1">${esc(title)}</h1>${n != null ? `<span class="title-count not-phone">${plural(n, 'asset')}</span>` : ''}${extra ? `<span class="actions-end">${extra}</span>` : ''}</div>`;
}
function noResultsHTML(r) {
  const scoped = r.chip && r.chip !== 'all';
  const notes = [r.chip === 'images' && "Image descriptions from PixelLab are shortened, so some words can't be found.", /\b(fonts?|effects?|vfx)\b/i.test(S.q) && 'Looking for fonts or effects? See Other.', S.sync.running && 'Still syncing, more may appear.'].filter(Boolean);
  return emptyHTML(`No matches for “${esc(S.q)}”${scoped ? ` in ${CHIP_LABEL[r.chip]}` : ''}.`, 'Try fewer words, or search all types.' + notes.map(n => `<br>${n}`).join(''),
    `<button class="btn" data-act="q-clear">Clear search</button>${scoped ? '<button class="btn" data-act="search-all">Search all types</button>' : ''}`);
}
function gridHTML(r, cs) {
  const crumb = r.view === 'library' ? `<a href="#/">Library</a> / ${esc(viewTitle(r))}` : `<a href="#/collections">Collections</a> / ${esc(viewTitle(r))}`;
  CTX.grid = { keys: cs.map(c => c.key), crumb };
  const mixed = r.view !== 'library' || !r.chip || r.chip === 'all';
  const skel = S.sync.running ? Array.from({ length: 6 }, skelCard).join('') : '';
  return `<ul class="grid" role="list">${cs.map(c => cardHTML(c, 'grid', mixed)).join('')}${skel}</ul>${cs.length && !S.sync.running ? `<p class="endline">That's everything · ${plural(cs.length, 'asset')}</p>` : ''}`;
}
const skelCard = () => '<li class="card skel" aria-hidden="true"><div class="mat"></div><div class="label"></div></li>';
const bottomAligned = c => /^(character|object|map_object)$/.test(c.type);
const artImg = (c, src) => `<img class="art" src="${esc(src || c.a.thumb)}" data-w="${c.w}" data-h="${c.h}" alt="" draggable="false">`;
function cardName(c) {
  const b = badge(c, false);
  return `${c.caption}, ${c.label.toLowerCase()}${b ? ', ' + b : ''}${S.favs.has(c.id) ? ', favorite' : ''}${S.sel.has(c.id) ? ', selected' : ''}`;
}
function cardHTML(c, ctx, mixed) {
  const fav = S.favs.has(c.id), sel = S.sel.has(c.id), b = badge(c, S.size === 'S' && ctx === 'grid');
  const mapPending = c.type === 'map' && !S.mapsShown.has(c.id);
  const chip = b || mixed ? `<span class="chipish badge">${mixed ? ic(c.icon) : ''}${b ? `<span class="bt">${c.preview ? '▶ ' : ''}${esc(b)}</span>` : ''}</span>` : '';
  return `<li class="card${sel ? ' selected' : ''}" data-id="${c.id}"><a class="card-link" href="${detailHash(S.r, c.key)}" data-key="${c.key}" data-ctx="${ctx}" draggable="false" aria-label="${esc(cardName(c))}">
    <div class="mat"><div class="art-box${bottomAligned(c) ? ' bottom' : ''}">${mapPending ? `<span class="ph-map">${esc(c.title)}</span>` : artImg(c)}</div>
    ${chip}<span class="chipish fitmark" hidden>fit</span>${fav ? `<span class="chipish favdot">${ic('heart', 'fill')}</span>` : ''}<span class="chipish selbox">${ic('check')}</span></div>
    <span class="label"><span class="name" title="${esc(c.caption)}">${esc(c.caption)}</span><span class="meta">${esc(c.label)} · ${c.w}×${c.h}</span></span></a>
    <span class="hc-check"><button class="hc" tabindex="-1" data-act="card-check" aria-label="Select ${esc(c.caption)}">${ic('check')}</button></span>
    <span class="hc-right"><button class="hc" tabindex="-1" data-act="card-fav" aria-pressed="${fav}" aria-label="Favorite ${esc(c.caption)}">${ic('heart', fav ? 'fill' : '')}</button><button class="hc" tabindex="-1" data-act="card-menu" aria-label="More actions for ${esc(c.caption)}" aria-haspopup="menu">${ic('ellipsis')}</button></span></li>`;
}
const qHTML = c => c ? `<div class="q"><div class="art-box${bottomAligned(c) ? ' bottom' : ''}">${artImg(c)}</div></div>` : '<div class="q empty"></div>';
function shelvesHTML() {
  const lib = sortCards(library(), 'all'), out = [];
  const shelf = (id, title, cs, max, href, count, crumb) => {
    CTX[id] = { keys: cs.map(c => c.key), crumb };
    const end = cs.length > max ? `<li class="card endtile"><a class="card-link" href="${href}" aria-label="See all ${cs.length} ${esc(title)}"><div class="mat"><div class="mosaic">${[0, 1, 2, 3].map(i => qHTML(cs[max + i])).join('')}</div></div><span class="label"><span class="name">See all ${cs.length} →</span></span></a></li>` : '';
    return `<section class="shelf" aria-labelledby="sh-${id}"><div class="shelf-head"><h2 class="shelf-title" id="sh-${id}">${esc(title)}</h2>${count ? `<span class="shelf-count">${cs.length}</span>` : ''}<span class="spacer"></span>
      ${S.selecting ? `<button class="linkbtn accent" data-act="sel-shelf" data-shelf="${id}">Select all in shelf</button>` : ''}<a class="see-all" href="${href}">See all ${cs.length} →</a>
      <span class="shelf-nav"><button class="circle" data-act="shelf-scroll" data-shelf="${id}" data-dir="-1" aria-label="Scroll ${esc(title)} left">${ic('chevron-left')}</button><button class="circle" data-act="shelf-scroll" data-shelf="${id}" data-dir="1" aria-label="Scroll ${esc(title)} right">${ic('chevron-right')}</button></span></div>
      <ul class="track" data-shelf="${id}" role="list">${cs.slice(0, max).map(c => cardHTML(c, id, id === 'recent' || id === 'favorites')).join('')}${end}</ul></section>`;
  };
  if (lib.length) out.push(shelf('recent', 'Recent', lib, 12, '#/?type=all', false, '<a href="#/">Library</a> / Recent'));
  const favs = sortCards(favCards(), 'all');
  if (favs.length) out.push(shelf('favorites', 'Favorites', favs, 24, '#/favorites', true, '<a href="#/collections">Collections</a> / Favorites'));
  for (const [id, label] of CHIPS.slice(1, -1)) {
    const cs = lib.filter(c => c.chip === id);
    if (cs.length) out.push(shelf(id, label, cs, 24, '#/?type=' + id, true, `<a href="#/">Library</a> / ${label}`));
    else if (S.sync.running) out.push(`<section class="shelf" aria-hidden="true"><div class="shelf-head"><h2 class="shelf-title">${label}</h2></div><ul class="track">${Array.from({ length: 8 }, skelCard).join('')}</ul></section>`);
  }
  return out.join('') + `<p class="colophon">Unofficial. Not affiliated with or endorsed by PixelLab. · ${plural(lib.length, 'asset')} on this wall.</p>`;
}

// ---- collections (folders as boards)
function boardHTML(id, name, cards, href, menu) {
  const cover = cards.slice(-4).reverse();                                 // most recently added first (02 §3.8)
  return `<li class="board"><a class="board-link" href="${href}" aria-label="${esc(name)}, ${plural(cards.length, 'asset')}"><div class="mosaic">${cards.length ? [0, 1, 2, 3].map(i => qHTML(cover[i])).join('') : `<div class="q glyph">${ic(id === 'favorites' ? 'heart' : 'folder', 'lg')}</div>`}</div>
    <span class="board-label"><span class="board-name">${esc(name)}</span><span class="board-count">${plural(cards.length, 'asset')}</span></span></a>
    ${menu ? `<button class="ibtn board-more" data-act="folder-menu" data-id="${id}" aria-label="Folder actions for ${esc(name)}" aria-haspopup="menu">${ic('ellipsis')}</button>` : ''}</li>`;
}
function collectionsHTML() {
  const showTip = !S.tipDismissed && !S.protect && (S.folders.length || S.favs.size >= 5);
  const favIds = S.flags.emptyFav ? [] : [...S.favs];
  return `<div class="page"><div class="title-row"><h1 class="page-title" tabindex="-1">Collections</h1><span class="actions-end"><button class="btn" data-act="new-folder" aria-label="New folder">${ic('folder-plus', 'sm')}<span class="not-phone">New folder</span></button><button class="ibtn only-phone" data-act="settings" aria-label="Settings">${ic('settings')}</button></span></div>
    ${showTip ? `<div class="tip" role="note"><p>Your folders and favorites live only in this browser, and browsers sometimes clear site data. Export a backup to keep them safe.</p><button class="btn" data-act="backup">Export backup</button><button class="btn ghost" data-act="protect">Protect</button><button class="btn ghost" data-act="tip-dismiss">Not now</button></div>` : ''}
    <ul class="boards" role="list">${boardHTML('favorites', 'Favorites', uniqCards(favIds), '#/favorites', false)}${sortedFolders().map(f => boardHTML(f.id, f.name, folderCards(f), '#/folder/' + f.id, true)).join('')}
    <li><button class="board-new" data-act="new-folder">${ic('folder-plus', 'lg')}New folder</button></li></ul>
    ${S.folders.length ? '' : `<p class="hint" style="margin-top:16px">Group assets by game or project. Folders live in this browser only.</p>`}</div>`;
}

// ---- grid mechanics (04 §0.5, B mins per form factor)
const MINS = { phone: { S: 100, M: 140, L: 220, XL: 328 }, tablet: { S: 120, M: 152, L: 220, XL: 300 }, laptop: { S: 136, M: 168, L: 240, XL: 320 } };
function layoutGrids() {
  const f = ff(), m = MINS[f === 'compact' ? 'phone' : f === 'desktop' ? 'laptop' : f][S.size];
  for (const g of $$('.grid')) {
    const W = g.clientWidth, gap = parseFloat(getComputedStyle(g).columnGap) || 0;
    g.style.setProperty('--cols', Math.min(16, Math.max(1, Math.floor((W + gap) / (m + gap)))));
  }
}
// Integer device-pixel fit for every thumbnail (02 §4.3): read all boxes, then write.
function fitAll(root) {
  const dpr = devicePixelRatio || 1;
  const items = $$('.art-box > .art', root || document).map(el => [el, el.parentElement.clientWidth, el.parentElement.clientHeight]);
  for (const [el, bw, bh] of items) {
    const r = integerScale(+el.dataset.w, +el.dataset.h, bw, bh, dpr); if (!r) continue;
    el.style.width = r.cssW + 'px'; el.style.height = r.cssH + 'px'; el.classList.toggle('smooth', r.smooth);
    const fm = el.closest('.mat') && el.closest('.mat').querySelector('.fitmark'); if (fm) fm.hidden = !r.smooth;
  }
}
// Map thumbnails render lazily (R-6): title placeholder first, image after a fake view_map delay.
function scheduleMaps() {
  if (!$('.ph-map')) return;
  setTimeout(() => { CARDS.filter(c => c.type === 'map').forEach(c => S.mapsShown.add(c.id)); $$('.card[data-id] .ph-map').forEach(p => { const c = cardById.get(p.closest('.card').dataset.id); p.outerHTML = artImg(c); }); fitAll(); }, 1200);
}

// ============================================================ previews (02 §4.8)
const IMG = new Map();
function img(src) { let i = IMG.get(src); if (!i) { i = new Image(); i.src = src; IMG.set(src, i); } return i; }
const fpsKeyFor = (a, cardKey) => a.type === 'creator_image' ? 'img:' + cardKey : (pickAnim(a) ? key12(pickAnim(a).id) : null);
const active = new Map();
function startPreview(li) {
  if (active.has(li) || !li.isConnected) return;
  const c = cardById.get(li.dataset.id), box = li.querySelector('.art-box'), still = box && box.querySelector('img.art');
  if (!c || !c.preview || !still) return;
  const cv = document.createElement('canvas'), ctx = cv.getContext('2d'), frames = c.preview.map(img);
  cv.className = still.className; cv.width = c.w; cv.height = c.h; cv.dataset.w = c.w; cv.dataset.h = c.h;
  cv.style.width = still.style.width; cv.style.height = still.style.height;
  const draw = i => { const f = frames[i]; if (!f.naturalWidth) return; if (cv.width !== f.naturalWidth) { cv.width = f.naturalWidth; cv.height = f.naturalHeight; } ctx.imageSmoothingEnabled = false; ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(f, 0, 0); };
  const k = fpsKeyFor(c.a, c.key), p = PixelTicker.player(frames.map(() => 1000 / ((k && S.fps[k]) || 8)), draw);
  still.hidden = true; box.append(cv); p.seek(0); p.play(); active.set(li, { p, cv, still });
}
function stopPreview(li) { const r = active.get(li); if (!r) return; r.p.stop(); r.cv.remove(); r.still.hidden = false; active.delete(li); }
function stopAllPreviews() { [...active.keys()].forEach(stopPreview); }
let dwellT = 0, hoverLi = null, io = null;
const inView = new Set();
function dwell(li) { clearTimeout(dwellT); if (li && cardById.get(li.dataset.id) && cardById.get(li.dataset.id).preview) dwellT = setTimeout(() => startPreview(li), 300); }
function leave(li) { clearTimeout(dwellT); if (li && !(S.animate && inView.has(li))) stopPreview(li); }
document.addEventListener('pointerover', e => {
  if (e.pointerType !== 'mouse') return;
  const li = e.target.closest('.card[data-id]'); if (li === hoverLi) return;
  leave(hoverLi); hoverLi = li; dwell(li);
});
document.addEventListener('pointerout', e => { if (!e.relatedTarget && hoverLi) { leave(hoverLi); hoverLi = null; } });
document.addEventListener('focusin', e => { const l = e.target.closest && e.target.closest('.card-link'); if (l && l.dataset.key) dwell(l.closest('.card')); });
document.addEventListener('focusout', e => { const l = e.target.closest && e.target.closest('.card-link'); if (l && l.dataset.key && l.closest('.card') !== hoverLi) leave(l.closest('.card')); });
function setupAnimate() {
  if (io) io.disconnect(); inView.clear();
  if (!S.animate) return;
  // ponytail: plays in-view cards up to the cap in DOM order; nearest-to-centre ordering matters only for big libraries.
  io = new IntersectionObserver(es => {
    for (const e of es) { if (e.isIntersecting) inView.add(e.target); else { inView.delete(e.target); if (e.target !== hoverLi) stopPreview(e.target); } }
    [...inView].slice(0, isCoarse() ? 8 : 24).forEach(startPreview);
  });
  $$('.card[data-id]').forEach(li => { const c = cardById.get(li.dataset.id); if (c && c.preview) io.observe(li); });
}

// ============================================================ selection (02 §3.9)
function refreshCards() {
  $$('.card[data-id]').forEach(li => {
    const c = cardById.get(li.dataset.id), on = S.sel.has(c.id);
    li.classList.toggle('selected', on);
    const l = li.querySelector('.card-link'); if (l) l.setAttribute('aria-label', cardName(c));
  });
}
function setSelecting(on) {
  if (S.selecting === on) return;
  S.selecting = on; if (!on) { S.sel.clear(); S.anchor = null; }
  announce(on ? `Selection mode. ${S.sel.size} selected.` : 'Selection cleared');
  rerender();
}
function toggleSel(c) {
  S.sel.has(c.id) ? S.sel.delete(c.id) : S.sel.add(c.id); S.anchor = c.id;
  if (!S.selecting) { S.selecting = true; announce(`Selection mode. ${S.sel.size} selected.`); rerender(); return; }
  if (!S.sel.size) { setSelecting(false); return; }
  refreshCards(); renderSelbar(); announce(`${S.sel.size} selected`);
}
function rangeSel(link) {
  const list = $$('.card-link[data-key]', link.closest('ul')), a = list.findIndex(l => byKey.get(l.dataset.key).id === S.anchor), b = list.indexOf(link);
  if (a < 0) return toggleSel(byKey.get(link.dataset.key));
  list.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(l => S.sel.add(byKey.get(l.dataset.key).id));
  refreshCards(); renderSelbar(); announce(`${S.sel.size} selected`);
}
function visibleNow() { const r = S.r; return !r || r.key || r.view === 'collections' ? [] : shelvesMode(r) ? library() : viewCards(r); }
function selectAll(cards) { if (!S.selecting) { S.selecting = true; cards.forEach(c => S.sel.add(c.id)); rerender(); } else { cards.forEach(c => S.sel.add(c.id)); refreshCards(); renderSelbar(); } announce(`${S.sel.size} selected`); }
const selCards = () => [...S.sel].map(id => cardById.get(id)).filter(Boolean);
function renderSelbar() {
  const bar = $('#selbar'); bar.hidden = !S.selecting || !S.r || !!S.r.key || S.r.view === 'connect';
  if (bar.hidden) return;
  const vis = new Set(visibleNow().map(c => c.id)), hidden = [...S.sel].filter(id => !vis.has(id)).length, n = S.sel.size;
  const allFav = n && [...S.sel].every(id => S.favs.has(id)), dis = n ? '' : ' disabled';
  bar.innerHTML = `<span class="sel-count" role="status">${n} selected${hidden ? `<span class="sel-hidden"> · ${hidden} hidden by filter</span>` : ''}</span>
    <button class="linkbtn accent" data-act="sel-all">Select all</button><span class="spacer"></span>
    <button class="ibtn" data-act="sel-fav" aria-label="${allFav ? 'Unfavorite' : 'Favorite'}" title="${allFav ? 'Unfavorite' : 'Favorite'}"${dis}>${ic('heart', allFav ? 'fill' : '')}</button>
    <button class="btn ghost" data-act="sel-folder" aria-label="Add to folder"${dis}>${ic('folder-plus')}<span class="lbl lbl-wide">Add to folder</span></button>
    ${S.r.view === 'folder' ? `<button class="btn ghost" data-act="sel-remove" aria-label="Remove from folder"${dis}>${ic('trash-2')}<span class="lbl lbl-wide">Remove from folder</span></button>` : ''}
    <button class="btn primary" data-act="sel-download"${dis}>${ic('download')}<span class="lbl">Download</span></button>
    <button class="ibtn" data-act="sel-exit" aria-label="Clear selection">${ic('x')}</button>`;
}

// ============================================================ favorites + folders (02 §3.7, §3.8)
function toggleFav(c) {
  const on = !S.favs.has(c.id); on ? S.favs.add(c.id) : S.favs.delete(c.id);
  announce(on ? 'Added to favorites' : 'Removed from favorites');
  S.r.key ? refreshDetail() : rerender();
}
function addToFolder(f, cards) { let n = 0; cards.forEach(c => { if (!inFolder(f, c)) { f.ids.push(c.id); n++; } }); return n; }
function removeFromFolder(f, cards) { f.ids = f.ids.filter(id => !cards.includes(cardById.get(id))); }
function refreshBehind() { S.r.key ? refreshDetail(true) : rerender(); }
function undoable(f, prev) { return { label: 'Undo', run: () => { f.ids = prev; refreshBehind(); } }; }
function removeWithUndo(f, cards) {
  const prev = f.ids.slice(); removeFromFolder(f, cards);
  toast(`Removed from ${esc(f.name)}. It's still in your library.`, undoable(f, prev)); refreshBehind();
}
function openFolderName(f, done) {
  const d = openDialog({ title: f ? 'Rename folder' : 'New folder', cls: 'sm',
    body: `<div class="form-row"><label for="fn">Name</label><input id="fn" class="field" maxlength="60" value="${esc(f ? f.name : 'New folder')}" aria-describedby="fn-err" autocomplete="off"><p class="err" id="fn-err" hidden></p></div>`,
    foot: `<button class="btn" data-close>Cancel</button><button class="btn primary" data-ok>${f ? 'Save' : 'Create'}</button>` });
  const inp = $('#fn', d), err = $('#fn-err', d); inp.focus(); inp.select();
  const ok = () => {
    const name = inp.value.trim();
    const msg = !name ? 'Give the folder a name.' : S.folders.some(x => x !== f && x.name.toLowerCase() === name.toLowerCase()) ? 'You already have a folder with that name.' : '';
    if (msg) { err.textContent = msg; err.hidden = false; inp.setAttribute('aria-invalid', 'true'); inp.focus(); return; }
    if (f) f.name = name; else { f = { id: 'fld_' + Math.random().toString(36).slice(2, 8), name, ids: [] }; S.folders.push(f); }
    d.close(); done && done(f);
  };
  $('[data-ok]', d).onclick = ok;
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); ok(); } });
}
function confirmDlg(title, body, okLabel, onOk, extra) {
  const d = openDialog({ title, cls: 'sm', role: 'alertdialog', body: `<p class="muted">${body}</p>${extra || ''}`, foot: `<button class="btn" data-close>Cancel</button><button class="btn danger" data-ok>${okLabel}</button>` });
  $('[data-ok]', d).onclick = () => { onOk(d); d.close(); };
  $('[data-close].btn', d).focus();
  return d;
}
function deleteFolder(f) {
  const n = folderCards(f).length;
  confirmDlg(`Delete “${esc(f.name)}”?`, `The ${plural(n, 'asset')} in it stay in your library. Only the folder goes away.`, 'Delete folder', () => {
    const i = S.folders.indexOf(f); S.folders.splice(i, 1);
    toast(`Deleted “${esc(f.name)}”. Your assets are untouched.`, { label: 'Undo', run: () => { S.folders.splice(i, 0, f); rerender(); } });
    if (S.r.view === 'folder' && S.r.id === f.id) go('#/collections'); else rerender();
  });
}
function openFolderPicker(cards) {
  const st = f => { const n = cards.filter(c => inFolder(f, c)).length; return n === 0 ? 'false' : n === cards.length ? 'true' : 'mixed'; };
  const tiles = () => sortedFolders().map(f => { const fc = folderCards(f);
    return `<button class="ftile" role="checkbox" aria-checked="${st(f)}" data-fid="${f.id}" aria-label="${esc(f.name)}, ${plural(fc.length, 'asset')}"><span class="tick">${ic('check', 'i-check')}${ic('minus', 'i-minus')}</span><div class="mosaic">${[0, 1, 2, 3].map(i => qHTML(fc.slice(-4).reverse()[i])).join('')}</div><span class="fname2">${esc(f.name)}</span><span class="faint" style="font-size:var(--step--1)">${plural(fc.length, 'asset')}</span></button>`; }).join('')
    + `<button class="ftile new" data-new>${ic('folder-plus', 'lg')}New folder</button>`;
  const d = openDialog({ title: 'Add to folder', sub: cards.length > 1 ? plural(cards.length, 'asset') : esc(cards[0].caption), cls: 'wide',
    body: `<div class="ftiles" role="group" aria-label="Folders">${tiles()}</div>`, foot: '<button class="btn primary" data-close>Done</button>' });
  const redraw = fid => { $('.ftiles', d).innerHTML = tiles(); fitAll(d); const t = fid && $(`[data-fid="${fid}"]`, d); t && t.focus(); };
  fitAll(d);
  d.addEventListener('click', e => {
    const t = e.target.closest('.ftile'); if (!t) return;
    if (t.hasAttribute('data-new')) { openFolderName(null, f => { const n = addToFolder(f, cards); toast(`Added ${n} to ${esc(f.name)}.`, undoable(f, [])); redraw(f.id); refreshBehind(); }); return; }
    const f = folderById(t.dataset.fid), prev = f.ids.slice();
    if (st(f) === 'true') { removeFromFolder(f, cards); toast(`Removed from ${esc(f.name)}. It's still in your library.`, undoable(f, prev)); }
    else { const n = addToFolder(f, cards); toast(`Added ${n} to ${esc(f.name)}.`, undoable(f, prev)); }
    redraw(f.id); refreshBehind();
  });
}

// ============================================================ dialogs, menus, toasts
let dlgN = 0;
function openDialog({ title, sub, body, foot, cls, role }) {
  const d = document.createElement('dialog'), id = 'dlg-t-' + (++dlgN), opener = document.activeElement;
  d.className = 'dlg ' + (cls || ''); d.setAttribute('aria-labelledby', id); if (role) d.setAttribute('role', role);
  d.innerHTML = `<div class="dlg-head"><h2 id="${id}" tabindex="-1">${title}</h2><button class="ibtn" data-close aria-label="Close">${ic('x')}</button></div>${sub ? `<p class="dlg-sub">${sub}</p>` : ''}<div class="dlg-body">${body}</div>${foot ? `<div class="dlg-foot">${foot}</div>` : ''}`;
  d.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === d) d.close(); });
  d.addEventListener('close', () => { d.remove(); if (opener && opener.isConnected && !$('dialog[open]')) opener.focus({ preventScroll: true }); });
  closePop(); document.body.append(d); d.showModal(); $('h2', d).focus();
  return d;
}
const pop = $('#pop'); let popAnchor = null;
function closePop() { if (pop.matches(':popover-open')) pop.hidePopover(); }
function openMenu(anchor, html, role) {
  if (pop.matches(':popover-open') && popAnchor === anchor) { pop.hidePopover(); return; }
  closePop(); pop.innerHTML = html; pop.setAttribute('role', role || 'menu'); popAnchor = anchor;
  pop.showPopover();
  const r = anchor.getBoundingClientRect(), pw = pop.offsetWidth, ph = pop.offsetHeight;
  pop.style.left = clamp(r.left, 8, innerWidth - pw - 8) + 'px';
  pop.style.top = (r.bottom + 6 + ph > innerHeight - 8 ? Math.max(8, r.top - ph - 6) : r.bottom + 6) + 'px';
  fitAll(pop);
  const first = pop.querySelector('.mi[aria-checked="true"], .compass [aria-checked="true"], .mi, button, input'); first && first.focus();
}
pop.addEventListener('toggle', e => { if (e.newState === 'closed' && popAnchor && popAnchor.isConnected && (document.activeElement === document.body || !document.activeElement)) popAnchor.focus({ preventScroll: true }); });
pop.addEventListener('keydown', e => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  const items = $$('.mi', pop), i = items.indexOf(document.activeElement); if (!items.length) return;
  e.preventDefault(); items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
});
const mi = (label, attrs, icon, checked, end) => `<button class="mi" role="${checked == null ? 'menuitem' : 'menuitemradio'}"${checked != null ? ` aria-checked="${checked}"` : ''} ${attrs}>${checked != null ? ic('check', 'chk') : icon ? ic(icon) : ''}<span>${label}</span>${end ? `<span class="end">${end}</span>` : ''}</button>`;
const miLink = label => `<a class="mi" role="menuitem" href="#" target="_blank" rel="noopener noreferrer" data-act="open-pl">${ic('external-link')}<span>${label} ↗</span><span class="sr-only"> (opens PixelLab in a new tab)</span></a>`;
function toast(msg, action) {
  const stack = $('#stack'); while (stack.querySelectorAll('.toast').length >= 3) stack.querySelector('.toast').remove();
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.innerHTML = `<span>${msg}</span>`;
  let left = action ? 10000 : 5000, t0, timer;
  const remove = () => { clearTimeout(timer); t.remove(); };
  if (action) { const b = document.createElement('button'); b.textContent = action.label; b.onclick = () => { remove(); action.run(); }; t.append(b); }
  const arm = () => { t0 = Date.now(); timer = setTimeout(remove, left); }, pause = () => { clearTimeout(timer); left -= Date.now() - t0; };
  t.addEventListener('pointerenter', pause); t.addEventListener('pointerleave', arm); t.addEventListener('focusin', pause); t.addEventListener('focusout', arm);
  stack.append(t); arm(); return t;
}
const mockOpen = () => toast('Mockup: this opens PixelLab in a new tab.');

// ============================================================ detail page (V4: full-page route, same zones as 02 §6.1)
let V = null, stageRO = null, idleT = 0;
const CW = ['north', 'north_east', 'east', 'south_east', 'south', 'south_west', 'west', 'north_west'];
const API_ORDER = ['south', 'south_east', 'east', 'north_east', 'north', 'north_west', 'west', 'south_west'];
const COMPASS = ['north_west', 'north', 'north_east', 'west', null, 'east', 'south_west', 'south', 'south_east'];
const SHORT = { north: 'N', north_east: 'NE', east: 'E', south_east: 'SE', south: 'S', south_west: 'SW', west: 'W', north_west: 'NW', unknown: '' };
const dirName = d => d && d !== 'unknown' ? cap(d.replace('_', '-')) : '';
const dirSlug = d => d && d !== 'unknown' ? d.replace('_', '-') : '';
const ZOOMS = [1, 2, 3, 4, 6, 8, 12, 16];
const BGS = [['stage', 'Stage'], ['checker', 'Checker'], ['mid', 'Mid gray'], ['light', 'Light gray'], ['black', 'Black'], ['white', 'White']];
const TIMING = "PixelLab doesn't say how fast animations play. 8 fps matches PixelLab's own players.";
function kindOf(a) {
  if (a.type === 'character' || a.type === 'object') return 'frames';
  if (a.type === 'creator_image') return a.frames && a.frames.length > 1 ? 'frames' : 'image';
  if (a.type.startsWith('tileset')) return 'sheet';
  return a.type === 'tiles_pro' ? 'vars' : 'image';
}
const fpsKey = () => V.a.type === 'creator_image' ? 'img:' + V.c.key : V.ai > 0 ? key12(V.anims[V.ai - 1].id) : null;
function setStateIdx(si, q) {
  const a = V.c.states[si], prevA = V.a, prevAnimType = prevA && V.ai > 0 ? prevA.animations[V.ai - 1].type : null;
  V.si = si; V.a = a; V.kind = kindOf(a); V.anims = a.animations || [];
  const dirs = Object.keys(a.directions || {});
  if (q && q.has('anim')) V.ai = clamp(parseInt(q.get('anim'), 10) || 0, 0, V.anims.length);
  else if (prevA) V.ai = prevAnimType ? V.anims.findIndex(x => x.type === prevAnimType) + 1 : 0;   // keep same animation_type, else Rotations
  else { const pa = pickAnim(a); V.ai = pa ? V.anims.indexOf(pa) + 1 : 0; }
  const qd = q && q.get('dir');
  V.dir = qd && dirs.includes(qd) ? qd : prevA && dirs.includes(V.dir) ? V.dir : dirs.includes('south') ? 'south' : dirs[0] || null;
  fixDir(); V.frame = 0; V.fps = S.fps[fpsKey()] || 8;
}
const dirsOf = () => V.kind !== 'frames' || V.a.type === 'creator_image' ? [] : Object.keys(V.ai > 0 ? V.anims[V.ai - 1].frames : V.a.directions);
function fixDir() {
  const av = dirsOf(); if (!av.length || av.includes(V.dir)) return;
  if (av.includes('south')) { V.dir = 'south'; return; }
  const i = CW.indexOf(V.dir), dist = j => Math.min((i - j + 8) % 8, (j - i + 8) % 8);
  V.dir = av.slice().sort((x, y) => dist(CW.indexOf(x)) - dist(CW.indexOf(y)))[0];
}
function srcs() { const a = V.a; if (a.type === 'creator_image') return a.frames || [a.thumb]; if (V.ai > 0) return V.anims[V.ai - 1].frames[V.dir]; return [a.directions[V.dir] || a.thumb]; }
const hasTransport = () => V.kind === 'frames' && srcs().length > 1;
const compassOn = () => V.kind === 'frames' && Object.keys(V.a.directions || {}).filter(k => k !== 'unknown').length > 1;
function defaultCtx(r) {
  const cs = shelvesMode(r) ? sortCards(library(), 'all') : viewCards(r);
  const crumb = r.view === 'library' ? `<a href="#/">Library</a>${r.chip && r.chip !== 'all' ? ' / ' + CHIP_LABEL[r.chip] : ''}` : `<a href="#/collections">Collections</a> / ${esc(viewTitle(r))}`;
  return { keys: cs.map(c => c.key), crumb };
}
function renderDetail(r, prev) {
  const c = byKey.get(r.key);
  if (!c) { toast("That asset isn't in this library."); history.replaceState(null, '', r.parent); S.r = route(); render(null); return; }
  const same = V && V.c === c;
  if (!S.ctx || !S.ctx.keys.includes(c.key)) S.ctx = defaultCtx(r);
  const keep = V ? { bg: V.bg, playing: V.playing, loop: V.loop } : null;
  V = { c, zoom: 'fit', panX: 0, panY: 0, bg: S.viewBg || S.bgDefault, loop: true, grid: false, playing: !reduced(), frame: 0, swipe: 0, xfade: !!(prev && prev.key && !same) };
  if (keep && prev && prev.key) Object.assign(V, keep);
  setStateIdx(clamp(parseInt(r.q.get('state'), 10) || 0, 0, c.states.length - 1), r.q);
  S.lastKey = c.key;
  mountDetail();
  document.title = `${c.title} · Vitrine`;
  if (!prev || !prev.key) { scrollTo(0, 0); $('#d-title').focus({ preventScroll: true }); }
  if (S.pendingExport) { S.pendingExport = false; openExportSingle(); }
}
function mountDetail() {
  teardownDetail(true);
  $('#main').innerHTML = detailHTML();
  V.xfade = false;
  mountStage(); bindStage(); idleArm();
}
function refreshDetail(bg) {
  if (!V) return;
  const f = bg ? null : focusSel(), y = scrollY;
  mountDetail(); scrollTo(0, y); restoreFocus(f); updateURL();
}
function updateURL() {
  history.replaceState(null, '', detailHash(S.r, V.c.key, { dir: V.dir && V.dir !== 'unknown' && V.dir !== 'south' ? V.dir : null, anim: V.ai || null, state: V.si || null }));
  S.r = route();
}
function teardownDetail(keepV) {
  clearTimeout(idleT); if (stageRO) { stageRO.disconnect(); stageRO = null; }
  if (V) { stopPlayer(); V.el = null; V.ctx = null; V.token = null; }
  if (!keepV && S.r && !S.r.key) V = null;
}
function detailHTML() {
  const c = V.c, a = V.a, ctx = S.ctx, n = ctx.keys.length, idx = ctx.keys.indexOf(c.key);
  const st = c.type === 'character' ? (a.meta.state_name ? cap(a.meta.state_name) : 'Base') : a.meta.state_name ? cap(a.meta.state_name) : '';
  const pd = idx <= 0 ? ' disabled' : '', nd = idx < 0 || idx >= n - 1 ? ' disabled' : '';
  const dl = `<button class="btn sm primary" data-act="download" aria-haspopup="menu">${ic('download', 'sm')}Download${ic('chevron-down', 'sm')}</button>`;
  return `<article class="detail${V.xfade ? ' xfade' : ''}" aria-labelledby="d-title">
    <div class="appbar only-phone"><button class="ibtn" data-act="back" aria-label="Back">${ic('chevron-left')}</button><div class="appbar-title">${esc(c.title)}${st ? ` <span class="muted">· ${esc(st)}</span>` : ''}</div><button class="ibtn" data-act="dmenu" aria-label="More" aria-haspopup="menu">${ic('ellipsis')}</button></div>
    <div class="crumbs only-big"><button class="linkbtn" data-act="back">${ic('chevron-left', 'sm')} Back</button><nav class="crumbtrail" aria-label="Breadcrumb">${ctx.crumb}</nav><span class="spacer"></span><span class="pos">${idx + 1} of ${n}</span>
      <button class="circle" data-act="prev" aria-label="Previous asset"${pd}>${ic('chevron-left')}</button><button class="circle" data-act="next" aria-label="Next asset"${nd}>${ic('chevron-right')}</button><button class="ibtn" data-act="dmenu" aria-label="More" aria-haspopup="menu">${ic('ellipsis')}</button></div>
    <div class="dgrid"><section class="stage-col" aria-label="Preview">
      <div class="stage" id="stage" data-bg="${V.bg}">
        <div class="stage-tb">${stageToolbar()}</div>
        <div class="art-area" id="art-area" tabindex="0" role="img" aria-label="${esc(artLabel())}"></div>
        <button class="edge prev" data-act="prev" aria-label="Previous asset"${pd}>${ic('chevron-left')}</button><button class="edge next" data-act="next" aria-label="Next asset"${nd}>${ic('chevron-right')}</button>
        <div class="caps"><div class="cap cap-tl"><button class="ibtn" data-act="back" aria-label="Back">${ic('chevron-left')}</button><span>${esc(c.title)}${st ? ' · ' + esc(st) : ''}</span></div>
          <div class="cap cap-tr">${dl}<button class="ibtn" data-act="dmenu" aria-label="More" aria-haspopup="menu">${ic('ellipsis')}</button></div>
          ${hasTransport() ? `<div class="cap cap-b">${transportHTML()}</div>` : ''}<button class="cap cap-br" data-act="details">Details${ic('chevron-down', 'sm')}</button></div>
      </div>${dockHTML()}</section>
      <div class="info-col">${infoHTML()}</div></div>
    <div class="sticky-actions only-phone">${actionsHTML()}</div></article>`;
}
function artLabel() {
  const anim = V.ai > 0 ? V.anims[V.ai - 1].name : V.kind === 'frames' && V.a.type !== 'creator_image' ? 'Rotations' : '';
  const n = V.kind === 'frames' ? srcs().length : 1;
  return [V.c.title, anim, dirName(V.dir).toLowerCase(), n > 1 ? `frame ${V.frame + 1} of ${n}` : ''].filter(Boolean).join(', ');
}
const swatchesHTML = () => `<span class="swatches" role="radiogroup" aria-label="Backdrop">${BGS.map(([id, l]) => `<button class="swatch" role="radio" data-act="bg" data-bg="${id}" aria-checked="${V.bg === id}" tabindex="${V.bg === id ? 0 : -1}" aria-label="${l}" title="${l}"></button>`).join('')}</span>`;
function stageToolbar() {
  const tiles = V.kind === 'sheet' || V.kind === 'vars';
  return `${tiles ? `<span class="tile-info" id="tile-info" aria-live="polite"></span><button class="tb-btn" data-act="grid" aria-pressed="${V.grid}">${ic('grid-3x3', 'sm')}Grid</button>` : ''}${swatchesHTML()}
    <span class="tb-group"><button class="tb-btn" data-act="zoom-fit">${ic('scan', 'sm')}Fit</button><button class="tb-btn" data-act="zoom-1">1:1</button><button class="tb-btn" data-act="zoom-out" aria-label="Zoom out">${ic('minus', 'sm')}</button><button class="tb-btn" data-act="zoom-in" aria-label="Zoom in">${ic('plus', 'sm')}</button></span>
    <span class="readout" data-role="zoom">Fit</span>`;
}
function transportHTML() {
  const n = srcs().length;
  return `<div class="transport"><button class="play" data-act="play" data-role="play" aria-label="${V.playing ? 'Pause' : 'Play'}">${ic(V.playing ? 'pause' : 'play')}</button>
    <button class="ibtn" data-act="step-back" aria-label="Previous frame">${ic('step-back')}</button><button class="ibtn" data-act="step-fwd" aria-label="Next frame">${ic('step-forward')}</button>
    <input class="scrub" data-role="scrub" type="range" min="1" max="${n}" step="1" value="${V.frame + 1}" aria-label="Frame" aria-valuetext="Frame ${V.frame + 1} of ${n}">
    <span class="fr-readout" data-role="fr">${V.frame + 1} / ${n}</span>
    <button class="btn sm" data-act="fps" data-role="fps" aria-haspopup="dialog">${V.fps} fps</button>
    <button class="btn sm not-phone" data-act="loop" aria-pressed="${V.loop}">${ic('repeat', 'sm')}Loop</button></div>`;
}
function compassHTML(cls) {
  const av = dirsOf();
  return `<div class="compass ${cls}" role="radiogroup" aria-label="Direction">${COMPASS.map(d => d
    ? `<button role="radio" data-act="dir" data-dir="${d}" aria-checked="${V.dir === d}" tabindex="${V.dir === d ? 0 : -1}" aria-label="${dirName(d)}"${av.includes(d) ? '' : ' disabled'}><svg class="ic" aria-hidden="true" style="rotate:${CW.indexOf(d) * 45}deg"><use href="#i-arrow-up"/></svg></button>`
    : `<span class="cc" aria-hidden="true">${SHORT[V.dir] || ''}</span>`).join('')}</div>`;
}
function dockHTML() {
  const pickerOn = V.kind === 'frames' && V.a.type !== 'creator_image' && (V.a.type === 'character' || V.anims.length > 0);
  const parts = [];
  if (compassOn()) parts.push(`<button class="pill dir-pill" data-act="dir-pop" aria-haspopup="dialog" aria-label="Direction: ${dirName(V.dir)}">${ic('arrow-up', 'sm')}${SHORT[V.dir]}${ic('chevron-down', 'sm')}</button>`);
  if (pickerOn) parts.push(`<div class="pills" role="radiogroup" aria-label="Animation">${['Rotations', ...V.anims.map(x => `${x.name} · ${x.frameCount}f`)].map((l, i) => `<button class="pill" role="radio" data-act="anim" data-ai="${i}" aria-checked="${V.ai === i}" tabindex="${V.ai === i ? 0 : -1}">${esc(l)}</button>`).join('')}</div>`);
  if (V.c.states.length > 1) parts.push(`${pickerOn ? '<span class="rule" aria-hidden="true"></span>' : ''}<div class="pills" role="radiogroup" aria-label="State">${V.c.states.map((s, i) => `<button class="pill" role="radio" data-act="state" data-si="${i}" aria-checked="${V.si === i}" tabindex="${V.si === i ? 0 : -1}">${esc(s.meta.state_name ? cap(s.meta.state_name) : 'Base')}</button>`).join('')}</div>`);
  const tiles = V.kind === 'sheet' || V.kind === 'vars';
  const extras = `${hasTransport() ? `<button class="pill only-phone" data-act="loop" aria-pressed="${V.loop}">${ic('repeat', 'sm')}Loop</button>` : ''}<button class="pill only-small" data-act="bg-pop" aria-haspopup="menu">${ic('contrast', 'sm')}${BGS.find(b => b[0] === V.bg)[1]}</button>${tiles ? `<button class="pill only-small" data-act="grid" aria-pressed="${V.grid}">${ic('grid-3x3', 'sm')}Grid</button>` : ''}<button class="pill only-small" data-act="zoom-fit">Fit</button><button class="pill only-small" data-act="zoom-1">1:1</button><span class="readout only-small" data-role="zoom">Fit</span>`;
  return `<div class="dock"><div class="dock-main">${hasTransport() ? transportHTML() : ''}<div class="row2">${parts.join('')}${extras}</div></div>${compassOn() ? compassHTML('inline') : ''}</div>`;
}
function facts(c) {
  const a = V.a, m = a.meta, d = Object.keys(a.directions || {}).filter(k => k !== 'unknown').length;
  switch (a.type) {
    case 'character': return [`${a.width} × ${a.height}`, plural(d, 'direction'), V.anims.length && plural(V.anims.length, 'animation')].filter(Boolean).join(' · ');
    case 'object': return [`${a.width} × ${a.height}`, d > 1 ? plural(d, 'direction') : 'Single view', V.anims.length && plural(V.anims.length, 'animation')].filter(Boolean).join(' · ');
    case 'creator_image': return `${a.width} × ${a.height}${a.frames && a.frames.length > 1 ? ` · ${a.frames.length} frames` : ''}`;
    case 'tileset_topdown': case 'tileset_sidescroller': return `${m.total_tiles} tiles · ${a.tileSize} px`;
    case 'tiles_pro': return `${m.n_tiles} variations · ${a.tileSize} px`;
    case 'tile_isometric': return `${cap(m.tile_shape)} · ${m.size} px`;
    case 'map': return `${a.grid.cols} × ${a.grid.rows} cells · ${a.width} × ${a.height} px`;
    default: return `${a.width} × ${a.height} px`;
  }
}
function actionsHTML() {
  const fav = S.favs.has(V.c.id);
  return `<button class="btn primary dl-main" data-act="download" aria-haspopup="menu">${ic('download')}Download${ic('chevron-down', 'sm')}</button>
    <button class="ibtn" data-act="fav" aria-pressed="${fav}" aria-label="Favorite" title="Favorite (L)">${ic('heart', fav ? 'fill' : '')}</button>
    <button class="ibtn" data-act="add-folder" aria-label="Add to folder" title="Add to folder">${ic('folder-plus')}</button>
    <a class="ibtn" href="#" target="_blank" rel="noopener noreferrer" data-act="open-pl" aria-label="Open in PixelLab (opens PixelLab in a new tab)" title="Open in PixelLab ↗">${ic('external-link')}</a>`;
}
// S8 download items per type (02 §7.1), default first. v: { a, anims, ai, dir, frame }.
function dlItems(v) {
  const a = v.a, base = slug(a.name) + (a.type === 'object' && a.meta.state_name ? '-' + slug(a.meta.state_name) : '');
  const L = Math.max(a.width, a.height), auto = [1, 2, 4, 8].find(s => L * s >= 256) || 8, sx = s => s > 1 ? `@${s}x` : '';
  const anim = v.ai > 0 ? v.anims[v.ai - 1] : v.anims && v.anims[0], one = Object.keys(a.directions || {}).length <= 1, ds = dirSlug(v.dir), f3 = String(v.frame || 0).padStart(3, '0');
  const I = (t, d, f, k) => ({ t, d, f, k });
  if ((a.type === 'character' || a.type === 'object') && v.anims.length) {
    const as = slug(anim.name);
    return [I(`GIF · ${anim.name}${one ? '' : ' · ' + SHORT[v.dir]}`, 'Animated, transparent, sized for chat', `${base}_${as}${one ? '' : '_' + ds}${sx(auto)}.gif`, 'gif'),
      I('PNG · this frame', 'Original pixels, 1×', `${base}_${as}${ds ? '_' + ds : ''}_${f3}.png`, 'png'),
      I(`Sprite sheet + JSON · ${anim.name}`, 'Sheet with frame data', `${base}_${as}.png`, 'sheet'),
      I('Sprite sheet + JSON · all animations', 'Rotations plus every animation', `${base}_all.png`, 'sheet'),
      I('Frames ZIP', 'Every frame as PNG', `${base}_${as}_frames.zip`, 'frames'),
      ...(a.type === 'character' ? [I('PixelLab ZIP (all states)', "PixelLab's own export", `${base}_pixellab.zip`, 'pl')] : []),
      I('PixelLab sprite sheet', "PixelLab's own export", `${base}_pixellab-sheet.zip`, 'pl')];
  }
  if (a.type === 'character' || a.type === 'object') return [I('PNG · this view', 'Original pixels, 1×', `${base}${ds ? '_' + ds : ''}.png`, 'png'), I('Sprite sheet + JSON (rotations)', 'One row of directions', `${base}_rotations.png`, 'sheet'), I('Frames ZIP', 'Every view as PNG', `${base}_frames.zip`, 'frames'), I('PixelLab originals', "PixelLab's own export", `${base}_pixellab.zip`, 'pl')];
  if (a.type === 'creator_image' && a.frames && a.frames.length > 1) return [I('GIF', 'Animated, transparent, sized for chat', `${base}${sx(auto)}.gif`, 'gif'), I('PNG · this frame', 'Original pixels, 1×', `${base}_${f3}.png`, 'png'), I('Sprite sheet + JSON', 'One-row strip with frame data', `${base}_all.png`, 'sheet'), I('Frames ZIP', 'Every frame as PNG', `${base}_frames.zip`, 'frames')];
  if (a.type.startsWith('tileset')) return [I('PNG · sheet', 'The sheet as PixelLab made it', `${base}.png`, 'png'), I('Sheet + PixelLab metadata (ZIP)', 'Sheet plus tile metadata', `${base}_sheet.zip`, 'sheet'), I('Tiles ZIP', 'One PNG per tile', `${base}_tiles.zip`, 'frames')];
  if (a.type === 'tiles_pro') return [I('Tiles ZIP', 'Every variation + rules.json', `${base}_tiles.zip`, 'frames'), I('PNG · this tile', 'Original pixels, 1×', `${base}_tile_00.png`, 'png'), I('Sheet + JSON', 'Variations in a grid', `${base}_all.png`, 'sheet'), I('PixelLab ZIP', "PixelLab's own export", `${base}_pixellab.zip`, 'pl')];
  return [I('PNG', 'Original pixels, 1×', `${base}.png`, 'png')];
}
const curV = () => ({ a: V.a, anims: V.anims, ai: V.ai, dir: V.dir, frame: V.frame });
function cardV(c) { const a = c.a, pa = pickAnim(a), ds = Object.keys(a.directions || {}); return { a, anims: a.animations || [], ai: pa ? a.animations.indexOf(pa) + 1 : 0, dir: ds.includes('south') ? 'south' : ds[0], frame: 0 }; }
function copyBtn(what, label) { return `<button class="ibtn copy" data-act="copy" data-what="${what}" aria-label="${label}" title="${label}">${ic('copy', 'sm')}</button>`; }
function infoHTML() {
  const c = V.c, a = V.a, m = a.meta;
  const kicker = [c.label, c.type === 'character' ? (m.state_name || 'Base') : m.state_name].filter(Boolean).join(' · ');
  const fl = sortedFolders().filter(f => inFolder(f, c));
  const isPrompt = /^(character|object|map_object|ui_asset)$/.test(a.type), text = a.type === 'tile_isometric' ? m.description : a.prompt;
  const promptSec = text && !a.type.startsWith('tileset') && a.type !== 'map' ? `<section class="sec"><h2>${isPrompt ? 'Prompt' : 'Description'}</h2><div class="prompt"><span>${esc(text)}</span>${/\.\.\.$/.test(text) ? ' <span class="faint">(shortened by PixelLab)</span>' : ''}${copyBtn('prompt', isPrompt ? 'Copy prompt' : 'Copy description')}</div></section>` : '';
  const items = dlItems(curV());
  return `<div class="info-head"><p class="kicker">${esc(kicker)}</p><h1 class="d-title" id="d-title" tabindex="-1">${esc(c.title)}</h1><p class="facts">${esc(facts(c))}</p>
      ${fl.length ? `<div class="folder-chips" role="list" aria-label="In folders">${fl.map(f => `<a class="fchip" role="listitem" href="#/folder/${f.id}">${ic('folder', 'sm')}${esc(f.name)}</a>`).join('')}</div>` : ''}
      <div class="actions not-phone">${actionsHTML()}</div></div>
    <div class="info-side"><section class="sec"><h2>Download</h2><div class="dl-tiles">${items.map((it, i) => `<button class="dl-tile${i ? '' : ' default'}" data-act="dl-item" data-i="${i}"><b>${esc(it.t)}</b><span>${esc(it.d)}</span></button>`).join('')}</div>
      <button class="linkbtn more-opts" data-act="more-options">More options…</button></section></div>
    ${promptSec}<section class="sec"><h2>Details</h2><dl class="fields">${fieldsHTML(c)}</dl></section>${pixellabHTML()}
    <details class="sec tech"><summary>Technical details</summary><dl class="fields">
      <dt>Asset ID</dt><dd><span class="mono">${esc(a.id.slice(0, 4) + '…' + a.id.slice(-2))}</span><p class="warn-text">Anyone with this ID can download this asset without signing in. Only share it with tools you trust.</p><button class="btn sm" data-act="copy" data-what="id">${ic('copy', 'sm')}Copy asset ID</button></dd>
      <dt>Source</dt><dd>${a.source === 'mcp' ? 'MCP' : 'REST'}</dd><dt>Status</dt><dd>Completed</dd><dt>Last synced</dt><dd>Just now</dd>
      ${a.type === 'creator_image' ? `<dt>Frames loaded</dt><dd>${(a.frames || [1]).length} of ${(a.frames || [1]).length}</dd>` : ''}${S.remember ? '<dt>Saved on this device</dt><dd>Yes</dd>' : ''}</dl></details>`;
}
function fieldsHTML(c) {
  const a = V.a, m = a.meta, out = [];
  const add = (k, v, note) => { if (v != null && v !== '') out.push(`<dt>${k}</dt><dd>${v}${note ? `<span class="note">${note}</span>` : ''}</dd>`); };
  const px = (w, h) => `${w} × ${h} px`, created = () => add('Created', fmtFull(a.createdAt));
  const style = s => s ? ['outline', 'shading', 'detail'].filter(k => s[k]).map(k => `${cap(k)}: ${esc(cap(s[k]))}`).join('<br>') : null;
  const dirs = ks => { ks = ks.filter(k => k !== 'unknown').sort((x, y) => API_ORDER.indexOf(x) - API_ORDER.indexOf(y)); return ks.length <= 1 ? '1 (single view)' : `${ks.length} · ${ks.map(k => SHORT[k]).join(', ')}`; };
  const tags = t => t && t.length ? `<span class="tags">${t.map(x => `<button class="tag" data-act="tag" data-tag="${esc(x)}">#${esc(x)}</button>`).join('')}</span>` : null;
  const ov = S.fps[fpsKey()], playback = () => add('Playback', ov ? `${V.fps} fps (your setting) · <button class="linkbtn accent" data-act="fps-reset">Reset</button>` : `${V.fps} fps (default)`, TIMING);
  const animRows = () => V.anims.length ? `<span class="anim-rows">${V.anims.map((x, i) => `<button class="anim-row" data-act="anim" data-ai="${i + 1}">${esc(x.name)} · ${x.frameCount} frames · ${plural(Object.keys(x.frames).filter(k => k !== 'unknown').length || 1, 'direction')}</button>`).join('')}</span>` : null;
  switch (a.type) {
    case 'character':
      add('State', `${m.state_name ? esc(cap(m.state_name)) : 'Base'}${c.states.length > 1 ? ` · ${c.states.length} states` : ''}`); add('Canvas', px(a.width, a.height));
      add('Directions', dirs(Object.keys(a.directions))); add('View', esc(cap(m.view))); add('Animations', animRows() || 'None yet');
      add('Style', style(m.style_settings)); add('Template', esc(cap(m.template_id))); add('Tags', tags(a.tags)); created();
      if (a.updatedAt && a.updatedAt !== a.createdAt) add('Updated', fmtFull(a.updatedAt));
      if (V.anims.length) playback();
      add('Portrait & voice', `Not in PixelLab's public API · ${plLink('View in PixelLab', 'linkbtn accent')}`); break;
    case 'object':
      add('State', m.state_name && esc(cap(m.state_name))); add('Canvas', px(a.width, a.height)); add('Directions', dirs(Object.keys(a.directions)));
      add('View', esc(cap(m.view))); add('Animations', animRows()); add('Style', style(m.style_settings)); add('Tags', tags(a.tags)); created();
      if (V.anims.length) playback(); break;
    case 'map_object': add('Canvas', px(a.width, a.height)); add('View', esc(cap(m.view))); created(); break;
    case 'creator_image': {
      const n = a.frames ? a.frames.length : 1;
      add('Frame size', px(a.width, a.height)); if (n > 1) add('Frames', n); add('Created', fmtDay(a.createdAt));
      add('Made on', /^gallery:\d{13}$/.test(m.ref) ? 'PixelLab website' : 'PixelLab API'); if (n > 1) playback(); break;
    }
    case 'tileset_topdown':
      add('Terrains', `${esc(cap(m.lower_description))} → ${esc(cap(m.upper_description))} ${copyBtn('terrains', 'Copy terrains')}`); add('Transition', esc(cap(m.transition_description)));
      add('Tile size', px(a.tileSize, a.tileSize)); add('Tiles', `${m.total_tiles} · ${a.grid.cols} × ${a.grid.rows} sheet`); add('View', esc(cap(m.view)));
      add('Transition size', m.transition_size); add('Style', style(m.style_settings)); created(); break;
    case 'tileset_sidescroller':
      add('Terrain', `${esc(cap(m.lower_description))} ${copyBtn('terrains', 'Copy terrain')}`); add('Top edge', esc(cap(m.transition_description)));
      add('Tile size', px(a.tileSize, a.tileSize)); add('Tiles', m.total_tiles); add('View', 'Side (platformer)'); created(); break;
    case 'tile_isometric': add('Size', `${m.size} px`); add('Shape', cap(m.tile_shape)); add('Seed', `${m.seed} ${copyBtn('seed', 'Copy seed')}`); created(); break;
    case 'tiles_pro':
      add('Kind', cap(m.kind)); add('Tile type', m.tile_type === 'square_topdown' ? 'Square top-down' : cap(String(m.tile_type).replace(/_/g, ' ')));
      add('Tile size', px(a.tileSize, a.tileSize)); add('Variations', m.n_tiles); add('View', esc(cap(m.tile_view))); add('Seed', `${m.seed} ${copyBtn('seed', 'Copy seed')}`); created(); break;
    case 'map':
      add('Size', `${a.grid.cols} × ${a.grid.rows} cells · ${px(a.width, a.height)}`); add('Tile size', `${m.tile_size} px`); add('Terrains', m.terrains.join(', '));
      add('Painted cells', nf(m.painted_cells));
      add('Placed objects', `<details><summary>${m.placements}</summary>Ruined Apartment Block · cell 30, 6 · 192 × 192 · objects<br>Wooden Staircase · cell 12, 20 · 48 × 48 · objects<br>Stone Steps · cell 40, 22 · 16 × 48 · objects</details>`); break;
    case 'ui_asset': add('Size', px(a.width, a.height)); created(); add('Pieces', "PixelLab doesn't share the individual UI pieces."); break;
  }
  return out.join('');
}
function pixellabHTML() {
  const t = V.a.type, links = ['Open in PixelLab'];
  if (t === 'character' || t === 'object') links.push('Animate in PixelLab', 'New state in PixelLab');
  if (t === 'creator_image') links.push('Edit in PixelLab', 'Animate in PixelLab', 'Rotate in PixelLab');
  const hint = t === 'creator_image' ? 'Pro tools may need a paid plan.' : /^tile|^map$/.test(t) ? 'May need a paid PixelLab plan.' : '';
  return `<section class="sec"><h2>PixelLab</h2><ul class="links">${links.map(l => `<li>${plLink(l, '')}</li>`).join('')}</ul>${hint ? `<p class="hint">${hint}</p>` : ''}</section>`;
}

// ---- stage: art element, integer zoom, pan, playback
function mountStage() {
  const area = $('#art-area'), a = V.a; if (!area) return;
  V.token = {};
  if (V.kind === 'frames') {
    const cv = document.createElement('canvas'); cv.className = 'art stage-art'; cv.width = a.width; cv.height = a.height;
    V.el = cv; V.ctx = cv.getContext('2d'); V.artW = a.width; V.artH = a.height; area.append(cv); loadFrames();
  } else if (V.kind === 'sheet' || V.kind === 'vars') {
    const g = a.grid, n = g.cols * g.rows, label = i => a.type === 'tileset_topdown' ? `wang_${i}` : `tile_${i}`;
    if (V.kind === 'sheet') {
      const w = document.createElement('div'); w.className = 'sheet-wrap stage-art';
      w.innerHTML = `<img src="${esc(a.sheet)}" alt="" draggable="false"><div class="tile-grid${V.grid ? ' on' : ''}" style="grid-template:repeat(${g.rows},1fr)/repeat(${g.cols},1fr)">${Array.from({ length: n }, (_, i) => `<span data-tile="${i}">${label(i)}</span>`).join('')}</div>`;
      V.el = w; V.artW = a.width; V.artH = a.height;
    } else {
      const w = document.createElement('div'); w.className = 'vars stage-art' + (V.grid ? ' on' : ''); V.el = w;
      const sheet = img(a.sheet), ts = a.tileSize;
      for (let i = 0; i < n; i++) { const cv = document.createElement('canvas'); cv.width = cv.height = ts; cv.dataset.tile = i; cv.title = label(i); w.append(cv); }
      const draw = () => { if (!V || V.el !== w) return; [...w.children].forEach((cv, i) => { const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.drawImage(sheet, (i % g.cols) * ts, Math.floor(i / g.cols) * ts, ts, ts, 0, 0, ts, ts); }); };
      sheet.naturalWidth ? draw() : sheet.addEventListener('load', draw, { once: true });
    }
    area.append(V.el);
  } else {
    const im = document.createElement('img'); im.className = 'art stage-art'; im.src = a.thumb; im.alt = ''; im.draggable = false;
    V.el = im; V.artW = a.width; V.artH = a.height; area.append(im);
  }
  layoutStage();
  stageRO = new ResizeObserver(() => layoutStage()); stageRO.observe(area);
}
function loadFrames() {
  stopPlayer();
  const list = srcs(), token = V.token; V.imgs = list.map(img); V.n = list.length; V.frame = Math.min(V.frame, V.n - 1);
  const check = () => {
    if (!V || V.token !== token) return;
    const d = V.imgs.filter(i => i.naturalWidth).length;
    setLoading(d < V.n ? `Loading frames ${d}/${V.n}` : null);
    if (d < V.n) return;
    const f0 = V.imgs[0];
    if (V.el.width !== f0.naturalWidth || V.el.height !== f0.naturalHeight) { V.el.width = f0.naturalWidth; V.el.height = f0.naturalHeight; V.artW = f0.naturalWidth; V.artH = f0.naturalHeight; layoutStage(); }
    drawFrame(); if (V.playing && V.n > 1) startPlayer();
  };
  V.imgs.forEach(i => { if (!i.naturalWidth) i.addEventListener('load', check, { once: true }); });
  check();
}
function drawFrame() {
  const im = V && V.imgs && V.imgs[V.frame]; if (!im || !im.naturalWidth || !V.ctx) return;
  V.ctx.imageSmoothingEnabled = false; V.ctx.clearRect(0, 0, V.el.width, V.el.height); V.ctx.drawImage(im, 0, 0);
  $$('[data-role=scrub]').forEach(s => { s.value = V.frame + 1; s.setAttribute('aria-valuetext', `Frame ${V.frame + 1} of ${V.n}`); });
  $$('[data-role=fr]').forEach(s => { s.textContent = `${V.frame + 1} / ${V.n}`; });
}
function setLoading(text) {
  $$('[data-role=play]').forEach(b => {
    b.classList.toggle('loading', !!text);
    b.innerHTML = text ? esc(text) : ic(V.playing ? 'pause' : 'play'); b.setAttribute('aria-label', text || (V.playing ? 'Pause' : 'Play'));
  });
}
function startPlayer() {
  stopPlayer(); if (!V || V.n < 2) return;
  const n = V.n;
  V.player = PixelTicker.player(Array(n).fill(1000 / V.fps), i => {
    if (!V.loop && i === 0 && V.frame === n - 1) { pause(); return; }       // loop off: stop on the last frame
    V.frame = i; drawFrame();
  });
  V.player.seek(V.frame); V.player.play();
}
function stopPlayer() { if (V && V.player) { V.player.stop(); V.player = null; } }
function play() { if (!V || V.n < 2) return; if (!V.loop && V.frame === V.n - 1) V.frame = 0; V.playing = true; startPlayer(); setLoading(null); idleArm(); }
function pause() { if (!V) return; V.playing = false; stopPlayer(); setLoading(null); const ar = $('#art-area'); ar && ar.setAttribute('aria-label', artLabel()); idleArm(); }
const togglePlay = () => V && (V.playing ? pause() : play());
function stepFrame(d) { if (!V || V.n < 2) return; pause(); V.frame = (V.frame + d + V.n) % V.n; drawFrame(); }
function layoutStage() {
  const area = $('#art-area'); if (!V || !V.el || !area) return;
  const W = area.clientWidth, H = area.clientHeight, dpr = devicePixelRatio || 1; if (!W || !H) return;
  let cols = 1, rows = 1, gap = 0, aw = V.artW, ah = V.artH;
  if (V.kind === 'vars') { cols = V.a.grid.cols; rows = V.a.grid.rows; gap = 8; aw = V.a.tileSize * cols; ah = V.a.tileSize * rows; }
  const fit = integerScale(aw, ah, W - gap * (cols - 1), H - gap * (rows - 1), dpr);
  const k = V.zoom === 'fit' ? fit.scale : Math.max(1, Math.round(V.zoom * dpr)), smooth = V.zoom === 'fit' && fit.smooth;
  V.k = k;
  const cw = aw * k / dpr + gap * (cols - 1), ch = ah * k / dpr + gap * (rows - 1);
  const mx = Math.max(0, (cw - W) / 2), my = Math.max(0, (ch - H) / 2);
  V.panX = clamp(V.panX, -mx, mx); V.panY = clamp(V.panY, -my, my);
  const snap = v => Math.round(v * dpr) / dpr, el = V.el;                   // whole device pixels, never a transform
  el.style.left = snap((W - cw) / 2 + V.panX + V.swipe) + 'px'; el.style.top = snap((H - ch) / 2 + V.panY) + 'px';
  if (V.kind === 'vars') { const t = V.a.tileSize * k / dpr; el.style.gridTemplateColumns = `repeat(${cols}, ${t}px)`; [...el.children].forEach(cv => { cv.style.width = cv.style.height = t + 'px'; }); }
  else { el.style.width = cw + 'px'; el.style.height = ch + 'px'; }
  el.classList.toggle('smooth', smooth); const si = el.querySelector && el.querySelector('img'); if (si) si.classList.toggle('smooth', smooth);
  if (V.kind === 'sheet') el.querySelector('.tile-grid').style.fontSize = V.a.tileSize * k / dpr >= 48 ? '' : '0';
  area.classList.toggle('pannable', mx > 0 || my > 0);
  const x = k / dpr, txt = V.zoom === 'fit' ? (smooth ? `Fit · ${Math.round(x * 100)}%` : `Fit · ${Math.round(x * 100) / 100}×`) : `${V.zoom}×`;
  $$('[data-role=zoom]').forEach(e => { e.textContent = txt; });
}
function setZoom(z, ax, ay) {
  if (z === 'fit') { V.zoom = 'fit'; V.panX = V.panY = 0; }
  else { const f = Math.max(1, Math.round(z * (devicePixelRatio || 1))) / (V.k || 1); ax = ax || 0; ay = ay || 0; V.panX = ax - (ax - V.panX) * f; V.panY = ay - (ay - V.panY) * f; V.zoom = z; }
  layoutStage();
}
function zoomStep(d, ax, ay) {
  const cur = V.k / (devicePixelRatio || 1);
  const next = d > 0 ? ZOOMS.find(m => m > cur + 0.01) : ZOOMS.slice().reverse().find(m => m < cur - 0.01);
  if (next != null) setZoom(next, ax, ay); else if (d < 0) setZoom('fit');
}
function tileInfo(i) {
  const a = V.a, g = a.grid, ts = a.tileSize, x = (i % g.cols) * ts, y = Math.floor(i / g.cols) * ts;
  // ponytail: corner/rule bits are derived from the tile index; the sample data carries no per-tile metadata.
  if (a.type === 'tileset_topdown') return `wang_${i} · NW ${i & 8 ? 'upper' : 'lower'}, NE ${i & 4 ? 'upper' : 'lower'}, SW ${i & 2 ? 'upper' : 'lower'}, SE ${i & 1 ? 'upper' : 'lower'} · x ${x}, y ${y}`;
  if (a.type === 'tileset_sidescroller') return `tile_${i} · N ${i & 1}, E ${i >> 1 & 1}, S ${i >> 2 & 1}, W ${i >> 3 & 1} · x ${x}, y ${y}`;
  return `tile_${i} · rule bits ${['N', 'E', 'S', 'W'].filter((_, b) => i >> b & 1).join(', ') || 'none'}`;
}
function bindStage() {
  const area = $('#art-area'); if (!area) return;
  const pts = new Map(); let st = null, pinch = 0, lastTap = 0;
  const rel = e => { const r = area.getBoundingClientRect(); return [e.clientX - r.left - r.width / 2, e.clientY - r.top - r.height / 2]; };
  area.addEventListener('pointerdown', e => {
    if (e.button > 0) return; area.setPointerCapture(e.pointerId); pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pts.size === 2) { const [p, q] = [...pts.values()]; pinch = Math.hypot(p[0] - q[0], p[1] - q[1]); st = null; return; }
    st = { x: e.clientX, y: e.clientY, px: V.panX, py: V.panY, type: e.pointerType, moved: false, pan: area.classList.contains('pannable') };
    if (st.pan) area.classList.add('dragging');
  });
  area.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return; pts.set(e.pointerId, [e.clientX, e.clientY]);
    if (pinch && pts.size === 2) { const [p, q] = [...pts.values()], d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d / pinch > 1.25 || d / pinch < 0.8) { zoomStep(d > pinch ? 1 : -1); pinch = d; } return; }
    if (!st) return; const dx = e.clientX - st.x, dy = e.clientY - st.y; if (Math.abs(dx) + Math.abs(dy) > 6) st.moved = true;
    if (st.pan) { V.panX = st.px + dx; V.panY = st.py + dy; layoutStage(); }
    else if (st.type !== 'mouse' && V.zoom === 'fit') { V.swipe = Math.abs(dx) > Math.abs(dy) ? dx : 0; layoutStage(); }
  });
  const end = e => {
    pts.delete(e.pointerId); area.classList.remove('dragging'); if (pts.size < 2) pinch = 0;
    if (!st) return; const s = st, dx = e.clientX - s.x, dy = e.clientY - s.y; st = null; V.swipe = 0;
    if (!s.pan && s.type !== 'mouse' && V.zoom === 'fit') {                 // swipe ←/→ navigates, ↓ closes (02 §9.1)
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) { navStep(dx < 0 ? 1 : -1); return; }
      if (dy > 80 && dy > Math.abs(dx)) { goBack(); return; }
      layoutStage();
    }
    if (!s.moved && e.type === 'pointerup') {
      const now = performance.now();
      if (now - lastTap < 300) { lastTap = 0; const [ax, ay] = rel(e); if (V.zoom === 'fit') { const cur = V.k / (devicePixelRatio || 1); setZoom(ZOOMS.find(m => m > cur + 0.01) || 16, ax, ay); } else setZoom('fit'); }
      else { lastTap = now; if (s.type !== 'mouse' && ff() === 'compact') { const sg = $('#stage'); sg.classList.contains('idle') ? idleArm() : sg.classList.add('idle'); } }
    }
  };
  area.addEventListener('pointerup', end); area.addEventListener('pointercancel', end);
  area.addEventListener('wheel', e => { e.preventDefault(); const now = performance.now(); if (now - (V.wheelT || 0) < 90) return; V.wheelT = now; const [ax, ay] = rel(e); zoomStep(e.deltaY < 0 ? 1 : -1, ax, ay); }, { passive: false });
  area.addEventListener('pointerover', e => { const t = e.target.closest('[data-tile]'); const ti = $('#tile-info'); if (t && ti) ti.textContent = tileInfo(+t.dataset.tile); });
  area.addEventListener('pointerleave', () => { const ti = $('#tile-info'); if (ti) ti.textContent = ''; });
  const sg = $('#stage'); ['pointermove', 'pointerdown', 'keydown'].forEach(t => sg.addEventListener(t, idleArm));
}
// Compact-height immersive capsules fade after 3 s while playing (never under reduced motion or with focus inside).
function idleArm() {
  clearTimeout(idleT); const sg = $('#stage'); if (!sg) return; sg.classList.remove('idle');
  if (V && V.playing && !reduced() && ff() === 'compact') idleT = setTimeout(() => sg.classList.add('idle'), 3000);
}
function navStep(d) {
  const keys = S.ctx.keys, i = keys.indexOf(V.c.key), k = keys[i + d]; if (!k) return;
  history.replaceState(null, '', detailHash(S.r, k)); onRoute();
}
function goBack() { if (S.fromList) history.back(); else go(S.r.parent, true); }
function rotateDir(d) { const av = CW.filter(x => dirsOf().includes(x)); if (av.length < 2) return; V.dir = av[(av.indexOf(V.dir) + d + av.length) % av.length]; refreshDetail(); }
function setBg(bg) {
  V.bg = S.viewBg = bg; $('#stage').dataset.bg = bg;
  $$('.swatch').forEach(s => { const on = s.dataset.bg === bg; s.setAttribute('aria-checked', on); s.tabIndex = on ? 0 : -1; });
  const p = $('[data-act="bg-pop"]'); if (p) p.innerHTML = ic('contrast', 'sm') + BGS.find(b => b[0] === bg)[1];
}
function fullscreen() { const sg = $('#stage'); if (!document.fullscreenEnabled || !sg) return; document.fullscreenElement ? document.exitFullscreen() : sg.requestFullscreen().catch(() => {}); }
function quickDownload(it) {
  if (S.exp) { toast('An export is already running. Wait for it to finish or cancel it.'); return; }
  if (it.k === 'png' || it.k === 'gif') { readyOr(it.f); return; }
  runExport(it.k === 'frames' ? 24 : 3, 1, it.f);
}
function readyOr(file) {
  if (!isCoarse()) { toast(`Saved ${esc(file)}`); return; }
  const d = openDialog({ title: 'Your file is ready', cls: 'sm', body: `<p class="fname">${esc(file)}</p>`, foot: '<button class="btn" data-close data-x="dl">Download file</button><button class="btn primary" data-close data-x="share">Share or save…</button>' });
  d.addEventListener('click', e => { const b = e.target.closest('[data-x]'); if (b) toast(b.dataset.x === 'share' ? 'Mockup: the share sheet opens here.' : `Saved ${esc(file)}`); });
}

// ============================================================ export (02 §7.6, §7.7) — faked progress
function runExport(totalFiles, nAssets, name) {
  if (S.exp) { toast('An export is already running. Wait for it to finish or cancel it.'); return; }
  const fail = S.flags.exportFail ? 1 : 0, chip = document.createElement('div');
  chip.className = 'pchip'; chip.innerHTML = '<span data-t></span><button>Cancel</button><i></i>';
  $('#stack').prepend(chip);
  let done = 0, q = 0; const mb = totalFiles * 0.09;
  const upd = () => { chip.querySelector('[data-t]').textContent = `Exporting ${nf(done)} / ${nf(totalFiles)} · ${Math.round(mb * done / totalFiles)} MB`; chip.querySelector('i').style.width = (done / totalFiles * 100) + '%'; };
  const stop = () => { clearInterval(S.exp.timer); chip.remove(); S.exp = null; window.onbeforeunload = null; };
  S.exp = { timer: setInterval(() => {
    done = Math.min(totalFiles, done + Math.max(1, Math.ceil(totalFiles / 20))); upd();
    const nq = Math.floor(done / totalFiles * 4); if (nq > q && nq < 4) { q = nq; announce(`Export ${q * 25}% done`); }
    if (done < totalFiles) return;
    stop();
    if (fail && nAssets > 1) { announce(`Export finished. ${fail} item failed.`); toast(`Exported ${nAssets - fail} assets. ${fail} couldn't be exported.`, { label: 'View report', run: openReport }); }
    else { announce('Export finished.'); nAssets > 1 ? toast(`Exported ${plural(nAssets, 'asset')}.`) : readyOr(name); }
  }, 180) };
  window.onbeforeunload = e => { e.preventDefault(); };
  chip.querySelector('button').onclick = () => { stop(); toast('Export canceled. Nothing was saved.'); };
  upd(); announce(`Exporting ${plural(nAssets, 'asset')}`);
}
function openReport() {
  const d = openDialog({ title: 'Export report', sub: "1 asset couldn't be exported. Everything else is in the archive.", cls: 'sm',
    body: '<ul class="report"><li><b>Crimson Lance</b> · Object<span>Not found in PixelLab. It may have been deleted.</span></li></ul>',
    foot: '<button class="btn" data-close>Close</button><button class="btn primary" data-close data-retry>Retry failed</button>' });
  $('[data-retry]', d).addEventListener('click', () => setTimeout(() => runExport(3, 1, 'vitrine-retry-' + today() + '.zip'), 0));
}
function exportFiles(c, p, statesAll) {
  const a = c.a, states = statesAll ? c.states.length : 1, dirs = Math.max(1, Object.keys(a.directions || {}).length);
  const frames = (a.animations || []).reduce((s, x) => s + x.frameCount * Object.keys(x.frames).length, 0);
  let n = 1;                                                                 // metadata.json
  if (p.game) n += /character|object/.test(a.type) ? 2 * states : a.type === 'tiles_pro' ? a.meta.n_tiles + 1 : a.type.startsWith('tileset') || (a.frames && a.frames.length > 1) ? 2 : 1;
  if (p.frames) n += /character|object/.test(a.type) ? (dirs + frames) * states : a.frames ? a.frames.length : a.type === 'tiles_pro' ? a.meta.n_tiles : 1;
  if (p.gifs) n += /character|object/.test(a.type) ? Math.max(1, (a.animations || []).reduce((s, x) => s + Object.keys(x.frames).length, 0)) * states : 1;
  return n;
}
function breakdown(cards) {
  const parts = [];
  for (const [id] of CHIPS.slice(1, -1)) {
    const cs = cards.filter(c => c.chip === id); if (!cs.length) continue;
    const st = cs.reduce((s, c) => s + c.states.length, 0);
    parts.push(`${cs.length} ${cs.length === 1 ? NOUN[id][0] : NOUN[id][1]}${id === 'characters' && st > cs.length ? ` (${st} states)` : ''}`);
  }
  return parts.join(' · ');
}
function openExportMulti(cards, scope) {
  if (S.exp) { toast('An export is already running. Wait for it to finish or cancel it.'); return; }
  if (!cards.length) return;
  const P = store.get('exp-multi', { game: true, frames: false, gifs: false, states: 'all' });
  const tile = (k, t, d) => `<button class="ptile" role="checkbox" aria-checked="${!!P[k]}" data-p="${k}"><b>${t}</b><span>${d}</span><span class="tick">${ic('check')}</span></button>`;
  const hasChars = cards.some(c => c.states.length > 1 || c.type === 'character');
  const file = `vitrine-${scope}-${today()}.zip`;
  const d = openDialog({ title: `Export ${plural(cards.length, 'asset')}`, sub: esc(breakdown(cards)), cls: 'wide',
    body: `<div class="opt-group"><div class="oh">Presets</div><div class="ptiles" role="group" aria-label="Presets">${tile('game', 'Game-ready', 'Sheets + JSON, tilesets with metadata, PNG for stills')}${tile('frames', 'Frames', 'Every frame and still as PNG')}${tile('gifs', 'GIFs', 'One per animation and direction')}</div></div>
      ${hasChars ? `<div class="opt-group"><div class="oh" id="cs-l">Character states</div><div class="radios" role="radiogroup" aria-labelledby="cs-l"><button class="pill" role="radio" data-st="all" aria-checked="${P.states === 'all'}">All states</button><button class="pill" role="radio" data-st="base" aria-checked="${P.states === 'base'}">Base only</button></div></div>` : ''}
      ${advancedHTML(true)}<p class="estimate" data-est></p><p class="fname">${esc(file)}</p>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" data-go>Export</button>' });
  const total = () => cards.reduce((s, c) => s + exportFiles(c, P, P.states === 'all'), 1);
  const upd = () => { const n = total(); $('[data-est]', d).textContent = `${nf(n)} files · about ${Math.max(1, Math.round(n * 0.09))} MB`; $('[data-go]', d).disabled = !(P.game || P.frames || P.gifs); };
  d.addEventListener('click', e => {
    const t = e.target.closest('[data-p]'); if (t) { P[t.dataset.p] = !P[t.dataset.p]; t.setAttribute('aria-checked', P[t.dataset.p]); upd(); }
    const s = e.target.closest('[data-st]'); if (s) { P.states = s.dataset.st; $$('[data-st]', d).forEach(b => b.setAttribute('aria-checked', b === s)); upd(); }
    if (e.target.closest('[data-go]')) { store.set('exp-multi', P); const n = total(); d.close(); runExport(n, cards.length, file); }
  });
  upd();
}
function advancedHTML(multi) {
  const sel = (label, opts) => `<label for="adv-${slug(label)}">${label}</label><select id="adv-${slug(label)}">${opts.map(o => `<option>${o}</option>`).join('')}</select>`;
  return `<details class="adv"><summary>Advanced</summary><div class="adv-grid">${sel('Scale', ['Auto (GIF)', '1×', '2×', '4×', '8×'])}${sel('GIF background', ['Transparent', 'Current backdrop'])}${sel('GIF loop', ['Forever', 'Once'])}
    <span>Trim empty space (GIF)</span><label class="switch"><input type="checkbox" role="switch" checked aria-label="Trim empty space (GIF)"></label>${sel('Sheet spacing', ['0 px', '1 px', '2 px'])}
    <span>Include metadata.json</span><label class="switch"><input type="checkbox" role="switch" checked aria-label="Include metadata.json"></label></div>${multi ? '' : ''}</details>`;
}
function openExportSingle() {
  if (S.exp) { toast('An export is already running. Wait for it to finish or cancel it.'); return; }
  const items = dlItems(curV()), anims = V.anims.length; let sel = 0, scope = 'current', dirs = 'current';
  const d = openDialog({ title: `Export ${esc(V.c.title)}`, cls: 'wide',
    body: `<div class="opt-group"><div class="oh" id="pre-l">Presets</div><div class="ptiles" role="radiogroup" aria-labelledby="pre-l">${items.map((it, i) => `<button class="ptile" role="radio" aria-checked="${i === 0}" tabindex="${i ? -1 : 0}" data-i="${i}"><b>${esc(it.t)}</b><span>${esc(it.d)}</span><span class="tick">${ic('check')}</span></button>`).join('')}</div></div>
      ${anims ? `<div class="opt-group" data-row="anim"><div class="oh" id="an-l">Animation</div><div class="radios" role="radiogroup" aria-labelledby="an-l">${[['current', 'This animation'], ['all', 'All animations'], ['everything', 'Everything']].map(([v, l], i) => `<button class="pill" role="radio" data-scope="${v}" aria-checked="${!i}">${l}</button>`).join('')}</div></div>` : ''}
      ${compassOn() ? `<div class="opt-group" data-row="dirs"><div class="oh" id="dr-l">Directions</div><div class="radios" role="radiogroup" aria-labelledby="dr-l"><button class="pill" role="radio" data-dirs="current" aria-checked="true">This direction</button><button class="pill" role="radio" data-dirs="all">All directions</button></div></div>` : ''}
      ${advancedHTML(false)}<p class="estimate" data-est></p><p class="fname" data-fn></p>`,
    foot: '<button class="btn" data-close>Cancel</button><button class="btn primary" data-go>Export</button>' });
  const nd = Math.max(1, dirsOf().length);
  const files = () => { const it = items[sel]; if (it.k === 'gif') return dirs === 'all' ? nd : 1; if (it.k === 'frames') return srcs().length * (scope === 'current' ? 1 : nd); if (it.k === 'sheet') return 2; return 1; };
  const fname = () => { const it = items[sel]; return it.k === 'gif' && dirs === 'all' ? it.f.replace(/_[a-z-]+(@\d+x)?\.gif$/, '_all-directions.zip') : it.f; };
  const upd = () => {
    const it = items[sel], gr = $('[data-row="dirs"]', d), ar = $('[data-row="anim"]', d);
    if (gr) gr.hidden = it.k !== 'gif'; if (ar) ar.hidden = !(it.k === 'sheet' || it.k === 'frames');
    $('[data-est]', d).textContent = `${plural(files(), 'file')} · about ${(files() * 0.04 + 0.02).toFixed(1)} MB`; $('[data-fn]', d).textContent = fname();
  };
  d.addEventListener('click', e => {
    const t = e.target.closest('.ptile'); if (t) { sel = +t.dataset.i; $$('.ptile', d).forEach(b => { b.setAttribute('aria-checked', b === t); b.tabIndex = b === t ? 0 : -1; }); upd(); }
    const s = e.target.closest('[data-scope]'); if (s) { scope = s.dataset.scope; $$('[data-scope]', d).forEach(b => b.setAttribute('aria-checked', b === s)); upd(); }
    const r = e.target.closest('[data-dirs]'); if (r) { dirs = r.dataset.dirs; $$('[data-dirs]', d).forEach(b => b.setAttribute('aria-checked', b === r)); upd(); }
    if (e.target.closest('[data-go]')) { const f = fname(), n = files(); d.close(); n > 1 ? runExport(n, 1, f) : readyOr(f); }
  });
  upd();
}
function exportScope(r) {
  if (r.view === 'favorites') return 'favorites';
  if (r.view === 'folder') { const f = folderById(r.id); return 'folder-' + slug(f ? f.name : 'folder'); }
  return r.chip && r.chip !== 'all' ? r.chip : 'library';
}

// ============================================================ settings, help, connect
const REM_OFF = "Kept in this tab only. You'll paste it again in a new tab.";
const REM_ON = "Saved in this browser so you don't need to paste it again. Anyone using this browser profile could use it, so don't turn this on for shared computers.";
const STATES = [['empty', 'Empty library'], ['noresults', 'No results (“dragon”)'], ['offline', 'Offline, cached'], ['offlineEmpty', 'Offline, nothing saved'], ['auth', 'Token stopped working (401)'], ['cors', 'CORS blocked'],
  ['rate', 'Rate limited'], ['partial', 'Partial sync'], ['gate', 'Images gated'], ['exportFail', 'Export partial failure'], ['emptyFav', 'Empty favorites'], ['emptyFolder', 'Empty folder'], ['tip', 'Backup tip'], ['welcome', 'Welcome back (Connect)'], ['sync', 'Replay first sync'], ['reset', 'Reset states']];
function applyTheme() { const t = S.theme; t === 'system' ? document.documentElement.removeAttribute('data-theme') : document.documentElement.setAttribute('data-theme', t); }
function openSettings() {
  const themeSeg = `<div class="seg" role="radiogroup" aria-label="Theme">${[['system', 'System', 'monitor'], ['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']].map(([v, l, i]) => `<button role="radio" data-s="theme" data-v="${v}" aria-checked="${S.theme === v}">${ic(i, 'sm')} ${l}</button>`).join('')}</div>`;
  const body = `<section class="set-sec"><h3>PixelLab connection</h3>
      <div class="set-row"><span class="grow">Connected · ${S.sample ? 'sample library' : 'token ending ••••'}<span class="sub">Tier 1 plan · 1,980 generations left · 412 credits (sample values)</span></span></div>
      <label class="switch set-row"><input type="checkbox" role="switch" data-s="remember"${S.remember ? ' checked' : ''}><span class="grow">Remember on this device<span class="sub" data-rem>${S.remember ? REM_ON : REM_OFF}</span></span></label>
      <div class="set-row"><button class="btn" data-s="change">${ic('key-round', 'sm')}Change token</button><button class="btn" data-s="forget">Forget token</button></div>
      <div class="set-row" data-change hidden><input class="field grow" type="password" autocomplete="off" placeholder="Paste your token" aria-label="New PixelLab API token" style="flex:1 1 200px"><button class="btn" data-s="test">Test</button><p class="err" data-change-err hidden style="width:100%"></p></div>
      <div class="set-row">${plLink('Need to revoke this token? Generate a new one in your PixelLab account', 'linkbtn accent')}</div></section>
    <section class="set-sec"><h3>Library</h3>
      <div class="set-row"><button class="btn" data-s="sync">${ic('refresh-cw', 'sm')}Sync now</button><span class="faint">Last synced just now</span></div>
      <label class="switch set-row"><input type="checkbox" role="switch" data-s="animate"${S.animate ? ' checked' : ''}><span class="grow">Animate previews<span class="sub">Play animated assets in the library. Hover or focus always plays one.</span></span></label>
      <div class="set-row"><span class="grow">Grid size</span>${sizeSeg('set-size')}</div>
      <div class="set-row"><label class="grow" for="set-bg">Default viewer backdrop</label><select id="set-bg" data-s="bg" class="field" style="width:auto;height:36px">${BGS.map(([v, l]) => `<option value="${v}"${S.bgDefault === v ? ' selected' : ''}>${l}</option>`).join('')}</select></div></section>
    <section class="set-sec"><h3>Appearance</h3><div class="set-row"><span class="grow">Theme</span>${themeSeg}</div></section>
    <section class="set-sec"><h3>Keyboard</h3><label class="switch set-row"><input type="checkbox" role="switch" data-s="shortcuts"${S.shortcuts ? ' checked' : ''}><span class="grow">Single-key shortcuts<span class="sub">/ ? x L D + − Z , . [ ] F</span></span></label><div class="set-row"><button class="btn" data-s="help">${ic('keyboard', 'sm')}Show shortcuts</button></div></section>
    <section class="set-sec"><h3>Folders &amp; favorites</h3><div class="set-row"><span class="grow">${plural(S.folders.length, 'folder')} · ${plural(S.favs.size, 'favorite')}<span class="sub">They live only in this browser. Export a backup now and then.</span></span></div>
      <div class="set-row"><button class="btn" data-s="backup">Export backup (.json)</button><button class="btn" data-s="import">Import backup…</button></div></section>
    <section class="set-sec"><h3>Storage</h3><div class="set-row"><span class="grow">${S.remember ? 'Using 84 MB' : 'Nothing is saved between sessions in “This tab only” mode.'}<span class="sub">${S.protect ? 'Protected from automatic clearing' : 'May be cleared by the browser'}</span></span>${S.protect ? '' : '<button class="btn" data-s="protect">Protect</button>'}${S.remember ? '<button class="btn" data-s="clear">Clear saved images</button>' : ''}</div></section>
    <section class="set-sec"><h3>About</h3><p><b>Vitrine</b> · Unofficial gallery for your PixelLab assets · mockup B “Gallery Wall”</p>
      <p class="muted">Vitrine is an unofficial gallery for your PixelLab assets. It isn't made by, affiliated with, or endorsed by PixelLab.</p>
      <p class="muted">No analytics, no tracking, no servers. Vitrine talks only to PixelLab's API and image host.</p>
      <p class="muted">Fonts, effects, portraits and talking animations aren't in PixelLab's public API yet, so they live under Other. Icons: Lucide (ISC).</p></section>
    <section class="set-sec"><h3>Mockup states</h3><p class="faint">Reviewer switches. They fake app states; nothing here exists in the real app.</p>
      <div class="state-list">${STATES.map(([id, l]) => `<button class="pill" data-s="state" data-v="${id}"${S.flags[id] != null ? ` aria-pressed="${!!S.flags[id]}"` : ''}>${l}</button>`).join('')}</div></section>`;
  const d = openDialog({ title: 'Settings', body });
  d.addEventListener('change', e => {
    const t = e.target, k = t.dataset.s;
    if (k === 'remember') { if (t.checked) { S.remember = true; $('[data-rem]', d).textContent = REM_ON; } else { t.checked = true; confirmDlg('Stop remembering?', "Vitrine will delete your saved token and its saved copy of your library from this browser. You'll stay connected in this tab.", 'Stop remembering', () => { S.remember = false; t.checked = false; $('[data-rem]', d).textContent = REM_OFF; }); } }
    if (k === 'animate') setAnimate(t.checked);
    if (k === 'shortcuts') { S.shortcuts = t.checked; store.set('shortcuts', t.checked); }
    if (k === 'bg') { S.bgDefault = t.value; S.viewBg = null; store.set('bg', t.value); }
  });
  d.addEventListener('click', e => {
    const t = e.target.closest('[data-s]'); if (!t) return; const k = t.dataset.s;
    if (k === 'theme') { S.theme = t.dataset.v; store.set('theme', S.theme); applyTheme(); $$('[data-s="theme"]', d).forEach(b => b.setAttribute('aria-checked', b === t)); }
    else if (k === 'change') { const row = $('[data-change]', d); row.hidden = !row.hidden; if (!row.hidden) $('input', row).focus(); }
    else if (k === 'test') { const row = $('[data-change]', d), inp = $('input', row), er = $('[data-change-err]', row), v = inp.value.trim(); er.hidden = true;
      if (!v) { er.textContent = 'Paste your token first.'; er.hidden = false; return; }
      t.textContent = 'Checking…'; t.disabled = true;
      setTimeout(() => { t.textContent = 'Test'; t.disabled = false; if (v === 'bad') { er.textContent = "That token didn't work. Copy it again from your PixelLab account page and paste it here."; er.hidden = false; } else { inp.value = ''; row.hidden = true; S.sample = false; toast('Connected. Loading your library…'); } }, 600); }
    else if (k === 'forget') confirmDlg('Forget your token?', "Vitrine will disconnect on this device and delete its saved copy of your library. Your PixelLab account isn't affected.", 'Forget token', cd => {
      if ($('#forget-org', cd).checked) { S.folders = []; S.favs.clear(); }
      d.close(); disconnect(); toast('Token forgotten.');
    }, '<label class="switch"><input type="checkbox" id="forget-org"> Also delete my folders and favorites.</label><p class="hint">Your browser may still keep some images in its own cache. Clear your browsing data to remove them.</p>');
    else if (k === 'sync') { d.close(); startSync(); }
    else if (k === 'help') { d.close(); openHelp(); }
    else if (k === 'backup') toast(`Saved vitrine-backup-${today()}.json`);
    else if (k === 'import') openDialog({ title: 'Import finished', cls: 'sm', body: '<p>Imported 2 folders (1 merged) and 3 favorites. 1 items aren\'t in this library.</p><p class="hint">Mockup: no file was read.</p>', foot: '<button class="btn primary" data-close>OK</button>' });
    else if (k === 'protect') { S.protect = true; t.remove(); toast('Protected from automatic clearing.'); }
    else if (k === 'clear') toast('Saved images cleared. Your folders and favorites are safe.');
    else if (k === 'state') { mockState(t.dataset.v, d); if (S.flags[t.dataset.v] != null) t.setAttribute('aria-pressed', !!S.flags[t.dataset.v]); }
  });
  d.addEventListener('click', e => { const z = e.target.closest('[data-act="set-size"]'); if (z) { setSize(z.dataset.size); $$('[data-act="set-size"]', d).forEach(b => b.setAttribute('aria-checked', b === z)); } });
}
function mockState(id, dlg) {
  const close = () => dlg && dlg.open && dlg.close();
  switch (id) {
    case 'noresults': close(); S.q = 'dragon'; go('#/?type=characters'); break;
    case 'auth': close(); openReconnect(); break;
    case 'emptyFolder': { close(); let f = S.folders.find(x => x.name === 'Boss fight'); if (!f) { f = { id: 'fld_boss', name: 'Boss fight', ids: [] }; S.folders.push(f); } go('#/folder/' + f.id); break; }
    case 'tip': S.tipDismissed = false; S.protect = false; close(); go('#/collections'); break;
    case 'welcome': close(); disconnect(true); break;
    case 'sync': close(); startSync(); break;
    case 'reset': S.flags = {}; S.q = ''; close(); go('#/'); rerender(); break;
    case 'emptyFav': S.flags.emptyFav = !S.flags.emptyFav; close(); go('#/favorites'); rerender(); break;
    case 'gate': S.flags.gate = !S.flags.gate; close(); go(S.flags.gate ? '#/?type=images' : '#/'); rerender(); break;
    case 'exportFail': S.flags.exportFail = !S.flags.exportFail; toast(S.flags.exportFail ? 'The next multi-asset export will report 1 failure.' : 'Exports succeed again.'); break;
    default: S.flags[id] = !S.flags[id]; close(); if (S.r.key || S.r.view !== 'library') go('#/'); else rerender();
  }
}
function setAnimate(on) { S.animate = on; store.set('animate', on); $$('[data-act="animate"]').forEach(b => b.setAttribute('aria-pressed', on)); if (!on) stopAllPreviews(); setupAnimate(); }
function setSize(z) { S.size = z; store.set('size', z); rerender(); }
const KEYS = {
  Library: [['/', 'Focus search', 1], ['?', 'Keyboard shortcuts', 1], ['Arrows', 'Move between cards'], ['Home / End', 'First / last card'], ['Enter', 'Open (selection mode: toggle)'], ['Space', 'Toggle (selection mode)'], ['x', 'Select card', 1], ['Ctrl+A', 'Select all in view'], ['L', 'Favorite', 1], ['D', 'Download', 1], ['+ / −', 'Grid size', 1], ['Shift+F10', 'Card menu'], ['Esc', 'Clear search · leave selection']],
  'Asset page': [['← / →', 'Previous / next asset'], ['Space', 'Play / pause'], [', / .', 'Frame back / forward', 1], ['[ / ]', 'Turn counter-clockwise / clockwise', 1], ['Home / End', 'First / last frame (stage)'], ['+ / −', 'Zoom', 1], ['Z', 'Fit ↔ 1:1', 1], ['Shift+arrows', 'Pan (stage)'], ['L', 'Favorite', 1], ['D', 'Download', 1], ['F', 'Fullscreen', 1], ['Esc', 'Back to the list']]
};
const GESTURES = {
  Library: [['Tap', 'Open'], ['Long-press', 'Select'], ['Swipe a shelf', 'Scroll the shelf'], ['Pinch', 'Browser zoom (Grid size has its own control)']],
  'Asset page': [['Swipe ← / →', 'Next / previous asset'], ['Swipe ↓', 'Back to the list'], ['Double-tap', 'Fit ↔ zoom'], ['Pinch', 'Zoom in whole steps'], ['Drag', 'Pan when zoomed'], ['Tap the stage', 'Show or hide controls (landscape)']]
};
function openHelp() {
  const table = (src, keys) => `<div class="help-cols">${Object.entries(src).map(([g, rows]) => `<section><h3>${g}</h3><dl>${rows.map(([k, l, single]) => `<dt><kbd class="${keys && single && !S.shortcuts ? 'off' : ''}">${k}</kbd></dt><dd${keys && single && !S.shortcuts ? ' class="off"' : ''}>${l}${keys && single && !S.shortcuts ? ' (off)' : ''}</dd>`).join('')}</dl></section>`).join('')}</div>`;
  let gest = isCoarse();
  const d = openDialog({ title: 'Keyboard shortcuts', cls: 'wide', body: '<div class="seg" role="tablist" style="margin-bottom:16px"></div><div data-help></div>' });
  const draw = () => {
    $('.seg', d).innerHTML = `<button role="tab" aria-selected="${!gest}" aria-checked="${!gest}" data-tab="keys">Keys</button><button role="tab" aria-selected="${gest}" aria-checked="${gest}" data-tab="gest">Gestures</button>`;
    $('[data-help]', d).innerHTML = (!gest && !S.shortcuts ? '<p class="banner" style="margin:0 0 16px">Single-key shortcuts are off. Turn them on in Settings.</p>' : '') + table(gest ? GESTURES : KEYS, !gest);
  };
  d.addEventListener('click', e => { const t = e.target.closest('[data-tab]'); if (t) { gest = t.dataset.tab === 'gest'; draw(); } });
  draw();
}
function connectHTML() {
  return `<div class="connect"><div class="connect-art" aria-hidden="true">${markSVG(12)}<h2>Your PixelLab art, all in one place</h2></div>
    <form class="connect-form" id="cform" novalidate>
      <div class="c-brand">${markSVG(4)}<div><b>Vitrine</b><div class="c-desc">Unofficial gallery for your PixelLab assets</div></div></div>
      <h1 class="c-heading" tabindex="-1">Your PixelLab art, all in one place</h1>
      <p class="c-value">Vitrine shows everything in your PixelLab account. It only looks. It never creates, changes, or deletes anything.</p>
      ${S.welcome ? '<p class="welcome" role="status">Welcome back! Your token was kept for one tab only, so paste it again here.</p>' : ''}
      <input type="text" name="username" autocomplete="username" value="PixelLab API token" class="sr-only" tabindex="-1" aria-hidden="true" readonly>
      <div class="form-row"><label for="tok">PixelLab API token</label><div class="pw"><input id="tok" class="field" type="password" name="password" autocomplete="current-password" placeholder="Paste your token" aria-describedby="tok-err" spellcheck="false"><button class="btn" type="button" data-c="show" aria-pressed="false">Show</button></div><p class="err" id="tok-err" hidden></p></div>
      <details class="c-help"><summary>Where do I find my token?</summary><ol><li>${plLink('Open your PixelLab account page', 'linkbtn accent')}</li><li>Find your API token and copy it.</li><li>Paste it here.</li></ol><p class="helper" style="margin-top:6px">Signed out? PixelLab will ask you to sign in first.</p></details>
      <label class="switch"><input type="checkbox" role="switch" id="rem" aria-describedby="rem-help"> Remember on this device</label>
      <p class="helper" id="rem-help">${REM_OFF}</p>
      <p class="note">${ic('key-round')}<span>Heads up: PixelLab tokens give full access to your account, including spending credits. Vitrine only reads, but keep your token as private as a password.</span></p>
      <button class="btn primary" type="submit" id="c-go">Connect</button>
      <button class="btn ghost" type="button" data-c="sample">Use sample library</button>
      <div class="c-foot"><p>Your token goes only to PixelLab's API. Vitrine has no servers and no analytics.</p><p>Unofficial. Not affiliated with or endorsed by PixelLab.</p><p>Mockup: any value connects (it is never stored); type “bad” to see the error.</p></div>
    </form></div>`;
}
function tokenCheck(inp, err, btn, label, onOk) {
  const v = inp.value.trim(); err.hidden = true; inp.removeAttribute('aria-invalid');
  const fail = msg => { err.textContent = msg; err.hidden = false; inp.setAttribute('aria-invalid', 'true'); inp.focus(); };
  if (!v) { fail('Paste your token first.'); return; }
  if (S.flags.offline || S.flags.offlineEmpty) { fail("You're offline. Connect to the internet and try again."); return; }
  btn.textContent = 'Checking…'; btn.disabled = true; inp.readOnly = true;
  setTimeout(() => {
    btn.textContent = label; btn.disabled = false; inp.readOnly = false;
    if (v === 'bad') { fail("That token didn't work. Copy it again from your PixelLab account page and paste it here."); return; }
    inp.value = ''; onOk();                                                   // the value is dropped here; nothing keeps it
  }, 700);
}
function bindConnect() {
  const f = $('#cform'), tok = $('#tok'), rem = $('#rem');
  rem.addEventListener('change', () => { $('#rem-help').textContent = rem.checked ? REM_ON : REM_OFF; });
  f.addEventListener('click', e => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    if (b.dataset.c === 'show') { const show = tok.type === 'password'; tok.type = show ? 'text' : 'password'; b.textContent = show ? 'Hide' : 'Show'; b.setAttribute('aria-pressed', show); }
    else connected(false, true);
  });
  f.addEventListener('submit', e => { e.preventDefault(); tokenCheck(tok, $('#tok-err'), $('#c-go'), 'Connect', () => connected(rem.checked, false)); });
  if (S.r && S.r.view === 'connect') tok.focus({ preventScroll: true });
}
function connected(remember, sample) {
  S.connected = true; S.remember = !!remember; S.sample = !!sample; S.welcome = false;
  history.replaceState(null, '', '#/'); S.r = null; onRoute(); toast('Connected. Loading your library…'); startSync();
}
function disconnect(welcome) { S.connected = false; S.welcome = !!welcome; S.selecting = false; S.sel.clear(); S.memo = {}; S.q = ''; history.replaceState(null, '', '#/connect'); S.r = null; onRoute(); }
function openReconnect() {
  announce('Your PixelLab token stopped working. Reconnect to continue.', true);
  const d = openDialog({ title: 'Reconnect to PixelLab.', cls: 'sm', role: 'alertdialog',
    body: `<p class="muted">Your token stopped working. It may have been replaced in your PixelLab account. Paste a new one to continue. Your folders and favorites are safe.</p>
      <div class="form-row" style="margin-top:16px"><label for="rtok">PixelLab API token</label><input id="rtok" class="field" type="password" autocomplete="current-password" placeholder="Paste your token" aria-describedby="rtok-err"><p class="err" id="rtok-err" hidden></p></div>`,
    foot: '<button class="btn primary" data-go>Connect</button>' });
  const inp = $('#rtok', d); inp.focus();
  $('[data-go]', d).onclick = e => tokenCheck(inp, $('#rtok-err', d), e.currentTarget, 'Connect', () => { d.close(); toast('Connected. Loading your library…'); const c = $('.card-link'); c && c.focus(); });
}

// ============================================================ sync (02 §3.2) — timer-fed queue
function startSync() {
  if (S.sync.running) return;
  S.arrived = new Set(); S.sync.running = true; announce('Syncing your library');
  const queue = ['characters', 'objects', 'tilesets', 'tiles', 'ui', 'maps', 'images'].flatMap(ch => CARDS.filter(c => c.chip === ch));
  let half = false;
  const tick = () => {
    if (!S.sync.running) return;
    queue.splice(0, 6).forEach(c => S.arrived.add(c.id));
    if (!half && S.arrived.size >= CARDS.length / 2) { half = true; announce('Halfway there'); }
    if (!queue.length) { S.sync.running = false; S.arrived = null; announce(`Library synced. ${plural(CARDS.length, 'asset')}.`); }
    else setTimeout(tick, 220);
    if (S.r && !S.r.key) rerender(); else updateChrome(S.r);
  };
  if (S.r && !S.r.key) rerender();
  setTimeout(tick, 450);
}
function syncPopHTML() {
  const rows = CHIPS.slice(1, -1).map(([id, l]) => {
    const all = CARDS.filter(c => c.chip === id), got = S.arrived ? all.filter(c => S.arrived.has(c.id)).length : all.length;
    if (S.flags.partial && id === 'maps') return `<div class="mrow"><span class="spacer">${l}</span><span class="err">couldn't be loaded</span><button class="btn sm" data-act="retry">Retry</button></div>`;
    return `<div class="mrow"><span class="spacer">${l}</span><span class="faint">${got} of ${S.arrived ? '~' : ''}${all.length}${got === all.length ? ' ✓' : ''}</span></div>`;
  }).join('');
  return `<div class="mh">Library sync</div>${S.flags.partial ? '<div class="mnote">Some assets didn\'t load. Maps couldn\'t be loaded.</div>' : ''}${rows}<hr>${mi('Sync now', 'data-act="sync-now"', 'refresh-cw')}<div class="mnote">Last synced just now</div>`;
}
function inprogPopHTML() {
  const rev = INPROG.filter(a => a.status === 'review').length, gen = INPROG.filter(a => a.status === 'processing').length;
  return `<div class="mh">In PixelLab</div><div class="mnote">Objects · ${gen} generating · ${rev} needs review</div>${miLink('Open Objects in PixelLab')}`;
}

// ============================================================ menus
function sortMenu(r, withSize) {
  const opts = SORTS.filter(s => s[0] !== 'updated' || r.chip === 'characters');
  return `<div class="mh">Sort</div>${opts.map(([v, l]) => mi(l, `data-act="set-sort" data-v="${v}"`, null, effSort(r.chip) === v)).join('')}${withSize ? `<hr><div class="mh">Grid size</div>${['S', 'M', 'L', 'XL'].map(z => mi(z, `data-act="size" data-size="${z}"`, null, S.size === z)).join('')}` : ''}`;
}
function moreMenu() { return `${mi('Export all in view…', 'data-act="export-view"', 'download')}${mi('Sync now', 'data-act="sync-now"', 'refresh-cw')}${mi(isCoarse() ? 'Gestures' : 'Keyboard shortcuts', 'data-act="help"', 'keyboard')}`; }
function cardMenu(c) {
  const fav = S.favs.has(c.id), f = S.r.view === 'folder' && folderById(S.r.id);
  return `${mi('Open', `data-act="open-card" data-key="${c.key}"`, 'chevron-right')}${mi(fav ? 'Unfavorite' : 'Favorite', `data-act="menu-fav" data-key="${c.key}"`, 'heart')}${mi('Download…', `data-act="menu-dl" data-key="${c.key}"`, 'download')}${mi('Add to folder…', `data-act="menu-folder" data-key="${c.key}"`, 'folder-plus')}${f ? mi('Remove from this folder', `data-act="menu-remove" data-key="${c.key}"`, 'trash-2') : ''}${miLink('Open in PixelLab')}${mi('Select', `data-act="menu-select" data-key="${c.key}"`, 'square-check')}`;
}
function dlMenu(v, key) { return `<div class="mh">Download</div>${dlItems(v).map((it, i) => mi(esc(it.t), `data-act="dl-menu-item" data-i="${i}"${key ? ` data-key="${key}"` : ''}`, i ? null : 'download')).join('')}<hr>${mi('More options…', `data-act="more-options"${key ? ` data-key="${key}"` : ''}`)}`; }
function detailMenu() {
  const t = V.a.type;
  return `${mi('Copy image', 'data-act="copy" data-what="image"', 'copy')}${V.a.prompt ? mi('Copy prompt', 'data-act="copy" data-what="prompt"', 'copy') : ''}${t === 'creator_image' || t === 'map' ? mi('Reload from PixelLab', 'data-act="reload"', 'refresh-cw') : ''}${document.fullscreenEnabled ? mi('Fullscreen', 'data-act="fullscreen"', 'maximize-2', null, 'F') : ''}${mi('Keyboard shortcuts', 'data-act="help"', 'keyboard', null, '?')}`;
}
function fpsPopHTML() {
  return `<div class="mh">Speed</div><div class="mrow"><button class="ibtn" data-act="fps-step" data-v="-1" aria-label="Slower">${ic('minus')}</button><input class="field" type="number" min="1" max="30" value="${V.fps}" aria-label="Frames per second" data-role="fps-input" style="width:72px;height:36px;text-align:center"><span>fps</span><button class="ibtn" data-act="fps-step" data-v="1" aria-label="Faster">${ic('plus')}</button></div>${mi('Reset to 8 fps', 'data-act="fps-reset"', 'refresh-cw')}<div class="mnote">${TIMING}</div>`;
}
function setFps(n) {
  V.fps = clamp(Math.round(n) || 8, 1, 30); const k = fpsKey();
  if (k) { if (V.fps === 8) delete S.fps[k]; else S.fps[k] = V.fps; store.set('fps', S.fps); }
  $$('[data-role=fps]').forEach(b => { b.textContent = `${V.fps} fps`; }); const inp = $('[data-role=fps-input]'); if (inp) inp.value = V.fps;
  if (V.playing) startPlayer();
}

// ============================================================ actions (event delegation)
function cardOf(el) { const li = el.closest('.card[data-id]'); return li ? cardById.get(li.dataset.id) : el.dataset.key ? byKey.get(el.dataset.key) : null; }
function focusSearch() {
  const f = ff();
  if (f === 'compact' && !$('.ph-search.only-compact')) { S.searchOpen = true; rerender(); }
  if (/tablet/.test(f) && innerWidth < 840) $('#topnav').classList.add('searching');
  const i = $$('.q-input').find(visible); if (i) { i.focus(); i.select(); }
}
function setQ(v) {
  S.q = v; $$('.q-input').forEach(i => { if (i.value !== v) i.value = v; }); $$('.q-clear').forEach(b => { b.hidden = !v; });
  if (!S.r) return;
  if (S.r.key || S.r.view === 'collections') { if (v) go('#/'); return; }
  updateListBody();
  clearTimeout(setQ.t); setQ.t = setTimeout(() => announce(plural(shelvesMode(S.r) ? library().length : viewCards(S.r).length, 'result')), 500);
}
const ACT = {
  select: () => setSelecting(!S.selecting),
  settings: openSettings,
  'search-open': focusSearch,
  'q-clear': () => { setQ(''); const i = $$('.q-input').find(visible); i && i.focus(); },
  'search-all': () => go('#/' + S.r.parts.join('/') + (S.r.view === 'library' ? '?type=all' : ''), true),
  chip: b => {
    const id = b.dataset.chip, r = S.r, base = '#/' + r.parts.join('/');
    go(id === 'all' ? base : `${base}?type=${id}`, true);
    if (id !== 'other') announce(`${plural(viewCards(S.r).length, ...(NOUN[id] || NOUN.all))}`);
  },
  sort: b => openMenu(b, sortMenu(S.r, false)),
  view: b => openMenu(b, sortMenu(S.r, true)),
  'set-sort': b => { S.sort = b.dataset.v; store.set('sort', S.sort); closePop(); rerender(); },
  size: b => { closePop(); setSize(b.dataset.size); },
  animate: () => setAnimate(!S.animate),
  more: b => openMenu(b, ff() === 'phone' ? sortMenu(S.r, true) + '<hr>' + moreMenu() : moreMenu()),
  help: () => { closePop(); openHelp(); },
  'sync-now': () => { closePop(); startSync(); },
  'sync-pop': b => openMenu(b, syncPopHTML(), 'dialog'),
  'inprog-pop': b => openMenu(b, inprogPopHTML(), 'dialog'),
  retry: () => { closePop(); S.flags.offlineEmpty = S.flags.cors = S.flags.partial = false; rerender(); startSync(); },
  'export-view': () => { closePop(); const r = S.r; openExportMulti(shelvesMode(r) ? library() : viewCards(r), exportScope(r)); },
  'shelf-scroll': b => { const t = $(`.track[data-shelf="${b.dataset.shelf}"]`); t.scrollBy({ left: +b.dataset.dir * Math.max(200, t.clientWidth - 160), behavior: reduced() ? 'auto' : 'smooth' }); },
  'sel-shelf': b => selectAll($$(`.track[data-shelf="${b.dataset.shelf}"] .card-link[data-key]`).map(l => byKey.get(l.dataset.key))),
  'card-check': b => toggleSel(cardOf(b)),
  'card-fav': b => toggleFav(cardOf(b)),
  'card-menu': b => openMenu(b, cardMenu(cardOf(b))),
  'open-card': b => { closePop(); const c = byKey.get(b.dataset.key); S.ctx = CTX.grid && CTX.grid.keys.includes(c.key) ? CTX.grid : null; go(detailHash(S.r, c.key)); },
  'menu-fav': b => { closePop(); toggleFav(byKey.get(b.dataset.key)); },
  'menu-dl': b => { const c = byKey.get(b.dataset.key), a = popAnchor; closePop(); openMenu(a, dlMenu(cardV(c), c.key)); },
  'menu-folder': b => { closePop(); openFolderPicker([byKey.get(b.dataset.key)]); },
  'menu-remove': b => { closePop(); removeWithUndo(folderById(S.r.id), [byKey.get(b.dataset.key)]); },
  'menu-select': b => { closePop(); toggleSel(byKey.get(b.dataset.key)); },
  'sel-all': () => selectAll(visibleNow()),
  'sel-fav': () => { const cs = selCards(), all = cs.every(c => S.favs.has(c.id)); cs.forEach(c => all ? S.favs.delete(c.id) : S.favs.add(c.id)); toast(all ? `Removed ${cs.length} from Favorites.` : `Added ${cs.length} to Favorites.`); rerender(); },
  'sel-folder': () => openFolderPicker(selCards()),
  'sel-remove': () => removeWithUndo(folderById(S.r.id), selCards()),
  'sel-download': b => { const cs = selCards(); if (cs.length === 1) openMenu(b, dlMenu(cardV(cs[0]), cs[0].key)); else openExportMulti(cs, `selection-${cs.length}`); },
  'sel-exit': () => setSelecting(false),
  'new-folder': () => openFolderName(null, f => go('#/folder/' + f.id)),
  'folder-menu': b => { const f = folderById(b.dataset.id); openMenu(b, `${mi('Rename', `data-act="folder-rename" data-id="${f.id}"`, 'pencil')}${mi('Delete folder', `data-act="folder-delete" data-id="${f.id}"`, 'trash-2')}`); },
  'folder-rename': b => openFolderName(folderById(b.dataset.id), () => rerender()),
  'folder-delete': b => deleteFolder(folderById(b.dataset.id)),
  'folder-export': () => { const f = folderById(S.r.id); openExportMulti(folderCards(f), 'folder-' + slug(f.name)); },
  'unavail-remove': () => {
    if (S.r.view === 'folder') { const f = folderById(S.r.id), prev = f.ids.slice(); f.ids = f.ids.filter(id => cardById.has(id)); toast(`Removed from ${esc(f.name)}. It's still in your library.`, undoable(f, prev)); }
    else { const prev = [...S.favs]; [...S.favs].forEach(id => { if (!cardById.has(id)) S.favs.delete(id); }); toast('Removed from Favorites.', { label: 'Undo', run: () => { S.favs = new Set(prev); rerender(); } }); }
    rerender();
  },
  'tip-dismiss': () => { S.tipDismissed = true; rerender(); },
  backup: () => toast(`Saved vitrine-backup-${today()}.json`),
  protect: () => { S.protect = true; toast('Protected from automatic clearing.'); rerender(); },
  'open-pl': (b, e) => { e.preventDefault(); closePop(); mockOpen(); },
  // detail
  back: goBack,
  prev: () => navStep(-1), next: () => navStep(1),
  dmenu: b => openMenu(b, detailMenu()),
  play: togglePlay,
  'step-back': () => stepFrame(-1), 'step-fwd': () => stepFrame(1),
  loop: b => { V.loop = !V.loop; $$('[data-act="loop"]').forEach(x => x.setAttribute('aria-pressed', V.loop)); },
  fps: b => openMenu(b, fpsPopHTML(), 'dialog'),
  'fps-step': b => setFps(V.fps + +b.dataset.v),
  'fps-reset': () => { closePop(); setFps(8); refreshDetail(); },
  anim: b => { V.ai = +b.dataset.ai; fixDir(); V.frame = 0; V.fps = S.fps[fpsKey()] || 8; refreshDetail(); },
  state: b => { setStateIdx(+b.dataset.si); refreshDetail(); },
  dir: (b, e) => {
    const inPop = pop.contains(b); V.dir = b.dataset.dir;
    if (inPop && e.detail === 0) { refreshDetail(true); pop.innerHTML = `<div class="mh">Direction</div>${compassHTML('big')}`; popAnchor = $$('[data-act="dir-pop"]').find(visible); $(`[data-dir="${V.dir}"]`, pop).focus(); return; }
    closePop(); refreshDetail();
  },
  'dir-pop': b => openMenu(b, `<div class="mh">Direction</div>${compassHTML('big')}`, 'dialog'),
  bg: b => { setBg(b.dataset.bg); if (pop.contains(b)) closePop(); },
  'bg-pop': b => openMenu(b, `<div class="mh">Backdrop</div>${BGS.map(([v, l]) => mi(`<span class="swatch" data-bg="${v}" style="width:18px;height:18px"></span>${l}`, `data-act="bg" data-bg="${v}"`, null, V.bg === v)).join('')}`),
  'zoom-fit': () => setZoom('fit'), 'zoom-1': () => setZoom(1), 'zoom-in': () => zoomStep(1), 'zoom-out': () => zoomStep(-1),
  grid: b => { V.grid = !V.grid; $$('[data-act="grid"]').forEach(x => x.setAttribute('aria-pressed', V.grid)); const g = V.el && (V.el.querySelector('.tile-grid') || V.el); g.classList.toggle('on', V.grid); },
  details: () => { const t = $('.dock'); t && t.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' }); },
  download: b => openMenu(b, dlMenu(curV())),
  'dl-item': b => quickDownload(dlItems(curV())[+b.dataset.i]),
  'dl-menu-item': b => { closePop(); const c = b.dataset.key && byKey.get(b.dataset.key); quickDownload(dlItems(c ? cardV(c) : curV())[+b.dataset.i]); },
  'more-options': b => {
    closePop();
    if (b.dataset.key && (!V || V.c.key !== b.dataset.key)) { S.ctx = null; S.pendingExport = true; go(detailHash(S.r, b.dataset.key)); return; }
    openExportSingle();
  },
  fav: () => toggleFav(V.c),
  'add-folder': () => openFolderPicker([V.c]),
  copy: b => {
    closePop(); const w = b.dataset.what, a = V.a;
    const text = w === 'prompt' ? (a.type === 'tile_isometric' ? a.meta.description : a.prompt) : w === 'terrains' ? [a.meta.lower_description, a.meta.upper_description, a.meta.transition_description].filter(Boolean).join(' / ') : w === 'seed' ? String(a.meta.seed) : '';
    if (text && navigator.clipboard) navigator.clipboard.writeText(text).catch(() => {});
    const msg = { prompt: 'Prompt copied', id: 'Asset ID copied', image: 'Image copied. Paste or drop it into PixelLab.', terrains: 'Copied', seed: 'Copied' }[w];
    toast(esc(msg)); announce(msg);
    if (b.classList.contains('copy')) { b.innerHTML = ic('check', 'sm'); setTimeout(() => { if (b.isConnected) b.innerHTML = ic('copy', 'sm'); }, 2000); }
  },
  reload: () => { closePop(); toast('Reloaded from PixelLab.'); },
  fullscreen: () => { closePop(); fullscreen(); },
  tag: b => { S.q = '#' + b.dataset.tag; go('#/'); }
};
document.addEventListener('click', e => {
  const link = e.target.closest('.card-link');
  if (link && link.dataset.key) {
    if (suppressClick) { e.preventDefault(); suppressClick = false; return; }
    const c = byKey.get(link.dataset.key);
    if (S.selecting || e.shiftKey || e.ctrlKey || e.metaKey) { e.preventDefault(); (e.shiftKey && S.anchor ? rangeSel(link) : toggleSel(c)); return; }
    S.ctx = CTX[link.dataset.ctx] || null;
    return;                                                                   // the href navigates (push), so Back returns here
  }
  const t = e.target.closest('[data-act]');
  if (t && ACT[t.dataset.act] && !t.disabled) ACT[t.dataset.act](t, e);
  if (e.target.closest('.tabs a, .tabbar a, .rail a, .brand')) $('#topnav').classList.remove('searching');
});
document.addEventListener('input', e => {
  const t = e.target;
  if (t.classList.contains('q-input')) { $$('.q-input').forEach(i => { if (i !== t) i.value = t.value; }); $$('.q-clear').forEach(b => { b.hidden = !t.value; }); clearTimeout(ACT.qT); ACT.qT = setTimeout(() => setQ(t.value), 150); }
  if (t.dataset.role === 'scrub') { pause(); V.frame = +t.value - 1; drawFrame(); }
  if (t.dataset.role === 'fps-input') setFps(+t.value);
});
document.addEventListener('focusout', e => { if (e.target.classList.contains('q-input') && !e.target.value) $('#topnav').classList.remove('searching'); });

// ---- touch: long-press selects (02 §9.4)
let lp = null, suppressClick = false;
document.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  const link = e.target.closest('.card-link'); if (!link || !link.dataset.key) return;
  lp = { x: e.clientX, y: e.clientY, t: setTimeout(() => { lp = null; suppressClick = true; setTimeout(() => { suppressClick = false; }, 600); toggleSel(byKey.get(link.dataset.key)); }, 500) };
});
document.addEventListener('pointermove', e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) { clearTimeout(lp.t); lp = null; } });
['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => { if (lp) { clearTimeout(lp.t); lp = null; } }));
document.addEventListener('contextmenu', e => {
  const link = e.target.closest('.card-link'); if (!link || !link.dataset.key) return;
  e.preventDefault(); if (e.pointerType === 'touch' || suppressClick) return;
  openMenu(link, cardMenu(byKey.get(link.dataset.key)));
});

// ============================================================ keyboard (02 §9.3)
function rovingMove(t, e) {
  const g = t.closest('[role=radiogroup]'), items = $$('[role=radio]:not(:disabled)', g); if (items.length < 2) return;
  const fwd = e.key === 'ArrowRight' || e.key === 'ArrowDown', i = items.indexOf(t);
  const order = g.classList.contains('compass') ? CW.map(d => items.find(b => b.dataset.dir === d)).filter(Boolean) : items;
  const j = order.indexOf(t), next = order[(j + (fwd ? 1 : -1) + order.length) % order.length] || items[(i + 1) % items.length];
  e.preventDefault(); next.focus(); next.click();
}
function moveFocus(link, key) {
  const ul = link.closest('ul'), links = $$('.card-link', ul), i = links.indexOf(link);
  let to = null;
  if (ul.classList.contains('grid')) {
    const cols = +getComputedStyle(ul).getPropertyValue('--cols') || 1;
    to = { ArrowLeft: i - 1, ArrowRight: i + 1, ArrowUp: i - cols, ArrowDown: i + cols, Home: 0, End: links.length - 1 }[key];
    to = links[to];
  } else if (key === 'ArrowUp' || key === 'ArrowDown') {
    const tracks = $$('.track'), ti = tracks.indexOf(ul), other = tracks[ti + (key === 'ArrowDown' ? 1 : -1)];
    if (other) { const ol = $$('.card-link', other); to = ol[Math.min(i, ol.length - 1)]; }
  } else to = links[{ ArrowLeft: i - 1, ArrowRight: i + 1, Home: 0, End: links.length - 1 }[key]];
  if (to) { to.focus({ preventScroll: true }); to.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
}
document.addEventListener('keydown', e => {
  const t = e.target, k = e.key, single = S.shortcuts && !e.ctrlKey && !e.metaKey && !e.altKey;
  const field = t.matches && t.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, select');
  if (k === 'Escape') {
    if (pop.matches(':popover-open') || $('dialog[open]')) return;
    if (t.classList && t.classList.contains('q-input')) { e.preventDefault(); if (t.value) setQ(''); else { t.blur(); $('#topnav').classList.remove('searching'); } return; }
    if (S.r && S.r.key) { e.preventDefault(); goBack(); return; }
    if (S.selecting) { setSelecting(false); return; }
    return;
  }
  if ($('dialog[open]') || field || !S.r || S.r.view === 'connect') return;
  if (pop.contains(t)) { if (/^Arrow/.test(k) && t.getAttribute('role') === 'radio') rovingMove(t, e); return; }
  if (/^Arrow/.test(k) && !e.shiftKey && t.getAttribute && t.getAttribute('role') === 'radio') { rovingMove(t, e); return; }
  if (single && k === '/') { e.preventDefault(); focusSearch(); return; }
  if (single && k === '?') { e.preventDefault(); openHelp(); return; }
  if (S.r.key) { detailKeys(e, t, k, single); return; }
  const link = t.closest && t.closest('.card-link[data-key]');
  if ((e.ctrlKey || e.metaKey) && k.toLowerCase() === 'a' && S.r.view !== 'collections') { e.preventDefault(); selectAll(visibleNow()); return; }
  if (single && (k === '+' || k === '=' || k === '-')) { const z = ['S', 'M', 'L', 'XL'], i = clamp(z.indexOf(S.size) + (k === '-' ? -1 : 1), 0, 3); if (z[i] !== S.size) setSize(z[i]); return; }
  if (!link) return;
  const c = byKey.get(link.dataset.key);
  if (/^(Arrow|Home$|End$)/.test(k)) { e.preventDefault(); moveFocus(link, k); return; }
  if (k === ' ' && S.selecting) { e.preventDefault(); toggleSel(c); return; }
  if ((e.shiftKey && k === 'F10') || k === 'ContextMenu') { e.preventDefault(); openMenu(link, cardMenu(c)); return; }
  if (!single) return;
  if (k === 'x' || k === 'X') toggleSel(c);
  else if (k === 'l' || k === 'L') toggleFav(c);
  else if (k === 'd' || k === 'D') openMenu(link, dlMenu(cardV(c), c.key));
});
function detailKeys(e, t, k, single) {
  if (!V) return;
  const area = t.id === 'art-area', owned = t.closest('[role=radiogroup]') || t.matches('input[type=range]');
  if (e.shiftKey && /^Arrow/.test(k) && area) { e.preventDefault(); const r = t.getBoundingClientRect(), d = { ArrowLeft: [1, 0], ArrowRight: [-1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[k]; V.panX += d[0] * r.width * 0.1; V.panY += d[1] * r.height * 0.1; layoutStage(); return; }
  if ((k === 'ArrowLeft' || k === 'ArrowRight') && !owned && !e.shiftKey) { e.preventDefault(); navStep(k === 'ArrowRight' ? 1 : -1); return; }
  if (k === ' ' && !t.matches('button, a, input, summary, select')) { e.preventDefault(); togglePlay(); return; }
  if ((k === 'Home' || k === 'End') && area && V.n > 1) { e.preventDefault(); pause(); V.frame = k === 'Home' ? 0 : V.n - 1; drawFrame(); return; }
  if (!single) return;
  const dl = $$('[data-act="download"]').find(visible);
  ({ ',': () => stepFrame(-1), '.': () => stepFrame(1), '[': () => rotateDir(-1), ']': () => rotateDir(1), '+': () => zoomStep(1), '=': () => zoomStep(1), '-': () => zoomStep(-1),
    z: () => setZoom(V.zoom === 'fit' ? 1 : 'fit'), Z: () => setZoom(V.zoom === 'fit' ? 1 : 'fit'), l: () => toggleFav(V.c), L: () => toggleFav(V.c),
    d: () => dl && openMenu(dl, dlMenu(curV())), D: () => dl && openMenu(dl, dlMenu(curV())), f: fullscreen, F: fullscreen }[k] || (() => {}))();
}

// ============================================================ window events
let lastY = 0, rafR = 0, lastFF = ff();
addEventListener('scroll', () => {
  const y = scrollY; document.documentElement.classList.toggle('scrolled', y > 2);
  const lh = $('.lhead');
  if (lh && small()) { if (y > lastY + 4 && y > 160) lh.classList.add('tucked'); else if (y < lastY - 4) lh.classList.remove('tucked'); }
  lastY = y;
}, { passive: true });
addEventListener('resize', () => {
  cancelAnimationFrame(rafR);
  rafR = requestAnimationFrame(() => { const f = ff(); if (f !== lastFF) { lastFF = f; rerender(); } else { layoutGrids(); fitAll(); layoutStage(); markOverflow(); } if (innerWidth >= 840) $('#topnav').classList.remove('searching'); });
});
(function watchDpr() { matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener('change', () => { fitAll(); layoutStage(); watchDpr(); }, { once: true }); })();
addEventListener('hashchange', onRoute);

// ============================================================ boot + demo shortcuts (README)
(function boot() {
  history.scrollRestoration = 'manual';
  $('.brand .mark').outerHTML = markSVG(2);
  const P = new URLSearchParams(location.search), demo = P.get('demo');
  if (P.get('theme')) S.theme = P.get('theme');
  if (P.get('size')) S.size = P.get('size');
  applyTheme();
  const DEMO = ['chr_0004', 'chr_0001', 'chr_0002', 'obj_0001', 'img_0022', 'tds_0001', 'tpr_0001', 'map_0001', 'mob_0003', 'ui_0001', 'img_0023', 'sss_0001', 'iso_0001', 'img_0001'];
  const detailOf = n => { const c = cardById.get(DEMO[+n || 0]) || CARDS[0]; return '#/' + (P.get('type') ? `a/${c.key}?type=${P.get('type')}` : `a/${c.key}`); };
  const flagMap = { empty: 'empty', offline: 'offline', 'offline-empty': 'offlineEmpty', cors: 'cors', rate: 'rate', partial: 'partial', gate: 'gate', 'export-fail': 'exportFail' };
  if (demo && demo !== 'connect' && demo !== 'welcome') { S.connected = true; S.sample = true; if (demo !== 'sync') S.mapsShown.add('map_0001'); }
  if (demo === 'welcome') S.welcome = true;
  if (flagMap[demo]) S.flags[flagMap[demo]] = true;
  const hash = { home: '#/', grid: '#/?type=all', chip: '#/?type=' + (P.get('type') || 'characters'), detail: detailOf(P.get('asset')), export: detailOf(P.get('asset')), menu: detailOf(P.get('asset')), folderpick: detailOf(P.get('asset')),
    boards: '#/collections', folder: '#/folder/' + (P.get('id') || 'fld_01'), favorites: '#/favorites', select: '#/?type=objects', selectbar: '#/?type=objects', search: '#/', tag: '#/', noresults: '#/?type=characters',
    other: '#/?type=other', gate: '#/?type=images', settings: '#/', help: '#/', sync: '#/', 401: '#/', report: '#/', empty: '#/', offline: '#/', 'offline-empty': '#/', cors: '#/', rate: '#/', partial: '#/', 'export-fail': '#/', connect: '#/connect', welcome: '#/connect' }[demo];
  if (demo === 'search') S.q = P.get('q') || 'mage';
  if (demo === 'tag') S.q = '#dungeon';
  if (demo === 'noresults') S.q = 'dragon';
  if (hash) history.replaceState(null, '', location.pathname + location.search + hash);
  onRoute();
  if (demo === 'select' || demo === 'selectbar') { CARDS.filter(c => c.chip === 'objects').slice(0, 12).forEach(c => S.sel.add(c.id)); S.selecting = true; rerender(); if (demo === 'select') openExportMulti(selCards(), 'selection-12'); }
  if (demo === 'settings') openSettings();
  if (demo === 'help') openHelp();
  if (demo === 'sync') startSync();
  if (demo === '401') openReconnect();
  if (demo === 'report') openReport();
  if (demo === 'export') openExportSingle();
  if (demo === 'folderpick') openFolderPicker([V.c]);
  if (demo === 'menu') { const b = $$('[data-act="download"]').find(visible); b && b.click(); }
})();
})();
