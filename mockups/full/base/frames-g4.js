// G4 Organize and download: folders, favorites, selection, download menus, dialogs, progress and toasts (README "Feature inventory").
{ // block scope keeps these helpers out of the other frame files
  const G = {
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    dash: '<svg viewBox="0 0 24 24"><path d="M6.5 12h11"/></svg>',
    pencil: '<svg viewBox="0 0 24 24"><path d="M4.5 19.5l1-4L15.8 5.2a2 2 0 0 1 2.9 0l.1.1a2 2 0 0 1 0 2.9L8.5 18.5z"/><path d="M13.8 7.2l3 3"/></svg>',
    trash: '<svg viewBox="0 0 24 24"><path d="M4.5 7h15M9.5 7V5h5v2M6.5 7l1 12.5h9l1-12.5M10.2 10.5v6M13.8 10.5v6"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg>',
    warn: '<svg viewBox="0 0 24 24"><path d="M12 4.5 20.5 19h-17z"/><path d="M12 10v4M12 16.6v.1"/></svg>',
    sheet: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M3.5 9.2h17M3.5 14.8h17M9.2 3.5v17M14.8 3.5v17"/></svg>',
    frames: '<svg viewBox="0 0 24 24"><rect x="7.5" y="7.5" width="12" height="12" rx="2.5"/><path d="M4.5 15.5v-9a2 2 0 0 1 2-2h9"/></svg>',
    gif: '<svg viewBox="0 0 24 24"><rect x="3.5" y="5.5" width="17" height="13" rx="3"/><path d="M10.5 9.5v5l4-2.5z"/></svg>',
    zip: '<svg viewBox="0 0 24 24"><path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4M10 6h1.5M10 9h1.5M10 12h1.5M9.5 14.5h2.5v3h-2.5z"/></svg>',
  };
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

  // Folders A–Z (02 §3.8). The five sample folders plus four more, so the multi-asset picker passes 8 and shows its filter.
  const FOLD = [['1-bit platformer', fn('fld_04'), M[4][2][0]], ['Boss rush', 0, ''], ['Dungeon kit', fn('fld_02'), M[2][2][0]],
    ['Favorites to export', fn('fld_05'), M[5][2][0]], ['Forest level', 9, 'tileset-topdown-dirt-grass-detailed|cover|3'], ['Hero party', fn('fld_01'), M[1][2][0]],
    ['Shop items', 14, 'item-red-health-potion'], ['UI pack', fn('fld_03'), M[3][2][0]], ['Village NPCs', 3, 'char-orb-mage-south']];
  const SAMPLE = FOLD.filter(f => M.some(m => m[0] === f[0]));

  // GlassKit checkbox; GlassKit has no mixed state, so "mixed" draws a dash in the checked box (02 S13 tri-state).
  const cb = (st, name) => `<label class="glass-checkbox"><input class="glass-checkbox__input" type="checkbox"${st ? ' checked' : ''}${st === 'mixed' ? ' aria-checked="mixed"' : ''} aria-label="${name}"><span class="glass-checkbox__box">${st === 'mixed' ? G.dash : I.boxTick}</span></label>`;
  const radio = (name, on) => `<label class="glass-radio"><input class="glass-radio__input" type="radio" name="${name}"${on ? ' checked' : ''}><span class="glass-radio__circle"><span class="glass-radio__dot"></span></span></label>`;
  const seg = (label, items, on) => `<div class="glass-segmented" role="group" aria-label="${label}">${items.map(s => `<button class="glass-segmented__item" aria-pressed="${s === on}">${s}</button>`).join('')}</div>`;
  const thumb = art => `<span class="glass-list__leading glass-list__leading--lg g4-th">${art ? mcell(art) : G.folder}</span>`;

  // Add to folder (S13): popover on desktop, half sheet on phone (vt-menu's phone rules); a filter field above 8 folders.
  const addToFolder = (sub, rows) => h(`<div class="glass-popover glass-popover--start is-open vt-menu vt-scrim hi g4-atf" role="dialog" aria-label="Add to folder">
    <div class="g4-ph"><div><b>Add to folder</b><span>${sub}</span></div><button class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto">Done</button></div>
    ${rows.length > 8 ? `<div class="glass-search g4-filter"><svg class="glass-search__icon" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg><input class="glass-input" type="search" placeholder="Filter folders" aria-label="Filter folders" readonly></div>` : ''}
    <ul class="glass-list glass-list--bare g4-fl">
      <li class="glass-list__item glass-list__item--interactive"><span class="glass-list__leading glass-list__leading--lg g4-th g4-new">${G.plus}</span><div class="glass-list__content"><div class="glass-list__title">New folder</div></div></li>
      ${rows.map(([f, st]) => `<li class="glass-list__item glass-list__item--interactive" role="menuitemcheckbox">${thumb(f[2])}<div class="glass-list__content"><div class="glass-list__title">${f[0]}</div><div class="glass-list__subtitle">${plural(f[1], 'asset')}</div></div><div class="glass-list__trailing">${cb(st, f[0])}</div></li>`).join('')}
    </ul></div>`);

  // A card lifted out of the dimmed grid (as in 04-context-menu); returns its rect. side() puts a menu beside it.
  const lift = id => {
    const r = document.querySelector(`[data-id=${id}]`).getBoundingClientRect();
    const t = at(h(cell(byId[id])), r.left, r.top); t.classList.add('lifted'); t.style.width = r.width + 'px';
    add(overlay(), t); return r;
  };
  const side = (m, r) => { add(m); const w = m.offsetWidth;
    at(m, r.right + 16 + w > innerWidth - 16 ? r.left - 16 - w : r.right + 16, Math.max(16, Math.min(r.top, innerHeight - m.offsetHeight - 16))); };
  const above = (m, sel, dx = 0) => { add(m); const r = document.querySelector(sel).getBoundingClientRect(); at(m, r.left + dx, r.top - m.offsetHeight - 14); };

  const selBar = label => dock(item(lbl(label) + ico(I.chev), 'vt-count') + '<span class="vr"></span>' + item(ico(I.heart) + lbl('Favorite'))
    + item(ico(I.folder) + lbl('Add to folder'), 'g4-addf') + `<button class="glass-btn glass-btn--primary glass-btn--auto">${I.downFill}Download</button>` + item(ico(I.x), 'vt-icon', ' aria-label="Exit selection"'));
  const sel3 = ['obj_0007', 'obj_0009', 'obj_0010'];

  // Folder overlay (as in 09-folder-open), with any body inside the glow card.
  const folderOv = (name, body, meta, cls = '') => {
    home(); document.querySelector('main').scrollTop = 1e4;
    add(overlay(`<div class="fopen"><div class="ftitle">${name}<button class="glass-pill" aria-label="Folder actions">${I.more}</button></div>
      <div class="glass-card glass-card--glow fpanel ${cls}">${body}</div>${meta ? `<div class="fmeta">${meta}</div>` : ''}</div>`),
    `<button class="glass-pill vt-scrim fclose" aria-label="Close folder">${I.x}</button>`);
  };
  const folderCells = f => f.assetIds.filter(id => byId[id].status === 'completed').map(id => cell(byId[id])).join('');

  // Dialogs: GlassKit modal on the app's dark base. "sheet" dialogs become bottom sheets on the phone.
  const ov = (inner, cls = '') => `<div class="glass-modal-overlay is-active g4-ov ${cls}">${inner}</div>`;
  const alertBox = (title, body, actions) => ov(`<div class="glass-modal g4-dlg vt-scrim hi" role="alertdialog" aria-label="${title.replace(/"/g, '&quot;')}">
    <div class="glass-modal__header"><h2 class="glass-modal__title">${title}</h2></div><div class="glass-modal__body">${body}</div>
    <div class="glass-modal__footer">${actions}</div></div>`);
  const bigDlg = (title, sub, body, foot, cls = '', lead = '') => ov(`<div class="glass-modal g4-dlg g4-big vt-scrim hi ${cls}" role="dialog" aria-label="${title}">
    <div class="g4-hd">${lead ? `<div class="g4-mt">${lead}<h2>${title}</h2></div>` : `<h2>${title}</h2>`}<p>${sub}</p></div><div class="g4-bd">${body}</div><div class="g4-ft">${foot}</div></div>`, 'g4-sheet');
  const dlFoot = (count = '') => `<span class="g4-count">${count}</span><button class="glass-btn glass-btn--tertiary glass-btn--auto">Cancel</button><button class="glass-btn glass-btn--primary glass-btn--auto">${I.downFill}Download</button>`;
  const hdr = t => `<div class="vt-gh"><span class="glass-list__section-header">${t}</span></div>`;

  Object.assign(FRAMES, {
    // Context menu "Download…" swaps the menu for that asset's Download list (08 §6.8, §6.10).
    'g4-context-download': () => {
      category(); add(dockCat); document.querySelector('main').scrollTop = 1e4; // Bear Trap, the animated object, is last
      const r = lift('obj_0001');
      side(menu([[`<li class="glass-list__item glass-list__item--interactive g4-mback" role="menuitem"><span class="glass-list__leading">${I.back}</span><div class="glass-list__content"><div class="glass-list__title">Download</div><div class="glass-list__subtitle">Bear Trap · open</div></div></li>`],
        [row('GIF', I.tick, 'is-hl', 'Snap shut · 8 fps'), row('Sprite sheet (ZIP)', '', '', 'PNG + JSON · 9 frames'), row('All frames (ZIP)', '', '', '9 PNGs · Snap shut'), row('PixelLab original (ZIP)', '', '', 'As PixelLab exports it')],
        [row('Download options…', '', '', 'Scale, matte, file name')]], 310), r);
    },

    // "3 selected ▾" menu, shown with a selection that a filter partly hides (08 §6.11).
    'g4-select-menu': () => {
      const ids = [0, 2, 3, 5, 6, 8, 9, 11].map(i => objects[i].id);
      category(ids);
      add(selBar('12 selected<span class="vt-desk"> · </span><span class="g4-hid">4 hidden<span class="vt-desk"> by filter</span></span>'));
      add('<div class="dim light"></div>');
      above(menu([[`<li class="vt-phone g4-mtitle">12 selected · 4 hidden by filter</li>`
        + row('Select all in view', `<span class="vt-desk">${val('Ctrl A')}</span>${I.check}`, 'is-hl'), row('Deselect all', I.x)]], 290), '.vt-count');
    },

    // Add to folder from the context menu: one asset, plain checkboxes, ≤ 8 folders so no filter (02 S13).
    'g4-add-to-folder': () => {
      category(); add(dockCat);
      side(addToFolder('Crystal Oak Staff', SAMPLE.map(f => [f, f[0] === 'Hero party'])), lift('obj_0009'));
    },

    // Add to folder from the selection bar: tri-state checkboxes and the filter above 9 folders.
    'g4-add-to-folder-multi': () => {
      category(sel3); add(selBar('3 selected'), '<div class="dim light"></div>');
      above(addToFolder('3 assets', FOLD.map(f => [f, f[0] === 'Hero party' ? 'mixed' : f[0] === 'Shop items'])), '.g4-addf', -60);
    },

    // New folder dialog (S14) with the duplicate-name error.
    'g4-folder-name': () => {
      home(); add(dockHome);
      add(alertBox('New folder', `<input class="glass-input glass-input--error g4-name" value="Hero Party" maxlength="60" aria-label="Folder name" aria-invalid="true" aria-describedby="g4-dup">
        <p class="glass-hint glass-hint--error g4-err" id="g4-dup">You already have a folder with that name.</p>`,
        '<button class="glass-modal__action">Cancel</button><button class="glass-modal__action glass-modal__action--primary" disabled>Create</button>'));
      const f = document.querySelector('.g4-name'); f.focus(); f.setSelectionRange(10, 10);
    },

    // Folder "…": Download all, Rename, Delete (08 §6.7).
    'g4-folder-menu': () => {
      const f = D.folders[0];
      folderOv(f.name, folderCells(f), plural(fn(f.id), 'asset'));
      const r = document.querySelector('.ftitle .glass-pill').getBoundingClientRect();
      const m = menu([[row(`Download all ${fn(f.id)}…`, I.down, 'is-hl', 'One ZIP')], [row('Rename…', G.pencil), row('Delete folder…', G.trash, 'glass-list__item--danger')]], 270);
      add(m); at(m, r.left + r.width / 2 - 135, r.bottom + 10);
    },

    'g4-confirm-delete-folder': () => {
      home(); add(dockHome);
      add(alertBox('Delete "Hero party"?', `<p>The ${fn('fld_01')} assets in it stay in your library. Only the folder goes away.</p>`,
        '<button class="glass-modal__action">Cancel</button><button class="glass-modal__action glass-modal__action--danger">Delete folder</button>'));
    },

    // Empty folder: idle sprite from the library + Go to Library (02 §12.3, F-14).
    'g4-folder-empty': () => folderOv('Boss rush', `<div class="glass-empty"><span class="g4-idle"><i data-art="char-orb-mage-south" data-pad="0" data-max="3"></i></span>
      <p class="glass-empty__title">This folder is empty.</p><p class="glass-empty__text">Select assets in your library, then choose Add to folder.</p>
      <div class="glass-empty__action"><button class="glass-btn glass-btn--primary glass-btn--auto">${I.lib}Go to Library</button></div></div>`, '', 'g4-emptyp'),

    // Folder keys missing from the library after a complete sync (02 §8).
    'g4-folder-unavailable': () => {
      const f = D.folders[4];
      folderOv(f.name, `<div class="g4-note"><span class="g4-ni">${I.info}</span><span>1 item in this folder isn't in your PixelLab library anymore.</span>
        <button class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto">Remove them</button></div>${folderCells(f)}`, plural(fn(f.id), 'asset'));
    },

    // Proposal: a "New folder" tile closes the Favorites and folders row (S3's tile, carried into Concept 4's library).
    'g4-new-folder': () => {
      home(); add(dockHome);
      const main = document.querySelector('main');
      main.insertAdjacentHTML('beforeend', `<a class="tile g4-newtile" href="#"><div class="mosaic g4-newm"><span class="g4-newi">${G.plus}</span></div><div class="tlabel"><b>New folder</b></div></a>`);
      main.scrollTop = 1e4;
    },

    // Single-asset "Download options" (S9): formats first, Scope, Advanced open (02 §7.6).
    'g4-download-options': () => {
      viewer(false);
      const fmts = [['GIF', 'Animated loop at the current speed (8 fps), sized for chat.', 1], ['PNG · this frame', 'Original pixels, one image.'],
        ['Sprite sheet (ZIP)', 'One PNG sheet + JSON frame data.'], ['All frames (ZIP)', 'Every frame as its own PNG.'],
        ['PixelLab original (ZIP)', 'PixelLab\'s own file, unchanged.'], ['PixelLab sprite sheet (ZIP)', 'PixelLab\'s own sprite sheet for this state, unchanged.']];
      add(bigDlg('Download Android Courier', 'Character · Walk · East', `
        <div>${hdr('Format')}<ul class="glass-list g4-radios" role="radiogroup">${fmts.map(([t, d, on]) => `<li class="glass-list__item glass-list__item--interactive"><span class="glass-list__leading">${radio('fmt', on)}</span><div class="glass-list__content"><div class="glass-list__title">${t}</div><div class="glass-list__subtitle">${d}</div></div></li>`).join('')}</ul></div>
        <div class="g4-line"><span>Scope</span>${seg('Scope', ['This animation', 'Everything'], 'This animation')}</div>
        <details class="g4-adv" open><summary>Advanced${I.chev}</summary>
          <div class="g4-line"><span>Scale</span>${seg('Scale', ['Auto', '1×', '2×', '4×', '8×'], 'Auto')}</div>
          <div class="g4-line"><span>GIF matte</span>${seg('GIF matte', ['Transparent', 'Backdrop'], 'Transparent')}</div>
          <div class="g4-line"><span>File name</span><div class="glass-input-wrap g4-fname"><input class="glass-input" value="android-courier_walk_east@4x" aria-label="File name"><span class="glass-input-wrap__suffix">.gif</span></div></div>
        </details>`, dlFoot('1 file · about 38 KB')));
    },

    // Multi-asset dialog (S9): 3 presets, asset counts only, parts notice; Advanced collapsed.
    'g4-download-multi': () => {
      category(sel3); add(selBar('12 selected'));
      const stack = ['char-orb-mage-south', 'char-android-walk-south-f00', 'obj-treasure-chest-closed', 'item-ruby-ring'].map(a => `<i data-art="${a}" data-pad="0.12"></i>`).join('');
      const presets = [[G.sheet, 'Sprite sheets', 'A PNG sheet + JSON per asset; tilesets as returned; stills as PNG.', 1],
        [G.frames, 'All frames', 'Every frame and still as its own PNG.'], [G.gif, 'GIFs', 'One GIF per animation and direction at its playback speed; stills as PNG.']];
      add(bigDlg('Download 12 assets', '3 characters (5 states) · 5 objects · 4 images', `
        <div class="g4-presets" role="radiogroup" aria-label="What to download">${presets.map(([ic, t, d, on]) => `<label class="g4-preset${on ? ' on' : ''}"><span class="g4-pi">${ic}</span>${radio('preset', on)}<b>${t}</b><span>${d}</span></label>`).join('')}</div>
        <details class="g4-adv"><summary>Advanced<span class="g4-sum">Scale, GIF matte, file name</span>${I.right}</summary></details>
        <p class="g4-parts">${I.info}Large downloads may be saved in parts.</p>`, dlFoot(), 'g4-multi', `<div class="g4-stack">${stack}<span>+8</span></div>`));
    },

    // Background download chip (S10) above the dock; browsing continues.
    'g4-download-progress': () => {
      home(); add(dockHome, `<div class="glass-popover is-open vt-scrim hi g4-chip" role="status"><span class="g4-ci">${I.down}</span>
        <div class="g4-ct"><b>Downloading 132 / 480 · 41 MB</b><div class="glass-progress glass-progress--sm"><div class="glass-progress__track"><div class="glass-progress__fill" style="width:27.5%"></div></div></div></div>
        <button class="glass-btn glass-btn--tertiary glass-btn--sm glass-btn--auto">Cancel</button></div>`);
    },

    // Ready sheet (S11): touch devices with share support on the in-memory path; a centred card on a touch tablet.
    'g4-download-ready': () => {
      category(sel3); add(selBar('12 selected'));
      add(ov(`<div class="glass-modal g4-dlg vt-scrim hi g4-ready" role="dialog" aria-label="Download ready">
        <div class="g4-file"><span class="g4-zip">${G.zip}</span><div><b>vitrine-selection-12-2026-10-19.zip</b><span>18.4 MB</span></div></div>
        <button class="glass-btn glass-btn--primary">Share or save…</button><button class="glass-btn glass-btn--tertiary">${I.down}Download file</button></div>`, 'g4-sheet'));
    },

    // Partial-failure report (S12): Retry failed covers the retryable reasons only (02 §7.7).
    'g4-download-report': () => {
      category(); add(dockCat);
      const fails = [['map-meadow-ruins|cover|1', 'Meadow Ruins', 'Map', 'Too large for this device at 8×. Try a smaller scale.'],
        ['creator-goblin-idle-f00', 'Goblin Brute Idle', 'Image', 'Network problem.'], ['', 'Rusty Key', 'Object', 'Not found in PixelLab. It may have been deleted.']];
      add(bigDlg('Download report', 'Downloaded 477 assets. 3 couldn\'t be downloaded.', `<ul class="glass-list g4-fails">${fails.map(([a, n, t, why]) => `<li class="glass-list__item">${a ? thumb(a) : `<span class="glass-list__leading glass-list__leading--lg g4-th">${G.warn}</span>`}<div class="glass-list__content"><div class="glass-list__title">${n} <small>· ${t}</small></div><div class="glass-list__subtitle glass-list__subtitle--wrap">${why}</div></div></li>`).join('')}</ul>`,
        '<span class="g4-count"></span><button class="glass-btn glass-btn--tertiary glass-btn--auto">Close</button><button class="glass-btn glass-btn--primary glass-btn--auto">Retry failed</button>', 'g4-report'));
    },

    // Toast specimens, stacked where GlassKit shows one at a time (02 §12.2, §12.4).
    'g4-toasts': () => {
      category(); add(dockCat);
      const t = (ic, text, act, cls = '') => `<div class="glass-toast is-visible g4-t ${cls}" role="status"><span class="glass-toast__icon">${ic}</span><span class="glass-toast__text">${text}</span>${act ? `<button class="glass-toast__action">${act}</button>` : ''}</div>`;
      add(`<div class="g4-toasts">${[t(I.folder, 'Added 3 to Hero party.', 'Undo'), t(I.folder, 'Removed from Dungeon kit. It\'s still in your library.', 'Undo'),
        t(G.trash, 'Deleted "Boss rush". Your assets are untouched.', 'Undo'), t(I.heart, 'Added 12 to Favorites.'),
        t(I.x, 'Download canceled. Nothing was saved.'), t(G.warn, 'A download is already running. Wait for it to finish or cancel it.', '', 'glass-toast--warning'),
        t(G.warn, 'Downloaded 477 assets. 3 couldn\'t be downloaded.', 'View report', 'glass-toast--warning')].join('')}</div>`);
    },
  });
}
