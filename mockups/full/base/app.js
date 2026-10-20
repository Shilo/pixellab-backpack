// Vitrine full mockup base (GlassKit option 2): shared data, icons and GlassKit building blocks for every frame file.
// index.html#<frame> draws one frame; nothing is interactive. "&stock" drops the app's dark scrim under GlassKit's glass,
// "&stress" shifts the library down so the bright tileset and map row sits under the dock (contrast checks only).
const D = window.SAMPLE_DATA, byId = Object.fromEntries(D.assets.map(a => [a.id, a]));
const done = D.assets.filter(a => a.status === 'completed'); // the grid shows completed assets only (08 §9)
const key = p => p.split('/').pop().replace('.png', '');
const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
const I = {
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
  lib: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  more: '<svg viewBox="0 0 24 24" class="dots"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4.5v11M7 11l5 5 5-5M5 19.5h14"/></svg>',
  // GlassKit fills every icon inside .glass-btn--primary (stroke-width 0), so the primary button needs solid glyphs.
  downFill: '<svg viewBox="0 0 24 24"><path d="M11 4h2v9.6l3.3-3.3 1.4 1.4L12 17.4l-5.7-5.7 1.4-1.4 3.3 3.3zM5 18.6h14v2H5z"/></svg>',
  caretFill: '<svg viewBox="0 0 24 24"><path d="M7.4 9.6h9.2L12 14.6z"/></svg>',
  open: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M10 14l4-4M10.5 10H14v3.5"/></svg>',
  folder: '<svg viewBox="0 0 24 24"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M12 10.5v5M9.5 13h5"/></svg>',
  check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/></svg>',
  tick: '<svg viewBox="0 0 24 24"><path d="m5.5 12.5 4.2 4.2 8.8-9.2"/></svg>',
  boxTick: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>',
  clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
  sync: '<svg viewBox="0 0 24 24"><path d="M19.5 12a7.5 7.5 0 0 1-13.2 4.9M4.5 12a7.5 7.5 0 0 1 13.2-4.9M17.7 3.5v3.6h-3.6M6.3 20.5v-3.6h3.6"/></svg>',
  ext: '<svg viewBox="0 0 24 24"><path d="M8 16 16 8M9.5 8H16v6.5"/></svg>',
  gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"/></svg>',
  keys: '<svg viewBox="0 0 24 24"><rect x="3.5" y="6.5" width="17" height="11" rx="2.5"/><path d="M7 10h.1M10.5 10h.1M14 10h.1M17 10h.1M8 14h8"/></svg>',
};

// Library tiles: [label, count, cells, folder?]. A cell is "asset" or "asset|fit|s" (see art.js).
const TYPES = { Characters: ['character'], Objects: ['object'], Images: ['creator_image', 'vfx'],
  'Tilesets & tiles': ['tileset_topdown', 'tileset_sidescroller', 'tiles_pro', 'tile_isometric'], Maps: ['map', 'map_object'], UI: ['ui_asset', 'font'] };
