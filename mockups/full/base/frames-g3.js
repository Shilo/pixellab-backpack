// G3 Viewer per asset type and playback (README "Feature inventory"). The base viewer() draws only the Android Courier,
// so this file has its own viewer for every type, built from the same GlassKit pieces and app.css viewer classes.
{
  const phone = matchMedia('(max-width: 600px)').matches;   // the renderer sets the viewport before the page loads
  const J = {
    play: '<svg viewBox="0 0 24 24"><path d="M8.5 5.8v12.4L18.4 12z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M9 6v12M15 6v12"/></svg>',
    prev: '<svg viewBox="0 0 24 24"><path d="M17 6.5v11L9.5 12zM7 6.5v11"/></svg>',
    next: '<svg viewBox="0 0 24 24"><path d="M7 6.5v11l7.5-5.5zM17 6.5v11"/></svg>',
    minus: '<svg viewBox="0 0 24 24"><path d="M6.5 12h11"/></svg>',
    plus: '<svg viewBox="0 0 24 24"><path d="M12 6.5v11M6.5 12h11"/></svg>',
    copy: '<svg viewBox="0 0 24 24"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5"/><path d="M15.5 8.5v-2a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"/></svg>',
    full: '<svg viewBox="0 0 24 24"><path d="M4.5 9V4.5H9M15 4.5h4.5V9M19.5 15v4.5H15M9 19.5H4.5V15"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="4.5" y="4.5" width="15" height="15" rx="2"/><path d="M9.5 4.5v15M14.5 4.5v15M4.5 9.5h15M4.5 14.5h15"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.6v5.2M12 16.3v.1"/></svg>',
    offline: '<svg viewBox="0 0 24 24"><path d="M4 4l16 16M2.8 9.1a14 14 0 0 1 4.3-2.8M10.6 5.6A14 14 0 0 1 21.2 9.1M6 12.6a9 9 0 0 1 4-2.2M15.6 11a9 9 0 0 1 2.4 1.6M9.3 16a4.5 4.5 0 0 1 5.4 0M12 19.6v.1"/></svg>',
    arrow: '<svg viewBox="0 0 24 24"><path d="M12 18.5v-13M6.5 11 12 5.5l5.5 5.5"/></svg>',
  };
  const day = iso => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
  const folders = id => D.folders.filter(f => f.assetIds.includes(id)).map(f => f.name);
  const fav = id => D.favorites.includes(id);
  const tog = (on, l) => `<label class="glass-toggle"><input class="glass-toggle__input" type="checkbox" role="switch"${on ? ' checked' : ''} aria-label="${l}"><span class="glass-toggle__track"><span class="glass-toggle__thumb"></span></span></label>`;
  const btn = (t, cls = 'tertiary') => `<button class="glass-btn glass-btn--${cls} glass-btn--sm glass-btn--auto">${t}</button>`;
  const sq = (svg, l) => `<button class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto g3-sq" aria-label="${l}">${svg}</button>`;

  // Art. data-art = base integer fit; pix() = an exact CSS multiple (m) for overlays that need known tile geometry.
  const art = (k, pad = 0.04) => `<i data-art="${k}" data-pad="${pad}"></i>`;
  const pix = (k, m, inner = '') => { const [, , , , w, hh] = BBOX[k];
    return `<div class="g3-pix g3-snap" style="width:${w * m}px;height:${hh * m}px"><img src="../../shared/assets/${k}.png" alt="">${inner}</div>`; };
  // Snap exact-multiple art to whole device pixels (flex centring can land on half pixels, which blurs at 3x).
  const snap = () => document.querySelectorAll('.g3-snap').forEach(e => { const r = e.getBoundingClientRect(), d = devicePixelRatio;
    e.style.translate = `${Math.round(r.left * d) / d - r.left}px ${Math.round(r.top * d) / d - r.top}px`; });

  // Info panel (08 §6.9): header, facts, text + Copy, per-type extra, folders, Technical details, footer hand-off.
  const fact = ([k, v]) => `<li class="glass-list__item"><div class="glass-list__content"><div class="glass-list__title">${k}</div></div><div class="glass-list__trailing">${val(v)}</div></li>`;
  const sect = (title, body, action = '') => `<div><div class="vt-gh"><span class="glass-list__section-header">${title}</span>${action}</div>${body}</div>`;
  const block = t => `<div class="glass-list vt-prompt"><div class="glass-list__item"><div class="glass-list__content"><div class="glass-list__title">${t}</div></div></div></div>`;
  const links = rows => `<ul class="glass-list">${rows.map(([t, s, tr = I.right]) => `<li class="glass-list__item glass-list__item--interactive"><div class="glass-list__content"><div class="glass-list__title">${t}</div>${s ? `<div class="glass-list__subtitle">${s}</div>` : ''}</div><div class="glass-list__trailing">${tr}</div></li>`).join('')}</ul>`;
  const tech = (open, a) => `<div class="glass-accordion"><div class="glass-accordion__item${open ? ' is-open' : ''}">
    <button class="glass-accordion__trigger" aria-expanded="${!!open}">Technical details<span class="glass-accordion__trigger-icon">${I.chev}</span></button>
    <div class="glass-accordion__content"><div class="glass-accordion__body">${open ? `<ul class="g3-kv">${[['Asset ID', '<code>c7d1…04ae</code>'], ['Source', a.source === 'rest' ? 'REST' : 'MCP'], ['Status', 'Completed'], ['Last synced', 'Just now'], ['Saved on this device', 'Yes']]
      .map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('')}</ul>
      <div class="g3-idrow">${btn(J.copy + 'Copy asset ID')}</div>
      <p class="g3-warn">${J.alert}<span>Anyone with this ID can download this asset without signing in. Only share it with tools you trust.</span></p>` : ''}</div></div></div></div>`;
  const panel = ({ a, sub, facts, text, extra = '', more, hint, techOpen }) => {
    const f = folders(a.id);
    return `<aside class="glass-sheet glass-sheet--inline vt-panel vt-scrim hi g3-panel" aria-label="Info"><div class="g3-body">
      <div><h2 class="glass-sheet__title">${a.name}</h2><p class="vt-sub">${sub}</p></div>
      <ul class="glass-list">${facts.map(fact).join('')}</ul>
      ${text ? sect(text[0], block(text[1]), btn('Copy', 'tertiary')) : ''}${extra}
      ${f.length ? sect('In folders', links(f.map(n => [n]))) : ''}
      ${tech(techOpen, a)}
      ${more ? sect('More in PixelLab', links(more.map(t => [`${t} ↗`, 'May use PixelLab credits', '']))) : ''}
      <div class="g3-foot"><a class="glass-btn glass-btn--tertiary glass-btn--sm" href="#">Open in PixelLab ↗</a>${hint ? `<p>${hint}</p>` : ''}</div></div></aside>`;
  };

  // Viewer: ✕, title, ♡ ⓘ … capsule, art, dock with the optional chip and the Download split button (08 §6.4).
  const split = t => `<div class="vt-split"><button class="glass-btn glass-btn--primary glass-btn--auto">${I.downFill}${t}</button><button class="glass-btn glass-btn--primary glass-btn--auto" aria-label="Download options">${I.caretFill}</button></div>`;
  function view({ a, kind, art: inner, chip, dl, info, on, stage = '', cls = '' }) {
    const b = document.body.classList; b.add('viewer', ...cls.split(' ').filter(Boolean)); if (info) b.add('info');
    const act = [info && 'info', on], caps = [['heart', 'Favorite'], ['info', 'Info'], ['more', 'More']].map(([k, l]) => item(ico(I[k]),
      'vt-icon' + (act.includes(k) ? ' is-active' : '') + (k === 'heart' && fav(a.id) ? ' g3-fav' : ''), ` aria-label="${l}"${act.includes(k) || (k === 'heart' && fav(a.id)) ? ' aria-pressed="true"' : ''}`)).join('');
    add(`<div class="stage${stage ? ' ' + stage : ''}"><div class="g3-art">${inner}</div></div>`,
      `<button class="glass-pill vt-scrim fab close" aria-label="Close">${I.x}</button>`,
      `<div class="fab vtitle"><b>${a.name}</b><span>${kind}</span></div>`,
      `<div class="fab caps"><nav class="glass-tab-bar glass-tab-bar--floating vt-caps vt-scrim" aria-label="Asset actions">${caps}</nav></div>`,
      dock((chip ? item(lbl(chip) + ico(I.chev), 'vt-chip') : '') + split(dl), 'vdock'));
    if (info) add(panel(info));
    // Phone: a long chip label ("Detailed robe · South") can't share the row, so the chip sits above Download (08 §8).
    const d = document.querySelector('.vdock .vt-dock'); if (phone && d.scrollWidth > d.clientWidth + 1) d.classList.add('g3-stack');
  }
  const pop = (inner, cls, label) => h(`<div class="glass-popover glass-popover--start is-open vt-menu vt-scrim hi ${cls}" role="dialog" aria-label="${label}">${inner}</div>`);
  const card = (inner, cls = '') => `<div class="glass-popover glass-popover--start is-open vt-scrim hi g3-card ${cls}" role="status">${inner}</div>`;
  const above = (m, sel, dx = 0) => { const r = document.querySelector(sel).getBoundingClientRect(); add(m); at(m, r.left + dx, r.top - m.offsetHeight - 14); };
  const below = (m, sel) => { const r = document.querySelector(sel).getBoundingClientRect(); add(m); at(m, r.right - m.offsetWidth, r.bottom + 12); };

  // "Walk · East ▾" popover: animation list (Rotations first), state switcher, direction rose (missing directions disabled).
  const NAME = { south: 'South', south_east: 'South-east', east: 'East', north_east: 'North-east', north: 'North', north_west: 'North-west', west: 'West', south_west: 'South-west' };
  const ROSE = [['north_west', 315], ['north', 0], ['north_east', 45], ['west', 270], null, ['east', 90], ['south_west', 225], ['south', 180], ['south_east', 135]];
  const head = t => `<div class="g3-ph"><span class="glass-list__section-header">${t}</span></div>`;
  const picker = ({ anims, cur, dirs, dir, states }) => pop(`${head('Animation')}<ul class="glass-list glass-list--bare">${anims.map(([t, s]) => row(t, t === cur ? I.tick : '', '', s)).join('')}</ul>
    ${states ? `<hr class="glass-divider">${head('State')}<div class="g3-pad"><div class="glass-segmented glass-segmented--full" role="group" aria-label="State">${states[0].map(s => `<button class="glass-segmented__item" aria-pressed="${s === states[1]}">${s}</button>`).join('')}</div></div>` : ''}
    <hr class="glass-divider">${head('Direction')}<div class="g3-pad"><div class="g3-rose" role="radiogroup" aria-label="Direction">${ROSE.map(d => d
      ? `<button class="g3-dir${d[0] === dir ? ' on' : ''}" role="radio" aria-checked="${d[0] === dir}" aria-label="${NAME[d[0]]}"${dirs.includes(d[0]) ? '' : ' disabled'} style="--r:${d[1]}deg">${J.arrow}</button>`
      : `<span class="g3-dirname">${NAME[dir]}</span>`).join('')}</div></div>`, 'g3-pick', 'Animation, state and direction');

  // Viewer "…" (08 §6.5): Playback, Zoom, Backdrop inline; then at most 5 actions.
  const SW = [['Theme', 'linear-gradient(#2a2c34, #16171c)'], ['Checker', 'repeating-conic-gradient(#d4d4d8 0 25%, #8e8f96 0 50%) 0 0 / 10px 10px'], ['Light gray', '#d1d1d1'], ['Mid gray', '#777777'], ['Black', '#000000']];
  const ctl = (t, inner) => `<li class="glass-list__item g3-ctl"><div class="glass-list__content"><div class="glass-list__title">${t}</div></div><div class="glass-list__trailing">${inner}</div></li>`;
  const more = ({ playback, zoom, bd = 0, grid, reload }) => pop(`<ul class="glass-list glass-list--bare">
      ${playback ? ctl('Playback', sq(J.prev, 'Step back') + sq(J.pause, 'Pause') + sq(J.next, 'Step forward'))
        + ctl('Speed', `${btn('Reset', 'tertiary')}${sq(J.minus, 'Slower')}<span class="g3-read">12 fps</span>${sq(J.plus, 'Faster')}`) + ctl('Loop', tog(true, 'Loop')) : ''}
      ${ctl('Zoom', `${sq(J.minus, 'Zoom out')}<button class="g3-read g3-readbtn" aria-label="Zoom: ${zoom}. Toggle Fit and 1:1">${zoom}</button>${sq(J.plus, 'Zoom in')}`)}
      <li class="glass-list__item g3-bd"><div class="glass-list__content"><div class="glass-list__title">Backdrop</div>
        <div class="g3-sw" role="radiogroup" aria-label="Backdrop">${SW.map(([n, b], i) => `<button class="g3-swatch${i === bd ? ' on' : ''}" role="radio" aria-checked="${i === bd}"><i style="background:${b}">${i === bd ? I.tick : ''}</i>${n}</button>`).join('')}</div></div></li></ul>
    <hr class="glass-divider"><ul class="glass-list glass-list--bare">${row('Add to folder…', I.folder)}${row('Copy image', J.copy)}${row('Open in PixelLab ↗')}
      ${phone ? '' : row('Fullscreen', val('F') + J.full)}${grid ? row('Grid', tog(true, 'Grid')) : ''}${reload ? row('Reload from PixelLab', I.sync) : ''}</ul>`, 'g3-more', 'More');

  // Shared assets
  const courier = byId.chr_0004, walk = [['Rotations', 'Still pose for each direction'], ['Walk · 8f', '']];
  const cDirs = Object.keys(courier.directions);
  const cFit = phone ? 'Fit · 3×' : 'Fit · 7×';
  const courierView = (o = {}) => view({ a: courier, kind: 'Character', art: '<i data-art="char-android-walk-east-f03" data-fit="full" data-pad="0"></i>', chip: 'Walk · East', dl: 'Download GIF', stage: 'g3-full', ...o });

  Object.assign(FRAMES, {
    'g3-picker': () => {
      courierView();
      above(picker({ anims: walk, cur: 'Walk · 8f', dirs: cDirs, dir: 'east' }), '.vt-chip', -8);
    },
    'g3-rotations': () => view({ a: courier, kind: 'Character', art: art('char-android-walk-south-f00', 0.02), chip: 'Rotations · South', dl: 'Download PNG' }),
    'g3-viewer-more': () => { courierView({ on: 'more' }); below(more({ playback: 1, zoom: cFit }), '.caps'); },
    'g3-states': () => {
      const a = byId.chr_0003;
      view({ a, kind: `Character · ${a.meta.state_name}`, art: art('char-hooded-mage-detailed-south', 0.03), chip: 'Detailed robe · South', dl: 'Download PNG' });
      above(picker({ anims: [['Rotations', 'Still pose for each direction']], cur: 'Rotations', dirs: Object.keys(a.directions), dir: 'south', states: [['Base', 'Detailed robe'], 'Detailed robe'] }), '.vt-chip', -8);
    },
    'g3-object-animated': () => view({ a: byId.obj_0001, kind: 'Object · open', art: art('obj-bear-trap-close-f04', 0.08), chip: 'Snap shut', dl: 'Download GIF' }),
    'g3-object-still': () => view({ a: byId.obj_0017, kind: 'Object', art: art('item-red-health-potion', 0.2), dl: 'Download PNG' }),
    'g3-image-animated': () => view({ a: byId.img_0022, kind: 'Image', art: art('creator-goblin-idle-f03', 0.03), dl: 'Download GIF' }),
    'g3-image-still': () => {
      const a = byId.img_0001;
      view({ a, kind: 'Image · Creator gallery', art: '<i data-art="creator-slime-sheet" data-fit="full" data-pad="0"></i>', dl: 'Download PNG', on: 'more',
        info: !phone && { a, sub: 'Image · Creator gallery', facts: [['Frame size', '512 × 512 px'], ['Created', day(a.createdAt)], ['Made on', 'PixelLab website']],
          text: ['Description', a.prompt], more: ['Edit', 'Animate', 'Rotate'] } });
      below(more({ zoom: phone ? 'Fit' : 'Fit · 1×', reload: 1 }), '.caps');
    },
    'g3-tileset': () => {
      const a = byId.tds_0001, m = phone ? 5 : 10, W = [6, 13, 9, 3, 12, 15, 11, 1, 14, 7, 10, 2, 4, 8, 5, 0];
      const grid = `<div class="g3-grid" style="--t:${16 * m}px">${W.map((w, i) => `<span${i === 1 ? ' class="on"' : ''}><em>wang_${w}</em></span>`).join('')}</div>`;
      view({ a, kind: 'Top-down tileset', art: pix('tileset-topdown-dirt-grass-detailed', m, grid), dl: 'Download PNG' });
      const t = h(card('<b class="g3-mono">wang_13</b><span>NW upper, NE upper, SW lower, SE upper</span><span class="g3-mono g3-dim">x 16, y 0</span>', 'g3-tip'));
      add(t); snap();
      const r = document.querySelector('.g3-grid .on').getBoundingClientRect();
      if (!phone) at(t, r.left + r.width / 2 - t.offsetWidth / 2, r.bottom + 10);
    },
    'g3-tileset-side': () => {
      const a = byId.sss_0002;
      view({ a, kind: 'Sidescroller tileset', art: art('tileset-side-frozen-ledge', 0.02), dl: 'Download PNG',
        info: { a, sub: 'Sidescroller tileset', facts: [['Tile size', '32 × 32 px'], ['Tiles', '16 · 4 × 4 sheet'], ['View', 'Side (platformer)'], ['Created', day(a.createdAt)]],
          text: ['Terrain', `Frozen platform body with frost cracks<br><span class="g3-dim">Top edge: jagged ice and snow crust</span>`], hint: 'May need a paid PixelLab plan' } });
    },
    'g3-tiles-pro': () => {
      const a = byId.tpr_0003, k = 'tilespro-skill-icons-plain', [, , , , w, hh] = BBOX[k], m = phone ? 2 : 4, ts = 32 * m, cols = Math.sqrt(a.meta.n_tiles);
      const cells = Array.from({ length: a.meta.n_tiles }, (_, i) => `<span${i === 5 ? ' class="on"' : ''} style="width:${ts}px;height:${ts}px"><img src="../../shared/assets/${k}.png" alt="" style="width:${w * m}px;height:${hh * m}px;left:${-(i % cols) * ts}px;top:${-Math.floor(i / cols) * ts}px"></span>`).join('');
      view({ a, kind: 'Tiles Pro', art: `<div class="g3-tiles g3-snap" style="grid-template-columns:repeat(${cols}, ${ts}px)">${cells}</div>`, dl: 'Download Tiles (ZIP)' });
      const t = h(card('<b class="g3-mono">tile_5</b><span class="g3-mono g3-dim">x 32, y 32</span>', 'g3-tip')); add(t); snap();
      const r = document.querySelector('.g3-tiles .on').getBoundingClientRect();
      if (!phone) at(t, r.right + 14, r.top + r.height / 2 - t.offsetHeight / 2);
    },
    'g3-isometric': () => {
      const a = byId.iso_0001;
      view({ a, kind: 'Isometric tile', art: art('iso-grass-block', 0.1), dl: 'Download PNG',
        info: { a, sub: 'Isometric tile', facts: [['Size', '32 px'], ['Shape', 'Block'], ['Seed', `<span class="g3-mono">${a.meta.seed}</span>`], ['Created', day(a.createdAt)]],
          text: ['Description', a.prompt], hint: 'May need a paid PixelLab plan' } });
    },
    'g3-map': () => {
      const a = byId.map_0001;
      const placed = [['mapobj-ruined-apartment', 'Ruined Apartment Block', 'Cell 28, 7 · 192 × 192 px · Layer 1'], ['obj-treasure-chest-closed', 'Treasure Chest', 'Cell 10, 22 · 32 × 32 px · Layer 1'], ['mapobj-wooden-staircase-west', 'Wooden Staircase', 'Cell 40, 25 · 48 × 48 px · Layer 1']];
      const list = `<ul class="glass-list g3-placed">${placed.map(([k, t, s]) => `<li class="glass-list__item"><span class="glass-list__leading"><i data-art="${k}" data-pad="0.08"></i></span><div class="glass-list__content"><div class="glass-list__title">${t}</div><div class="glass-list__subtitle">${s}</div></div></li>`).join('')}</ul>`;
      view({ a, kind: 'Map', art: '<i data-art="map-meadow-ruins" data-fit="full" data-pad="0"></i>', dl: 'Download PNG',
        info: { a, sub: 'Map', facts: [['Size', '48 × 32 cells · 768 × 512 px'], ['Tile size', '16 px'], ['Terrains', 'dirt, grass'], ['Painted cells', '1,536']],
          extra: sect('Placed objects', list, val('3')), hint: 'May need a paid PixelLab plan' } });
    },
    'g3-ui': () => {
      const a = byId.ui_0001;
      view({ a, kind: 'UI', art: '<i data-art="ui-fantasy-hud" data-fit="full" data-pad="0"></i>', dl: 'Download PNG',
        info: { a, sub: 'UI', facts: [['Size', '688 × 384 px'], ['Created', day(a.createdAt)]], text: ['Prompt', a.prompt],
          extra: `<p class="g3-note">${I.info}<span>PixelLab doesn't share the individual UI pieces.</span></p>` } });
    },
    'g3-info-technical': () => {
      view({ a: courier, kind: 'Character', art: art('char-android-walk-east-f03', 0.02), chip: 'Walk · East', dl: 'Download GIF', cls: 'g3-tall',
        info: { a: courier, sub: 'Character', facts: [['Canvas', '128 × 128 px'], ['Directions', '4 · S, E, N, W'], ['Animations', 'Walk · 8 frames'], ['Created', day(courier.createdAt)]],
          text: ['Prompt', courier.prompt], techOpen: 1, more: ['Animate', 'New state'] } });
      const p = document.querySelector('.g3-body'); p.scrollTop = p.querySelector('.glass-accordion').offsetTop - p.offsetTop - 4;   // Technical details at the top (clamped at the end)
    },
    'g3-zoomed': () => {
      const a = byId.img_0001, m = phone ? 2 : 4, k = 'creator-slime-sheet';
      view({ a, kind: 'Image · Creator gallery', art: `<div class="g3-pan"><img class="g3-snap" src="../../shared/assets/${k}.png" alt="" style="width:${512 * m}px;left:${phone ? -300 : -380}px;top:${phone ? -200 : -540}px"></div>`, dl: 'Download PNG', cls: 'g3-fill' });
      add(card(`<b>${phone ? '2×' : '4×'}</b><span class="g3-dim">${phone ? 'Double-tap' : 'Double-click'} to fit</span>`, 'g3-hud g3-low'));
      snap();
    },
    'g3-backdrop': () => view({ a: byId.chr_0001, kind: 'Character', art: art('char-orb-mage-south', 0.12), chip: 'Rotations · South', dl: 'Download PNG', stage: 'g3-checker' }),
    'g3-loading': () => {
      courierView();
      add(card(`<svg class="g3-ring" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="8.5" pathLength="8" stroke-dasharray="3 8"/></svg><span>Loading frames 3/8</span>`, 'g3-hud g3-low'));
    },
    'g3-load-error': () => {
      view({ a: courier, kind: 'Character', art: art('char-android-walk-east-f00', 0.02), dl: 'Download PNG', cls: 'g3-room' });
      add(card(`${J.alert}<span>Couldn't load this asset's animations.</span>${btn('Try again')}`, 'g3-msg g3-low'));
    },
    'g3-offline-not-saved': () => {
      courierView({ art: art('char-android-walk-east-f00', 0.02), stage: '', cls: 'g3-room' });
      add(card(`${J.offline}<span>This animation isn't saved on this device. Connect to the internet to see it.</span>`, 'g3-msg g3-low'));
    },
    'g3-immersive': () => view({ a: courier, kind: 'Character', art: '<i data-art="char-android-walk-east-f03" data-fit="full" data-pad="0"></i>', chip: 'Walk · East', dl: 'Download GIF', cls: 'g3-immersive' }),
  });
}
