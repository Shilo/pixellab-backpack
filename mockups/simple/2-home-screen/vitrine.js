// Static mockup renderer for concept 2 "Home Screen". Renders only; nothing is interactive.
const D = window.SAMPLE_DATA, byId = Object.fromEntries(D.assets.map(a => [a.id, a]));
const pending = [];
const I = {
  search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>',
  chev: '<svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6"/></svg>',
  more: '<svg viewBox="0 0 24 24" style="fill:currentColor;stroke:none"><circle cx="5.5" cy="12" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="18.5" cy="12" r="1.7"/></svg>',
  x: '<svg viewBox="0 0 24 24"><path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/></svg>',
  heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.3a4.3 4.3 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
  info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.6v.1"/></svg>',
  down: '<svg viewBox="0 0 24 24"><path d="M12 4.5v11M7 11l5 5 5-5M5 19.5h14"/></svg>',
  open: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4"/><path d="M10 14l4-4M10.5 10H14v3.5"/></svg>',
  folder: '<svg viewBox="0 0 24 24"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v7.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/><path d="M12 10.5v5M9.5 13h5"/></svg>',
  check: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5"/><path d="m8.5 12.2 2.4 2.4 4.6-4.8"/></svg>',
  right: '<svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
};

// Draw art at the largest integer device-pixel scale that fits a CSS box (smooth only when it must shrink).
// trim crops transparent padding, as a real home-screen icon would.
function art(src, box, trim) {
  const c = document.createElement('canvas');
  pending.push(new Promise(done => {
    const img = new Image();
    img.onload = () => {
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
      if (trim) try {
        const t = document.createElement('canvas'); t.width = sw; t.height = sh;
        const x = t.getContext('2d'); x.drawImage(img, 0, 0);
        const px = x.getImageData(0, 0, sw, sh).data; let l = sw, r = -1, tp = sh, b = -1;
        for (let y = 0; y < sh; y++) for (let i = 0; i < sw; i++) if (px[(y * sw + i) * 4 + 3] > 8) { if (i < l) l = i; if (i > r) r = i; if (y < tp) tp = y; if (y > b) b = y; }
        if (r >= 0) { sx = l; sy = tp; sw = r - l + 1; sh = b - tp + 1; }
      } catch (e) { /* ponytail: tainted file:// canvas falls back to the full image */ }
      const s = integerScale(sw, sh, box, box);
      c.width = Math.round(sw * s.scale); c.height = Math.round(sh * s.scale);
      c.style.width = s.cssW + 'px'; c.style.height = s.cssH + 'px';
      const ctx = c.getContext('2d'); ctx.imageSmoothingEnabled = s.smooth; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);
      done();
    };
    img.onerror = done; img.src = src.replace('../shared/', '../../shared/'); // data paths assume one folder deep
  }));
  return c;
}

const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };

function assetTile(a, box = 80) {
  const t = h(`<a class="tile${a.thumb ? '' : ' pending'}" data-id="${a.id}"><div class="icon"></div><span class="label">${a.name}</span></a>`);
  const icon = t.firstChild;
  if (a.thumb) icon.append(art(a.thumb, box, true)); else icon.append(h('<span class="ring"></span>'));
  if (a.status === 'review') icon.append(h(`<span class="badge">${a.candidates.length}</span>`));
  return t;
}

function folderTile(name, ids) {
  const t = h(`<a class="tile folder"><div class="icon"></div><span class="label">${name}</span></a>`);
  ids.map(id => byId[id]).filter(a => a && a.thumb).slice(0, 4).forEach(a => {
    const cell = h('<span></span>'); cell.append(art(a.thumb, 30, true)); t.firstChild.append(cell);
  });
  return t;
}

function home() {
  const g = h('<main class="home-grid"></main>');
  g.append(folderTile('Favorites', D.favorites));
  D.folders.forEach(f => g.append(folderTile(f.name, f.assetIds)));
  D.assets.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt)).forEach(a => g.append(assetTile(a)));
  document.body.append(g, h(`<nav class="dock glass">
    <button class="search">${I.search}Search<kbd>/</kbd></button>
    <button class="pill">All ${I.chev}</button>
    <button class="round" aria-label="More">${I.more}</button></nav>`));
}

function detail(info) {
  const a = byId.chr_0004;
  document.body.className = 'detail' + (info ? ' info' : '');
  const stage = h('<div class="stage"></div>');
  stage.append(art(a.animations[0].frames.east[3], info ? 560 : 600, false));
  document.body.append(stage, h(`<div>
    <button class="fab close glass" aria-label="Close">${I.x}</button>
    <div class="fab title"><b>${a.name}</b><span>Character</span></div>
    <div class="fab tools glass"><button aria-label="Favorite">${I.heart}</button><button class="${info ? 'on' : ''}" aria-label="Info">${I.info}</button><button aria-label="More">${I.more}</button></div>
    <div class="fab actions glass"><button class="pill">Walk · East ${I.chev}</button><button class="pill primary">${I.down}Download GIF<span class="split"></span>${I.chev}</button></div></div>`));
  if (info) document.body.append(h(`<aside class="sheet glass">
    <div><h2>${a.name}</h2><p>Character</p></div>
    <div class="group">
      <div class="row"><span>Size</span><span>128 × 128 px</span></div>
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
    <a class="ext" href="#">Open in PixelLab ↗</a></aside>`));
}

const ready = () => Promise.all(pending).then(() => { document.documentElement.dataset.ready = '1'; });