const n = name => done.filter(a => TYPES[name].includes(a.type)).length;
const fn = id => D.folders.find(f => f.id === id).assetIds.filter(i => byId[i].status === 'completed').length;
const T = [
  ['Characters', n('Characters'), ['char-android-walk-east-f00', 'char-orb-mage-south', 'char-hooded-mage-south-east', 'char-hooded-mage-detailed-south-west']],
  ['Objects', n('Objects'), ['obj-bear-trap-open', 'obj-treasure-chest-closed', 'obj-crimson-lance', 'item-red-health-potion', 'item-iron-helmet', 'item-lantern', 'item-ruby-ring']],
  ['Images', n('Images'), ['creator-goblin-idle-f00', 'creator-white-bird-east', 'vfx-meteor-f12', 'creator-slime-sheet|cover|1', 'creator-fire-skill-icons|cover|1', 'creator-food-atlas|cover|1', 'creator-block-textures-16|cover|2']],
  ['Tilesets & tiles', n('Tilesets & tiles'), ['tileset-topdown-dirt-grass-detailed|cover|7', 'tileset-topdown-stone-floor-wall|cover|7', 'iso-grass-block', 'tileset-side-frozen-ledge|full|0', 'iso-stone-slab', 'tilespro-wooden-stairs|full|0', 'tileset-side-dirt-grass|full|0']],
  ['Maps', n('Maps'), ['map-meadow-ruins|cover|2', 'mapobj-ruined-apartment', 'mapobj-wooden-staircase-west', 'mapobj-stone-steps-east']],
  ['UI', n('UI'), ['ui-skill-icon-frames|cover|2', 'ui-gilded-panel-kit|cover|1', 'ui-stone-9slice-kit|cover|1', 'ui-rts-command-bar|cover|1', 'ui-fantasy-hud|cover|1', 'ui-rts-components|cover|1', 'font-tiny-mono-atlas|cover|2']],
];
const M = [
  ['Favorites', D.favorites.length, ['char-android-walk-south-f00', 'vfx-meteor-f12', 'map-meadow-ruins|cover|2', 'tileset-topdown-dirt-grass-detailed|cover|4', 'creator-goblin-idle-f00', 'tileset-side-frozen-ledge|cover|2', 'obj-bear-trap-open'], 1],
  ['Hero party', fn('fld_01'), ['char-orb-mage-south-east', 'char-hooded-mage-detailed-south', 'obj-crimson-lance', 'char-android-walk-south-f00', 'item-iron-longsword', 'item-oak-magic-staff-crystal', 'item-mage-robe'], 1],
  ['Dungeon kit', fn('fld_02'), ['obj-treasure-chest-open', 'obj-bear-trap-closed', 'tileset-topdown-stone-floor-wall|cover|7', 'mapobj-wooden-staircase-west', 'iso-stone-slab', 'tileset-side-castle|cover|2', 'tilespro-wooden-stairs|cover|4'], 1],
  ['UI pack', fn('fld_03'), ['ui-fantasy-hud|cover|1', 'ui-skill-icon-frames|cover|2', 'creator-fire-skill-icons|cover|2', 'ui-rts-components|cover|1', 'font-tiny-mono-atlas|cover|2', 'creator-cyan-skill-icons|cover|1', 'creator-skill-icons-pro|cover|1'], 1],
  ['1-bit platformer', fn('fld_04'), ['tileset-side-castle|full|0', 'tileset-side-frozen-ledge|full|0', 'tileset-side-fang-ridge|full|0', 'tileset-side-rooted-soil|cover|2', 'tileset-side-worn-stone|cover|2'], 1],
  ['Favorites to export', fn('fld_05'), ['vfx-meteor-f12', 'creator-goblin-idle-f00', 'creator-slime-sheet|cover|1', 'char-android-walk-south-f00', 'map-meadow-ruins|cover|1', 'tileset-topdown-dirt-grass-detailed|cover|4'], 1],
];
const mcell = c => { const [a, fit, s] = c.split('|'); return `<i data-art="${a}" data-pad="${fit === 'full' ? 0.1 : 0.06}"${fit ? ` data-fit="${fit}" data-s="${s}"` : ''}></i>`; };
// Folders (yours) are GlassKit's frosted glow card; types (automatic) stay a dark app tile, so the two read differently.
const tile = ([name, count, cells, folder]) => {
  const big = cells.length <= 4 ? cells : cells.slice(0, 3), rest = cells.length <= 4 ? [] : cells.slice(3);
  return `<a class="tile${folder ? ' folder' : ''}"><div class="mosaic${folder ? ' glass-card glass-card--glow' : ''}">${big.map(mcell).join('')}${rest.length ? `<div class="mini">${rest.map(mcell).join('')}</div>` : ''}</div>
    <div class="tlabel"><b>${name}</b><span>${count}</span></div></a>`;
};

