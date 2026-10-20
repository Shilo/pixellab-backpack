// Concept 1, "Just the Art": builds one static screen per page from <body data-screen>. Render-only.
(function () {
  var D = window.SAMPLE_DATA, screen = document.body.dataset.screen, dpr = devicePixelRatio;
  var fix = function (p) { return p && p.replace('../shared/', '../../shared/'); };
  var byId = function (id) { return D.assets.filter(function (a) { return a.id === id; })[0]; };
  var P = {
    x: '<path d="M6 6l12 12M18 6L6 18"/>', chev: '<path d="M7 10l5 5 5-5"/>',
    heart: '<path d="M12 20s-7.5-4.6-7.5-10.1A4.3 4.3 0 0 1 12 7.4a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="7.8" r=".6" fill="currentColor"/>',
    more: '<circle cx="6" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="18" cy="12" r="1.3" fill="currentColor"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    ext: '<path d="M8 16L16 8M9.5 8H16v6.5"/>', copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
    all: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    folder: '<path d="M3.5 7.5A2 2 0 0 1 5.5 5.5h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
    plus: '<path d="M12 6v12M6 12h12"/>'
  };
  var ic = function (n) { return '<svg class="i" viewBox="0 0 24 24">' + P[n] + '</svg>'; };
  var h = function (html) { document.body.insertAdjacentHTML('beforeend', html); };

  // Integer-scale pixel art into a CSS box once it decodes (smooth only when it must shrink).
  function fit(img, box, trim) {
    var go = function () {
      var w = img.naturalWidth, hh = img.naturalHeight;
      if (trim) { var b = bbox(img); w = b[2] - b[0]; hh = b[3] - b[1]; img.style.objectViewBox = 'inset(' + b[1] + 'px ' + (img.naturalWidth - b[2]) + 'px ' + (img.naturalHeight - b[3]) + 'px ' + b[0] + 'px)'; }
      var s = integerScale(w, hh, box, box, dpr);
      img.style.width = s.cssW + 'px'; img.style.height = s.cssH + 'px';
      if (s.smooth) img.classList.add('smooth');
    };
    img.complete ? go() : img.addEventListener('load', go);
  }

  // Opaque-pixel bounds plus 2 px air (needs file access for getImageData in the render browser).
  function bbox(img) {
    var c = document.createElement('canvas'), w = c.width = img.naturalWidth, hh = c.height = img.naturalHeight, x = c.getContext('2d');
    x.drawImage(img, 0, 0); var d = x.getImageData(0, 0, w, hh).data, b = [w, hh, 0, 0];
    for (var i = 3; i < d.length; i += 4) if (d[i]) { var px = (i >> 2) % w, py = (i >> 2) / w | 0; b[0] = Math.min(b[0], px); b[1] = Math.min(b[1], py); b[2] = Math.max(b[2], px + 1); b[3] = Math.max(b[3], py + 1); }
    return [Math.max(0, b[0] - 2), Math.max(0, b[1] - 2), Math.min(w, b[2] + 2), Math.min(hh, b[3] + 2)];
  }

  if (screen === 'home' || screen === 'menu') {
    h('<header class="top"><button class="scope">All assets' + ic('chev') + '</button>' +
      '<div class="tools"><div class="search">' + ic('search') + '<span>Search</span><kbd>/</kbd></div>' +
      '<button class="pill">Select</button><button class="round" aria-label="More">' + ic('more') + '</button></div></header>');
    // ponytail: hand-picked lead items for variety, then createdAt desc; processing items (no thumb) omitted.
    var lead = ['chr_0001', 'obj_0001', 'map_0001', 'chr_0003', 'obj_0004', 'vfx_0001', 'obj_0005', 'chr_0004', 'tds_0001', 'img_0017', 'mob_0001', 'iso_0001'];
    var list = lead.map(byId).concat(D.assets.filter(function (a) { return a.thumb && lead.indexOf(a.id) < 0; }).sort(function (a, b) { return a.createdAt < b.createdAt ? 1 : -1; })).slice(0, 40);
    var g = document.createElement('main'); g.className = 'grid'; document.body.appendChild(g);
    list.forEach(function (a, i) {
      var hover = screen === 'home' && a.id === 'chr_0001';
      g.insertAdjacentHTML('beforeend', '<div class="cell' + (hover ? ' hover' : '') + '"><img class="px" src="' + fix(a.thumb) + '" alt="">' +
        (hover ? '<span class="sel"></span><span class="fav">' + ic('heart') + '</span><span class="name">' + a.name + '</span>' : '') + '</div>');
      fit(g.lastChild.querySelector('img'), 124, true);
    });
    if (screen === 'home') {
      requestAnimationFrame(function () {
        var c = g.querySelector('.hover').getBoundingClientRect();
        h('<svg class="cursor" viewBox="0 0 22 30" style="left:' + (c.left + 120) + 'px;top:' + (c.top + 100) + 'px"><path d="M2 2v22l6-5.5 4 9 3.6-1.6-4-8.7H20z" fill="#fff" stroke="#000" stroke-width="1.4" stroke-linejoin="round"/></svg>');
      });
    }
    if (screen === 'menu') {
      var cnt = function (types) { return D.assets.filter(function (a) { return types.indexOf(a.type) >= 0; }).length; };
      // ponytail: VFX and fonts fold into Images so the menu keeps the seven brief-defined types.
      var types = [['Characters', ['character'], 'chr_0001'], ['Objects', ['object'], 'obj_0003'], ['Images', ['creator_image', 'vfx', 'font'], 'img_0017'],
        ['Tilesets', ['tileset_topdown', 'tileset_sidescroller'], 'tds_0001'], ['Tiles', ['tiles_pro', 'tile_isometric'], 'iso_0001'],
        ['Maps', ['map', 'map_object'], 'map_0001'], ['UI', ['ui_asset'], 'ui_0006']];
      var row = function (lead, name, n, cls) { return '<div class="row ' + (cls || '') + '"><span class="lead">' + lead + '</span><b>' + name + '</b>' + (n != null ? '<em>' + n + '</em>' : '') + (cls === 'on' ? ic('check').replace('class="i"', 'class="i chk"') : '') + '</div>'; };
      var thumb = function (id) { return '<img class="px" data-fit src="' + fix(byId(id).thumb) + '" alt="">'; };
      var html = '<div class="menu" style="left:30px;top:92px">' + row(ic('all'), 'All assets', null, 'on') + row(ic('heart'), 'Favorites', D.favorites.length) +
        '<h6>Types</h6>' + types.map(function (t) { return row(thumb(t[2]), t[0], cnt(t[1])); }).join('') +
        '<h6>Folders</h6>' + D.folders.map(function (f) { return row(thumb(f.assetIds[0]), f.name, f.assetIds.length); }).join('') +
        '<hr>' + row(ic('plus'), 'New folder…', null, 'quiet') + '</div>';
      h(html);
      document.querySelectorAll('[data-fit]').forEach(function (im) { fit(im, 28, true); });
    }
  }

  if (screen === 'detail' || screen === 'info') {
    var a = byId('chr_0004');
    if (screen === 'info') document.body.classList.add('info');
    h('<div class="stage"><div class="art"><div class="wrap"><div class="floor"></div><img class="px" id="sprite" src="' + fix(a.animations[0].frames.east[3]) + '" alt="' + a.name + '"></div></div></div>' +
      '<button class="fl close glass" aria-label="Close">' + ic('x') + '</button>' +
      '<div class="fl acts"><div class="cap glass"><button aria-label="Favorite">' + ic('heart') + '</button><button aria-label="Info"' + (screen === 'info' ? ' class="on"' : '') + '>' + ic('info') + '</button><button aria-label="More">' + ic('more') + '</button></div>' +
      '<div class="dl"><button class="main">Download GIF</button><button class="more" aria-label="Download options">' + ic('chev') + '</button></div></div>' +
      '<button class="fl chip glass">Walk · East' + ic('chev') + '</button>');
    fit(document.getElementById('sprite'), 560);
    if (screen === 'info') {
      var folders = D.folders.filter(function (f) { return f.assetIds.indexOf(a.id) >= 0; });
      var r = function (k, v) { return '<div class="r"><span>' + k + '</span><strong>' + v + '</strong></div>'; };
      var created = new Date(a.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      h('<aside class="drawer"><div><h2>' + a.name + '</h2><div class="sub">Character</div></div>' +
        '<div class="grp">' + r('Size', a.width + ' × ' + a.height + ' px') + r('Directions', a.meta.directions) + r('Animations', a.animations.map(function (x) { return x.name; }).join(', ')) +
        r('Frames', a.animations[0].frameCount + ' per direction') + r('View', 'Low top-down') + r('Created', created) + '</div>' +
        '<div><div class="lbl">Prompt<button>' + ic('copy') + 'Copy</button></div><div class="grp prompt">' + a.prompt + '</div></div>' +
        '<div><div class="lbl">Folders</div><div class="grp">' + folders.map(function (f) { return '<div class="r"><span class="fold">' + ic('folder') + f.name + '</span></div>'; }).join('') + '</div></div>' +
        '<button class="ext">Open in PixelLab' + ic('ext') + '</button></aside>');
    }
  }
})();
