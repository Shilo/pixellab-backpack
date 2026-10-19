/* Vitrine — recommended mockup "Quiet Studio, lifted".
   Classic script, no modules, no network. Behaviour: docs/design/02-ux-spec.md as amended by the final
   rulings F-1…F-15 (see README). Built from option A's code; pieces borrowed from B and C are marked. */
(function () {
'use strict';

// ===================== helpers =====================
const D = window.SAMPLE_DATA;
const P = new URLSearchParams(location.search);
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const ic = (n, c, st) => `<svg class="ic${c ? ' ' + c : ''}" aria-hidden="true"${st ? ` style="${st}"` : ''}><use href="#i-${n}"/></svg>`;
const MARK = '<svg class="mark" aria-hidden="true"><use href="#mark"/></svg>';
const mq = q => matchMedia(q).matches;
const fine = () => mq('(hover: hover) and (pointer: fine)');
const coarse = () => mq('(pointer: coarse)');
const reduced = () => mq('(prefers-reduced-motion: reduce)');
const vp = () => innerHeight < 480 ? 'compact' : innerWidth < 600 ? 'phone' : innerWidth < 1200 ? 'tablet' : 'laptop';
const cap1 = s => s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '';
const plural = (n, one, many) => `${n.toLocaleString('en-US')} ${n === 1 ? one : (many || one + 's')}`;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'asset';
const store = {
  get(k, d) { try { const v = localStorage.getItem('vitrine-rec-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('vitrine-rec-' + k, JSON.stringify(v)); } catch (e) { /* storage blocked: in-memory only */ } }
};
const dateFull = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dateDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' });
const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

// Opaque 12-char keys (02 §0). ponytail: FNV-1a stand-in for base64url(SHA-256(type:uuid)); same shape, works offline.
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function key12(s) {
  let out = '';
  for (let seed = 1; out.length < 12; seed++) {
    let h = (0x811c9dc5 ^ Math.imul(seed, 0x9e3779b1)) >>> 0;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    for (let j = 0; j < 5 && out.length < 12; j++) out += B64[(h >>> (j * 6)) & 63];
  }
  return out;
}
const masked = k => { const h = Array.from(k, ch => B64.indexOf(ch).toString(16).padStart(2, '0')).join(''); return h.slice(0, 4) + '…' + h.slice(-4); };

// ===================== data =====================
const TYPES = {
  character: { chip: 'characters', label: 'Character', glyph: 'person-standing' },
  object: { chip: 'objects', label: 'Object', glyph: 'box' },
  map_object: { chip: 'objects', label: 'Object', glyph: 'box' },
  creator_image: { chip: 'images', label: 'Image', glyph: 'image' },
  tileset_topdown: { chip: 'tilesets', label: 'Tileset', glyph: 'grid-2x2' },
  tileset_sidescroller: { chip: 'tilesets', label: 'Tileset', glyph: 'grid-2x2' },
  tiles_pro: { chip: 'tiles', label: 'Tiles Pro', glyph: 'layers' },
  tile_isometric: { chip: 'tiles', label: 'Isometric tile', glyph: 'layers' },
  map: { chip: 'maps', label: 'Map', glyph: 'map' },
  ui_asset: { chip: 'ui', label: 'UI', glyph: 'panels-top-left' }
};
const CHIPS = [['all', 'All'], ['characters', 'Characters'], ['objects', 'Objects'], ['images', 'Images'], ['tilesets', 'Tilesets'], ['tiles', 'Tiles'], ['maps', 'Maps'], ['ui', 'UI']];
const TYPE_IDS = CHIPS.slice(1).map(c => c[0]);
const NOUN = { all: ['asset', 'assets'], characters: ['character', 'characters'], objects: ['object', 'objects'], images: ['image', 'images'], tilesets: ['tileset', 'tilesets'], tiles: ['tile', 'tiles'], maps: ['map', 'maps'], ui: ['UI asset', 'UI assets'] };
const SIZES = ['S', 'M', 'L', 'XL'], SIZE_NAME = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra large' };
const MIN_CELL = { S: 72, M: 104, L: 144, XL: 272 }, CAPTION = { S: 0, M: 24, L: 44, XL: 44 };
const SORTS = { newest: 'Newest', oldest: 'Oldest', az: 'Name A–Z', za: 'Name Z–A', largest: 'Largest', smallest: 'Smallest', updated: 'Recently updated' };
const PL = 'https://www.pixellab.ai';
const PREVIEW_CAP = 8;                                                          // F-9

const cards = [], cardByKey = new Map(), idToCard = new Map(), groups = {};
const pending = D.assets.filter(a => TYPES[a.type] && a.status !== 'completed');   // feed the "2 generating ↗" chip (B-19)
D.assets.forEach(a => {
  if (!TYPES[a.type] || a.status !== 'completed') return;                        // R-5 drops vfx + font
  if (a.type === 'character') { const g = a.meta.group_id || a.id; (groups[g] = groups[g] || []).push(a); }
  else addCard([a]);
});
Object.keys(groups).forEach(g => addCard(groups[g].sort((x, y) => (x.meta.state_name ? 1 : 0) - (y.meta.state_name ? 1 : 0) || x.createdAt.localeCompare(y.createdAt))));
function addCard(states) {
  const a = states[0], T = TYPES[a.type], m = a.meta || {};
  const c = {
    key: key12(a.type + ':' + a.id), a, states, type: a.type, T, title: a.name,
    state: a.type === 'character' ? null : m.state_name || null,
    anims: a.animations || [], frames: (a.frames || []).length,
    dirs: Object.keys(a.directions || {}).filter(d => d !== 'unknown'),
    date: a.type === 'map' ? null : a.createdAt,                                   // maps have no date (02 §5.8)
    area: a.width * a.height,
    updated: states.reduce((u, s) => (s.updatedAt || '') > u ? s.updatedAt : u, ''),
    tags: Array.from(new Set(states.flatMap(s => s.tags || [])))
  };
  c.caption = c.title + (c.state ? ' · ' + c.state : '');
  c.animated = c.anims.length > 0 || c.frames > 1;
  const sx = states.flatMap(s => [s.type === 'map' ? '' : s.prompt, s.meta && s.meta.state_name, s.meta && s.meta.view, s.meta && s.meta.template_id]);
  c.typeWords = norm(T.label + ' ' + T.chip).split(/\s+/);   // matched by word prefix: "mage" must not hit "image"
  c.search = norm([c.title, `${a.width}x${a.height}`, `${a.width}×${a.height}`, m.lower_description, m.upper_description,
    m.transition_description, m.tile_type && m.tile_type.replace('_', ' '), m.tile_shape, m.description, c.frames > 1 && 'animated'].concat(sx).filter(Boolean).join(' '));
  cards.push(c); cardByKey.set(c.key, c); states.forEach(s => idToCard.set(s.id, c));
}
const IDLE = (cards.find(c => c.title === 'Goblin Brute Idle') || cards[0]).a;   // F-14 empty-state sprite

// ===================== state =====================
const defaultSize = () => innerWidth < 840 || innerHeight < 480 ? 'M' : 'L';     // F-13: compact height defaults to M
const storedPreviews = store.get('previews', null);                             // explicit user choice only (F-9)
const S = {
  connected: false, view: 'library', folderId: null, type: 'all', q: '', keepQ: false,
  sort: SORTS[store.get('sort')] ? store.get('sort') : 'newest',
  size: SIZES.includes(P.get('size')) ? P.get('size') : SIZES.includes(store.get('size')) ? store.get('size') : defaultSize(),
  previews: P.has('previews') ? P.get('previews') === '1' : storedPreviews != null ? storedPreviews : !reduced() && !(navigator.connection && navigator.connection.saveData),
  theme: P.get('theme') || store.get('theme', 'system'), sbc: store.get('sbc', false),
  selecting: false, sel: new Set(), anchor: null, focusKey: null, cols: 3,
  favorites: new Set(), favMissing: 0, folders: [],
  loaded: new Set(cards.map(c => c.key)), fresh: new Set(), seenChips: new Set(cards.map(c => c.T.chip)),
  syncing: false, syncPer: {}, lastSync: Date.now(),
  flags: {}, backdrop: store.get('backdrop', 'theme'), shortcuts: store.get('shortcuts', true),
  remember: false, keepBanner: false, keepAnswered: store.get('keepAnswered', false), tipOff: false,
  fps: {}, exporting: null, mapShown: false, inspOff: false
};
D.favorites.forEach(id => { const c = idToCard.get(id); if (c) S.favorites.add(c.key); else S.favMissing++; });
S.folders = D.folders.map(f => {
  const keys = []; let missing = 0;
  f.assetIds.forEach(id => { const c = idToCard.get(id); if (!c) missing++; else if (!keys.includes(c.key)) keys.push(c.key); });
  return { id: key12('folder:' + f.id).slice(0, 10), name: f.name, keys, missing };
});
(P.get('flags') || '').split(',').filter(Boolean).forEach(f => { S.flags[f] = true; });

const card = k => cardByKey.get(k);
const curFolder = () => S.view === 'folder' ? S.folders.find(f => f.id === S.folderId) : null;
const sortedFolders = () => S.folders.slice().sort((x, y) => collator.compare(x.name, y.name));
const bottomCls = c => /character|object/.test(c.type) ? ' bottom' : '';
const favKeys = () => S.flags.emptyFav ? [] : Array.from(S.favorites);
const syncAgo = () => { const m = Math.floor((Date.now() - S.lastSync) / 60000); return m < 1 ? 'just now' : m + ' min ago'; };
const statusText = () => S.flags.offline ? 'Offline · saved library' : S.flags.rate ? 'PixelLab asked us to slow down. Continuing shortly…'
  : S.syncing ? `Syncing… ${S.loaded.size} of ~${cards.length}` : 'Synced ' + syncAgo();

function badge(c, full) {
  const a = c.a, m = a.meta || {};
  switch (c.type) {
    case 'character': {
      const d = c.dirs.length, n = c.anims.length, s = c.states.length;
      return full ? [d && d + ' dir', n && n + ' anim', s > 1 && s + ' states'].filter(Boolean).join(' · ') : (n ? n + ' anim' : d + ' dir');
    }
    case 'object': case 'map_object': {
      const parts = [c.dirs.length > 1 && c.dirs.length + ' dir', c.anims.length && c.anims.length + ' anim'].filter(Boolean);
      return full ? parts.join(' · ') : parts[0] || '';
    }
    case 'creator_image': return c.frames > 1 ? c.frames + ' frames' : '';
    case 'tileset_topdown': case 'tileset_sidescroller': { const n = a.grid.cols * a.grid.rows; return full ? `${n} tiles · ${a.tileSize} px` : `${n} tiles`; }
    case 'tiles_pro': return full ? `${m.n_tiles} variations · ${a.tileSize} px` : `${m.n_tiles} var`;
    case 'tile_isometric': return full ? `${cap1(m.tile_shape)} · ${m.size} px` : `${m.size} px`;
    case 'map': return full ? `${a.grid.cols} × ${a.grid.rows} cells` : `${a.grid.cols}×${a.grid.rows}`;
    case 'ui_asset': return full ? `${a.width} × ${a.height}` : '';
  }
  return '';
}
const cardName = c => [c.caption, c.T.label.toLowerCase(), badge(c, true), S.favorites.has(c.key) && 'favorite', S.sel.has(c.key) && 'selected'].filter(Boolean).join(', ');

// ===================== list: filter / search / sort =====================
function baseList() {
  let L = cards.filter(c => S.loaded.has(c.key));
  if (S.flags.empty) L = [];
  if (S.flags.gate) L = L.filter(c => c.type !== 'creator_image');
  if (S.view === 'favorites') { const f = new Set(favKeys()); L = L.filter(c => f.has(c.key)); }
  else if (S.view === 'folder') { const f = new Set((curFolder() || { keys: [] }).keys); L = L.filter(c => f.has(c.key)); }
  return L;
}
function matcher(q) {
  const terms = norm(q).split(/\s+/).filter(Boolean);
  return c => terms.every(t => t[0] === '#' ? c.tags.includes(t.slice(1)) : c.search.includes(t) || c.typeWords.some(w => w.startsWith(t)));
}
function sorter() {
  const s = S.sort === 'updated' && S.type !== 'characters' ? 'newest' : S.sort;   // UX-28: Characters only
  const newest = (x, y) => (y.date ? 1 : 0) - (x.date ? 1 : 0) || (y.date || '').localeCompare(x.date || '');
  return {
    newest,
    oldest: (x, y) => (y.date ? 1 : 0) - (x.date ? 1 : 0) || (x.date || '').localeCompare(y.date || ''),
    az: (x, y) => collator.compare(x.caption, y.caption), za: (x, y) => collator.compare(y.caption, x.caption),
    largest: (x, y) => y.area - x.area || newest(x, y), smallest: (x, y) => x.area - y.area || newest(x, y),
    updated: (x, y) => y.updated.localeCompare(x.updated)
  }[s];
}
function viewList() {
  let L = baseList();
  if (S.type !== 'all') L = L.filter(c => c.T.chip === S.type);
  if (S.q.trim()) L = L.filter(matcher(S.q));
  return L.sort(sorter());
}
// Chips appear when their first asset arrives and never disappear mid-session (R2 #12).
function visibleChips() {
  if (S.view === 'library') return CHIPS.filter(([id]) => id === 'all' || (!S.flags.empty && (S.seenChips.has(id) || (id === 'images' && S.flags.gate))));
  const present = new Set(baseList().map(c => c.T.chip));
  return CHIPS.filter(([id]) => id === 'all' || present.has(id));
}

// ===================== routing (path first: #/characters/a/<key>?dir=east) =====================
function parentPath() {
  const t = S.type !== 'all' ? '/' + S.type : '';
  if (S.view === 'folders') return '/folders';
  if (S.view === 'favorites') return '/favorites' + t;
  if (S.view === 'folder') return '/folder/' + S.folderId + t;
  return t || '/';
}
function qs(extra) {
  const q = new URLSearchParams();
  Object.keys(extra || {}).forEach(k => { if (extra[k] != null) q.set(k, extra[k]); });
  const s = q.toString(); return s ? '?' + s : '';
}
const parentHash = () => '#' + parentPath();
const viewerHash = (c, extra) => { const p = parentPath(); return '#' + (p === '/' ? '' : p) + '/a/' + c.key + qs(extra); };
function parseHash(hs) {
  const h = (hs != null ? hs : location.hash).slice(1) || '/', i = h.indexOf('?');
  const path = i < 0 ? h : h.slice(0, i), q = new URLSearchParams(i < 0 ? '' : h.slice(i + 1));
  const m = path.match(/^(.*?)\/a\/([\w-]{12})$/);
  const seg = ((m ? m[1] : path) || '/').split('/').filter(Boolean);
  let view = 'library', fid = null, type = seg[0];
  if (seg[0] === 'folders') view = 'folders';
  else if (seg[0] === 'favorites') { view = 'favorites'; type = seg[1]; }
  else if (seg[0] === 'folder') { view = 'folder'; fid = seg[1]; type = seg[2]; }
  return { view, fid, type: TYPE_IDS.includes(type) ? type : 'all', key: m && m[2], q };
}
function applyRoute(fromEvent) {
  if (!S.connected) return;
  const r = parseHash();
  let view = r.view, fid = r.fid;
  if (view === 'folder' && !S.folders.some(f => f.id === fid)) { view = 'folders'; fid = null; }
  if (view !== S.view || fid !== S.folderId) {
    S.view = view; S.folderId = fid; S.type = r.type;
    if (!S.keepQ) { S.q = ''; endSearch(); } S.keepQ = false;
    renderAll(); $('#main').scrollTop = 0;
    if (fromEvent && !r.key) focusH1();
  } else if (r.type !== S.type) { S.type = r.type; updateResult(); renderContent(); }
  if (r.key) {
    const c = card(r.key);
    if (c) { if (!V.open || V.card !== c) openViewer(c, r.q, !!fromEvent); }
    else { toast("That asset isn't in this library."); history.replaceState(null, '', parentHash()); }
  } else if (V.open) closeViewer();
  updateTitle();
}
function go(hash, q) { if (q != null) { S.q = q; S.keepQ = true; } if (location.hash === hash) applyRoute(true); else location.hash = hash; }
function updateTitle() {
  const f = curFolder();
  document.title = (V.open ? V.card.title : !S.connected ? 'Connect' : S.view === 'folders' ? 'Folders' : S.view === 'favorites' ? 'Favorites' : f ? f.name : 'Library') + ' · Vitrine';
}
const focusH1 = () => { const h = $('#h1'); if (h) h.focus({ preventScroll: true }); };

// ===================== render: nav, header =====================
function renderAll() { renderNav(); renderHeader(); renderContent(); renderPane(); renderSelbar(); updateTitle(); }
function renderNav() {
  const cur = b => b ? ' aria-current="page"' : '';
  document.documentElement.classList.toggle('sb-collapsed', S.sbc);
  $('#nav').innerHTML = `
  <div class="nav-head"><span class="wordmark">${MARK}<span>Vitrine</span></span>
    <button class="btn icon" data-act="sb-toggle" aria-label="${S.sbc ? 'Expand' : 'Collapse'} sidebar">${ic(S.sbc ? 'panel-left-open' : 'panel-left-close')}</button></div>
  <div class="nav-dest"><a class="nav-i" href="#/"${cur(S.view === 'library')}>${ic('layout-grid')}<span>Library</span></a>
  <a class="nav-i" href="#/folders"${cur(S.view !== 'library')}>${ic('folders')}<span>Folders</span></a></div>
  <div class="nav-sec"><div class="sec-label">Folders</div>
    <a class="row-i" href="#/favorites"${cur(S.view === 'favorites')}>${ic('heart')}<span class="lbl">Favorites</span><span class="n">${favKeys().length}</span></a>
    ${sortedFolders().map(f => `<a class="row-i" href="#/folder/${f.id}"${cur(S.view === 'folder' && S.folderId === f.id)}>${ic('folder')}<span class="lbl">${esc(f.name)}</span><span class="n">${f.keys.length}</span></a>`).join('')}
    <button class="row-i" data-act="new-folder">${ic('plus')}<span class="lbl">New folder</span></button></div>
  <div class="nav-spacer"></div>
  <button class="nav-i nav-search" data-act="search-open" aria-label="Search">${ic('search')}<span>Search</span></button>
  <button class="nav-i nav-select" data-act="select" aria-pressed="${S.selecting}">${ic('square-check')}<span>Select</span></button>
  <div class="nav-foot"><button class="sync" data-act="sync-pop" aria-haspopup="dialog">${esc(statusText())}</button>
    <button class="nav-i" data-act="settings">${ic('settings')}<span>Settings</span></button>
    <p class="disc">Unofficial · not affiliated with PixelLab</p></div>`;
}
function renderHeader() {
  const h = $('#hdr'), hub = S.view === 'folders', f = curFolder();
  const title = hub ? 'Folders' : S.view === 'favorites' ? 'Favorites' : f ? f.name : 'Library';
  if (!visibleChips().some(c => c[0] === S.type)) S.type = 'all';
  h.classList.toggle('is-hub', hub);
  const fh = $('#fhead'); fh.hidden = !f;
  fh.innerHTML = f ? `<a class="btn icon back-btn" href="#/folders" aria-label="Back to Folders">${ic('chevron-left')}</a>
    <h1 id="h1" tabindex="-1">${esc(f.name)}</h1><span class="tb-count">${plural(f.keys.length, 'asset')}</span><span class="grow"></span>
    <button class="btn ghost" data-act="folder-download">${ic('download')}<span class="lbl">Download</span></button>
    <button class="btn icon" data-act="folder-menu" data-fid="${f.id}" aria-label="Folder actions" aria-haspopup="menu">${ic('ellipsis')}</button>` : '';
  h.innerHTML = `
  <div class="tb-title">${f ? '' : `<h1 id="h1" tabindex="-1">${esc(title)}</h1>`}
    ${hub ? `<button class="btn ghost" data-act="new-folder">${ic('folder-plus')}<span>New folder</span></button>` : ''}</div>
  ${hub ? '' : `
  <div class="search" role="search">${ic('search')}
    <input id="q" type="search" value="${esc(S.q)}" placeholder="Search ${baseList().length} assets" aria-label="Search assets" autocomplete="off" spellcheck="false" enterkeyhint="search">
    <span class="kbd" aria-hidden="true">/</span>
    <button class="btn icon" data-act="q-clear" aria-label="Clear search"${S.q ? '' : ' hidden'}>${ic('x')}</button>
    <button class="btn s-cancel" data-act="search-cancel">Cancel</button></div>
  <div class="tools">
    <button class="btn sort-btn" data-act="sort-menu" aria-haspopup="menu" aria-label="Sort: ${SORTS[S.sort]}">${ic('arrow-down-up')}<span class="lbl">${SORTS[S.sort]}</span></button>
    <div class="seg sizer" role="radiogroup" aria-label="Grid size">${SIZES.map(s => `<button role="radio" aria-checked="${S.size === s}" tabindex="${S.size === s ? 0 : -1}" data-act="size-set" data-v="${s}" aria-label="${SIZE_NAME[s]}" title="${SIZE_NAME[s]}">${s}</button>`).join('')}</div>
    <button class="btn h-prev" data-act="previews" aria-pressed="${S.previews}">${ic('circle-play')}<span>Play previews</span></button>
    <button class="btn h-view" data-act="view-menu" aria-haspopup="dialog">${ic('arrow-down-up', 'sm')}<span>View</span></button>
    <button class="btn icon h-more" data-act="more" aria-label="More" aria-haspopup="menu">${ic('ellipsis')}</button>
  </div>
  <button class="btn h-select" data-act="select" aria-pressed="${S.selecting}">${ic('square-check')}<span>${S.selecting ? 'Done' : 'Select'}</span></button>
  <div class="chips" id="chips" role="radiogroup" aria-label="Asset type"></div>
  <div class="result" id="result"></div>`}
  <button class="btn icon h-settings" data-act="settings" aria-label="Settings">${ic('settings')}</button>`;
  updateResult();
}
function updateResult() {
  const ch = $('#chips'), r = $('#result');
  if (!ch) return;
  if (!visibleChips().some(c => c[0] === S.type)) S.type = 'all';
  ch.innerHTML = visibleChips().map(([id, l]) => {
    const on = S.type === id;
    return `<button class="chip" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-act="chip" data-type="${id}"${id === 'images' ? ' title="Creator gallery"' : ''}>${on ? ic('check', 'sm') : ''}${l}</button>`;
  }).join('');
  r.innerHTML = resultHTML();
  const rl = $('#rline'); if (rl) rl.innerHTML = resultHTML() + VIEW_BTN;
  const q = $('#q'); if (q) q.placeholder = `Search ${baseList().length} assets`;
}
// Result + status line. Phones show it as the first line of the grid (it scrolls away) instead of squeezing the toolbar.
function resultHTML() {
  const n = viewList().length, nn = NOUN[S.type], lib = S.view === 'library';
  const bar = S.syncing && !S.flags.rate ? `<span class="syncbar" aria-hidden="true"><i style="width:${Math.round(S.loaded.size / cards.length * 100)}%"></i></span>` : '';
  return `<span class="count">${plural(n, nn[0], nn[1])}${S.type === 'images' ? ' from your Creator gallery' : ''}</span>
    ${lib ? `<span aria-hidden="true">·</span><button class="status" data-act="sync-pop" aria-haspopup="dialog">${bar}${esc(statusText())}</button>` : ''}
    ${lib && S.flags.partial ? `<button class="pchip warn" data-act="sync-pop">${ic('triangle-alert', 'xs')}Some assets didn't load</button>` : ''}
    ${lib && pending.length && !S.syncing && !S.flags.empty ? `<button class="pchip" data-act="inprog" aria-haspopup="dialog" aria-label="${pending.length} generating in PixelLab">${ic('loader-circle', 'xs')}${pending.length} generating ↗</button>` : ''}`;
}
// Phone: the result line scrolls with the grid and carries the View button (Sort, Grid size, Play previews) (E-8).
const VIEW_BTN = `<button class="btn ghost rl-view" data-act="view-menu" aria-haspopup="dialog">${ic('arrow-down-up', 'sm')}<span>View</span></button>`;

// ===================== render: content =====================
const idleHTML = () => `<span class="stage idle" aria-hidden="true"><span class="art"><canvas class="idle-cv" width="${IDLE.width}" height="${IDLE.height}"></canvas></span></span>`;
const emptyHTML = (title, body, acts, extra) => `<div class="empty">${idleHTML()}<h2>${title}</h2>${body ? `<p>${body}</p>` : ''}${extra || ''}${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
const extLink = (href, label, cls, extra) => `<a class="${cls == null ? 'btn ghost' : cls}" href="${href}" target="_blank" rel="noopener noreferrer"${extra || ''}>${label}<span class="vh"> (opens PixelLab in a new tab)</span></a>`;
const banner = (icon, html, cls) => `<div class="banner${cls ? ' ' + cls : ''}" role="status">${ic(icon)}<span class="grow">${html}</span></div>`;
const keepBannerHTML = () => `<div class="banner keep" role="region" aria-label="Stay signed in">${ic('key-round')}<span class="grow"><b>Keep me signed in on this device?</b> You won't need to paste your API key again in this browser. Don't use this on a shared computer.</span>
  <span class="acts"><button class="btn ghost" data-act="keep-yes">Keep me signed in</button><button class="btn" data-act="keep-no">Not now</button></span></div>`;

function renderContent(keepFocus) {
  const el = $('#content');
  const fk = keepFocus && document.activeElement && document.activeElement.closest && document.activeElement.closest('.card');
  stopAllPreviews(); stopIdle();
  if (S.view === 'folders') { el.innerHTML = foldersHTML(); fitIn(el); mountIdle(el); return; }
  let h = `<div class="result rline" id="rline">${resultHTML()}${VIEW_BTN}</div>`;
  if (S.flags.cors) h += emptyHTML('PixelLab is blocking this browser.', 'PixelLab may have changed how its API works with websites. Nothing is wrong with your account.', '<button class="btn primary" data-act="retry">Try again</button>');
  else if (S.flags.offlineEmpty) h += emptyHTML("You're offline.", 'Connect to the internet to load your PixelLab library.', '<button class="btn primary" data-act="retry">Try again</button>');
  else {
    if (S.keepBanner && S.view === 'library') h += keepBannerHTML();
    if (S.flags.offline) h += banner('wifi-off', "You're offline. Showing your saved library.");
    const f = curFolder(), miss = S.view === 'favorites' ? S.favMissing : f ? f.missing : 0;
    if (miss && !S.syncing) h += banner('triangle-alert', `${plural(miss, 'item')} in ${f ? 'this folder' : 'Favorites'} ${miss === 1 ? "isn't" : "aren't"} in your PixelLab library anymore. <button class="btn link" data-act="rm-missing">Remove them</button>`);
    const L = viewList();
    if (S.type === 'images' && S.flags.gate) h += emptyHTML("Creator images aren't available yet.", 'The only public way to read them might also save data to your account. Vitrine stays strictly view-only, so it leaves them out for now.', extLink(PL + '/create', 'Open your Creator gallery in PixelLab ↗'));
    else if (!L.length && S.q.trim()) {
      const chip = S.type !== 'all' ? ' in ' + CHIPS.find(c => c[0] === S.type)[1] : '';
      const notes = [(S.type === 'all' || S.type === 'images') && "Image descriptions from PixelLab are shortened, so some words can't be found.", S.syncing && 'Still syncing, more may appear.'].filter(Boolean);
      h += emptyHTML(`No matches for “${esc(S.q.trim())}”${chip}.`, 'Try fewer words, or search all types.',
        `<button class="btn ghost" data-act="q-clear">Clear search</button>${S.type !== 'all' ? '<button class="btn primary" data-act="search-all">Search all types</button>' : ''}`,
        notes.map(n => `<p class="faint">${n}</p>`).join(''));
    } else if (!L.length && !S.syncing) {
      if (S.view === 'favorites') h += emptyHTML('No favorites yet.', 'Use the heart on any asset to keep it here.');
      else if (f) h += emptyHTML('This folder is empty.', 'Select assets in your library, then choose Add to folder.', '<a class="btn primary" href="#/">Go to Library</a>');
      else h += emptyHTML('Nothing here yet.', "Create something in PixelLab and it'll show up here.", extLink(PL, 'Open PixelLab ↗') + '<button class="btn primary" data-act="sync-now">Sync again</button>');
    } else h += gridHTML(L);
  }
  el.innerHTML = h;
  layoutGrid(); observePreviews(); mountIdle(el); showDeferredMap();
  if (S.selecting) renderSelbar();                          // refresh "N hidden by filter"
  if (fk) focusCard(fk.dataset.key, false);
}
function gridHTML(L) {
  if (!L.some(c => c.key === S.focusKey)) S.focusKey = L.length ? L[0].key : null;
  const mixed = S.view !== 'library' || S.type === 'all', n = L.length, nn = NOUN[S.type];
  let h = `<ul class="grid" id="grid" role="list" data-size="${S.size}" aria-label="Assets">` + L.map((c, i) => cardHTML(c, i, n, mixed)).join('');
  if (S.syncing) h += '<li class="cell skel" aria-hidden="true"><span class="stage"></span><span class="cap"><i></i></span></li>'.repeat(Math.max(0, S.cols * 3 - n));
  const other = S.view === 'library' && S.type === 'all' && !S.q.trim()
    ? `<span class="other">Other PixelLab content isn't in the public API yet, so fonts, effects, portraits and talking animations stay in PixelLab. ${extLink(PL, 'Open PixelLab ↗', 'linkish')}</span>` : '';
  return h + '</ul>' + (S.syncing ? '' : `<p class="endline"><span>That's everything · ${plural(n, nn[0], nn[1])}</span>${other}</p>`);
}
function cardHTML(c, i, n, mixed) {
  const b = S.size === 'M' ? badge(c, false) : badge(c, true), fav = S.favorites.has(c.key), sel = S.sel.has(c.key);
  const defer = c.type === 'map' && !S.mapShown;          // R-6: map thumbnails render lazily (title first)
  return `<li class="cell${sel ? ' sel' : ''}${S.fresh.has(c.key) ? ' fresh' : ''}" role="listitem" aria-setsize="${n}" aria-posinset="${i + 1}">
  <a class="card" href="${viewerHash(c)}" data-key="${c.key}" tabindex="${c.key === S.focusKey ? 0 : -1}" aria-label="${esc(cardName(c))}" draggable="false"${fine() ? ` title="${esc(c.caption)}"` : ''}>
    <span class="stage"><span class="art${bottomCls(c)}"><img ${defer ? 'data-src' : 'src'}="${esc(c.a.thumb)}" alt="" width="0" height="0" draggable="false"></span>${defer ? `<span class="ph">${esc(c.title)}</span>` : ''}
      ${fav ? `<span class="favdot">${ic('heart', 'filled')}</span>` : ''}
      ${b || mixed ? `<span class="badge">${mixed ? ic(c.T.glyph) : ''}${c.animated ? ic('play', 'filled') : ''}<span class="bt">${esc(b)}</span></span>` : ''}
      <span class="fitm" title="Shown smaller than actual size">${ic('shrink')}</span></span>
    <span class="cap"><span class="t">${esc(c.caption)}</span><span class="s">${esc(c.T.label)} · ${c.a.width}×${c.a.height}</span></span>
  </a>
  <button class="cb" tabindex="-1" data-act="card-check" data-key="${c.key}" role="checkbox" aria-checked="${sel}" aria-label="Select ${esc(c.caption)}">${ic('check')}</button>
  <button class="hb" tabindex="-1" data-act="fav" data-key="${c.key}" aria-pressed="${fav}" aria-label="Favorite ${esc(c.caption)}">${ic('heart', fav ? 'filled' : '')}</button>
  <button class="mb" tabindex="-1" data-act="card-menu" data-key="${c.key}" aria-label="More actions for ${esc(c.caption)}" aria-haspopup="menu">${ic('ellipsis')}</button></li>`;
}
function showDeferredMap() {
  const img = $('#grid img[data-src]');
  if (img) setTimeout(() => { if (!img.isConnected) return; img.src = img.dataset.src; img.removeAttribute('data-src'); S.mapShown = true; }, 900);
}
function updateCard(key) {
  const a = key && $(`#content .card[data-key="${key}"]`); if (!a) return;
  const c = card(key), cell = a.parentNode, sel = S.sel.has(key), fav = S.favorites.has(key);
  cell.classList.toggle('sel', sel); cell.classList.remove('fresh');
  a.setAttribute('aria-label', cardName(c));
  cell.querySelector('.cb').setAttribute('aria-checked', sel);
  const hb = cell.querySelector('.hb'); hb.setAttribute('aria-pressed', fav); hb.innerHTML = ic('heart', fav ? 'filled' : '');
  const fd = cell.querySelector('.favdot');
  if (fav && !fd) a.querySelector('.stage').insertAdjacentHTML('beforeend', `<span class="favdot">${ic('heart', 'filled')}</span>`);
  else if (!fav && fd) fd.remove();
}
function focusCard(key, scroll) {
  const a = key && $(`#content .card[data-key="${key}"]`); if (!a) return focusH1();
  $$('#content .card[tabindex="0"]').forEach(x => { x.tabIndex = -1; });
  a.tabIndex = 0; S.focusKey = key;
  if (scroll) a.scrollIntoView({ block: 'nearest' });
  a.focus({ preventScroll: true });
}

// Folders hub: Favorites pinned first, folders A–Z, 2×2 cover mosaics (from B).
function mosaic4(keys, glyph) {
  if (!keys.length) return `<span class="glyph">${ic(glyph)}</span>`;
  const recent = keys.slice(-4).reverse().map(card);
  return [0, 1, 2, 3].map(i => recent[i] ? `<span class="q"><span class="art${bottomCls(recent[i])}"><img src="${esc(recent[i].a.thumb)}" alt="" width="0" height="0"></span></span>` : '<span class="q blank"></span>').join('');
}
function foldersHTML() {
  const tile = (href, name, keys, menu, glyph, pin) => `<li class="fcard"><a class="ftile" href="${href}"><span class="mosaic4">${mosaic4(keys, glyph)}</span>
    <span class="nm">${pin ? ic('heart', 'filled') : ''}<span>${esc(name)}</span></span><span class="ct">${plural(keys.length, 'asset')}</span></a>${menu}</li>`;
  const tip = (!S.tipOff && (S.folders.length || S.favorites.size >= 5)) || S.flags.tip ? `<div class="tip" role="note"><p>Your folders and favorites live only in this browser, and browsers sometimes clear site data. Download a backup to keep them safe.</p>
    <div class="row"><button class="btn ghost" data-act="backup">${ic('download', 'sm')}Download backup</button><button class="btn" data-act="tip-off">Not now</button></div></div>` : '';
  const fs = S.flags.noFolders ? [] : sortedFolders();
  return `<div class="hub">${tip}
    <ul class="cgrid">${tile('#/favorites', 'Favorites', favKeys(), '', 'heart', true)}
    ${fs.map(f => tile('#/folder/' + f.id, f.name, f.keys, `<button class="btn icon mb2" data-act="folder-menu" data-fid="${f.id}" aria-label="Actions for ${esc(f.name)}" aria-haspopup="menu">${ic('ellipsis')}</button>`, 'folder')).join('')}
      <li class="fcard new"><button class="ftile" data-act="new-folder"><span class="mosaic4">${ic('folder-plus')}</span><span class="nm"><span>New folder</span></span><span class="ct">&nbsp;</span></button></li></ul>
    ${fs.length ? '' : '<p class="muted">Group assets by game or project. Folders live in this browser only.</p>'}</div>`;
}

// ===================== art fitting (integer device-pixel scale) =====================
function sizeArt(el, nw, nh, w, h) {
  const r = integerScale(nw, nh, w, h, devicePixelRatio || 1); if (!r) return;
  el.style.width = r.cssW + 'px'; el.style.height = r.cssH + 'px';
  el.classList.toggle('smooth', r.smooth);
  const st = el.closest('.stage'); if (st) st.classList.toggle('is-fit', r.smooth);
}
function fitIn(root) {
  if (!root) return;
  const els = $$('.art > img, .art > canvas', root).filter(e => !e.hidden && (e.naturalWidth || (e.tagName === 'CANVAS' && e.width)));
  const boxes = els.map(e => [e.parentNode.clientWidth, e.parentNode.clientHeight]);   // read all, then write
  els.forEach((e, i) => sizeArt(e, e.naturalWidth || e.width, e.naturalHeight || e.height, boxes[i][0], boxes[i][1]));
}
document.addEventListener('load', e => {
  const t = e.target;
  if (t.tagName !== 'IMG' || !t.parentNode || !t.parentNode.classList || !t.parentNode.classList.contains('art')) return;
  const ph = t.closest('.stage') && t.closest('.stage').querySelector('.ph'); if (ph) ph.remove();
  sizeArt(t, t.naturalWidth, t.naturalHeight, t.parentNode.clientWidth, t.parentNode.clientHeight);
}, true);
function layoutGrid() {
  const g = $('#grid'); if (!g) return;
  const cs = getComputedStyle(g), gap = parseFloat(cs.columnGap) || 8;
  const W = g.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
  const cols = Math.min(16, Math.max(1, Math.floor((W + gap) / (MIN_CELL[S.size] + gap))));   // 04 §0.5
  const cell = (W - (cols - 1) * gap) / cols, rem = parseFloat(getComputedStyle(document.documentElement).fontSize) / 16;
  g.style.setProperty('--cols', cols); g.style.setProperty('--row', (cell + CAPTION[S.size] * rem) + 'px');   // caption grows with text size
  S.cols = cols; g.dataset.cols = cols;
  fitIn(g);
}
function refitAll() { layoutGrid(); fitIn($('#pane')); fitIn($('#v-film')); if (S.view === 'folders') fitIn($('#content')); fitIn($('.empty')); if (V.open) fitStage(); }
// F-13: refit on DPR change (resolution query) and on resize when the DPR moved without firing it.
let lastDpr = devicePixelRatio;
(function watchDpr() { matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener('change', () => { lastDpr = devicePixelRatio; refitAll(); watchDpr(); }, { once: true }); })();

// ===================== previews (F-9: default on, in view, ≤ 8 at once) =====================
const previews = new Map();
let io = null; const inView = new Set();
function previewSrcs(c) {
  if (c.frames > 1) return c.a.frames;
  if (!c.anims.length) return null;
  const an = c.anims[Math.max(0, c.anims.findIndex(x => /idle|breath/i.test(x.name)))];
  return an.frames.south || an.frames[Object.keys(an.frames)[0]];
}
function startPreview(art, c) {
  const srcs = previewSrcs(c), img = art && art.querySelector('img');
  if (!srcs || !img || previews.has(art)) return;
  if (!img.naturalWidth) { img.addEventListener('load', () => startPreview(art, c), { once: true }); return; }
  const cv = document.createElement('canvas'), frames = srcs.map(s => { const i = new Image(); i.src = s; return i; });
  const p = { cv, player: null }; previews.set(art, p);
  Promise.all(frames.map(f => f.decode().catch(() => {}))).then(() => {
    if (previews.get(art) !== p) return;
    cv.width = frames[0].naturalWidth; cv.height = frames[0].naturalHeight;
    const ctx = cv.getContext('2d'); ctx.imageSmoothingEnabled = false;
    const draw = i => { ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(frames[i], 0, 0); };
    draw(0); img.hidden = true; art.appendChild(cv);
    sizeArt(cv, cv.width, cv.height, art.clientWidth, art.clientHeight);
    p.player = PixelTicker.player(Array(frames.length).fill(1000 / fpsOf(c.anims.length ? c.anims[0].id : c.key)), draw);
    p.player.play();
  });
}
function stopPreview(art) {
  const p = art && previews.get(art); if (!p) return;
  previews.delete(art); if (p.player) p.player.stop(); p.cv.remove();
  const img = art.querySelector('img'); if (img) img.hidden = false;
}
function stopAllPreviews() { Array.from(previews.keys()).forEach(stopPreview); }
const artOf = cell => cell.querySelector('.art');
const cellCard = cell => { const k = cell.querySelector('[data-key]'); return k ? card(k.dataset.key) : null; };
function observePreviews() {
  if (io) io.disconnect(); inView.clear();
  if (!S.previews) return;
  io = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) inView.add(e.target); else { inView.delete(e.target); stopPreview(artOf(e.target)); } });
    fillPreviews();
  });
  $$('#grid .cell').filter(cell => { const c = cellCard(cell); return c && c.animated; }).forEach(cell => io.observe(cell));
}
function fillPreviews() {
  if (!S.previews || V.open || document.hidden) return;
  Array.from(inView).filter(x => x.isConnected)
    .sort((x, y) => x.compareDocumentPosition(y) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)
    .forEach(cell => { if (previews.size < PREVIEW_CAP) startPreview(artOf(cell), cellCard(cell)); });
}
function setPreviews(on) {
  S.previews = on; store.set('previews', on);                                    // explicit choice wins over reduced motion
  $$('[data-act="previews"]').forEach(b => b.setAttribute('aria-pressed', on));
  stopIdle(); mountIdle($('#content'));
  if (!on) stopAllPreviews();
  observePreviews();
  announce(on ? 'Previews playing' : 'Previews paused');
}
function hoverIn(cell) { clearTimeout(cell._t); cell._t = setTimeout(() => { const c = cellCard(cell); if (c && c.animated && previews.size < PREVIEW_CAP) startPreview(artOf(cell), c); }, 300); }
function hoverOut(cell) { clearTimeout(cell._t); if (!S.previews || !inView.has(cell)) stopPreview(artOf(cell)); }

// Empty-state idle sprite (F-14): a tiny looping character from the sample library; static under reduced motion.
let idleP = null;
function stopIdle() { if (idleP) { idleP.stop(); idleP = null; } }
function mountIdle(root) {
  stopIdle();
  const cv = root && $('.idle-cv', root); if (!cv) return;
  const srcs = IDLE.frames || [IDLE.thumb], imgs = srcs.map(s => { const i = new Image(); i.src = s; return i; }), ctx = cv.getContext('2d');
  Promise.all(imgs.map(i => i.decode().catch(() => {}))).then(() => {
    if (!cv.isConnected) return;
    ctx.imageSmoothingEnabled = false;
    const draw = i => { ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(imgs[i], 0, 0); };
    draw(0); sizeArt(cv, cv.width, cv.height, cv.parentNode.clientWidth, cv.parentNode.clientHeight);
    if (S.previews && !reduced() && imgs.length > 1) { idleP = PixelTicker.player(Array(imgs.length).fill(125), draw); idleP.play(); }
  });
}

// ===================== inspector (viewer Info panel; museum-label hierarchy from B) =====================
const DIR_AB = { south: 'S', south_east: 'SE', east: 'E', north_east: 'NE', north: 'N', north_west: 'NW', west: 'W', south_west: 'SW' };
const DIR_NAME = d => cap1(String(d).replace('_', '-'));
const stateLabel = s => s.meta && s.meta.state_name ? cap1(s.meta.state_name) : 'Base';
function dirsText(a) {
  const ks = Object.keys(DIR_AB).filter(d => a.directions && a.directions[d]);
  return ks.length > 1 ? `${ks.length} · ${ks.map(d => DIR_AB[d]).join(', ')}` : '1 (single view)';
}
function facts(c, a) {
  const m = a.meta || {}, d = Object.keys(a.directions || {}).filter(k => k !== 'unknown').length, n = (a.animations || []).length;
  switch (c.type) {
    case 'character': return [`${a.width} × ${a.height}`, plural(d, 'direction'), n ? plural(n, 'animation') : 'No animations yet', c.states.length > 1 && plural(c.states.length, 'state')].filter(Boolean).join(' · ');
    case 'object': case 'map_object': return [`${a.width} × ${a.height}`, d > 1 ? plural(d, 'direction') : 'Single view', n && plural(n, 'animation')].filter(Boolean).join(' · ');
    case 'creator_image': return `${a.width} × ${a.height}${c.frames > 1 ? ` · ${c.frames} frames` : ''}`;
    case 'tileset_topdown': case 'tileset_sidescroller': return `${m.total_tiles} tiles · ${a.tileSize} px tiles`;
    case 'tiles_pro': return `${m.n_tiles} variations · ${a.tileSize} px tiles`;
    case 'tile_isometric': return `${cap1(m.tile_shape)} · ${m.size} px`;
    case 'map': return `${a.grid.cols} × ${a.grid.rows} cells · ${a.width} × ${a.height} px`;
    default: return `${a.width} × ${a.height} px`;
  }
}
function fieldsFor(c, a, cx) {
  const m = a.meta || {}, F = [], row = (k, v) => { if (v != null && v !== '' && v !== false) F.push([k, v]); };
  const st = m.style_settings;
  const style = st && ['outline', 'shading', 'detail'].filter(k => st[k]).map(k => `${cap1(k)}: ${esc(cap1(st[k]))}`).join('<br>');
  const created = a.createdAt && dateFull.format(new Date(a.createdAt));
  const sz = (w, h) => `${w} × ${h} px`;
  const anims = (a.animations || []).map((an, i) => {
    const nd = Object.keys(an.frames).length;
    return `<button class="linkish" data-act="play-anim" data-key="${c.key}" data-i="${i}">${esc(an.name)} · ${an.frameCount} frames · ${plural(nd, 'direction')}</button>`;
  }).join('');
  const tags = c.tags.length ? c.tags.map(t => `<button class="tag" data-act="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join('') : '';
  const playback = () => {
    const k = cx.anim >= 0 && a.animations[cx.anim] ? a.animations[cx.anim].id : (a.animations && a.animations[0] ? a.animations[0].id : c.key), f = fpsOf(k);
    return (S.fps[k] ? `${f} fps (your speed) · <button class="linkish" style="display:inline" data-act="fps-reset" data-fk="${k}">Reset</button>` : '8 fps (default)')
      + '<span class="note">PixelLab doesn\'t say how fast animations play. 8 fps matches PixelLab\'s character and Creator players.</span>';
  };
  switch (c.type) {
    case 'character':
      if (c.states.length > 1) row('States', `${c.states.length} · ${c.states.map(s => esc(stateLabel(s))).join(', ')}`);
      row('Canvas', sz(a.width, a.height)); row('Directions', dirsText(a)); row('View', esc(cap1(m.view)));
      row('Animations', anims || (m.animation_count === 0 ? 'None yet' : '')); row('Style', style); row('Template', esc(cap1(m.template_id)));
      row('Tags', tags); row('Created', created);
      if (a.updatedAt && a.updatedAt.slice(0, 16) !== a.createdAt.slice(0, 16)) row('Updated', dateFull.format(new Date(a.updatedAt)));
      if (a.animations.length) row('Playback', playback());
      break;
    case 'object': case 'map_object':
      row('State', m.state_name && esc(cap1(m.state_name))); row('Canvas', sz(a.width, a.height)); row('Directions', dirsText(a));
      row('View', esc(cap1(m.view))); row('Animations', anims); row('Style', style); row('Tags', tags); row('Created', created);
      if ((a.animations || []).length) row('Playback', playback());
      break;
    case 'creator_image':
      row('Frame size', sz(a.width, a.height)); row('Frames', c.frames > 1 && String(c.frames));
      row('Created', dateDay.format(new Date(a.createdAt))); row('Made on', /^gallery:\d{13}$/.test(m.ref) ? 'PixelLab website' : 'PixelLab API');
      if (c.frames > 1) row('Playback', playback());
      break;
    case 'tileset_topdown':
      row('Terrains', `${esc(cap1(m.lower_description))} → ${esc(cap1(m.upper_description))} <button class="btn icon inl" data-act="copy-text" data-text="${esc([m.lower_description, m.upper_description, m.transition_description].join(', '))}" data-msg="Terrains copied" aria-label="Copy terrains">${ic('copy', 'sm')}</button>`);
      row('Transition', esc(cap1(m.transition_description))); row('Tile size', sz(a.tileSize, a.tileSize));
      row('Tiles', `${m.total_tiles} · ${a.grid.cols} × ${a.grid.rows} sheet`); row('View', esc(cap1(m.view)));
      row('Transition size', m.transition_size != null && String(m.transition_size)); row('Style', style); row('Created', created);
      break;
    case 'tileset_sidescroller':
      row('Terrain', `${esc(cap1(m.lower_description))} <button class="btn icon inl" data-act="copy-text" data-text="${esc(m.lower_description + '; ' + m.transition_description)}" data-msg="Terrain copied" aria-label="Copy terrain">${ic('copy', 'sm')}</button>`);
      row('Top edge', esc(cap1(m.transition_description))); row('Tile size', sz(a.tileSize, a.tileSize));
      row('Tiles', String(m.total_tiles)); row('View', 'Side (platformer)'); row('Created', created);
      break;
    case 'tile_isometric':
      row('Size', m.size + ' px'); row('Shape', esc(cap1(m.tile_shape))); row('Seed', `<span class="mono">${m.seed}</span>`); row('Created', created);
      break;
    case 'tiles_pro':
      row('Kind', esc(cap1(m.kind))); row('Tile type', esc(cap1(String(m.tile_type).replace('_', ' ').replace('topdown', 'top-down'))));
      row('Tile size', sz(a.tileSize, a.tileSize)); row('Variations', String(m.n_tiles)); row('View', esc(cap1(m.tile_view)));
      row('Seed', `<span class="mono">${m.seed}</span>`); row('Created', created);
      break;
    case 'map':
      row('Size', `${a.grid.cols} × ${a.grid.rows} cells · ${a.width} × ${a.height} px`); row('Tile size', m.tile_size + ' px');
      row('Terrains', esc((m.terrains || []).join(', '))); row('Painted cells', (m.painted_cells || 0).toLocaleString('en-US')); row('Placed objects', String(m.placements));
      break;
    case 'ui_asset':
      row('Size', sz(a.width, a.height)); row('Created', created);
      break;
  }
  return F;
}
// F-11 hand-offs: one labelled "Open in PixelLab ↗" plus a "More in PixelLab ▾" menu of tools (each may use credits).
function plinks(c) {
  const t = c.type, cost = 'May use PixelLab credits';
  // ponytail: mockup strips the {id} from 02 §3.11 routes (sample ids are fake); production appends the real id.
  const r = {
    character: ['/create-character', [['Animate in PixelLab', '/create-character', cost], ['New state in PixelLab', '/create-character', cost]]],
    object: ['/create-object', [['Animate in PixelLab', '/create-object', cost], ['New state in PixelLab', '/create-object', cost]]],
    map_object: ['/create-object', []],
    tileset_topdown: ['/maps/tilesets', []], tileset_sidescroller: ['/maps?tab=tilesets', []], tiles_pro: ['/maps/tiles', []],
    tile_isometric: ['/maps?tab=tiles', []], map: ['/maps', []], ui_asset: ['/create-ui', []],
    creator_image: ['/create', [['Edit in PixelLab', '/create?tool=edit_image', cost], ['Animate in PixelLab', '/create?tool=animate_with_text', cost], ['Rotate in PixelLab', '/create?tool=generate_8_rotations_v3', cost]]]
  }[t];
  return { open: PL + r[0], tools: r[1], hint: /tileset|tiles_pro|tile_isometric|^map$/.test(t) ? 'Opening in PixelLab may need a paid plan.' : '', copyImg: t === 'creator_image' || t === 'ui_asset' };
}
const copyAttr = pl => pl.copyImg ? ' data-act="copy-img"' : '';
function inspectorHTML(c, cx) {
  const a = cx.asset, m = a.meta || {}, fav = S.favorites.has(c.key), pl = plinks(c), items = dlItems(c, cx);
  const stateName = c.type === 'character' ? stateLabel(a) : m.state_name && cap1(m.state_name);
  const inF = S.folders.filter(f => f.keys.includes(c.key));
  const isDesc = /creator_image|tile_isometric|tiles_pro/.test(c.type);
  const prompt = /tileset|map$/.test(c.type) ? '' : (c.type === 'tile_isometric' ? m.description : a.prompt);
  return `<div class="insp">
  <header class="insp-h">
    <p class="kicker">${esc([c.T.label, stateName].filter(Boolean).join(' · '))}</p>
    <h2 class="insp-t">${esc(c.title)}</h2>
    <p class="facts">${esc(facts(c, a))}</p>
    <div class="handoff${pl.tools.length ? ' has-more' : ''}">${extLink(pl.open, 'Open in PixelLab ↗', 'btn ho-main', copyAttr(pl))}${pl.tools.length ? `<button class="btn icon ho-more" data-act="pl-menu" data-key="${c.key}" aria-haspopup="menu" aria-label="More in PixelLab" title="More in PixelLab">${ic('chevron-down', 'sm')}</button>` : ''}</div>
    ${pl.hint ? `<p class="tier">${pl.hint}</p>` : ''}
    <div class="acts-row" id="acts-row">
      <span class="dl-split"><button class="btn primary dl-main" data-act="dl-item" data-key="${c.key}" data-i="0">${ic('download')}<span>Download ${esc(items[0].short)}</span></button><button class="btn primary icon dl-btn" data-act="dl-menu" data-key="${c.key}" aria-haspopup="menu" aria-label="More download formats">${ic('chevron-down', 'sm')}</button></span>
      <button class="btn icon ghost" data-act="fav" data-key="${c.key}" aria-pressed="${fav}" aria-label="Favorite" title="Favorite (L)">${ic('heart', fav ? 'filled' : '')}</button>
      <button class="btn icon ghost" data-act="add-folder" data-key="${c.key}" aria-label="Add to folder" aria-haspopup="dialog" title="Add to folder">${ic('folder-plus')}</button>
    </div>
  </header>
  <section class="sec" aria-label="Download"><h3>Download</h3>
    <div class="dl-tiles${items.length === 1 ? ' one' : ''}">${items.map((it, i) => `<button class="dl-tile" data-act="dl-item" data-key="${c.key}" data-i="${i}"><b>${esc(it.label)}${ic('download')}</b><span>${esc(it.desc)}</span></button>`).join('')}</div>
    <button class="btn link more-opts" data-act="dl-more" data-key="${c.key}">Download options…</button></section>
  ${inF.length ? `<section class="sec"><h3>In folders</h3><div class="fchips">${inF.map(f => `<a class="fchip" href="#/folder/${f.id}">${ic('folder', 'xs')}${esc(f.name)}</a>`).join('')}</div></section>` : ''}
  ${prompt ? `<section class="sec"><h3>${isDesc ? 'Description' : 'Prompt'}<button class="btn" data-act="copy-text" data-text="${esc(prompt)}" data-msg="${isDesc ? 'Description' : 'Prompt'} copied">${ic('copy', 'sm')}<span>Copy</span></button></h3><div class="well">${esc(prompt)}</div></section>` : ''}
  <section class="sec"><h3>Details</h3><dl class="fields">${fieldsFor(c, a, cx).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl></section>
  <details class="tech"><summary>Technical details</summary>
    <dl class="fields"><dt>${c.type === 'creator_image' ? 'Gallery ref' : 'Asset ID'}</dt><dd class="mono">${masked(key12(a.type + ':' + a.id))}</dd><dt>Last synced</dt><dd>${syncAgo()}</dd></dl>
    <p class="warn-note">${ic('triangle-alert')}<span>Anyone with this ID can download this asset without signing in. Only share it with tools you trust.</span></p>
    <button class="btn ghost" data-act="copy-id">${ic('copy', 'sm')}Copy asset ID</button></details>
  </div>`;
}
function openPlMenu(anchor, c) {
  const pl = plinks(c);
  openPop(anchor, `<div class="ph2">More in PixelLab</div>` + pl.tools.map(([l, p, note]) =>
    extLink(PL + p, `${ic('external-link')}<span class="two"><b>${l} ↗</b><small>${note}</small></span>`, 'mi cost', ` role="menuitem"${copyAttr(pl)}`)).join(''), { role: 'menu', sheet: true, label: 'More in PixelLab' });
}

// ===================== selection (+ summary panel from C) =====================
function enterSelect() { if (!S.selecting) { S.selecting = true; renderSelbar(); renderPane(); announce(`Selection mode. ${S.sel.size} selected.`); } }
function exitSelect() {
  if (!S.selecting) return;
  const ks = Array.from(S.sel); S.selecting = false; S.sel.clear(); ks.forEach(updateCard);
  renderSelbar(); renderPane(); announce('Selection cleared');
  if (S.focusKey && !V.open && S.connected) focusCard(S.focusKey, false);
}
function toggleSel(key, force) {
  const was = S.selecting; S.selecting = true;
  const on = force != null ? force : !S.sel.has(key);
  if (on) S.sel.add(key); else S.sel.delete(key);
  S.anchor = key; updateCard(key);
  if (!S.sel.size) return exitSelect();
  renderSelbar(); renderPane();
  announce(was ? `${S.sel.size} selected` : `Selection mode. ${S.sel.size} selected.`);
}
function rangeSel(key) {
  const L = viewList().map(c => c.key), a = L.indexOf(S.anchor), b = L.indexOf(key);
  if (a < 0) return toggleSel(key, true);
  L.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(k => { S.sel.add(k); updateCard(k); });
  S.selecting = true; renderSelbar(); renderPane(); announce(`${S.sel.size} selected`);
}
function selectAll() { S.selecting = true; viewList().forEach(c => { S.sel.add(c.key); updateCard(c.key); }); renderSelbar(); renderPane(); announce(`${S.sel.size} selected`); }
const hiddenCount = () => { const vis = new Set(viewList().map(c => c.key)); return Array.from(S.sel).filter(k => !vis.has(k)).length; };
function renderSelbar() {
  const b = $('#selbar'); document.body.classList.toggle('selecting', S.selecting); b.hidden = !S.selecting || !S.connected;
  $$('[data-act="select"]').forEach(x => { x.setAttribute('aria-pressed', S.selecting); const l = x.querySelector('span'); if (l) l.textContent = S.selecting ? 'Done' : 'Select'; });
  if (!S.selecting) return;
  const hidden = hiddenCount(), n = S.sel.size, allFav = n > 0 && Array.from(S.sel).every(k => S.favorites.has(k)), dis = n ? '' : ' disabled';
  const fl = allFav ? 'Unfavorite' : 'Favorite';
  b.innerHTML = `<button class="btn icon" data-act="sel-clear" aria-label="Exit selection">${ic('x')}</button>
    <span class="count">${n} selected</span>${hidden ? `<span class="hidden-note">· ${hidden} hidden by filter</span>` : ''}
    <button class="btn sb-all" data-act="sel-all" aria-label="Select all">${ic('square-check')}<span class="lbl">Select all</span></button><span class="grow"></span>
    <button class="btn sb-act" data-act="sel-fav" aria-label="${fl}"${dis}>${ic('heart', allFav ? 'filled' : '')}<span class="lbl">${fl}</span></button>
    <button class="btn sb-act" data-act="sel-folder" aria-label="Add to folder" aria-haspopup="dialog"${dis}>${ic('folder-plus')}<span class="lbl">Add to folder</span></button>
    ${S.view === 'folder' ? `<button class="btn sb-act" data-act="sel-rm" aria-label="Remove from folder"${dis}>${ic('folder-minus')}<span class="lbl">Remove from folder</span></button>` : ''}
    <button class="btn primary sb-act" data-act="sel-download" aria-label="Download"${dis}>${ic('download')}<span class="lbl">Download</span></button>`;
}
function renderPane() {
  const p = $('#pane'), on = vp() === 'laptop' && S.selecting && S.sel.size >= 2 && S.view !== 'folders';
  const was = document.documentElement.classList.contains('sum-open');
  document.documentElement.classList.toggle('sum-open', on);
  p.innerHTML = on ? summaryHTML(!was) : '';
  if (on) fitIn(p);
  if (on !== was) requestAnimationFrame(() => { layoutGrid(); renderSelbar(); });
}
function breakdown(L) {
  const by = {};
  L.forEach(c => { const k = c.T.chip; by[k] = by[k] || { n: 0, s: 0 }; by[k].n++; by[k].s += c.states.length; });
  return CHIPS.filter(([k]) => by[k]).map(([k]) => plural(by[k].n, NOUN[k][0], NOUN[k][1]) + (k === 'characters' && by[k].s > by[k].n ? ` (${by[k].s} states)` : '')).join(' · ');
}
function summaryHTML(anim) {
  const L = Array.from(S.sel).map(card), n = L.length, shown = n > 9 ? L.slice(0, 8) : L, est = estimate(L, 'sheets');
  const allFav = L.every(c => S.favorites.has(c.key)), hidden = hiddenCount();
  return `<div class="sum"${anim ? '' : ' style="animation:none"'}>
    <div class="sum-h"><h2 id="sum-t" tabindex="-1">${n} selected</h2><button class="btn icon" data-act="sel-clear" aria-label="Clear selection (Esc)" title="Clear selection (Esc)">${ic('x')}</button></div>
    ${hidden ? `<p class="muted sum-hidden">${hidden} hidden by filter</p>` : ''}
    <div class="mosaic" role="list" aria-label="Selected assets">${shown.map(c => `<span class="stage" role="listitem" title="${esc(c.caption)}" aria-label="${esc(c.caption)}"><span class="art${bottomCls(c)}"><img src="${esc(c.a.thumb)}" alt="" width="0" height="0"></span></span>`).join('')}${n > 9 ? `<span class="more">+${n - 8}</span>` : ''}</div>
    <div><p class="muted">${breakdown(L)}</p><p class="faint">${plural(est.files, 'file')} as sprite sheets · about ${est.mb} MB</p></div>
    <div class="stack">
      <button class="btn primary" data-act="sel-download">${ic('download')}Download…</button>
      <button class="btn ghost" data-act="sel-folder" aria-haspopup="dialog">${ic('folder-plus')}Add to folder…</button>
      <button class="btn ghost" data-act="sel-fav">${ic('heart', allFav ? 'filled' : '')}${allFav ? 'Unfavorite' : 'Favorite'}</button>
      ${S.view === 'folder' ? `<button class="btn ghost" data-act="sel-rm">${ic('folder-minus')}Remove from folder</button>` : ''}
      <button class="btn ghost" data-act="sel-all">${ic('square-check')}Select all in view</button>
    </div></div>`;
}

// ===================== favorites + folders =====================
function toggleFav(key) {
  const on = !S.favorites.has(key);
  if (on) S.favorites.add(key); else S.favorites.delete(key);
  updateCard(key); renderNav();
  if (V.open && V.card.key === key) renderViewerInsp();
  if (S.view === 'favorites' || S.view === 'folders') renderContent(true);
  announce(on ? 'Added to favorites' : 'Removed from favorites');
}
function bulkFav(keys) {
  const all = keys.every(k => S.favorites.has(k));
  keys.forEach(k => { if (all) S.favorites.delete(k); else S.favorites.add(k); updateCard(k); });
  renderNav(); renderSelbar(); renderPane();
  if (S.view === 'favorites') renderContent();
  toast(all ? `Removed ${keys.length} from Favorites.` : `Added ${keys.length} to Favorites.`);
}
function addTo(f, keys) {
  const added = keys.filter(k => !f.keys.includes(k)); f.keys.push(...added);
  refreshOrg();
  toast(`Added ${added.length} to ${f.name}.`, { action: 'Undo', onAction: () => { f.keys = f.keys.filter(k => !added.includes(k)); refreshOrg(); } });
}
function removeFrom(f, keys) {
  const before = f.keys.slice(); f.keys = f.keys.filter(k => !keys.includes(k));
  keys.forEach(k => S.sel.delete(k));
  refreshOrg(true);
  toast(`Removed from ${f.name}. ${keys.length === 1 ? "It's" : "They're"} still in your library.`, { action: 'Undo', onAction: () => { f.keys = before; refreshOrg(); } });
}
function refreshOrg(focusNext) {
  renderNav();
  if (S.view === 'folders' || S.view === 'folder') {
    const fk = document.activeElement && document.activeElement.closest && document.activeElement.closest('.card');
    const L = viewList().map(c => c.key), i = fk ? L.indexOf(fk.dataset.key) : -1;
    renderHeader(); renderContent(); renderSelbar(); renderPane();
    if (focusNext && fk && !L.includes(fk.dataset.key)) focusCard(viewList().map(c => c.key)[Math.max(0, i)] || null, true);
  }
  if (V.open) renderViewerInsp();
}
function folderNameDialog(title, value, okLabel, onOk, except) {
  const d = openDialog({ title, cls: 'sm', body: `<div class="field"><label for="fn-in">Folder name</label><input class="input" id="fn-in" maxlength="60" value="${esc(value)}" autocomplete="off"><p class="err" id="fn-err" role="alert"></p></div>`,
    foot: `<button class="btn ghost" data-act="dlg-close">Cancel</button><button class="btn primary" data-act="dlg-ok">${okLabel}</button>` });
  const inp = $('#fn-in', d); inp.select();
  d._ok = () => {
    const v = inp.value.trim();
    const err = !v ? 'Enter a name for the folder.' : S.folders.some(f => f !== except && f.name.toLowerCase() === v.toLowerCase()) ? 'You already have a folder with that name.' : '';
    if (err) { $('#fn-err', d).innerHTML = ic('triangle-alert', 'sm') + '<span>' + err + '</span>'; inp.focus(); return; }
    d.close(); onOk(v);
  };
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); d._ok(); } });
  return d;
}
function newFolder() {   // Folders page and sidebar: create, then open the new empty folder
  return folderNameDialog('New folder', 'New folder', 'Create', name => {
    const f = { id: 'f' + key12('new:' + name + Date.now()).slice(0, 9), name, keys: [], missing: 0 };
    S.folders.push(f); S.flags.noFolders = false;
    go('#/folder/' + f.id); renderNav();
  });
}
function openFolderMenu(anchor, fid) {
  openPop(anchor, menuHTML([['folder-rename', 'Rename', 'pencil'], ['folder-delete', 'Delete folder', 'trash-2']], '', `data-fid="${fid}"`), { role: 'menu', sheet: true });
}
function deleteFolder(f) {   // F-12: confirm only, and deleting never deletes assets
  confirmDialog(`Delete “${esc(f.name)}”?`, `The ${plural(f.keys.length, 'asset')} in it stay in your library. Only the folder goes away.`, 'Delete folder', () => {
    S.folders.splice(S.folders.indexOf(f), 1);
    toast(`Deleted “${f.name}”. Your assets are untouched.`);
    if (S.view === 'folder' && S.folderId === f.id) go('#/folders'); else refreshOrg();
    setTimeout(focusH1, 50);
  });
}
function openFolderPicker(anchor, keys) {   // F-12: popover on desktop, bottom sheet on phone, never full screen
  const ctx = { keys, creating: false };
  ctx.rows = () => `<div class="ph2">Add to folder</div>
    ${ctx.creating ? `<div class="fp-new"><input class="input" id="fp-name" maxlength="60" placeholder="Folder name" aria-label="New folder name" autocomplete="off"><button class="btn primary" data-act="fp-create">Create</button></div><p class="err" id="fp-err" role="alert"></p>`
      : `<button class="mi" role="menuitem" data-act="fp-new">${ic('folder-plus')}<span>New folder</span></button>`}<hr>
    ${sortedFolders().map(f => { const n = keys.filter(k => f.keys.includes(k)).length, st = !n ? 'false' : n === keys.length ? 'true' : 'mixed';
      return `<button class="mi" role="menuitemcheckbox" aria-checked="${st}" data-act="fp-toggle" data-fid="${f.id}"><span class="cbx">${ic(st === 'mixed' ? 'minus' : 'check')}</span><span class="grow">${esc(f.name)}</span><span class="n">${f.keys.length}</span></button>`; }).join('')}
    <div class="pf"><button class="btn primary" data-act="pop-close">Done</button></div>`;
  openPop(anchor, ctx.rows(), { cls: 'fp', ctx, sheet: true, role: 'menu', label: 'Add to folder' });
}
function createFromPicker() {   // one step: create the folder and check it for the keys being filed
  const ctx = pop._ctx, inp = $('#fp-name', pop), v = inp.value.trim();
  const err = !v ? 'Enter a name for the folder.' : S.folders.some(f => f.name.toLowerCase() === v.toLowerCase()) ? 'You already have a folder with that name.' : '';
  if (err) { $('#fp-err', pop).textContent = err; inp.focus(); return; }
  const f = { id: 'f' + key12('new:' + v + Date.now()).slice(0, 9), name: v, keys: [], missing: 0 };
  S.folders.push(f); S.flags.noFolders = false; ctx.creating = false;
  addTo(f, ctx.keys);
  pop.innerHTML = ctx.rows(); const b = pop.querySelector(`[data-fid="${f.id}"]`); if (b) b.focus();
}

// ===================== viewer =====================
const V = { open: false, card: null, si: 0, asset: null, anim: -1, dir: 'south', frame: 0, playing: false, loop: true, zoom: 'fit', grid: false,
  imgs: [], player: null, pushed: false, list: [], tok: 0, W: 0, H: 0, fitK: 1, k: 1 };
const vd = $('#viewer'), cv = $('#v-canvas'), cx2 = cv.getContext('2d');
const DIRS = ['north', 'north_east', 'east', 'south_east', 'south', 'south_west', 'west', 'north_west'];   // clockwise
const COMPASS = ['north_west', 'north', 'north_east', 'west', null, 'east', 'south_west', 'south', 'south_east'];
const ROT = { north: 0, north_east: 45, east: 90, south_east: 135, south: 180, south_west: 225, west: 270, north_west: 315 };
const BDS = [['theme', 'Theme'], ['checker', 'Checker'], ['light', 'Light gray'], ['mid', 'Mid gray'], ['black', 'Black']];   // F-4
if (!BDS.some(b => b[0] === S.backdrop)) S.backdrop = 'theme';
const STEPS = [1, 2, 3, 4, 6, 8, 12, 16], TP_GAP = 2;
const fpsOf = k => S.fps[k] || 8;
const fpsKey = () => V.anim >= 0 ? V.asset.animations[V.anim].id : V.card.key;
const bd = () => S.backdrop;
const bdName = () => BDS.find(b => b[0] === bd())[1];
const isTiles = c => /tileset|tiles_pro/.test(c.type);
const viewerInspMode = () => innerHeight < 480 ? 'side' : (innerWidth < 840 || innerHeight >= innerWidth) ? 'sheet' : 'panel';
function defaultAnim(a) { const an = a.animations || []; if (!an.length) return -1; const i = an.findIndex(x => /idle|breath/i.test(x.name)); return i >= 0 ? i : 0; }
function availDirs() { const src = V.anim >= 0 ? V.asset.animations[V.anim].frames : (V.asset.directions || {}); return DIRS.filter(d => src[d]); }
function fixDir() {
  const av = availDirs();
  if (!av.length) { V.dir = 'unknown'; return; }
  if (av.includes(V.dir)) return;
  if (av.includes('south')) { V.dir = 'south'; return; }
  const i = DIRS.indexOf(V.dir); V.dir = av.slice().sort((x, y) => Math.abs(DIRS.indexOf(x) - i) - Math.abs(DIRS.indexOf(y) - i))[0];
}
const transportOn = () => V.anim >= 0 || V.card.frames > 1;

function openViewer(c, q, pushed) {
  V.list = viewList(); if (!V.list.includes(c)) V.list = [c];
  V.pushed = pushed;
  if (!vd.open) {
    stopAllPreviews(); hidePop();
    vd.showModal(); V.open = true;
    vd.classList.toggle('insp-off', S.inspOff); vd.classList.remove('insp-open', 'chrome-off');
    rehome();
  }
  showCard(c, q);
  setDetent(innerHeight >= 1200 && viewerInspMode() === 'sheet' ? 'half' : 'peek');
  $('#v-title').focus({ preventScroll: true });
  wakeChrome();
}
// F-14: prev/next keep the animation (by name, then type) and direction when the next asset has them.
function showCard(c, q, carry) {
  q = q || new URLSearchParams();
  V.card = c; V.si = Math.max(0, Math.min(+q.get('state') || 0, c.states.length - 1)); V.asset = c.states[V.si];
  const an = V.asset.animations || [];
  if (q.has('anim')) V.anim = Math.min(+q.get('anim'), an.length - 1);
  else if (carry && carry.anim) { const i = an.findIndex(x => x.name === carry.anim.name || x.type === carry.anim.type); V.anim = i >= 0 ? i : defaultAnim(V.asset); }
  else V.anim = defaultAnim(V.asset);
  V.dir = q.get('dir') || (carry && carry.dir) || 'south'; fixDir();
  V.frame = 0; V.zoom = 'fit'; V.grid = false; V.loop = true; V.playing = carry ? carry.playing : !reduced();
  $('#v-art').classList.add('fading');
  renderViewerChrome(); loadFrames(); syncViewerHash(); updateTitle();
}
function syncViewerHash() {
  history.replaceState(null, '', viewerHash(V.card, { dir: V.dir !== 'south' && V.dir !== 'unknown' ? V.dir : null, anim: V.anim >= 0 && V.anim !== defaultAnim(V.asset) ? V.anim : null, state: V.si || null }));
}
const segHTML = (cls, label, opts, cur, act) => `<div class="seg ${cls}" role="radiogroup" aria-label="${label}">${opts.map(([v, l]) => `<button role="radio" aria-checked="${v === cur}" tabindex="${v === cur ? 0 : -1}" data-act="${act}" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;
const menuBtnHTML = (cls, act, label, cur) => `<button class="btn ghost ${cls}" data-act="${act}" aria-haspopup="menu" aria-label="${label}: ${esc(cur)}">${esc(cur)}${ic('chevron-down', 'sm')}</button>`;
function renderViewerChrome() {
  const c = V.card, a = V.asset, idx = V.list.indexOf(c), hasT = transportOn();
  $('#v-title').textContent = c.title;
  $('#v-state').textContent = c.type === 'character' ? stateLabel(a) : (c.state ? cap1(c.state) : '');
  $('#v-pos').textContent = `${idx + 1} / ${V.list.length}`;
  $$('[data-act="v-prev"]', vd).forEach(b => { b.disabled = idx <= 0; });
  $$('[data-act="v-next"]', vd).forEach(b => { b.disabled = idx >= V.list.length - 1; });
  $('#v-tr').hidden = !hasT;
  $('#v-loop').setAttribute('aria-pressed', V.loop);
  const anims = a.animations || [], showDir = DIRS.filter(d => (a.directions || {})[d]).length > 1;
  const opts = anims.length ? [['-1', 'Rotations']].concat(anims.map((x, i) => [String(i), x.name])) : [];
  const cur = V.anim >= 0 ? anims[V.anim].name : 'Rotations';
  const states = c.states.length > 1 ? c.states.map((s, i) => [String(i), stateLabel(s)]) : [];
  $('#v-cx').innerHTML = [
    opts.length ? (opts.length <= 4 ? segHTML('pick-seg', 'Animation', opts, String(V.anim), 'v-anim') : '') + menuBtnHTML('pick-btn' + (opts.length > 4 ? ' always' : ''), 'v-pick', 'Animation', cur) : '',
    states.length ? segHTML('state-seg', 'State', states, String(V.si), 'v-state') + menuBtnHTML('state-btn', 'v-statepick', 'State', stateLabel(a)) : '',
    showDir ? `<button class="btn ghost dir-btn" data-act="v-dir" aria-haspopup="dialog" aria-label="Direction: ${DIR_NAME(V.dir)}">${ic('arrow-up', 'sm', 'rotate:' + ROT[V.dir] + 'deg')}${DIR_AB[V.dir]}${ic('chevron-down', 'sm')}</button>` : '',
    isTiles(c) ? `<button class="btn" data-act="v-grid" aria-pressed="${V.grid}">${ic('grid-3x3', 'sm')}<span>Grid</span></button>` : '',
    '<span class="v-sp"></span>',
    `<div class="zoom" role="group" aria-label="Zoom"><button class="btn icon zo" data-act="v-zo" aria-label="Zoom out">${ic('minus')}</button><button class="btn zr" data-act="v-zt" id="v-zr">Fit</button><button class="btn icon zi" data-act="v-zi" aria-label="Zoom in">${ic('plus')}</button></div>`,
    `<button class="btn ghost bd-btn" data-act="v-bd" aria-haspopup="dialog" aria-label="Backdrop: ${bdName()}" title="Backdrop: ${bdName()}"><i data-bd="${bd()}"></i><span>Backdrop</span></button>`
  ].join('');
  // Inline compass beside the transport (from B); phones use the Direction button instead.
  $('#v-compass').innerHTML = showDir ? COMPASS.map(d => d ? `<button role="radio" aria-checked="${d === V.dir}" tabindex="${d === V.dir ? 0 : -1}" data-act="v-dirset" data-v="${d}" aria-label="${DIR_NAME(d)}"${availDirs().includes(d) ? '' : ' disabled'}>${ic('arrow-up', '', 'rotate:' + ROT[d] + 'deg')}</button>` : `<span aria-hidden="true">${DIR_AB[V.dir] || ''}</span>`).join('') : '';
  $('#v-stage').dataset.bd = bd();
  updateFpsUI(); renderViewerInsp(); updateInfoBtn(); fitStage();
}
function renderViewerInsp() {
  const ins = $('#v-insp'), top = ins.scrollTop;
  $('#v-insp-body').innerHTML = inspectorHTML(V.card, { asset: V.asset, anim: V.anim, dir: V.dir, frame: V.frame });
  ins.scrollTop = top; updatePeek();
}
function sources() {
  const a = V.asset;
  if (V.anim >= 0) return a.animations[V.anim].frames[V.dir] || [];
  if (V.card.frames > 1) return a.frames;
  if (a.directions && a.directions[V.dir]) return [a.directions[V.dir]];
  return [a.sheet || a.thumb];
}
function loadFrames() {
  const tok = ++V.tok, srcs = sources(), n = srcs.length;
  if (V.player) V.player.stop();
  const imgs = srcs.map(s => { const i = new Image(); i.src = s; return i; });
  let done = 0;
  if (n > 1) loadingLabel(0, n);
  return Promise.all(imgs.map(i => i.decode().catch(() => {}).then(() => { if (tok === V.tok && n > 1) loadingLabel(++done, n); }))).then(() => {
    if (tok !== V.tok) return;
    V.imgs = imgs; V.frame = Math.min(V.frame, n - 1);
    renderFilm(); setupCanvas(); buildPlayer();
    $('#v-art').classList.remove('fading');
  });
}
function loadingLabel(d, n) { const b = $('#v-play'); b.classList.add('loading'); b.innerHTML = `Loading frames ${d}/${n}`; }
function setupCanvas() {
  const c = V.card, im = V.imgs[0], tp = c.type === 'tiles_pro', g = c.a.grid, ts = c.a.tileSize;
  V.W = tp ? g.cols * ts + (g.cols - 1) * TP_GAP : im.naturalWidth;
  V.H = tp ? g.rows * ts + (g.rows - 1) * TP_GAP : im.naturalHeight;
  if (cv.width !== V.W || cv.height !== V.H) { cv.width = V.W; cv.height = V.H; }
  cx2.imageSmoothingEnabled = false;                         // reset after every resize
  draw(V.frame); renderTileGrid(); fitStage(); stageLabel();
}
function draw(i) {
  V.frame = i; const im = V.imgs[i], n = V.imgs.length; if (!im) return;
  cx2.clearRect(0, 0, cv.width, cv.height);
  if (V.card.type === 'tiles_pro') {
    const g = V.card.a.grid, ts = V.card.a.tileSize;
    for (let r = 0; r < g.rows; r++) for (let q = 0; q < g.cols; q++) cx2.drawImage(im, q * ts, r * ts, ts, ts, q * (ts + TP_GAP), r * (ts + TP_GAP), ts, ts);
  } else cx2.drawImage(im, 0, 0);
  if (n > 1) { $('#v-read').textContent = `${i + 1} / ${n}`; markFrame(i); }
}
// Filmstrip (from C) replaces the range scrubber: one control, scrolls sideways, click or tap to seek.
function renderFilm() {
  const f = $('#v-film'), n = V.imgs.length;
  f.innerHTML = n > 1 ? V.imgs.map((im, i) => `<button class="fr" role="radio" aria-checked="${i === V.frame}" tabindex="${i === V.frame ? 0 : -1}" data-act="v-seek" data-i="${i}" aria-label="Frame ${i + 1} of ${n}"><span class="art"><img src="${esc(im.src)}" alt="" width="0" height="0" draggable="false"></span></button>`).join('') : '';
  fitIn(f);
}
function markFrame(i) {
  const f = $('#v-film'), b = f.children[i], old = f.querySelector('[aria-checked="true"]');
  if (!b || old === b) return;
  if (old) { old.setAttribute('aria-checked', 'false'); old.tabIndex = -1; }
  b.setAttribute('aria-checked', 'true'); b.tabIndex = 0;
  if (f.scrollWidth > f.clientWidth + 1) {
    const fr = f.getBoundingClientRect(), br = b.getBoundingClientRect();
    if (br.left < fr.left || br.right > fr.right) f.scrollLeft += br.left - fr.left - (fr.width - br.width) / 2;
  }
}
function buildPlayer() {
  if (V.player) V.player.stop();
  const n = V.imgs.length;
  V.player = n > 1 ? PixelTicker.player(Array(n).fill(1000 / fpsOf(fpsKey())), onFrame) : null;
  if (V.player) V.player.seek(V.frame);
  if (V.player && V.playing) V.player.play(); else V.playing = V.playing && !!V.player;
  updatePlayBtn();
}
function onFrame(i) {
  const n = V.imgs.length;
  if (!V.loop && i === 0 && V.frame === n - 1) { pause(); V.player.seek(n - 1); return; }   // play once: stop on the last frame
  draw(i);
}
function play() { if (!V.player) return; if (!V.loop && V.frame === V.imgs.length - 1) V.player.seek(0); V.player.play(); V.playing = true; updatePlayBtn(); wakeChrome(); }
function pause() { if (V.player) V.player.stop(); V.playing = false; updatePlayBtn(); stageLabel(); wakeChrome(); }
function togglePlay() { if (V.playing) pause(); else play(); }
function stepFrame(d) { if (!V.player) return; pause(); V.player.seek((V.frame + d + V.imgs.length) % V.imgs.length); stageLabel(); }
function seekFrame(i) { if (!V.player) return; pause(); V.player.seek(i); stageLabel(); }
function updatePlayBtn() {
  const b = $('#v-play'); b.classList.remove('loading');
  b.innerHTML = ic(V.playing ? 'pause' : 'play', V.playing ? '' : 'filled'); b.setAttribute('aria-label', V.playing ? 'Pause' : 'Play');
}
function updateFpsUI() {
  const n = fpsOf(fpsKey()), over = !!S.fps[fpsKey()];
  $('#v-fpsr').textContent = n + ' fps';
  $('#v-fpsreset').hidden = !over;
  const b = $('#v-fpsbtn'); b.textContent = n + ' fps'; b.setAttribute('aria-label', `Playback speed: ${n} fps${over ? ', your speed' : ''}`);
  const o = $('#fps-out', pop); if (o) o.textContent = n + ' fps';
  const r = $('#fps-pop-reset', pop); if (r) r.disabled = !over;
}
function stageLabel() {
  const c = V.card, n = V.imgs.length;
  $('#v-scroll').setAttribute('aria-label', [c.title, V.anim >= 0 ? V.asset.animations[V.anim].name : '', V.dir !== 'unknown' && availDirs().length > 1 ? DIR_NAME(V.dir) : '', n > 1 ? `frame ${V.frame + 1} of ${n}` : ''].filter(Boolean).join(', '));
}
function fitStage() {
  if (!V.imgs.length || !V.open) return;
  const st = $('#v-stage'), sc = $('#v-scroll'), cs = getComputedStyle(sc.firstElementChild), dpr = devicePixelRatio || 1;
  const fit = integerScale(V.W, V.H, st.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), st.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom), dpr);
  if (!fit) return;
  V.fitK = fit.scale;
  const k = V.zoom === 'fit' ? fit.scale : Math.max(1, Math.round(V.zoom * dpr));      // 02 §6.3
  V.k = k;
  cv.style.width = V.W * k / dpr + 'px'; cv.style.height = V.H * k / dpr + 'px';
  cv.classList.toggle('smooth', V.zoom === 'fit' && fit.smooth);
  $('#v-tgrid').style.gap = V.card.type === 'tiles_pro' ? TP_GAP * k / dpr + 'px' : '0';
  if (isTiles(V.card)) $('#v-tgrid').classList.toggle('nolabel', V.card.a.tileSize * k / dpr < 48);   // labels only on ≥ 48 px tiles
  requestAnimationFrame(() => sc.classList.toggle('pan', sc.scrollWidth > sc.clientWidth + 1 || sc.scrollHeight > sc.clientHeight + 1));
  const m = k / dpr, f = x => x < 1 ? Math.round(x * 100) + '%' : Math.round(x * 10) / 10 + '×';
  const zr = $('#v-zr');
  if (zr) { zr.textContent = V.zoom === 'fit' ? 'Fit · ' + f(m) : f(m); zr.setAttribute('aria-label', `Zoom ${V.zoom === 'fit' ? 'Fit, ' + f(m) : f(m)}. Switch to ${V.zoom === 'fit' ? '1:1' : 'Fit'}`); zr.title = V.zoom === 'fit' ? `Fit (${f(m)}) · click for 1:1` : 'Click to fit'; }
}
function setZoom(z, cx, cy) {
  const sc = $('#v-scroll'), r = sc.getBoundingClientRect();
  const ax = cx == null ? sc.clientWidth / 2 : cx - r.left, ay = cy == null ? sc.clientHeight / 2 : cy - r.top;
  const fx = (sc.scrollLeft + ax) / sc.scrollWidth, fy = (sc.scrollTop + ay) / sc.scrollHeight;
  V.zoom = z; fitStage();
  sc.scrollLeft = fx * sc.scrollWidth - ax; sc.scrollTop = fy * sc.scrollHeight - ay;
  wakeChrome();
}
function zoomStep(d, cx, cy) {
  const dpr = devicePixelRatio || 1, cur = V.k / dpr;
  if (d > 0) return setZoom(STEPS.find(s => s > cur + 1e-6) || 16, cx, cy);
  const lo = STEPS.slice().reverse().find(s => s < cur - 1e-6);
  setZoom(lo != null ? lo : (V.fitK / dpr < 1 ? 'fit' : 1), cx, cy);
}
function renderTileGrid() {
  const g = $('#v-tgrid'), c = V.card;
  $('#v-tinfo').hidden = true;
  if (!isTiles(c)) { g.innerHTML = ''; g.classList.remove('on'); return; }
  const gr = c.a.grid;
  g.style.gridTemplateColumns = `repeat(${gr.cols}, 1fr)`; g.style.gridTemplateRows = `repeat(${gr.rows}, 1fr)`;
  g.classList.toggle('on', V.grid);
  g.innerHTML = Array.from({ length: gr.cols * gr.rows }, (_, i) => `<span data-i="${i}">${c.type === 'tileset_topdown' ? 'wang_' + i : 'tile_' + i}</span>`).join('');
}
function tileInfo(i) {   // ponytail: corner / rule bits derived from the index; the real values come from PixelLab metadata (H / D)
  const c = V.card, g = c.a.grid, ts = c.a.tileSize, x = (i % g.cols) * ts, y = Math.floor(i / g.cols) * ts;
  const bits = names => names.filter((_, b) => (i >> (names.length - 1 - b)) & 1);
  if (c.type === 'tileset_topdown') return `wang_${i} · ${['NW', 'NE', 'SW', 'SE'].map((k, b) => k + ((i >> (3 - b)) & 1 ? ' upper' : ' lower')).join(', ')} · x ${x}, y ${y}`;
  if (c.type === 'tileset_sidescroller') return `tile_${i} · connects ${bits(['N', 'E', 'S', 'W']).join(', ') || 'none'} · x ${x}, y ${y}`;
  return `tile_${i} · rule bits ${bits(['N', 'E', 'S', 'W']).join(', ') || 'none'}`;
}
function setAnim(i) { V.anim = i; V.frame = 0; fixDir(); renderViewerChrome(); loadFrames(); syncViewerHash(); }
function setDir(d) { V.dir = d; renderViewerChrome(); loadFrames(); syncViewerHash(); }
function rotateDir(d) { const av = availDirs(); if (av.length < 2) return; setDir(av[(av.indexOf(V.dir) + d + av.length) % av.length]); announce(DIR_NAME(V.dir)); }
function setState(i) {
  const old = V.asset, t = V.anim >= 0 ? old.animations[V.anim].type : null;
  V.si = i; V.asset = V.card.states[i];
  V.anim = t ? V.asset.animations.findIndex(x => x.type === t) : -1;
  fixDir(); renderViewerChrome(); loadFrames(); syncViewerHash();
}
function setFps(n) {
  n = Math.max(1, Math.min(30, n)); const k = fpsKey();
  if (n === 8) delete S.fps[k]; else S.fps[k] = n;
  buildPlayer(); updateFpsUI(); renderViewerInsp();
  announce(n + ' fps');
}
function setBackdrop(v) {
  S.backdrop = v; store.set('backdrop', v);                                        // R2 delight 4: remember the last choice
  $('#v-stage').dataset.bd = v;
  $$('.sw', pop).forEach(b => b.setAttribute('aria-checked', b.dataset.val === v));
  const b = $('.bd-btn', vd); if (b) { $('i', b).dataset.bd = v; b.setAttribute('aria-label', 'Backdrop: ' + bdName()); b.title = 'Backdrop: ' + bdName(); }
}
function navStep(d) {
  const i = V.list.indexOf(V.card) + d; if (i < 0 || i >= V.list.length) return;
  showCard(V.list[i], null, { anim: V.anim >= 0 ? V.asset.animations[V.anim] : null, dir: V.dir !== 'unknown' ? V.dir : null, playing: V.playing || (!V.player && !reduced()) });
}
function closeViewerNav() { if (V.pushed) history.back(); else { history.replaceState(null, '', parentHash()); closeViewer(); } }
function closeViewer() {
  if (!vd.open) return;
  if (V.player) V.player.stop(); V.tok++; hidePop();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  vd.close(); V.open = false; rehome(); updateTitle();
  focusCard(V.card.key, true);
  fillPreviews();
}
function toggleInfo() {
  const m = viewerInspMode();
  if (m === 'panel') { S.inspOff = !S.inspOff; vd.classList.toggle('insp-off', S.inspOff); }
  else if (m === 'sheet') setDetent($('#v-insp').dataset.detent === 'peek' ? 'half' : 'peek');
  else vd.classList.toggle('insp-open');
  updateInfoBtn();
}
function updateInfoBtn() {
  const m = viewerInspMode(), on = m === 'panel' ? !S.inspOff : m === 'sheet' ? $('#v-insp').dataset.detent !== 'peek' : vd.classList.contains('insp-open');
  $('#v-info').setAttribute('aria-pressed', on);
}
function setDetent(d) {
  const ins = $('#v-insp'); ins.dataset.detent = d; if (d === 'peek') ins.scrollTop = 0;
  const b = $('#sheet-btn'); b.setAttribute('aria-expanded', d !== 'peek'); b.setAttribute('aria-label', d === 'full' ? 'Collapse info' : 'Expand info');
  b.innerHTML = ic(d === 'full' ? 'chevron-down' : 'chevron-up'); updateInfoBtn(); updatePeek();
}
function updatePeek() {   // the peek detent shows the title block and the actions row, whatever the text size
  const ins = $('#v-insp'), row = $('#acts-row', ins);
  if (row && viewerInspMode() === 'sheet') ins.style.setProperty('--peek', Math.ceil(row.offsetTop + row.offsetHeight + 14) + 'px');
}
const nextDetent = { peek: 'half', half: 'full', full: 'peek' };
let chromeT = 0;
function wakeChrome() {
  vd.classList.remove('chrome-off'); clearTimeout(chromeT);
  if (V.open && viewerInspMode() === 'side' && V.playing) chromeT = setTimeout(() => {
    const ae = document.activeElement;
    if (!(ae && ae.closest && ae.closest('.v-top button, .v-dock, .v-insp, .pop'))) vd.classList.add('chrome-off');
  }, 3000);
}
function fullscreen() { if (document.fullscreenElement) document.exitFullscreen().catch(() => {}); else if (vd.requestFullscreen) vd.requestFullscreen().catch(() => {}); }
new ResizeObserver(() => requestAnimationFrame(fitStage)).observe($('#v-stage'));

// stage pointer: drag-pan when zoomed, swipe prev/next/close at Fit (touch / pen), tap toggles chrome, double-tap zooms
(function stageGestures() {
  const sc = $('#v-scroll'), art = $('#v-art'); let dr = null, lastTap = 0, wheelT = 0;
  sc.addEventListener('pointerdown', e => {
    if (e.button > 0) return;
    dr = { x: e.clientX, y: e.clientY, sl: sc.scrollLeft, st: sc.scrollTop, pan: sc.classList.contains('pan'), type: e.pointerType, moved: false };
    sc.setPointerCapture(e.pointerId);
  });
  sc.addEventListener('pointermove', e => {
    if (!dr) { wakeChrome(); return; }
    const dx = e.clientX - dr.x, dy = e.clientY - dr.y; if (Math.hypot(dx, dy) > 10) dr.moved = true;
    if (dr.pan) { sc.scrollLeft = dr.sl - dx; sc.scrollTop = dr.st - dy; }
    else if (dr.type !== 'mouse' && Math.abs(dx) > Math.abs(dy) && !reduced()) { const p = devicePixelRatio || 1; art.style.translate = Math.round(dx * p) / p + 'px 0'; }
  });
  const end = e => {
    if (!dr) return; const d = dr; dr = null; art.style.translate = '';
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (!d.pan && d.type !== 'mouse' && d.moved) {
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) navStep(dx < 0 ? 1 : -1);
      else if (dy > 80) closeViewerNav();
      else if (dy < -60 && viewerInspMode() === 'sheet') setDetent('half');
    }
    if (!d.moved && d.type !== 'mouse') {
      const now = Date.now();
      if (now - lastTap < 300) { if (V.zoom === 'fit') zoomStep(1, e.clientX, e.clientY); else setZoom('fit'); }
      else if (vd.classList.contains('insp-open')) { vd.classList.remove('insp-open'); updateInfoBtn(); }
      else if (vd.classList.contains('chrome-off')) wakeChrome(); else if (viewerInspMode() === 'side') vd.classList.add('chrome-off');
      lastTap = now;
    }
  };
  sc.addEventListener('pointerup', end); sc.addEventListener('pointercancel', end);
  sc.addEventListener('dblclick', e => { if (V.zoom === 'fit') zoomStep(1, e.clientX, e.clientY); else setZoom('fit'); });
  sc.addEventListener('wheel', e => { e.preventDefault(); const now = Date.now(); if (now - wheelT < 120) return; wheelT = now; zoomStep(e.deltaY < 0 ? 1 : -1, e.clientX, e.clientY); }, { passive: false });
  $('#v-tgrid').addEventListener('pointerover', e => { const s = e.target.closest('[data-i]'); if (!s) return; const t = $('#v-tinfo'); t.hidden = false; t.textContent = tileInfo(+s.dataset.i); });
  const sh = $('#sheet-h'); let sd = null;
  sh.addEventListener('pointerdown', e => { if (e.target.closest('button')) return; sd = e.clientY; sh.setPointerCapture(e.pointerId); });
  sh.addEventListener('pointerup', e => {
    if (sd == null) return; const dy = e.clientY - sd, cur = $('#v-insp').dataset.detent; sd = null;
    if (Math.abs(dy) < 8) setDetent(nextDetent[cur]);
    else if (dy < 0) setDetent(cur === 'peek' ? 'half' : 'full'); else setDetent(cur === 'full' ? 'half' : 'peek');
  });
  vd.addEventListener('cancel', e => { e.preventDefault(); closeViewerNav(); });
  vd.addEventListener('keydown', wakeChrome);
})();

function viewerKey(e) {
  const t = e.target, k = e.key, owns = t.closest && t.closest('[role=radiogroup], .pop, select, input');
  if (topDialog() !== vd) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (k.length === 1 && k !== ' ' && !S.shortcuts) return;
  switch (k) {
    case 'ArrowLeft': case 'ArrowRight': if (owns) return; if (e.shiftKey) $('#v-scroll').scrollBy((k === 'ArrowLeft' ? -0.1 : 0.1) * $('#v-scroll').clientWidth, 0); else navStep(k === 'ArrowLeft' ? -1 : 1); break;
    case 'ArrowUp': case 'ArrowDown': if (owns || !e.shiftKey) return; $('#v-scroll').scrollBy(0, (k === 'ArrowUp' ? -0.1 : 0.1) * $('#v-scroll').clientHeight); break;
    case ' ': if (t.closest('button, input, a, select, summary, textarea')) return; togglePlay(); break;
    case ',': stepFrame(-1); break;
    case '.': stepFrame(1); break;
    case '[': rotateDir(-1); break;
    case ']': rotateDir(1); break;
    case 'Home': case 'End': if (owns || !V.player) return; seekFrame(k === 'Home' ? 0 : V.imgs.length - 1); break;
    case 'i': case 'I': toggleInfo(); break;
    case 'z': case 'Z': setZoom(V.zoom === 'fit' ? 1 : 'fit'); break;
    case 'f': case 'F': fullscreen(); break;
    case 'l': case 'L': toggleFav(V.card.key); break;
    case 'd': case 'D': openDlMenu($('#v-insp-body .dl-btn') || $('#v-title'), V.card); break;
    case '+': case '=': zoomStep(1); break;
    case '-': zoomStep(-1); break;
    case '?': openHelp(); break;
    default: return;
  }
  e.preventDefault();
}

// ===================== popovers, sheets, dialogs, toasts =====================
const pop = $('#pop'), overlay = $('#overlay');
function topDialog() { const ds = $$('dialog[open]'); return ds[ds.length - 1] || null; }
function rehome() {   // modal dialogs make the rest of the page inert: keep the popover and live regions inside the top one
  const host = topDialog() || document.body;
  if (overlay.parentNode !== host) host.appendChild(overlay);
  if (!pop.matches(':popover-open') && pop.parentNode !== host) host.appendChild(pop);
}
function openPop(anchor, html, o) {
  o = o || {};
  hidePop(); rehome();
  const sheet = o.sheet && vp() === 'phone';
  pop.className = 'pop ' + (o.cls || '') + (sheet ? ' sheet' : '');
  pop.innerHTML = html; pop.setAttribute('role', o.role || 'dialog');
  if (o.label) pop.setAttribute('aria-label', o.label); else pop.removeAttribute('aria-label');
  pop._ctx = o.ctx || {}; pop._anchor = anchor;
  pop.style.left = pop.style.top = '';
  pop.showPopover();
  if (!sheet) {
    const r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    let x = o.x != null ? o.x : r.left, y = o.y != null ? o.y : r.bottom + 6;
    if (y + h > innerHeight - 8) y = Math.max(8, (o.y != null ? o.y : r.top - 6) - h);
    x = Math.max(8, Math.min(x, innerWidth - w - 8));
    pop.style.left = x + 'px'; pop.style.top = y + 'px';
  }
  const first = pop.querySelector('[aria-checked="true"]:not(:disabled), .mi:not(:disabled), button:not(:disabled), a, input');
  if (first) first.focus({ preventScroll: true });
}
function hidePop() { if (pop.matches(':popover-open')) pop.hidePopover(); }
pop.addEventListener('toggle', e => { if (e.newState === 'closed') { const a = pop._anchor; pop.innerHTML = ''; if (a && a.isConnected && (!document.activeElement || document.activeElement === document.body)) a.focus({ preventScroll: true }); } });
pop.addEventListener('keydown', e => {
  if (pop.querySelector('.compass') && /^Arrow/.test(e.key)) { compassArrow(e, () => openCompass(pop._anchor)); return; }
  const items = $$('.mi:not(:disabled), .sw', pop), i = items.indexOf(document.activeElement);
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && pop.querySelector('.bdpop'))) {
    e.preventDefault(); const n = items[(i + (/Down|Right/.test(e.key) ? 1 : -1) + items.length) % items.length]; if (n) n.focus();
  }
  if (e.key === 'Enter' && e.target.id === 'fp-name') { e.preventDefault(); createFromPicker(); }
  if (e.key === 'Tab' && !e.target.closest('.fp-new, .fps-pop')) hidePop();
});
function compassArrow(e, after) {   // arrows walk the 3×3 compass, skipping missing directions
  const cur = COMPASS.indexOf(V.dir), dv = { ArrowUp: -3, ArrowDown: 3, ArrowLeft: -1, ArrowRight: 1 }[e.key];
  e.preventDefault();
  for (let j = cur + dv; j >= 0 && j < 9; j += dv) {
    if (Math.abs(dv) === 1 && Math.floor(j / 3) !== Math.floor(cur / 3)) break;
    const d = COMPASS[j];
    if (d && availDirs().includes(d)) { setDir(d); after(); break; }
  }
}
const menuHTML = (items, key, extra) => items.filter(Boolean).map(([act, label, icon, checked, v]) =>
  `<button class="mi" role="${checked != null ? 'menuitemradio' : 'menuitem'}"${checked != null ? ` aria-checked="${checked}"` : ''} data-act="${act}"${key ? ` data-key="${key}"` : ''}${v != null ? ` data-v="${v}"` : ''} ${extra || ''}>${checked != null ? ic('check', 'chk') : ic(icon)}<span>${label}</span></button>`).join('');

let dlgN = 0;
function openDialog(o) {
  const d = document.createElement('dialog'), id = 'dlg-t' + (++dlgN), opener = document.activeElement;
  d.className = 'dlg ' + (o.cls || ''); d.setAttribute('aria-labelledby', id);
  d.innerHTML = `<header class="dlg-h"><h2 id="${id}" tabindex="-1">${o.title}</h2><button class="btn icon" data-act="dlg-close" aria-label="Close">${ic('x')}</button></header><div class="dlg-b">${o.body}</div>${o.foot ? `<footer class="dlg-f">${o.foot}</footer>` : ''}`;
  document.body.appendChild(d);
  d.addEventListener('close', () => { hidePop(); d.remove(); rehome(); if (o.onClose) o.onClose(); if (opener && opener.isConnected) opener.focus({ preventScroll: true }); });
  hidePop(); d.showModal(); rehome();
  const f = !coarse() && d.querySelector('.dlg-b input:not([type=checkbox]):not([type=radio]), .dlg-b select'); (f || d.querySelector('h2')).focus();
  return d;
}
function confirmDialog(title, body, ok, onOk, extra) {
  const d = openDialog({ title, cls: 'sm', body: `<p class="muted">${body}</p>${extra || ''}`, foot: `<button class="btn ghost" data-act="dlg-close">Cancel</button><button class="btn primary" data-act="dlg-ok">${ok}</button>` });
  d._ok = () => { const v = d.querySelector('input[type=checkbox]'); d.close(); onOk(v && v.checked); };
  $('[data-act="dlg-ok"]', d).focus();
  return d;
}
function toast(msg, o) {
  o = o || {}; rehome();
  const t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status');
  t.innerHTML = `${o.icon ? ic(o.icon, o.warn ? 'warn' : '') : ''}<span>${esc(msg)}</span>${o.action ? `<button class="btn link">${esc(o.action)}</button>` : ''}`;
  const box = $('#toasts'); box.appendChild(t); while (box.children.length > 3) box.firstChild.remove();
  let left = o.action ? 10000 : 5000, last = Date.now(), paused = false;
  const iv = setInterval(() => { if (!paused) { left -= Date.now() - last; } last = Date.now(); if (left <= 0) { clearInterval(iv); t.remove(); } }, 250);
  ['pointerenter', 'focusin'].forEach(ev => t.addEventListener(ev, () => { paused = true; }));
  ['pointerleave', 'focusout'].forEach(ev => t.addEventListener(ev, () => { paused = false; }));
  if (o.action) t.querySelector('button').addEventListener('click', () => { clearInterval(iv); t.remove(); o.onAction(); });
  announce(msg);
}
function announce(text, assertive) { const r = $(assertive ? '#live2' : '#live'); r.textContent = ''; setTimeout(() => { r.textContent = text; }, 40); }

// ===================== downloads (F-5; faked: progress + toast, no network) =====================
const gifScale = longest => [1, 2, 4, 8].find(s => longest * s >= 256) || 8;
function dlCtx(c) { return V.open && V.card === c ? { asset: V.asset, anim: V.anim, dir: V.dir, frame: V.frame } : { asset: c.a, anim: defaultAnim(c.a), dir: c.dirs.includes('south') ? 'south' : (c.dirs[0] || 'unknown'), frame: 0 }; }
// At most 4 items per type. Multi-file outputs are one ZIP. The GIF uses the current playback speed.
function dlItems(c, x) {
  const a = x.asset, nm = slug(c.caption), an = x.anim >= 0 ? a.animations[x.anim] : null;
  const multi = Object.keys(a.directions || {}).filter(d => d !== 'unknown').length > 1, dir = multi && x.dir && x.dir !== 'unknown' ? x.dir.replace('_', '-') : null;
  const sc = gifScale(Math.max(a.width, a.height)), at = sc > 1 ? '@' + sc + 'x' : '';
  const fk = an ? an.id : c.key, speed = `${fpsOf(fk)} fps (${S.fps[fk] ? 'your speed' : 'current speed'})`;
  const I = (id, label, desc, file) => ({ id, label, desc, file, short: { gif: 'GIF', png: 'PNG', sheet: 'sprite sheet', pl: 'original', frames: /tile/.test(c.type) ? 'tiles' : 'frames' }[id] });
  if (/character|object/.test(c.type)) {
    const pl = (c.type === 'character' || multi) && I('pl', 'PixelLab original', c.type === 'character' ? "PixelLab's own ZIP, all states" : "PixelLab's own sprite sheet", `${nm}_pixellab.zip`);
    if (an) { const as = slug(an.name); return [I('gif', 'GIF', `${an.name}${dir ? ' · ' + DIR_NAME(x.dir) : ''} · ${speed}`, `${nm}_${as}${dir ? '_' + dir : ''}${at}.gif`),
      I('sheet', 'Sprite sheet', 'PNG + JSON, all animations (ZIP)', `${nm}_all.zip`), I('frames', 'All frames', 'Every frame as PNG (ZIP)', `${nm}_frames.zip`), pl].filter(Boolean); }
    return [I('png', 'PNG', dir ? `${DIR_NAME(x.dir)} view, original pixels` : 'Original pixels, 1×', `${nm}${dir ? '_' + dir : ''}.png`),
      multi && I('sheet', 'Sprite sheet', 'All directions, PNG + JSON (ZIP)', `${nm}_rotations.zip`), multi && I('frames', 'All frames', 'Every direction as PNG (ZIP)', `${nm}_frames.zip`), pl].filter(Boolean);
  }
  if (c.frames > 1) return [I('gif', 'GIF', `Animated loop · ${speed}`, `${nm}${at}.gif`), I('png', 'PNG', `Frame ${(x.frame || 0) + 1}, original pixels`, `${nm}_${String(x.frame || 0).padStart(3, '0')}.png`),
    I('sheet', 'Sprite sheet', 'One-row strip, PNG + JSON (ZIP)', `${nm}_all.zip`), I('frames', 'All frames', 'Every frame as PNG (ZIP)', `${nm}_frames.zip`)];
  if (/tileset/.test(c.type)) return [I('png', 'PNG', 'The sheet as PixelLab made it', `${nm}_sheet.png`), I('sheet', 'Sheet + metadata', 'Sheet plus PixelLab tile data (ZIP)', `${nm}_sheet.zip`), I('frames', 'All tiles', 'One PNG per tile (ZIP)', `${nm}_tiles.zip`)];
  if (c.type === 'tiles_pro') return [I('frames', 'All tiles', 'Every variation + rules.json (ZIP)', `${nm}_tiles.zip`), I('png', 'PNG', 'First variation, original pixels', `${nm}_tile_00.png`),
    I('sheet', 'Sprite sheet', 'Variations in a grid, PNG + JSON (ZIP)', `${nm}_all.zip`), I('pl', 'PixelLab original', "PixelLab's own ZIP", `${nm}_pixellab.zip`)];
  return [I('png', 'PNG', 'Original pixels, 1×', `${nm}.png`)];
}
// Extra single-asset formats for the "Download options" dialog only, so menus stay at ≤ 4 items (E-7).
function dlExtras(c, x) {
  const a = x.asset, nm = slug(c.caption), an = x.anim >= 0 ? a.animations[x.anim] : null, multi = c.dirs.length > 1;
  const dir = x.dir && x.dir !== 'unknown' ? x.dir.replace('_', '-') : 'view', out = [];
  if (/character|object/.test(c.type) && an) out.push({ id: 'png', label: 'PNG · this frame', desc: `${an.name} · frame ${(x.frame || 0) + 1}, original pixels`, file: `${nm}_${slug(an.name)}_${dir}_${String(x.frame || 0).padStart(3, '0')}.png` });
  if (c.type === 'character') out.push({ id: 'pl', label: 'PixelLab sprite sheet', desc: "PixelLab's own sheet of this state, unchanged", file: `${nm}_pixellab-sheet.zip` });
  else if (c.type === 'object' && multi) out.push({ id: 'pl', label: 'PixelLab sprite sheet', desc: "PixelLab's own sheet, unchanged", file: `${nm}_pixellab-sheet.zip` });
  return out;
}
function openDlMenu(anchor, c) {
  const items = dlItems(c, dlCtx(c));
  openPop(anchor, `<div class="ph2">Download</div>` + items.map((it, i) => `<button class="mi" role="menuitem" data-act="dl-item" data-key="${c.key}" data-i="${i}">${ic('download')}<span class="two"><b>${esc(it.label)}</b><small>${esc(it.desc)}</small></span></button>`).join('')
    + `<hr><button class="mi" role="menuitem" data-act="dl-more" data-key="${c.key}">${ic('ellipsis')}<span>Download options…</span></button>`, { role: 'menu', sheet: true, label: 'Download ' + c.title });
}
function fakeSave(file) { if (coarse()) readySheet(file); else toast(`Downloaded ${file} (mockup: no file was saved)`, { icon: 'download' }); }
function readySheet(file) {
  return openDialog({ title: 'Your file is ready', cls: 'sm', body: `<p class="fname">${esc(file)}</p><p class="muted">Share it straight to an app, or save it to your device.</p>`,
    foot: `<button class="btn ghost" data-act="ready-dl">Download file</button><button class="btn primary" data-act="ready-share">Share or save…</button>` });
}
const PRESETS = [['sheets', 'Sprite sheets', 'One sheet + JSON per animated asset, sheets for tiles, PNG for stills'],
  ['frames', 'All frames', 'Every frame and still as its own PNG'],
  ['gifs', 'GIFs', "One GIF per animation and direction at each animation's current speed; stills as PNG"]];
function estimate(L, preset, baseOnly) {   // ponytail: rough heuristic; the real app sums known sizes
  let files = 0, kb = 0;
  L.forEach(c => (baseOnly ? [c.a] : c.states).forEach(a => {
    const dirs = Math.max(1, Object.keys(a.directions || {}).length), an = a.animations || [];
    const frames = an.reduce((s, x) => s + x.frameCount * Object.keys(x.frames).length, 0) + (c.frames > 1 ? c.frames : 0);
    const sprite = /character|object/.test(c.type), px = a.width * a.height;
    let n = 1;                                                    // metadata.json
    if (preset === 'sheets') n += sprite || c.frames > 1 || /tileset/.test(c.type) ? 2 : c.type === 'tiles_pro' ? 17 : 1;
    if (preset === 'frames') n += sprite ? dirs + frames : c.frames > 1 ? c.frames : /tileset|tiles_pro/.test(c.type) ? 16 : 1;
    if (preset === 'gifs') n += sprite ? (an.length ? an.reduce((s, x) => s + Object.keys(x.frames).length, 0) : dirs) : 1;
    files += n; kb += n * (2 + px / 900);
  }));
  return { files, mb: Math.max(0.1, kb / 1024).toFixed(1) };
}
const segRow = (id, label, opts) => `<span class="lbl-s" id="${id}">${label}</span><div class="seg" role="radiogroup" aria-labelledby="${id}">${opts.map((l, i) => `<button role="radio" aria-checked="${!i}" data-act="seg">${l}</button>`).join('')}</div>`;
const advHTML = file => `<details class="adv"><summary>Advanced</summary><div class="advb">
  ${segRow('ex-scale', 'Scale', ['Auto', '1×', '2×', '4×', '8×'])}
  ${segRow('ex-matte', 'GIF matte', ['Transparent', 'Backdrop color'])}
  <label class="lbl-s" for="ex-fn">File name</label><input id="ex-fn" class="input" value="${esc(file)}" spellcheck="false" autocomplete="off"></div></details>`;
const rcardHTML = (act, i, on, title, sub) => `<button class="rcard" role="radio" aria-checked="${on}" data-act="${act}" data-i="${i}"><span class="rd" aria-hidden="true"></span><span class="grow"><b>${esc(title)}</b><small>${esc(sub)}</small></span></button>`;
function openDownloadSingle(c) {   // "Download options": every format for this asset, scope and Advanced (E-7)
  const x = dlCtx(c), items = dlItems(c, x).concat(dlExtras(c, x)), st = { sel: 0 }, multiDir = c.dirs.length > 1, an = x.anim >= 0;
  const d = openDialog({ title: 'Download options', body: `<p class="muted" style="margin-top:-10px">${esc(c.caption)} · ${esc(c.T.label)}</p>
    <div class="rcards" role="radiogroup" aria-label="Format">${items.map((it, i) => rcardHTML('ex-pre', i, !i, it.label, it.desc)).join('')}</div>
    <div class="row" id="ex-scope"></div>${advHTML(items[0].file)}`,
    foot: `<p class="est" id="ex-est"></p><button class="btn ghost" data-act="dlg-close">Cancel</button><button class="btn primary" data-act="dlg-ok">${ic('download')}Download</button>` });
  d._st = st;
  d._upd = () => {
    const it = items[st.sel], one = /^(gif|png)$/.test(it.id) || (it.id === 'pl' && c.type !== 'character');
    $('#ex-scope', d).innerHTML = it.id === 'gif' && an && multiDir ? segRow('ex-dirs', 'Directions', ['This direction', 'All directions (ZIP)'])
      : /sheet|frames/.test(it.id) && an ? segRow('ex-anim', 'Animations', ['Everything', 'This animation']) : '';
    $('#ex-est', d).textContent = one ? '1 file · about 0.1 MB' : `${estimate([c], it.id === 'frames' ? 'frames' : 'sheets').files} files in one ZIP · about ${estimate([c], 'sheets').mb} MB`;
    $('#ex-fn', d).value = it.file;
  };
  d._ok = () => { const f = $('#ex-fn', d).value.trim() || items[st.sel].file; d.close(); fakeSave(f); };
  d._upd();
  return d;
}
function openDownloadMulti(L, scope) {
  if (!L.length) return toast('Nothing to download in this view.');
  const st = { preset: Math.max(0, PRESETS.findIndex(p => p[0] === store.get('preset', 'sheets'))), base: false }, hasStates = L.some(c => c.states.length > 1);
  const name = `vitrine-${scope}-${today()}.zip`;
  const d = openDialog({ title: `Download ${plural(L.length, 'asset')}`, body: `<p class="muted" style="margin-top:-10px">${breakdown(L)}</p>
    <div class="rcards three" role="radiogroup" aria-label="Preset">${PRESETS.map(([, t, s], i) => rcardHTML('ex-pre', i, i === st.preset, t, s)).join('')}</div>
    ${hasStates ? `<div class="row"><span class="lbl-s">Character states</span><div class="seg" role="radiogroup" aria-label="Character states"><button role="radio" aria-checked="true" data-act="seg" data-k="base" data-v="0">All states</button><button role="radio" aria-checked="false" data-act="seg" data-k="base" data-v="1">Base only</button></div></div>` : ''}
    ${advHTML(name)}`,
    foot: `<p class="est" id="ex-est"></p><button class="btn ghost" data-act="dlg-close">Cancel</button><button class="btn primary" data-act="dlg-ok">${ic('download')}Download</button>` });
  d._st = { get sel() { return st.preset; }, set sel(v) { st.preset = v; store.set('preset', PRESETS[v][0]); }, set base(v) { st.base = v; } };
  d._upd = () => { const e = estimate(L, PRESETS[st.preset][0], st.base); $('#ex-est', d).textContent = `${e.files} files in one ZIP · about ${e.mb} MB`; };
  d._ok = () => { const e = estimate(L, PRESETS[st.preset][0], st.base), f = $('#ex-fn', d).value.trim() || name; d.close(); runDownload(L, e, f); };
  d._upd();
  return d;
}
function runDownload(L, e, name) {
  if (S.exporting) return toast('A download is already running. Wait for it to finish or cancel it.');
  const chip = $('#expchip'), total = e.files, fail = S.flags.exportFail ? [L[L.length - 1]] : [];
  let done = 0, mile = 0;
  chip.hidden = false; announce(`Downloading ${plural(L.length, 'asset')}`);
  const paint = () => { chip.innerHTML = `${ic('download', 'sm')}<span>Downloading ${done} / ${total} files · ${(e.mb * done / total).toFixed(1)} MB</span><button class="btn" data-act="exp-cancel">Cancel</button><span class="bar" style="width:${done / total * 100}%"></span>`; };
  paint();
  S.exporting = setInterval(() => {
    done = Math.min(total, done + Math.max(1, Math.ceil(total / 30))); paint();
    const pct = Math.floor(done / total * 4) * 25; if (pct > mile && pct < 100) { mile = pct; announce(`Download ${pct}% done`); }
    if (done < total) return;
    clearInterval(S.exporting); S.exporting = null; chip.hidden = true;
    // Non-blocking partial-failure toast (from C), opening the report on demand.
    if (fail.length) toast(`Downloaded ${plural(L.length - fail.length, 'asset')}. ${fail.length} couldn't be downloaded.`, { icon: 'triangle-alert', warn: true, action: 'View report', onAction: () => openReport(fail) });
    else toast(`Downloaded ${plural(L.length, 'asset')} as ${name} (mockup: no file was saved).`, { icon: 'download' });
    if (coarse()) readySheet(name);
  }, 120);
}
function openReport(fail) {
  const items = fail.map((c, i) => ({ c, retry: i % 2 === 0, why: i % 2 === 0 ? 'Network problem.' : 'Not found in PixelLab. It may have been deleted.' }));
  const retry = items.filter(x => x.retry).map(x => x.c);
  const d = openDialog({ title: 'Download report', body: `<p class="muted">The ZIP finished. These items weren't included:</p><ul class="rep">${items.map(x => `<li><b>${esc(x.c.caption)}</b><span class="muted">${esc(x.c.T.label)} · ${x.why}</span></li>`).join('')}</ul>`,
    foot: `<button class="btn ghost" data-act="dlg-close">Close</button>${retry.length ? `<button class="btn primary" data-act="dlg-ok">Retry failed</button>` : ''}` });
  d._ok = () => { d.close(); S.flags.exportFail = false; runDownload(retry, estimate(retry, 'sheets'), `vitrine-retry-${today()}.zip`); };
}

// ===================== sync (faked timer queue; F-14 streamed reveal) =====================
function startSync(first) {
  clearInterval(S.syncTimer);
  S.syncing = true; S.loaded = new Set(); S.mapShown = false; S.fresh = new Set();
  if (first) S.seenChips = new Set();
  const queues = {}; cards.slice().sort(sorter()).forEach(c => { (queues[c.T.chip] = queues[c.T.chip] || []).push(c); });
  S.syncPer = {}; Object.keys(queues).forEach(k => { S.syncPer[k] = [0, queues[k].length]; });
  renderAll(); announce('Syncing your library');
  let half = false;
  S.syncTimer = setInterval(() => {
    S.fresh = new Set();
    Object.keys(queues).forEach(k => { const q = queues[k].splice(0, 2); q.forEach(c => { S.loaded.add(c.key); S.fresh.add(c.key); S.seenChips.add(c.T.chip); }); S.syncPer[k][0] += q.length; });
    if (!half && S.loaded.size >= cards.length / 2) { half = true; announce('Halfway there'); }
    if (S.loaded.size >= cards.length) {
      clearInterval(S.syncTimer); S.syncing = false; S.lastSync = Date.now();
      announce(`Library synced. ${plural(cards.length, 'asset')}.`);
      if (first && !S.remember && !S.keepAnswered) S.keepBanner = true;            // F-10: offer "keep me signed in" after first sync
    }
    updateResult(); renderContent(true); renderNav();
    if (pop.matches(':popover-open') && pop.classList.contains('syncpop')) pop.innerHTML = syncPopHTML();
  }, 300);
}
function syncPopHTML() {
  return `<div class="ph2">Library status</div>${CHIPS.slice(1).map(([k, l]) => {
    const p = S.syncPer[k] || [cards.filter(c => c.T.chip === k).length, cards.filter(c => c.T.chip === k).length];
    const bad = S.flags.partial && k === 'maps', gated = S.flags.gate && k === 'images';
    return `<div class="prow"><span class="grow">${l}</span>${bad ? `<span style="color:var(--danger)">Maps couldn't be loaded.</span><button class="btn link" data-act="retry">Retry</button>` : gated ? 'Not available yet' : `${p[0]} of ${p[1]} ${p[0] === p[1] ? ic('check', 'xs') : ''}`}</div>`;
  }).join('')}${S.flags.rate ? '<p class="prow">PixelLab asked us to slow down. Continuing shortly…</p>' : ''}${S.flags.offline ? '<p class="prow">Offline · showing your saved library</p>' : ''}<hr>
  <button class="mi" data-act="sync-now">${ic('refresh-cw')}<span>Sync now</span></button><p class="prow">Last synced ${syncAgo()}</p>`;
}

// ===================== connect (F-10) =====================
function keyForm(id, cta) {
  return `<form class="kform" id="${id}" novalidate>
    <input class="vh" type="text" name="username" autocomplete="username" value="PixelLab API key" tabindex="-1" aria-hidden="true">
    <label for="${id}-key">PixelLab API key</label>
    <div class="keyrow"><input class="input" id="${id}-key" name="password" type="password" autocomplete="current-password" placeholder="Paste your API key" spellcheck="false" autocapitalize="off" aria-describedby="${id}-st ${id}-help">
      <button type="button" class="btn ghost" data-act="key-show" aria-pressed="false">Show</button></div>
    <p class="helper" id="${id}-help">We test it as soon as you paste it.</p>
    <p class="kst" id="${id}-st" role="status"></p>
    <button type="submit" class="btn primary wide">${cta || 'Test key'}</button>
  </form>`;
}
const STEPS_HTML = `<section class="getkey" aria-labelledby="gk-h"><h2 class="sec-label" id="gk-h">Get your API key</h2><ol class="steps">
  <li><span class="n" aria-hidden="true">1</span><span>${extLink(PL + '/account', 'Open your PixelLab account page ↗', '')} <span class="faint">(sign in if PixelLab asks)</span></span></li>
  <li><span class="n" aria-hidden="true">2</span><span>Tap <b>Copy API key</b>. It's a secret token, so keep it private.</span></li>
  <li><span class="n" aria-hidden="true">3</span><span>Come back to this tab and paste it.</span></li></ol></section>`;
function showConnect(welcome) {
  if (V.open) closeViewer();
  clearInterval(S.syncTimer); S.syncing = false; S.connected = false; exitSelect();
  $('#app').hidden = true; $('#selbar').hidden = true;
  const el = $('#connect'); el.hidden = false;
  el.innerHTML = `<div class="cwrap">
    <div class="cc"><div class="brand">${MARK}<span>Vitrine</span></div><p class="desc">Unofficial gallery for your PixelLab assets</p>
      ${welcome ? '<p class="welcome">Welcome back! You chose not to stay signed in, so paste your API key again.</p>' : ''}
      <h1>Your PixelLab art, all in one place</h1>
      <p class="value">Vitrine shows everything in your PixelLab account. It only looks. It never creates, changes, or deletes anything.</p></div>
    <div class="cc">${STEPS_HTML}${keyForm('cf')}
      <p class="note-key">${ic('key-round')}<span>PixelLab API keys give full access to your account, including spending credits. Vitrine only reads.</span></p>
      <button class="btn ghost wide" type="button" data-act="use-sample">Use sample library</button>
      <p class="mocknote">Mockup: any value connects and “bad” shows the error. Nothing you type is kept, shown or sent.</p></div></div>
    <footer class="cfoot"><p>Your API key goes only to PixelLab's API. No servers, no analytics.</p><p>Unofficial. Not affiliated with or endorsed by PixelLab.</p></footer>`;
  history.replaceState(null, '', '#/connect'); updateTitle();
  if (!coarse()) $('#cf-key').focus();                                              // no autofocus under the touch keyboard
}
function submitKey(form, onOk) {
  const inp = form.querySelector('input[name=password]'), st = form.querySelector('.kst'), btn = form.querySelector('[type=submit]');
  const show = (html, cls) => { st.className = 'kst' + (cls ? ' ' + cls : ''); st.innerHTML = html; };
  const bad = m => { show(ic('triangle-alert', 'sm') + `<span>${m}</span>`, 'bad'); inp.focus(); };
  const v = inp.value.trim();
  if (!v) return bad('Paste your API key first.');
  if (S.flags.offline || S.flags.offlineEmpty) return bad("You're offline. Connect to the internet and try again.");
  show(ic('loader-circle', 'sm spin') + '<span>Checking your key…</span>'); btn.disabled = true; inp.readOnly = true;
  setTimeout(() => {
    btn.disabled = false; inp.readOnly = false;
    if (v === 'bad') return bad("That key didn't work. Copy it again from your PixelLab account page and paste it here.");
    if (S.flags.cors) return bad('PixelLab is blocking this browser. PixelLab may have changed how its API works with websites. Nothing is wrong with your account.');
    inp.value = '';                                     // the mockup never keeps, logs or shows what was typed
    show(ic('check', 'sm') + '<span>Key works. Loading your library…</span>', 'ok');
    setTimeout(onOk, 450);
  }, 700);
}
function enterApp(sync) {
  const el = $('#connect'); el.hidden = true; el.innerHTML = '';
  $('#app').hidden = false; S.connected = true;
  try { sessionStorage.setItem('vitrine-rec-session', '1'); } catch (e) { /* ignore */ }
  store.set('lastMode', S.remember ? 'kept' : 'session');
  if (!location.hash || location.hash === '#/connect') history.replaceState(null, '', '#/');
  const r = parseHash(); S.view = 'library';
  if (sync) startSync(true); else renderAll();
  if (r.view !== 'library' || r.type !== 'all' || r.key) applyRoute(false);
}
function reconnectDialog() {
  announce('Your PixelLab API key stopped working. Reconnect to continue.', true);
  const d = openDialog({ title: 'Reconnect to PixelLab', cls: 'sm', body: `<p class="muted">Your API key stopped working. It may have been replaced in your PixelLab account. Paste a new one to continue. Your folders and favorites are safe.</p>
    <p>${extLink(PL + '/account', 'Get a new API key ↗', 'linkish')}</p>${keyForm('rc', 'Reconnect')}` });
  if (!coarse()) $('#rc-key', d).focus();
  return d;
}

// ===================== settings, help =====================
const FLAGS = [['offline', 'Offline · saved library'], ['offlineEmpty', 'Offline · nothing saved'], ['cors', 'PixelLab blocking this browser'], ['partial', 'Partial sync'], ['rate', 'Rate limited'],
  ['empty', 'Empty library'], ['emptyFav', 'Empty favorites'], ['noFolders', 'No folders'], ['gate', 'Images unavailable'], ['exportFail', 'Download: 1 item fails']];
const keepHelp = () => S.remember ? "Your key is saved in this browser, so you won't paste it again. Anyone using this browser profile could use it." : 'Your key is kept for this session only. You\'ll paste it again next time.';
function openSettings(toMock) {
  const sw = (chg, on, label, help, id) => `<label class="switch"><input type="checkbox" role="switch" data-chg="${chg}"${on ? ' checked' : ''}${help ? ` aria-describedby="${id}"` : ''}><span>${label}</span></label>${help ? `<p class="helper" id="${id}">${help}</p>` : ''}`;
  const d = openDialog({ title: 'Settings', cls: 'wide full', body: `
  <section class="set-sec"><h3>Account</h3>
    <div class="acct"><span class="dot" aria-hidden="true"></span><div><b>Connected to PixelLab</b><p class="muted">PixelLab API key: hidden · ${S.remember ? 'kept on this device' : 'this session only'}</p><p class="muted">Sample plan · 1,840 generations left · 312 credits</p></div></div>
    <div class="row"><button class="btn ghost" data-act="key-test">${ic('check', 'sm')}Test key</button><button class="btn ghost danger" data-act="forget">Forget key</button><span class="kst" id="key-test-st" role="status"></span></div>
    ${sw('s-keep', S.remember, 'Keep me signed in on this device', keepHelp(), 's-keep-h')}
    <p>${extLink(PL + '/account', 'Rotate your key in your PixelLab account ↗', 'linkish')}</p></section>
  <section class="set-sec"><h3>Display</h3><div class="row"><span class="grow">Theme</span><div class="seg" role="radiogroup" aria-label="Theme">${[['system', 'System', 'monitor'], ['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']].map(([v, l, i]) => `<button role="radio" aria-checked="${S.theme === v}" data-act="theme" data-v="${v}">${ic(i, 'sm')} ${l}</button>`).join('')}</div></div>
    ${sw('s-keys', S.shortcuts, 'Single-key shortcuts', 'Turn off if you use speech input or keys clash with your assistive tech.', 's-keys-h')}<div><button class="btn ghost" data-act="help">${ic('keyboard', 'sm')}Show shortcuts</button></div></section>
  <section class="set-sec"><h3>Your data</h3><p>${plural(S.folders.length, 'folder')} · ${plural(S.favorites.size, 'favorite')} · using 84 MB</p>
    <div class="row"><button class="btn ghost" data-act="backup">${ic('download', 'sm')}Download backup (.json)</button><button class="btn ghost" data-act="import">Import backup…</button>${S.remember ? '<button class="btn ghost" data-act="clear-img">Clear saved images</button>' : ''}</div>
    <p class="helper">Folders and favorites live only in this browser. Download a backup now and then.</p></section>
  <section class="set-sec"><h3>About</h3><p><b>Vitrine</b> · Unofficial gallery for your PixelLab assets · recommended mockup</p>
    <p class="muted">Vitrine is an unofficial gallery for your PixelLab assets. It isn't made by, affiliated with, or endorsed by PixelLab.</p>
    <p class="muted">No analytics, no tracking, no servers. Vitrine talks only to PixelLab's API and image host.</p>
    <p class="muted">Other PixelLab content isn't in the public API yet: fonts, effects, portraits and talking animations stay in PixelLab. ${extLink(PL, 'Open PixelLab ↗', 'linkish')}</p>
    <p class="faint">Icons: Lucide (ISC). Source: link to come.</p></section>
  <section class="set-sec mock" id="mock-sec"><h3>Mockup states</h3><p class="helper">Not part of the product. Toggle states to review them.</p>
    <div class="row"><button class="btn ghost" data-act="m-connect">Connect</button><button class="btn ghost" data-act="m-welcome">Connect · welcome back</button><button class="btn ghost" data-act="m-sync">Replay first sync</button>
      <button class="btn ghost" data-act="m-401">Key stopped working</button><button class="btn ghost" data-act="m-ready">Ready sheet</button><button class="btn ghost" data-act="m-tip">Backup tip</button><button class="btn ghost" data-act="m-keep">Keep-signed-in banner</button></div>
    <div class="grid2">${FLAGS.map(([k, l]) => `<label class="switch"><input type="checkbox" role="switch" data-chg="flag" data-k="${k}"${S.flags[k] ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div></section>` });
  if (toMock) setTimeout(() => $('#mock-sec', d).scrollIntoView({ block: 'start' }), 0);
  return d;
}
const KEYS = {
  Library: [['/', 'Focus search'], ['?', 'Shortcuts and gestures'], ['← ↑ → ↓', 'Move between cards'], ['Home End', 'First or last card'], ['Enter Space', 'Open (selecting: select or deselect)'],
    ['x', 'Select or deselect'], ['Ctrl A', 'Select all in view'], ['L', 'Favorite'], ['D', 'Download'], ['+ −', 'Grid size'], ['Shift F10', 'Card menu'], ['Esc', 'Close the top layer, then selection']],
  Viewer: [['← →', 'Previous or next asset'], ['Space', 'Play or pause'], [', .', 'Frame back or forward'], ['[ ]', 'Rotate direction'], ['Home End', 'First or last frame'],
    ['+ −', 'Zoom'], ['Z', 'Fit or actual size'], ['Shift ←↑→↓', 'Pan'], ['I', 'Info panel'], ['F', 'Fullscreen'], ['L', 'Favorite'], ['D', 'Download'], ['Esc', 'Close the viewer']]
};
const GESTURES = {
  Library: [['Tap', 'Open'], ['Long-press', 'Start selecting'], ['Tap while selecting', 'Select or deselect'], ['Pinch', 'Browser zoom (grid size has its own control)']],
  Viewer: [['Swipe ← →', 'Next or previous asset'], ['Swipe ↓', 'Close'], ['Swipe ↑', 'Expand info'], ['Tap a frame', 'Jump to that frame'], ['Tap the art', 'Show or hide controls (landscape)'], ['Double-tap', 'Fit or zoom in'], ['Drag (zoomed)', 'Pan']]
};
function helpBody(tab) {
  const T = tab === 'keys' ? KEYS : GESTURES;
  return `${!S.shortcuts && tab === 'keys' ? `<p class="banner" style="margin:0">${ic('keyboard')}<span class="grow">Single-key shortcuts are off. Turn them on in Settings.</span></p>` : ''}
  <div class="keys">${Object.keys(T).map(g => `<div><h3>${g}</h3><dl>${T[g].map(([k, l]) => `<dt>${tab === 'keys' ? k.split(' ').map(x => `<span class="kbd">${x}</span>`).join('') : k}</dt><dd>${l}</dd>`).join('')}</dl></div>`).join('')}</div>`;
}
function openHelp() {
  const tab = coarse() ? 'gestures' : 'keys';
  return openDialog({ title: 'Shortcuts and gestures', cls: 'wide', body: `<div class="seg" role="radiogroup" aria-label="Show">${[['keys', 'Keys'], ['gestures', 'Gestures']].map(([v, l]) => `<button role="radio" aria-checked="${v === tab}" data-act="help-tab" data-v="${v}">${l}</button>`).join('')}</div><div id="help-b">${helpBody(tab)}</div>` });
}

// ===================== search mode (F-13: never hides navigation) =====================
function startSearch() {
  if (S.view === 'folders') { S.view = 'library'; S.folderId = null; S.type = 'all'; history.pushState(null, '', '#/'); renderAll(); }
  document.body.classList.add('searching'); const q = $('#q'); if (q) q.focus();
}
function endSearch() { document.body.classList.remove('searching'); }

// ===================== events: clicks =====================
const ACT = {
  skip: (t, e) => { e.preventDefault(); focusCard(S.focusKey, true); },
  'sb-toggle': () => { S.sbc = !S.sbc; store.set('sbc', S.sbc); renderNav(); requestAnimationFrame(refitAll); },
  chip: t => { S.type = t.dataset.type; history.replaceState(null, '', parentHash()); updateResult(); renderContent(); $('#main').scrollTop = 0; const c = $(`.chip[data-type="${S.type}"]`); if (c) c.focus(); announceCount(); },
  'q-clear': () => { S.q = ''; const q = $('#q'); if (q) q.value = ''; updateSearchUI(); renderContent(); updateResult(); if (q) q.focus(); },
  'search-cancel': () => { S.q = ''; const q = $('#q'); if (q) { q.value = ''; q.blur(); } endSearch(); updateSearchUI(); renderContent(); updateResult(); },
  'search-all': () => { S.type = 'all'; history.replaceState(null, '', parentHash()); updateResult(); renderContent(); announceCount(); },
  'search-open': () => startSearch(),
  previews: () => setPreviews(!S.previews),
  select: () => { if (S.selecting) exitSelect(); else enterSelect(); },
  'sort-menu': t => openPop(t, '<div class="ph2">Sort</div>' + sortMenu(), { role: 'menu' }),
  'view-menu': t => openPop(t, `<div class="ph2">Sort</div>${sortMenu()}<hr><div class="ph2" id="vs-size">Grid size</div>
    <div class="prow"><div class="seg sizer" role="radiogroup" aria-labelledby="vs-size">${SIZES.map(s => `<button role="radio" aria-checked="${S.size === s}" tabindex="${S.size === s ? 0 : -1}" data-act="size-set" data-v="${s}" aria-label="${SIZE_NAME[s]}">${s}</button>`).join('')}</div></div><hr>
    <label class="switch mi-switch"><input type="checkbox" role="switch" data-chg="previews"${S.previews ? ' checked' : ''}><span>Play previews</span></label>`, { sheet: true, label: 'View' }),
  'sort-set': t => { S.sort = t.dataset.v; store.set('sort', S.sort); hidePop(); renderHeader(); renderContent(); },
  'size-set': t => setSize(t.dataset.v),
  more: t => openPop(t, menuHTML([['view-download', `Download all ${viewList().length}…`, 'download'], ['sync-now', 'Sync now', 'refresh-cw'], ['help', coarse() ? 'Gestures and shortcuts' : 'Keyboard shortcuts', 'keyboard']])
    + extLink(PL, `${ic('external-link')}<span>Open PixelLab ↗</span>`, 'mi', ' role="menuitem"') + '<hr>' + menuHTML([['m-states', 'Mockup states…', 'triangle-alert']]), { role: 'menu', sheet: true }),
  'view-download': () => { hidePop(); const f = curFolder(); openDownloadMulti(viewList(), f ? 'folder-' + slug(f.name) : S.view === 'favorites' ? 'favorites' : S.type !== 'all' ? S.type : 'library'); },
  'folder-download': () => { const f = curFolder(); openDownloadMulti(baseList(), 'folder-' + slug(f.name)); },
  'folder-menu': t => openFolderMenu(t, t.dataset.fid),
  'folder-rename': t => { hidePop(); const f = S.folders.find(x => x.id === t.dataset.fid); folderNameDialog('Rename folder', f.name, 'Save', v => { f.name = v; refreshOrg(); renderHeader(); }, f); },
  'folder-delete': t => { hidePop(); deleteFolder(S.folders.find(x => x.id === t.dataset.fid)); },
  'new-folder': () => { hidePop(); newFolder(); },
  'rm-missing': () => { const f = curFolder(); if (f) f.missing = 0; else S.favMissing = 0; renderContent(); toast('Removed items that are no longer in your library.'); },
  'sync-pop': t => openPop(t, syncPopHTML(), { cls: 'syncpop', sheet: true, label: 'Library status' }),
  'sync-now': () => { hidePop(); $$('dialog.dlg[open]').forEach(d => d.close()); S.flags.partial = false; startSync(false); },
  retry: () => { hidePop(); S.flags.cors = S.flags.offlineEmpty = S.flags.partial = false; renderAll(); toast('Trying again…'); },
  inprog: t => { const by = {}; pending.forEach(a => { const k = TYPES[a.type].chip; by[k] = by[k] || { g: 0, r: 0, f: 0 }; by[k][a.status === 'review' ? 'r' : a.status === 'failed' ? 'f' : 'g']++; });
    openPop(t, '<div class="ph2">In progress in PixelLab</div>' + Object.keys(by).map(k => { const l = CHIPS.find(c => c[0] === k)[1], b = by[k];
      return `<p class="prow"><b>${l}</b>&nbsp;· ${b.g} generating · ${b.r} needs review · ${b.f} failed</p>${extLink(PL + '/create-object', `${ic('external-link')}<span>Open ${l} in PixelLab ↗</span>`, 'mi')}`; }).join('') + '<p class="prow faint">Vitrine shows finished assets only.</p>', { sheet: true, label: 'In progress in PixelLab' }); },
  'keep-yes': () => { S.remember = true; S.keepBanner = false; S.keepAnswered = true; store.set('keepAnswered', true); store.set('lastMode', 'kept'); renderContent(); toast("You'll stay signed in on this device. Change it any time in Settings."); },
  'keep-no': () => { S.keepBanner = false; S.keepAnswered = true; store.set('keepAnswered', true); renderContent(); },
  settings: () => { hidePop(); openSettings(); },
  'm-states': () => { hidePop(); openSettings(true); },
  help: () => { hidePop(); openHelp(); },
  'help-tab': t => { $$('[data-act="help-tab"]', t.parentNode).forEach(b => b.setAttribute('aria-checked', b === t)); $('#help-b').innerHTML = helpBody(t.dataset.v); },
  // cards
  'card-check': t => toggleSel(t.dataset.key),
  'card-menu': t => openCardMenu(t, card(t.dataset.key)),
  fav: t => toggleFav(t.dataset.key),
  open: t => { hidePop(); navOpen(card(t.dataset.key)); },
  'select-card': t => { hidePop(); toggleSel(t.dataset.key, true); },
  'add-folder': t => openFolderPicker(t.closest('.pop') ? pop._anchor : t, [t.dataset.key]),
  'rm-folder': t => { hidePop(); removeFrom(curFolder(), [t.dataset.key]); },
  'dl-menu': t => openDlMenu(t.closest('.pop') ? pop._anchor : t, card(t.dataset.key)),
  'dl-item': t => { hidePop(); const c = card(t.dataset.key); fakeSave(dlItems(c, dlCtx(c))[+t.dataset.i].file); },
  'dl-more': t => { hidePop(); openDownloadSingle(card(t.dataset.key)); },
  'pl-menu': t => openPlMenu(t, card(t.dataset.key)),
  'play-anim': t => { const c = card(t.dataset.key); if (V.open && V.card === c) { setAnim(+t.dataset.i); if (!V.playing) play(); } else navOpen(c, { anim: t.dataset.i }); },
  tag: t => {   // 02 §3.3 step 5: close the viewer, Library search becomes #tag
    S.q = '#' + t.dataset.tag; S.keepQ = true; S.type = 'all';
    history.replaceState(null, '', '#/'); if (V.open) closeViewer();
    if (S.view !== 'library') applyRoute(true); else { S.keepQ = false; renderHeader(); renderContent(); }
    if (vp() === 'phone' || vp() === 'compact') document.body.classList.add('searching');
    announceCount();
  },
  'copy-text': t => { try { navigator.clipboard.writeText(t.dataset.text).catch(() => {}); } catch (e) { /* clipboard blocked */ } copied(t, t.dataset.msg || 'Copied'); },
  'copy-id': t => copied(t, 'Asset ID copied'),
  'copy-img': () => toast('Image copied. Paste or drop it into PixelLab.'),
  'fps-reset': t => { if (t.dataset.fk) { delete S.fps[t.dataset.fk]; if (V.open) { buildPlayer(); updateFpsUI(); renderViewerInsp(); } } else setFps(8); if (t.id === 'fps-pop-reset') { const o = $('#fps-out', pop); if (o) o.focus(); } },
  // folder picker
  'fp-new': () => { pop._ctx.creating = true; pop.innerHTML = pop._ctx.rows(); $('#fp-name', pop).focus(); },
  'fp-create': () => createFromPicker(),
  'fp-toggle': t => { const f = S.folders.find(x => x.id === t.dataset.fid), keys = pop._ctx.keys; if (t.getAttribute('aria-checked') === 'true') removeFrom(f, keys); else addTo(f, keys); pop.innerHTML = pop._ctx.rows(); const b = pop.querySelector(`[data-fid="${f.id}"]`); if (b) b.focus(); },
  'pop-close': () => hidePop(),
  // selection
  'sel-clear': () => exitSelect(),
  'sel-all': () => selectAll(),
  'sel-fav': () => bulkFav(Array.from(S.sel)),
  'sel-folder': t => openFolderPicker(t, Array.from(S.sel)),
  'sel-rm': () => removeFrom(curFolder(), Array.from(S.sel)),
  'sel-download': t => { const L = Array.from(S.sel).map(card); if (L.length === 1) openDlMenu(t, L[0]); else openDownloadMulti(L, 'selection-' + L.length); },
  // dialogs
  'dlg-close': t => t.closest('dialog').close(),
  'dlg-ok': t => { const d = t.closest('dialog'); if (d._ok) d._ok(); },
  'ex-pre': t => { const d = t.closest('dialog'); $$('.rcard', d).forEach(b => b.setAttribute('aria-checked', b === t)); d._st.sel = +t.dataset.i; d._upd(); },
  seg: t => { $$('button', t.parentNode).forEach(b => b.setAttribute('aria-checked', b === t)); const d = t.closest('dialog'); if (d && t.dataset.k) { d._st[t.dataset.k] = t.dataset.v === '1'; d._upd(); } },
  'exp-cancel': () => { clearInterval(S.exporting); S.exporting = null; $('#expchip').hidden = true; toast('Download canceled. Nothing was saved.'); },
  'ready-dl': t => { t.closest('dialog').close(); toast('Saved (mockup: no file was written).'); },
  'ready-share': t => { t.closest('dialog').close(); toast('Share sheet opened (mockup).'); },
  // settings + account
  'key-test': () => { const s = $('#key-test-st'); s.className = 'kst'; s.innerHTML = ic('loader-circle', 'sm spin') + '<span>Checking…</span>'; setTimeout(() => { if (s.isConnected) { s.className = 'kst ok'; s.innerHTML = ic('check', 'sm') + '<span>Key works · checked just now</span>'; } }, 600); },
  forget: () => confirmDialog('Forget your API key?', "Vitrine will disconnect on this device and delete its saved copy of your library. Your PixelLab account isn't affected.", 'Forget key', also => {
    if (also) { S.folders = []; S.favorites.clear(); S.favMissing = 0; }
    $$('dialog.dlg[open]').forEach(d => d.close());
    try { sessionStorage.removeItem('vitrine-rec-session'); } catch (e) { /* ignore */ }
    S.remember = false; showConnect(false); toast('API key forgotten.');
  }, `<label class="switch"><input type="checkbox"><span>Also delete my folders and favorites</span></label><p class="helper">Your browser may still keep some images in its own cache. Clear your browsing data to remove them.</p>`),
  theme: t => { S.theme = t.dataset.v; store.set('theme', S.theme); applyTheme(); $$('[data-act="theme"]').forEach(b => b.setAttribute('aria-checked', b === t)); },
  backup: () => toast('Backup saved as vitrine-backup.json (mockup: no file was written).'),
  import: () => toast('Imported 0 folders (0 merged) and 0 favorites. 0 items aren\'t in this library. (mockup)'),
  'clear-img': () => toast('Saved images cleared. Your folders and favorites are safe.'),
  'tip-off': () => { S.tipOff = true; S.flags.tip = false; renderContent(); },
  'key-show': t => { const i = t.parentNode.querySelector('input'), on = i.type === 'password'; i.type = on ? 'text' : 'password'; t.textContent = on ? 'Hide' : 'Show'; t.setAttribute('aria-pressed', on); },
  'use-sample': () => enterApp(true),
  'm-connect': () => { $$('dialog.dlg[open]').forEach(d => d.close()); showConnect(false); },
  'm-welcome': () => { $$('dialog.dlg[open]').forEach(d => d.close()); showConnect(true); },
  'm-sync': () => { $$('dialog.dlg[open]').forEach(d => d.close()); S.keepAnswered = false; startSync(true); },
  'm-401': () => { $$('dialog.dlg[open]').forEach(d => d.close()); reconnectDialog(); },
  'm-ready': () => readySheet('android-courier_walk_east@2x.gif'),
  'm-tip': () => { S.tipOff = false; S.flags.tip = true; $$('dialog.dlg[open]').forEach(d => d.close()); go('#/folders'); },
  'm-keep': () => { $$('dialog.dlg[open]').forEach(d => d.close()); S.keepBanner = true; go('#/'); renderContent(); },
  // viewer
  'v-close': () => closeViewerNav(),
  'v-prev': () => navStep(-1), 'v-next': () => navStep(1),
  'v-play': () => togglePlay(), 'v-stepb': () => stepFrame(-1), 'v-stepf': () => stepFrame(1),
  'v-seek': t => seekFrame(+t.dataset.i),
  'v-loop': t => { V.loop = !V.loop; t.setAttribute('aria-pressed', V.loop); },
  'v-loopm': t => { V.loop = !V.loop; $('#v-loop').setAttribute('aria-pressed', V.loop); t.setAttribute('aria-checked', V.loop); announce(V.loop ? 'Loop on' : 'Loop off, plays once'); },
  'fps-pop': t => openPop(t, `<div class="ph2">Playback speed</div><div class="fps-pop"><button class="btn icon ghost" data-act="fps-dn" aria-label="Slower">${ic('minus')}</button><output id="fps-out" aria-live="polite">${fpsOf(fpsKey())} fps</output><button class="btn icon ghost" data-act="fps-up" aria-label="Faster">${ic('plus')}</button></div>
    <button class="mi" data-act="fps-reset" id="fps-pop-reset"${S.fps[fpsKey()] ? '' : ' disabled'}>${ic('rotate-ccw')}<span>Reset to 8 fps</span></button>
    <button class="mi" role="menuitemcheckbox" aria-checked="${V.loop}" data-act="v-loopm"><span class="cbx">${ic('check')}</span><span>Loop</span></button>`, { label: 'Playback speed' }),
  'v-stepbm': () => { hidePop(); stepFrame(-1); }, 'v-stepfm': () => { hidePop(); stepFrame(1); },
  'v-ztm': () => { hidePop(); setZoom(V.zoom === 'fit' ? 1 : 'fit'); },
  'fps-up': () => setFps(fpsOf(fpsKey()) + 1), 'fps-dn': () => setFps(fpsOf(fpsKey()) - 1),
  'v-anim': t => setAnim(+t.dataset.v),
  'v-pick': t => openPop(t, `<div role="radiogroup" aria-label="Animation">${menuHTML([['v-animm', 'Rotations', '', V.anim < 0, -1]].concat(V.asset.animations.map((a, i) => ['v-animm', `${esc(a.name)} · ${a.frameCount} frames`, '', V.anim === i, i])), '').replace(/role="menuitemradio"/g, 'role="radio"')}</div>`, { label: 'Animation' }),
  'v-animm': t => { hidePop(); setAnim(+t.dataset.v); },
  'v-state': t => setState(+t.dataset.v),
  'v-statepick': t => openPop(t, `<div role="radiogroup" aria-label="State">${menuHTML(V.card.states.map((s, i) => ['v-statem', esc(stateLabel(s)), '', V.si === i, i])).replace(/role="menuitemradio"/g, 'role="radio"')}</div>`, { label: 'State' }),
  'v-statem': t => { hidePop(); setState(+t.dataset.v); },
  'v-dir': t => openCompass(t),
  'v-dirset': t => { setDir(t.dataset.v); if (t.closest('.pop')) { if (coarse()) hidePop(); else openCompass(pop._anchor); } else { const b = $(`#v-compass [data-v="${V.dir}"]`); if (b) b.focus(); } },
  'v-grid': t => { V.grid = !V.grid; t.setAttribute('aria-pressed', V.grid); $('#v-tgrid').classList.toggle('on', V.grid); },
  'v-bd': t => openBackdrop(t),
  'v-bdmenu': () => { const a = pop._anchor; hidePop(); openBackdrop(a); },
  'v-bdset': t => setBackdrop(t.dataset.val),
  'v-zt': () => setZoom(V.zoom === 'fit' ? 1 : 'fit'),
  'v-zi': () => { hidePop(); zoomStep(1); }, 'v-zo': () => { hidePop(); zoomStep(-1); },
  'v-more': t => {   // one ⋯ per screen; on phones it also holds step, zoom and Download (E-3)
    const v = vp(), small = v === 'phone' || v === 'compact', pl = plinks(V.card), tr = transportOn();
    openPop(t, menuHTML([small && ['dl-menu-v', 'Download…', 'download'],
      small && tr && ['v-stepbm', 'Previous frame', 'step-back'], small && tr && ['v-stepfm', 'Next frame', 'step-forward'],
      small && ['v-zi', 'Zoom in', 'plus'], small && ['v-zo', 'Zoom out', 'minus'], small && ['v-ztm', V.zoom === 'fit' ? 'Actual size (1:1)' : 'Fit to screen', 'maximize-2'],
      v === 'compact' && ['v-bdmenu', `Backdrop: ${bdName()}…`, 'contrast'],
      ['copy-img', 'Copy image', 'copy'], ['v-copyp', 'Copy prompt', 'copy'], /creator_image|map$/.test(V.card.type) && ['v-reload', 'Reload from PixelLab', 'refresh-cw'],
      document.fullscreenEnabled && !coarse() && ['v-fs', 'Fullscreen', 'maximize-2'], ['help', coarse() ? 'Gestures and shortcuts' : 'Keyboard shortcuts', 'keyboard']])
      + (small ? extLink(pl.open, `${ic('external-link')}<span>Open in PixelLab ↗</span>`, 'mi', ` role="menuitem"${copyAttr(pl)}`) : ''), { role: 'menu', sheet: true });
  },
  'dl-menu-v': () => { const a = pop._anchor; hidePop(); openDlMenu(a, V.card); },
  'v-copyp': () => { hidePop(); toast('Prompt copied'); },
  'v-reload': () => { hidePop(); loadFrames(); toast('Reloaded from PixelLab.'); },
  'v-fs': () => { hidePop(); fullscreen(); },
  'v-info': () => toggleInfo(),
  'sheet-toggle': () => setDetent($('#v-insp').dataset.detent === 'full' ? 'peek' : nextDetent[$('#v-insp').dataset.detent])
};
function openCompass(anchor) {
  const av = availDirs();
  openPop(anchor, `<div class="compass" role="radiogroup" aria-label="Direction">${COMPASS.map(d => d ? `<button role="radio" aria-checked="${d === V.dir}" data-act="v-dirset" data-v="${d}" aria-label="${DIR_NAME(d)}"${av.includes(d) ? '' : ' disabled'}>${ic('arrow-up', '', 'rotate:' + ROT[d] + 'deg')}</button>` : `<span aria-hidden="true">${DIR_AB[V.dir] || ''}</span>`).join('')}</div>`, { cls: 'tight', label: 'Direction' });
}
function openBackdrop(anchor) {
  openPop(anchor, `<div class="ph2">Backdrop</div><div class="bdpop" role="radiogroup" aria-label="Backdrop">${BDS.map(([id, l]) => `<button class="sw" role="radio" aria-checked="${bd() === id}" data-act="v-bdset" data-val="${id}"><i data-bd="${id}"></i>${l}</button>`).join('')}</div>`, { cls: 'tight', label: 'Backdrop' });
}
function sortMenu() { return menuHTML(Object.keys(SORTS).filter(k => k !== 'updated' || S.type === 'characters').map(k => ['sort-set', SORTS[k], '', S.sort === k || (S.sort === 'updated' && S.type !== 'characters' && k === 'newest'), k])); }
function openCardMenu(anchor, c, x, y) {
  const pl = plinks(c);
  openPop(anchor, menuHTML([['open', 'Open', 'maximize-2'], ['fav', S.favorites.has(c.key) ? 'Unfavorite' : 'Favorite', 'heart'], ['dl-menu', 'Download…', 'download'], ['add-folder', 'Add to folder…', 'folder-plus'],
    S.view === 'folder' && ['rm-folder', 'Remove from this folder', 'folder-minus']], c.key)
    + extLink(pl.open, `${ic('external-link')}<span>Open in PixelLab ↗</span>`, 'mi', ` role="menuitem"${copyAttr(pl)}`) + menuHTML([['select-card', 'Select', 'square-check']], c.key), { role: 'menu', x, y, sheet: true });
}
function copied(btn, msg) { const old = btn.innerHTML; btn.innerHTML = ic('check', 'sm') + (btn.classList.contains('icon') ? '' : '<span>Copied</span>'); setTimeout(() => { if (btn.isConnected) btn.innerHTML = old; }, 2000); toast(msg); }
function navOpen(c, extra) { location.hash = viewerHash(c, extra); }
function setSize(s) {
  if (!SIZES.includes(s)) return;
  S.size = s; store.set('size', s);
  $$('.sizer button').forEach(b => { b.setAttribute('aria-checked', b.dataset.v === s); b.tabIndex = b.dataset.v === s ? 0 : -1; });
  renderContent(true); announce(`Grid size ${SIZE_NAME[s]}`);
}
function announceCount() { const n = viewList().length, nn = NOUN[S.type]; announce(S.q ? plural(n, 'result') : plural(n, nn[0], nn[1])); }
function applyTheme() { if (S.theme === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = S.theme; }
function updateSearchUI() { const c = $('[data-act="q-clear"]', $('#hdr')); if (c) c.hidden = !S.q; }

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (t && ACT[t.dataset.act] && !t.disabled) {
    if (t.tagName === 'A' && t.target === '_blank') { ACT[t.dataset.act](t, e); return; }   // hand-off links still open
    if (t.tagName === 'A') e.preventDefault();
    ACT[t.dataset.act](t, e); return;
  }
  if (e.target.closest('.pop a[target="_blank"]')) hidePop();
  const a = e.target.closest('#content .card');
  if (!a) return;
  const key = a.dataset.key;
  if (lp && lp.fired) { e.preventDefault(); lp = null; return; }
  if (e.ctrlKey || e.metaKey) { e.preventDefault(); toggleSel(key); return; }
  if (e.shiftKey) { e.preventDefault(); rangeSel(key); return; }
  if (S.selecting) { e.preventDefault(); toggleSel(key); return; }
  // F-2: otherwise the link's own hash navigation opens the viewer at every size (Back closes it)
});
document.addEventListener('submit', e => {
  e.preventDefault(); const f = e.target;
  if (f.id === 'cf') submitKey(f, () => enterApp(true));
  else if (f.id === 'rc') submitKey(f, () => { f.closest('dialog').close(); toast('Reconnected. Your library is up to date.'); });
});
document.addEventListener('paste', e => {   // F-10: test the key on paste
  const f = e.target.closest && e.target.closest('.kform');
  if (f && e.target.name === 'password') setTimeout(() => submitKey(f, f.id === 'cf' ? () => enterApp(true) : () => { f.closest('dialog').close(); toast('Reconnected. Your library is up to date.'); }), 0);
});
const CHG = {
  's-keep': t => {
    S.remember = t.checked; store.set('lastMode', S.remember ? 'kept' : 'session');
    const h = $('#s-keep-h'); if (h) h.textContent = keepHelp();
    toast(S.remember ? "You'll stay signed in on this device." : "Vitrine won't keep your key after this session.");
  },
  's-keys': t => { S.shortcuts = t.checked; store.set('shortcuts', S.shortcuts); },
  previews: t => setPreviews(t.checked),
  flag: t => { S.flags[t.dataset.k] = t.checked; if (S.connected) renderAll(); }
};
document.addEventListener('change', e => { const h = CHG[e.target.dataset.chg]; if (h) h(e.target, e); });
const runSearch = debounce(() => { renderContent(); updateResult(); announceSoon(); }, 150);
const announceSoon = debounce(announceCount, 500);
document.addEventListener('input', e => { if (e.target.id === 'q') { S.q = e.target.value; updateSearchUI(); runSearch(); } });
document.addEventListener('focusout', e => {   // leave phone search mode when the field empties out of focus
  if (e.target.id === 'q' && !S.q.trim() && !(e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('.search'))) setTimeout(() => { if (document.activeElement !== $('#q')) endSearch(); }, 0);
});

// ===================== events: keyboard, pointer, scroll =====================
document.addEventListener('keydown', e => {
  if (e.defaultPrevented) return;
  const t = e.target, k = e.key;
  const typing = t.matches && t.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, select');
  if (k === 'Escape') {
    if (t.id === 'q') { e.preventDefault(); if (t.value) { t.value = ''; S.q = ''; updateSearchUI(); runSearch(); } else { t.blur(); endSearch(); } return; }
    if (!topDialog() && !pop.matches(':popover-open') && S.selecting) { e.preventDefault(); exitSelect(); }
    return;
  }
  // radiogroups made of buttons (segments, compass, filmstrip): arrows move and select
  const grp = t.closest && t.closest('.seg[role=radiogroup], #v-film');
  if (grp && /^Arrow(Left|Right)$/.test(k)) {
    const bs = $$('button:not(:disabled)', grp), n = bs[(bs.indexOf(t) + (k === 'ArrowRight' ? 1 : -1) + bs.length) % bs.length];
    const again = `[data-act="${n.dataset.act}"][data-v="${n.dataset.v}"]`;
    e.preventDefault(); n.click(); ((n.isConnected ? n : n.dataset.v != null && $(again)) || n).focus(); return;
  }
  if (t.closest && t.closest('#v-compass') && /^Arrow/.test(k)) { compassArrow(e, () => { const b = $(`#v-compass [data-v="${V.dir}"]`); if (b) b.focus(); }); return; }
  if (V.open) return viewerKey(e);
  if (typing || topDialog() || !S.connected) return;
  if ((e.ctrlKey || e.metaKey) && (k === 'a' || k === 'A') && S.view !== 'folders') { e.preventDefault(); selectAll(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey || !S.shortcuts) return;
  if (k === '/') { e.preventDefault(); startSearch(); }
  else if (k === '?') { e.preventDefault(); openHelp(); }
  else if ((k === '+' || k === '=') && S.view !== 'folders') setSize(SIZES[SIZES.indexOf(S.size) + 1]);
  else if (k === '-' && S.view !== 'folders') setSize(SIZES[SIZES.indexOf(S.size) - 1]);
});
$('#content').addEventListener('keydown', e => {
  const a = e.target.closest('.card'); if (!a) return;
  const k = e.key, key = a.dataset.key, all = $$('#grid .card'), i = all.indexOf(a);
  const j = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + S.cols, ArrowUp: i - S.cols, Home: 0, End: all.length - 1 }[k];
  if (j != null && !e.altKey) { e.preventDefault(); const n = all[Math.max(0, Math.min(all.length - 1, j))]; focusCard(n.dataset.key, true); return; }
  if (k === 'Enter' || k === ' ') { e.preventDefault(); if (S.selecting) toggleSel(key); else navOpen(card(key)); return; }
  if ((k === 'F10' && e.shiftKey) || k === 'ContextMenu') { e.preventDefault(); openCardMenu(a, card(key)); return; }
  if (e.ctrlKey || e.metaKey || e.altKey || !S.shortcuts) return;
  if (k === 'x' || k === 'X') toggleSel(key);
  else if (k === 'l' || k === 'L') toggleFav(key);
  else if (k === 'd' || k === 'D') openDlMenu(a, card(key));
  else return;
  e.preventDefault();
});
$('#hdr').addEventListener('keydown', e => {
  const c = e.target.closest('.chip'); if (!c || !/^Arrow(Left|Right)$/.test(e.key)) return;
  const all = $$('.chip', $('#hdr')), n = all[(all.indexOf(c) + (e.key === 'ArrowRight' ? 1 : -1) + all.length) % all.length];
  e.preventDefault(); n.click();
});
$('#hdr').addEventListener('focusin', () => $('#hdr').classList.remove('tuck'));
let lp = null, lastPtr = 'mouse';
const content = $('#content');
content.addEventListener('pointerdown', e => {
  lastPtr = e.pointerType;
  const a = e.target.closest('.card'); if (!a || e.pointerType !== 'touch') return;
  lp = { x: e.clientX, y: e.clientY, fired: false };
  lp.t = setTimeout(() => { lp.fired = true; toggleSel(a.dataset.key, true); if (navigator.vibrate) navigator.vibrate(10); }, 500);   // 02 §9.4
});
content.addEventListener('pointermove', e => { if (lp && !lp.fired && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) { clearTimeout(lp.t); lp = null; } });
['pointerup', 'pointercancel'].forEach(ev => content.addEventListener(ev, () => { if (lp) clearTimeout(lp.t); if (lp && !lp.fired) lp = null; }));
content.addEventListener('contextmenu', e => { const a = e.target.closest('.card'); if (!a) return; e.preventDefault(); if (lastPtr !== 'touch') openCardMenu(a, card(a.dataset.key), e.clientX, e.clientY); });
content.addEventListener('pointerover', e => { if (e.pointerType !== 'mouse') return; const c = e.target.closest('.cell'); if (c && !c.contains(e.relatedTarget)) hoverIn(c); });
content.addEventListener('pointerout', e => { const c = e.target.closest('.cell'); if (c && !c.contains(e.relatedTarget)) hoverOut(c); });
content.addEventListener('focusin', e => { const c = e.target.closest('.cell'); if (c) hoverIn(c); });
content.addEventListener('focusout', e => { const c = e.target.closest('.cell'); if (c && !c.contains(e.relatedTarget)) hoverOut(c); });
let lastY = 0;
$('#main').addEventListener('scroll', () => {
  const y = $('#main').scrollTop, h = $('#hdr'), v = vp();
  h.classList.toggle('scrolled', y > 0);
  if (v === 'phone' || v === 'compact') h.classList.toggle('tuck', y > lastY && y > 160 && !h.contains(document.activeElement) && !document.body.classList.contains('searching'));
  lastY = y;
}, { passive: true });
new ResizeObserver(() => { layoutGrid(); fitIn($('#pane')); if (S.view === 'folders') fitIn($('#content')); }).observe($('#main'));
new ResizeObserver(es => { $('#main').style.scrollPaddingTop = es[0].target.offsetHeight + 'px'; layoutGrid(); }).observe($('#hdr'));   // header height also tracks text size
let lastVp = vp();
addEventListener('resize', debounce(() => {
  const v = vp(); if (v !== lastVp) { lastVp = v; renderPane(); }
  renderSelbar(); if (V.open) { updateInfoBtn(); updatePeek(); }
  if (devicePixelRatio !== lastDpr) { lastDpr = devicePixelRatio; refitAll(); }
}, 120));
addEventListener('hashchange', () => applyRoute(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopAllPreviews(); if (V.open && V.playing) pause(); } else fillPreviews(); });

// ===================== self-check + boot =====================
function selfTest() {   // ?selftest=1 → result in <html data-selftest>; the 03 §2 counts must hold
  const count = k => cards.filter(c => k === 'all' || c.T.chip === k).length;
  const want = { all: 71, characters: 3, objects: 24, images: 23, tilesets: 9, tiles: 5, maps: 1, ui: 6 };
  const bad = Object.keys(want).filter(k => count(k) !== want[k]).map(k => `${k}=${count(k)}`);
  if (cards.find(c => c.title === 'Hooded Orb Mage').states.length !== 2) bad.push('hooded states');
  if (cards.filter(c => c.title === 'Bear Trap').length !== 2) bad.push('bear trap cards');
  if (!cards.every(c => /^[\w-]{12}$/.test(c.key)) || new Set(cards.map(c => c.key)).size !== cards.length) bad.push('keys');
  if (pending.length !== 2) bad.push('pending');
  if (S.folders.find(f => f.name === 'Hero party').keys.length !== 7) bad.push('hero party');
  const T = (h, want) => { const r = parseHash(h); if (JSON.stringify([r.view, r.type, !!r.key]) !== JSON.stringify(want)) bad.push('route ' + h); };
  const hk = cards[0].key; T(`#/characters/a/${hk}?dir=east`, ['library', 'characters', true]); T('#/folders', ['folders', 'all', false]); T('#/favorites/objects', ['favorites', 'objects', false]);
  if (dlItems(cards.find(c => c.title === 'Android Courier'), { asset: cards.find(c => c.title === 'Android Courier').a, anim: 0, dir: 'east', frame: 0 }).length > 4) bad.push('dl items');
  document.documentElement.dataset.selftest = bad.length ? 'FAIL ' + bad.join(' ') : 'pass';
}
function boot() {
  applyTheme();
  if (P.get('selftest')) selfTest();
  const demo = P.get('demo');
  let session = false; try { session = sessionStorage.getItem('vitrine-rec-session') === '1'; } catch (e) { /* ignore */ }
  if (demo === 'connect' || demo === 'welcome' || (!demo && !session)) {
    showConnect(demo === 'welcome' || (!demo && store.get('lastMode', '') === 'session'));
    if (P.get('error') || P.get('checking')) { $('#cf-key').value = P.get('error') ? 'bad' : 'demo'; submitKey($('#cf'), () => {}); }
    return;
  }
  const keepType = P.get('type'), keepQ = P.get('search');
  enterApp(demo === 'sync');
  const find = s => cards.find(c => slug(c.caption) === s || slug(c.title) === s);
  const fold = s => S.folders.find(f => slug(f.name) === s);
  if (demo === 'emptyfolder') S.folders.push({ id: 'fboss00001', name: 'Boss fight', keys: [], missing: 0 });
  const f = demo === 'emptyfolder' ? fold('boss-fight') : P.get('folder') && fold(P.get('folder'));
  if (f) { S.view = 'folder'; S.folderId = f.id; } else if (demo === 'folders' || demo === 'tip') S.view = 'folders'; else if (demo === 'favorites') S.view = 'favorites';
  if (demo === 'tip') S.flags.tip = true;
  if (demo === 'keep') S.keepBanner = true;
  if (keepType && TYPE_IDS.includes(keepType)) S.type = keepType;
  if (keepQ) { S.q = keepQ; if (vp() === 'phone' || vp() === 'compact') document.body.classList.add('searching'); }
  history.replaceState(null, '', parentHash()); renderAll();
  const c = P.get('asset') && find(P.get('asset'));
  if (demo === 'viewer' || demo === 'download') {
    const t = c || find('android-courier'), q = new URLSearchParams();
    ['anim', 'dir'].forEach(k => { if (P.get(k)) q.set(k, P.get(k)); }); if (P.get('vstate')) q.set('state', P.get('vstate'));
    history.replaceState(null, '', viewerHash(t)); openViewer(t, q, false);
    if (P.get('bd')) setBackdrop(P.get('bd'));
    if (P.get('fps')) setFps(+P.get('fps'));
    if (P.get('grid')) { V.grid = true; $('#v-tgrid').classList.add('on'); }
    if (P.get('sheet')) setDetent(P.get('sheet'));
    if (P.get('info') === '0') toggleInfo();
    if (P.get('zoom')) setTimeout(() => setZoom(+P.get('zoom')), 60);
    if (P.get('paused')) setTimeout(pause, 0);
    if (demo === 'download') setTimeout(() => openDownloadSingle(t), 60);
  }
  const mixed = () => ['android-courier', 'torch', 'dirt-grass', 'slime-menagerie', 'wooden-stairs-kit'].map(find).filter(Boolean);
  if (demo === 'select' || demo === 'download-multi') {
    mixed().forEach(x => S.sel.add(x.key)); S.selecting = true; renderAll();
    if (demo === 'download-multi') openDownloadMulti(Array.from(S.sel).map(card), 'selection-' + S.sel.size);
  }
  if (demo === 'report') openReport([find('torch'), find('wooden-stairs-kit')]);
  if (demo === 'ready') readySheet('android-courier_walk_east@2x.gif');
  if (demo === 'settings') openSettings(); if (demo === 'mockstates') openSettings(true);
  if (demo === 'help') openHelp();
  if (demo === 'reconnect') reconnectDialog();
  if (demo === 'menu' && c) setTimeout(() => openCardMenu($(`.card[data-key="${c.key}"]`), c), 30);
  if (demo === 'addfolder' && c) setTimeout(() => openFolderPicker($(`.card[data-key="${c.key}"]`), [c.key]), 30);
  if (demo === 'toast') toast('Removed from Dungeon kit. It\'s still in your library.', { action: 'Undo', onAction: () => {} });
  if (demo === 'partial-toast') toast('Downloaded 4 assets. 1 couldn\'t be downloaded.', { icon: 'triangle-alert', warn: true, action: 'View report', onAction: () => openReport([find('torch')]) });
}
boot();
})();