// Asset cells: square, integer-scaled art, quiet name. Selection uses GlassKit's checkbox.
const SHEET = ['tileset_topdown', 'tileset_sidescroller', 'tiles_pro', 'font', 'ui_asset'];
const fit = a => SHEET.includes(a.type) ? 'data-fit="full" data-pad="0.1"' : a.type === 'map' ? 'data-fit="cover" data-s="2"'
  : a.type === 'creator_image' && a.width >= 256 ? 'data-fit="cover" data-s="1"' : 'data-pad="0.17"';
const label = a => a.name + (a.meta.state_name ? ` <small>· ${a.meta.state_name}</small>` : '');
const chk = (a, on) => `<label class="glass-checkbox vt-chk"><input class="glass-checkbox__input" type="checkbox"${on ? ' checked' : ''} aria-label="Select ${a.name}"><span class="glass-checkbox__box">${I.boxTick}</span></label>`;
const cell = (a, sel) => `<div class="cell${sel === true ? ' sel' : ''}" data-id="${a.id}"><div class="sq"><i data-art="${key(a.thumb)}" ${fit(a)}></i>${sel != null ? chk(a, sel) : ''}</div><span class="nm">${label(a)}</span></div>`;
const newest = list => list.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
const objects = newest(done.filter(a => a.type === 'object'));

// GlassKit pieces. The dock is GlassKit's floating tab bar inside its dock wrapper; vt-scrim adds the app's dark base under the glass.
const item = (inner, cls = '', attrs = '') => `<button class="glass-tab-bar__item${cls ? ' ' + cls : ''}"${attrs}>${inner}</button>`;
const ico = svg => `<span class="glass-tab-bar__icon">${svg}</span>`, lbl = t => `<span class="glass-tab-bar__label">${t}</span>`;
const dock = (inner, cls = '') => `<div class="glass-tab-bar-dock${cls ? ' ' + cls : ''}"><nav class="glass-tab-bar glass-tab-bar--floating vt-dock vt-scrim">${inner}</nav></div>`;
const searchField = (ph, k, focus) => `<div class="glass-search vt-field${focus ? ' focus' : ''}"><svg class="glass-search__icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>
  <input class="glass-input" type="search" placeholder="${ph}" aria-label="Search"${focus ? '' : ' readonly'}><kbd>${k}</kbd></div>`;
const row = (title, trailing = '', cls = '', sub = '') => `<li class="glass-list__item glass-list__item--interactive${cls ? ' ' + cls : ''}" role="menuitem"><div class="glass-list__content"><div class="glass-list__title">${title}</div>${sub ? `<div class="glass-list__subtitle">${sub}</div>` : ''}</div>${trailing ? `<div class="glass-list__trailing">${trailing}</div>` : ''}</li>`;
const val = t => `<span class="glass-list__value">${t}</span>`;
const menu = (groups, w) => h(`<div class="glass-popover glass-popover--start is-open vt-menu vt-scrim hi${w ? ' w' + w : ''}" role="menu">${groups.map(g => `<ul class="glass-list glass-list--bare">${g.join('')}</ul>`).join('<hr class="glass-divider">')}</div>`);
const overlay = (inner = '') => `<div class="glass-modal-overlay is-active">${inner}</div>`;

const add = (...els) => els.forEach(e => document.body.append(typeof e === 'string' ? h(e) : e));
const dockHome = dock(item(ico(I.lib) + lbl('Library'), 'is-active', ' aria-current="page"') + searchField(`Search ${done.length} assets`, '/')
  + item(ico(I.more), 'vt-icon', ' aria-label="More"'));
const dockCat = dock(item(ico(I.back) + lbl('Library'), 'vt-back') + '<span class="vr"></span>'
  + `<span class="crumb">Objects<span>${objects.length}</span></span>` + item(ico(I.search), 'vt-icon', ' aria-label="Search"')
  + item(lbl('Select')) + item(ico(I.more), 'vt-icon', ' aria-label="More"'));

