// G1: Connect, sync, settings, help and system states (README "Feature inventory"). Copy is 02 §12 word for word.
{ // a block keeps these helpers from colliding with other frame files
  const G = {
    lock: '<svg viewBox="0 0 24 24"><rect x="5" y="10.5" width="14" height="9.5" rx="2.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3.5 5.5 6v5.2c0 4.1 2.8 7.6 6.5 9.3 3.7-1.7 6.5-5.2 6.5-9.3V6z"/><path d="M12 8.5v4.2M12 15.6v.1"/></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M10.3 4.6 3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 16.6v.1"/></svg>',
    wifiOff: '<svg viewBox="0 0 24 24"><path d="M3 8.9a13.5 13.5 0 0 1 3.9-2.6M10.4 5.1A13.5 13.5 0 0 1 21 8.9M6 12.3a8.5 8.5 0 0 1 3.3-2M14.9 10.4a8.5 8.5 0 0 1 3.1 1.9M9 15.6a4.3 4.3 0 0 1 6 0M12 19.2v.1M4 4l16 16"/></svg>',
    cloudOff: '<svg viewBox="0 0 24 24"><path d="M4 4l16 16M7 8.4A4.5 4.5 0 0 0 7.5 17.5h9M10 6.3a5.5 5.5 0 0 1 8.2 4.3 3.5 3.5 0 0 1 1.6 5.8"/></svg>',
    block: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M6 6l12 12"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="M12 4v4M12 16v4M4 12h4M16 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M6.3 17.7l2.8-2.8M14.9 9.1l2.8-2.8"/></svg>',
    hand: '<svg viewBox="0 0 24 24"><path d="M9 11.5V5.8a1.5 1.5 0 0 1 3 0v5M12 10V4.8a1.5 1.5 0 0 1 3 0V11M15 10.5V7a1.5 1.5 0 0 1 3 0v6.5c0 4-2.5 6.5-6 6.5-2.6 0-4-1.2-5.3-3.2L4.6 13.6a1.4 1.4 0 0 1 2.3-1.6L9 14"/></svg>',
    key: '<svg viewBox="0 0 24 24"><circle cx="8" cy="15.5" r="4"/><path d="M11 12.6 19 4.5M16 7.5l2.5 2.5M14 9.5l2 2"/></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M13.5 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8.5z"/><path d="M13.5 3.5v5h5"/></svg>',
    spin: '<svg class="g1-spin" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" opacity=".3"/><path d="M12 4a8 8 0 0 1 8 8"/></svg>',
  };
  const big = innerWidth > 600; // the phone render is 390 px wide (README "Phone layout")
  const btn = (t, kind = 'primary', icon = '', attrs = '') => `<button class="glass-btn glass-btn--${kind} glass-btn--auto"${attrs}>${icon}${t.replace(' ↗', '&nbsp;↗')}</button>`;
  const link = t => `<a class="g1-link" href="#">${t}&nbsp;↗<span class="g1-sr"> (opens PixelLab in a new tab)</span></a>`;
  const tog = (label, on) => `<label class="glass-toggle"><input class="glass-toggle__input" type="checkbox" role="switch"${on ? ' checked' : ''} aria-label="${label}"><span class="glass-toggle__track"><span class="glass-toggle__thumb"></span></span></label>`;
  const seg = (label, items, on) => `<div class="glass-segmented" role="group" aria-label="${label}">${items.map(s => `<button class="glass-segmented__item" aria-pressed="${s === on}">${s}</button>`).join('')}</div>`;
  const li = (title, trailing = '', sub = '', cls = '') => `<li class="glass-list__item${cls ? ' ' + cls : ''}"><div class="glass-list__content"><div class="glass-list__title">${title}</div>${sub ? `<div class="glass-list__subtitle">${sub}</div>` : ''}</div>${trailing ? `<div class="glass-list__trailing">${trailing}</div>` : ''}</li>`;
  const empty = (icon, title, text, actions = '') => `<div class="glass-empty g1-empty vt-scrim"><span class="glass-empty__icon">${icon}</span><h2 class="glass-empty__title">${title}</h2><p class="glass-empty__text">${text}</p>${actions ? `<div class="glass-empty__action">${actions}</div>` : ''}</div>`;
  const pill = (t, { icon = '', bar, cls = '' } = {}) => `<div class="g1-status vt-scrim ${cls}" role="status"><div class="g1-sline">${icon}<span>${t}</span></div>${bar == null ? '' : `<div class="glass-progress glass-progress--sm"><div class="glass-progress__track"><div class="glass-progress__fill" style="width:${bar}%"></div></div></div>`}</div>`;
  const modal = (inner, cls = '', ov = '') => `<div class="glass-modal-overlay is-active g1-ov ${ov}"><div class="glass-modal g1-modal ${cls}" role="dialog" aria-modal="true">${inner}</div></div>`;
  const xBtn = label => `<button class="glass-pill g1-x" aria-label="${label}">${I.x}</button>`;
  const dockPlain = dock(item(ico(I.lib) + lbl('Library'), 'is-active', ' aria-current="page"') + searchField('Search your library', '/') + item(ico(I.more), 'vt-icon', ' aria-label="More"'));
  const lib = (types = T, mine = M) => add(`<main class="library">${types.map(tile).join('')}<div class="sec mine">Favorites and folders</div>${mine.map(tile).join('')}</main>`);
  const banner = html => document.querySelector('main').prepend(h(`<div class="g1-inline">${html}</div>`));
  const above = (el, anchor, gap = 10) => { const r = anchor.getBoundingClientRect(); add(el); at(el, r.left + r.width / 2 - el.offsetWidth / 2, r.top - el.offsetHeight - gap); };
  const head = (t, s) => `<li class="g1-mhead"><b>${t}</b>${s ? `<span>${s}</span>` : ''}</li>`;

  // Connect (S1). state: '' | testing | invalid | offline; welcome adds the session-mode notice.
  const connect = (state = '', welcome = false) => {
    const err = { invalid: "That API key didn't work. Copy it again from your PixelLab account page and paste it here.", offline: "You're offline. Connect to the internet and try again." }[state];
    const filled = state !== '', bad = state === 'invalid'; // offline isn't the key's fault: no red field
    add(`<main class="g1-connect">
      <section class="g1-intro">
        <div class="g1-mark"><span class="g1-logo">${I.lib}</span><b>Vitrine</b></div>
        <h1>Your PixelLab art, all in one place</h1>
        <p class="g1-value">Vitrine shows everything in your PixelLab account. It only looks. It never creates, changes, or deletes anything.</p>
        <div class="g1-show" aria-hidden="true">${['char-orb-mage-south', 'obj-treasure-chest-closed', 'item-iron-helmet', 'iso-grass-block', 'item-red-health-potion'].map(a => `<i data-art="${a}" data-pad="0.16"></i>`).join('')}</div>
      </section>
      <section class="glass-card glass-card--glow g1-form">
        ${welcome ? `<div class="g1-note g1-welcome">${I.info}<p>Welcome back! Your API key was kept for one tab only, so paste it again here.</p></div>` : ''}
        <h2>Get your API key</h2>
        <ol class="g1-steps">
          <li><span class="glass-steps__num">1</span><p>${link('Open your PixelLab account page')} (sign in if PixelLab asks).</p></li>
          <li><span class="glass-steps__num">2</span><p>Tap <b>Copy API key</b>. It's a secret token, so keep it private, like a password.</p></li>
          <li><span class="glass-steps__num">3</span><p>Come back to this tab and paste it below.</p></li>
        </ol>
        <form class="glass-input-group g1-field" onsubmit="return false">
          <input type="text" name="username" value="PixelLab API key" autocomplete="username" hidden>
          <label class="glass-label" for="g1-key">PixelLab API key</label>
          <div class="glass-input-wrap">
            <input id="g1-key" class="glass-input${bad ? ' glass-input--error' : ''}" type="password" placeholder="Paste your API key" autocomplete="current-password"${filled ? ' value="vitrine-mockup-placeholder-1234"' : ''}${state === 'testing' ? ' readonly' : ''}${bad ? ' aria-invalid="true"' : ''} aria-describedby="g1-help">
            <span class="glass-input-wrap__suffix"><button type="button" class="g1-reveal" aria-pressed="false">Show</button></span>
          </div>
          <p class="glass-hint${bad ? ' glass-hint--error' : err ? ' g1-warnhint' : ''}" id="g1-help" role="${err ? 'alert' : 'note'}">${err ? (state === 'offline' ? G.wifiOff : G.alert) + `<span>${err}</span>` : 'We test it as soon as you paste it.'}</p>
          <button class="glass-btn glass-btn--primary g1-test"${state === 'testing' ? ' aria-disabled="true"' : ''}>${state === 'testing' ? G.spin + 'Testing…' : 'Test key'}</button>
        </form>
        <div class="g1-note">${G.shield}<p>Heads up: PixelLab API keys give full access to your account, including spending credits. Vitrine only reads.</p></div>
      </section>
      <footer class="g1-fine"><p>${G.lock}Your API key goes only to PixelLab's API. Vitrine has no servers and no analytics.</p><p>Unofficial. Not affiliated with or endorsed by PixelLab.</p></footer>
    </main>`);
    document.body.classList.add('g1-page');
    if (big && (state === '' || bad)) document.getElementById('g1-key').focus(); // fine pointers only (02 §3.1 step 1)
  };

  // First sync: some tiles streamed in, the rest skeleton (02 §3.2).
  const firstSync = () => {
    lib();
    const loaded = [4, 4, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // art cells per tile that have arrived
    const counts = ['4', '12', '6'];
    document.querySelectorAll('.tile').forEach((t, i) => {
      [...t.querySelectorAll('[data-art]')].slice(loaded[i]).forEach(c => c.replaceWith(h('<i class="g1-sk"></i>')));
      if (counts[i]) t.querySelector('.tlabel span').textContent = counts[i];
      else t.querySelector('.tlabel').innerHTML = '<i class="g1-skl"></i>';
    });
  };

  // Settings (S16) in one scrolling dialog; data: scrolled to Folders & favorites, Storage, About.
  const settings = ({ keep = false, data = false } = {}) => {
    lib(); add(dockHome);
    const sw = ['theme', 'checker', 'light', 'mid', 'black'];
    const sec = (t, rows, foot = '') => `<section><h3 class="glass-list__section-header">${t}</h3><ul class="glass-list">${rows.join('')}</ul>${foot ? `<p class="g1-foot">${foot}</p>` : ''}</section>`;
    add(modal(`<div class="g1-dhead"><h2 class="glass-modal__title">Settings</h2>${xBtn('Close settings')}</div><div class="g1-scroll">
      ${sec('PixelLab connection', [
        li('<span class="g1-dot ok"></span>Connected', btn('Test', 'tertiary', '', ' data-sm'), 'API key ending ••••a1b2'),
        li('Plan', val('Subscription'), '1,840 generations left · 42 credits'),
        li('Keep me signed in', tog('Keep me signed in', keep), keep ? 'Saved in this browser so you don\'t need to paste it again. Anyone using this browser profile could use it, so don\'t turn this on for shared computers.' : 'Kept in this tab only. You\'ll paste it again in a new tab.', 'g1-wrap'),
        li('Forget key', '', '', 'glass-list__item--interactive glass-list__item--danger')],
        `Need to revoke this key? ${link('Generate a new API key in your PixelLab account')}`)}
      ${sec('Library', [
        li('Sync now', I.sync, 'Last synced 2 min ago', 'glass-list__item--interactive'),
        li('Play previews', tog('Play previews', true)),
        li('Grid size', seg('Grid size', ['S', 'M', 'L', 'XL'], 'M')),
        li('Default backdrop', `<div class="g1-sw" role="radiogroup" aria-label="Default backdrop">${sw.map((s, i) => `<span class="g1-swatch ${s}" role="radio" aria-checked="${!i}" aria-label="${s[0].toUpperCase() + s.slice(1)}"></span>`).join('')}</div>`)])}
      ${sec('Appearance', [li('Theme', seg('Theme', ['System', 'Light', 'Dark'], 'System'))])}
      ${sec('Keyboard', [li('Single-key shortcuts', tog('Single-key shortcuts', true)),
        li('<span class="vt-desk">Show shortcuts</span><span class="vt-phone">Show gestures</span>', I.right, '', 'glass-list__item--interactive')])}
      ${sec('Folders & favorites', [
        li(`${D.folders.length} folders · ${D.favorites.length} favorites`, '', 'They live only in this browser. Download a backup now and then.', 'g1-wrap'),
        li('Download backup (.json)', I.down, '', 'glass-list__item--interactive'),
        li('Import backup…', I.right, '', 'glass-list__item--interactive')])}
      ${sec('Storage', [
        li('Using 2 MB', '', keep ? '' : 'Nothing is saved between sessions in “This tab only” mode.', 'g1-wrap'),
        li('May be cleared by the browser', btn('Protect', 'tertiary', '', ' data-sm'))])}
      ${sec('About', [
        li('Vitrine', val('Version 1.0')),
        `<li class="glass-list__item g1-prose"><p>Vitrine is an unofficial gallery for your PixelLab assets. It isn't made by, affiliated with, or endorsed by PixelLab.</p><p>No analytics, no tracking, no servers. Vitrine talks only to PixelLab's API and image host.</p></li>`,
        `<li class="glass-list__item g1-prose"><p><b>Other PixelLab content isn't in the public API yet.</b> Fonts, effects, portraits and talking animations can't be read through PixelLab's public API, so Vitrine can't show them. Find them in PixelLab: ${['Fonts', 'Effects', 'Portraits', 'Talking animations'].map(link).join(' · ')}</p></li>`,
        li('Source code ↗', '', '', 'glass-list__item--interactive'),
        li('Licenses', I.right, '', 'glass-list__item--interactive')])}
    </div>`, 'g1-set', 'g1-sheet'));
    if (data) { const sc = document.querySelector('.g1-scroll'); sc.scrollTop = sc.children[4].offsetTop - sc.offsetTop; } // Folders & favorites at the top
  };
  const confirm = (title, body, ok) => add(modal(`<div class="glass-modal__header"><h2 class="glass-modal__title">${title}</h2></div><div class="glass-modal__body">${body}</div>
    <div class="glass-modal__footer"><button class="glass-modal__action">Cancel</button><button class="glass-modal__action glass-modal__action--danger">${ok}</button></div>`, 'g1-alert'));

  // Help (S17): generated from 02 §9.5. Single-key rows (third field) are struck through when shortcuts are off.
  const KEYS = {
    Library: [['/', 'Search', 1], ['?', 'This help', 1], ['Arrows', 'Move between cards'], ['Home / End', 'First / last card'], ['Enter / Space', 'Open'], ['X', 'Select', 1],
      ['Ctrl + A', 'Select all in view'], ['L', 'Favorite', 1], ['D', 'Download', 1], ['+ / −', 'Grid size', 1], ['Shift + F10', 'Card menu'], ['Esc', 'Clear search, close, or leave selection']],
    Viewer: [['← / →', 'Previous / next asset'], ['Space', 'Play / pause'], [', / .', 'Frame back / forward', 1], ['Home / End', 'First / last frame'], ['[ / ]', 'Turn direction', 1], ['+ / −', 'Zoom', 1],
      ['Z', 'Fit ↔ actual size', 1], ['Shift + Arrows', 'Pan'], ['I', 'Info panel', 1], ['F', 'Fullscreen', 1], ['L', 'Favorite', 1], ['D', 'Download', 1], ['Esc', 'Close']],
  };
  const GESTURES = {
    Library: [['Tap', 'Open'], ['Long-press', 'Select'], ['Pinch', 'Browser zoom (grid size has its own control)']],
    Viewer: [['Swipe ← / →', 'Next / previous asset'], ['Swipe ↓', 'Close'], ['Swipe ↑', 'Show info'], ['Tap a frame', 'Jump to it'], ['Double-tap', 'Zoom'], ['Pinch', 'Zoom'], ['Drag', 'Pan (when zoomed)'], ['Tap the stage', 'Show or hide controls']],
  };
  const caps = k => k.split(/ ([/+]) /).map((c, i) => i % 2 ? `<span class="g1-or">${c}</span>` : `<span class="g1-k">${c}</span>`).join('');
  const help = off => {
    lib(); add(dockHome);
    const keys = off || big;
    const groups = Object.entries(keys ? KEYS : GESTURES).map(([g, rows]) => `<section><h3 class="glass-list__section-header">${g}</h3><ul class="glass-list">${rows.map(([k, t, single]) =>
      `<li class="glass-list__item${off && single ? ' g1-off' : ''}">${keys ? `<span class="g1-keys">${caps(k)}</span>` : `<b class="g1-gest">${k}</b>`}<span class="g1-act">${t}${off && single ? ' <small>(off)</small>' : ''}</span></li>`).join('')}</ul></section>`).join('');
    add(modal(`<div class="g1-dhead"><h2 class="glass-modal__title">Keys and gestures</h2>${xBtn('Close help')}</div>
      <div class="g1-tabs">${seg('Show', ['Keys', 'Gestures'], keys ? 'Keys' : 'Gestures')}</div>
      ${off ? `<div class="g1-note g1-offnote">${I.keys}<p>Single-key shortcuts are off. Turn them on in Settings.</p></div>` : ''}
      <div class="g1-scroll g1-cols">${groups}</div>`, 'g1-help', 'g1-sheet'));
  };

  Object.assign(FRAMES, {
    'g1-connect': () => connect(),
    'g1-connect-testing': () => connect('testing'),
    'g1-connect-invalid': () => connect('invalid'),
    'g1-connect-welcome-back': () => connect('', true),
    'g1-connect-offline': () => connect('offline'),

    'g1-cors-blocked': () => {
      add(`<main class="g1-state">${empty(G.block, 'PixelLab is blocking this browser', 'PixelLab may have changed how its API works with websites. Nothing is wrong with your account.', btn('Try again', 'primary', I.sync))}</main>`, dockPlain);
    },
    'g1-first-sync': () => { firstSync(); add(dockPlain, pill('Syncing… 340 of ~1,200', { icon: G.spin, bar: 28 })); },
    'g1-keep-signed-in': () => {
      lib(); add(dockHome);
      banner(`<div class="g1-ico">${G.lock}</div><div class="g1-btext"><b>Keep me signed in on this device?</b><p>You won't need to paste your API key again in this browser. Don't use this on a shared computer.</p></div>
        <div class="g1-bact">${btn('Not now', 'tertiary')}${btn('Keep me signed in')}</div>`);
    },
    'g1-sync-detail': () => { // opened from the library "…" → Sync now row (08 §7)
      add(dockHome); lib();
      const r = document.querySelector('.vt-dock .vt-icon').getBoundingClientRect();
      const m = menu([[head('Your library', 'Last synced 2 min ago · 75 assets')],
        T.map(([t, c]) => row(t, val(c) + `<span class="g1-ok">${I.tick}</span>`)),
        [row('Sync now', I.sync)]], 310);
      add('<div class="dim light"></div>', m); at(m, r.right - 310 + 7, r.top - m.offsetHeight - 21);
    },
    'g1-partial-sync': () => {
      lib(T.filter(t => t[0] !== 'Maps')); add(dockHome);
      const p = h(pill("Some assets didn't load", { icon: G.alert, cls: 'warn' }));
      add('<div class="dim light"></div>', p);
      const m = menu([[head("Some assets didn't load", "Maps couldn't be loaded.")],
        T.map(([t, c]) => t === 'Maps' ? row(`<span class="g1-warn">${G.alert}</span>Maps`, btn('Retry', 'tertiary', '', ' data-sm'), 'g1-failed', "Couldn't be loaded")
          : row(t, val(c) + `<span class="g1-ok">${I.tick}</span>`)),
        [row('Sync now', I.sync, '', 'Last synced 2 min ago')]], 310);
      above(m, p);
    },
    'g1-rate-limited': () => { firstSync(); add(dockPlain, pill('PixelLab asked us to slow down. Continuing shortly…', { icon: I.clock, bar: 28, cls: 'paused' })); },
    'g1-generating': () => {
      add(dockHome); lib();
      const r = document.querySelector('.vt-dock .vt-icon').getBoundingClientRect();
      const st = (n, t, k) => `<span class="glass-badge g1-chip"><i class="g1-dot ${k}"></i>${n} ${t}</span>`;
      const ext = t => `<span class="g1-open" aria-label="Open ${t} in PixelLab (opens PixelLab in a new tab)">Open${I.ext}</span>`;
      const m = menu([[head('Still in PixelLab', "They'll show up here when they're done.")],
        [row('Characters', ext('Characters'), 'g1-gen', st(1, 'generating', 'run')),
          row('Objects', ext('Objects'), 'g1-gen', st(1, 'generating', 'run') + st(1, 'needs review', 'rev')),
          row('UI', ext('UI'), 'g1-gen', st(1, 'failed', 'fail'))]]);
      m.classList.add('g1-wide'); add('<div class="dim light"></div>', m); at(m, r.right - m.offsetWidth + 7, r.top - m.offsetHeight - 21);
    },
    'g1-reconnect': () => {
      lib(); add(dockHome);
      add(modal(`<div class="g1-mico">${G.key}</div><div class="glass-modal__header"><h2 class="glass-modal__title">Reconnect to PixelLab</h2></div>
        <div class="glass-modal__body"><p>Your API key stopped working. It may have been replaced in your PixelLab account. Paste a new one to continue. Your folders and favorites are safe.</p>
        <form class="glass-input-group g1-field" onsubmit="return false"><label class="glass-label" for="g1-key2">PixelLab API key</label>
          <div class="glass-input-wrap"><input id="g1-key2" class="glass-input" type="password" placeholder="Paste your API key" autocomplete="current-password"><span class="glass-input-wrap__suffix"><button type="button" class="g1-reveal">Show</button></span></div>
          <button class="glass-btn glass-btn--primary g1-test">Test key</button></form>
        <p class="g1-mlink">${link('Get a new API key')}</p></div>`, 'g1-recon'));
      if (big) document.getElementById('g1-key2').focus();
    },
    'g1-offline-cached': () => {
      lib(); add(dockHome, pill('Offline · saved library', { icon: G.wifiOff }));
      [[2, 3], [2, 4], [3, 1], [3, 5], [4, 2], [5, 3], [5, 4]].forEach(([t, c]) => // thumbnails that were never saved
        document.querySelectorAll('.tile')[t].querySelectorAll('[data-art]')[c]?.replaceWith(h(`<i class="g1-ph">${G.cloudOff}</i>`)));
      banner(`<div class="g1-ico">${G.wifiOff}</div><div class="g1-btext"><b>You're offline. Showing your saved library.</b></div>`);
      document.querySelector('.g1-inline').classList.add('slim');
    },
    'g1-offline-empty': () => add(`<main class="g1-state">${empty(G.wifiOff, "You're offline.", 'Connect to the internet to load your PixelLab library.', btn('Try again', 'primary', I.sync))}</main>`, dockPlain),
    'g1-empty-library': () => add(`<main class="g1-state">${empty(I.lib, 'Nothing here yet.', "Create something in PixelLab and it'll show up here.", btn('Sync again', 'tertiary', I.sync) + btn('Open PixelLab ↗'))}</main>`, dockPlain),
    'g1-empty-library-almost': () => add(`<main class="g1-state">${empty(G.spark, 'Almost there.', 'Your first assets are still being made in PixelLab. Check back in a minute.', btn('Sync again', 'primary', I.sync))}</main>`, dockPlain),
    'g1-images-unavailable': () => add(`<main class="g1-state">${empty(G.lock, "Creator images aren't available yet.", 'The only public way to read them might also save data to your account. Vitrine stays strictly view-only, so it leaves them out for now.', btn('Open your Creator gallery in PixelLab ↗'))}</main>`,
      dock(item(ico(I.back) + lbl('Library'), 'vt-back') + '<span class="vr"></span><span class="crumb">Images</span>' + item(ico(I.search), 'vt-icon', ' aria-label="Search"') + item(ico(I.more), 'vt-icon', ' aria-label="More"'))),

    'g1-settings': () => settings(),
    'g1-settings-data': () => settings({ data: true }),
    'g1-confirm-forget': () => {
      settings();
      confirm('Forget your API key?', `<p>Vitrine will disconnect on this device and delete its saved copy of your library. Your PixelLab account isn't affected.</p>
        <label class="glass-checkbox g1-check"><input class="glass-checkbox__input" type="checkbox"><span class="glass-checkbox__box">${I.boxTick}</span><span class="glass-checkbox__label">Also delete my folders and favorites.</span></label>
        <p class="g1-small"><em>Your browser may still keep some images in its own cache. Clear your browsing data to remove them.</em></p>`, 'Forget key');
    },
    'g1-confirm-stop-signed-in': () => {
      settings({ keep: true });
      confirm('Stop keeping you signed in?', "<p>Vitrine will delete your saved API key and its saved copy of your library from this browser. You'll stay connected in this tab.</p>", 'Stop');
    },
    'g1-help': () => help(false),
    'g1-help-off': () => help(true),
    'g1-import-result': () => {
      settings({ data: true });
      add(modal(`<div class="g1-mico ok">${I.tick}</div><div class="glass-modal__header"><h2 class="glass-modal__title">Backup imported</h2></div>
        <div class="glass-modal__body"><p>Imported 3 folders (2 merged) and 10 favorites. 2 items aren't in this library.</p>
        <ul class="glass-list g1-counts">${li('Folders', val('3'), '2 merged by name: Hero party, Dungeon kit')}${li('Favorites', val('10'))}${li("Not in this library", val('2'), 'They may have been deleted in PixelLab.')}</ul></div>
        <div class="glass-modal__footer"><button class="glass-modal__action glass-modal__action--primary">OK</button></div>`, 'g1-alert'));
    },
    'g1-import-invalid': () => {
      settings({ data: true });
      add(modal(`<div class="g1-mico err">${G.file}</div><div class="glass-modal__header"><h2 class="glass-modal__title">That file isn't a Vitrine backup.</h2></div>
        <div class="glass-modal__body"><p>Choose a .json file you saved with Download backup.</p></div>
        <div class="glass-modal__footer"><button class="glass-modal__action glass-modal__action--primary">OK</button></div>`, 'g1-alert'));
    },
    'g1-backup-tip': () => {
      lib(); add(dockHome);
      const main = document.querySelector('main'), sec = main.querySelector('.sec.mine');
      sec.after(h(`<div class="g1-inline"><div class="g1-ico">${I.folder}</div><div class="g1-btext"><p>Your folders and favorites live only in this browser, and browsers sometimes clear site data. Download a backup to keep them safe.</p></div>
        <div class="g1-bact">${btn('Not now', 'tertiary')}${btn('Download backup', 'primary', I.downFill)}</div></div>`));
      main.scrollTop = sec.offsetTop - (big ? 28 : 16);
    },
    'g1-toast-storage': () => {
      lib(); add(dockHome, `<div class="glass-toast glass-toast--warning is-visible g1-toast vt-scrim" role="status"><svg class="glass-toast__icon" viewBox="0 0 24 24"><path d="M10.3 4.6 3.4 17a2 2 0 0 0 1.7 3h13.8a2 2 0 0 0 1.7-3L13.7 4.6a2 2 0 0 0-3.4 0z"/><path d="M12 9.5v4M12 16.6v.1"/></svg>
        <span class="glass-toast__text">This device is low on storage. Vitrine cleared saved images; your folders and favorites are safe.</span><button class="glass-toast__close" aria-label="Dismiss">${I.x}</button></div>`);
    },
  });
}
