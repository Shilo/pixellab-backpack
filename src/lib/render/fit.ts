export interface Fit {
  cssW: number;
  cssH: number;
  smooth: boolean;
}

// Largest whole number k of DEVICE pixels per art pixel that fits the box; CSS size = art * k / dpr.
// Art bigger than the box (k < 1) gets a smooth downscale that fits. Undecoded (zero) sizes -> 0 x 0.
export function fitScale(artW: number, artH: number, boxW: number, boxH: number, dpr: number): Fit {
  if (!(artW > 0 && artH > 0 && boxW > 0 && boxH > 0)) return { cssW: 0, cssH: 0, smooth: false };
  const d = dpr > 0 ? dpr : 1;
  // ponytail: epsilon absorbs float noise like 200 * 1.15 = 229.99999999999997.
  const fit = Math.min(Math.floor(boxW * d + 1e-6) / artW, Math.floor(boxH * d + 1e-6) / artH);
  const k = fit >= 1 ? Math.floor(fit) : fit;
  return { cssW: (artW * k) / d, cssH: (artH * k) / d, smooth: fit < 1 };
}

// Bounding box of non-transparent pixels. `data` is ImageData.data (RGBA) or a bare alpha plane;
// the stride is inferred from its length. Fully transparent -> the whole image.
export function trimBox(data: Uint8ClampedArray, w: number, h: number): { x: number; y: number; w: number; h: number } {
  const stride = w * h > 0 ? Math.round(data.length / (w * h)) : 1;
  const off = stride - 1; // alpha is the last channel
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * stride + off] === 0) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      y1 = y;
    }
  }
  return x1 < 0 ? { x: 0, y: 0, w, h } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

export const ZOOM_STEPS = [1, 2, 3, 4, 6, 8, 12, 16] as const;

// Fixed zoom m (CSS px per art px): whole device pixels k per art pixel, never smooth.
const zoomK = (m: number, dpr: number): number => Math.max(1, Math.round(m * (dpr > 0 ? dpr : 1)));
export function zoomScale(artW: number, artH: number, m: number, dpr: number): Fit {
  if (!(artW > 0 && artH > 0)) return { cssW: 0, cssH: 0, smooth: false };
  const d = dpr > 0 ? dpr : 1;
  const k = zoomK(m, d);
  return { cssW: (artW * k) / d, cssH: (artH * k) / d, smooth: false };
}

// `zoom` is a ZOOM_STEPS value (null = Fit); `fitK` is the Fit scale in device px per art px.
// Zooming in from Fit takes the first step that lands above Fit; zooming out returns null once the
// next step down would be at or below Fit. At the top the zoom stays put.
export function zoomStep(zoom: number | null, fitK: number, dir: 1 | -1, dpr: number): number | null {
  if (dir === 1) return ZOOM_STEPS.find((s) => (zoom === null || s > zoom) && zoomK(s, dpr) > fitK) ?? zoom;
  if (zoom === null) return null;
  const down = [...ZOOM_STEPS].reverse().find((s) => s < zoom);
  return down === undefined || zoomK(down, dpr) <= fitK ? null : down;
}

// "Fit · 3×" (crisp fit, CSS px per art px to one decimal), "Fit" (smooth downscale), "4×".
export function zoomLabel(zoom: number | null, fitK: number, smooth: boolean, dpr: number): string {
  if (zoom !== null) return `${zoom}×`;
  return smooth ? 'Fit' : `Fit · ${Math.round((fitK / (dpr > 0 ? dpr : 1)) * 10) / 10}×`;
}
