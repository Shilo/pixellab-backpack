/* Vitrine · Option C "Soft Pixel Workbench" — interactive mockup.
   Classic script, no network. Needs ../shared/sample-data.js (SAMPLE_DATA) and
   ../shared/pixel-utils.js (integerScale, PixelTicker). Unofficial; not affiliated with PixelLab. */
(function () {
'use strict';
const root = document.documentElement;
// Caught errors land in a data attribute so a headless --dump-dom run can see them.
window.addEventListener('error', e => { root.dataset.jsError = (root.dataset.jsError || '') + ' | ' + e.message + ' @' + e.lineno; });

// ---------------------------------------------------------------- helpers
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : '';
const fmtN = n => n.toLocaleString('en-US');
const plural = (n, w, p) => fmtN(n) + ' ' + (n === 1 ? w : (p || w + 's'));
const slug = s => norm(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'asset';
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const store = {
  get(k) { try { return localStorage.getItem('vitrine-c-' + k); } catch (e) { return null; } },
  set(k, v) { try { localStorage.setItem('vitrine-c-' + k, v); } catch (e) { /* storage blocked: in-memory only */ } }
};
const Q = new URLSearchParams(location.search);
const dtFull = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
const dtDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const pad2 = n => String(n).padStart(2, '0');
const today = (d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()))(new Date());
const ago = ts => { const s = (Date.now() - ts) / 1000; return s < 60 ? 'just now' : Math.round(s / 60) + ' min ago'; };
const PL = 'https://pixellab.ai';
const ext = (href, label) => `<a class="ext" href="${href}" target="_blank" rel="noopener noreferrer">${esc(label)} ↗<span class="sr-only"> (opens PixelLab in a new tab)</span></a>`;

// ---------------------------------------------------------------- icons (Lucide, ISC)
const ICONS = {
  'layout-grid': '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
  folders: '<path d="M20 17a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3.9a2 2 0 0 1-1.69-.9l-.81-1.2a2 2 0 0 0-1.67-.9H8a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2Z"/><path d="M2 8v11a2 2 0 0 0 2 2h14"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  folder: '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  'folder-plus': '<path d="M12 10v6"/><path d="M9 13h6"/><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  'arrow-down-up': '<path d="m3 16 4 4 4-4"/><path d="M7 20V4"/><path d="m21 8-4-4-4 4"/><path d="M17 4v16"/>',
  'square-check': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>',
  'circle-play': '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
  'external-link': '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
  ellipsis: '<circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  'circle-help': '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  pencil: '<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/><path d="m15 5 4 4"/>',
  'trash-2': '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  play: '<polygon points="6 3 20 12 6 21 6 3"/>',
  pause: '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
  'step-back': '<line x1="18" x2="18" y1="20" y2="4"/><polygon points="14,20 4,12 14,4"/>',
  'step-forward': '<line x1="6" x2="6" y1="4" y2="20"/><polygon points="10,4 20,12 10,20"/>',
  repeat: '<path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/>',
  minus: '<path d="M5 12h14"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  scan: '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>',
  contrast: '<circle cx="12" cy="12" r="10"/><path d="M12 18a6 6 0 0 0 0-12v12z"/>',
  'maximize-2': '<polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/>',
  'arrow-up': '<path d="m5 12 7-7 7 7"/><path d="M12 19V5"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  monitor: '<rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>',
  keyboard: '<path d="M10 8h.01"/><path d="M12 12h.01"/><path d="M14 8h.01"/><path d="M16 12h.01"/><path d="M18 8h.01"/><path d="M6 8h.01"/><path d="M7 16h10"/><path d="M8 12h.01"/><rect width="20" height="16" x="2" y="4" rx="2"/>',
  'refresh-cw': '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
  'loader-circle': '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
  'triangle-alert': '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  'key-round': '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/>',
  'grid-3x3': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>',
  'person-standing': '<circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 6-2"/><path d="M12 10v4"/>',
  box: '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
  image: '<rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  'grid-2x2': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 12h18"/><path d="M12 3v18"/>',
  layers: '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  map: '<path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/>',
  'panels-top-left': '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>',
  check: '<path d="M20 6 9 17l-5-5"/>'
};
const icon = (n, cls, deg) => '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false"' +
  (deg ? ' style="transform:rotate(' + deg + 'deg)"' : '') + '>' + ICONS[n] + '</svg>';

// ---------------------------------------------------------------- pixel mark + wordmark (04 §6.3)
const GLYPH = {
  V: ['#...#', '#...#', '#...#', '#...#', '.#.#.', '.#.#.', '..#..'],
  I: ['###', '.#.', '.#.', '.#.', '.#.', '.#.', '###'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####']
};
const MARK = ['###.###.###', '#.#.#.#.#.#', '###.###.###', '...........', '###.###.###', '#.#.#.#.###', '###.###.###', '...........', '###.###.###', '#.#.#.#.#.#', '###.###.###'];
const WORD = GLYPH.V.map((_, y) => 'VITRINE'.split('').map(ch => GLYPH[ch][y]).join('.'));  // 37 × 7 cells
function pixels(rows, cell, label, accent) {
  let r = '';
  rows.forEach((row, y) => row.replace(/#+/g, (m, x) => { r += `<rect x="${x}" y="${y}" width="${m.length}" height="1"/>`; return m; }));
  if (accent) r += `<rect class="acc" x="${accent[0]}" y="${accent[1]}" width="1" height="1"/>`;
  return `<svg class="px-art" width="${rows[0].length * cell}" height="${rows.length * cell}" viewBox="0 0 ${rows[0].length} ${rows.length}" shape-rendering="crispEdges" fill="currentColor" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${r}</svg>`;
}
const markSvg = cell => pixels(MARK, cell, null, [9, 5]);

// ---------------------------------------------------------------- data → cards
const D = window.SAMPLE_DATA;
const CAT = { character: 'characters', object: 'objects', map_object: 'objects', creator_image: 'images', tileset_topdown: 'tilesets', tileset_sidescroller: 'tilesets', tiles_pro: 'tiles', tile_isometric: 'tiles', map: 'maps', ui_asset: 'ui' };
const KIND = { character: 'Character', object: 'Object', map_object: 'Object', creator_image: 'Image', tileset_topdown: 'Top-down tileset', tileset_sidescroller: 'Sidescroller tileset', tiles_pro: 'Tiles Pro', tile_isometric: 'Isometric tile', map: 'Map', ui_asset: 'UI' };
const TYPES = [['all', 'All', 'layout-grid'], ['characters', 'Characters', 'person-standing'], ['objects', 'Objects', 'box'], ['images', 'Images', 'image'], ['tilesets', 'Tilesets', 'grid-2x2'], ['tiles', 'Tiles', 'layers'], ['maps', 'Maps', 'map'], ['ui', 'UI', 'panels-top-left'], ['other', 'Other', 'circle-help']];
const TYPE_WORD = { all: ['asset', 'assets'], characters: ['character', 'characters'], objects: ['object', 'objects'], images: ['image', 'images'], tilesets: ['tileset', 'tilesets'], tiles: ['tile', 'tiles'], maps: ['map', 'maps'], ui: ['UI asset', 'UI assets'] };
const DIRS = ['south', 'south_east', 'east', 'north_east', 'north', 'north_west', 'west', 'south_west'];  // API order
const CW = ['north', 'north_east', 'east', 'south_east', 'south', 'south_west', 'west', 'north_west'];
const COMPASS = [['north_west', 'north', 'north_east'], ['west', null, 'east'], ['south_west', 'south', 'south_east']];
const DSHORT = { south: 'S', south_east: 'SE', east: 'E', north_east: 'NE', north: 'N', north_west: 'NW', west: 'W', south_west: 'SW', unknown: '' };
const DEG = { north: 0, north_east: 45, east: 90, south_east: 135, south: 180, south_west: 225, west: 270, north_west: 315 };
const dname = d => cap(d.replace('_', '-'));
const STEPS = [1, 2, 3, 4, 6, 8, 12, 16];
const SIZE_ORDER = ['S', 'M', 'L', 'XL'];
const CELL_MIN = { mobile: { S: 60, M: 76, L: 104, XL: 156 }, other: { S: 64, M: 88, L: 120, XL: 168 } };  // 04 §0.5 (C)
const SORTS = { newest: 'Newest', oldest: 'Oldest', az: 'Name A–Z', za: 'Name Z–A', largest: 'Largest', smallest: 'Smallest', updated: 'Recently updated' };
const BACKDROPS = [['stage', 'Stage'], ['checker', 'Checker'], ['mid', 'Mid gray'], ['light', 'Light gray'], ['black', 'Black'], ['white', 'White']];

// ponytail: sync stand-in for base64url(SHA-256(type:uuid)).slice(0,12) (02 §0); same shape, no async boot.
function h53(str, seed) {
  let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
  for (let i = 0; i < str.length; i++) { const ch = str.charCodeAt(i); h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677); }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
function opaqueKey(a) {
  let s = '';
  [1, 2].forEach(seed => { let h = h53(a.type + ':' + a.id, seed); for (let i = 0; i < 6; i++) { s += B64[h % 64]; h = Math.floor(h / 64); } });
  return s;
}
const artSize = a => a.meta && a.meta.size ? { w: a.meta.size.width, h: a.meta.size.height } : { w: a.width, h: a.height };

const cards = [], byKey = {}, byId = {};
function addCard(members) {
  const a = members[0], m = a.meta || {}, cat = CAT[a.type], sz = artSize(a);
  const c = { key: opaqueKey(a), id: a.id, a, members, cat, kind: KIND[a.type], tags: [],
    title: a.name + (cat === 'objects' && m.state_name ? ' · ' + m.state_name : ''),
    animated: !!((a.animations && a.animations.length) || (a.frames && a.frames.length > 1)) };
  members.forEach(x => { byId[x.id] = c; (x.tags || []).forEach(t => c.tags.push(norm(t))); });
  c.text = norm([c.title, c.kind, sz.w + 'x' + sz.h, sz.w + '×' + sz.h, a.prompt, c.tags.join(' '), members.map(x => x.meta.state_name || '').join(' '),
    m.view, m.template_id, m.lower_description, m.upper_description, m.transition_description, m.tile_type, m.tile_shape, m.description, m.frames > 1 ? 'animated' : ''].filter(Boolean).join(' '));
  byKey[c.key] = c; cards.push(c);
}
(function buildCards() {
  const groups = {};
  D.assets.forEach(a => {
    if (!CAT[a.type] || a.status !== 'completed') return;           // drops vfx/font + review/processing (03 §2)
    if (a.type === 'character' && a.meta.group_id) (groups[a.meta.group_id] = groups[a.meta.group_id] || []).push(a);
    else addCard([a]);
  });
  Object.keys(groups).forEach(g => addCard(groups[g].sort((x, y) => (x.meta.state_name != null) - (y.meta.state_name != null) || Date.parse(x.createdAt) - Date.parse(y.createdAt))));
})();
const inProgress = D.assets.filter(a => a.status === 'review' || a.status === 'processing');

// ---------------------------------------------------------------- state
const st = {
  connected: false, view: 'library', folderId: null, chip: 'all', q: '', sort: store.get('sort') || 'newest',
  size: store.get('size') || 'M', animate: store.get('animate') === '1', theme: store.get('theme') || 'system',
  shortcuts: true, remember: false, defaultBackdrop: 'checker', protect: false,
  sel: new Set(), selMode: false, anchor: null, cur: null, hover: null, layout: '', cols: 1, box: 76,
  favs: new Set(D.favorites.map(id => byId[id] ? byId[id].id : id)),
  folders: D.folders.map(f => ({ id: f.id, name: f.name, ids: Array.from(new Set(f.assetIds.map(id => byId[id] ? byId[id].id : id))) })),
  arrived: null, syncing: false, failed: new Set(), lastSync: Date.now() - 120000, exporting: null,
  demo: {}, info: false, stageOpen: false, pushed: false, tipDismissed: false
};
const S = { anim: -1, state: 0, dir: 'south', frame: 0, playing: false, loop: true, zoom: 'fit', grid: false, frames: [], imgs: [], loaded: 0, player: null, token: 0, fps: {} };
let pop = null;

// ---------------------------------------------------------------- environment
const mqCoarse = matchMedia('(pointer: coarse)'), mqHover = matchMedia('(hover: hover) and (pointer: fine)'), mqReduce = matchMedia('(prefers-reduced-motion: reduce)');
const coarse = () => Q.get('pointer') === 'coarse' || mqCoarse.matches;
const fine = () => !coarse() && mqHover.matches;
const reduced = () => mqReduce.matches;
const mobile = () => st.layout === 'phone' || st.layout === 'compact';
const panes = () => st.layout === 'two' || st.layout === 'three';
const stageVisible = () => !mobile() || st.stageOpen;

function detectLayout() {
  const w = innerWidth, h = innerHeight;
  const L = h < 480 ? 'compact' : w < 600 ? 'phone' : w < 840 ? 'stack' : w < 1200 ? 'two' : 'three';
  root.classList.toggle('coarse', coarse());
  root.classList.toggle('fine', fine());
  if (L === st.layout) return false;
  root.classList.remove('L-' + st.layout);
  st.layout = L;
  root.classList.add('L-' + L);
  root.classList.toggle('mobile', mobile());
  (L === 'stack' ? $('#info-slot') : $('#stage-view')).append($('#inspector'));   // 768: Info swaps the sheet for the inspector
  root.classList.toggle('stage-open', mobile() && st.stageOpen);
  return true;
}
function applyTheme() {
  if (st.theme === 'system') root.removeAttribute('data-theme'); else root.dataset.theme = st.theme;
}

// ---------------------------------------------------------------- view model
const folderById = id => st.folders.find(f => f.id === id);
const sortedFolders = () => st.folders.slice().sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
const folderCards = f => f.ids.map(id => byId[id]).filter(c => c && libCards().includes(c));
function libCards() {
  if (st.demo.empty) return [];
  return cards.filter(c => (!st.arrived || st.arrived.has(c.key)) && !(st.demo.gated && c.cat === 'images') && !st.failed.has(c.cat));
}
function baseCards() {
  const lib = libCards();
  if (st.view === 'favorites') return lib.filter(c => st.favs.has(c.id));
  if (st.view === 'folder') { const f = folderById(st.folderId); return f ? lib.filter(c => f.ids.includes(c.id)) : []; }
  return lib;
}
function matches(c, q) {
  return norm(q).split(/\s+/).filter(Boolean).every(t => t[0] === '#' ? c.tags.includes(t.slice(1)) : c.text.includes(t));
}
const effSort = () => st.sort === 'updated' && st.chip !== 'characters' ? 'newest' : st.sort;
const coll = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const dateOf = c => c.cat === 'maps' ? null : Date.parse(c.a.createdAt);   // maps have no date (02 §11.3)
const areaOf = c => { const s = artSize(c.a); return s.w * s.h; };
function sortCards(list) {
  const newest = (x, y) => (dateOf(x) === null) - (dateOf(y) === null) || (dateOf(y) || 0) - (dateOf(x) || 0);
  const cmp = {
    newest, oldest: (x, y) => (dateOf(x) === null) - (dateOf(y) === null) || (dateOf(x) || 0) - (dateOf(y) || 0),
    az: (x, y) => coll.compare(x.title, y.title), za: (x, y) => coll.compare(y.title, x.title),
    largest: (x, y) => areaOf(y) - areaOf(x) || newest(x, y), smallest: (x, y) => areaOf(x) - areaOf(y) || newest(x, y),
    updated: (x, y) => Date.parse(y.a.updatedAt || y.a.createdAt) - Date.parse(x.a.updatedAt || x.a.createdAt)
  }[effSort()];
  return list.slice().sort(cmp);
}
function viewCards() {
  if (st.view === 'collections' || st.chip === 'other') return [];
  return sortCards(baseCards().filter(c => (st.chip === 'all' || c.cat === st.chip) && matches(c, st.q)));
}
function chipTypes() {
  const lib = st.view === 'library' || st.view === 'collections';
  const present = new Set((lib ? libCards() : baseCards()).map(c => c.cat));
  return TYPES.filter(([id]) => id === 'all' || present.has(id) || (lib && (st.syncing || id === 'other' || (id === 'images' && st.demo.gated))));
}
const viewName = () => st.view === 'library' ? 'Library' : st.view === 'collections' ? 'Collections' : st.view === 'favorites' ? 'Favorites' : (folderById(st.folderId) || {}).name || 'Folder';
const hiddenCount = () => { const v = new Set(viewCards().map(c => c.key)); return Array.from(st.sel).filter(k => !v.has(k)).length; };
const unavailIds = () => {
  if (st.syncing) return [];
  const ids = st.view === 'favorites' ? Array.from(st.favs) : st.view === 'folder' && folderById(st.folderId) ? folderById(st.folderId).ids : [];
  return ids.filter(id => !byId[id]);
};

function badge(c, full) {
  const a = c.a, m = a.meta || {};
  switch (c.cat) {
    case 'characters': {
      const d = m.directions, n = (a.animations || []).length, s = c.members.length;
      return full ? [d && d + ' dir', n && n + ' anim', s > 1 && s + ' states'].filter(Boolean).join(' · ') : (n ? n + ' anim' : d + ' dir');
    }
    case 'objects': {
      const d = Object.keys(a.directions || {}).length > 1 ? Object.keys(a.directions).length : 0, n = (a.animations || []).length;
      return full ? [d && d + ' dir', n && n + ' anim'].filter(Boolean).join(' · ') : (d ? d + ' dir' : n ? n + ' anim' : '');
    }
    case 'images': return m.frames > 1 ? m.frames + ' frames' : '';
    case 'tilesets': return m.total_tiles + ' tiles' + (full ? ' · ' + a.tileSize + ' px' : '');
    case 'tiles': return a.type === 'tiles_pro' ? (full ? m.n_tiles + ' variations · ' + a.tileSize + ' px' : m.n_tiles + ' var') : (full ? cap(m.tile_shape) + ' · ' : '') + m.size + ' px';
    case 'maps': return full ? a.grid.cols + ' × ' + a.grid.rows + ' cells' : a.grid.cols + '×' + a.grid.rows;
    case 'ui': return full ? a.width + ' × ' + a.height : '';
  }
  return '';
}
const cardLabel = c => [c.title, c.kind.toLowerCase(), badge(c, true), st.favs.has(c.id) && 'favorite', st.sel.has(c.key) && 'selected'].filter(Boolean).join(', ');
const describe = c => { const s = artSize(c.a), d = c.a.meta && c.a.meta.directions; return `${c.title} — ${c.kind.toLowerCase()} · ${s.w}×${s.h}${d > 1 ? ' · ' + d + ' directions' : ''}`; };
const typeIcon = cat => (TYPES.find(t => t[0] === cat) || [])[2];

// ---------------------------------------------------------------- routing (hash; opaque keys only)
function parseHash() {
  const h = location.hash.replace(/^#/, '') || '/', [path, qs] = h.split('?'), p = new URLSearchParams(qs || '');
  const segs = path.split('/').filter(Boolean), ai = segs.indexOf('a');
  const r = { view: 'library', folderId: null, key: null, type: p.get('type'), dir: p.get('dir'), anim: p.get('anim'), state: p.get('state') };
  if (ai >= 0) { r.key = segs[ai + 1]; segs.splice(ai, 2); }
  if (segs[0] === 'collections' || segs[0] === 'favorites') r.view = segs[0];
  else if (segs[0] === 'folder') { r.view = 'folder'; r.folderId = segs[1]; }
  return r;
}
function buildHash(key) {
  let path = st.view === 'library' ? '' : st.view === 'folder' ? '/folder/' + st.folderId : '/' + st.view;
  const p = new URLSearchParams();
  if (st.view === 'library' && st.chip !== 'all') p.set('type', st.chip);
  if (key && st.view !== 'collections') {
    path += '/a/' + key;
    if (st.cur && st.cur.key === key) {
      if (S.state) p.set('state', S.state);
      if (S.anim >= 0) p.set('anim', S.anim + 1);
      if (S.dir && S.dir !== 'south' && S.dir !== 'unknown') p.set('dir', S.dir);
    }
  }
  const qs = p.toString();
  return '#' + (path || '/') + (qs ? '?' + qs : '');
}
function syncHash(push) {
  if (!st.connected) return;
  const h = buildHash(stageVisible() && st.cur ? st.cur.key : null);
  if (h !== location.hash) { try { history[push ? 'pushState' : 'replaceState'](null, '', h); } catch (e) { /* file:// history quirk: URL just stays */ } }
  updateTitle();
}
function updateTitle() {
  if (!st.connected) { document.title = 'Connect · Vitrine'; return; }
  const asset = st.cur && st.view !== 'collections' && stageVisible();
  document.title = (asset ? st.cur.a.name : viewName()) + ' · Vitrine';
}
function applyRoute() {
  if (!st.connected) return;
  const r = parseHash();
  const viewChanged = r.view !== st.view || r.folderId !== st.folderId;
  if (viewChanged) { st.view = r.view; st.folderId = r.folderId; if (st.view === 'folder' && !folderById(st.folderId)) st.view = 'collections'; }
  if (st.view === 'library') st.chip = r.type && TYPES.some(t => t[0] === r.type) ? r.type : 'all';
  else if (viewChanged) st.chip = 'all';
  const card = r.key ? byKey[r.key] : null;
  if (r.key && !card && !st.syncing) toast("That asset isn't in this library.");
  if (card && (card !== st.cur || r.dir || r.anim || r.state)) setCurrent(card, { route: r, noHash: true });
  if (mobile()) setStageOpen(!!card, true);
  else if (!st.cur || (viewChanged && st.view !== 'collections' && !viewCards().includes(st.cur))) setCurrent(viewCards()[0] || null, { noHash: true });
  renderAll();
  if (viewChanged) { scrollSheetTop(); $('#h1').focus({ preventScroll: true }); }
  syncHash();
}
function go(hash) { try { history.pushState(null, '', hash); } catch (e) { /* ignore */ } applyRoute(); }

// ---------------------------------------------------------------- live regions + toasts
function announce(t, assertive) { const el = $(assertive ? '#live-a' : '#live'); el.textContent = ''; setTimeout(() => { el.textContent = t; }, 40); }
let toastT;
function toast(msg, action, ic) {
  const box = $('#toasts');
  clearTimeout(toastT);
  box.innerHTML = `<div class="toast" role="status">${ic ? icon(ic) : ''}<span class="toast-msg">${esc(msg)}</span>${action ? `<button class="link" data-toast-act>${esc(action.label)}</button>` : ''}<button class="btn icon mini" data-toast-x aria-label="Dismiss">${icon('x')}</button></div>`;
  const el = box.firstChild;
  let left = action ? 10000 : 5000, t0 = 0;
  const run = () => { t0 = Date.now(); clearTimeout(toastT); toastT = setTimeout(() => { if (el.isConnected) box.innerHTML = ''; }, left); };
  const pause = () => { clearTimeout(toastT); left = Math.max(1500, left - (Date.now() - t0)); };
  el.addEventListener('mouseenter', pause); el.addEventListener('mouseleave', run);
  el.addEventListener('focusin', pause); el.addEventListener('focusout', run);
  el.addEventListener('click', e => {
    if (e.target.closest('[data-toast-act]')) { box.innerHTML = ''; action.act(); } else if (e.target.closest('[data-toast-x]')) box.innerHTML = '';
  });
  run();
}

// ---------------------------------------------------------------- popovers, menus, dialogs
function popover(anchor, html, o) {
  o = o || {};
  closePop();
  const el = document.createElement('div');
  el.className = 'pop ' + (o.cls || '');
  el.setAttribute('role', o.role || 'dialog');
  if (o.label) el.setAttribute('aria-label', o.label);
  el.innerHTML = html;
  document.body.append(el);
  pop = { el, anchor, o };
  if (anchor && anchor.setAttribute) anchor.setAttribute('aria-expanded', 'true');
  placePop();
  if (o.onClick) el.addEventListener('click', e => o.onClick(e, el));
  if (o.onChange) el.addEventListener('change', e => o.onChange(e, el));
  const f = el.querySelector(o.focus || '[role^=menuitem]:not([disabled]), [aria-checked=true], button:not([disabled]), input, a');
  if (f) f.focus({ preventScroll: true });
  return el;
}
function placePop() {
  if (!pop) return;
  const { el, anchor } = pop, r = anchor.getBoundingClientRect(), w = el.offsetWidth, h = el.offsetHeight;
  let x = clamp(r.left, 8, innerWidth - w - 8), y = r.bottom + 4;
  if (y + h > innerHeight - 8) y = Math.max(8, r.top - h - 4);
  el.style.left = x + 'px'; el.style.top = y + 'px';
}
function closePop(refocus) {
  if (!pop) return;
  const p = pop; pop = null;
  p.el.remove();
  if (p.anchor && p.anchor.setAttribute) p.anchor.setAttribute('aria-expanded', 'false');
  if (refocus && p.anchor && p.anchor.isConnected && p.anchor.focus) p.anchor.focus({ preventScroll: true });
}
function menu(anchor, items, label) {
  const html = items.map((it, i) => it.sep ? '<hr>' : it.href
    ? `<a role="menuitem" class="mi" href="${it.href}" target="_blank" rel="noopener noreferrer" data-i="${i}">${icon('external-link')}<span>${esc(it.label)} ↗</span><span class="sr-only"> (opens PixelLab in a new tab)</span></a>`
    : `<button role="${it.checked != null ? 'menuitemradio' : 'menuitem'}" class="mi${it.strong ? ' strong' : ''}" data-i="${i}"${it.checked != null ? ` aria-checked="${!!it.checked}"` : ''}${it.disabled ? ' disabled' : ''}>${it.checked ? icon('check') : it.icon ? icon(it.icon) : '<span class="i"></span>'}<span>${esc(it.label)}</span>${it.hint ? `<kbd class="hint">${esc(it.hint)}</kbd>` : ''}</button>`).join('');
  return popover(anchor, html, { cls: 'menu', role: 'menu', label, onClick(e) {
    const b = e.target.closest('[data-i]'); if (!b) return;
    const it = items[b.dataset.i];
    if (it.href) { closePop(); if (it.act) it.act(); return; }
    closePop(true); if (it.act) it.act();
  } });
}
let dlgSeq = 0;
function dialog(o) {
  const id = 'dlg' + (++dlgSeq), d = document.createElement('dialog');
  d.className = 'dlg ' + (o.cls || '');
  d.setAttribute('aria-labelledby', id);
  if (o.alert) d.setAttribute('role', 'alertdialog');
  d.innerHTML = `<form method="dialog" class="dlg-form" novalidate><header class="dlg-h"><h2 id="${id}" tabindex="-1">${o.title}</h2><button type="button" class="btn icon" data-close aria-label="Close">${icon('x')}</button></header><div class="dlg-b">${o.body || ''}</div>${o.foot ? `<footer class="dlg-f">${o.foot}</footer>` : ''}</form>`;
  const ret = document.activeElement;
  closePop();
  document.body.append(d);
  d.showModal();
  d.addEventListener('click', e => { if (e.target.closest('[data-close]') || e.target === d) d.close(); });
  d.querySelector('form').addEventListener('submit', e => { e.preventDefault(); if (!o.onSubmit || o.onSubmit(d, e.submitter) !== false) d.close('ok'); });
  d.addEventListener('close', () => { d.remove(); if (o.onClose) o.onClose(d.returnValue); if (!o.noReturn && ret && ret.isConnected && ret.focus) ret.focus({ preventScroll: true }); });
  const f = !o.focusTitle && d.querySelector('.dlg-b input:not([type=checkbox]):not([type=radio]), .dlg-b select, .dlg-b textarea');
  (f || d.querySelector('h2')).focus();
  if (f && o.selectText) f.select();
  if (o.onOpen) o.onOpen(d);
  return d;
}
function confirmDialog(title, body, okLabel, onOk, extra) {
  return dialog({ title, alert: true, focusTitle: true, body: `<p>${body}</p>${extra || ''}`,
    foot: `<button type="button" class="btn outline" data-close>Cancel</button><button type="submit" class="btn primary danger">${esc(okLabel)}</button>`,
    onSubmit: d => onOk(d) });
}

// ---------------------------------------------------------------- render: shell
function renderAll() {
  ['library', 'collections', 'favorites', 'folder'].forEach(v => root.classList.toggle('view-' + v, st.view === v));
  if (!chipTypes().some(t => t[0] === st.chip)) st.chip = 'all';
  renderNav(); renderLeft(); renderChips(); renderFolderHead(); renderToolbar(); renderResult(); renderBanner(); renderBody(); renderStatus(); renderSel(); updateTitle();
}
function renderNav() {
  const dest = st.view === 'library' ? 'library' : 'collections';
  $$('[data-nav]').forEach(a => { if (a.dataset.nav === dest) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
}
function typeRadios(vertical) {
  return chipTypes().map(([id, label, ic]) => {
    const on = st.chip === id && st.view !== 'collections';
    const glyph = vertical ? icon(ic) : on ? icon('check') : id === 'other' ? icon('circle-help') : '';
    return `<button role="radio" aria-checked="${on}" tabindex="${on || (st.view === 'collections' && id === 'all') ? 0 : -1}" class="${vertical ? 'lp-row lp-type' : 'chip'}" data-chip="${id}">${glyph}<span>${label}</span></button>`;
  }).join('');
}
function renderChips() { $('#chips').innerHTML = st.layout === 'three' ? '' : typeRadios(false); }
function renderLeft() {
  const el = $('#leftpane');
  if (st.layout !== 'three') { el.innerHTML = ''; return; }
  const favN = libCards().filter(c => st.favs.has(c.id)).length;
  const cur = (v, id) => st.view === v && (!id || st.folderId === id) ? ' aria-current="page"' : '';
  el.innerHTML = `<nav class="lp-nav" aria-label="Main">
    <a class="lp-h" href="#/"${cur('library')}>Library</a>
    <div class="lp-types" role="radiogroup" aria-label="Asset type">${typeRadios(true)}</div>
    <a class="lp-h" href="#/collections"${cur('collections')}>Collections</a>
    <ul class="lp-coll">
      <li><a class="lp-row" href="#/favorites"${cur('favorites')}>${icon('heart')}<span>Favorites</span><span class="px">${favN}</span></a></li>
      ${sortedFolders().map(f => `<li><a class="lp-row" href="#/folder/${f.id}"${cur('folder', f.id)}>${icon('folder')}<span>${esc(f.name)}</span><span class="px">${folderCards(f).length}</span></a></li>`).join('')}
      <li><button class="lp-row" data-act="new-folder">${icon('folder-plus')}<span>New folder</span></button></li>
    </ul></nav>
    <div class="lp-foot">
      <button class="lp-row" data-act="sync-pop">${icon('refresh-cw')}<span>${st.syncing ? 'Syncing…' : 'Synced ' + ago(st.lastSync)}</span></button>
      <button class="lp-row" data-act="settings">${icon('settings')}<span>Settings</span></button>
      <p class="lp-disc">Unofficial · not affiliated with PixelLab</p>
    </div>`;
}
function renderFolderHead() {
  const el = $('#folder-head'), f = st.view === 'folder' && folderById(st.folderId), u = unavailIds();
  el.hidden = !(f || st.view === 'favorites');
  if (el.hidden) { el.innerHTML = ''; return; }
  const msg = u.length === 1 ? `1 item in ${f ? 'this folder' : 'Favorites'} isn't in your PixelLab library anymore.` : `${u.length} items in ${f ? 'this folder' : 'Favorites'} aren't in your PixelLab library anymore.`;
  el.innerHTML = `<div class="fh-row"><a class="btn crumb" href="#/collections">${icon('chevron-left')}<span>Collections</span></a><span class="spacer"></span>${f ? `<button class="btn outline" data-act="export-folder">${icon('download')}<span>Export</span></button><button class="btn icon" data-act="folder-menu" aria-label="Folder actions" aria-haspopup="menu">${icon('ellipsis')}</button>` : ''}</div>` +
    (u.length ? `<p class="unavail">${icon('triangle-alert')}<span>${msg}</span> <button class="link" data-act="remove-unavail">Remove them</button></p>` : '');
}
function renderToolbar() {
  const n = viewCards().length, coll = st.view === 'collections';
  $('#h1').textContent = viewName();
  $('#tb-sub').textContent = !coll && st.chip !== 'all' ? (TYPES.find(t => t[0] === st.chip) || [])[1] : '';
  $('#tb-count').textContent = coll || st.chip === 'other' ? '' : fmtN(n);
  $('#sort-label').textContent = SORTS[effSort()];
  $('#size-letter').textContent = st.size;
  $('#tb-sel').textContent = st.selMode ? plural(st.sel.size, 'selected', 'selected') : '';
  $$('[data-act=animate]').forEach(b => b.setAttribute('aria-pressed', st.animate));
  $$('[data-act=select]').forEach(b => { const t = b.lastElementChild || b; t.textContent = st.selMode ? 'Done' : 'Select'; b.setAttribute('aria-pressed', st.selMode); });
  $$('#sheetinfo [role=radio]').forEach(b => { const on = (b.dataset.info === '1') === st.info; b.setAttribute('aria-checked', on); b.tabIndex = on ? 0 : -1; });
  root.classList.toggle('info-on', st.info);
  $('#q').placeholder = 'Search ' + plural(libCards().length, 'asset');
}
function resultHTML() {
  const n = viewCards().length, total = libCards().length;
  let status = st.syncing ? `Syncing… <span class="px">${fmtN(st.arrived.size)}</span> of ~<span class="px">${fmtN(st.syncTotal)}</span>` : st.layout === 'phone' ? 'Synced' : 'Synced ' + ago(st.lastSync);
  if (st.demo.ratelimit) status = 'PixelLab asked us to slow down. Continuing shortly…';
  if (st.demo.offline) status = 'Offline · saved library';
  const shown = st.view === 'collections' ? total : n;
  return `<span class="r-count"><span class="px">${fmtN(shown)}</span> ${shown === 1 ? 'asset' : 'assets'}</span><span class="dot" aria-hidden="true">·</span>` +
    `<button class="link r-status" data-act="sync-pop" aria-haspopup="dialog">${status}</button>` +
    (st.failed.size ? `<button class="tag warn" data-act="sync-pop">${icon('triangle-alert')}Some assets didn't load</button>` : '') +
    (inProgress.length && !st.demo.empty ? `<button class="tag" data-act="ip-pop" aria-haspopup="dialog">${icon('loader-circle')}<span class="px">${inProgress.length}</span> in PixelLab</button>` : '') +
    (st.syncing ? `<span class="syncbar" aria-hidden="true"><i style="width:${Math.round(st.arrived.size / st.syncTotal * 100)}%"></i></span>` : '');
}
function renderResult() { const h = resultHTML(); $$('[data-slot=result]').forEach(el => { el.innerHTML = h; }); }
function renderBanner() {
  const b = $('#banner'), on = st.demo.offline && !st.demo.offlineEmpty;
  b.hidden = !on;
  b.innerHTML = on ? `${icon('triangle-alert')}<span>You're offline. Showing your saved library.</span>` : '';
}
function renderStatus() {
  if (!panes()) return;
  const c = st.hover || st.cur, list = viewCards(), i = st.cur ? list.indexOf(st.cur) : -1;
  $('#sb-text').textContent = c ? describe(c) : '';
  $('#sb-pos').textContent = i >= 0 ? (i + 1) + '/' + list.length : '';
}

// ---------------------------------------------------------------- render: sheet body
function stateCard(ic, title, body, actions, extra) {
  return `<div class="state-card">${ic === 'mark' ? markSvg(4) : icon(ic, 'big')}<h2>${title}</h2>${body ? `<p>${body}</p>` : ''}${extra || ''}${actions ? `<div class="sc-actions">${actions}</div>` : ''}</div>`;
}
const actBtn = (act, label, ic) => `<button class="btn outline" data-act="${act}">${ic ? icon(ic) : ''}<span>${label}</span></button>`;
function bodyHTML() {
  const d = st.demo, compactResult = st.layout === 'compact' && st.view !== 'collections' ? `<div class="result result-top" data-slot="result">${resultHTML()}</div>` : '';
  if (st.view === 'collections') return collectionsHTML();
  if (d.cors) return stateCard('triangle-alert', 'PixelLab is blocking this browser.', 'PixelLab may have changed how its API works with websites. Nothing is wrong with your account.', actBtn('demo-clear', 'Try again', 'refresh-cw'));
  if (d.offlineEmpty) return stateCard('triangle-alert', "You're offline.", 'Connect to the internet to load your PixelLab library.', actBtn('demo-clear', 'Try again', 'refresh-cw'));
  if (st.chip === 'other') return compactResult + stateCard('circle-help', 'Other PixelLab content.', "Fonts, effects, portraits and talking animations aren't available through PixelLab's public API yet, so Vitrine can't show them. Find them in PixelLab:", '',
    `<ul class="links">${[['Fonts', '/create?tool=generate_font'], ['Effects', '/create-vfx'], ['Portraits', '/create?tool=portrait_character'], ['Talking animations', '/create?tool=vocal_animation']].map(([l, p]) => `<li>${ext(PL + p, l)}</li>`).join('')}</ul>`);
  if (st.chip === 'images' && d.gated) return compactResult + stateCard('image', "Creator images aren't available yet.", 'The only public way to read them might also save data to your account. Vitrine stays strictly view-only, so it leaves them out for now.', '', `<p>${ext(PL + '/create', 'Open your Creator gallery in PixelLab')}</p>`);
  if (st.view === 'library' && !libCards().length && !st.syncing) return stateCard('mark', 'Nothing here yet.', "Create something in PixelLab and it'll show up here.", ext(PL, 'Open PixelLab') + actBtn('sync-now', 'Sync again', 'refresh-cw'));
  const list = viewCards();
  if (!list.length && !st.syncing) {
    if (st.view === 'folder' && !baseCards().length) return stateCard('folder', 'This folder is empty.', 'Select assets in your library, then choose Add to folder.', `<a class="btn outline" href="#/">${icon('layout-grid')}<span>Go to Library</span></a>`);
    if (st.view === 'favorites' && !baseCards().length) return stateCard('heart', 'No favorites yet.', 'Use the heart on any asset to keep it here.');
    const where = st.chip !== 'all' ? ' in ' + (TYPES.find(t => t[0] === st.chip) || [])[1] : '';
    const notes = [(st.chip === 'all' || st.chip === 'images') && !d.gated ? "Image descriptions from PixelLab are shortened, so some words can't be found." : '',
      /font|effect|vfx|portrait|talking/.test(norm(st.q)) ? 'Looking for fonts or effects? See Other.' : ''].filter(Boolean);
    return compactResult + stateCard('search', `No matches for "${esc(st.q)}"${esc(where)}.`, 'Try fewer words, or search all types.',
      actBtn('clear-search', 'Clear search', 'x') + (st.chip !== 'all' ? actBtn('search-all', 'Search all types', 'search') : ''), notes.map(n => `<p class="muted small">${n}</p>`).join(''));
  }
  const skel = st.syncing ? Math.min(24, Math.max(0, st.syncTotal - st.arrived.size)) : 0;
  return compactResult + `<ul class="grid size-${st.size}" id="grid" role="list" aria-label="${esc(viewName())}">${list.map(cellHTML).join('')}${'<li class="cell skel" aria-hidden="true"></li>'.repeat(skel)}</ul>` +
    (st.syncing ? (list.length ? '' : '<p class="eol">Still syncing, more may appear.</p>') : `<p class="eol">That's everything · <span class="px">${fmtN(list.length)}</span> ${list.length === 1 ? 'asset' : 'assets'}</p>`);
}
const mapReady = new Set();
function cellHTML(c) {
  const fav = st.favs.has(c.id), sel = st.sel.has(c.key), showB = st.size !== 'S', full = st.size === 'L' || st.size === 'XL';
  let b = showB ? badge(c, full) : '';
  if (showB && c.animated) b = '▶' + (b ? ' ' + b : '');
  const glyph = showB && st.chip === 'all' ? icon(typeIcon(c.cat)) : '';
  const bottom = c.cat === 'characters' || c.cat === 'objects';
  const art = c.cat === 'maps' && !mapReady.has(c.key) ? `<span class="ph">${esc(c.title)}</span>` : `<img alt="" draggable="false" src="${esc(c.a.thumb)}">`;
  return `<li class="cell${st.cur === c ? ' cur' : ''}${sel ? ' sel' : ''}${bottom ? ' bottom' : ''}${b ? ' has-btext' : ''}" data-key="${c.key}">` +
    `<a class="card" href="${buildHash(c.key)}" aria-label="${esc(cardLabel(c))}" title="${esc(c.title)}" draggable="false">${art}</a>` +
    ((b || glyph) ? `<span class="badge px" aria-hidden="true">${glyph}${b ? `<span class="bt">${esc(b)}</span>` : ''}</span>` : '') +
    `<span class="fitm px" aria-hidden="true">FIT</span>` +
    (fav ? `<span class="favm" aria-hidden="true">${icon('heart', 'fill')}</span>` : '') +
    `<button class="cb" tabindex="-1" aria-label="Select ${esc(c.title)}" aria-pressed="${sel}">${icon('check')}</button>` +
    `<button class="hb" tabindex="-1" aria-label="${fav ? 'Unfavorite' : 'Favorite'} ${esc(c.title)}" aria-pressed="${fav}">${icon('heart', fav ? 'fill' : '')}</button>` +
    `<button class="mb" tabindex="-1" aria-label="More actions for ${esc(c.title)}" aria-haspopup="menu">${icon('ellipsis')}</button></li>`;
}
function collectionsHTML() {
  const lib = libCards(), favs = lib.filter(c => st.favs.has(c.id)), fs = sortedFolders();
  const cover = c => c ? `<img alt="" draggable="false" src="${esc(c.a.thumb)}">` : icon('folder');
  const row = (href, c, name, n, extra, ic) => `<li class="crow"><a class="crow-link" href="${href}"><span class="cover">${c === undefined ? icon(ic) : cover(c)}</span><span class="crow-name">${esc(name)}</span><span class="px crow-n">${n}</span></a>${extra || ''}</li>`;
  const tip = !st.tipDismissed && !st.protect && (fs.length || st.favs.size >= 5)
    ? `<div class="tip" role="note">${icon('info')}<p>Your folders and favorites live only in this browser, and browsers sometimes clear site data. Export a backup to keep them safe.</p><div class="sc-actions"><button class="btn outline" data-act="backup">Export backup</button><button class="btn outline" data-act="protect">Protect</button><button class="btn ghost" data-act="tip-dismiss">Not now</button></div></div>` : '';
  return `<div class="coll">${tip}
    <ul class="clist">${row('#/favorites', favs[favs.length - 1] || null, 'Favorites', favs.length, '', 'heart')}</ul>
    <div class="coll-h"><h2>Folders</h2><button class="btn outline" data-act="new-folder">${icon('folder-plus')}<span>New folder</span></button></div>
    ${fs.length ? `<ul class="clist">${fs.map(f => { const fc = folderCards(f); return row('#/folder/' + f.id, fc[fc.length - 1] || null, f.name, fc.length, `<button class="btn icon" data-fmenu="${f.id}" aria-label="Actions for ${esc(f.name)}" aria-haspopup="menu">${icon('ellipsis')}</button>`); }).join('')}</ul>`
      : `<p class="muted">Group assets by game or project. Folders live in this browser only.</p>`}
    <p class="coll-foot" data-hide="three two stack">Unofficial. Not affiliated with or endorsed by PixelLab.</p></div>`;
}
function scrollSheetTop() { if (mobile()) window.scrollTo(0, 0); else $('#sheet-body').scrollTop = 0; }
function firstVisibleCell() {
  const top = mobile() ? 0 : $('#sheet-body').getBoundingClientRect().top;
  const li = $$('#grid .cell:not(.skel)').find(el => el.getBoundingClientRect().bottom > top);
  return li && { key: li.dataset.key, top: li.getBoundingClientRect().top };
}
function renderBody() {
  const body = $('#sheet-body'), ae = document.activeElement;
  const focusKey = ae && ae.closest && ae.closest('#grid .cell') ? ae.closest('.cell').dataset.key : null;
  const anchor = st.syncing && (mobile() ? scrollY : body.scrollTop) > 0 ? firstVisibleCell() : null;
  stopAllPreviews();
  body.innerHTML = bodyHTML();
  layoutGrid(true);
  fitIn(body);
  $$('#grid .cell .ph').forEach(ph => {               // map thumbnails render lazily (title first, then image; R-6)
    const li = ph.closest('.cell');
    setTimeout(() => { mapReady.add(li.dataset.key); if (li.isConnected) { ph.outerHTML = `<img alt="" draggable="false" src="${esc(byKey[li.dataset.key].a.thumb)}">`; fitIn(li); } }, 1200);
  });
  if (anchor) {
    const li = cellEl(anchor.key);
    if (li) { const dy = li.getBoundingClientRect().top - anchor.top; if (mobile()) window.scrollBy(0, dy); else body.scrollTop += dy; }
  }
  if (focusKey && cellEl(focusKey)) cellEl(focusKey).querySelector('.card').focus({ preventScroll: true });
  syncPreviews();
}
const cellEl = key => $('#grid .cell[data-key="' + key + '"]');
const gridCells = () => $$('#grid .cell:not(.skel)');
function layoutGrid(force) {
  const g = $('#grid');
  if (!g) return;
  const gap = mobile() ? 3 : 4, min = CELL_MIN[mobile() ? 'mobile' : 'other'][st.size], W = g.clientWidth;
  if (!W) return;
  const cols = Math.min(16, Math.max(1, Math.floor((W + gap) / (min + gap))));
  const box = (W - (cols - 1) * gap) / cols - 12;     // art inset 6 per side
  g.style.setProperty('--cols', cols);
  st.cols = cols;
  if (force || Math.abs(box - st.box) > 0.01) { st.box = box; fitIn(g); }
}
// Fit every <img> under scope into its integer-scaled box (02 §4.3). Box comes from the image's slot.
function boxFor(im) {
  if (im.closest('.cell')) return [st.box, st.box];
  const holder = im.parentElement, cs = getComputedStyle(holder);
  return [holder.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight), holder.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)];
}
function fitImg(im) {
  const [bw, bh] = boxFor(im);
  if (!(bw > 0 && bh > 0)) return;                       // hidden slot: refit when it gets a size
  const r = integerScale(im.naturalWidth, im.naturalHeight, bw, bh);
  if (!r) return;
  im.style.width = r.cssW + 'px'; im.style.height = r.cssH + 'px';
  im.classList.toggle('smooth', r.smooth);
  const cell = im.closest('.cell'); if (cell) cell.classList.toggle('fit', r.smooth);
}
function fitIn(scope) { $$('img', scope).forEach(im => { im.onload = () => fitImg(im); if (im.complete && im.naturalWidth) fitImg(im); }); }
function refreshCell(key) {
  const li = cellEl(key); if (!li) return;
  const c = byKey[key], fav = st.favs.has(c.id), sel = st.sel.has(key);
  li.classList.toggle('sel', sel); li.classList.toggle('cur', st.cur === c);
  li.querySelector('.card').setAttribute('aria-label', cardLabel(c));
  li.querySelector('.cb').setAttribute('aria-pressed', sel);
  const hb = li.querySelector('.hb');
  hb.setAttribute('aria-pressed', fav); hb.setAttribute('aria-label', (fav ? 'Unfavorite ' : 'Favorite ') + c.title); hb.innerHTML = icon('heart', fav ? 'fill' : '');
  const fm = li.querySelector('.favm');
  if (fav && !fm) li.insertAdjacentHTML('beforeend', `<span class="favm" aria-hidden="true">${icon('heart', 'fill')}</span>`); else if (!fav && fm) fm.remove();
}
function focusCell(li, makeCurrent) {
  li.querySelector('.card').focus({ preventScroll: true });
  li.scrollIntoView({ block: 'nearest' });
  if (makeCurrent) setCurrent(byKey[li.dataset.key], { noHash: mobile() });
}

// ---------------------------------------------------------------- card previews (hover/focus dwell, Animate toggle)
const previews = new Map();
function previewFrames(c) {
  const an = (c.a.animations || [])[defaultAnim(c.a.animations || [])];
  if (an) return an.frames.south || an.frames.unknown || Object.values(an.frames)[0];
  return c.a.frames && c.a.frames.length > 1 ? c.a.frames : null;
}
function startPreview(key) {
  if (previews.has(key)) return;
  const c = byKey[key], fr = previewFrames(c), li = cellEl(key), im = li && li.querySelector('img');
  if (!fr || !im) return;
  fr.forEach(img);  // preload
  const p = PixelTicker.player(fr.map(() => 125), i => { im.src = fr[i]; });   // 8 fps (R-1)
  p.play(); previews.set(key, p);
}
function stopPreview(key) {
  const p = previews.get(key); if (!p) return;
  p.stop(); previews.delete(key);
  const li = cellEl(key), im = li && li.querySelector('img');
  if (im) im.src = byKey[key].a.thumb;
}
function stopAllPreviews() { Array.from(previews.keys()).forEach(stopPreview); }
function syncPreviews() {
  stopAllPreviews();
  if (!st.animate) return;
  // ponytail: the sample has 4 animated cards, so the 24/8 in-view cap (02 §4.8) never binds; add IntersectionObserver when it can.
  gridCells().filter(li => byKey[li.dataset.key].animated).slice(0, coarse() ? 8 : 24).forEach(li => startPreview(li.dataset.key));
}
let dwellT = null;
function dwell(li, on) {
  clearTimeout(dwellT);
  if (on) dwellT = setTimeout(() => startPreview(li.dataset.key), 300);
  else if (!st.animate) stopPreview(li.dataset.key);
}

// ---------------------------------------------------------------- selection
function enterSel() { if (st.selMode) return; st.selMode = true; renderSel(); announce('Selection mode. ' + st.sel.size + ' selected.'); }
function exitSel() {
  if (!st.selMode) return;
  const keys = Array.from(st.sel); st.sel.clear(); st.selMode = false; st.anchor = null;
  keys.forEach(refreshCell); renderSel(); announce('Selection cleared');
  if (st.cur && cellEl(st.cur.key) && !$('#stage').contains(document.activeElement)) cellEl(st.cur.key).querySelector('.card').focus({ preventScroll: true });
}
function toggleSel(key, force) {
  const on = force == null ? !st.sel.has(key) : force;
  if (on) st.sel.add(key); else st.sel.delete(key);
  st.anchor = key;
  if (!st.selMode && on) st.selMode = true;
  refreshCell(key);
  if (on && !mobile() && st.sel.size === 1) setCurrent(byKey[key]);
  if (!st.sel.size) { exitSel(); return; }
  renderSel(); announce(plural(st.sel.size, 'selected', 'selected'));
}
function rangeSel(key) {
  const list = viewCards().map(c => c.key), a = list.indexOf(st.anchor), b = list.indexOf(key);
  if (a < 0 || b < 0) return toggleSel(key, true);
  list.slice(Math.min(a, b), Math.max(a, b) + 1).forEach(k => { st.sel.add(k); refreshCell(k); });
  st.selMode = true; renderSel(); announce(plural(st.sel.size, 'selected', 'selected'));
}
function selectAll() { viewCards().forEach(c => st.sel.add(c.key)); st.selMode = true; gridCells().forEach(li => refreshCell(li.dataset.key)); renderSel(); announce('Selected all ' + plural(st.sel.size, 'asset')); }
const selCards = () => Array.from(st.sel).map(k => byKey[k]).filter(Boolean);
function renderSel() {
  root.classList.toggle('selecting', st.selMode);
  renderToolbar();
  const n = st.sel.size, sum = !mobile() && n >= 2;
  $('#summary').hidden = !sum; $('#stage-view').hidden = sum;
  if (sum) { stopPlayer(); renderSummary(); } else if (S.playing && st.cur && stageVisible()) startPlayer();
  const bar = $('#selbar'), show = mobile() && st.selMode;
  bar.hidden = !show;
  if (!show) return;
  const hid = hiddenCount(), allFav = n > 0 && selCards().every(c => st.favs.has(c.id)), dis = n ? '' : ' disabled';
  bar.innerHTML = `<button class="btn icon" data-act="sel-clear" aria-label="Clear selection">${icon('x')}</button>` +
    `<span class="selcount"><span><span class="px">${n}</span> selected</span>${hid ? `<small>${hid} hidden by filter</small>` : ''}</span>` +
    `<button class="btn" data-act="sel-all">Select all</button>` +
    `<button class="btn icon" data-act="sel-fav" aria-pressed="${allFav}" aria-label="${allFav ? 'Unfavorite' : 'Favorite'}"${dis}>${icon('heart', allFav ? 'fill' : '')}</button>` +
    `<button class="btn icon" data-act="sel-folder" aria-label="Add to folder"${dis}>${icon('folder-plus')}</button>` +
    (st.view === 'folder' ? `<button class="btn icon" data-act="sel-remove" aria-label="Remove from folder"${dis}>${icon('trash-2')}</button>` : '') +
    `<button class="btn primary" data-act="sel-download" aria-label="Download"${dis}>${icon('download')}<span class="dl-l">Download</span></button>`;
}
function renderSummary() {
  const sel = selCards(), n = sel.length, hid = hiddenCount(), by = {}, allFav = sel.every(c => st.favs.has(c.id)), est = estimate(sel, { game: true, states: 'all' });
  sel.forEach(c => { by[c.cat] = (by[c.cat] || 0) + 1; });
  const shown = n > 16 ? sel.slice(0, 15) : sel;
  $('#summary').innerHTML = `<header class="sum-head"><h2 id="sum-title" tabindex="-1"><span class="px2">${n}</span> selected</h2>${hid ? `<span class="muted">· ${hid} hidden by filter</span>` : ''}<span class="spacer"></span><button class="btn icon" data-act="sel-clear" aria-label="Clear selection">${icon('x')}</button></header>
    <div class="mosaic">${shown.map(c => `<span class="mz" title="${esc(c.title)}"><img alt="" draggable="false" src="${esc(c.a.thumb)}"></span>`).join('')}${n > 16 ? `<span class="mz more px">+${n - 15}</span>` : ''}</div>
    <dl class="sum-rows">${TYPES.filter(t => by[t[0]]).map(t => `<div><dt>${t[1]}</dt><dd class="px">${by[t[0]]}</dd></div>`).join('')}<div><dt>Files</dt><dd class="px">${fmtN(est.files)}</dd></div><div><dt>Size</dt><dd>~${est.mb} MB</dd></div></dl>
    <div class="sum-actions">
      <button class="btn primary block" data-act="sel-download">${icon('download')}<span>Download…</span></button>
      <button class="btn outline block" data-act="sel-folder">${icon('folder-plus')}<span>Add to folder…</span></button>
      <button class="btn outline block" data-act="sel-fav" aria-pressed="${allFav}">${icon('heart', allFav ? 'fill' : '')}<span>${allFav ? 'Unfavorite' : 'Favorite'}</span></button>
      ${st.view === 'folder' ? `<button class="btn outline block" data-act="sel-remove">${icon('trash-2')}<span>Remove from folder</span></button>` : ''}
      <button class="btn outline block" data-act="sel-all">${icon('square-check')}<span>Select all in view</span></button>
      <button class="btn ghost block" data-act="sel-clear"><span>Clear selection</span><kbd class="keycap">Esc</kbd></button>
    </div>`;
  fitIn($('#summary'));
}

// ---------------------------------------------------------------- stage: model
const curAsset = () => st.cur.members[S.state] || st.cur.a;
const curAnims = () => curAsset().animations || [];
const curAnim = () => S.anim >= 0 ? curAnims()[S.anim] : null;
const allDirs = () => Object.keys(curAsset().directions || {});
const availDirs = () => { const an = curAnim(); return Object.keys(an ? an.frames : curAsset().directions || {}); };
const fpsKey = () => { const an = curAnim(); return an ? an.id : curAsset().id; };
const effFps = () => S.fps[fpsKey()] || 8;
function defaultAnim(anims) {
  const i = anims.findIndex(a => /idle|breath/i.test(a.name));
  return i >= 0 ? i : anims.length ? 0 : -1;
}
function pickDir(want) {
  const av = availDirs();
  if (!av.length) return 'south';
  if (want && av.includes(want)) return want;
  if (av.includes('south')) return 'south';
  if (av.includes(S.dir)) return S.dir;
  if (S.dir && CW.includes(S.dir)) {                    // nearest available around the compass
    const i = CW.indexOf(S.dir);
    for (let k = 1; k < 5; k++) for (const j of [i + k, i - k]) { const d = CW[(j + 8) % 8]; if (av.includes(d)) return d; }
  }
  return av[0];
}
function framePaths() {
  const a = curAsset(), an = curAnim();
  if (an) return an.frames[S.dir] || [];
  if (a.directions && Object.keys(a.directions).length) return [a.directions[S.dir] || a.thumb];
  if (a.frames) return a.frames;
  return [a.sheet || a.thumb];
}
const imgCache = {};
const img = p => imgCache[p] || (imgCache[p] = Object.assign(new Image(), { src: p }));

function setCurrent(c, o) {
  o = o || {};
  const prev = st.cur;
  st.cur = c || null;
  if (prev && prev !== c) refreshCell(prev.key);
  if (!c) { renderStage(); renderStatus(); return; }
  if (prev !== c || o.route) {
    const r = o.route || {};
    S.state = clamp(parseInt(r.state, 10) || 0, 0, c.members.length - 1);
    const anims = curAnims(), ra = parseInt(r.anim, 10);
    S.anim = r.anim != null && !isNaN(ra) ? clamp(ra - 1, -1, anims.length - 1) : defaultAnim(anims);
    S.dir = 'south'; S.dir = pickDir(r.dir);
    S.frame = 0; S.zoom = 'fit'; S.grid = false;
    S.playing = !reduced();                              // autoplay; opens paused under reduced motion (R-3)
  }
  refreshCell(c.key);
  renderStage(); renderStatus();
  if (!o.noHash) syncHash();
}
function navAsset(d) {
  const list = viewCards(); if (!list.length) return;
  const i = list.indexOf(st.cur), j = i < 0 ? 0 : i + d;
  if (j < 0 || j >= list.length) return;
  setCurrent(list[j]);
  const li = cellEl(list[j].key); if (li && !mobile()) li.scrollIntoView({ block: 'nearest' });
}
function setDir(d) { S.dir = pickDir(d); loadFrames(); renderCompass(); updateStageLabel(); renderInspectorSoft(); syncHash(); }
function rotateDir(step) {
  const av = CW.filter(d => availDirs().includes(d)); if (av.length < 2) return;
  setDir(av[(av.indexOf(S.dir) + step + av.length) % av.length]);
}
function setAnim(i) {
  S.anim = i; S.frame = 0; S.dir = pickDir(S.dir);
  renderStage(); syncHash();
}
function setStateIdx(i) {
  const type = curAnim() && curAnim().type;
  S.state = i;
  const j = type ? curAnims().findIndex(a => a.type === type) : -1;
  S.anim = j; S.dir = pickDir(S.dir); S.frame = 0;
  renderStage(); syncHash();
}

// ---------------------------------------------------------------- stage: render
const canvas = () => $('#stage-canvas');
function renderStage() {
  const pane = $('#stage'), c = st.cur;
  pane.classList.toggle('empty', !c);
  if (!c) {
    stopPlayer(); $('#stage-title .t').textContent = 'Nothing selected'; $('#stage-title .st').textContent = '';
    ['has-transport', 'has-film', 'has-compass', 'has-anims', 'has-states', 'has-grid'].forEach(k => pane.classList.remove(k));
    $('#inspector').innerHTML = `<p class="muted pad">Select an asset to see it here.</p>`;
    const cv = canvas(); cv.width = 1; cv.height = 1; return;
  }
  const a = curAsset(), m = a.meta || {}, anims = curAnims(), list = viewCards(), i = list.indexOf(c);
  $('#stage-title .t').textContent = c.a.name;
  $('#stage-title .st').textContent = c.cat === 'characters' ? (m.state_name ? cap(m.state_name) : 'Base') : m.state_name ? cap(m.state_name) : '';
  $$('[data-act=prev]').forEach(b => { b.disabled = i <= 0; });
  $$('[data-act=next]').forEach(b => { b.disabled = i < 0 || i >= list.length - 1; });
  const tiles = a.type === 'tileset_topdown' || a.type === 'tileset_sidescroller' || a.type === 'tiles_pro';
  pane.classList.toggle('has-compass', allDirs().length > 1);
  pane.classList.toggle('has-anims', anims.length > 0);
  pane.classList.toggle('has-states', c.members.length > 1);
  pane.classList.toggle('has-grid', tiles);
  $('#anim-seg').innerHTML = anims.length ? seg(['Rotations'].concat(anims.map(x => `${x.name} · ${x.frameCount}f`)), S.anim + 1, 'anim') : '';
  $('#state-seg').innerHTML = c.members.length > 1 ? seg(c.members.map(x => x.meta.state_name ? cap(x.meta.state_name) : 'Base'), S.state, 'state') : '';
  $('#grid-btn').setAttribute('aria-pressed', S.grid);
  $('#tile-info').textContent = tiles ? (S.grid ? 'Point at a tile for its info' : '') : '';
  $('#loop-btn').setAttribute('aria-pressed', S.loop);
  renderCompass();
  loadFrames();
  renderInspector();
  updateStageLabel();
}
const seg = (labels, checked, attr) => labels.map((t, i) => `<button role="radio" aria-checked="${i === checked}" tabindex="${i === checked ? 0 : -1}" data-${attr}="${i}">${esc(t)}</button>`).join('');
function renderSwatches() {
  const cur = $('#stage').dataset.bd;
  $('#swatches').innerHTML = BACKDROPS.map(([id, label]) => `<button role="radio" class="sw sw-${id}" data-bd="${id}" aria-checked="${id === cur}" tabindex="${id === cur ? 0 : -1}" aria-label="${label}" title="${label}"></button>`).join('');
}
function setBackdrop(id) { $('#stage').dataset.bd = id; renderSwatches(); }
function renderCompass() {
  const el = $('#compass'), show = st.cur && allDirs().length > 1, av = show ? availDirs() : [];
  $('#dir-btn').innerHTML = show ? `${icon('arrow-up', '', DEG[S.dir])}<span>${DSHORT[S.dir]}</span>${icon('chevron-down')}` : '';
  $('#dir-btn').setAttribute('aria-label', show ? 'Direction: ' + dname(S.dir) : 'Direction');
  if (!show) { el.innerHTML = ''; el.classList.remove('open'); return; }
  el.innerHTML = COMPASS.flat().map(d => d
    ? `<button role="radio" data-dir="${d}" aria-checked="${d === S.dir}" tabindex="${d === S.dir ? 0 : -1}" aria-label="${dname(d)}"${av.includes(d) ? '' : ' disabled'}>${icon('arrow-up', '', DEG[d])}</button>`
    : `<span class="c-center" aria-hidden="true">${DSHORT[S.dir]}</span>`).join('');
}
function loadFrames() {
  const paths = framePaths(), tok = ++S.token;
  stopPlayer();
  S.frames = paths; S.loaded = 0;
  S.imgs = paths.map(p => {
    const im = img(p);
    if (im.complete && im.naturalWidth) S.loaded++;
    else im.addEventListener('load', () => { if (tok !== S.token) return; S.loaded++; renderTransport(); if (S.loaded === S.frames.length) framesReady(); }, { once: true });
    return im;
  });
  S.frame = Math.min(S.frame, Math.max(0, paths.length - 1));
  $('#stage').classList.toggle('has-transport', paths.length > 1);
  renderTransport(); renderFilmstrip(); renderTileGrid();
  if (S.loaded === paths.length) framesReady();
}
function framesReady() {
  const im = S.imgs[0], cv = canvas(); if (!im || !im.naturalWidth) return;
  cv.width = im.naturalWidth; cv.height = im.naturalHeight;   // backing store = frame size
  cv.getContext('2d').imageSmoothingEnabled = false;          // reset by every resize
  draw(); applyZoom();
  if (S.playing && S.frames.length > 1 && stageVisible() && $('#summary').hidden) startPlayer();
}
function draw() {
  const im = S.imgs[S.frame], cv = canvas(); if (!im || !im.naturalWidth) return;
  const ctx = cv.getContext('2d');
  ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(im, 0, 0);
  updateFrameUI();
}
function startPlayer() {
  stopPlayer();
  const n = S.frames.length;
  if (n < 2 || S.loaded < n) return;
  if (!S.loop && S.frame === n - 1) S.frame = 0;
  S.player = PixelTicker.player(Array(n).fill(1000 / effFps()), i => { S.frame = i; draw(); if (!S.loop && i === n - 1) setPlaying(false); });
  S.player.seek(S.frame);
  S.player.play();
}
function stopPlayer() { if (S.player) { S.player.stop(); S.player = null; } }
function setPlaying(on) {
  S.playing = on;
  if (on) startPlayer(); else stopPlayer();
  renderPlay(); if (!on) updateStageLabel(); pokeChrome();
}
function stepFrame(d) {
  const n = S.frames.length; if (n < 2) return;
  setPlaying(false); S.frame = (S.frame + d + n) % n; draw(); updateStageLabel();
}
function seekFrame(i) { setPlaying(false); S.frame = clamp(i, 0, S.frames.length - 1); draw(); updateStageLabel(); }
function renderPlay() {
  const b = $('#play-btn'), loading = S.loaded < S.frames.length, label = loading ? `Loading frames ${S.loaded}/${S.frames.length}` : S.playing ? 'Pause' : 'Play';
  b.innerHTML = icon(S.playing && !loading ? 'pause' : 'play'); b.setAttribute('aria-label', label);
}
function renderTransport() {
  const n = S.frames.length, sc = $('#scrub');
  sc.max = Math.max(0, n - 1);
  $('#ticks').innerHTML = n > 1 && n <= 48 ? '<i></i>'.repeat(n) : '';
  $('#fps-btn').textContent = effFps() + ' FPS';
  $('#fps-btn').setAttribute('aria-label', 'Speed: ' + effFps() + ' frames per second');
  renderPlay(); updateFrameUI();
}
function updateFrameUI() {
  const n = S.frames.length, loading = S.loaded < n, sc = $('#scrub');
  sc.value = S.frame;
  sc.setAttribute('aria-valuetext', `Frame ${S.frame + 1} of ${n}`);
  $('#readout').textContent = loading ? `Loading frames ${S.loaded}/${n}` : pad2(S.frame + 1) + '/' + pad2(n);
  $$('#ticks i').forEach((t, i) => t.classList.toggle('on', i === S.frame));
  const fs = $('#filmstrip');
  $$('.fs-cell', fs).forEach(b => {
    const on = b.dataset.frame != null ? +b.dataset.frame === S.frame : b.dataset.fdir === S.dir;
    b.classList.toggle('on', on); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
    if (on && fs.scrollWidth > fs.clientWidth) {       // keep current frame in view (behavior: auto), without scrolling ancestors
      const l = b.offsetLeft - fs.offsetLeft;
      if (l < fs.scrollLeft || l + b.offsetWidth > fs.scrollLeft + fs.clientWidth) fs.scrollLeft = l - fs.clientWidth / 2 + b.offsetWidth / 2;
    }
  });
}
function renderFilmstrip() {
  const fs = $('#filmstrip'), a = curAsset();
  const rot = S.anim < 0 && allDirs().length > 1;
  // ponytail: no virtualization; the longest sample strip is 9 frames (spec: virtualize beyond 40).
  const items = rot ? DIRS.filter(d => a.directions[d]).map(d => `<button class="fs-cell" data-fdir="${d}" aria-label="${dname(d)}"><img alt="" draggable="false" src="${esc(a.directions[d])}"></button>`)
    : S.frames.length > 1 ? S.frames.map((p, i) => `<button class="fs-cell" data-frame="${i}" aria-label="Frame ${i + 1}"><img alt="" draggable="false" src="${esc(p)}"></button>`) : [];
  fs.innerHTML = items.join('');
  $('#stage').classList.toggle('has-film', items.length > 0);
  fitIn(fs);
  updateFrameUI();
}
function updateStageLabel() {
  if (!st.cur) return;
  const an = curAnim(), n = S.frames.length;
  $('#stage-box').setAttribute('aria-label', [st.cur.a.name, an ? an.name : allDirs().length > 1 ? 'Rotations' : '', allDirs().length > 1 ? dname(S.dir) : '', n > 1 ? `frame ${S.frame + 1} of ${n}` : ''].filter(Boolean).join(', '));
}
function renderTileGrid() {
  const el = $('#tile-grid'), a = st.cur && curAsset(), on = !!(a && S.grid && a.grid && a.type !== 'map');
  el.hidden = !on;
  if (!on) { el.innerHTML = ''; return; }
  const g = a.grid;
  el.style.gridTemplateColumns = `repeat(${g.cols}, 1fr)`; el.style.gridTemplateRows = `repeat(${g.rows}, 1fr)`;
  el.innerHTML = Array.from({ length: g.cols * g.rows }, (_, i) => `<span data-t="${i}">${a.type === 'tileset_topdown' ? 'wang_' + i : 'tile_' + i}</span>`).join('');
}
function tileInfo(i) {
  const a = curAsset(), ts = a.tileSize, x = (i % a.grid.cols) * ts, y = Math.floor(i / a.grid.cols) * ts, b = k => (i >> k) & 1 ? 'upper' : 'lower';
  // ponytail: corner/rule data is faked from the index bits; real values come from the tileset metadata (H).
  if (a.type === 'tileset_topdown') return `wang_${i} · NW ${b(3)}, NE ${b(2)}, SW ${b(1)}, SE ${b(0)} · x ${x}, y ${y}`;
  if (a.type === 'tiles_pro') return `tile_${i} · rule bits ${['N', 'E', 'S', 'W'].filter((_, k) => (i >> k) & 1).join(', ') || 'none'}`;
  return `tile_${i} · x ${x}, y ${y}`;
}

// ---------------------------------------------------------------- stage: zoom + pan (02 §6.3)
function fitInfo() {
  const wrap = $('#stage-wrap'), im = S.imgs[0];
  if (!im || !im.naturalWidth) return null;
  return integerScale(im.naturalWidth, im.naturalHeight, Math.max(1, wrap.clientWidth - 32), Math.max(1, wrap.clientHeight - 32));
}
function applyZoom(anchor) {
  const wrap = $('#stage-wrap'), im = S.imgs[0], fit = fitInfo(); if (!fit) return;
  const dpr = devicePixelRatio || 1, w = im.naturalWidth, h = im.naturalHeight, cv = canvas(), art = $('#stage-art');
  let cssW, cssH, smooth = false, label;
  if (S.zoom === 'fit') { cssW = fit.cssW; cssH = fit.cssH; smooth = fit.smooth; label = 'Fit · ' + (smooth ? Math.round(fit.scale / dpr * 100) + '%' : +(fit.scale / dpr).toFixed(2) + '×'); }
  else { const k = Math.max(1, Math.round(S.zoom * dpr)); cssW = w * k / dpr; cssH = h * k / dpr; label = S.zoom + '×'; }
  const before = anchor && cv.getBoundingClientRect();
  cv.style.width = art.style.width = cssW + 'px'; cv.style.height = art.style.height = cssH + 'px';
  cv.classList.toggle('smooth', smooth);
  wrap.classList.toggle('pannable', cssW > wrap.clientWidth - 32 + 0.5 || cssH > wrap.clientHeight - 32 + 0.5);
  $('#zoom-readout').textContent = label;
  $('#tile-grid').classList.toggle('nolabel', S.grid && curAsset().grid ? cssW / curAsset().grid.cols < 44 : true);
  if (before) {                                          // zoom around the pointer
    const fx = (anchor.clientX - before.left) / before.width, fy = (anchor.clientY - before.top) / before.height, r = cv.getBoundingClientRect();
    wrap.scrollLeft += r.left + fx * r.width - anchor.clientX; wrap.scrollTop += r.top + fy * r.height - anchor.clientY;
  }
}
function zoomBy(dir, anchor) {
  const fit = fitInfo(); if (!fit) return;
  const dpr = devicePixelRatio || 1, curM = S.zoom === 'fit' ? fit.scale / dpr : S.zoom;
  let next = dir > 0 ? STEPS.find(s => s > curM + 1e-6) : STEPS.slice().reverse().find(s => s < curM - 1e-6);
  if (next === undefined) next = dir < 0 && fit.smooth ? 'fit' : S.zoom;
  S.zoom = next; applyZoom(anchor);
}
function toggleFit() { S.zoom = S.zoom === 'fit' ? 1 : 'fit'; applyZoom(); }
function dblZoom() { const fit = fitInfo(); if (!fit) return; S.zoom = S.zoom === 'fit' ? (STEPS.find(s => s > fit.scale / (devicePixelRatio || 1) + 1e-6) || 16) : 'fit'; applyZoom(); }

// ---------------------------------------------------------------- stage: inspector (02 §5)
const fmtDate = s => s ? dtFull.format(new Date(s)) : '';
const sizePx = (w, h) => `${w} × ${h} px`;
const maskId = id => id.length > 10 ? id.slice(0, 4) + '…' + id.slice(-4) : id.slice(0, 3) + '…' + id.slice(-2);
let copyMap = {};
function copyBtn(key, text) { copyMap[key] = text; return `<button class="btn mini outline copy" data-copy="${key}" aria-label="Copy ${key}">${icon('copy')}<span>Copy</span></button>`; }
function styleRows(s) { return s ? ['outline', 'shading', 'detail'].filter(k => s[k]).map(k => `<span class="sub-row"><em>${cap(k)}</em> ${esc(cap(s[k]))}</span>`).join('') : ''; }
function playbackRow() {
  const v = effFps(), user = !!S.fps[fpsKey()];
  return `${v} fps ${user ? `(your setting) · <button class="link" data-act="fps-reset">Reset</button>` : '(default)'}<span class="note">PixelLab doesn't say how fast animations play. 8 fps matches PixelLab's own players.</span>`;
}
function renderInspectorSoft() { if (st.cur) renderInspector(); }
function renderInspector() {
  const el = $('#inspector'), c = st.cur; if (!c) return;
  const a = curAsset(), m = a.meta || {}, sz = artSize(a), rows = [];
  copyMap = {};
  const add = (label, html) => { if (html != null && html !== '' && html !== false) rows.push(`<div class="f"><dt>${label}</dt><dd>${html}</dd></div>`); };
  const prompt = (label, text) => text && add(label, `<div class="well"><p>${esc(text)}</p>${copyBtn(label.toLowerCase(), text)}</div>`);
  const tags = () => (a.tags || []).length && add('Tags', `<span class="tagrow">${a.tags.map(t => `<button class="tag" data-tag="${esc(t)}">#${esc(t)}</button>`).join('')}</span>`);
  const dirList = () => { const ds = DIRS.filter(d => (a.directions || {})[d]); return ds.length > 1 ? `${ds.length} · ${ds.map(d => DSHORT[d]).join(', ')}` : '1 (single view)'; };
  const animRows = () => (a.animations || []).map((an, i) => { const nd = Object.keys(an.frames).length; return `<button class="link anim-row" data-anim-row="${i}">${esc(an.name)} · ${an.frameCount} frames · ${nd} direction${nd > 1 ? 's' : ''}</button>`; }).join('');
  switch (a.type) {
    case 'character':
      prompt('Prompt', a.prompt); add('Canvas', sizePx(sz.w, sz.h)); add('Directions', dirList()); add('View', esc(cap(m.view)));
      add('Animations', animRows()); add('Style', styleRows(m.style_settings)); add('Template', esc(cap(m.template_id))); tags();
      add('Created', fmtDate(a.createdAt)); if (a.updatedAt && a.updatedAt !== a.createdAt) add('Updated', fmtDate(a.updatedAt));
      if ((a.animations || []).length) add('Playback', playbackRow());
      add('Portrait & voice', `Not in PixelLab's public API · ${ext(PL + '/create-character', 'View in PixelLab')}`); break;
    case 'object': case 'map_object':
      prompt('Prompt', a.prompt); add('Canvas', sizePx(sz.w, sz.h)); add('Directions', dirList()); add('View', esc(cap(m.view)));
      add('Animations', animRows()); add('Style', styleRows(m.style_settings)); tags(); add('Created', fmtDate(a.createdAt));
      if ((a.animations || []).length) add('Playback', playbackRow()); break;
    case 'creator_image':
      prompt('Description', a.prompt + (/\.\.\.$/.test(a.prompt) ? ' (shortened by PixelLab)' : '')); add('Frame size', sizePx(a.width, a.height));
      if (m.frames > 1) add('Frames', m.frames); add('Created', a.createdAt ? dtDay.format(new Date(a.createdAt)) : '');
      add('Made on', /^gallery:\d{13}$/.test(m.ref) ? 'PixelLab website' : 'PixelLab API'); if (m.frames > 1) add('Playback', playbackRow()); break;
    case 'tileset_topdown':
      add('Terrains', `${esc(cap(m.lower_description))} → ${esc(m.upper_description)} ${copyBtn('terrains', [m.lower_description, m.upper_description, m.transition_description].join(', '))}`);
      add('Transition', esc(cap(m.transition_description))); add('Tile size', sizePx(a.tileSize, a.tileSize)); add('Tiles', `${m.total_tiles} · ${a.grid.cols} × ${a.grid.rows} sheet`);
      add('View', esc(cap(m.view))); add('Transition size', m.transition_size); add('Style', styleRows(m.style_settings)); add('Created', fmtDate(a.createdAt)); break;
    case 'tileset_sidescroller':
      add('Terrain', `${esc(cap(m.lower_description))} ${copyBtn('terrain', m.lower_description + '; ' + m.transition_description)}`); add('Top edge', esc(cap(m.transition_description)));
      add('Tile size', sizePx(a.tileSize, a.tileSize)); add('Tiles', m.total_tiles); add('View', 'Side (platformer)'); add('Created', fmtDate(a.createdAt)); break;
    case 'tile_isometric':
      prompt('Description', m.description || a.prompt); add('Size', m.size + ' px'); add('Shape', cap(m.tile_shape)); add('Seed', `${m.seed} ${copyBtn('seed', String(m.seed))}`); add('Created', fmtDate(a.createdAt)); break;
    case 'tiles_pro':
      prompt('Description', a.prompt); add('Kind', cap(m.kind)); add('Tile type', cap((m.tile_type || '').replace('_', ' ').replace('topdown', 'top-down'))); add('Tile size', sizePx(a.tileSize, a.tileSize));
      add('Variations', m.n_tiles); add('View', esc(cap(m.tile_view))); add('Seed', `${m.seed} ${copyBtn('seed', String(m.seed))}`); add('Created', fmtDate(a.createdAt)); break;
    case 'map':
      add('Size', `${a.grid.cols} × ${a.grid.rows} cells · ${a.width} × ${a.height} px`); add('Tile size', a.tileSize + ' px'); add('Terrains', esc((m.terrains || []).join(', ')));
      add('Painted cells', fmtN(m.painted_cells)); add('Placed objects', `<details class="mini-d"><summary>${m.placements}</summary><ul class="plain"><li>Ruined Apartment Block · cell 18, 9 · 192 × 192 · layer 1</li><li>Wooden Staircase · cell 6, 22 · 48 × 48 · layer 1</li><li>Stone Steps · cell 33, 14 · 16 × 48 · layer 1</li></ul></details>`); break;
    case 'ui_asset':
      prompt('Prompt', a.prompt); add('Size', sizePx(a.width, a.height)); add('Created', fmtDate(a.createdAt)); add('Note', "PixelLab doesn't share the individual UI pieces."); break;
  }
  const fav = st.favs.has(c.id), inF = sortedFolders().filter(f => f.ids.includes(c.id));
  const links = { characters: [['Animate in PixelLab', '/create-character'], ['New state in PixelLab', '/create-character']], objects: [['Animate in PixelLab', '/create-object'], ['New state in PixelLab', '/create-object']],
    images: [['Edit in PixelLab', '/create?tool=edit_image'], ['Animate in PixelLab', '/create?tool=animate_with_text'], ['Rotate in PixelLab', '/create?tool=generate_8_rotations_v3']] }[c.cat] || [];
  const hint = { images: 'Pro tools may need a paid plan.', tilesets: 'May need a paid PixelLab plan.', tiles: 'May need a paid PixelLab plan.', maps: 'May need a paid PixelLab plan.' }[c.cat];
  const tech = [['Asset ID', `<code>${esc(maskId(c.cat === 'images' ? m.ref : a.id))}</code> <button class="btn mini outline" data-act="copy-id">${icon('copy')}<span>Copy asset ID</span></button><span class="note warn">Anyone with this ID can download this asset without signing in. Only share it with tools you trust.</span>`],
    ['Source', a.source === 'mcp' ? 'MCP' : 'REST'], ['Status', 'Completed'], ['Last synced', ago(st.lastSync)], c.cat === 'images' ? ['Frames loaded', `${S.loaded} of ${m.frames || 1}`] : null].filter(Boolean);
  el.innerHTML = `<div class="actions">
      <div class="split"><button class="btn primary" data-act="dl-default">${icon('download')}<span>Download</span></button><button class="btn primary caret" data-act="dl-menu" aria-label="Download options" aria-haspopup="menu">${icon('chevron-down')}</button></div>
      <button class="btn icon outline" data-act="fav" aria-pressed="${fav}" aria-label="Favorite">${icon('heart', fav ? 'fill' : '')}</button>
      <button class="btn icon outline" data-act="add-folder" aria-label="Add to folder" aria-haspopup="true">${icon('folder-plus')}</button>
      <a class="btn outline" href="${openUrl(c)}" target="_blank" rel="noopener noreferrer">${icon('external-link')}<span>Open ↗</span><span class="sr-only"> in PixelLab (opens PixelLab in a new tab)</span></a>
    </div>
    ${inF.length ? `<div class="infolders"><span class="lbl-s">In folders</span>${inF.map(f => `<a class="tag" href="#/folder/${f.id}">${icon('folder')}${esc(f.name)}</a>`).join('')}</div>` : ''}
    <dl class="fields">${rows.join('')}</dl>
    <div class="pl-sec"><span class="lbl-s">PixelLab</span>${[['Open in PixelLab', openUrl(c).slice(PL.length)]].concat(links).map(([l, p]) => ext(PL + p, l)).join('')}${hint ? `<span class="note">${hint}</span>` : ''}</div>
    <details class="tech"><summary>Technical details</summary><dl class="fields">${tech.map(([l, v]) => `<div class="f"><dt>${l}</dt><dd>${v}</dd></div>`).join('')}</dl></details>`;
}
const openUrl = c => PL + ({ characters: '/create-character', objects: '/create-object', images: '/create', tilesets: '/maps?tab=tilesets', tiles: '/maps?tab=tiles', maps: '/maps', ui: '/create-ui' }[c.cat]);

// ---------------------------------------------------------------- phone stage screen / compact immersive
function setStageOpen(open, fromRoute) {
  if (!mobile()) { st.stageOpen = false; root.classList.remove('stage-open'); return; }
  if (open === st.stageOpen) return;
  st.stageOpen = open;
  root.classList.toggle('stage-open', open);
  closePop();
  if (open) {
    if (!fromRoute) { st.pushed = true; syncHash(true); }
    $('#stage-title').focus({ preventScroll: true });
    requestAnimationFrame(() => { applyZoom(); if (S.playing) startPlayer(); });
    pokeChrome();
  } else {
    stopPlayer();
    if (fromRoute) st.pushed = false;
    else if (st.pushed) { st.pushed = false; history.back(); return; }
    else syncHash();
    root.classList.remove('info-open');
    if (st.cur && cellEl(st.cur.key)) { const li = cellEl(st.cur.key); li.scrollIntoView({ block: 'nearest' }); li.querySelector('.card').focus({ preventScroll: true }); }
    updateTitle();
  }
}
let chromeT = null;
function pokeChrome() {
  const pane = $('#stage');
  pane.classList.remove('chrome-hidden'); clearTimeout(chromeT);
  if (st.layout !== 'compact' || !S.playing || reduced()) return;
  chromeT = setTimeout(() => {
    const ae = document.activeElement;
    if (ae && ae.closest('.stage-head, .transport, .stage-toolbar, .context, .compass')) return;   // never fade while focus is in the controls
    pane.classList.add('chrome-hidden');
  }, 3000);
}
function toggleInfo() {
  if (st.layout === 'stack') { st.info = !st.info; renderToolbar(); return; }
  if (st.layout === 'compact') { const on = root.classList.toggle('info-open'); $('[data-act=info]').setAttribute('aria-pressed', on); requestAnimationFrame(() => applyZoom()); return; }
  if (stageVisible()) $('#inspector').scrollTop = 0;
}
function toggleFullscreen() {
  if (document.fullscreenElement) document.exitFullscreen();
  else if ($('#stage').requestFullscreen) $('#stage').requestFullscreen().catch(() => { /* not allowed here */ });
}

// ---------------------------------------------------------------- favorites + folders
function afterOrgChange(keys) {
  if (st.view === 'favorites' || st.view === 'folder') rerenderKeepFocus(); else (keys || []).forEach(refreshCell);
  renderLeft(); renderFolderHead(); renderToolbar(); renderInspectorSoft();
  if (!$('#summary').hidden) renderSummary();
  if (st.view === 'collections') renderBody();
  renderSel();
}
function rerenderKeepFocus() {
  const ae = document.activeElement, li = ae && ae.closest && ae.closest('#grid .cell'), idx = li ? gridCells().indexOf(li) : -1;
  renderBody();
  if (idx >= 0 && !$('#grid .card:focus')) { const lis = gridCells(); const t = lis[Math.min(idx, lis.length - 1)]; if (t) t.querySelector('.card').focus({ preventScroll: true }); else $('#h1').focus(); }
}
function toggleFav(c) {
  const on = !st.favs.has(c.id);
  if (on) st.favs.add(c.id); else st.favs.delete(c.id);
  announce(on ? 'Added to favorites' : 'Removed from favorites');
  afterOrgChange([c.key]);
}
function bulkFav() {
  const sel = selCards(), allFav = sel.every(c => st.favs.has(c.id));
  sel.forEach(c => { if (allFav) st.favs.delete(c.id); else st.favs.add(c.id); });
  toast(allFav ? `Removed ${sel.length} from Favorites.` : `Added ${sel.length} to Favorites.`);
  afterOrgChange(sel.map(c => c.key));
}
function addTo(f, ids) {
  const added = ids.filter(id => !f.ids.includes(id));
  f.ids.push(...added);
  toast(`Added ${added.length} to ${f.name}.`, { label: 'Undo', act: () => { f.ids = f.ids.filter(id => !added.includes(id)); afterOrgChange(added.map(id => byId[id] && byId[id].key)); } });
  afterOrgChange(added.map(id => byId[id] && byId[id].key));
}
function removeFrom(f, ids) {
  const removed = ids.filter(id => f.ids.includes(id));
  f.ids = f.ids.filter(id => !removed.includes(id));
  toast(`Removed from ${f.name}. It's still in your library.`, { label: 'Undo', act: () => { f.ids.push(...removed); afterOrgChange(); } });
  afterOrgChange();
}
function folderPicker(anchor, ids) {
  const rows = () => `<p class="pop-title">Add to folder</p><button class="pf-row" data-new>${icon('folder-plus')}<span>New folder</span></button>` +
    sortedFolders().map(f => {
      const n = ids.filter(id => f.ids.includes(id)).length, s = n === 0 ? 'false' : n === ids.length ? 'true' : 'mixed';
      return `<button class="pf-row" role="checkbox" aria-checked="${s}" data-f="${f.id}"><span class="box">${s === 'true' ? icon('check') : s === 'mixed' ? icon('minus') : ''}</span><span class="nm">${esc(f.name)}</span><span class="px">${folderCards(f).length}</span></button>`;
    }).join('') + `<div class="pop-foot"><button class="btn primary" data-done>Done</button></div>`;
  const click = (e, host) => {
    if (e.target.closest('[data-done]')) { if (host.closest('dialog')) host.closest('dialog').close(); else closePop(true); return; }
    if (e.target.closest('[data-new]')) { if (host.closest('dialog')) host.closest('dialog').close(); else closePop(); folderNameDialog(null, f => addTo(f, ids)); return; }
    const b = e.target.closest('[data-f]'); if (!b) return;
    const f = folderById(b.dataset.f);
    if (b.getAttribute('aria-checked') === 'true') removeFrom(f, ids); else addTo(f, ids);
    host.innerHTML = rows(); const again = host.querySelector(`[data-f="${f.id}"]`); if (again) again.focus();
  };
  if (coarse() || mobile()) {
    const d = dialog({ title: 'Add to folder', cls: 'sheet-dlg', body: `<div class="pf">${rows()}</div>` });
    const host = $('.pf', d); host.addEventListener('click', e => click(e, host));
  } else popover(anchor, rows(), { cls: 'pf', label: 'Add to folder', onClick: click, focus: '[data-f], [data-new]' });
}
function folderNameDialog(folder, onDone) {
  dialog({ title: folder ? 'Rename folder' : 'New folder', selectText: true,
    body: `<label class="lbl" for="fname">Name</label><input id="fname" class="input" maxlength="60" autocomplete="off" value="${esc(folder ? folder.name : 'New folder')}" aria-describedby="fname-err"><p class="err" id="fname-err" hidden></p>`,
    foot: `<button type="button" class="btn outline" data-close>Cancel</button><button type="submit" class="btn primary">${folder ? 'Save' : 'Create'}</button>`,
    onSubmit(d) {
      const v = $('#fname', d).value.trim(), err = $('#fname-err', d);
      const msg = !v ? 'Give the folder a name.' : st.folders.some(f => f !== folder && f.name.toLowerCase() === v.toLowerCase()) ? 'You already have a folder with that name.' : '';
      if (msg) { err.textContent = msg; err.hidden = false; $('#fname', d).setAttribute('aria-invalid', 'true'); $('#fname', d).focus(); return false; }
      if (folder) { folder.name = v; afterOrgChange(); if (st.view === 'folder') renderToolbar(); }
      else {
        const f = { id: 'f' + Math.random().toString(36).slice(2, 8), name: v, ids: [] };
        st.folders.push(f);
        if (onDone) { onDone(f); renderLeft(); } else setTimeout(() => go('#/folder/' + f.id));   // opens the new empty folder (02 §3.8)
      }
    } });
}
function folderMenu(anchor, f) {
  menu(anchor, [{ label: 'Rename', icon: 'pencil', act: () => folderNameDialog(f) }, { label: 'Export', icon: 'download', act: () => exportDialogMulti(folderCards(f), 'folder-' + slug(f.name)) },
    { sep: true }, { label: 'Delete folder', icon: 'trash-2', act: () => deleteFolder(f) }], 'Folder actions for ' + f.name);
}
function deleteFolder(f) {
  const n = folderCards(f).length;
  confirmDialog(`Delete "${esc(f.name)}"?`, `The ${plural(n, 'asset')} in it stay in your library. Only the folder goes away.`, 'Delete folder', () => {
    const i = st.folders.indexOf(f); st.folders.splice(i, 1);
    toast(`Deleted "${f.name}". Your assets are untouched.`, { label: 'Undo', act: () => { st.folders.splice(i, 0, f); afterOrgChange(); } });
    if (st.view === 'folder' && st.folderId === f.id) setTimeout(() => go('#/collections')); else { afterOrgChange(); setTimeout(() => $('#h1').focus()); }
  });
}

// ---------------------------------------------------------------- export (faked: progress → toast/report)
function dlItems(c) {
  const isCur = c === st.cur, a = isCur ? curAsset() : c.a, anims = a.animations || [], m = a.meta || {};
  const an = isCur ? curAnim() || anims[0] : anims[defaultAnim(anims)];
  const dkeys = Object.keys(an ? an.frames : a.directions || {});
  const dir = isCur ? S.dir : dkeys.includes('south') ? 'south' : dkeys[0];
  const dirS = dir && dir !== 'unknown' ? dir.replace('_', '-') : '';
  const n = slug(c.a.name + (m.state_name ? ' ' + m.state_name : '')), fr3 = String(isCur ? S.frame : 0).padStart(3, '0');
  const sz = artSize(a), gx = [1, 2, 4, 8].find(k => Math.max(sz.w, sz.h) * k >= 256) || 8, sx = gx > 1 ? '@' + gx + 'x' : '';
  const D_ = dirS ? '_' + dirS : '', nd = Object.keys(a.directions || {}).length;
  const frames = anims.reduce((s, x) => s + Object.values(x.frames).reduce((t, f) => t + f.length, 0), 0) + nd;
  const it = (label, file, files) => ({ label, file, files });
  if ((c.cat === 'characters' || c.cat === 'objects') && an) return [
    it(`GIF · ${an.name}${dirS ? ' · ' + dirS : ''}`, `${n}_${slug(an.name)}${D_}${sx}.gif`, 1), it('PNG · this frame', `${n}_${slug(an.name)}${D_}_${fr3}.png`, 1),
    it(`Sprite sheet + JSON · ${an.name}`, `${n}_${slug(an.name)}.png`, 2), it('Sprite sheet + JSON · all animations', `${n}_all.png`, 2), it('Frames ZIP', `${n}_${slug(an.name)}_frames.zip`, frames)]
    .concat(c.cat === 'characters' ? [it('PixelLab ZIP (all states)', `${slug(c.a.name)}_pixellab.zip`, 1), it('PixelLab sprite sheet', `${n}_pixellab-sheet.zip`, 1)] : []);
  if (c.cat === 'characters' || (c.cat === 'objects' && nd > 1)) return [it('PNG · this view', `${n}${D_}.png`, 1), it('Sprite sheet + JSON (rotations)', `${n}_rotations.png`, 2), it('Frames ZIP', `${n}_rotations_frames.zip`, nd)]
    .concat(c.cat === 'characters' ? [it('PixelLab originals', `${n}_pixellab.zip`, 1)] : []);
  if (c.cat === 'images' && m.frames > 1) return [it('GIF', `${n}${sx}.gif`, 1), it('PNG · this frame', `${n}_${fr3}.png`, 1), it('Sprite sheet + JSON', `${n}_all.png`, 2), it('Frames ZIP', `${n}_frames.zip`, m.frames)];
  if (c.cat === 'tilesets') return [it('PNG · sheet', `${n}.png`, 1), it('Sheet + PixelLab metadata (ZIP)', `${n}_sheet.zip`, 2), it('Tiles ZIP', `${n}_tiles.zip`, m.total_tiles + 1)];
  if (a.type === 'tiles_pro') return [it('Tiles ZIP', `${n}_tiles.zip`, m.n_tiles + 1), it('PNG · this tile', `${n}_tile_00.png`, 1), it('Sheet + JSON', `${n}_all.png`, 2), it('PixelLab ZIP', `${n}_pixellab.zip`, 1)];
  return [it('PNG', `${n}.png`, 1)];
}
function downloadMenu(anchor, c) {
  menu(anchor, dlItems(c).map((it, i) => ({ label: it.label, strong: i === 0, icon: i === 0 ? 'download' : null, act: () => startExport({ label: it.file, total: it.files, n: 1 }) }))
    .concat([{ sep: true }, { label: 'More options…', icon: 'settings', act: () => exportDialogSingle(c) }]), 'Download ' + c.title);
}
function filesFor(c, p) {
  let n = 1;                                             // metadata.json
  (p.states === 'base' ? [c.members[0]] : c.members).forEach(a => {
    const nd = Object.keys(a.directions || {}).length, anims = a.animations || [];
    const fr = anims.reduce((s, x) => s + Object.values(x.frames).reduce((t, f) => t + f.length, 0), 0) + nd + (a.frames ? a.frames.length : 0);
    if (p.game) n += nd || (a.frames && a.frames.length > 1) || a.grid ? 2 : 1;
    if (p.frames) n += fr || (a.grid ? a.grid.cols * a.grid.rows : 1);
    if (p.gifs) n += anims.reduce((s, x) => s + Object.keys(x.frames).length, 0) || 1;
  });
  return n;
}
function estimate(list, p) { const files = list.reduce((s, c) => s + filesFor(c, p), 1); return { files, mb: (files * 0.034 * (p.scaleMul || 1)).toFixed(1) }; }
function breakdown(list) {
  const by = {}; let states = 0;
  list.forEach(c => { by[c.cat] = (by[c.cat] || 0) + 1; if (c.cat === 'characters') states += c.members.length; });
  return TYPES.filter(t => by[t[0]]).map(([id]) => plural(by[id], TYPE_WORD[id][0], TYPE_WORD[id][1]) + (id === 'characters' ? ` (${plural(states, 'state')})` : '')).join(' · ');
}
const ADVANCED = `<details class="adv"><summary>Scale, GIF background, loop, trim, spacing</summary><div class="adv-grid">
  <label>Scale <select data-p="scale"><option value="auto">Auto (GIF)</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option></select></label>
  <label>GIF background <select><option>Transparent</option><option>Matte: current backdrop</option></select></label>
  <label>GIF loop <select><option>Forever</option><option>Once</option></select></label>
  <label>Sheet spacing <select><option>0 px</option><option>1 px</option><option>2 px</option></select></label>
  <label class="check"><input type="checkbox" checked> Trim empty space (GIF)</label>
  <label class="check"><input type="checkbox" checked> Include metadata.json</label></div></details>`;
const row = (label, html) => `<div class="drow"><span class="rl">${label}</span><div class="rv">${html}</div></div>`;
const segRadio = (name, opts, cur) => `<div class="seg" role="radiogroup">${opts.map(([v, l]) => `<label class="seg-opt"><input type="radio" name="${name}" value="${v}"${v === cur ? ' checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
function scaled(file, scale) { return scale === 'auto' ? file : file.replace(/(@\d+x)?\.(gif|png)$/, (m0, s, e) => (+scale > 1 ? '@' + scale + 'x' : '') + '.' + e); }
function exportDialogSingle(c) {
  const items = dlItems(c), animated = (c.cat === 'characters' || c.cat === 'objects') && (c.a.animations || []).length;
  const d = dialog({ title: 'Export ' + esc(c.a.name), cls: 'export',
    body: row('Presets', `<div class="presets">${items.map((it, i) => `<label class="radio-row"><input type="radio" name="preset" value="${i}"${i ? '' : ' checked'}><span>${esc(it.label)}</span></label>`).join('')}</div>`) +
      (animated ? row('Animation', segRadio('anim', [['current', 'Current'], ['all', 'All'], ['everything', 'Everything']], 'current')) + `<div class="dir-row">${row('Directions', segRadio('dirs', [['current', 'Current'], ['all', 'All (GIFs in a ZIP)']], 'current'))}</div>` : '') +
      row('Advanced', ADVANCED) + row('Estimate', '<span class="est"></span>') + row('File', '<code class="fname"></code>'),
    foot: `<button type="button" class="btn outline" data-close>Cancel</button><button type="submit" class="btn primary">${icon('download')}<span>Export</span></button>`,
    onSubmit(dd) { const v = read(dd); startExport({ label: v.file, total: v.files, n: 1 }); } });
  const read = dd => {
    const i = +$('[name=preset]:checked', dd).value, it = items[i], scale = $('[data-p=scale]', dd).value, gif = /^GIF/.test(it.label);
    const allDirs = gif && $('[name=dirs]:checked', dd) && $('[name=dirs]:checked', dd).value === 'all', sc = $('[name=anim]:checked', dd);
    let file = scaled(it.file, scale), files = it.files;
    if (allDirs) { file = file.replace(/_(south|north|east|west)(-(east|west))?(@\d+x)?\.gif$/, '_gifs.zip'); files = Object.keys(c.a.directions || {}).length; }
    if (sc && sc.value !== 'current' && !gif) { file = file.replace(/_[a-z-]+(_frames)?\.(png|zip)$/, `_${sc.value === 'all' ? 'all' : 'everything'}$1.$2`); files *= 2; }
    return { file, files, gif };
  };
  const upd = () => { const v = read(d); $('.est', d).textContent = `${plural(v.files, 'file')} · about ${(v.files * 0.21).toFixed(1)} MB`; $('.fname', d).textContent = v.file; const dr = $('.dir-row', d); if (dr) dr.hidden = !v.gif; };
  d.addEventListener('change', upd); upd();
}
function exportDialogMulti(list, scope) {
  if (!list.length) return toast('Nothing to export in this view.');
  const hasChars = list.some(c => c.cat === 'characters');
  const d = dialog({ title: 'Export ' + plural(list.length, 'asset'), cls: 'export',
    body: `<p class="sub">${esc(breakdown(list))}</p>` +
      row('Presets', `<div class="chk-chips">${[['game', 'Game-ready', 1], ['frames', 'Frames'], ['gifs', 'GIFs']].map(([k, l, on]) => `<label class="chk-chip"><input type="checkbox" name="${k}"${on ? ' checked' : ''}><span>${icon('check')}${l}</span></label>`).join('')}</div>`) +
      (hasChars ? row('States', segRadio('states', [['all', 'All states'], ['base', 'Base only']], 'all')) : '') +
      row('Advanced', ADVANCED) + row('Estimate', '<span class="est"></span>') + row('File', `<code class="fname">vitrine-${scope}-${today}.zip</code>`),
    foot: `<button type="button" class="btn outline" data-close>Cancel</button><button type="submit" class="btn primary" id="x-go">${icon('download')}<span>Export</span></button>`,
    onSubmit(dd) {
      const p = read(dd); if (!p.game && !p.frames && !p.gifs) return false;
      const failures = st.demo.exportFail ? [list[list.length - 1]] : [];
      startExport({ label: `vitrine-${scope}-${today}.zip`, total: estimate(list, p).files, n: list.length, failures });
    } });
  const read = dd => ({ game: $('[name=game]', dd).checked, frames: $('[name=frames]', dd).checked, gifs: $('[name=gifs]', dd).checked, states: hasChars ? $('[name=states]:checked', dd).value : 'all' });
  const upd = () => { const p = read(d), e = estimate(list, p), none = !p.game && !p.frames && !p.gifs; $('.est', d).textContent = none ? 'Pick at least one preset.' : `${plural(e.files, 'file')} · about ${e.mb} MB`; $('#x-go', d).disabled = none; };
  d.addEventListener('change', upd); upd();
}
function startExport(o) {
  if (st.exporting) { toast('An export is already running. Wait for it to finish or cancel it.'); return; }
  const ex = st.exporting = Object.assign({ done: 0, q: 0 }, o);
  announce(o.n > 1 ? `Exporting ${o.n} assets` : 'Exporting ' + o.label);
  window.onbeforeunload = () => true;
  ex.timer = setInterval(() => {
    ex.done = Math.min(ex.total, ex.done + Math.max(1, Math.ceil(ex.total / 24)));
    const q = Math.floor(ex.done / ex.total * 4);
    if (q > ex.q && q < 4) { ex.q = q; announce(`Export ${q * 25}% done`); }
    renderExport();
    if (ex.done >= ex.total) finishExport();
  }, 110);
  renderExport();
}
function renderExport() {
  const ex = st.exporting;
  const h = ex ? `<span class="xp-line" aria-hidden="true"><i style="width:${Math.round(ex.done / ex.total * 100)}%"></i></span>${icon('download')}<span>Exporting <span class="px">${fmtN(ex.done)}/${fmtN(ex.total)}</span> · ${(ex.done * 0.034).toFixed(1)} MB</span><button class="link" data-act="export-cancel">Cancel</button>` : '';
  $$('[data-slot=export-progress]').forEach(el => { el.innerHTML = h; el.classList.toggle('on', !!ex); });
}
function finishExport(canceled) {
  const ex = st.exporting; if (!ex) return;
  clearInterval(ex.timer); st.exporting = null; window.onbeforeunload = null; renderExport();
  if (canceled) { toast('Export canceled. Nothing was saved.'); announce('Export canceled'); return; }
  const f = (ex.failures || []).length;
  if (f) {
    announce(`Export finished. ${plural(f, 'item')} failed.`);
    toast(`Exported ${plural(ex.n - f, 'asset')}. ${f} couldn't be exported.`, { label: 'View report', act: () => reportDialog(ex) }, 'triangle-alert');
  } else if (coarse()) readySheet(ex);
  else { toast(ex.n > 1 ? `Exported ${plural(ex.n, 'asset')} to ${ex.label}.` : `Saved ${ex.label}.`, null, 'check'); announce('Export finished.'); }
}
function readySheet(ex) {
  dialog({ title: 'Your export is ready', cls: 'sheet-dlg', body: `<p><code>${esc(ex.label)}</code></p>`,
    foot: `<button type="button" class="btn outline" data-close>Download file</button><button type="submit" class="btn primary">Share or save…</button>`,
    onSubmit: () => toast('Opened the share sheet (mockup).') });
}
function reportDialog(ex) {
  dialog({ title: 'Export report', focusTitle: true,
    body: `<p>${plural(ex.failures.length, 'asset')} couldn't be exported. Everything else is in <code>${esc(ex.label)}</code>.</p><table class="report"><thead><tr><th>Name</th><th>Type</th><th>Reason</th></tr></thead><tbody>${ex.failures.map(c => `<tr><td>${esc(c.title)}</td><td>${esc(c.kind)}</td><td>Not found in PixelLab. It may have been deleted.</td></tr>`).join('')}</tbody></table>`,
    foot: `<button type="button" class="btn outline" data-close>Close</button><button type="submit" class="btn primary">Retry failed</button>`,
    onSubmit: () => { st.demo.exportFail = false; startExport({ label: `vitrine-retry-${today}.zip`, total: 4, n: ex.failures.length }); } });
}

// ---------------------------------------------------------------- connect + sync (faked)
function showConnect(variant) {
  st.connected = false; stopSync(); stopPlayer(); closePop();
  $('#app').hidden = true; $('#connect').hidden = false;
  $('#welcome').hidden = variant !== 'welcome';
  showTokenErr('');
  updateTitle();
  const t = $('#token'); t.value = variant === 'invalid' ? 'bad' : '';
  t.focus();
  if (variant === 'invalid') $('#connect-form').requestSubmit();
}
function showTokenErr(msg) {
  const e = $('#token-err'), t = $('#token');
  e.textContent = msg; e.hidden = !msg;
  if (msg) { t.setAttribute('aria-invalid', 'true'); t.focus(); } else t.removeAttribute('aria-invalid');
}
function onConnect(e) {
  e.preventDefault();
  const f = $('#token'), v = f.value.trim(), btn = $('#connect-btn');
  if (!v) return showTokenErr('Paste your token first.');
  if (st.demo.offline || st.demo.offlineEmpty) return showTokenErr("You're offline. Connect to the internet and try again.");
  btn.textContent = 'Checking…'; btn.disabled = true; f.readOnly = true; showTokenErr('');
  setTimeout(() => {
    btn.textContent = 'Connect'; btn.disabled = false; f.readOnly = false;
    if (v.toLowerCase() === 'bad') return showTokenErr("That token didn't work. Copy it again from your PixelLab account page and paste it here.");
    f.value = '';                                          // the mockup never keeps, logs, or shows token text
    st.remember = $('#remember').checked;
    enterApp(true);
    toast('Connected. Loading your library…');
  }, 700);
}
function enterApp(sync) {
  st.connected = true;
  try { sessionStorage.setItem('vitrine-c-session', '1'); } catch (e) { /* storage blocked */ }
  $('#connect').hidden = true; $('#app').hidden = false;
  if (sync) startSync(sync === 'slow');
  applyRoute();
}
let syncTimer = null;
function startSync(slow) {
  stopSync();
  st.syncing = true; st.arrived = new Set(); st.failed = new Set(st.demo.partial ? ['maps'] : []);
  const pools = TYPES.slice(1, 8).map(([id]) => sortCards(cards.filter(c => c.cat === id && !(st.demo.gated && id === 'images') && !st.failed.has(id))));
  const queue = [];
  while (pools.some(p => p.length)) pools.forEach(p => queue.push(...p.splice(0, 4)));   // pages per type, interleaved like parallel lists
  st.syncTotal = queue.length; let half = false;
  announce('Syncing your library');
  syncTimer = setInterval(() => {
    queue.splice(0, 6).forEach(c => st.arrived.add(c.key));
    if (!half && st.arrived.size >= st.syncTotal / 2) { half = true; announce('Halfway there'); }
    if (!queue.length) return syncDone();
    renderResult(); renderToolbar(); renderBody(); renderLeft();
    if (!st.cur && !mobile()) setCurrent(viewCards()[0] || null);
  }, slow ? 1500 : 260);
  renderAll();
}
function stopSync() { clearInterval(syncTimer); syncTimer = null; }
function syncDone() {
  stopSync(); st.syncing = false; st.arrived = null; st.lastSync = Date.now();
  if (st.failed.size) announce('Maps couldn\'t be loaded');
  announce(`Library synced. ${plural(libCards().length, 'asset')}.`);
  renderAll();
  if (!st.cur && !mobile()) setCurrent(viewCards()[0] || null);
}
function syncPopover(anchor) {
  const html = () => `<p class="pop-title">Library sync</p><ul class="sync-rows">${TYPES.slice(1, 8).map(([id, label]) => {
    if (id === 'images' && st.demo.gated) return `<li><span>${label}</span><span class="muted">Not available yet</span></li>`;
    const total = cards.filter(c => c.cat === id).length, got = st.arrived ? cards.filter(c => c.cat === id && st.arrived.has(c.key)).length : total;
    if (st.failed.has(id)) return `<li><span>${label}</span><span class="err-t">${label} couldn't be loaded.</span><button class="btn mini outline" data-retry="${id}">Retry</button></li>`;
    return `<li><span>${label}</span><span class="px">${got < total ? got + ' of ' + total : total}</span>${got < total ? '<span class="muted">Loading…</span>' : `<span class="ok">${icon('check')}Done</span>`}</li>`;
  }).join('')}</ul>${st.demo.ratelimit ? '<p class="muted small">PixelLab asked us to slow down. Continuing shortly…</p>' : ''}<div class="pop-foot"><span class="muted small">Last synced ${ago(st.lastSync)}</span><button class="btn outline" data-sync-now>${icon('refresh-cw')}<span>Sync now</span></button></div>`;
  popover(anchor, html(), { cls: 'sync-pop', label: 'Library sync', onClick(e, el) {
    const r = e.target.closest('[data-retry]');
    if (r) { st.failed.delete(r.dataset.retry); st.demo.partial = false; renderAll(); el.innerHTML = html(); toast(`${cap(r.dataset.retry)} loaded.`); }
    if (e.target.closest('[data-sync-now]')) { closePop(true); startSync(); }
  } });
}
function inProgressPopover(anchor) {
  const gen = inProgress.filter(a => a.status === 'processing').length, rev = inProgress.filter(a => a.status === 'review').length;
  popover(anchor, `<p class="pop-title">In PixelLab</p><ul class="sync-rows"><li><span>Objects</span><span>${[gen && gen + ' generating', rev && rev + ' needs review'].filter(Boolean).join(' · ')}</span></li></ul><p>${ext(PL + '/create-object', 'Open Objects in PixelLab')}</p><p class="muted small">Assets still being made or waiting for review show up here, not as cards.</p>`, { cls: 'sync-pop', label: 'In PixelLab' });
}
function reconnectDialog() {
  announce('Your PixelLab token stopped working. Reconnect to continue.', true);
  dialog({ title: 'Reconnect to PixelLab.', alert: true,
    body: `<p>Your token stopped working. It may have been replaced in your PixelLab account. Paste a new one to continue. Your folders and favorites are safe.</p><label class="lbl" for="rtoken">PixelLab API token</label><input id="rtoken" class="input" type="password" autocomplete="current-password" placeholder="Paste your token" aria-describedby="rtoken-err"><p class="err" id="rtoken-err" hidden></p>`,
    foot: `<button type="submit" class="btn primary">Connect</button>`,
    onSubmit(d) {
      const t = $('#rtoken', d);
      if (!t.value.trim()) { const e = $('#rtoken-err', d); e.textContent = 'Paste your token first.'; e.hidden = false; t.focus(); return false; }
      t.value = ''; toast('Connected. Loading your library…');
    } });
}

// ---------------------------------------------------------------- settings, help, mockup states
const DEMO_STATES = [['offline', 'Offline, saved library (banner)'], ['offlineEmpty', 'Offline, nothing saved'], ['cors', 'PixelLab blocking this browser (CORS)'], ['partial', 'Partial sync (Maps failed)'],
  ['ratelimit', 'Rate limited'], ['empty', 'Empty library'], ['gated', 'Images gated (gate failed)'], ['exportFail', 'Next multi export: 1 failure']];
function openSettings(tab) {
  const tabs = [['connection', 'Connection'], ['library', 'Library'], ['appearance', 'Appearance'], ['keyboard', 'Keyboard'], ['org', 'Folders & favorites'], ['storage', 'Storage'], ['about', 'About'], ['states', 'Mockup states']];
  let cur = tab || 'connection';
  const d = dialog({ title: 'Settings', cls: 'settings', focusTitle: true, body: `<div class="tabs" role="tablist" aria-label="Settings sections">${tabs.map(([id, l]) => `<button type="button" role="tab" data-tab="${id}">${l}</button>`).join('')}</div><div class="tabpanel" role="tabpanel"></div>` });
  const paint = () => {
    $$('[role=tab]', d).forEach(b => { const on = b.dataset.tab === cur; b.setAttribute('aria-selected', on); b.tabIndex = on ? 0 : -1; });
    $('.tabpanel', d).innerHTML = settingsPanel(cur);
    $('.tabpanel', d).setAttribute('aria-label', tabs.find(t => t[0] === cur)[1]);
  };
  d.addEventListener('click', e => {
    const t = e.target.closest('[data-tab]'); if (t) { cur = t.dataset.tab; paint(); return; }
    const s = e.target.closest('button[data-set]'); if (s) settingsAction(s, d, paint);
  });
  d.addEventListener('change', e => { const s = e.target.closest('[data-set]'); if (s) settingsAction(s, d, paint); });
  paint();
}
const sw = (key, on, label, help) => `<label class="switch"><input type="checkbox" role="switch" data-set="${key}"${on ? ' checked' : ''}><span class="track" aria-hidden="true"></span><span>${label}</span></label>${help ? `<p class="help">${help}</p>` : ''}`;
const segSet = (key, opts, cur) => `<div class="seg" role="radiogroup">${opts.map(([v, l, ic]) => `<button type="button" role="radio" data-set="${key}" data-v="${v}" aria-checked="${v === cur}" tabindex="${v === cur ? 0 : -1}">${ic ? icon(ic) : ''}<span>${l}</span></button>`).join('')}</div>`;
function settingsPanel(tab) {
  const R = (l, v) => `<div class="drow"><span class="rl">${l}</span><div class="rv">${v}</div></div>`;
  switch (tab) {
    case 'connection': return R('Status', 'Connected · token ending ••••<span class="note">The mockup never shows token characters.</span>') +
      R('Plan', 'Tier 1 · 1,840 generations left · 312 credits') +
      R('Remember', sw('remember', st.remember, 'Remember on this device', st.remember ? "Saved in this browser so you don't need to paste it again. Anyone using this browser profile could use it, so don't turn this on for shared computers." : "Kept in this tab only. You'll paste it again in a new tab.")) +
      R('Token', `<div class="btnrow"><button type="button" class="btn outline" data-set="change">${icon('key-round')}<span>Change token</span></button><button type="button" class="btn outline danger" data-set="forget">Forget token</button></div><div class="change-row" hidden><input class="input" type="password" autocomplete="off" placeholder="Paste your token" aria-label="New PixelLab API token"><button type="button" class="btn primary" data-set="test">Test</button></div>`) +
      `<p>${ext(PL + '/account', 'Need to revoke this token? Generate a new one in your PixelLab account')}</p>`;
    case 'library': return R('Sync', `<button type="button" class="btn outline" data-set="sync">${icon('refresh-cw')}<span>Sync now</span></button><span class="note">Last synced ${ago(st.lastSync)}</span>`) +
      R('Previews', sw('animate', st.animate, 'Animate previews', 'Mirrors the Animate button in the toolbar.')) +
      R('Grid size', segSet('size', SIZE_ORDER.map(s => [s, s]), st.size)) +
      R('Default viewer backdrop', `<select data-set="backdrop" aria-label="Default viewer backdrop">${BACKDROPS.map(([id, l]) => `<option value="${id}"${id === st.defaultBackdrop ? ' selected' : ''}>${l}${id === 'stage' ? ' (theme)' : ''}</option>`).join('')}</select>`);
    case 'appearance': return R('Theme', segSet('theme', [['system', 'System', 'monitor'], ['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']], st.theme));
    case 'keyboard': return R('Shortcuts', sw('shortcuts', st.shortcuts, 'Single-key shortcuts', 'Turn off if single keys clash with your assistive technology. Every action stays reachable with visible controls.')) +
      R('Help', `<button type="button" class="btn outline" data-set="help">${icon('keyboard')}<span>Show shortcuts</span></button>`);
    case 'org': return R('Saved here', `${plural(st.folders.length, 'folder')} · ${plural(st.favs.size, 'favorite')}`) +
      R('Backup', `<div class="btnrow"><button type="button" class="btn outline" data-set="export-backup">${icon('download')}<span>Export backup (.json)</span></button><button type="button" class="btn outline" data-set="import">Import backup…</button></div><p class="help">They live only in this browser. Export a backup now and then.</p>`);
    case 'storage': return R('Usage', 'Using 84 MB') +
      R('Persistence', st.protect ? 'Protected from automatic clearing' : `May be cleared by the browser <button type="button" class="btn mini outline" data-set="protect">Protect</button>`) +
      R('Saved images', st.remember ? `<button type="button" class="btn outline" data-set="clear-images">Clear saved images</button><p class="help">Keeps your folders and favorites.</p>` : "Nothing is saved between sessions in 'This tab only' mode.");
    case 'about': return `<div class="about"><div class="about-brand">${markSvg(3)}${pixels(WORD, 2, 'Vitrine')}</div><p><strong>Vitrine</strong> · Unofficial gallery for your PixelLab assets. Mockup, option C ("Soft Pixel Workbench").</p>
      <p>Vitrine is an unofficial gallery for your PixelLab assets. It isn't made by, affiliated with, or endorsed by PixelLab.</p><p>No analytics, no tracking, no servers. Vitrine talks only to PixelLab's API and image host.</p>
      <p><strong>Other PixelLab content.</strong> Fonts, effects, portraits and talking animations aren't available through PixelLab's public API yet, so Vitrine can't show them.</p>
      <p class="muted small">Source: (link placeholder) · Icons: Lucide, ISC License · Sample art: the owner's own PixelLab outputs, local mockup use only.</p></div>`;
    case 'states': return `<p class="help">Fake states for review. Toggles apply immediately; close Settings to see them.</p><div class="state-list">${DEMO_STATES.map(([k, l]) => sw('demo:' + k, !!st.demo[k], l)).join('')}</div>
      <div class="btnrow wrap"><button type="button" class="btn outline" data-set="do:reconnect">Token stopped working (401)</button><button type="button" class="btn outline" data-set="do:sync">Run first sync again</button>
      <button type="button" class="btn outline" data-set="do:connect">Connect screen</button><button type="button" class="btn outline" data-set="do:welcome">Connect: welcome back</button>
      <button type="button" class="btn outline" data-set="do:invalid">Connect: invalid token</button><button type="button" class="btn outline" data-set="do:tip">Show backup tip</button></div>`;
  }
  return '';
}
function settingsAction(el, d, paint) {
  const k = el.dataset.set, v = el.dataset.v;
  if (k.startsWith('demo:')) { st.demo[k.slice(5)] = el.checked; if (k === 'demo:partial') st.failed = new Set(el.checked ? ['maps'] : []); renderAll(); renderStage(); return; }
  if (k.startsWith('do:')) {
    const what = k.slice(3); d.close();
    if (what === 'reconnect') setTimeout(reconnectDialog);
    else if (what === 'sync') startSync();
    else if (what === 'tip') { st.tipDismissed = false; st.protect = false; go('#/collections'); }
    else showConnect(what === 'connect' ? '' : what);
    return;
  }
  switch (k) {
    case 'remember':
      if (el.checked) { st.remember = true; paint(); }
      else { el.checked = true; confirmDialog('Stop remembering?', "Vitrine will delete your saved token and its saved copy of your library from this browser. You'll stay connected in this tab.", 'Stop remembering', () => { st.remember = false; toast('Stopped remembering on this device.'); }); }
      return;
    case 'change': $('.change-row', d).hidden = false; $('.change-row input', d).focus(); return;
    case 'test': { const i = $('.change-row input', d); if (!i.value.trim()) { i.focus(); return; } i.value = ''; toast('Connected. Loading your library…'); paint(); return; }
    case 'forget':
      confirmDialog('Forget your token?', "Vitrine will disconnect on this device and delete its saved copy of your library. Your PixelLab account isn't affected.", 'Forget token', cd => {
        if ($('#also-org', cd).checked) { st.folders = []; st.favs.clear(); }
        try { sessionStorage.removeItem('vitrine-c-session'); } catch (e) { /* ignore */ }
        d.close(); showConnect(''); toast('Token forgotten.');
      }, `<label class="check"><input type="checkbox" id="also-org"> Also delete my folders and favorites.</label><p class="help"><em>Your browser may still keep some images in its own cache. Clear your browsing data to remove them.</em></p>`);
      return;
    case 'sync': d.close(); startSync(); return;
    case 'animate': setAnimate(el.checked); return;
    case 'size': setSize(v); paint(); return;
    case 'backdrop': st.defaultBackdrop = el.value; setBackdrop(el.value); return;
    case 'theme': st.theme = v; store.set('theme', v); applyTheme(); paint(); return;
    case 'shortcuts': st.shortcuts = el.checked; return;
    case 'help': d.close(); setTimeout(helpDialog); return;
    case 'export-backup': toast(`Saved vitrine-backup-${today}.json.`); return;
    case 'import': dialog({ title: 'Import result', focusTitle: true, body: '<p>Imported 2 folders (1 merged) and 3 favorites. 1 item isn\'t in this library.</p><p class="muted small">Mockup: no file was read.</p>', foot: '<button type="submit" class="btn primary">OK</button>' }); return;
    case 'protect': st.protect = true; paint(); return;
    case 'clear-images': toast('Cleared saved images. Your folders and favorites are safe.'); return;
  }
}
function helpDialog() {
  const K = {
    Library: [['/', 'Focus search', 1], ['?', 'Show shortcuts', 1], ['← ↑ → ↓', 'Move through the sheet; the stage follows'], ['Home / End', 'First / last asset'], ['Enter', 'Go to the stage (selecting: toggle)'], ['x', 'Toggle selection', 1],
      ['Ctrl+A', 'Select all in view'], ['Shift+F10', 'Card menu'], ['L', 'Favorite', 1], ['D', 'Download', 1], ['+ / −', 'Grid size', 1], ['Esc', 'Close the top layer, then clear selection']],
    Stage: [['← / →', 'Previous / next asset'], ['Space', 'Play / pause'], [', / .', 'Frame back / forward', 1], ['[ / ]', 'Turn counter-clockwise / clockwise', 1], ['Home / End', 'First / last frame (stage focused)'],
      ['Z', 'Fit ↔ 1:1', 1], ['+ / −', 'Zoom (focus in the stage)', 1], ['Shift+arrows', 'Pan'], ['I', 'Info', 1], ['F', 'Fullscreen', 1]]
  };
  const G = { Library: [['Tap', 'Open on the stage'], ['Long-press', 'Select'], ['Pinch', 'Browser zoom (the grid never captures it)']],
    Stage: [['Swipe ← / →', 'Next / previous asset'], ['Swipe ↓', 'Back to the grid'], ['Double-tap', 'Fit ↔ zoom'], ['Drag', 'Pan when zoomed'], ['Tap the stage', 'Show or hide controls (landscape)']] };
  let tab = coarse() ? 'gestures' : 'keys';
  const table = data => Object.keys(data).map(g => `<h3>${g}</h3><table class="keys"><tbody>${data[g].map(([k, l, single]) => `<tr${single && !st.shortcuts ? ' class="off"' : ''}><th><kbd>${esc(k)}</kbd></th><td>${esc(l)}${single && !st.shortcuts ? ' (off)' : ''}</td></tr>`).join('')}</tbody></table>`).join('');
  const d = dialog({ title: 'Keyboard shortcuts', cls: 'help-dlg', focusTitle: true, body: `${st.shortcuts ? '' : '<p class="banner-in">Single-key shortcuts are off. Turn them on in Settings.</p>'}<div class="tabs" role="tablist" aria-label="Show"><button type="button" role="tab" data-h="keys">Keys</button><button type="button" role="tab" data-h="gestures">Gestures</button></div><div class="help-body"></div>` });
  const paint = () => { $$('[data-h]', d).forEach(b => { b.setAttribute('aria-selected', b.dataset.h === tab); b.tabIndex = b.dataset.h === tab ? 0 : -1; }); $('.help-body', d).innerHTML = table(tab === 'keys' ? K : G); };
  d.addEventListener('click', e => { const b = e.target.closest('[data-h]'); if (b) { tab = b.dataset.h; paint(); } });
  paint();
}

// ---------------------------------------------------------------- toolbar actions
function setChip(id) {
  const hadFocus = !!(document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-chip]'));
  if (st.view === 'collections') st.view = 'library';
  st.chip = id;
  if (!mobile() && st.cur && !viewCards().includes(st.cur)) setCurrent(viewCards()[0] || st.cur, { noHash: true });
  renderAll(); scrollSheetTop(); syncHash();
  const n = viewCards().length, w = TYPE_WORD[id];
  if (w) announce(plural(n, w[0], w[1]));
  const again = document.querySelector(`[data-chip="${id}"]`); if (again && hadFocus && document.activeElement === document.body) again.focus();
}
function setSize(s) { if (!SIZE_ORDER.includes(s) || s === st.size) return; st.size = s; store.set('size', s); renderBody(); renderToolbar(); announce('Grid size ' + s); }
const sizeStep = d => setSize(SIZE_ORDER[clamp(SIZE_ORDER.indexOf(st.size) + d, 0, 3)]);
function setAnimate(on) { st.animate = on; store.set('animate', on ? '1' : '0'); renderToolbar(); syncPreviews(); }
function setSort(k) { st.sort = k; store.set('sort', k); renderAll(); }
function sortItems() { return Object.keys(SORTS).filter(k => k !== 'updated' || st.chip === 'characters').map(k => ({ label: SORTS[k], checked: effSort() === k, act: () => setSort(k) })); }
function focusSearch() { if (mobile()) root.classList.add('searching'); const q = $('#q'); q.focus(); q.select(); }
const runSearch = debounce(() => {
  st.q = $('#q').value.trim();
  if (!mobile() && st.q && viewCards().length && !viewCards().includes(st.cur)) setCurrent(viewCards()[0], { noHash: true });
  renderBody(); renderResult(); renderToolbar(); renderStatus(); announceResults();
}, 150);
const announceResults = debounce(() => announce(plural(viewCards().length, 'result')), 500);
function contextCard(card) { return card ? byKey[card.dataset.key] : stageVisible() ? st.cur : null; }
function favContext(card) {
  if (st.selMode && st.sel.size && !card) return bulkFav();
  const c = contextCard(card); if (c) toggleFav(c);
}
function downloadContext(card) {
  if (st.selMode && st.sel.size) return selDownload();
  const c = contextCard(card); if (!c) return;
  downloadMenu(card || $('[data-act=dl-menu]') || $('#stage-title'), c);
}
function selDownload() {
  const sel = selCards();
  if (sel.length === 1) return downloadMenu($('[data-act=sel-download]') || $('#h1'), sel[0]);
  exportDialogMulti(sel, 'selection-' + sel.length);
}
function cardMenu(li, anchor) {
  const c = byKey[li.dataset.key], fav = st.favs.has(c.id), at = anchor || li.querySelector('.mb') || li, f = st.view === 'folder' && folderById(st.folderId);
  menu(at, [
    { label: 'Open', icon: 'scan', act: () => activateCard(li, 'key') },
    { label: fav ? 'Unfavorite' : 'Favorite', icon: 'heart', hint: 'L', act: () => toggleFav(c) },
    { label: 'Download…', icon: 'download', hint: 'D', act: () => downloadMenu(at, c) },
    { label: 'Add to folder…', icon: 'folder-plus', act: () => folderPicker(at, [c.id]) },
    f && { label: 'Remove from this folder', icon: 'trash-2', act: () => removeFrom(f, [c.id]) },
    { label: 'Open in PixelLab', href: openUrl(c) },
    { sep: true }, { label: 'Select', icon: 'square-check', hint: 'X', act: () => toggleSel(c.key, true) }
  ].filter(Boolean), 'Actions for ' + c.title);
}
function activateCard(li, how) {
  const c = byKey[li.dataset.key];
  if (mobile()) { setCurrent(c, { noHash: true }); setStageOpen(true); return; }
  setCurrent(c);
  if (how === 'key') $('#stage-title').focus();
}
function closeStage() { if (mobile() && st.stageOpen) setStageOpen(false); }

const ACTIONS = {
  reveal(b) { const t = $('#token'), show = t.type === 'password'; t.type = show ? 'text' : 'password'; b.textContent = show ? 'Hide' : 'Show'; b.setAttribute('aria-pressed', show); },
  'use-sample'() { enterApp(true); toast('Connected. Loading your library…'); },
  'search-open': focusSearch,
  'search-close'() { root.classList.remove('searching'); },
  select() { if (st.selMode) exitSel(); else enterSel(); },
  settings: () => openSettings(),
  'sort-menu': b => menu(b, sortItems(), 'Sort'),
  'view-menu': b => menu(b, sortItems().concat([{ sep: true }], SIZE_ORDER.map(s => ({ label: 'Grid size ' + s, checked: st.size === s, act: () => setSize(s) }))), 'Sort and grid size'),
  'size-down': () => sizeStep(-1), 'size-up': () => sizeStep(1),
  animate: () => setAnimate(!st.animate),
  overflow: b => menu(b, [{ label: 'Export all in view…', icon: 'download', act: () => exportDialogMulti(viewCards(), st.view === 'folder' ? 'folder-' + slug(viewName()) : st.view === 'favorites' ? 'favorites' : st.chip === 'all' ? 'library' : st.chip) },
    { label: 'Sync now', icon: 'refresh-cw', act: () => startSync() }, { label: coarse() ? 'Gestures' : 'Keyboard shortcuts', icon: 'keyboard', hint: '?', act: helpDialog },
    { sep: true }, { label: 'Mockup states…', icon: 'circle-help', act: () => openSettings('states') }], 'Library actions'),
  'stage-back': closeStage,
  prev: () => navAsset(-1), next: () => navAsset(1),
  info: toggleInfo,
  'stage-menu': b => { const c = st.cur; if (!c) return; menu(b, [{ label: 'Copy image', icon: 'copy', act: () => toast('Image copied. Paste or drop it into PixelLab.') },
    { label: 'Copy prompt', icon: 'copy', act: () => copyText(curAsset().prompt || '', 'Prompt copied') },
    (c.cat === 'images' || c.cat === 'maps') && { label: 'Reload from PixelLab', icon: 'refresh-cw', act: () => toast(`Reloaded ${c.a.name} from PixelLab.`) },
    document.fullscreenEnabled && { label: document.fullscreenElement ? 'Exit fullscreen' : 'Fullscreen', icon: 'maximize-2', hint: 'F', act: toggleFullscreen },
    { label: coarse() ? 'Gestures' : 'Keyboard shortcuts', icon: 'keyboard', hint: '?', act: helpDialog }].filter(Boolean), 'Asset actions'); },
  'backdrop-menu'(b) { $('#swatches').classList.toggle('open'); b.setAttribute('aria-expanded', $('#swatches').classList.contains('open')); const f = $('#swatches [aria-checked=true]'); if (f && $('#swatches').classList.contains('open')) f.focus(); },
  'zoom-fit'() { S.zoom = 'fit'; applyZoom(); }, 'zoom-1'() { S.zoom = 1; applyZoom(); },
  'zoom-out': () => zoomBy(-1), 'zoom-in': () => zoomBy(1),
  'step-back': () => stepFrame(-1), 'step-fwd': () => stepFrame(1),
  play: () => setPlaying(!S.playing),
  loop(b) { S.loop = !S.loop; b.setAttribute('aria-pressed', S.loop); if (S.playing) startPlayer(); },
  fps(b) {
    const html = () => `<div class="stepper"><button type="button" class="btn icon" data-d="-1" aria-label="Slower"${effFps() <= 1 ? ' disabled' : ''}>${icon('minus')}</button><output class="px" aria-live="polite">${effFps()}</output><span>fps</span><button type="button" class="btn icon" data-d="1" aria-label="Faster"${effFps() >= 30 ? ' disabled' : ''}>${icon('plus')}</button></div><button type="button" class="btn outline block" data-reset>Reset to 8 fps</button>`;
    popover(b, html(), { cls: 'fps-pop', label: 'Playback speed', focus: '[data-d="1"]', onClick(e, el) {
      const s = e.target.closest('[data-d]'), r = e.target.closest('[data-reset]'); if (!s && !r) return;
      const v = r ? 8 : clamp(effFps() + +s.dataset.d, 1, 30);
      if (v === 8) delete S.fps[fpsKey()]; else S.fps[fpsKey()] = v;
      if (S.playing) startPlayer(); renderTransport(); renderInspectorSoft();
      const keep = s ? `[data-d="${s.dataset.d}"]` : '[data-reset]'; el.innerHTML = html(); const k = el.querySelector(keep); if (k) k.focus();
    } });
  },
  'fps-reset'() { delete S.fps[fpsKey()]; if (S.playing) startPlayer(); renderTransport(); renderInspector(); },
  'compass-toggle'(b) { const on = $('#compass').classList.toggle('open'); b.setAttribute('aria-expanded', on); if (on) { const f = $('#compass [aria-checked=true]'); if (f) f.focus(); } },
  'grid-toggle'(b) { S.grid = !S.grid; b.setAttribute('aria-pressed', S.grid); renderTileGrid(); applyZoom(); $('#tile-info').textContent = S.grid ? 'Point at a tile for its info' : ''; },
  'dl-default'() { const it = dlItems(st.cur)[0]; startExport({ label: it.file, total: it.files, n: 1 }); },
  'dl-menu': b => downloadMenu(b, st.cur),
  fav: () => toggleFav(st.cur),
  'add-folder': b => folderPicker(b, [st.cur.id]),
  'copy-id'() { const a = curAsset(); copyText(st.cur.cat === 'images' ? a.meta.ref : a.id, 'Asset ID copied'); },
  'sel-clear': exitSel, 'sel-all': selectAll, 'sel-fav': bulkFav,
  'sel-folder': b => folderPicker(b, selCards().map(c => c.id)),
  'sel-remove'() { const f = folderById(st.folderId); if (f) removeFrom(f, selCards().map(c => c.id)); },
  'sel-download': selDownload,
  'export-folder'() { const f = folderById(st.folderId); exportDialogMulti(folderCards(f), 'folder-' + slug(f.name)); },
  'folder-menu': b => folderMenu(b, folderById(st.folderId)),
  'remove-unavail'() {
    const u = unavailIds();
    if (st.view === 'favorites') u.forEach(id => st.favs.delete(id)); else { const f = folderById(st.folderId); f.ids = f.ids.filter(id => !u.includes(id)); }
    toast(`Removed ${plural(u.length, 'unavailable item')}.`); afterOrgChange();
  },
  'new-folder': () => folderNameDialog(null),
  'sync-pop': b => syncPopover(b), 'ip-pop': b => inProgressPopover(b),
  'sync-now': () => startSync(),
  'export-cancel': () => finishExport(true),
  'demo-clear'() { st.demo.cors = st.demo.offlineEmpty = false; renderAll(); },
  'clear-search'() { $('#q').value = ''; st.q = ''; renderAll(); $('#q').focus(); },
  'search-all'() { setChip('all'); },
  backup: () => toast(`Saved vitrine-backup-${today}.json.`),
  protect() { st.protect = true; renderBody(); toast('Protected from automatic clearing.'); },
  'tip-dismiss'() { st.tipDismissed = true; renderBody(); }
};
function copyText(text, msg) {
  try { if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => { /* file:// may refuse; the toast still confirms in the mockup */ }); } catch (e) { /* ignore */ }
  toast(msg, null, 'check');
}

// ---------------------------------------------------------------- events
function onClick(e) {
  const t = e.target;
  if (t.closest('dialog, .pop')) return;
  const chip = t.closest('[data-chip]'); if (chip) return setChip(chip.dataset.chip);
  const bd = t.closest('[data-bd]'); if (bd && bd.closest('#swatches')) { setBackdrop(bd.dataset.bd); if (mobile()) $('#swatches').classList.remove('open'); return; }
  const dir = t.closest('[data-dir]'); if (dir) { setDir(dir.dataset.dir); return; }
  const an = t.closest('[data-anim]'); if (an) return setAnim(+an.dataset.anim - 1);
  const ss = t.closest('[data-state]'); if (ss) return setStateIdx(+ss.dataset.state);
  const fr = t.closest('[data-frame]'); if (fr) return seekFrame(+fr.dataset.frame);
  const fd = t.closest('[data-fdir]'); if (fd) return setDir(fd.dataset.fdir);
  const info = t.closest('[data-info]'); if (info) { st.info = info.dataset.info === '1'; renderToolbar(); return; }
  const tag = t.closest('[data-tag]'); if (tag) { const q = $('#q'); q.value = '#' + tag.dataset.tag; st.q = q.value; closeStage(); setChip('all'); return; }
  const ar = t.closest('[data-anim-row]'); if (ar) { setAnim(+ar.dataset.animRow); setPlaying(true); return; }
  const cp = t.closest('[data-copy]'); if (cp) { copyText(copyMap[cp.dataset.copy] || '', cap(cp.dataset.copy) + ' copied'); cp.innerHTML = icon('check') + '<span>Copied</span>'; setTimeout(() => { if (cp.isConnected) cp.innerHTML = icon('copy') + '<span>Copy</span>'; }, 2000); return; }
  const fm = t.closest('[data-fmenu]'); if (fm) return folderMenu(fm, folderById(fm.dataset.fmenu));
  const a = t.closest('[data-act]');
  if (a && ACTIONS[a.dataset.act]) {
    if (pop && pop.anchor === a) { closePop(true); return; }
    if (a.tagName === 'A' && a.dataset.act === 'skip') return;
    e.preventDefault(); ACTIONS[a.dataset.act](a, e);
  }
  if (!t.closest('#compass, #dir-btn')) { $('#compass').classList.remove('open'); $('#dir-btn').setAttribute('aria-expanded', 'false'); }
  if (!t.closest('#swatches, .bd-btn')) $('#swatches').classList.remove('open');
}
let lp = null, suppressClick = false;
function wireGrid() {
  const body = $('#sheet-body');
  body.addEventListener('click', e => {
    const li = e.target.closest('#grid .cell'); if (!li || li.classList.contains('skel')) return;
    const key = li.dataset.key;
    if (e.target.closest('.cb')) { e.preventDefault(); return toggleSel(key); }
    if (e.target.closest('.hb')) { e.preventDefault(); return toggleFav(byKey[key]); }
    if (e.target.closest('.mb')) { e.preventDefault(); return cardMenu(li, e.target.closest('.mb')); }
    if (!e.target.closest('.card')) return;
    e.preventDefault(); e.stopPropagation();
    if (suppressClick) { suppressClick = false; return; }
    if (e.shiftKey && st.anchor) return rangeSel(key);
    if (e.ctrlKey || e.metaKey) return toggleSel(key);
    if (st.selMode) return toggleSel(key);
    activateCard(li, 'pointer');
  });
  body.addEventListener('contextmenu', e => {
    const li = e.target.closest('#grid .cell'); if (!li || li.classList.contains('skel')) return;
    e.preventDefault();
    if (!lp && !suppressClick && e.pointerType !== 'touch' && !coarse()) cardMenu(li, li);
  });
  body.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    const li = e.target.closest('#grid .cell'); if (!li || li.classList.contains('skel')) return;
    lp = { x: e.clientX, y: e.clientY, t: setTimeout(() => {
      lp = null; suppressClick = true; setTimeout(() => { suppressClick = false; }, 700);
      toggleSel(li.dataset.key, true); if (navigator.vibrate) navigator.vibrate(10);
    }, 500) };
  });
  const cancelLp = () => { if (lp) { clearTimeout(lp.t); lp = null; } };
  body.addEventListener('pointermove', e => { if (lp && Math.hypot(e.clientX - lp.x, e.clientY - lp.y) > 10) cancelLp(); });
  body.addEventListener('pointerup', cancelLp); body.addEventListener('pointercancel', cancelLp);
  let hoverLi = null;
  body.addEventListener('mouseover', e => {
    const li = e.target.closest('#grid .cell:not(.skel)');
    if (li === hoverLi) return;
    if (hoverLi) dwell(hoverLi, false);
    hoverLi = li; st.hover = li ? byKey[li.dataset.key] : null;
    if (li && fine()) dwell(li, true);
    renderStatus();
  });
  body.addEventListener('mouseleave', () => { if (hoverLi) dwell(hoverLi, false); hoverLi = null; st.hover = null; renderStatus(); });
  body.addEventListener('focusin', e => { const li = e.target.closest('#grid .cell'); if (li) dwell(li, true); });
  body.addEventListener('focusout', e => { const li = e.target.closest('#grid .cell'); if (li && li !== hoverLi) dwell(li, false); });
}
function wireStage() {
  const wrap = $('#stage-wrap'), pane = $('#stage');
  let drag = null, wheelAcc = 0;
  wrap.addEventListener('pointerdown', e => {
    if (e.button) return;
    drag = { x: e.clientX, y: e.clientY, sl: wrap.scrollLeft, st: wrap.scrollTop, pan: wrap.classList.contains('pannable'), type: e.pointerType };
    if (drag.pan) wrap.setPointerCapture(e.pointerId);
  });
  wrap.addEventListener('pointermove', e => { if (drag && drag.pan) { wrap.scrollLeft = drag.sl - (e.clientX - drag.x); wrap.scrollTop = drag.st - (e.clientY - drag.y); } });
  wrap.addEventListener('pointerup', e => {
    if (!drag) return;
    const d = drag, dx = e.clientX - d.x, dy = e.clientY - d.y; drag = null;
    if (d.pan || d.type === 'mouse') return;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) navAsset(dx < 0 ? 1 : -1);
    else if (dy > 80 && mobile()) closeStage();
    else if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && st.layout === 'compact') pane.classList.toggle('chrome-hidden');
  });
  wrap.addEventListener('pointercancel', () => { drag = null; });
  wrap.addEventListener('wheel', e => {
    e.preventDefault(); wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) >= 50) { zoomBy(wheelAcc < 0 ? 1 : -1, e); wheelAcc = 0; }
  }, { passive: false });
  wrap.addEventListener('dblclick', dblZoom);
  $('#scrub').addEventListener('input', e => seekFrame(+e.target.value));
  const tg = $('#tile-grid');
  const showTile = e => { const s = e.target.closest('[data-t]'); if (s) $('#tile-info').textContent = tileInfo(+s.dataset.t); };
  tg.addEventListener('mouseover', showTile); tg.addEventListener('click', showTile);
  ['pointermove', 'pointerdown', 'keydown'].forEach(ev => pane.addEventListener(ev, pokeChrome, { passive: true }));
  new ResizeObserver(() => requestAnimationFrame(() => applyZoom())).observe(wrap);
  new ResizeObserver(() => fitIn($('#filmstrip'))).observe($('#filmstrip'));
}
function rovingKeys(e) {
  const g = e.target.closest && e.target.closest('[role=radiogroup], [role=tablist]');
  if (!g || g.id === 'compass') return false;
  const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
  if (step == null && e.key !== 'Home' && e.key !== 'End') return false;
  const items = $$('[role=radio]:not([disabled]), [role=tab]', g), cur = e.target.closest('[role=radio], [role=tab]'), i = items.indexOf(cur);
  if (i < 0) return false;
  const j = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + step + items.length) % items.length;
  e.preventDefault();
  const el = items[j], attr = Array.from(el.attributes).find(a => a.name.startsWith('data-') && a.name !== 'data-hide');
  el.focus(); el.click();
  const again = attr && document.querySelector(`[${attr.name}="${attr.value}"]`);
  if (again && again !== document.activeElement) again.focus();
  return true;
}
function compassKeys(e) {
  const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
  if (!d) return false;
  e.preventDefault();
  // Nearest enabled direction that lies in the pressed direction (primary axis first), so gaps from disabled diagonals never trap focus.
  const pos = dir => { const r = COMPASS.findIndex(rw => rw.includes(dir)); return [r, COMPASS[r].indexOf(dir)]; };
  const [r0, c0] = pos(S.dir);
  let best = null, bestScore = Infinity;
  availDirs().filter(dir => CW.includes(dir) && dir !== S.dir).forEach(dir => {
    const [r, c] = pos(dir), prim = d[0] ? (r - r0) * d[0] : (c - c0) * d[1], score = prim + 2 * Math.abs(d[0] ? c - c0 : r - r0);
    if (prim > 0 && score < bestScore) { bestScore = score; best = dir; }
  });
  if (best) { setDir(best); $('#compass [aria-checked=true]').focus(); }
  return true;
}
function menuKeys(e) {
  const items = $$('[role^=menuitem]:not([disabled]), .pf-row', pop.el); if (!items.length) return;
  const i = items.indexOf(document.activeElement);
  const j = { ArrowDown: i + 1, ArrowUp: i - 1, Home: 0, End: items.length - 1 }[e.key];
  if (j != null) { e.preventDefault(); items[(j + items.length) % items.length].focus(); }
  if (e.key === 'Tab' && pop.o.role === 'menu') closePop();
}
function onKey(e) {
  const t = e.target, k = e.key;
  if (t.closest && t.closest('#compass') && compassKeys(e)) return;
  if (rovingKeys(e)) return;
  if (document.querySelector('dialog[open]')) return;          // native dialogs own Esc and focus
  if (pop) { if (k === 'Escape') { e.preventDefault(); closePop(true); } else menuKeys(e); return; }
  const typing = t.matches && t.matches('input:not([type=range]):not([type=checkbox]):not([type=radio]), textarea, select');
  if (k === 'Escape') {
    if (typing) return;
    if ($('#compass.open') || $('#swatches.open')) { $('#compass').classList.remove('open'); $('#swatches').classList.remove('open'); return; }
    if (mobile() && st.stageOpen) { e.preventDefault(); return closeStage(); }
    if (!mobile() && st.cur && t.closest && t.closest('#stage') && cellEl(st.cur.key)) { e.preventDefault(); return focusCell(cellEl(st.cur.key)); }   // C: the stage never closes; Esc hands focus back to the sheet
    if (st.selMode) { e.preventDefault(); return exitSel(); }
    if (root.classList.contains('searching')) root.classList.remove('searching');
    return;
  }
  if (typing) return;
  const card = t.closest && t.closest('#grid .cell');
  const inStage = !!(t.closest && t.closest('#stage')) || (mobile() && st.stageOpen);
  const mod = e.ctrlKey || e.metaKey;
  const ownsArrows = t.closest && t.closest('input[type=range], .filmstrip');
  if (mod && k.toLowerCase() === 'a' && (card || (t.closest && t.closest('#sheet')))) { e.preventDefault(); return selectAll(); }
  if (card) {
    const lis = gridCells(), i = lis.indexOf(card), n = lis.length; let j = null;
    if (k === 'ArrowRight') j = i + 1; else if (k === 'ArrowLeft') j = i - 1; else if (k === 'ArrowDown') j = i + st.cols; else if (k === 'ArrowUp') j = i - st.cols;
    else if (k === 'Home') j = 0; else if (k === 'End') j = n - 1;
    if (j != null) { e.preventDefault(); j = clamp(j, 0, n - 1); if (j !== i) focusCell(lis[j], true); return; }
    if (k === 'Enter') { e.preventDefault(); if (st.selMode) toggleSel(card.dataset.key); else activateCard(card, 'key'); return; }
    if (k === ' ') { e.preventDefault(); if (st.selMode) toggleSel(card.dataset.key); else if (!mobile()) setPlaying(!S.playing); return; }
    if (k === 'ContextMenu' || (k === 'F10' && e.shiftKey)) { e.preventDefault(); return cardMenu(card); }
  }
  if (inStage && st.cur && !ownsArrows && !mod) {
    const box = t.id === 'stage-box', wrap = $('#stage-wrap');
    if (e.shiftKey && k.startsWith('Arrow')) { e.preventDefault(); const dx = k === 'ArrowLeft' ? -1 : k === 'ArrowRight' ? 1 : 0, dy = k === 'ArrowUp' ? -1 : k === 'ArrowDown' ? 1 : 0; wrap.scrollBy(dx * wrap.clientWidth * 0.1, dy * wrap.clientHeight * 0.1); return; }
    if (k === 'ArrowLeft' || k === 'ArrowRight') { e.preventDefault(); return navAsset(k === 'ArrowLeft' ? -1 : 1); }
    if (box && (k === 'Home' || k === 'End')) { e.preventDefault(); return seekFrame(k === 'Home' ? 0 : S.frames.length - 1); }
    if (k === ' ' && (box || t.id === 'stage-title' || t === document.body)) { e.preventDefault(); return setPlaying(!S.playing); }
  }
  if (!st.shortcuts || mod || e.altKey) return;
  const sv = stageVisible() && st.cur;
  const keys = {
    '/': focusSearch, '?': helpDialog,
    x: () => card && toggleSel(card.dataset.key), l: () => favContext(card), d: () => downloadContext(card),
    '+': () => inStage ? zoomBy(1) : sizeStep(1), '=': () => inStage ? zoomBy(1) : sizeStep(1), '-': () => inStage ? zoomBy(-1) : sizeStep(-1),
    z: () => sv && toggleFit(), ',': () => sv && stepFrame(-1), '.': () => sv && stepFrame(1), '[': () => sv && rotateDir(-1), ']': () => sv && rotateDir(1),
    i: () => sv && toggleInfo(), f: () => sv && toggleFullscreen()
  };
  const fn = keys[k.length === 1 ? k.toLowerCase() : k] || keys[k];
  if (fn) { e.preventDefault(); fn(); }
}

