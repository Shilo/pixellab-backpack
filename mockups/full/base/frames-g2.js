// G2 Browse and find: search results and empty states, Show all, Favorites, per-type grids, sort, grid sizes, hover, unknown link.
{ // a block keeps these helpers out of the other frame files
  const inType = name => newest(done.filter(a => TYPES[name].includes(a.type)));
  const favs = newest(D.favorites.map(id => byId[id]));
  const heartFill = '<svg viewBox="0 0 24 24" class="g2-solid"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>';
  // Every grid marks favorites at rest with a small filled heart (08 §6.2).
  const c = a => D.favorites.includes(a.id) ? cell(a).replace('</div><span class="nm">', `<span class="g2-fav" aria-label="Favorite">${heartFill}</span></div><span class="nm">`) : cell(a);
  const grid = (list, cls = '', mk = c) => `<main class="grid${cls ? ' ' + cls : ''}">${list.map(mk).join('')}</main>`;
  // Category dock (dockCat with any scope); Select is hidden where it can't apply (S-3).
  const cdock = (name, count, select = true) => dock(item(ico(I.back) + lbl('Library'), 'vt-back') + '<span class="vr"></span>'
    + `<span class="crumb">${name}${count == null ? '' : `<span>${count}</span>`}</span>` + item(ico(I.search), 'vt-icon', ' aria-label="Search"')
    + (select ? item(lbl('Select')) : '') + item(ico(I.more), 'vt-icon', ' aria-label="More"'));
  // Search dock with a typed query: clear button in the field, phone Cancel (F-13).
  const qdock = (lead, q) => dock(lead + searchField('', 'esc', 1).replace('aria-label="Search"', `aria-label="Search" value="${q}"`)
    .replace('<kbd>', `<button class="g2-clear" aria-label="Clear search">${I.x}</button><kbd>`) + item(lbl('Cancel'), 'vt-cancel'), 'search');
  const art = (k, cls, pad = 0.08) => `<i class="${cls}" data-art="${k}" data-pad="${pad}"></i>`;
  const empty = (k, title, text, actions = '') => `<div class="glass-empty g2-empty">${art(k, 'g2-idle', 0)}<h2 class="glass-empty__title">${title}</h2>
    <p class="glass-empty__text">${text}</p>${actions ? `<div class="glass-empty__action">${actions}</div>` : ''}</div>`;
  const btn = t => `<button class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto">${t}</button>`;
  const lastIcon = () => [...document.querySelectorAll('.vt-dock .vt-icon')].pop().getBoundingClientRect();
  const seg = on => `<div class="glass-segmented" role="group" aria-label="Grid size">${['S', 'M', 'L', 'XL'].map(s => `<button class="glass-segmented__item" aria-pressed="${s === on}">${s}</button>`).join('')}</div>`;
  const tog = '<label class="glass-toggle"><input class="glass-toggle__input" type="checkbox" role="switch" checked aria-label="Play previews"><span class="glass-toggle__track"><span class="glass-toggle__thumb"></span></span></label>';

  Object.assign(FRAMES, {
    // Query "mage" over the library: type/folder names first ("Images" contains "mage"), then matching assets with the match in bold.
    'g2-search-results': () => {
      home();
      const hits = newest(done.filter(a => /mage/i.test(a.name)));
      const mark = html => html.replace(/(<span class="nm">)(.*?)(<\/span>)/, (m, a, b, z) => a + b.replace(/(mage)/i, '<mark>$1</mark>') + z);
      add('<div class="dim"></div>', qdock(item(ico(I.lib), 'vt-icon', ' aria-label="Library"'), 'mage'),
        `<div class="glass-popover glass-popover--start is-open vt-spanel vt-scrim hi g2-panel">
        <div class="vt-gh"><span class="glass-list__section-header">Go to</span></div>
        <div class="vt-gotos"><div class="glass-list vt-goto"><a class="glass-list__item glass-list__item--interactive" href="#"><span class="glass-list__leading glass-list__leading--lg">${art('creator-goblin-idle-f00', '')}</span>
          <div class="glass-list__content"><div class="glass-list__title">I<mark>mage</mark>s</div><div class="glass-list__subtitle">Type · ${n('Images')}</div></div></a></div></div>
        <div class="vt-gh"><span class="glass-list__section-header">${hits.length} results</span></div>
        <div class="g2-res">${hits.map(a => mark(cell(a))).join('')}</div></div>`);
      { const f = document.querySelector('.vt-field input'); f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
    },
    // Search inside Characters finds nothing.
    'g2-search-no-results': () => {
      add(grid(inType('Characters')), '<div class="dim"></div>', qdock(item(ico(I.back), 'vt-icon', ' aria-label="Back to Characters"'), 'slime'),
        `<div class="glass-popover glass-popover--start is-open vt-spanel vt-scrim hi g2-panel g2-none">
        ${empty('char-orb-mage-south', 'No matches for "slime" in Characters.', 'Try fewer words, or search all types.', btn('Clear search') + btn('Search all types'))}
        <hr class="glass-divider"><p class="g2-hint">Looking for fonts or effects? They aren't in PixelLab's public API yet.</p></div>`);
      { const f = document.querySelector('.vt-field input'); f.focus(); f.setSelectionRange(f.value.length, f.value.length); }
    },
    // Show all, scrolled to the end: end line and the not-in-API note (F-8).
    'g2-all-assets': () => {
      const links = ['Fonts', 'Effects', 'Portraits', 'Talking animations'].map(t => `<a class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto" href="#">${t} ↗</a>`).join('');
      add(grid(newest(done)).replace('</main>', `<div class="g2-end"><p>That's everything · ${done.length} assets</p>
        <div class="glass-card g2-note"><b>Other PixelLab content isn't in the public API yet.</b>
        <p>Fonts, effects, portraits and talking animations can't be read through PixelLab's public API, so Vitrine can't show them.</p>
        <div class="g2-links"><span>Find them in PixelLab:</span>${links}</div></div></div></main>`), cdock('All assets', done.length));
      document.querySelector('main').scrollTop = 1e4;
    },
    'g2-favorites': () => add(grid(favs), cdock('Favorites', favs.length)),
    'g2-favorites-empty': () => add(`<main class="g2-page">${empty('char-android-walk-south-f00', 'No favorites yet.', 'Use the heart on any asset to keep it here.')}</main>`, cdock('Favorites', 0, false)),
    'g2-category-tilesets': () => add(grid(inType('Tilesets & tiles')), cdock('Tilesets & tiles', n('Tilesets & tiles'))),
    'g2-category-ui': () => add(grid(inType('UI')), cdock('UI', n('UI'))),
    // Objects "…" with Sort expanded in place (no submenu, S-3).
    'g2-sort': () => {
      category(); add(dockCat);
      const r = lastIcon();
      const opts = ['Newest', 'Oldest', 'Name A–Z', 'Name Z–A', 'Largest', 'Smallest'].map(s => row(s, s === 'Newest' ? I.tick : '', 'g2-opt' + (s === 'Newest' ? ' g2-on' : '')));
      const m = menu([[row('Sort', val('Newest') + I.chev, 'g2-open'), ...opts, row('Grid size', seg('M')), row('Play previews', tog)],
        [row(`Download all ${objects.length}…`, I.down, '', 'One ZIP'), row('Sync now', I.sync, '', 'Synced just now'), row('1 generating in PixelLab', I.ext)],
        [row('<span class="vt-desk">Keyboard shortcuts</span><span class="vt-phone">Gestures</span>', `<span class="vt-desk">${val('?')}${I.keys}</span>`), row('Settings…', I.gear)]], 310);
      m.classList.add('g2-sortmenu');
      add('<div class="dim light"></div>', m); at(m, r.right - 310 + 7, r.top - m.offsetHeight - 21);
    },
    'g2-grid-size-xl': () => add(grid(objects, 'g2-xl'), dockCat),
    'g2-grid-size-s': () => add(grid(newest(done), 'g2-s'), cdock('All assets', done.length)),
    // Fine pointer over Goblin Brute Idle: inner ring, selection circle, ♡ toggle, its idle preview playing (a mid-loop frame).
    'g2-hover': () => {
      add(grid(inType('Images'), 'g2-hovering', a => a.id === 'img_0022'
        ? c(a).replace('class="cell"', 'class="cell g2-hot"').replace('goblin-idle-f00', 'goblin-idle-f04')
          .replace('</div><span class="nm">', `<button class="glass-pill vt-scrim g2-heart" tabindex="-1" aria-label="Unfavorite" aria-pressed="true">${heartFill}</button>${chk(a, false)}</div><span class="nm">`) : c(a)), cdock('Images', n('Images')));
      const r = document.querySelector('.g2-hot .sq').getBoundingClientRect();
      add(at(h('<svg class="g2-cursor" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8.2-6.3 1.4 3.6 6.6-2.6 1.4-3.6-6.6L5 18.4z"/></svg>'), r.left + r.width * .74, r.top + r.height * .7));
    },
    // Deep link to an unknown asset after a complete sync: back on the library with a toast (02 §1.1 rule 6).
    'g2-unknown-link': () => {
      home(); add(dockHome, `<div class="glass-toast is-visible g2-toast" role="status">${I.info.replace('<svg', '<svg class="glass-toast__icon"')}<span class="glass-toast__text">That asset isn't in this library.</span></div>`);
    },
  });
}
