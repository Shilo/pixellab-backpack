// pixel-utils.js — classic script, no deps. Load with <script src="../shared/pixel-utils.js">.
// Exposes integerScale, PixelTicker, checkerboardCSS and pixelUtilsSelfTest on window.
(function (g) {
  'use strict';

  // Largest integer device-pixel scale k for artW x artH inside a boxW x boxH CSS box.
  // Art larger than the box gets a smooth downscale factor < 1 (use image-rendering: auto then).
  // Returns { scale, smooth, cssW, cssH }: size the element to cssW x cssH CSS px.
  function integerScale(artW, artH, boxW, boxH, dpr) {
    if (!(artW > 0 && artH > 0)) return null; // image not decoded yet
    dpr = dpr || g.devicePixelRatio || 1;
    // ponytail: epsilon absorbs float noise like 200 * 1.15 = 229.99999999999997.
    var fit = Math.min(Math.floor(boxW * dpr + 1e-6) / artW, Math.floor(boxH * dpr + 1e-6) / artH);
    var scale = fit >= 1 ? Math.floor(fit) : fit;
    return { scale: scale, smooth: fit < 1, cssW: artW * scale / dpr, cssH: artH * scale / dpr };
  }

  // One shared requestAnimationFrame loop. Callbacks get (dtMs, nowMs); dt is clamped to 250 ms
  // so a returning background tab does not skip ahead. The loop stops when nothing is registered.
  var PixelTicker = (function () {
    var fns = new Set(), raf = 0, last = 0;
    function tick(now) {
      var dt = Math.min(now - last, 250);
      last = now;
      fns.forEach(function (fn) { fn(dt, now); });
      raf = fns.size ? g.requestAnimationFrame(tick) : 0;
    }
    return {
      add: function (fn) {
        fns.add(fn);
        if (!raf) { last = g.performance.now(); raf = g.requestAnimationFrame(tick); }
      },
      remove: function (fn) { fns.delete(fn); },
      // Looping player over per-frame durations in ms (PixelLab gives no fps: default 100 ms = 10 fps).
      // draw(i) runs only when the frame index changes. Returns { play, stop, seek, step }.
      player: function (durations, draw) {
        var i = 0, acc = 0;
        function step(dt) {
          acc += dt;
          var changed = false;
          while (acc >= Math.max(1, durations[i])) {
            acc -= Math.max(1, durations[i]);
            i = (i + 1) % durations.length;
            changed = true;
          }
          if (changed) draw(i);
        }
        return {
          play: function () { PixelTicker.add(step); },
          stop: function () { PixelTicker.remove(step); },
          seek: function (n) { i = n; acc = 0; draw(i); },
          step: step
        };
      }
    };
  })();

  // CSS background for a checkerboard of size-px squares (conic gradient, no raster scaling).
  function checkerboardCSS(size, a, b) {
    size = size || 8; a = a || '#d4d4d4'; b = b || '#b8b8b8';
    return 'conic-gradient(' + a + ' 25%, ' + b + ' 0 50%, ' + a + ' 0 75%, ' + b + ' 0) 0 0 / ' +
      (size * 2) + 'px ' + (size * 2) + 'px';
  }

  function pixelUtilsSelfTest() {
    function eq(got, want, msg) { if (got !== want) throw new Error(msg + ': got ' + got + ', want ' + want); }
    var r = integerScale(16, 16, 128, 128, 1);
    eq(r.scale, 8, 'dpr1'); eq(r.cssW, 128, 'dpr1 css'); eq(r.smooth, false, 'dpr1 smooth');
    r = integerScale(32, 32, 100, 100, 1.25);           // 125 device px -> k=3 -> 96 dev = 76.8 css
    eq(r.scale, 3, 'dpr1.25'); eq(r.cssW, 76.8, 'dpr1.25 css');
    r = integerScale(32, 32, 64, 64, 1.5);              // 96 device px -> k=3, 64 css (not 2 css/px)
    eq(r.scale, 3, 'dpr1.5'); eq(r.cssW, 64, 'dpr1.5 css');
    r = integerScale(30, 44, 128, 128, 2);              // limited by height: 256/44 -> k=5
    eq(r.scale, 5, 'dpr2'); eq(r.cssW, 75, 'dpr2 cssW'); eq(r.cssH, 110, 'dpr2 cssH');
    r = integerScale(23, 23, 200, 200, 1.15);           // float noise must not drop k from 10 to 9
    eq(r.scale, 10, 'dpr1.15 epsilon');
    r = integerScale(16, 16, 16, 16, 1);
    eq(r.scale, 1, 'exact fit'); eq(r.smooth, false, 'exact fit smooth');
    r = integerScale(768, 512, 160, 160, 2);            // oversized map -> smooth overview
    eq(r.smooth, true, 'big smooth'); eq(Math.round(r.cssW), 160, 'big cssW'); eq(r.scale < 1, true, 'big scale<1');
    r = integerScale(17, 17, 16, 16, 1);
    eq(r.smooth, true, 'one px too big');
    eq(integerScale(0, 0, 100, 100, 1), null, 'undecoded image');
    var seen = [], p = PixelTicker.player([100, 100, 50], function (i) { seen.push(i); });
    p.step(99); p.step(1); p.step(100); p.step(50);       // 0 -> 1 -> 2 -> 0 (wraps)
    eq(seen.join(), '1,2,0', 'player durations');
    eq(checkerboardCSS(8, '#aaa', '#bbb'), 'conic-gradient(#aaa 25%, #bbb 0 50%, #aaa 0 75%, #bbb 0) 0 0 / 16px 16px', 'checker');
    return 'pixel-utils self-test passed';
  }

  g.integerScale = integerScale;
  g.PixelTicker = PixelTicker;
  g.checkerboardCSS = checkerboardCSS;
  g.pixelUtilsSelfTest = pixelUtilsSelfTest;
})(typeof window !== 'undefined' ? window : this);
