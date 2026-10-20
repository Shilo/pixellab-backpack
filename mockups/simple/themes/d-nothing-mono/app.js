// Concept 4 layout in theme D "Nothing Mono": static storyboard renderer. index.html#<screen> draws one frame; nothing is interactive.
const D = window.SAMPLE_DATA, byId = Object.fromEntries(D.assets.map(a => [a.id, a]));
const done = D.assets.filter(a => a.status === 'completed'); // the grid shows completed assets only (08 §9)
const key = p => p.split('/').pop().replace('.png', '');
const h = html => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
// Dot-matrix numerals (5x7 dots, drawn as SVG: no dot-matrix font is installed). p = dot pitch in px.
const GLYPH = { 0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111',
  3: '11111000100010000010000011000101110', 4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110',
  6: '00110010001000011110100011000101110', 7: '11111000010001000100010000100001000', 8: '01110100011000101110100011000101110',
  9: '01110100011000101111000010001001100', '×': '00000100010101000100010101000100000' };
const dm = (str, p = 3) => { const cs = [...String(str)], r = p * 0.42, w = (cs.length * 6 - 1) * p; let c = '';
  cs.forEach((ch, k) => [...GLYPH[ch]].forEach((on, j) => { if (on === '1') c += `<circle cx="${(k * 6 + j % 5) * p + p / 2}" cy="${Math.floor(j / 5) * p + p / 2}" r="${r}"/>`; }));
  return `<span class="dm" aria-label="${str}"><svg style="width:${w}px;height:${7 * p}px" viewBox="0 0 ${w} ${7 * p}">${c}</svg></span>`; };
