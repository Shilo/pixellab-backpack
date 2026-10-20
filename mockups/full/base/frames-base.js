// Base frames: the 10 Concept 4 storyboard screens. Pattern for every frames-<group>.js file (README "Frame registry").
Object.assign(FRAMES, {
  '01-home': () => { home(); add(dockHome); },
  '02-search-focused': () => {
    home();
    const recent = newest(done).slice(0, 6);
    const go = (art, pad, t, s) => `<div class="glass-list vt-goto"><a class="glass-list__item glass-list__item--interactive" href="#"><span class="glass-list__leading glass-list__leading--lg"><i data-art="${art}" data-pad="${pad}"></i></span><div class="glass-list__content"><div class="glass-list__title">${t}</div><div class="glass-list__subtitle">${s}</div></div></a></div>`;
    add('<div class="dim"></div>', dock(item(ico(I.lib), 'vt-icon', ' aria-label="Library"') + searchField(`Search ${done.length} assets, types and folders`, 'esc', 1) + item(lbl('Cancel'), 'vt-cancel'), 'search'),
    `<div class="glass-popover glass-popover--start is-open vt-spanel vt-scrim hi">
      <div class="vt-gh"><span class="glass-list__section-header">Recent</span><button class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto">Clear</button></div>
      <div class="vt-recent">${['walk', 'potion', 'dungeon'].map(t => `<button class="glass-badge glass-badge--interactive">${I.clock}${t}</button>`).join('')}</div>
      <div class="vt-gh"><span class="glass-list__section-header">Go to</span></div>
      <div class="vt-gotos">${go('item-red-health-potion', 0.12, 'Objects', `Type · ${n('Objects')}`)}${go('char-orb-mage-south', 0.08, 'Characters', `Type · ${n('Characters')}`)}${go('char-hooded-mage-detailed-south', 0.06, 'Hero party', `Folder · ${fn('fld_01')}`)}${go('vfx-meteor-f12', 0.08, 'Favorites', `${D.favorites.length} assets`)}</div>
      <div class="vt-gh"><span class="glass-list__section-header">Recently added</span></div>
      <div class="added">${recent.map(a => cell(a)).join('')}</div>
      <hr class="glass-divider"><ul class="glass-list glass-list--bare">${row(`Show all ${done.length} assets`, I.right)}</ul></div>`);
    document.querySelector('.vt-field input').focus();
  },
  '03-category-open': () => { category(); add(dockCat); },
  '04-context-menu': () => {
    category(); add(dockCat);
    const r = document.querySelector('[data-id=obj_0009]').getBoundingClientRect();
    const t = at(h(cell(byId.obj_0009)), r.left, r.top); t.classList.add('lifted'); t.style.width = r.width + 'px';
    const m = at(menu([[row('Open', I.open, 'is-hl'), row('Favorite', I.heart), row('Add to folder…', I.folder), row('Download…', val('PNG') + I.down)], [row('Select', I.check)]]), r.right + 16, r.top);
    add(overlay(), t, m);
  },
  '05-select-mode': () => {
    category(['obj_0007', 'obj_0009', 'obj_0010']);
    add(dock(item(lbl('3 selected') + ico(I.chev), 'vt-count') + '<span class="vr"></span>' + item(ico(I.heart) + lbl('Favorite')) + item(ico(I.folder) + lbl('Add to folder'))
      + `<button class="glass-btn glass-btn--primary glass-btn--auto">${I.downFill}Download</button>` + item(ico(I.x), 'vt-icon', ' aria-label="Exit selection"')));
  },
  '06-detail': () => viewer(false),
  '07-detail-info': () => viewer(true),
  '08-download-menu': () => {
    viewer(false);
    const r = document.querySelector('.vt-split').getBoundingClientRect();
    const m = menu([[row('GIF', I.tick, '', 'Walk · East · 8 fps'), row('Sprite sheet (ZIP)', '', '', 'PNG + JSON · 8 frames'), row('All frames (ZIP)', '', '', '8 PNGs · Walk · East'), row('PixelLab original (ZIP)', '', '', 'As PixelLab exports it')],
      [row('Download options…', '', '', 'Directions, scale, matte, file name')]], 330);
    add(m); at(m, r.right - 330, r.top - m.offsetHeight - 14);
  },
  '09-folder-open': () => {
    home(); document.querySelector('main').scrollTop = 1e4; // scrolled to the folders row
    const f = D.folders[0];
    add(overlay(`<div class="fopen"><div class="ftitle">${f.name}<button class="glass-pill" aria-label="Folder actions">${I.more}</button></div>
      <div class="glass-card glass-card--glow fpanel">${f.assetIds.map(id => cell(byId[id])).join('')}</div><div class="fmeta">${f.assetIds.length} assets</div></div>`),
    `<button class="glass-pill vt-scrim fclose" aria-label="Close folder">${I.x}</button>`);
  },
  '10-more-menu': () => {
    add(dockHome); home();
    const r = document.querySelector('.vt-dock .vt-icon').getBoundingClientRect();
    const seg = `<div class="glass-segmented" role="group" aria-label="Grid size">${['S', 'M', 'L', 'XL'].map(s => `<button class="glass-segmented__item" aria-pressed="${s === 'M'}">${s}</button>`).join('')}</div>`;
    const tog = '<label class="glass-toggle"><input class="glass-toggle__input" type="checkbox" role="switch" checked aria-label="Play previews"><span class="glass-toggle__track"><span class="glass-toggle__thumb"></span></span></label>';
    const m = menu([[row('Sort', val('Newest') + I.chev), row('Grid size', seg), row('Play previews', tog)],
      [row(`Download all ${done.length}…`, I.down, '', 'One ZIP'), row('Sync now', I.sync, '', 'Synced just now'), row('1 generating in PixelLab', I.ext)],
      [row('<span class="vt-desk">Keyboard shortcuts</span><span class="vt-phone">Gestures</span>', `<span class="vt-desk">${val('?')}${I.keys}</span>`), row('Settings…', I.gear)]], 310);
    add('<div class="dim light"></div>', m); at(m, r.right - 310 + 7, r.top - m.offsetHeight - 21);
  },
});