function home() { add(`<main class="library">${T.map(tile).join('')}<div class="sec mine">Favorites and folders</div>${M.map(tile).join('')}</main>`); }
function category(selected) {
  add(`<main class="grid">${objects.map(a => cell(a, selected ? selected.includes(a.id) : undefined)).join('')}</main>`);
}
function viewer(info) {
  const a = byId.chr_0004;
  document.body.classList.add('viewer'); if (info) document.body.classList.add('info');
  add(`<div class="stage"><i data-art="char-android-walk-east-f03" data-fit="full" data-pad="0"></i></div>`,
    `<button class="glass-pill vt-scrim fab close" aria-label="Close">${I.x}</button>`,
    `<div class="fab vtitle"><b>${a.name}</b><span>Character</span></div>`,
    `<div class="fab caps"><nav class="glass-tab-bar glass-tab-bar--floating vt-caps vt-scrim" aria-label="Asset actions">${item(ico(I.heart), 'vt-icon', ' aria-label="Favorite"')}${item(ico(I.info), 'vt-icon' + (info ? ' is-active' : ''), ' aria-label="Info"' + (info ? ' aria-pressed="true"' : ''))}${item(ico(I.more), 'vt-icon', ' aria-label="More"')}</nav></div>`,
    dock(item(lbl('Walk · East') + ico(I.chev), 'vt-chip') + `<div class="vt-split"><button class="glass-btn glass-btn--primary glass-btn--auto">${I.downFill}Download GIF</button><button class="glass-btn glass-btn--primary glass-btn--auto" aria-label="Download options">${I.caretFill}</button></div>`, 'vdock'));
  if (info) add(`<aside class="glass-sheet glass-sheet--inline vt-panel vt-scrim hi" aria-label="Info">
    <div><h2 class="glass-sheet__title">${a.name}</h2><p class="vt-sub">Character</p></div>
    <ul class="glass-list">${[['Size', '128 × 128 px'], ['Directions', '4'], ['Animations', 'Walk'], ['Frames', '8 per direction'], ['View', 'Low top-down'], ['Created', 'Jul 1, 2026']]
      .map(([k, v]) => `<li class="glass-list__item"><div class="glass-list__content"><div class="glass-list__title">${k}</div></div><div class="glass-list__trailing">${val(v)}</div></li>`).join('')}</ul>
    <div><div class="vt-gh"><span class="glass-list__section-header">Prompt</span><button class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto">Copy</button></div>
      <div class="glass-list vt-prompt"><div class="glass-list__item"><div class="glass-list__content"><div class="glass-list__title">${a.prompt}</div></div></div></div></div>
    <div><div class="vt-gh"><span class="glass-list__section-header">In folders</span></div><ul class="glass-list">
      <li class="glass-list__item glass-list__item--interactive"><div class="glass-list__content"><div class="glass-list__title">Hero party</div></div><div class="glass-list__trailing">${I.right}</div></li>
      <li class="glass-list__item glass-list__item--interactive"><div class="glass-list__content"><div class="glass-list__title">Favorites to export</div></div><div class="glass-list__trailing">${I.right}</div></li></ul></div>
    <a class="glass-btn glass-btn--tertiary glass-btn--sm vt-ext" href="#">Open in PixelLab ↗</a></aside>`);
}
const at = (el, x, y) => { el.style.left = x + 'px'; el.style.top = y + 'px'; return el; };

// Frame registry. Each frames-<group>.js adds FRAMES['<id>'] = () => { add(...) } or () => '<html string>';
// index.html lists the files after app.js. The hash picks one frame after every script has run.
window.FRAMES = {};
addEventListener('DOMContentLoaded', () => {
  const [name, ...flags] = location.hash.slice(1).split('&');
  const frame = FRAMES[name || '01-home'];
  if (!frame) { document.body.textContent = `Unknown frame "${name}"`; document.documentElement.dataset.ready = 'missing'; return; }
  const out = frame(); if (typeof out === 'string') add(out);
  if (flags.includes('stress')) document.querySelector('main').style.transform = 'translateY(430px)';
  if (flags.includes('stock')) document.querySelectorAll('.vt-scrim').forEach(e => e.classList.remove('vt-scrim'));
  renderArt();
  Promise.all([...document.images].map(i => i.decode().catch(() => {}))).then(() => { document.documentElement.dataset.ready = '1'; });
});
