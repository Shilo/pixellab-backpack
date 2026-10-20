// Fills every [data-art] element with integer-scaled pixel art (BBOX from bbox.js, integerScale from pixel-utils.js).
// data-fit: "trim" (default) contains the opaque box; "full" contains the whole canvas; "cover" crops at data-s device px per art px.
// Boxes snap to whole device pixels so nearest-neighbour edges stay crisp.
function renderArt(root) {
  const dpr = devicePixelRatio;
  (root || document).querySelectorAll('[data-art]').forEach(el => {
    const [x, y, w, h, nw, nh] = BBOX[el.dataset.art], r = el.getBoundingClientRect();
    const fit = el.dataset.fit || 'trim', pad = el.dataset.pad == null ? 0.14 : +el.dataset.pad;
    let bx = x, by = y, bw = w, bh = h, s;
    if (fit === 'full') { bx = 0; by = 0; bw = nw; bh = nh; }
    if (fit === 'cover') {
      s = +el.dataset.s || 1;
      bw = Math.min(nw, Math.floor(r.width * dpr / s)); bh = Math.min(nh, Math.floor(r.height * dpr / s));
      bx = Math.round((nw - bw) / 2); by = Math.round((nh - bh) / 2);
    } else {
      s = integerScale(bw, bh, r.width * (1 - 2 * pad), r.height * (1 - 2 * pad), dpr).scale;
      if (el.dataset.max) s = Math.min(s, +el.dataset.max);
    }
    const cw = bw * s / dpr, ch = bh * s / dpr, snap = v => Math.round(v * dpr) / dpr;
    const box = document.createElement('div');
    box.className = 'px' + (s < 1 ? ' smooth' : '');
    Object.assign(box.style, { width: cw + 'px', height: ch + 'px',
      left: snap(r.left + (r.width - cw) / 2) - r.left + 'px',
      top: snap(r.top + (r.height - ch) * (el.dataset.align === 'bottom' ? 0.86 : 0.5)) - r.top + 'px' });
    const img = new Image();
    img.src = '../../shared/assets/' + el.dataset.art + '.png'; img.alt = '';
    Object.assign(img.style, { width: nw * s / dpr + 'px', height: nh * s / dpr + 'px', left: -bx * s / dpr + 'px', top: -by * s / dpr + 'px' });
    box.append(img); el.replaceChildren(box);
  });
}
