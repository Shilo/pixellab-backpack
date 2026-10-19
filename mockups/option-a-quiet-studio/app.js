/* Vitrine — Option A "Quiet Studio" interactive mockup.
   Classic script, no modules, no network. Behaviour: docs/design/02-ux-spec.md; layout + tokens: 04 §1. */
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
const inspMode = () => vp() === 'laptop' && fine();           // V1: click = current, persistent inspector
const cap1 = s => s ? String(s).charAt(0).toUpperCase() + String(s).slice(1) : '';
const plural = (n, one, many) => `${n.toLocaleString('en-US')} ${n === 1 ? one : (many || one + 's')}`;
const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'asset';
const store = {
  get(k, d) { try { const v = localStorage.getItem('vitrine-mock-' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('vitrine-mock-' + k, JSON.stringify(v)); } catch (e) { /* storage blocked: in-memory only */ } }
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
const CHIPS = [['all', 'All'], ['characters', 'Characters'], ['objects', 'Objects'], ['images', 'Images'], ['tilesets', 'Tilesets'], ['tiles', 'Tiles'], ['maps', 'Maps'], ['ui', 'UI'], ['other', 'Other']];
const NOUN = { all: ['asset', 'assets'], characters: ['character', 'characters'], objects: ['object', 'objects'], images: ['image', 'images'], tilesets: ['tileset', 'tilesets'], tiles: ['tile set', 'tile sets'], maps: ['map', 'maps'], ui: ['UI asset', 'UI assets'], other: ['asset', 'assets'] };
const SIZES = ['S', 'M', 'L', 'XL'];
const MIN_CELL = { S: 72, M: 104, L: 144, XL: 272 }, CAPTION = { S: 0, M: 24, L: 44, XL: 44 };
const SORTS = { newest: 'Newest', oldest: 'Oldest', az: 'Name A–Z', za: 'Name Z–A', largest: 'Largest', smallest: 'Smallest', updated: 'Recently updated' };
const PL = 'https://pixellab.ai';

const cards = [], cardByKey = new Map(), idToCard = new Map(), groups = {};
const pending = D.assets.filter(a => TYPES[a.type] && a.status !== 'completed');   // feed the "2 in PixelLab" chip
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
    updated: states.reduce((u, s) => (s.updatedAt || '') > u ? s.updatedAt : u, ''),
    area: a.width * a.height,
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

// ===================== state =====================
const S = {
  view: 'library', folderId: null, type: 'all', q: '', sort: store.get('sort', 'newest'),
  size: SIZES.includes(P.get('size')) ? P.get('size') : (innerWidth < 840 ? 'M' : 'L'),
  animate: P.has('animate') ? P.get('animate') === '1' : store.get('animate', false),
  theme: P.get('theme') || store.get('theme', 'system'), sbc: store.get('sbc', false),
  selecting: false, sel: new Set(), anchor: null, current: null, focusKey: null, cols: 3,
  favorites: new Set(), favMissing: 0, folders: [],
  loaded: new Set(cards.map(c => c.key)), syncing: false, syncPer: {}, lastSync: Date.now(),
  flags: {}, backdropDefault: 'stage', backdrop: null, shortcuts: true, remember: false, tipOff: false,
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
  const s = S.sort === 'updated' && S.type !== 'characters' ? 'newest' : S.sort;
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
function visibleChips() {
  const present = new Set(baseList().map(c => c.T.chip)), lib = S.view === 'library';
  return CHIPS.filter(([id]) => id === 'all' || (id === 'other' ? lib : (lib && (S.syncing || (id === 'images' && S.flags.gate))) || present.has(id)));
}

// ===================== routing =====================
function parentPath() { return S.view === 'collections' ? '/collections' : S.view === 'favorites' ? '/favorites' : S.view === 'folder' ? '/folder/' + S.folderId : '/'; }
function qs(extra) {
  const q = new URLSearchParams();
  if (S.type !== 'all' && S.view !== 'collections') q.set('type', S.type);
  Object.keys(extra || {}).forEach(k => { if (extra[k] != null) q.set(k, extra[k]); });
  const s = q.toString(); return s ? '?' + s : '';
}
const parentHash = () => '#' + parentPath() + qs();
const viewerHash = (c, extra) => { const p = parentPath(); return '#' + (p === '/' ? '' : p) + '/a/' + c.key + qs(extra); };
function parseHash() {
  const h = location.hash.slice(1) || '/', i = h.indexOf('?');
  const path = i < 0 ? h : h.slice(0, i), q = new URLSearchParams(i < 0 ? '' : h.slice(i + 1));
  const m = path.match(/^(.*?)\/a\/([\w-]{12})$/);
  return { parent: (m ? m[1] : path) || '/', key: m && m[2], q };
}
function applyRoute(fromEvent) {
  if (!S.connected) return;
  const r = parseHash();
  let view = 'library', fid = null;
  if (r.parent === '/collections') view = 'collections';
  else if (r.parent === '/favorites') view = 'favorites';
  else if (r.parent.indexOf('/folder/') === 0) { fid = r.parent.slice(8); view = S.folders.some(f => f.id === fid) ? 'folder' : 'collections'; }
  const t = CHIPS.some(c => c[0] === r.q.get('type')) ? r.q.get('type') : 'all';
  if (view !== S.view || fid !== S.folderId) {
    S.view = view; S.folderId = fid; S.type = t;
    if (!S.keepQ) S.q = ''; S.keepQ = false;
    document.body.classList.remove('searching');
    renderAll(); $('#main').scrollTop = 0;
    if (fromEvent && !r.key) focusH1();
  } else if (t !== S.type) { S.type = t; renderHeader(); renderContent(); }
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
  document.title = (V.open ? V.card.title : !S.connected ? 'Connect' : S.view === 'collections' ? 'Collections' : S.view === 'favorites' ? 'Favorites' : f ? f.name : 'Library') + ' · Vitrine';
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
  <a class="nav-i" href="#/collections"${cur(S.view !== 'library')}>${ic('folders')}<span>Collections</span></a></div>
  <div class="nav-sec"><div class="sec-label">Collections</div>
    <a class="row-i" href="#/favorites"${cur(S.view === 'favorites')}>${ic('heart')}<span class="lbl">Favorites</span><span class="n">${favKeys().length}</span></a>
    ${sortedFolders().map(f => `<a class="row-i" href="#/folder/${f.id}"${cur(S.view === 'folder' && S.folderId === f.id)}>${ic('folder')}<span class="lbl">${esc(f.name)}</span><span class="n">${f.keys.length}</span></a>`).join('')}
    <button class="row-i" data-act="new-folder">${ic('plus')}<span class="lbl">New folder</span></button></div>
  <div class="nav-spacer"></div>
  <button class="nav-i nav-search" data-act="search-open">${ic('search')}<span>Search</span></button>
  <button class="nav-i nav-select" data-act="select">${ic('square-check')}<span>Select</span></button>
  <div class="nav-foot"><button class="sync" data-act="sync-pop">${S.syncing ? 'Syncing…' : 'Synced ' + syncAgo()}</button>
    <button class="nav-i" data-act="settings">${ic('settings')}<span>Settings</span></button>
    <p class="disc">Unofficial · not affiliated with PixelLab</p></div>`;
}
function renderHeader() {
  const h = $('#hdr'), coll = S.view === 'collections', f = curFolder();
  const title = coll ? 'Collections' : S.view === 'favorites' ? 'Favorites' : f ? f.name : 'Library';
  if (!visibleChips().some(c => c[0] === S.type)) S.type = 'all';
  h.classList.toggle('coll', coll);
  const fh = $('#fhead'); fh.hidden = !f;
  fh.innerHTML = f ? `<a class="btn icon back-btn" href="#/collections" aria-label="Back to Collections">${ic('chevron-left')}</a>
    <h1 id="h1" tabindex="-1">${esc(f.name)}</h1><span class="tb-count">${plural(f.keys.length, 'asset')}</span><span class="grow"></span>
    <button class="btn ghost" data-act="folder-export" aria-label="Export">${ic('download')}<span class="lbl">Export</span></button>
    <button class="btn icon" data-act="folder-menu" data-fid="${f.id}" aria-label="Folder actions" aria-haspopup="menu">${ic('ellipsis')}</button>` : '';
  document.documentElement.classList.toggle('v-coll', coll);
  h.innerHTML = `
  <div class="tb-title">
    ${f ? '' : `<h1 id="h1" tabindex="-1">${esc(title)}</h1>`}
    ${coll ? `<button class="btn ghost" data-act="new-folder">${ic('folder-plus')}<span class="lbl">New folder</span></button>` : ''}
  </div>
  ${coll ? '' : `
  <div class="search" role="search">${ic('search')}
    <input id="q" type="search" value="${esc(S.q)}" placeholder="Search ${baseList().length} assets" aria-label="Search assets" autocomplete="off" spellcheck="false" enterkeyhint="search">
    <span class="kbd" aria-hidden="true">/</span>
    <button class="btn icon" data-act="q-clear" aria-label="Clear search"${S.q ? '' : ' hidden'}>${ic('x')}</button></div>
  <div class="tools">
    <button class="btn sort-btn" data-act="sort-menu" aria-haspopup="menu" aria-label="Sort: ${SORTS[S.sort]}">${ic('arrow-down-up')}<span class="lbl">${SORTS[S.sort]}</span></button>
    <div class="sizer"><button class="btn icon" data-act="size-dn" aria-label="Smaller cards">${ic('minus')}</button>
      <input type="range" id="sizer" min="1" max="4" step="1" value="${SIZES.indexOf(S.size) + 1}" aria-label="Grid size" aria-valuetext="${S.size}">
      <button class="btn icon" data-act="size-up" aria-label="Larger cards">${ic('plus')}</button></div>
    <button class="btn icon h-view" data-act="view-menu" aria-label="View: sort and grid size" aria-haspopup="menu">${ic('arrow-down-up')}</button>
  </div>
  <button class="btn h-anim" data-act="animate" aria-pressed="${S.animate}">${ic('circle-play')}<span>Animate</span></button>
  <button class="btn icon h-more" data-act="more" aria-label="More" aria-haspopup="menu">${ic('ellipsis')}</button>
  <button class="btn h-select" data-act="select">${ic('square-check')}<span>Select</span></button>
  <div class="chips" id="chips" role="radiogroup" aria-label="Asset type"></div>
  <div class="result" id="result"></div>`}
  <button class="btn icon h-settings" data-act="settings" aria-label="Settings">${ic('settings')}</button>`;
  updateResult();
}
function updateResult() {
  const ch = $('#chips'), r = $('#result');
  if (!ch) return;
  ch.innerHTML = visibleChips().map(([id, l]) => {
    const on = S.type === id;
    return `<button class="chip" role="radio" aria-checked="${on}" tabindex="${on ? 0 : -1}" data-act="chip" data-type="${id}">${on ? ic('check', 'sm') : id === 'other' ? ic('circle-help', 'sm') : ''}${l}</button>`;
  }).join('');
  const n = S.type === 'other' ? 0 : viewList().length, nn = NOUN[S.type];
  const status = S.flags.rate ? 'PixelLab asked us to slow down. Continuing shortly…'
    : S.syncing ? `<span class="syncbar"><i style="width:${Math.round(S.loaded.size / cards.length * 100)}%"></i></span> Syncing… ${S.loaded.size} of ~${cards.length}`
    : `Synced<span class="long"> ${syncAgo()}</span>`;
  r.innerHTML = `<span id="count">${S.type === 'other' ? 'Not in the public API' : plural(n, nn[0], nn[1])}</span><span aria-hidden="true">·</span>
    <button class="status" data-act="sync-pop" aria-haspopup="dialog">${status}</button>
    ${S.flags.partial ? `<button class="pchip warn" data-act="sync-pop">${ic('triangle-alert', 'xs')}Some assets didn't load</button>` : ''}
    ${pending.length && !S.syncing && !S.flags.empty ? `<button class="pchip" data-act="inprog">${ic('loader-circle', 'xs')}${pending.length} in PixelLab</button>` : ''}`;
  const q = $('#q'); if (q) q.placeholder = `Search ${baseList().length} assets`;
}

// ===================== render: content =====================
const emptyHTML = (title, body, acts, extra) => `<div class="empty">${MARK}<h2>${title}</h2>${body ? `<p>${body}</p>` : ''}${extra || ''}${acts ? `<div class="acts">${acts}</div>` : ''}</div>`;
const extLink = (href, label, cls) => `<a class="${cls || 'btn ghost'}" href="${href}" target="_blank" rel="noopener noreferrer">${label} ↗<span class="vh"> (opens PixelLab in a new tab)</span></a>`;
const banner = (icon, html) => `<div class="banner" role="status">${ic(icon)}<span class="grow">${html}</span></div>`;

function renderContent(keepFocus) {
  const el = $('#content');
  const fk = keepFocus && document.activeElement && document.activeElement.closest && document.activeElement.closest('.card');
  stopAllPreviews();
  if (S.view === 'collections') { el.innerHTML = collectionsHTML(); fitIn(el); return; }
  let h = '';
  if (S.flags.cors) h = emptyHTML('PixelLab is blocking this browser.', 'PixelLab may have changed how its API works with websites. Nothing is wrong with your account.', '<button class="btn primary" data-act="retry">Try again</button>');
  else if (S.flags.offlineEmpty) h = emptyHTML("You're offline.", 'Connect to the internet to load your PixelLab library.', '<button class="btn primary" data-act="retry">Try again</button>');
  else {
    if (S.flags.offline) h += banner('wifi-off', "You're offline. Showing your saved library.");
    const f = curFolder(), miss = S.view === 'favorites' ? S.favMissing : f ? f.missing : 0;
    if (miss && !S.syncing) h += banner('triangle-alert', `${plural(miss, 'item')} in ${f ? 'this folder' : 'Favorites'} ${miss === 1 ? "isn't" : "aren't"} in your PixelLab library anymore. <button class="btn link" data-act="rm-missing">Remove them</button>`);
    const L = viewList();
    if (S.type === 'other') h += emptyHTML('Other PixelLab content.', "Fonts, effects, portraits and talking animations aren't available through PixelLab's public API yet, so Vitrine can't show them. Find them in PixelLab:", '',
      `<div class="links">${[['Fonts', '/create?tool=generate_font'], ['Effects', '/create-vfx'], ['Portraits', '/create?tool=portrait_character'], ['Talking animations', '/create?tool=vocal_animation']].map(([l, p]) => extLink(PL + p, l, '')).join('')}</div>`);
    else if (S.type === 'images' && S.flags.gate) h += emptyHTML("Creator images aren't available yet.", 'The only public way to read them might also save data to your account. Vitrine stays strictly view-only, so it leaves them out for now.', extLink(PL + '/create', 'Open your Creator gallery in PixelLab'));
    else if (!L.length && S.q.trim()) {
      const chip = S.type !== 'all' ? ' in ' + CHIPS.find(c => c[0] === S.type)[1] : '';
      const notes = [(S.type === 'all' || S.type === 'images') && "Image descriptions from PixelLab are shortened, so some words can't be found.",
        /font|effect|vfx|portrait|talking/.test(norm(S.q)) && 'Looking for fonts or effects? See Other.', S.syncing && 'Still syncing, more may appear.'].filter(Boolean);
      h += emptyHTML(`No matches for “${esc(S.q.trim())}”${chip}.`, 'Try fewer words, or search all types.',
        `<button class="btn ghost" data-act="q-clear">Clear search</button>${S.type !== 'all' ? '<button class="btn primary" data-act="search-all">Search all types</button>' : ''}`,
        notes.map(n => `<p class="faint">${n}</p>`).join(''));
    } else if (!L.length && !S.syncing) {
      if (S.view === 'favorites') h += emptyHTML('No favorites yet.', 'Use the heart on any asset to keep it here.');
      else if (f) h += emptyHTML('This folder is empty.', 'Select assets in your library, then choose Add to folder.', '<a class="btn primary" href="#/">Go to Library</a>');
      else h += emptyHTML('Nothing here yet.', "Create something in PixelLab and it'll show up here.", extLink(PL, 'Open PixelLab') + '<button class="btn primary" data-act="sync-now">Sync again</button>');
    } else h += gridHTML(L);
  }
  el.innerHTML = h;
  layoutGrid(); observePreviews(); showDeferredMap();
  if (S.selecting) renderSelbar();                          // refresh "N hidden by filter"
  if (fk) focusCard(fk.dataset.key, false);
}
function gridHTML(L) {
  if (!L.some(c => c.key === S.focusKey)) S.focusKey = L.length ? L[0].key : null;
  const mixed = S.view !== 'library' || S.type === 'all', n = L.length;
  let h = `<ul class="grid" id="grid" role="list" data-size="${S.size}" aria-label="Assets">` + L.map((c, i) => cardHTML(c, i, n, mixed)).join('');
  if (S.syncing) h += '<li class="cell skel" aria-hidden="true"><span class="stage"></span><span class="cap"><i></i></span></li>'.repeat(Math.max(0, S.cols * 4 - n));
  return h + '</ul>' + (S.syncing ? '' : `<p class="endline">That's everything · ${plural(n, 'asset')}<span class="disc">Unofficial · not affiliated with PixelLab</span></p>`);
}
function cardHTML(c, i, n, mixed) {
  const b = S.size === 'M' ? badge(c, false) : badge(c, true), fav = S.favorites.has(c.key), sel = S.sel.has(c.key);
  const defer = c.type === 'map' && !S.mapShown;          // R-6: map thumbnails render lazily (title first)
  return `<li class="cell${sel ? ' sel' : ''}" role="listitem" aria-setsize="${n}" aria-posinset="${i + 1}">
  <a class="card${S.current === c.key ? ' current' : ''}" href="${viewerHash(c)}" data-key="${c.key}" tabindex="${c.key === S.focusKey ? 0 : -1}" aria-label="${esc(cardName(c))}" draggable="false"${fine() ? ` title="${esc(c.caption)}"` : ''}>
    <span class="stage"><span class="art${bottomCls(c)}"><img ${defer ? 'data-src' : 'src'}="${esc(c.a.thumb)}" alt="" width="0" height="0" draggable="false"></span>${defer ? `<span class="ph">${esc(c.title)}</span>` : ''}
      ${fav ? `<span class="favdot">${ic('heart', 'filled')}</span>` : ''}
      ${b || mixed ? `<span class="badge">${mixed ? ic(c.T.glyph) : ''}${c.animated ? ic('play', 'filled') : ''}<span class="bt">${esc(b)}</span></span>` : ''}
      <span class="fitm">${ic('shrink')}fit</span></span>
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
  cell.classList.toggle('sel', sel); a.classList.toggle('current', S.current === key);
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

function collectionsHTML() {
  const tile = (href, name, keys, menu, glyph) => {
    const cover = keys.length ? card(keys[keys.length - 1]) : null;    // cover = most recently added
    return `<li class="fcard"><a href="${href}"><span class="stage">${cover ? `<span class="art${bottomCls(cover)}"><img src="${esc(cover.a.thumb)}" alt="" width="0" height="0"></span>` : `<span class="glyph">${ic(glyph)}</span>`}</span>
      <span class="nm">${esc(name)}</span><span class="ct">${plural(keys.length, 'asset')}</span></a>${menu}</li>`;
  };
  const tip = !S.tipOff && (S.folders.length || S.favorites.size >= 5) ? `<div class="tip" role="note"><p>Your folders and favorites live only in this browser, and browsers sometimes clear site data. Export a backup to keep them safe.</p>
    <div class="row"><button class="btn ghost" data-act="backup">Export backup</button><button class="btn" data-act="protect">Protect</button><button class="btn" data-act="tip-off">Not now</button></div></div>` : '';
  return `<div class="coll">${tip}
    <h2>${ic('heart')}Favorites</h2><ul class="cgrid">${tile('#/favorites', 'Favorites', favKeys(), '', 'heart')}</ul>
    <h2>${ic('folder')}Folders</h2>${S.folders.length ? '' : '<p class="muted" style="margin-bottom:12px">Group assets by game or project. Folders live in this browser only.</p>'}
    <ul class="cgrid">${sortedFolders().map(f => tile('#/folder/' + f.id, f.name, f.keys, `<button class="btn icon mb2" data-act="folder-menu" data-fid="${f.id}" aria-label="Actions for ${esc(f.name)}" aria-haspopup="menu">${ic('ellipsis')}</button>`, 'folder')).join('')}
      <li class="fcard new"><button class="newbtn" data-act="new-folder"><span class="stage"><span class="glyph">${ic('folder-plus')}</span></span><span class="nm">New folder</span><span class="ct">&nbsp;</span></button></li></ul></div>`;
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
  g.style.setProperty('--cols', cols); g.style.setProperty('--row', (cell + CAPTION[S.size] * rem) + 'px');   // caption grows with text zoom
  S.cols = cols; g.dataset.cols = cols;
  fitIn(g);
}
function refitAll() { layoutGrid(); fitIn($('#pane')); if (S.view === 'collections') fitIn($('#content')); if (V.open) fitStage(); }
(function watchDpr() { matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener('change', () => { refitAll(); watchDpr(); }, { once: true }); })();

// ===================== previews (hover / focus / Animate) =====================
const previews = new Map();
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
  const p = previews.get(art); if (!p) return;
  previews.delete(art); if (p.player) p.player.stop(); p.cv.remove();
  const img = art.querySelector('img'); if (img) img.hidden = false;
}
function stopAllPreviews() { Array.from(previews.keys()).forEach(stopPreview); }
const artOf = cell => cell.querySelector('.art');
const cellCard = cell => card((cell.querySelector('[data-key]') || {}).dataset.key);
let io = null;
function observePreviews() {
  if (io) io.disconnect();
  if (!S.animate) return;
  const cap = coarse() ? 8 : 24;                              // 02 §4.8 cap
  io = new IntersectionObserver(es => es.forEach(e => {
    const art = artOf(e.target);
    if (e.isIntersecting && previews.size < cap) startPreview(art, cellCard(e.target)); else if (!e.isIntersecting) stopPreview(art);
  }));
  $$('#grid .cell').filter(cell => { const c = cellCard(cell); return c && c.animated; }).forEach(cell => io.observe(cell));
  const pv = $('#pane .pv .art'); if (pv) startPreview(pv, card(pv.dataset.key));
}
function hoverIn(cell) { clearTimeout(cell._t); cell._t = setTimeout(() => { const c = cellCard(cell); if (c && c.animated) startPreview(artOf(cell), c); }, 300); }
function hoverOut(cell) { clearTimeout(cell._t); if (!S.animate) stopPreview(artOf(cell)); }

// ===================== inspector =====================
const DIR_AB = { south: 'S', south_east: 'SE', east: 'E', north_east: 'NE', north: 'N', north_west: 'NW', west: 'W', south_west: 'SW' };
const DIR_NAME = d => cap1(String(d).replace('_', '-'));
function dirsText(a) {
  const ks = Object.keys(DIR_AB).filter(d => a.directions && a.directions[d]);
  return ks.length ? `${ks.length} · ${ks.map(d => DIR_AB[d]).join(', ')}` : '1 (single view)';
}
function fieldsFor(c, a, cx) {
  const m = a.meta || {}, F = [], row = (k, v) => { if (v != null && v !== '' && v !== false) F.push([k, v]); };
  const st = m.style_settings;
  const style = st && ['outline', 'shading', 'detail'].filter(k => st[k]).map(k => `${cap1(k)}: ${esc(cap1(st[k]))}`).join('<br>');
  const created = a.createdAt && dateFull.format(new Date(a.createdAt));
  const sz = (w, h) => `${w} × ${h} px`;
  const anims = (a.animations || []).map((an, i) => {
    const nd = Object.keys(an.frames).length;
    return `<button class="linkish" data-act="play-anim" data-key="${c.key}" data-i="${i}">${esc(an.name)} · ${an.frameCount} frames · ${nd} direction${nd > 1 ? 's' : ''}</button>`;
  }).join('');
  const tags = c.tags.length ? c.tags.map(t => `<button class="tag" data-act="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join('') : '';
  const playback = () => { const k = cx.anim >= 0 && a.animations[cx.anim] ? a.animations[cx.anim].id : (a.animations && a.animations[0] ? a.animations[0].id : c.key), f = fpsOf(k);
    return (S.fps[k] ? `${f} fps (your setting) · <button class="linkish" style="display:inline" data-act="fps-reset" data-fk="${k}">Reset</button>` : '8 fps (default)')
      + '<span class="note">PixelLab doesn\'t say how fast animations play. 8 fps matches PixelLab\'s own players.</span>'; };
  switch (c.type) {
    case 'character':
      if (c.states.length > 1) row('States', `${c.states.length} · ${c.states.map(s => esc(s.meta.state_name ? cap1(s.meta.state_name) : 'Base')).join(', ')}`);
      row('Canvas', sz(a.width, a.height)); row('Directions', dirsText(a)); row('View', esc(cap1(m.view)));
      row('Animations', anims || (m.animation_count === 0 ? 'None yet' : '')); row('Style', style); row('Template', esc(cap1(m.template_id)));
      row('Tags', tags); row('Created', created);
      if (a.updatedAt && a.updatedAt.slice(0, 16) !== a.createdAt.slice(0, 16)) row('Updated', dateFull.format(new Date(a.updatedAt)));
      if (a.animations.length) row('Playback', playback());
      row('Portrait & voice', `Not in PixelLab's public API · ${extLink(PL + '/create?tool=portrait_character', 'View in PixelLab', 'linkish')}`);
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
      row('Terrains', `${esc(cap1(m.lower_description))} → ${esc(cap1(m.upper_description))} <button class="btn" style="min-height:24px" data-act="copy-text" data-text="${esc([m.lower_description, m.upper_description, m.transition_description].join(', '))}">${ic('copy', 'sm')}<span class="vh">Copy terrains</span></button>`);
      row('Transition', esc(cap1(m.transition_description))); row('Tile size', sz(a.tileSize, a.tileSize));
      row('Tiles', `${m.total_tiles} · ${a.grid.cols} × ${a.grid.rows} sheet`); row('View', esc(cap1(m.view)));
      row('Transition size', m.transition_size != null && String(m.transition_size)); row('Style', style); row('Created', created);
      break;
    case 'tileset_sidescroller':
      row('Terrain', `${esc(cap1(m.lower_description))} <button class="btn" style="min-height:24px" data-act="copy-text" data-text="${esc(m.lower_description + '; ' + m.transition_description)}">${ic('copy', 'sm')}<span class="vh">Copy terrain</span></button>`);
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
      row('Size', sz(a.width, a.height)); row('Created', created); row('Note', "PixelLab doesn't share the individual UI pieces.");
      break;
  }
  return F;
}
function plinks(c) {
  const t = c.type, hint = /tileset|tiles_pro|tile_isometric|map$/.test(t) ? 'May need a paid PixelLab plan.' : t === 'creator_image' ? 'Pro tools may need a paid PixelLab plan.' : '';
  // ponytail: mockup strips the {id} from 02 §3.11 routes (sample ids are fake); production appends the real id.
  const r = {
    character: ['/create-character', [['Animate', '/create-character'], ['New state', '/create-character']]],
    object: ['/create-object', [['Animate', '/create-object'], ['New state', '/create-object']]],
    map_object: ['/create-object', []],
    tileset_topdown: ['/maps/tilesets', []], tileset_sidescroller: ['/maps?tab=tilesets', []], tiles_pro: ['/maps/tiles', []],
    tile_isometric: ['/maps?tab=tiles', []], map: ['/maps', []], ui_asset: ['/create-ui', []],
    creator_image: ['/create', [['Edit', '/create?tool=edit_image'], ['Animate', '/create?tool=animate_with_text'], ['Rotate', '/create?tool=generate_8_rotations_v3']]]
  }[t];
  return { open: PL + r[0], tools: r[1], hint, copyImg: t === 'creator_image' || t === 'ui_asset' };
}
function inspectorHTML(c, cx) {
  const a = cx.asset, m = a.meta || {}, fav = S.favorites.has(c.key), pl = plinks(c);
  const stateName = c.type === 'character' ? (m.state_name ? cap1(m.state_name) : 'Base') : m.state_name && cap1(m.state_name);
  const inF = S.folders.filter(f => f.keys.includes(c.key));
  const isDesc = /creator_image|tile_isometric|tiles_pro/.test(c.type);
  const prompt = /tileset|map$/.test(c.type) ? '' : (c.type === 'tile_isometric' ? m.description : a.prompt);
  const ext = (href, label, copy) => `<a href="${href}" target="_blank" rel="noopener noreferrer"${copy ? ' data-act="copy-img"' : ''}>${label}${ic('external-link', 'xs')}<span class="vh"> (opens PixelLab in a new tab)</span></a>`;
  return `<div class="insp">
  <div class="insp-title"><h2>${esc(c.title)}</h2><p>${esc(c.T.label)}${stateName ? ' · ' + esc(stateName) : ''}</p></div>
  <div class="acts-row">
    <span class="split"><button class="btn primary" data-act="dl-default" data-key="${c.key}">${ic('download')}<span>Download</span></button><button class="btn primary" data-act="dl-menu" data-key="${c.key}" aria-label="More download formats" aria-haspopup="menu">${ic('chevron-down', 'sm')}</button></span>
    <button class="btn icon ghost" data-act="fav" data-key="${c.key}" aria-pressed="${fav}" aria-label="Favorite">${ic('heart', fav ? 'filled' : '')}</button>
    <button class="btn icon ghost" data-act="add-folder" data-key="${c.key}" aria-label="Add to folder" aria-haspopup="true">${ic('folder-plus')}</button>
    <a class="btn icon ghost" href="${pl.open}" target="_blank" rel="noopener noreferrer"${pl.copyImg ? ' data-act="copy-img"' : ''} aria-label="Open in PixelLab (opens PixelLab in a new tab)" title="Open in PixelLab ↗">${ic('external-link')}</a>
  </div>
  ${inF.length ? `<div class="fchips" role="group" aria-label="In folders">${inF.map(f => `<a class="fchip" href="#/folder/${f.id}">${ic('folder', 'xs')}${esc(f.name)}</a>`).join('')}</div>` : ''}
  ${prompt ? `<div><div class="blk-h"><span>${isDesc ? 'Description' : 'Prompt'}</span><button class="btn" data-act="copy-text" data-text="${esc(prompt)}" data-msg="Prompt copied">${ic('copy', 'sm')}<span>Copy</span></button></div><div class="well">${esc(prompt)}</div></div>` : ''}
  <dl class="fields">${fieldsFor(c, a, cx).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>
  <div class="pl"><h3>PixelLab</h3>${pl.tools.map(([l, p]) => ext(PL + p, l + ' in PixelLab ', pl.copyImg)).join('')}${ext(pl.open, 'Open in PixelLab ', pl.copyImg)}${pl.hint ? `<p class="note">${pl.hint}</p>` : ''}</div>
  <details class="tech"><summary>Technical details</summary>
    <dl class="fields"><dt>${c.type === 'creator_image' ? 'Gallery ref' : 'Asset ID'}</dt><dd class="mono">${masked(key12(a.type + ':' + a.id))}</dd>
      <dt>Source</dt><dd>${a.source === 'mcp' ? 'MCP' : 'REST'}</dd><dt>Status</dt><dd>Completed</dd><dt>Last synced</dt><dd>${syncAgo()}</dd>
      ${c.frames > 1 ? `<dt>Frames loaded</dt><dd>${c.frames} of ${c.frames}</dd>` : ''}<dt>Saved here</dt><dd>${S.remember ? 'Yes' : 'No (this tab only)'}</dd></dl>
    <p class="warn-note">${ic('triangle-alert')}<span>Anyone with this ID can download this asset without signing in. Only share it with tools you trust.</span></p>
    <button class="btn ghost" data-act="copy-id">${ic('copy', 'sm')}Copy asset ID</button></details>
  </div>`;
}
function renderPane() {
  const p = $('#pane');
  $$('.art', p).forEach(stopPreview);
  if (!inspMode()) { p.innerHTML = ''; return; }
  if (S.selecting && S.sel.size >= 2) { p.innerHTML = summaryHTML(); fitIn(p); return; }
  const c = S.current && card(S.current);
  if (!c) { p.innerHTML = '<p class="hint">Select an asset to see its details. Double-click to open it.</p>'; return; }
  p.innerHTML = `<div class="pv" data-bd="${S.backdrop || S.backdropDefault}"><div class="art${bottomCls(c)}" data-key="${c.key}"><img src="${esc(c.a.thumb)}" alt="" width="0" height="0"></div></div>`
    + inspectorHTML(c, { asset: c.a, anim: defaultAnim(c.a) });
  if (S.animate && c.animated) startPreview($('#pane .pv .art'), c);
}
function breakdown(L) {
  const by = {};
  L.forEach(c => { const k = c.T.chip; by[k] = by[k] || { n: 0, s: 0 }; by[k].n++; by[k].s += c.states.length; });
  return CHIPS.filter(([k]) => by[k]).map(([k]) => plural(by[k].n, NOUN[k][0], NOUN[k][1]) + (k === 'characters' && by[k].s > by[k].n ? ` (${by[k].s} states)` : '')).join(' · ');
}
function summaryHTML() {
  const L = Array.from(S.sel).map(card), shown = L.slice(0, L.length > 9 ? 8 : 9), est = estimate(L, { game: true }), allFav = L.every(c => S.favorites.has(c.key));
  return `<div class="insp"><div class="mosaic">${shown.map(c => `<span class="stage"><span class="art${bottomCls(c)}"><img src="${esc(c.a.thumb)}" alt="" width="0" height="0"></span></span>`).join('')}${L.length > 9 ? `<span class="more">+${L.length - 8}</span>` : ''}</div>
  <div class="insp-title"><h2>${L.length} selected</h2><p>${breakdown(L)}</p><p class="faint">${est.files} files · ~${est.mb} MB</p></div>
  <div class="stack"><button class="btn primary" data-act="sel-download">${ic('download')}Download…</button><button class="btn ghost" data-act="sel-folder">${ic('folder-plus')}Add to folder…</button>
    <button class="btn ghost" data-act="sel-fav">${ic('heart', allFav ? 'filled' : '')}${allFav ? 'Unfavorite' : 'Favorite'}</button><button class="btn ghost" data-act="sel-clear">${ic('x')}Clear (Esc)</button></div></div>`;
}

// ===================== selection =====================
function enterSelect() { if (!S.selecting) { S.selecting = true; renderSelbar(); renderPane(); announce(`Selection mode. ${S.sel.size} selected.`); } }
function exitSelect() {
  if (!S.selecting) return;
  const ks = Array.from(S.sel); S.selecting = false; S.sel.clear(); ks.forEach(updateCard);
  renderSelbar(); renderPane(); announce('Selection cleared');
  if (S.focusKey) focusCard(S.focusKey, false);
}
function toggleSel(key, force) {
  const was = S.selecting; S.selecting = true;
  const on = force != null ? force : !S.sel.has(key);
  if (on) S.sel.add(key); else S.sel.delete(key);
  S.anchor = key; updateCard(key);
  if (!S.sel.size) { S.selecting = true; return exitSelect(); }
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
function renderSelbar() {
  const b = $('#selbar'); document.body.classList.toggle('selecting', S.selecting); b.hidden = !S.selecting;
  if (!S.selecting) return;
  const vis = new Set(viewList().map(c => c.key)), hidden = Array.from(S.sel).filter(k => !vis.has(k)).length;
  const n = S.sel.size, allFav = n > 0 && Array.from(S.sel).every(k => S.favorites.has(k)), dis = n ? '' : ' disabled';
  const fl = allFav ? 'Unfavorite' : 'Favorite';
  b.innerHTML = `<button class="btn icon" data-act="sel-clear" aria-label="Exit selection">${ic('x')}</button>
    <span class="count">${n} selected</span>${hidden ? `<span class="hidden-note">· ${hidden} hidden by filter</span>` : ''}
    <button class="btn link" data-act="sel-all">Select all</button><span class="grow"></span>
    <button class="btn" data-act="sel-fav" aria-label="${fl}"${dis}>${ic('heart', allFav ? 'filled' : '')}<span class="lbl">${fl}</span></button>
    <button class="btn" data-act="sel-folder" aria-label="Add to folder"${dis}>${ic('folder-plus')}<span class="lbl">Add to folder…</span></button>
    ${S.view === 'folder' ? `<button class="btn" data-act="sel-rm" aria-label="Remove from folder"${dis}>${ic('folder-minus')}<span class="lbl">Remove from folder</span></button>` : ''}
    <button class="btn primary" data-act="sel-download" aria-label="Download"${dis}>${ic('download')}<span class="lbl">Download</span></button>`;
}
function setCurrent(key) { const prev = S.current; S.current = key; updateCard(prev); updateCard(key); renderPane(); }

// ===================== favorites + folders =====================
function toggleFav(key) {
  const on = !S.favorites.has(key);
  if (on) S.favorites.add(key); else S.favorites.delete(key);
  updateCard(key); renderNav();
  if (S.current === key) renderPane();
  if (V.open && V.card.key === key) renderViewerInsp();
  if (S.view === 'favorites') renderContent(true);
  announce(on ? 'Added to favorites' : 'Removed from favorites');
}
function bulkFav(keys) {
  const all = keys.every(k => S.favorites.has(k));
  keys.forEach(k => { if (all) S.favorites.delete(k); else S.favorites.add(k); updateCard(k); });
  renderNav(); renderSelbar(); renderPane();
  toast(all ? `Removed ${keys.length} from Favorites.` : `Added ${keys.length} to Favorites.`);
}
function addTo(f, keys) {
  const added = keys.filter(k => !f.keys.includes(k)); f.keys.push(...added);
  refreshOrg();
  toast(`Added ${added.length} to ${f.name}.`, { action: 'Undo', onAction: () => { f.keys = f.keys.filter(k => !added.includes(k)); refreshOrg(); } });
}
function removeFrom(f, keys) {
  const before = f.keys.slice(); f.keys = f.keys.filter(k => !keys.includes(k));
  refreshOrg(true);
  toast(`Removed from ${f.name}. It's still in your library.`, { action: 'Undo', onAction: () => { f.keys = before; refreshOrg(); } });
}
function refreshOrg(focusNext) {
  renderNav();
  if (S.view === 'collections' || S.view === 'folder') {
    const fk = document.activeElement && document.activeElement.closest && document.activeElement.closest('.card');
    const L = viewList().map(c => c.key), i = fk ? L.indexOf(fk.dataset.key) : -1;
    renderHeader(); renderContent(); renderSelbar();
    if (focusNext && fk && !L.includes(fk.dataset.key)) focusCard(viewList().map(c => c.key)[Math.max(0, i)] || null, true);
  }
  if (S.current) renderPane();
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
}
function newFolder(thenAddKeys) {
  folderNameDialog('New folder', 'New folder', 'Create', name => {
    const f = { id: 'f' + key12('new:' + name + Date.now()).slice(0, 9), name, keys: [], missing: 0 };
    S.folders.push(f);
    if (thenAddKeys) addTo(f, thenAddKeys); else go('#/folder/' + f.id);
    renderNav();
  });
}
function openFolderMenu(anchor, fid) {
  const f = S.folders.find(x => x.id === fid); if (!f) return;
  openPop(anchor, menuHTML([['folder-rename', 'Rename', 'pencil'], ['folder-delete', 'Delete folder', 'trash-2']], '', `data-fid="${fid}"`), { role: 'menu' });
}
function deleteFolder(f) {
  confirmDialog(`Delete “${esc(f.name)}”?`, `The ${plural(f.keys.length, 'asset')} in it stay in your library. Only the folder goes away.`, 'Delete folder', () => {
    const i = S.folders.indexOf(f); S.folders.splice(i, 1);
    toast(`Deleted “${f.name}”. Your assets are untouched.`, { action: 'Undo', onAction: () => { S.folders.splice(i, 0, f); refreshOrg(); } });
    if (S.view === 'folder' && S.folderId === f.id) go('#/collections'); else refreshOrg();
    setTimeout(focusH1, 50);
  });
}
function openFolderPicker(anchor, keys) {
  const rows = () => `<div class="ph2">Add to folder</div>
    <button class="mi" role="menuitem" data-act="fp-new">${ic('folder-plus')}<span>New folder</span></button><hr>
    ${sortedFolders().map(f => { const n = keys.filter(k => f.keys.includes(k)).length, st = !n ? 'false' : n === keys.length ? 'true' : 'mixed';
      return `<button class="mi" role="menuitemcheckbox" aria-checked="${st}" data-act="fp-toggle" data-fid="${f.id}"><span class="cbx">${ic(st === 'mixed' ? 'minus' : 'check')}</span><span class="grow">${esc(f.name)}</span><span class="n">${f.keys.length}</span></button>`; }).join('')}
    <div class="pf"><button class="btn primary" data-act="pop-close">Done</button></div>`;
  openPop(anchor, rows(), { cls: 'fp', ctx: { keys, rows } });
}

// ===================== viewer =====================
const V = { open: false, card: null, si: 0, asset: null, anim: -1, dir: 'south', frame: 0, playing: false, loop: true, zoom: 'fit', grid: false,
  imgs: [], player: null, pushed: false, list: [], tok: 0, W: 0, H: 0, fitK: 1, k: 1 };
const vd = $('#viewer'), cv = $('#v-canvas'), cx2 = cv.getContext('2d');
const DIRS = ['north', 'north_east', 'east', 'south_east', 'south', 'south_west', 'west', 'north_west'];   // clockwise
const COMPASS = ['north_west', 'north', 'north_east', 'west', null, 'east', 'south_west', 'south', 'south_east'];
const ROT = { north: 0, north_east: 45, east: 90, south_east: 135, south: 180, south_west: 225, west: 270, north_west: 315 };
const BDS = [['stage', 'Stage'], ['checker', 'Checker'], ['mid', 'Mid gray'], ['light', 'Light gray'], ['black', 'Black'], ['white', 'White']];
const STEPS = [1, 2, 3, 4, 6, 8, 12, 16], TP_GAP = 2;
const fpsOf = k => S.fps[k] || 8;
const fpsKey = () => V.anim >= 0 ? V.asset.animations[V.anim].id : V.card.key;
const bd = () => S.backdrop || S.backdropDefault;
const isTiles = c => /tileset|tiles_pro/.test(c.type);
const viewerInspMode = () => innerHeight < 480 ? 'side' : innerWidth < 840 ? 'sheet' : 'panel';
function defaultAnim(a) { const an = a.animations || []; if (!an.length) return -1; const i = an.findIndex(x => /idle|breath/i.test(x.name)); return i >= 0 ? i : 0; }
function availDirs() { const src = V.anim >= 0 ? V.asset.animations[V.anim].frames : (V.asset.directions || {}); return DIRS.filter(d => src[d]); }
function fixDir() {
  const av = availDirs();
  if (!av.length) { V.dir = 'unknown'; return; }
  if (av.includes(V.dir)) return;
  if (av.includes('south')) { V.dir = 'south'; return; }
  const i = DIRS.indexOf(V.dir); V.dir = av.slice().sort((x, y) => Math.abs(DIRS.indexOf(x) - i) - Math.abs(DIRS.indexOf(y) - i))[0];
}
function transportOn() { return V.anim >= 0 || V.card.frames > 1; }

function openViewer(c, q, pushed) {
  V.list = viewList(); if (!V.list.includes(c)) V.list = [c];
  V.pushed = pushed;
  if (!vd.open) {
    stopAllPreviews(); hidePop();
    vd.showModal(); V.open = true;
    vd.classList.toggle('insp-off', S.inspOff); vd.classList.remove('insp-open', 'chrome-off');
    $('#v-insp').dataset.detent = 'peek';
    rehome();
  }
  showCard(c, q);
  $('#v-title').focus({ preventScroll: true });
  wakeChrome();
}
function showCard(c, q) {
  q = q || new URLSearchParams();
  V.card = c; V.si = Math.max(0, Math.min(+q.get('state') || 0, c.states.length - 1)); V.asset = c.states[V.si];
  V.anim = q.has('anim') ? Math.min(+q.get('anim'), V.asset.animations.length - 1) : defaultAnim(V.asset);
  V.dir = q.get('dir') || 'south'; fixDir();
  V.frame = 0; V.zoom = 'fit'; V.grid = false; V.loop = true; V.playing = !reduced();
  $('#v-art').classList.add('fading');
  renderViewerChrome(); loadFrames(); syncViewerHash(); updateTitle();
}
function syncViewerHash() {
  history.replaceState(null, '', viewerHash(V.card, { dir: V.dir !== 'south' && V.dir !== 'unknown' ? V.dir : null, anim: V.anim >= 0 && V.anim !== defaultAnim(V.asset) ? V.anim : null, state: V.si || null }));
}
function renderViewerChrome() {
  const c = V.card, a = V.asset, idx = V.list.indexOf(c), hasT = transportOn();
  $('#v-title').textContent = c.title;
  $('#v-state').textContent = c.type === 'character' ? (a.meta.state_name ? cap1(a.meta.state_name) : 'Base') : (c.state ? cap1(c.state) : '');
  $('#v-pos').textContent = `${idx + 1} / ${V.list.length}`;
  $$('[data-act="v-prev"]', vd).forEach(b => { b.disabled = idx <= 0; });
  $$('[data-act="v-next"]', vd).forEach(b => { b.disabled = idx >= V.list.length - 1; });
  $('#v-tr').hidden = !hasT;
  $('#v-loop').setAttribute('aria-pressed', V.loop);
  const anims = a.animations || [], showDir = DIRS.filter(d => (a.directions || {})[d]).length > 1;
  const pick = V.anim >= 0 ? `${anims[V.anim].name} · ${anims[V.anim].frameCount}f` : 'Rotations';
  $('#v-cx').innerHTML = `
    ${anims.length ? `<button class="btn ghost" data-act="v-pick" aria-haspopup="true" aria-label="Animation: ${esc(pick)}">${esc(pick)}${ic('chevron-down', 'sm')}</button>` : ''}
    ${showDir ? `<button class="btn ghost" data-act="v-dir" aria-haspopup="true" aria-label="Direction: ${DIR_NAME(V.dir)}">${ic('arrow-up', 'sm', 'rotate:' + ROT[V.dir] + 'deg')}${DIR_AB[V.dir]}${ic('chevron-down', 'sm')}</button>` : ''}
    ${c.states.length > 1 ? `<div class="seg" role="radiogroup" aria-label="State">${c.states.map((s, i) => `<button role="radio" aria-checked="${i === V.si}" data-act="v-state" data-i="${i}">${esc(s.meta.state_name ? cap1(s.meta.state_name) : 'Base')}</button>`).join('')}</div>` : ''}
    ${isTiles(c) ? `<button class="btn" data-act="v-grid" aria-pressed="${V.grid}">${ic('grid-3x3')}<span>Grid</span></button>` : ''}
    <div class="bds" role="radiogroup" aria-label="Backdrop">${BDS.map(([id, l]) => `<button class="sw" role="radio" aria-checked="${bd() === id}" data-act="v-bdset" data-val="${id}" aria-label="${l}" title="${l}"><i data-bd="${id}"></i></button>`).join('')}</div>
    <button class="btn ghost v-bdbtn" data-act="v-bd" aria-haspopup="true" aria-label="Backdrop: ${BDS.find(b => b[0] === bd())[1]}">${ic('contrast')}<span>${BDS.find(b => b[0] === bd())[1]}</span></button>
    <div class="zoom" role="group" aria-label="Zoom"><button class="btn" data-act="v-fit" id="v-fitb" aria-pressed="true">${ic('scan', 'sm')}Fit</button><button class="btn" data-act="v-1">1:1</button>
      <button class="btn icon" data-act="v-zo" aria-label="Zoom out">${ic('minus')}</button><button class="btn icon" data-act="v-zi" aria-label="Zoom in">${ic('plus')}</button></div>
    <span class="v-zr" id="v-zr"></span>
    ${hasT ? `<button class="btn ghost v-fps" data-act="v-fps" aria-haspopup="true">${fpsOf(fpsKey())} fps</button>` : ''}`;
  $$('.v-tr .v-fps', vd).forEach(b => { b.textContent = fpsOf(fpsKey()) + ' fps'; });
  $('#v-stage').dataset.bd = bd();
  renderViewerInsp(); updateInfoBtn();
}
function renderViewerInsp() { $('#v-insp-body').innerHTML = inspectorHTML(V.card, { asset: V.asset, anim: V.anim }); }
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
    setupCanvas(); buildPlayer();
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
  if (n > 1) {
    const s = $('#v-scrub'); s.max = n - 1; s.value = i; s.setAttribute('aria-valuetext', `Frame ${i + 1} of ${n}`);
    $('#v-read').textContent = `${i + 1} / ${n}`;
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
function updatePlayBtn() {
  const b = $('#v-play'); b.classList.remove('loading');
  b.innerHTML = ic(V.playing ? 'pause' : 'play', V.playing ? '' : 'filled'); b.setAttribute('aria-label', V.playing ? 'Pause' : 'Play');
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
  requestAnimationFrame(() => sc.classList.toggle('pan', sc.scrollWidth > sc.clientWidth + 1 || sc.scrollHeight > sc.clientHeight + 1));
  const m = k / dpr, f = x => x < 1 ? Math.round(x * 100) + '%' : Math.round(x * 100) / 100 + '×';
  const zr = $('#v-zr'); if (zr) zr.textContent = V.zoom === 'fit' ? 'Fit · ' + f(m) : f(m);
  const fb = $('#v-fitb'); if (fb) fb.setAttribute('aria-pressed', V.zoom === 'fit');
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
  g.hidden = !isTiles(c); if (g.hidden) { $('#v-tinfo').hidden = true; return; }
  const gr = c.a.grid;
  g.style.gridTemplateColumns = `repeat(${gr.cols}, 1fr)`; g.style.gridTemplateRows = `repeat(${gr.rows}, 1fr)`;
  g.classList.toggle('on', V.grid);
  g.innerHTML = Array.from({ length: gr.cols * gr.rows }, (_, i) => `<span data-i="${i}">${c.type === 'tileset_topdown' ? 'wang_' + i : 'tile_' + i}</span>`).join('');
  $('#v-tinfo').hidden = true;
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
  buildPlayer(); $$('.v-fps', vd).forEach(b => { b.textContent = n + ' fps'; });
  const o = $('#fps-out'); if (o) o.textContent = n + ' fps';
  renderViewerInsp();
}
function navStep(d) { const i = V.list.indexOf(V.card) + d; if (i < 0 || i >= V.list.length) return; showCard(V.list[i]); }
function closeViewerNav() { if (V.pushed) history.back(); else { history.replaceState(null, '', parentHash()); closeViewer(); } }
function closeViewer() {
  if (!vd.open) return;
  if (V.player) V.player.stop(); V.tok++; hidePop();
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  vd.close(); V.open = false; rehome(); updateTitle();
  const key = V.card.key;
  if (inspMode()) setCurrent(key);
  focusCard(key, true);
  observePreviews();
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
  $('#v-insp').dataset.detent = d;
  const b = $('#sheet-btn'); b.setAttribute('aria-expanded', d !== 'peek'); b.setAttribute('aria-label', d === 'full' ? 'Collapse details' : 'Expand details');
  b.innerHTML = ic(d === 'full' ? 'chevron-down' : 'chevron-up'); updateInfoBtn();
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
  const t = e.target, k = e.key, owns = t.closest && t.closest('input[type=range], [role=radiogroup], .pop, select, input[type=text]');
  if (topDialog() !== vd) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const single = k.length === 1 && k !== ' ';
  if (single && !S.shortcuts) return;
  switch (k) {
    case 'ArrowLeft': case 'ArrowRight': if (owns) return; if (e.shiftKey) $('#v-scroll').scrollBy((k === 'ArrowLeft' ? -0.1 : 0.1) * $('#v-scroll').clientWidth, 0); else navStep(k === 'ArrowLeft' ? -1 : 1); break;
    case 'ArrowUp': case 'ArrowDown': if (owns || !e.shiftKey) return; $('#v-scroll').scrollBy(0, (k === 'ArrowUp' ? -0.1 : 0.1) * $('#v-scroll').clientHeight); break;
    case ' ': if (t.closest('button, input, a, select, summary, textarea')) return; togglePlay(); break;
    case ',': stepFrame(-1); break;
    case '.': stepFrame(1); break;
    case '[': rotateDir(-1); break;
    case ']': rotateDir(1); break;
    case 'Home': case 'End': if (owns || !V.player) return; pause(); V.player.seek(k === 'Home' ? 0 : V.imgs.length - 1); break;
    case 'z': case 'Z': setZoom(V.zoom === 'fit' ? 1 : 'fit'); break;
    case 'i': case 'I': toggleInfo(); break;
    case 'f': case 'F': fullscreen(); break;
    case 'l': case 'L': toggleFav(V.card.key); break;
    case 'd': case 'D': openDlMenu($('#v-insp-body [data-act="dl-menu"]') || $('#v-title'), V.card); break;
    case '+': case '=': zoomStep(1); break;
    case '-': zoomStep(-1); break;
    case '?': openHelp(); break;
    default: return;
  }
  e.preventDefault();
}

// ===================== popovers, dialogs, toasts =====================
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
  pop.className = 'pop ' + (o.cls || ''); pop.innerHTML = html; pop.setAttribute('role', o.role || 'dialog');
  pop._ctx = o.ctx || {}; pop._anchor = anchor;
  pop.showPopover();
  const r = anchor.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
  let x = o.x != null ? o.x : r.left, y = o.y != null ? o.y : r.bottom + 6;
  if (y + h > innerHeight - 8) y = Math.max(8, (o.y != null ? o.y : r.top - 6) - h);
  x = Math.max(8, Math.min(x, innerWidth - w - 8));
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
  const first = pop.querySelector('[aria-checked="true"]:not(:disabled), .mi:not(:disabled), button:not(:disabled), a, input');
  if (first) first.focus();
}
function hidePop() { if (pop.matches(':popover-open')) pop.hidePopover(); }
pop.addEventListener('toggle', e => { if (e.newState === 'closed') { const a = pop._anchor; pop.innerHTML = ''; if (a && a.isConnected && (!document.activeElement || document.activeElement === document.body)) a.focus(); } });
pop.addEventListener('keydown', e => {
  const items = $$('.mi:not(:disabled), .compass button:not(:disabled), .sw, .stepper button', pop);
  const i = items.indexOf(document.activeElement);
  if (pop.classList.contains('compass-pop') && /^Arrow/.test(e.key)) {
    const cur = COMPASS.indexOf(V.dir), dv = { ArrowUp: -3, ArrowDown: 3, ArrowLeft: -1, ArrowRight: 1 }[e.key];
    for (let j = cur + dv; j >= 0 && j < 9; j += dv) { const d = COMPASS[j]; if (d && availDirs().includes(d)) { setDir(d); openCompass(pop._anchor || $('#v-cx')); break; } if (Math.abs(dv) === 1 && Math.floor(j / 3) !== Math.floor(cur / 3)) break; }
    e.preventDefault(); return;
  }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); const n = items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]; if (n) n.focus(); }
  if (e.key === 'Tab') hidePop();
});
const menuHTML = (items, key, extra) => items.filter(Boolean).map(([act, label, icon, checked, v]) =>
  `<button class="mi" role="${checked != null ? 'menuitemradio' : 'menuitem'}"${checked != null ? ` aria-checked="${checked}"` : ''} data-act="${act}"${key ? ` data-key="${key}"` : ''}${v != null ? ` data-v="${v}"` : ''} ${extra || ''}>${checked != null ? ic('check', 'chk') : ic(icon)}<span>${label}</span></button>`).join('');

let dlgN = 0;
function openDialog(o) {
  const d = document.createElement('dialog'), id = 'dlg-t' + (++dlgN), opener = document.activeElement;
  d.className = 'dlg ' + (o.cls || ''); d.setAttribute('aria-labelledby', id);
  d.innerHTML = `<header class="dlg-h"><h2 id="${id}" tabindex="-1">${o.title}</h2><button class="btn icon" data-act="dlg-close" aria-label="Close">${ic('x')}</button></header><div class="dlg-b">${o.body}</div>${o.foot ? `<footer class="dlg-f">${o.foot}</footer>` : ''}`;
  document.body.appendChild(d);
  d.addEventListener('close', () => { hidePop(); rehome(); d.remove(); if (o.onClose) o.onClose(); if (opener && opener.isConnected) opener.focus({ preventScroll: true }); });
  hidePop(); d.showModal(); rehome();
  const f = d.querySelector('.dlg-b input:not([type=checkbox]):not([type=radio]), .dlg-b select'); (f || d.querySelector('h2')).focus();
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
  t.innerHTML = `${o.icon ? ic(o.icon) : ''}<span>${esc(msg)}</span>${o.action ? `<button class="btn link">${esc(o.action)}</button>` : ''}`;
  const box = $('#toasts'); box.appendChild(t); while (box.children.length > 3) box.firstChild.remove();
  let left = o.action ? 10000 : 5000, last = Date.now(), paused = false;
  const iv = setInterval(() => { if (!paused) { left -= Date.now() - last; } last = Date.now(); if (left <= 0) { clearInterval(iv); t.remove(); } }, 250);
  ['pointerenter', 'focusin'].forEach(ev => t.addEventListener(ev, () => { paused = true; }));
  ['pointerleave', 'focusout'].forEach(ev => t.addEventListener(ev, () => { paused = false; }));
  if (o.action) t.querySelector('button').addEventListener('click', () => { clearInterval(iv); t.remove(); o.onAction(); });
  announce(msg);
}
function announce(text, assertive) { const r = $(assertive ? '#live2' : '#live'); r.textContent = ''; setTimeout(() => { r.textContent = text; }, 40); }

// ===================== downloads + export (faked) =====================
const gifScale = longest => [1, 2, 4, 8].find(s => longest * s >= 256) || 8;
function dlCtx(c) { return V.open && V.card === c ? { asset: V.asset, anim: V.anim, dir: V.dir, frame: V.frame } : { asset: c.a, anim: defaultAnim(c.a), dir: c.dirs.includes('south') ? 'south' : 'unknown', frame: 0 }; }
function dlItems(c, x) {
  const a = x.asset, nm = slug(c.caption), an = x.anim >= 0 ? a.animations[x.anim] : null, dir = x.dir && x.dir !== 'unknown' ? x.dir.replace('_', '-') : null;
  const multi = Object.keys(a.directions || {}).filter(d => d !== 'unknown').length > 1, sc = gifScale(Math.max(a.width, a.height)), at = sc > 1 ? '@' + sc + 'x' : '';
  const fr = String(x.frame || 0).padStart(3, '0'), I = (label, file) => ({ label, file });
  if (/character|object/.test(c.type)) {
    if (an) { const as = slug(an.name); return [I(`GIF · ${an.name}${dir && multi ? ' · ' + DIR_NAME(x.dir) : ''}`, `${nm}_${as}${multi && dir ? '_' + dir : ''}${at}.gif`), I('PNG · this frame', `${nm}_${as}_${dir || 'view'}_${fr}.png`),
      I(`Sprite sheet + JSON · ${an.name}`, `${nm}_${as}.png`), I('Sprite sheet + JSON · all animations', `${nm}_all.png`), I('Frames ZIP', `${nm}_${as}_frames.zip`),
      c.type === 'character' && I('PixelLab ZIP (all states)', `${nm}_pixellab.zip`), I('PixelLab sprite sheet', `${nm}_pixellab-sheet.zip`)].filter(Boolean); }
    return [I('PNG · this view', `${nm}${dir && multi ? '_' + dir : ''}.png`), I('Sprite sheet + JSON (rotations)', `${nm}_rotations.png`), I('Frames ZIP', `${nm}_rotations_frames.zip`), I('PixelLab originals', `${nm}_pixellab.zip`)];
  }
  if (c.frames > 1) return [I('GIF', `${nm}${at}.gif`), I('PNG · this frame', `${nm}_${fr}.png`), I('Sprite sheet + JSON', `${nm}_all.png`), I('Frames ZIP', `${nm}_frames.zip`)];
  if (/tileset/.test(c.type)) return [I('PNG · sheet', `${nm}_sheet.png`), I('Sheet + PixelLab metadata (ZIP)', `${nm}_sheet.zip`), I('Tiles ZIP', `${nm}_tiles.zip`)];
  if (c.type === 'tiles_pro') return [I('Tiles ZIP', `${nm}_tiles.zip`), I('PNG · this tile', `${nm}_tile_00.png`), I('Sheet + JSON', `${nm}_all.png`), I('PixelLab ZIP', `${nm}_pixellab.zip`)];
  return [I('PNG', `${nm}.png`)];
}
function openDlMenu(anchor, c) {
  const items = dlItems(c, dlCtx(c));
  openPop(anchor, items.map((it, i) => `<button class="mi" role="menuitem" data-act="dl-item" data-key="${c.key}" data-i="${i}">${ic(i ? 'download' : 'check')}<span>${i ? esc(it.label) : '<b>' + esc(it.label) + '</b>'}</span></button>`).join('')
    + `<hr><button class="mi" role="menuitem" data-act="dl-more" data-key="${c.key}">${ic('ellipsis')}<span>More options…</span></button>`, { role: 'menu' });
}
function fakeSave(file) { if (coarse()) readySheet(file); else toast(`Downloaded ${file} (mockup: no file was saved)`, { icon: 'download' }); }
function readySheet(file) {
  const d = openDialog({ title: 'Your file is ready', cls: 'sm', body: `<p class="fname">${esc(file)}</p><p class="muted">Share it straight to an app, or save it to your device.</p>`,
    foot: `<button class="btn ghost" data-act="ready-dl">Download file</button><button class="btn primary" data-act="ready-share">Share or save…</button>` });
  return d;
}
function estimate(L, st) {
  let files = 0, kb = 0;
  L.forEach(c => (st.base ? [c.a] : c.states).forEach(a => {
    const dirs = Math.max(1, Object.keys(a.directions || {}).length), an = a.animations || [];
    const frames = an.reduce((s, x) => s + x.frameCount * Object.keys(x.frames).length, 0) + (c.frames > 1 ? c.frames : 0);
    const sprite = /character|object/.test(c.type), px = a.width * a.height;
    let n = 1;                                                    // metadata.json
    if (st.game !== false) n += sprite || c.frames > 1 || /tileset/.test(c.type) ? 2 : c.type === 'tiles_pro' ? 17 : 1;
    if (st.frames) n += sprite ? dirs + frames : c.frames > 1 ? c.frames : /tileset|tiles_pro/.test(c.type) ? 16 : 1;
    if (st.gifs) n += sprite ? (an.length ? an.reduce((s, x) => s + Object.keys(x.frames).length, 0) : dirs) : 1;
    files += n; kb += n * (2 + px / 900);
  }));
  return { files, mb: Math.max(0.1, kb / 1024).toFixed(1) };
}
const advHTML = () => `<details class="adv"><summary>Advanced</summary><div class="advb">
  <label for="ex-scale">Scale</label><select id="ex-scale" class="sel" data-chg="ex"><option value="auto">Auto (GIF)</option><option>1×</option><option>2×</option><option>4×</option><option>8×</option></select>
  <label for="ex-bg">GIF background</label><select id="ex-bg" class="sel"><option>Transparent</option><option>Current backdrop</option></select>
  <label for="ex-loop">GIF loop</label><select id="ex-loop" class="sel"><option>Forever</option><option>Once</option></select>
  <label for="ex-sp">Sheet spacing</label><select id="ex-sp" class="sel"><option>0 px</option><option>1 px</option><option>2 px</option></select>
  <span>Trim empty space (GIF)</span><label class="switch"><input type="checkbox" role="switch" checked><span class="vh">Trim empty space</span></label>
  <span>Include metadata.json</span><label class="switch"><input type="checkbox" role="switch" checked><span class="vh">Include metadata.json</span></label></div></details>`;
function openExportSingle(c) {
  const x = dlCtx(c), items = dlItems(c, x), st = { sel: 0 }, an = (x.asset.animations || []).length, multi = c.dirs.length > 1;
  const d = openDialog({ title: `Export ${esc(c.title)}`, body: `
    <div><div class="lbl-s" id="ex-pl" style="margin-bottom:8px">Presets</div><div class="rcards" role="radiogroup" aria-labelledby="ex-pl">${items.map((it, i) => `<button class="rcard" role="radio" aria-checked="${i === 0}" data-act="ex-pre" data-i="${i}"><span>${esc(it.label)}</span>${ic('check', 'chk')}</button>`).join('')}</div></div>
    ${an ? `<div class="row"><span class="lbl-s">Animation</span><div class="seg" role="radiogroup" aria-label="Animation scope">${['This animation', 'All animations', 'Everything'].map((l, i) => `<button role="radio" aria-checked="${!i}" data-act="seg">${l}</button>`).join('')}</div></div>` : ''}
    ${an && multi ? `<div class="row"><span class="lbl-s">Directions</span><div class="seg" role="radiogroup" aria-label="Directions">${['This direction', 'All directions'].map((l, i) => `<button role="radio" aria-checked="${!i}" data-act="seg">${l}</button>`).join('')}</div></div>` : ''}
    ${advHTML()}<p class="est" id="ex-est"></p><p class="fname" id="ex-fn"></p>`,
    foot: `<button class="btn ghost" data-act="dlg-close">Cancel</button><button class="btn primary" data-act="dlg-ok">Export</button>` });
  d._st = st;
  d._upd = () => { const it = items[st.sel], gif = /^GIF/.test(it.label); $('#ex-est', d).textContent = `${gif || /PNG/.test(it.label) ? 1 : estimate([c], { game: true }).files} file${gif || /PNG/.test(it.label) ? '' : 's'} · about ${gif ? '0.3' : estimate([c], { game: true }).mb} MB`; $('#ex-fn', d).textContent = it.file; };
  d._ok = () => { d.close(); fakeSave(items[st.sel].file); };
  d._upd();
  return d;
}
function openExportMulti(L, scope) {
  if (!L.length) return toast('Nothing to export in this view.');
  const st = { game: true, frames: false, gifs: false, base: false }, hasStates = L.some(c => c.states.length > 1);
  const name = `vitrine-${scope}-${today()}.zip`;
  const chip = (k, l) => `<button class="chip" role="checkbox" aria-checked="${st[k]}" data-act="ex-chip" data-k="${k}">${st[k] ? ic('check', 'sm') : ''}${l}</button>`;
  const d = openDialog({ title: `Export ${plural(L.length, 'asset')}`, body: `<p class="muted" style="margin-top:-12px">${breakdown(L)}</p>
    <div><div class="lbl-s" style="margin-bottom:8px">Presets</div><div class="row" id="ex-chips">${chip('game', 'Game-ready')}${chip('frames', 'Frames')}${chip('gifs', 'GIFs')}</div></div>
    ${hasStates ? `<div class="row"><span class="lbl-s">Character states</span><div class="seg" role="radiogroup" aria-label="Character states"><button role="radio" aria-checked="true" data-act="seg" data-k="base" data-v="0">All states</button><button role="radio" aria-checked="false" data-act="seg" data-k="base" data-v="1">Base only</button></div></div>` : ''}
    ${advHTML()}<p class="est" id="ex-est"></p><p class="fname" id="ex-fn">${esc(name)}</p><p class="faint">Saves straight to disk (Chromium).</p>`,
    foot: `<button class="btn ghost" data-act="dlg-close">Cancel</button><button class="btn primary" data-act="dlg-ok">Export</button>` });
  d._st = st; d._chip = chip;
  d._upd = () => { const e = estimate(L, st); $('#ex-est', d).textContent = `${e.files} files · about ${e.mb} MB`; $('[data-act="dlg-ok"]', d).disabled = !(st.game || st.frames || st.gifs); };
  d._ok = () => { const e = estimate(L, st); d.close(); runExport(L, e, name); };
  d._upd();
  return d;
}
function runExport(L, e, name) {
  if (S.exporting) return toast('An export is already running. Wait for it to finish or cancel it.');
  const chip = $('#expchip'), total = e.files, fail = S.flags.exportFail ? [L[L.length - 1]] : [];
  let done = 0, mile = 0;
  chip.hidden = false; announce(`Exporting ${plural(L.length, 'asset')}`);
  const paint = () => { chip.innerHTML = `${ic('download', 'sm')}<span>Exporting ${done} / ${total} · ${(e.mb * done / total).toFixed(1)} MB</span><button class="btn" data-act="exp-cancel">Cancel</button><span class="bar" style="width:${done / total * 100}%"></span>`; };
  paint();
  S.exporting = setInterval(() => {
    done = Math.min(total, done + Math.max(1, Math.ceil(total / 30))); paint();
    const pct = Math.floor(done / total * 4) * 25; if (pct > mile && pct < 100) { mile = pct; announce(`Export ${pct}% done`); }
    if (done < total) return;
    clearInterval(S.exporting); S.exporting = null; chip.hidden = true;
    if (fail.length) toast(`Exported ${plural(L.length - fail.length, 'asset')}. ${fail.length} couldn't be exported.`, { action: 'View report', onAction: () => openReport(fail) });
    else toast(`Exported ${plural(L.length, 'asset')} to ${name} (mockup: no file was saved).`);
    if (coarse()) readySheet(name);
  }, 120);
}
function openReport(fail) {
  const d = openDialog({ title: 'Export report', body: `<p class="muted">The archive finished. These items weren't included:</p><ul class="rep">${fail.map(c => `<li><b>${esc(c.caption)}</b><span class="muted">${esc(c.T.label)} · Network problem.</span></li>`).join('')}</ul>`,
    foot: `<button class="btn ghost" data-act="dlg-close">Close</button><button class="btn primary" data-act="dlg-ok">Retry failed</button>` });
  d._ok = () => { d.close(); S.flags.exportFail = false; runExport(fail, estimate(fail, { game: true }), `vitrine-retry-${today()}.zip`); };
}

// ===================== sync (faked timer queue) =====================
function startSync() {
  clearInterval(S.syncTimer);
  S.syncing = true; S.loaded = new Set(); S.mapShown = false;
  const queues = {}; cards.slice().sort(sorter()).forEach(c => { (queues[c.T.chip] = queues[c.T.chip] || []).push(c); });
  S.syncPer = {}; Object.keys(queues).forEach(k => { S.syncPer[k] = [0, queues[k].length]; });
  renderAll(); announce('Syncing your library');
  let half = false;
  S.syncTimer = setInterval(() => {
    Object.keys(queues).forEach(k => { const q = queues[k].splice(0, 2); q.forEach(c => S.loaded.add(c.key)); S.syncPer[k][0] += q.length; });
    if (!half && S.loaded.size >= cards.length / 2) { half = true; announce('Halfway there'); }
    if (S.loaded.size >= cards.length) { clearInterval(S.syncTimer); S.syncing = false; S.lastSync = Date.now(); announce(`Library synced. ${plural(cards.length, 'asset')}.`); }
    updateResult(); renderContent(true); renderNav();
    if (pop.matches(':popover-open') && pop.classList.contains('syncpop')) pop.innerHTML = syncPopHTML();
  }, 300);
}
function syncPopHTML() {
  return `<div class="ph2">Library sync</div>${CHIPS.slice(1, 8).map(([k, l]) => {
    const p = S.syncPer[k] || [cards.filter(c => c.T.chip === k).length, cards.filter(c => c.T.chip === k).length];
    const bad = S.flags.partial && k === 'maps', gated = S.flags.gate && k === 'images';
    return `<div class="prow"><span class="grow">${l}</span>${bad ? `<span style="color:var(--danger)">Maps couldn't be loaded.</span><button class="btn link" data-act="retry">Retry</button>` : gated ? 'Not available yet' : `${p[0]} of ${p[1]} ${p[0] === p[1] ? ic('check', 'xs') : ''}`}</div>`;
  }).join('')}${S.flags.rate ? '<p class="prow">PixelLab asked us to slow down. Continuing shortly…</p>' : ''}<hr>
  <button class="mi" data-act="sync-now">${ic('refresh-cw')}<span>Sync now</span></button><p class="prow">Last synced ${syncAgo()}</p>`;
}

// ===================== connect =====================
function connectForm(id, welcome) {
  return `<form class="cform" id="${id}" novalidate>
    <input class="vh" type="text" name="username" autocomplete="username" value="PixelLab API token" tabindex="-1" aria-hidden="true">
    <div class="field"><label for="${id}-tok">PixelLab API token</label>
      <div class="tokrow"><input class="input" id="${id}-tok" name="password" type="password" autocomplete="current-password" placeholder="Paste your token" spellcheck="false" autocapitalize="off" aria-describedby="${id}-err">
      <button type="button" class="btn ghost" data-act="tok-show" aria-pressed="false">Show</button></div>
      <p class="err" id="${id}-err"></p></div>
    ${welcome != null ? `<details class="where"><summary>Where do I find my token?</summary><ol><li>${extLink(PL + '/account', 'Open your PixelLab account page', 'linkish')}</li><li>Find your API token and copy it.</li><li>Paste it here.</li></ol><p>Signed out? PixelLab will ask you to sign in first.</p></details>
    <label class="switch"><input type="checkbox" role="switch" data-chg="c-rem" aria-describedby="${id}-rh"${S.remember ? ' checked' : ''}><span>Remember on this device</span></label>
    <p class="helper" id="${id}-rh">${remHelp()}</p>
    <p class="note-key">${ic('key-round')}<span>Heads up: PixelLab tokens give full access to your account, including spending credits. Vitrine only reads, but keep your token as private as a password.</span></p>` : ''}
    <button class="btn primary wide" type="submit">Connect</button>
    ${welcome != null ? '<button class="btn ghost wide" type="button" data-act="use-sample">Use sample library</button><p class="mocknote">Mockup: any non-empty value connects; “bad” shows the invalid-token error. Nothing you type is stored or sent.</p>' : ''}
  </form>`;
}
const remHelp = () => S.remember ? "Saved in this browser so you don't need to paste it again. Anyone using this browser profile could use it, so don't turn this on for shared computers." : "Kept in this tab only. You'll paste it again in a new tab.";
function showConnect(welcome) {
  if (V.open) closeViewer();
  clearInterval(S.syncTimer); S.syncing = false; S.connected = false; exitSelect();
  $('#app').hidden = true; $('#selbar').hidden = true;
  const el = $('#connect'); el.hidden = false;
  el.innerHTML = `<div class="cc"><div class="brand">${MARK}<span>Vitrine</span></div><p class="desc">Unofficial gallery for your PixelLab assets</p>
    ${welcome ? '<p class="welcome">Welcome back! Your token was kept for one tab only, so paste it again here.</p>' : ''}
    <h1>Your PixelLab art, all in one place</h1>
    <p class="value">Vitrine shows everything in your PixelLab account. It only looks. It never creates, changes, or deletes anything.</p>
    ${connectForm('cf', !!welcome)}</div>
    <div class="cfoot"><p>Your token goes only to PixelLab's API. Vitrine has no servers and no analytics.</p><p>Unofficial. Not affiliated with or endorsed by PixelLab.</p></div>`;
  history.replaceState(null, '', '#/connect'); updateTitle();
  $('#cf-tok').focus();
}
function submitToken(form, onOk) {
  const inp = form.querySelector('input[type=password], input[name=password]'), err = form.querySelector('.err'), btn = form.querySelector('[type=submit]');
  const show = m => { err.innerHTML = ic('triangle-alert', 'sm') + '<span>' + m + '</span>'; inp.focus(); };
  const v = inp.value.trim();
  if (!v) return show('Paste your token first.');
  if (S.flags.offline || S.flags.offlineEmpty) return show("You're offline. Connect to the internet and try again.");
  err.innerHTML = ''; btn.textContent = 'Checking…'; btn.disabled = true; inp.readOnly = true;
  setTimeout(() => {
    btn.textContent = 'Connect'; btn.disabled = false; inp.readOnly = false;
    if (v === 'bad') return show("That token didn't work. Copy it again from your PixelLab account page and paste it here.");
    if (S.flags.cors) return show('PixelLab is blocking this browser. PixelLab may have changed how its API works with websites. Nothing is wrong with your account.');
    inp.value = '';                                     // the mockup never keeps, logs or shows what was typed
    onOk();
  }, 700);
}
function enterApp(sync) {
  const el = $('#connect'); el.hidden = true; el.innerHTML = '';
  $('#app').hidden = false; S.connected = true;
  try { sessionStorage.setItem('vitrine-mock-session', '1'); } catch (e) { /* ignore */ }
  if (!S.remember) store.set('lastMode', 'session');
  if (!location.hash || location.hash === '#/connect') history.replaceState(null, '', '#/');
  const r = parseHash(); S.view = 'library';
  if (sync) startSync(); else renderAll();
  if (r.parent !== '/' || r.key) applyRoute(false);
}
function reconnectDialog() {
  announce('Your PixelLab token stopped working. Reconnect to continue.', true);
  const d = openDialog({ title: 'Reconnect to PixelLab.', cls: 'sm', body: `<p class="muted">Your token stopped working. It may have been replaced in your PixelLab account. Paste a new one to continue. Your folders and favorites are safe.</p>${connectForm('rc')}` });
  $('#rc-tok', d).focus();
  return d;
}

// ===================== settings, help, mockup states =====================
const FLAGS = [['offline', 'Offline · cached banner'], ['offlineEmpty', 'Offline · nothing saved'], ['cors', 'CORS blocked'], ['partial', 'Partial sync'], ['rate', 'Rate limited'],
  ['empty', 'Empty library'], ['emptyFav', 'Empty favorites'], ['gate', 'Images gate failed'], ['exportFail', 'Export: 1 item fails']];
function openSettings(toMock) {
  const sw = (chg, on, label, help) => `<label class="switch"><input type="checkbox" role="switch" data-chg="${chg}"${on ? ' checked' : ''}><span>${label}</span></label>${help ? `<p class="helper">${help}</p>` : ''}`;
  const sel = (chg, opts, val, label) => `<div class="row"><label class="grow" for="s-${chg}">${label}</label><select class="sel" id="s-${chg}" data-chg="${chg}">${opts.map(([v, l]) => `<option value="${v}"${v === val ? ' selected' : ''}>${l}</option>`).join('')}</select></div>`;
  const d = openDialog({ title: 'Settings', cls: 'wide full', body: `
  <section class="set-sec"><h3>PixelLab connection</h3><p>Connected · token ending ••••</p><p class="muted">Sample plan · 1,840 generations left · 312 credits</p>
    ${sw('s-rem', S.remember, 'Remember on this device', remHelp())}
    <div class="row"><button class="btn ghost" data-act="chg-token">Change token</button><button class="btn ghost danger" data-act="forget">Forget token</button></div>
    <div id="chg-box" hidden>${connectForm('ct')}</div>
    <p>${extLink(PL + '/account', 'Need to revoke this token? Generate a new one in your PixelLab account', 'linkish')}</p></section>
  <section class="set-sec"><h3>Library</h3><div class="row"><button class="btn ghost" data-act="sync-now">${ic('refresh-cw', 'sm')}Sync now</button><span class="muted">Last synced ${syncAgo()}</span></div>
    ${sw('s-anim', S.animate, 'Animate previews')}
    ${sel('s-size', SIZES.map(s => [s, s]), S.size, 'Grid size')}
    ${sel('s-bd', BDS, S.backdropDefault, 'Default viewer backdrop')}</section>
  <section class="set-sec"><h3>Appearance</h3><div class="row"><span class="grow">Theme</span><div class="seg" role="radiogroup" aria-label="Theme">${[['system', 'System', 'monitor'], ['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']].map(([v, l, i]) => `<button role="radio" aria-checked="${S.theme === v}" data-act="theme" data-v="${v}">${ic(i, 'sm')} ${l}</button>`).join('')}</div></div></section>
  <section class="set-sec"><h3>Keyboard</h3>${sw('s-keys', S.shortcuts, 'Single-key shortcuts')}<div><button class="btn ghost" data-act="help">${ic('keyboard', 'sm')}Show shortcuts</button></div></section>
  <section class="set-sec"><h3>Folders &amp; favorites</h3><p>${plural(S.folders.length, 'folder')} · ${plural(S.favorites.size, 'favorite')}</p>
    <div class="row"><button class="btn ghost" data-act="backup">Export backup (.json)</button><button class="btn ghost" data-act="import">Import backup…</button></div>
    <p class="helper">They live only in this browser. Export a backup now and then.</p></section>
  <section class="set-sec"><h3>Storage</h3><p>Using 84 MB</p><div class="row"><span class="muted grow">May be cleared by the browser</span><button class="btn ghost" data-act="protect">Protect</button></div>
    ${S.remember ? '<div><button class="btn ghost" data-act="clear-img">Clear saved images</button></div>' : `<p class="helper">Nothing is saved between sessions in “This tab only” mode.</p>`}</section>
  <section class="set-sec"><h3>About</h3><p><b>Vitrine</b> · Unofficial gallery for your PixelLab assets · mockup A</p>
    <p class="muted">Vitrine is an unofficial gallery for your PixelLab assets. It isn't made by, affiliated with, or endorsed by PixelLab.</p>
    <p class="muted">No analytics, no tracking, no servers. Vitrine talks only to PixelLab's API and image host.</p>
    <p class="muted">Other PixelLab content: fonts, effects, portraits and talking animations aren't in PixelLab's public API, so Vitrine can't show them yet.</p>
    <p class="faint">Icons: Lucide (ISC). Source: link to come.</p></section>
  <section class="set-sec mock" id="mock-sec"><h3>Mockup states</h3><p class="helper">Not part of the product. Toggle states to review them.</p>
    <div class="row"><button class="btn ghost" data-act="m-connect">Connect (first run)</button><button class="btn ghost" data-act="m-welcome">Connect · welcome back</button><button class="btn ghost" data-act="m-sync">Replay first sync</button>
      <button class="btn ghost" data-act="m-401">Token stopped working</button><button class="btn ghost" data-act="m-ready">Export ready sheet</button><button class="btn ghost" data-act="m-tip">Show backup tip</button></div>
    <div class="grid2">${FLAGS.map(([k, l]) => `<label class="switch"><input type="checkbox" role="switch" data-chg="flag" data-k="${k}"${S.flags[k] ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div></section>` });
  if (toMock) setTimeout(() => $('#mock-sec', d).scrollIntoView({ block: 'start' }), 0);
  return d;
}
const KEYS = {
  Library: [['/', 'Focus search', 1], ['?', 'Keyboard shortcuts', 1], ['← ↑ → ↓', 'Move between cards'], ['Home End', 'First or last card'], ['Enter', 'Open (selecting: toggle)'], ['Space', 'Open (selecting: toggle)'],
    ['x', 'Select or deselect', 1], ['Ctrl A', 'Select all in view'], ['L', 'Favorite', 1], ['D', 'Download', 1], ['+ −', 'Grid size', 1], ['Shift F10', 'Card menu'], ['Esc', 'Close the top layer, then selection']],
  Viewer: [['← →', 'Previous or next asset'], ['Space', 'Play or pause'], [', .', 'Frame back or forward', 1], ['[ ]', 'Rotate direction', 1], ['Home End', 'First or last frame'],
    ['+ −', 'Zoom', 1], ['Z', 'Fit or 1:1', 1], ['Shift ←↑→↓', 'Pan'], ['I', 'Details', 1], ['F', 'Fullscreen', 1], ['L', 'Favorite', 1], ['D', 'Download', 1], ['Esc', 'Close the viewer']]
};
const GESTURES = {
  Library: [['Tap', 'Open (wide screens with a mouse: click shows details, double-click opens)'], ['Long-press', 'Start selecting'], ['Tap while selecting', 'Select or deselect'], ['Pinch', 'Browser zoom (grid size has its own control)']],
  Viewer: [['Swipe ← →', 'Next or previous asset'], ['Swipe ↓', 'Close'], ['Swipe ↑', 'Expand details'], ['Tap the art', 'Show or hide controls'], ['Double-tap', 'Fit or zoom in'], ['Drag (zoomed)', 'Pan']]
};
function helpBody(tab) {
  const T = tab === 'keys' ? KEYS : GESTURES;
  return `${!S.shortcuts && tab === 'keys' ? `<p class="banner" style="margin:0">${ic('keyboard')}Single-key shortcuts are off. Turn them on in Settings.</p>` : ''}
  <div class="keys">${Object.keys(T).map(g => `<div><h3>${g}</h3><dl>${T[g].map(([k, l, single]) => `<dt class="${single && !S.shortcuts ? 'off' : ''}">${tab === 'keys' ? k.split(' ').map(x => `<span class="kbd">${x}</span>`).join('') : k}</dt><dd>${l}${single && !S.shortcuts ? ' (off)' : ''}</dd>`).join('')}</dl></div>`).join('')}</div>`;
}
function openHelp() {
  const tab = coarse() ? 'gestures' : 'keys';
  const d = openDialog({ title: 'Shortcuts and gestures', cls: 'wide', body: `<div class="seg" role="tablist" aria-label="Show">${[['keys', 'Keys'], ['gestures', 'Gestures']].map(([v, l]) => `<button role="tab" aria-selected="${v === tab}" aria-checked="${v === tab}" data-act="help-tab" data-v="${v}">${l}</button>`).join('')}</div><div id="help-b">${helpBody(tab)}</div>` });
  return d;
}

// ===================== events: clicks =====================
const ACT = {
  skip: (t, e) => { e.preventDefault(); focusCard(S.focusKey, true); },
  'sb-toggle': () => { S.sbc = !S.sbc; store.set('sbc', S.sbc); renderNav(); },
  chip: t => { S.type = t.dataset.type; if (S.sort === 'updated' && S.type !== 'characters') S.sort = 'newest'; history.replaceState(null, '', parentHash()); renderHeader(); renderContent(); $('#main').scrollTop = 0; $(`.chip[data-type="${S.type}"]`).focus(); announceCount(); },
  'q-clear': () => { S.q = ''; renderHeader(); renderContent(); const q = $('#q'); if (q) q.focus(); },
  'search-all': () => { S.type = 'all'; history.replaceState(null, '', parentHash()); renderHeader(); renderContent(); announceCount(); },
  'search-open': () => { if (S.view === 'collections') go('#/'); setTimeout(() => { document.body.classList.add('searching'); const q = $('#q'); if (q) q.focus(); }, 0); },
  animate: () => { S.animate = !S.animate; store.set('animate', S.animate); renderHeader(); if (!S.animate) stopAllPreviews(); observePreviews(); renderPane(); },
  select: () => { if (S.selecting) exitSelect(); else enterSelect(); },
  'size-up': () => setSize(SIZES.indexOf(S.size) + 1), 'size-dn': () => setSize(SIZES.indexOf(S.size) - 1),
  'sort-menu': t => openPop(t, sortMenu(), { role: 'menu' }),
  'view-menu': t => openPop(t, '<div class="ph2">Sort</div>' + sortMenu() + '<hr><div class="ph2">Grid size</div>' + menuHTML(SIZES.map(s => ['size-set', s, '', S.size === s, s])), { role: 'menu' }),
  'sort-set': t => { S.sort = t.dataset.v; store.set('sort', S.sort); hidePop(); renderHeader(); renderContent(); },
  'size-set': t => { hidePop(); setSize(SIZES.indexOf(t.dataset.v)); },
  more: t => openPop(t, menuHTML([['export-view', 'Export all in view…', 'download'], ['sync-now', 'Sync now', 'refresh-cw'], ['help', coarse() ? 'Gestures and shortcuts' : 'Keyboard shortcuts', 'keyboard']]) + '<hr>' + menuHTML([['m-states', 'Mockup states…', 'circle-help']]), { role: 'menu' }),
  'export-view': () => { hidePop(); const f = curFolder(); openExportMulti(viewList(), f ? 'folder-' + slug(f.name) : S.view === 'favorites' ? 'favorites' : S.type !== 'all' ? S.type : 'library'); },
  'folder-export': () => { const f = curFolder(); openExportMulti(baseList(), 'folder-' + slug(f.name)); },
  'folder-menu': t => openFolderMenu(t, t.dataset.fid),
  'folder-rename': t => { hidePop(); const f = S.folders.find(x => x.id === t.dataset.fid); folderNameDialog('Rename folder', f.name, 'Save', v => { f.name = v; refreshOrg(); renderHeader(); }, f); },
  'folder-delete': t => { hidePop(); deleteFolder(S.folders.find(x => x.id === t.dataset.fid)); },
  'new-folder': () => { hidePop(); newFolder(); },
  'rm-missing': () => { const f = curFolder(); if (f) f.missing = 0; else S.favMissing = 0; renderContent(); toast('Removed items that are no longer in your library.'); },
  'sync-pop': t => openPop(t, syncPopHTML(), { cls: 'syncpop' }),
  'sync-now': () => { hidePop(); $$('dialog.dlg[open]').forEach(d => d.close()); S.flags.partial = false; startSync(); },
  retry: () => { hidePop(); S.flags.cors = S.flags.offlineEmpty = S.flags.partial = false; renderAll(); toast('Trying again…'); },
  inprog: t => { const by = {}; pending.forEach(a => { const k = TYPES[a.type].chip; by[k] = by[k] || { g: 0, r: 0 }; by[k][a.status === 'review' ? 'r' : 'g']++; });
    openPop(t, '<div class="ph2">In PixelLab</div>' + Object.keys(by).map(k => { const l = CHIPS.find(c => c[0] === k)[1]; return `<p class="prow">${l} · ${by[k].g} generating · ${by[k].r} needs review</p>${extLink(PL + '/create-object', `Open ${l} in PixelLab`, 'mi')}`; }).join(''), {}); },
  settings: () => { hidePop(); openSettings(); },
  'm-states': () => { hidePop(); openSettings(true); },
  help: () => { hidePop(); openHelp(); },
  'help-tab': t => { $$('[data-act="help-tab"]', t.parentNode).forEach(b => { const on = b === t; b.setAttribute('aria-checked', on); b.setAttribute('aria-selected', on); }); $('#help-b').innerHTML = helpBody(t.dataset.v); },
  // cards
  'card-check': t => { toggleSel(t.dataset.key); },
  'card-menu': t => openCardMenu(t, card(t.dataset.key)),
  fav: t => toggleFav(t.dataset.key),
  open: t => { hidePop(); navOpen(card(t.dataset.key)); },
  'select-card': t => { hidePop(); toggleSel(t.dataset.key, true); },
  'add-folder': t => openFolderPicker(t.closest('.pop') ? pop._anchor : t, [t.dataset.key]),
  'rm-folder': t => { hidePop(); removeFrom(curFolder(), [t.dataset.key]); },
  'dl-menu': t => openDlMenu(t.closest('.pop') ? pop._anchor : t, card(t.dataset.key)),
  'dl-default': t => { const c = card(t.dataset.key); fakeSave(dlItems(c, dlCtx(c))[0].file); },
  'dl-item': t => { hidePop(); const c = card(t.dataset.key); fakeSave(dlItems(c, dlCtx(c))[+t.dataset.i].file); },
  'dl-more': t => { hidePop(); openExportSingle(card(t.dataset.key)); },
  'play-anim': t => { const c = card(t.dataset.key); if (V.open && V.card === c) { setAnim(+t.dataset.i); if (!V.playing) play(); } else navOpen(c, { anim: t.dataset.i }); },
  tag: t => {   // 02 §3.3 step 5: close the viewer, Library search becomes #tag
    S.q = '#' + t.dataset.tag; S.keepQ = true; S.type = 'all';
    history.replaceState(null, '', '#/'); if (V.open) closeViewer();
    if (S.view !== 'library') applyRoute(true); else { S.keepQ = false; renderHeader(); renderContent(); }
    announceCount();
  },
  'copy-text': t => { try { navigator.clipboard.writeText(t.dataset.text).catch(() => {}); } catch (e) { /* clipboard blocked */ } copied(t, t.dataset.msg || 'Copied'); },
  'copy-id': t => copied(t, 'Asset ID copied'),
  'copy-img': () => toast('Image copied. Paste or drop it into PixelLab.'),
  'fps-reset': t => { delete S.fps[t.dataset.fk]; if (V.open) setFps(8); else renderPane(); },
  // folder picker
  'fp-new': () => { const keys = pop._ctx.keys; hidePop(); newFolder(keys); },
  'fp-toggle': t => { const f = S.folders.find(x => x.id === t.dataset.fid), keys = pop._ctx.keys; if (t.getAttribute('aria-checked') === 'true') removeFrom(f, keys); else addTo(f, keys); pop.innerHTML = pop._ctx.rows(); const b = pop.querySelector(`[data-fid="${f.id}"]`); if (b) b.focus(); },
  'pop-close': () => hidePop(),
  // selection
  'sel-clear': () => exitSelect(),
  'sel-all': () => selectAll(),
  'sel-fav': () => bulkFav(Array.from(S.sel)),
  'sel-folder': t => openFolderPicker(t, Array.from(S.sel)),
  'sel-rm': () => removeFrom(curFolder(), Array.from(S.sel)),
  'sel-download': t => { const L = Array.from(S.sel).map(card); if (L.length === 1) openDlMenu(t, L[0]); else openExportMulti(L, 'selection-' + L.length); },
  // dialogs
  'dlg-close': t => t.closest('dialog').close(),
  'dlg-ok': t => { const d = t.closest('dialog'); if (d._ok) d._ok(); },
  'ex-pre': t => { const d = t.closest('dialog'); $$('.rcard', d).forEach(b => b.setAttribute('aria-checked', b === t)); d._st.sel = +t.dataset.i; d._upd(); },
  'ex-chip': t => { const d = t.closest('dialog'), k = t.dataset.k; d._st[k] = !d._st[k]; t.outerHTML = d._chip(k, t.textContent); $(`[data-k="${k}"]`, d).focus(); d._upd(); },
  seg: t => { $$('button', t.parentNode).forEach(b => b.setAttribute('aria-checked', b === t)); const d = t.closest('dialog'); if (d && t.dataset.k) { d._st[t.dataset.k] = t.dataset.v === '1'; d._upd(); } },
  'exp-cancel': () => { clearInterval(S.exporting); S.exporting = null; $('#expchip').hidden = true; toast('Export canceled. Nothing was saved.'); },
  'ready-dl': t => { t.closest('dialog').close(); toast('Saved (mockup: no file was written).'); },
  'ready-share': t => { t.closest('dialog').close(); toast('Share sheet opened (mockup).'); },
  // settings
  'chg-token': () => { const b = $('#chg-box'); b.hidden = !b.hidden; if (!b.hidden) $('#ct-tok').focus(); },
  forget: t => confirmDialog('Forget your token?', "Vitrine will disconnect on this device and delete its saved copy of your library. Your PixelLab account isn't affected.", 'Forget token', also => {
    if (also) { S.folders = []; S.favorites.clear(); S.favMissing = 0; }
    $$('dialog.dlg[open]').forEach(d => d.close());
    try { sessionStorage.removeItem('vitrine-mock-session'); } catch (e) { /* ignore */ }
    showConnect(false); toast('Token forgotten.');
  }, `<label class="switch"><input type="checkbox"><span>Also delete my folders and favorites</span></label><p class="helper">Your browser may still keep some images in its own cache. Clear your browsing data to remove them.</p>`),
  theme: t => { S.theme = t.dataset.v; store.set('theme', S.theme); applyTheme(); $$('[data-act="theme"]').forEach(b => b.setAttribute('aria-checked', b === t)); },
  backup: () => toast('Backup saved as vitrine-backup.json (mockup: no file was written).'),
  import: () => toast('Imported 0 folders (0 merged) and 0 favorites. 0 items aren\'t in this library. (mockup)'),
  protect: () => toast('Protected from automatic clearing (mockup).'),
  'clear-img': () => toast('Saved images cleared. Your folders and favorites are safe.'),
  'tip-off': () => { S.tipOff = true; renderContent(); },
  'tok-show': t => { const i = t.parentNode.querySelector('input'), on = i.type === 'password'; i.type = on ? 'text' : 'password'; t.textContent = on ? 'Hide' : 'Show'; t.setAttribute('aria-pressed', on); },
  'use-sample': () => { enterApp(true); toast('Connected. Loading your library…'); },
  'm-connect': () => { $$('dialog.dlg[open]').forEach(d => d.close()); showConnect(false); },
  'm-welcome': () => { $$('dialog.dlg[open]').forEach(d => d.close()); showConnect(true); },
  'm-sync': () => { $$('dialog.dlg[open]').forEach(d => d.close()); startSync(); },
  'm-401': () => { $$('dialog.dlg[open]').forEach(d => d.close()); reconnectDialog(); },
  'm-ready': () => readySheet('android-courier_walk_south@2x.gif'),
  'm-tip': () => { S.tipOff = false; $$('dialog.dlg[open]').forEach(d => d.close()); go('#/collections'); },
  // viewer
  'v-close': () => closeViewerNav(),
  'v-prev': () => navStep(-1), 'v-next': () => navStep(1),
  'v-play': () => togglePlay(), 'v-stepb': () => stepFrame(-1), 'v-stepf': () => stepFrame(1),
  'v-loop': t => { V.loop = !V.loop; t.setAttribute('aria-pressed', V.loop); },
  'v-fps': t => openPop(t, `<div class="ph2">Playback speed</div><div class="stepper"><button class="btn icon ghost" data-act="fps-dn" aria-label="Slower">${ic('minus')}</button><output id="fps-out" aria-live="polite">${fpsOf(fpsKey())} fps</output><button class="btn icon ghost" data-act="fps-up" aria-label="Faster">${ic('plus')}</button></div><button class="mi" data-act="fps-def">${ic('refresh-cw')}<span>Reset to 8 fps</span></button>`, {}),
  'fps-up': () => setFps(fpsOf(fpsKey()) + 1), 'fps-dn': () => setFps(fpsOf(fpsKey()) - 1), 'fps-def': () => setFps(8),
  'v-pick': t => openPop(t, `<div role="radiogroup" aria-label="Animation">${menuHTML([['v-anim', 'Rotations', '', V.anim < 0]].concat(V.asset.animations.map((a, i) => ['v-anim', `${esc(a.name)} · ${a.frameCount}f`, '', V.anim === i])), '').replace(/role="menuitemradio"/g, 'role="radio"')}</div>`, {}),
  'v-anim': t => { const i = $$('[data-act="v-anim"]', pop).indexOf(t) - 1; hidePop(); setAnim(i); },
  'v-dir': t => openCompass(t),
  'v-dirset': t => { setDir(t.dataset.v); openCompass($('[data-act="v-dir"]')); },
  'v-state': t => setState(+t.dataset.i),
  'v-grid': t => { V.grid = !V.grid; t.setAttribute('aria-pressed', V.grid); $('#v-tgrid').classList.toggle('on', V.grid); },
  'v-bdset': t => { S.backdrop = t.dataset.val; $('#v-stage').dataset.bd = bd(); $$('.sw', vd).concat($$('.sw', pop)).forEach(b => b.setAttribute('aria-checked', b.dataset.val === bd())); const l = $('.v-bdbtn span', vd); if (l) l.textContent = BDS.find(b => b[0] === bd())[1]; },
  'v-bd': t => openPop(t, `<div class="bdpop" role="radiogroup" aria-label="Backdrop">${BDS.map(([id, l]) => `<button class="sw" role="radio" aria-checked="${bd() === id}" data-act="v-bdset" data-val="${id}"><i data-bd="${id}"></i>${l}</button>`).join('')}</div>`, { cls: 'compass-pop' }),
  'v-fit': () => setZoom('fit'), 'v-1': () => setZoom(1), 'v-zi': () => zoomStep(1), 'v-zo': () => zoomStep(-1),
  'v-more': t => openPop(t, menuHTML([['copy-img', 'Copy image', 'copy'], ['v-copyp', 'Copy prompt', 'copy'], /creator_image|map$/.test(V.card.type) && ['v-reload', 'Reload from PixelLab', 'refresh-cw'],
    document.fullscreenEnabled && ['v-fs', 'Fullscreen', 'maximize-2'], ['help', 'Keyboard shortcuts', 'keyboard']]), { role: 'menu' }),
  'v-copyp': () => { hidePop(); toast('Prompt copied'); },
  'v-reload': () => { hidePop(); loadFrames(); toast('Reloaded from PixelLab.'); },
  'v-fs': () => { hidePop(); fullscreen(); },
  'v-info': () => toggleInfo(),
  'sheet-toggle': () => setDetent($('#v-insp').dataset.detent === 'full' ? 'peek' : nextDetent[$('#v-insp').dataset.detent]),
  'sheet-half': () => setDetent('half')
};
function openCompass(anchor) {
  const av = availDirs();
  openPop(anchor, `<div class="compass" role="radiogroup" aria-label="Direction">${COMPASS.map(d => d ? `<button role="radio" aria-checked="${d === V.dir}" data-act="v-dirset" data-v="${d}" aria-label="${DIR_NAME(d)}"${av.includes(d) ? '' : ' disabled'}>${ic('arrow-up', '', 'rotate:' + ROT[d] + 'deg')}</button>` : `<span aria-hidden="true">${DIR_AB[V.dir] || ''}</span>`).join('')}</div>`, { cls: 'compass-pop' });
}
function sortMenu() { return menuHTML(Object.keys(SORTS).filter(k => k !== 'updated' || S.type === 'characters').map(k => ['sort-set', SORTS[k], '', S.sort === k, k])); }
function openCardMenu(anchor, c, x, y) {
  const pl = plinks(c);
  openPop(anchor, menuHTML([['open', 'Open', 'scan'], ['fav', S.favorites.has(c.key) ? 'Unfavorite' : 'Favorite', 'heart'], ['dl-menu', 'Download…', 'download'], ['add-folder', 'Add to folder…', 'folder-plus'],
    S.view === 'folder' && ['rm-folder', 'Remove from this folder', 'folder-minus']], c.key)
    + extLink(pl.open, `${ic('external-link')}<span>Open in PixelLab</span>`, 'mi') + menuHTML([['select-card', 'Select', 'square-check']], c.key), { role: 'menu', x, y });
}
function copied(btn, msg) { const old = btn.innerHTML; btn.innerHTML = ic('check', 'sm') + '<span>Copied</span>'; setTimeout(() => { if (btn.isConnected) btn.innerHTML = old; }, 2000); toast(msg); }
function navOpen(c, extra) { location.hash = viewerHash(c, extra); }
function setSize(i) {
  if (i < 0 || i >= SIZES.length) return;
  S.size = SIZES[i]; const s = $('#sizer'); if (s) { s.value = i + 1; s.setAttribute('aria-valuetext', S.size); }
  renderContent(true); announce(`Grid size ${S.size}`);
}
function announceCount() { const n = S.type === 'other' ? 0 : viewList().length, nn = NOUN[S.type]; announce(S.q ? plural(n, 'result') : plural(n, nn[0], nn[1])); }
function applyTheme() { if (S.theme === 'system') delete document.documentElement.dataset.theme; else document.documentElement.dataset.theme = S.theme; }

document.addEventListener('click', e => {
  const t = e.target.closest('[data-act]');
  if (t && ACT[t.dataset.act] && !t.disabled) {
    if (t.tagName === 'A' && t.target === '_blank') { ACT[t.dataset.act](t, e); return; }   // hand-off links still open
    if (t.tagName === 'A') e.preventDefault();
    ACT[t.dataset.act](t, e); return;
  }
  const a = e.target.closest('#content .card');
  if (!a) return;
  const key = a.dataset.key;
  if (lp && lp.fired) { e.preventDefault(); lp = null; return; }
  if (e.ctrlKey || e.metaKey) { e.preventDefault(); toggleSel(key); return; }
  if (e.shiftKey) { e.preventDefault(); rangeSel(key); return; }
  if (S.selecting) { e.preventDefault(); toggleSel(key); return; }
  if (inspMode()) { e.preventDefault(); setCurrent(key); focusCard(key, false); }
  // otherwise the link's own hash navigation opens the viewer (Back closes it)
});
document.addEventListener('dblclick', e => { const a = e.target.closest('#content .card'); if (a && inspMode() && !S.selecting) navOpen(card(a.dataset.key)); });
document.addEventListener('submit', e => {
  e.preventDefault(); const f = e.target;
  if (f.id === 'cf') submitToken(f, () => { enterApp(true); toast('Connected. Loading your library…'); });
  else if (f.id === 'rc') submitToken(f, () => { f.closest('dialog').close(); toast('Reconnected. Your library is up to date.'); });
  else if (f.id === 'ct') submitToken(f, () => { $('#chg-box').hidden = true; toast('Token changed. Connected.'); });
});
const CHG = {
  'c-rem': t => { S.remember = t.checked; $$('.helper[id$="-rh"]').forEach(h => { h.textContent = remHelp(); }); },
  's-rem': t => {
    if (t.checked) { S.remember = true; t.closest('section').querySelector('.helper').textContent = remHelp(); return; }
    t.checked = true;
    confirmDialog('Stop remembering?', "Vitrine will delete your saved token and its saved copy of your library from this browser. You'll stay connected in this tab.", 'Stop remembering', () => {
      S.remember = false; t.checked = false; if (t.isConnected) t.closest('section').querySelector('.helper').textContent = remHelp(); toast('Stopped remembering. Connected in this tab only.'); });
  },
  's-anim': t => { if (t.checked !== S.animate) ACT.animate(); },
  's-size': t => setSize(SIZES.indexOf(t.value)),
  's-bd': t => { S.backdropDefault = t.value; S.backdrop = null; renderPane(); },
  's-keys': t => { S.shortcuts = t.checked; },
  flag: t => { S.flags[t.dataset.k] = t.checked; if (t.dataset.k === 'gate' && S.type === 'images') S.type = 'images'; if (S.connected) renderAll(); }
};
document.addEventListener('change', e => { const h = CHG[e.target.dataset.chg]; if (h) h(e.target, e); });
const runSearch = debounce(() => { renderContent(); updateResult(); announceSoon(); }, 150);
const announceSoon = debounce(announceCount, 500);
document.addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'q') { S.q = t.value; const c = $('[data-act="q-clear"]', $('#hdr')); if (c) c.hidden = !S.q; runSearch(); }
  else if (t.id === 'sizer') setSize(+t.value - 1);
  else if (t.id === 'v-scrub' && V.player) { pause(); V.player.seek(+t.value); stageLabel(); }
});

// ===================== events: keyboard, pointer, scroll =====================
document.addEventListener('keydown', e => {
  if (e.defaultPrevented) return;
  const t = e.target, k = e.key;
  const typing = t.matches && t.matches('input:not([type=checkbox]):not([type=radio]):not([type=range]), textarea, select');
  if (k === 'Escape') {
    if (t.id === 'q') { e.preventDefault(); if (t.value) { t.value = ''; S.q = ''; runSearch(); $('[data-act="q-clear"]').hidden = true; } else { t.blur(); document.body.classList.remove('searching'); } return; }
    if (!topDialog() && !pop.matches(':popover-open') && S.selecting) { e.preventDefault(); exitSelect(); }
    return;
  }
  if (V.open) return viewerKey(e);
  if (typing || topDialog() || !S.connected) return;
  if ((e.ctrlKey || e.metaKey) && (k === 'a' || k === 'A') && S.view !== 'collections') { e.preventDefault(); selectAll(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey || !S.shortcuts) return;
  if (k === '/') { e.preventDefault(); ACT['search-open'](); }
  else if (k === '?') { e.preventDefault(); openHelp(); }
  else if ((k === '+' || k === '=') && S.view !== 'collections') setSize(SIZES.indexOf(S.size) + 1);
  else if (k === '-' && S.view !== 'collections') setSize(SIZES.indexOf(S.size) - 1);
});
$('#content').addEventListener('keydown', e => {
  const a = e.target.closest('.card'); if (!a) return;
  const k = e.key, key = a.dataset.key, all = $$('#grid .card'), i = all.indexOf(a);
  const j = { ArrowRight: i + 1, ArrowLeft: i - 1, ArrowDown: i + S.cols, ArrowUp: i - S.cols, Home: 0, End: all.length - 1 }[k];
  if (j != null && !e.altKey) { e.preventDefault(); const n = all[Math.max(0, Math.min(all.length - 1, j))]; focusCard(n.dataset.key, true); if (inspMode()) setCurrent(n.dataset.key); return; }
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
$('#pane').addEventListener('pointerover', e => { const a = e.target.closest('.pv'); if (a) { const art = $('.art', a); startPreview(art, card(art.dataset.key)); } });
$('#pane').addEventListener('pointerout', e => { const a = e.target.closest('.pv'); if (a && !a.contains(e.relatedTarget) && !S.animate) stopPreview($('.art', a)); });
let lastY = 0;
$('#main').addEventListener('scroll', () => {
  const y = $('#main').scrollTop, h = $('#hdr'), v = vp();
  h.classList.toggle('scrolled', y > 0);
  if (v === 'phone' || v === 'compact') h.classList.toggle('tuck', y > lastY && y > 120 && !h.contains(document.activeElement));
  lastY = y;
}, { passive: true });
new ResizeObserver(() => { layoutGrid(); fitIn($('#pane')); if (S.view === 'collections') fitIn($('#content')); }).observe($('#main'));
new ResizeObserver(es => { $('#main').style.scrollPaddingTop = es[0].target.offsetHeight + 'px'; layoutGrid(); }).observe($('#hdr'));   // header height also tracks text zoom
let lastInsp = inspMode();
addEventListener('resize', debounce(() => { const m = inspMode(); if (m !== lastInsp) { lastInsp = m; renderPane(); } renderSelbar(); if (V.open) updateInfoBtn(); }, 120));
addEventListener('hashchange', () => applyRoute(true));
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopAllPreviews(); if (V.open && V.playing) pause(); } });

// ===================== self-check + boot =====================
function selfTest() {   // ?selftest=1 → result in <html data-selftest>; the 03 §2 counts must hold
  const count = k => cards.filter(c => k === 'all' || c.T.chip === k).length;
  const want = { all: 71, characters: 3, objects: 24, images: 23, tilesets: 9, tiles: 5, maps: 1, ui: 6 };
  const bad = Object.keys(want).filter(k => count(k) !== want[k]).map(k => `${k}=${count(k)}`);
  if (card(cards.find(c => c.title === 'Hooded Orb Mage').key).states.length !== 2) bad.push('hooded states');
  if (cards.filter(c => c.title === 'Bear Trap').length !== 2) bad.push('bear trap cards');
  if (!cards.every(c => /^[\w-]{12}$/.test(c.key)) || new Set(cards.map(c => c.key)).size !== cards.length) bad.push('keys');
  if (pending.length !== 2) bad.push('pending');
  if (S.folders.find(f => f.name === 'Hero party').keys.length !== 7) bad.push('hero party');
  document.documentElement.dataset.vw = innerWidth + 'x' + innerHeight + '@' + devicePixelRatio;
  document.documentElement.dataset.selftest = bad.length ? 'FAIL ' + bad.join(' ') : 'pass';
}
function boot() {
  applyTheme();
  if (P.get('selftest')) selfTest();
  const demo = P.get('demo');
  let session = false; try { session = sessionStorage.getItem('vitrine-mock-session') === '1'; } catch (e) { /* ignore */ }
  if (P.get('search')) S.q = P.get('search');
  if (P.get('type')) S.type = P.get('type');
  if (demo === 'connect' || demo === 'welcome' || (!demo && !session)) {
    showConnect(demo === 'welcome' || (!demo && store.get('lastMode', '') === 'session'));
    if (P.get('error')) { $('#cf-tok').value = 'bad'; submitToken($('#cf'), () => {}); }
    return;
  }
  const keepType = S.type, keepQ = S.q;
  enterApp(demo === 'sync');
  S.type = keepType; S.q = keepQ;
  const find = s => cards.find(c => slug(c.caption) === s || slug(c.title) === s);
  const fold = s => S.folders.find(f => slug(f.name) === s);
  const viewParent = () => { const f = P.get('folder') && fold(P.get('folder')); if (f) { S.view = 'folder'; S.folderId = f.id; } else if (demo === 'collections') S.view = 'collections'; else if (demo === 'favorites') S.view = 'favorites'; };
  viewParent();
  if (S.type !== 'all') history.replaceState(null, '', parentHash());
  if (S.view !== 'library' || S.type !== 'all' || S.q) { history.replaceState(null, '', parentHash()); renderAll(); }
  const c = P.get('asset') && find(P.get('asset'));
  if (c && demo === 'inspector') setCurrent(c.key);
  if (demo === 'viewer' || demo === 'export-single') {
    const t = c || find('android-courier'), q = new URLSearchParams();
    ['anim', 'dir'].forEach(k => { if (P.get(k)) q.set(k, P.get(k)); }); if (P.get('vstate')) q.set('state', P.get('vstate'));
    history.replaceState(null, '', viewerHash(t)); openViewer(t, q, false);
    if (P.get('bd')) ACT['v-bdset']({ dataset: { val: P.get('bd') } });
    if (P.get('grid')) { V.grid = true; $('#v-tgrid').classList.add('on'); }
    if (P.get('sheet')) setDetent(P.get('sheet'));
    if (P.get('info') === '0') toggleInfo();
    if (P.get('zoom')) setTimeout(() => setZoom(+P.get('zoom')), 50);
    if (P.get('paused')) setTimeout(pause, 0);
    if (demo === 'export-single') setTimeout(() => openExportSingle(t), 60);
  }
  if (demo === 'select' || demo === 'export') {
    cards.filter(x => x.T.chip === 'objects').slice(0, 12).forEach(x => S.sel.add(x.key));
    S.selecting = true; renderAll();
    if (demo === 'export') openExportMulti(Array.from(S.sel).map(card), 'selection-' + S.sel.size);
  }
  if (demo === 'export-folder') { const f = fold('hero-party'); go('#/folder/' + f.id); setTimeout(() => openExportMulti(baseList(), 'folder-hero-party'), 30); }
  if (demo === 'report') openReport([find('torch')]);
  if (demo === 'ready') readySheet('android-courier_walk_south@2x.gif');
  if (demo === 'settings') openSettings(); if (demo === 'mockstates') openSettings(true);
  if (demo === 'help') openHelp();
  if (demo === 'reconnect') reconnectDialog();
  if (demo === 'menu' && c) setTimeout(() => openCardMenu($(`.card[data-key="${c.key}"]`), c), 30);
  if (demo === 'addfolder' && c) setTimeout(() => openFolderPicker($(`.card[data-key="${c.key}"]`), [c.key]), 30);
  if (demo === 'toast') toast('Removed from Dungeon kit. It\'s still in your library.', { action: 'Undo', onAction: () => {} });
}
boot();
})();