// ---------------------------------------------------------------- boot
function boot() {
  $$('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });
  $$('[data-art]').forEach(el => { el.outerHTML = el.dataset.art === 'mark' ? markSvg(+el.dataset.cell) : pixels(WORD, +el.dataset.cell, 'Vitrine'); });
  if (Q.get('theme')) st.theme = Q.get('theme');
  if (SIZE_ORDER.includes(Q.get('size'))) st.size = Q.get('size');
  if (Q.get('q')) { st.q = Q.get('q'); $('#q').value = st.q; }
  (Q.get('state') || '').split(',').filter(Boolean).forEach(k => { st.demo[k.replace(/-(\w)/g, (m0, ch) => ch.toUpperCase())] = true; });
  if (st.demo.partial) st.failed.add('maps');
  applyTheme(); detectLayout();
  setBackdrop(st.defaultBackdrop);
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKey);
  $('#connect-form').addEventListener('submit', onConnect);
  $('#remember').addEventListener('change', e => { $('#remember-help').textContent = e.target.checked ? "Saved in this browser so you don't need to paste it again. Anyone using this browser profile could use it, so don't turn this on for shared computers." : "Kept in this tab only. You'll paste it again in a new tab."; });
  $('#q').addEventListener('input', runSearch);
  $('#q').addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    e.preventDefault(); e.stopPropagation();
    if (e.target.value) { e.target.value = ''; st.q = ''; renderAll(); } else { e.target.blur(); root.classList.remove('searching'); }
  });
  wireGrid(); wireStage();
  window.addEventListener('popstate', applyRoute);
  window.addEventListener('hashchange', applyRoute);
  window.addEventListener('resize', () => { if (detectLayout()) { if (st.connected) { if (!mobile() && !st.cur) setCurrent(viewCards()[0] || null, { noHash: true }); renderAll(); renderStage(); } } placePop(); });
  let lastY = 0;
  window.addEventListener('scroll', () => {
    if (!mobile() || st.stageOpen) return;
    const y = scrollY;
    if (y > lastY + 4 && y > 120) root.classList.add('chrome-up'); else if (y < lastY - 4) root.classList.remove('chrome-up');
    lastY = y;
  }, { passive: true });
  new ResizeObserver(() => requestAnimationFrame(() => layoutGrid())).observe($('#sheet-body'));
  (function watchDpr() {                                 // re-fit all art when DPR changes (browser zoom, monitor move)
    matchMedia(`(resolution: ${devicePixelRatio}dppx)`).addEventListener('change', () => { layoutGrid(true); fitIn(document); applyZoom(); watchDpr(); }, { once: true });
  })();
  [mqCoarse, mqHover].forEach(mq => mq.addEventListener('change', () => { detectLayout(); }));
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopPlayer(); else if (S.playing && stageVisible()) startPlayer(); });

  const demo = Q.get('demo');
  let session = false;
  try { session = sessionStorage.getItem('vitrine-c-session') === '1'; } catch (e) { /* ignore */ }
  if (['connect', 'welcome', 'invalid'].includes(demo) || (!demo && !session)) return showConnect(demo || '');
  if (demo === 'sync') enterApp('slow'); else enterApp(false);
  const pick = s => cards.find(c => slug(c.title) === s) || cards.find(c => slug(c.a.name) === s);
  const routeTo = h => { try { history.replaceState(null, '', h); } catch (e) { /* ignore */ } applyRoute(); };
  if (demo === 'folder') routeTo('#/folder/' + (Q.get('id') || 'fld_01'));
  if (demo === 'collections' || demo === 'favorites') routeTo('#/' + demo);
  const asset = Q.get('asset') && pick(Q.get('asset'));
  if (asset) { if (mobile()) { setCurrent(asset, { noHash: true }); if (demo === 'stage') setStageOpen(true); } else setCurrent(asset); }
  if (demo === 'select' || demo === 'export') {
    setChip('objects');
    viewCards().slice(0, 12).forEach(c => st.sel.add(c.key)); st.selMode = true;
    gridCells().forEach(li => refreshCell(li.dataset.key)); renderSel();
    if (demo === 'export') exportDialogMulti(selCards(), 'selection-' + st.sel.size);
  }
  if (demo === 'export1') { const c = asset || pick('android-courier'); if (mobile()) setCurrent(c, { noHash: true }); else setCurrent(c); exportDialogSingle(c); }
  if (demo === 'settings' || demo === 'states') openSettings(demo === 'states' ? 'states' : Q.get('tab'));
  if (demo === 'help') helpDialog();
  if (demo === 'reconnect') reconnectDialog();
  if (demo === 'dlmenu') { const c = asset || st.cur; if (c) downloadMenu($('[data-act=dl-menu]'), c); }
  if (demo === 'search') focusSearch();
}
boot();
})();