const I = {
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
  lib: '<svg viewBox="0 0 24 24"><circle cx="7.5" cy="7.5" r="3.2"/><circle cx="16.5" cy="7.5" r="3.2"/><circle cx="7.5" cy="16.5" r="3.2"/><circle cx="16.5" cy="16.5" r="3.2"/></svg>',
  back: '<svg viewBox="0 0 24 24"><path d="M14.5 5.5 8 12l6.5 6.5"/></svg>',
  chev: '<svg class="chev" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  more: '<svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4.5v11M7 11l5 5 5-5M5 19.5h14"/></svg>',
  open: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M10 14l4-4M10.5 10H14v3.5"/></svg>',
  folder: '<svg viewBox="0 0 24 24"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M12 10.5v5M9.5 13h5"/></svg>',
  check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/></svg>',
  tick: '<svg viewBox="0 0 24 24"><path d="m5.5 12.5 4.2 4.2 8.8-9.2"/></svg>',
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
const tile = ([name, count, cells, folder]) => {
  const big = cells.length <= 4 ? cells : cells.slice(0, 3), rest = cells.length <= 4 ? [] : cells.slice(3);
  return `<a class="tile${folder ? ' folder' : ''}"><div class="mosaic">${big.map(mcell).join('')}${rest.length ? `<div class="mini">${rest.map(mcell).join('')}</div>` : ''}</div>
    <div class="tlabel"><b>${name}</b>${dm(count)}</div></a>`;
};

// Asset cells: square, integer-scaled art, quiet name (state appended to tell look-alikes apart).
const SHEET = ['tileset_topdown', 'tileset_sidescroller', 'tiles_pro', 'font', 'ui_asset'];
const fit = a => SHEET.includes(a.type) ? 'data-fit="full" data-pad="0.1"' : a.type === 'map' ? 'data-fit="cover" data-s="2"'
  : a.type === 'creator_image' && a.width >= 256 ? 'data-fit="cover" data-s="1"' : 'data-pad="0.17"';
const label = a => a.name + (a.meta.state_name ? ` <small>· ${a.meta.state_name}</small>` : '');
const cell = (a, sel) => `<div class="cell${sel ? ' sel' : ''}" data-id="${a.id}"><div class="sq"><i data-art="${key(a.thumb)}" ${fit(a)}></i>${sel ? `<span class="chk">${I.tick}</span>` : ''}</div><span class="nm">${label(a)}</span></div>`;
const newest = list => list.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
const objects = newest(done.filter(a => a.type === 'object'));

const add = (...els) => els.forEach(e => document.body.append(typeof e === 'string' ? h(e) : e));
const dockHome = `<nav class="dock glass"><button class="seg on">${I.lib}Library</button>
  <button class="field">${I.search}Search ${done.length} assets<kbd>/</kbd></button><button class="round" aria-label="More">${I.more}</button></nav>`;
const dockCat = `<nav class="dock glass"><button class="seg back">${I.back}Library</button><span class="vr"></span>
  <span class="crumb">Objects${dm(objects.length)}</span><button class="round" aria-label="Search">${I.search}</button>
  <button class="seg">Select</button><button class="round" aria-label="More">${I.more}</button></nav>`;

function home() { add(`<main class="library">${T.map(tile).join('')}<div class="sec mine">Favorites and folders</div>${M.map(tile).join('')}</main>`); }
function category(selected = []) {
  add(`<main class="grid${selected.length ? ' selecting' : ''}">${objects.map(a => cell(a, selected.includes(a.id))).join('')}</main>`);
}
function viewer(info) {
  const a = byId.chr_0004;
  document.body.className = 'viewer' + (info ? ' info' : '');
  add(`<div class="stage"><i data-art="char-android-walk-east-f03" data-fit="full" data-pad="0"></i></div>`,
    `<button class="fab close glass" aria-label="Close">${I.x}</button>`,
    `<div class="fab vtitle"><b>${a.name}</b><span>Character</span></div>`,
    `<div class="fab caps glass"><button aria-label="Favorite">${I.heart}</button><button class="${info ? 'on' : ''}" aria-label="Info">${I.info}</button><button aria-label="More">${I.more}</button></div>`,
    `<nav class="dock vdock glass"><button class="seg">Walk · East ${I.chev}</button><button class="seg primary">${I.down}Download GIF<span class="split"></span>${I.chev.replace('chev', 'chev" style="opacity:.9')}</button></nav>`);
  if (info) add(`<aside class="panel glass">
    <div><h2>${a.name}</h2><p>Character</p></div>
    <div class="group">
      <div class="row"><span>Size</span><span>${dm('128×128')} px</span></div>
      <div class="row"><span>Directions</span><span>4</span></div>
      <div class="row"><span>Animations</span><span>Walk</span></div>
      <div class="row"><span>Frames</span><span>8 per direction</span></div>
      <div class="row"><span>View</span><span>Low top-down</span></div>
      <div class="row"><span>Created</span><span>Jul 1, 2026</span></div>
    </div>
    <div><div class="gh"><span>Prompt</span><button>Copy</button></div><div class="group prompt">${a.prompt}</div></div>
    <div><div class="gh"><span>In folders</span></div><div class="group">
      <div class="row"><span style="color:var(--text)">Hero party</span>${I.right}</div>
      <div class="row"><span style="color:var(--text)">Favorites to export</span>${I.right}</div></div></div>
    <a class="ext" href="#">Open in PixelLab ↗</a></aside>`);
}
const at = (el, x, y) => { el.style.left = x + 'px'; el.style.top = y + 'px'; return el; };

const SCREENS = {
  '01-home': () => { home(); add(dockHome); },
  '02-search-focused': () => {
    home();
    const recent = newest(done).slice(0, 6);
    add('<div class="dim"></div>', `<nav class="dock glass"><button class="round" aria-label="Library">${I.lib}</button>
      <div class="field focus">${I.search}<span class="caret"></span><span class="ph">Search ${done.length} assets, types and folders</span><kbd>esc</kbd></div></nav>`,
    `<div class="spanel glass">
      <div class="sh"><span>Recent</span><button>Clear</button></div>
      <div class="recent"><span>${I.clock}walk</span><span>${I.clock}potion</span><span>${I.clock}dungeon</span></div>
      <div class="sh"><span>Go to</span></div>
      <div class="goto">
        <a><i data-art="item-red-health-potion" data-pad="0.12"></i><div><b>Objects</b><span>Type · ${n('Objects')}</span></div></a>
        <a><i data-art="char-orb-mage-south" data-pad="0.08"></i><div><b>Characters</b><span>Type · ${n('Characters')}</span></div></a>
        <a><i data-art="char-hooded-mage-detailed-south" data-pad="0.06"></i><div><b>Hero party</b><span>Folder · ${fn('fld_01')}</span></div></a>
        <a><i data-art="vfx-meteor-f12" data-pad="0.08"></i><div><b>Favorites</b><span>${D.favorites.length} assets</span></div></a>
      </div>
      <div class="sh"><span>Recently added</span></div>
      <div class="added">${recent.map(a => cell(a)).join('')}</div>
      <div class="all">Show all ${done.length} assets${I.right}</div></div>`);
  },
  '03-category-open': () => { category(); add(dockCat); },
  '04-context-menu': () => {
    category(); add(dockCat);
    const r = document.querySelector('[data-id=obj_0009]').getBoundingClientRect();
    const t = at(h(cell(byId.obj_0009)), r.left, r.top); t.classList.add('lifted'); t.style.width = r.width + 'px';
    const m = at(h(`<div class="menu glass"><button class="it hl">Open${I.open}</button><button class="it">Favorite${I.heart}</button><button class="it">Add to folder…${I.folder}</button><button class="it">Download…<span class="sub">PNG</span>${I.down}</button><div class="gap"></div><button class="it">Select${I.check}</button></div>`), r.right + 16, r.top);
    add('<div class="scrim"></div>', t, m);
  },
  '05-select-mode': () => {
    category(['obj_0007', 'obj_0009', 'obj_0010']);
    add(`<nav class="dock glass"><span class="seg count">${dm(3)}selected ${I.chev}</span><span class="vr"></span>
      <button class="seg">${I.heart}Favorite</button><button class="seg">${I.folder}Add to folder</button>
      <button class="seg primary">${I.down}Download</button><button class="round" aria-label="Exit selection">${I.x}</button></nav>`);
  },
  '06-detail': () => viewer(false),
  '07-detail-info': () => viewer(true),
  '08-download-menu': () => {
    viewer(false);
    const r = document.querySelector('.primary').getBoundingClientRect();
    const two = (t, s, tick) => `<button class="it"><span class="two">${t}<small>${s}</small></span>${tick ? I.tick.replace('<svg', '<svg class="tick"') : ''}</button>`;
    const m = h(`<div class="menu glass" style="width:330px">${two('GIF', 'Walk · East · 8 fps', 1)}${two('Sprite sheet (ZIP)', 'PNG + JSON · 8 frames')}${two('All frames (ZIP)', '8 PNGs · Walk · East')}${two('PixelLab original (ZIP)', 'As PixelLab exports it')}<div class="gap"></div>${two('Download options…', 'Directions, scale, matte, file name')}</div>`);
    add(m); at(m, r.right - 330, r.top - m.offsetHeight - 14);
  },
  '09-folder-open': () => {
    home(); document.querySelector('main').scrollTop = 1e4; // scrolled to the folders row
    const f = D.folders[0];
    add('<div class="scrim"></div>', `<div class="fopen"><div class="ftitle">${f.name}<button class="round" aria-label="Folder actions">${I.more}</button></div>
      <div class="fpanel">${f.assetIds.map(id => cell(byId[id])).join('')}</div><div class="fmeta">${f.assetIds.length} assets</div></div>`,
    `<button class="fclose" aria-label="Close folder">${I.x}</button>`);
  },
  '10-more-menu': () => {
    add(dockHome); home();
    const r = document.querySelector('.dock .round').getBoundingClientRect();
    const m = h(`<div class="menu glass" style="width:310px">
      <button class="it">Sort<span class="sub">Newest</span>${I.chev}</button>
      <div class="it">Grid size<span class="segc"><b>S</b><b class="on">M</b><b>L</b><b>XL</b></span></div>
      <div class="it">Play previews<span class="tog"></span></div><div class="gap"></div>
      <button class="it"><span class="two">Download all ${done.length}…<small>One ZIP</small></span>${I.down}</button>
      <button class="it"><span class="two">Sync now<small>Synced just now</small></span>${I.sync}</button>
      <button class="it">1 generating in PixelLab${I.ext}</button><div class="gap"></div>
      <button class="it">Keyboard shortcuts<span class="sub">?</span>${I.keys}</button>
      <button class="it">Settings…${I.gear}</button></div>`);
    add('<div class="dim" style="background:rgba(8,10,16,.25)"></div>', m); at(m, r.right - 310 + 7, r.top - m.offsetHeight - 21);
  },
};

(SCREENS[location.hash.slice(1)] || SCREENS['01-home'])();
renderArt();
Promise.all([...document.images].map(i => i.decode().catch(() => {}))).then(() => { document.documentElement.dataset.ready = '1'; });
