// A tiny stand-in for CanvasRenderingContext2D that draws into a jsPDF page
// as VECTORS (real text, lines and fills) instead of a picture.
//
// Why: a result card is mostly flat colour and text. As a picture, a 4K page
// is megabytes. As vectors the same page is a few kilobytes, and it prints
// perfectly sharp at any size — the printer draws the text itself.
//
// It supports exactly what the result card and result sheet renderers use,
// so those renderers run unchanged:  fillRect, strokeRect, fillText, paths
// (moveTo / lineTo / arc / arcTo / roundRect / closePath), fill, stroke,
// clip, save / restore, scale / translate, drawImage, globalAlpha,
// measureText. Text uses the PDF's built-in Helvetica, so nothing is embedded.

const KAPPA = 0.5522847498;

function clamp255(n) { return Math.max(0, Math.min(255, Math.round(n))); }

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360; s /= 100; l /= 100;
  const f = (p, q, t) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
}

export function parseColour(str) {
  const s = String(str || "#000").trim().toLowerCase();
  if (s === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
  if (s === "white") return { r: 255, g: 255, b: 255, a: 1 };
  if (s === "black") return { r: 0, g: 0, b: 0, a: 1 };
  let m = s.match(/^#([0-9a-f]{3,8})$/);
  if (m) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = h.split("").map((c) => c + c).join("");
    return {
      r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1,
    };
  }
  m = s.match(/^rgba?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    return { r: clamp255(p[0]), g: clamp255(p[1]), b: clamp255(p[2]), a: p[3] === undefined ? 1 : p[3] };
  }
  m = s.match(/^hsla?\(([^)]+)\)/);
  if (m) {
    const p = m[1].split(",").map((x) => parseFloat(x));
    const [r, g, b] = hslToRgb(p[0], p[1], p[2]);
    return { r: clamp255(r), g: clamp255(g), b: clamp255(b), a: p[3] === undefined ? 1 : p[3] };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

// Helvetica in a PDF covers Latin-1 plus a few typographic marks. Anything
// else would print as garbage, so it is swapped for a close plain one.
const SWAP = { "●": "•", "▼": "v", "▲": "^", "≥": ">=", "≤": "<=", "→": "->", "←": "<-", "★": "*", "✓": "v", "✔": "v" };
function clean(str) {
  return String(str ?? "").replace(/[^ -~ -ÿ–—‘’“”•…€]/g,
    (ch) => SWAP[ch] || "?");
}

const imageCache = new WeakMap();
function imageDataUrl(img) {
  if (img && img.__dataUrl) return img.__dataUrl;           // test hook
  if (imageCache.has(img)) return imageCache.get(img);
  // Downscale: logos are drawn ~80px wide, so 400px is plenty and stays light.
  const max = 400;
  const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
  const k = Math.min(1, max / Math.max(w, h));
  const cv = document.createElement("canvas");
  cv.width = Math.max(1, Math.round(w * k)); cv.height = Math.max(1, Math.round(h * k));
  cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
  const url = cv.toDataURL("image/png");
  imageCache.set(img, url);
  return url;
}
let aliasCounter = 0;
const aliasFor = new WeakMap();

export class PdfContext {
  // pdf: a jsPDF instance (unit "pt");  scale: PDF points per drawing unit
  constructor(pdf, scale) {
    this.pdf = pdf;
    this.s = scale; this.tx = 0; this.ty = 0;
    this.font = "normal 12px Arial"; this.fillStyle = "#000"; this.strokeStyle = "#000";
    this.lineWidth = 1; this.textAlign = "left"; this.textBaseline = "alphabetic"; this.globalAlpha = 1;
    this.path = []; this.cur = null; this.stack = [];
  }

  X(x) { return this.tx + x * this.s; }
  Y(y) { return this.ty + y * this.s; }

  // ---- state
  save() {
    this.pdf.saveGraphicsState();
    this.stack.push({ s: this.s, tx: this.tx, ty: this.ty, font: this.font, fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle, lineWidth: this.lineWidth, textAlign: this.textAlign,
      textBaseline: this.textBaseline, globalAlpha: this.globalAlpha });
  }
  restore() {
    this.pdf.restoreGraphicsState();
    const st = this.stack.pop(); if (st) Object.assign(this, st);
  }
  scale(k) { this.s *= k; }
  translate(x, y) { this.tx += x * this.s; this.ty += y * this.s; }

  // ---- paint helpers
  _opacity(a, draw) {
    const alpha = a * this.globalAlpha;
    if (alpha >= 0.999) return draw();
    if (alpha <= 0.001) return;
    this.pdf.saveGraphicsState();
    this.pdf.setGState(new this.pdf.GState({ opacity: alpha, "stroke-opacity": alpha }));
    draw();
    this.pdf.restoreGraphicsState();
  }
  _fill(c) { this.pdf.setFillColor(c.r, c.g, c.b); }
  _stroke(c) { this.pdf.setDrawColor(c.r, c.g, c.b); this.pdf.setLineWidth(Math.max(this.lineWidth * this.s, 0.05)); }

  // ---- rectangles
  fillRect(x, y, w, h) {
    const c = parseColour(this.fillStyle);
    this._opacity(c.a, () => { this._fill(c); this.pdf.rect(this.X(x), this.Y(y), w * this.s, h * this.s, "F"); });
  }
  strokeRect(x, y, w, h) {
    const c = parseColour(this.strokeStyle);
    this._opacity(c.a, () => { this._stroke(c); this.pdf.rect(this.X(x), this.Y(y), w * this.s, h * this.s, "S"); });
  }
  clearRect() {}

  // ---- paths
  beginPath() { this.path = []; this.cur = null; }
  moveTo(x, y) { this.path.push(["M", this.X(x), this.Y(y)]); this.cur = [this.X(x), this.Y(y)]; }
  lineTo(x, y) {
    if (!this.cur) return this.moveTo(x, y);
    this.path.push(["L", this.X(x), this.Y(y)]); this.cur = [this.X(x), this.Y(y)];
  }
  rect(x, y, w, h) { this.moveTo(x, y); this.lineTo(x + w, y); this.lineTo(x + w, y + h); this.lineTo(x, y + h); this.closePath(); }
  closePath() { this.path.push(["Z"]); }
  _bez(c1x, c1y, c2x, c2y, x, y) { this.path.push(["C", c1x, c1y, c2x, c2y, x, y]); this.cur = [x, y]; }

  arcTo(x1, y1, x2, y2, r) {
    const X1 = this.X(x1), Y1 = this.Y(y1), X2 = this.X(x2), Y2 = this.Y(y2), R = r * this.s;
    if (!this.cur) { this.moveTo(x1, y1); return; }
    const [x0, y0] = this.cur;
    let ax = x0 - X1, ay = y0 - Y1, bx = X2 - X1, by = Y2 - Y1;
    const la = Math.hypot(ax, ay), lb = Math.hypot(bx, by);
    if (!la || !lb || !R) { this.path.push(["L", X1, Y1]); this.cur = [X1, Y1]; return; }
    ax /= la; ay /= la; bx /= lb; by /= lb;
    const cos = ax * bx + ay * by;
    const theta = Math.acos(Math.max(-1, Math.min(1, cos)));          // angle at the corner
    if (Math.abs(Math.sin(theta)) < 1e-6) { this.path.push(["L", X1, Y1]); this.cur = [X1, Y1]; return; }
    const d = R / Math.tan(theta / 2);
    const t0x = X1 + ax * d, t0y = Y1 + ay * d, t1x = X1 + bx * d, t1y = Y1 + by * d;
    this.path.push(["L", t0x, t0y]);
    const phi = Math.PI - theta;                                       // sweep of the arc
    const k = (4 / 3) * Math.tan(phi / 4) * R;
    this._bez(t0x - ax * k, t0y - ay * k, t1x - bx * k, t1y - by * k, t1x, t1y);
  }

  arc(cx, cy, r, a0, a1, ccw = false) {
    const CX = this.X(cx), CY = this.Y(cy), R = r * this.s;
    let sweep = a1 - a0;
    if (!ccw) { while (sweep < 0) sweep += Math.PI * 2; if (sweep > Math.PI * 2) sweep = Math.PI * 2; }
    else { while (sweep > 0) sweep -= Math.PI * 2; if (sweep < -Math.PI * 2) sweep = -Math.PI * 2; }
    const n = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2) - 1e-9));
    const step = sweep / n, k = (4 / 3) * Math.tan(step / 4);
    const sx = CX + R * Math.cos(a0), sy = CY + R * Math.sin(a0);
    if (!this.cur) { this.path.push(["M", sx, sy]); this.cur = [sx, sy]; }
    else { this.path.push(["L", sx, sy]); this.cur = [sx, sy]; }
    let a = a0;
    for (let i = 0; i < n; i++) {
      const b = a + step;
      const p1x = CX + R * Math.cos(a), p1y = CY + R * Math.sin(a);
      const p2x = CX + R * Math.cos(b), p2y = CY + R * Math.sin(b);
      this._bez(p1x - k * R * Math.sin(a), p1y + k * R * Math.cos(a),
                p2x + k * R * Math.sin(b), p2y - k * R * Math.cos(b), p2x, p2y);
      a = b;
    }
  }

  roundRect(x, y, w, h, r = 0) {
    const rr = Math.max(0, Math.min(Array.isArray(r) ? r[0] : r, w / 2, h / 2));
    this.moveTo(x + rr, y);
    this.arcTo(x + w, y, x + w, y + h, rr);
    this.arcTo(x + w, y + h, x, y + h, rr);
    this.arcTo(x, y + h, x, y, rr);
    this.arcTo(x, y, x + w, y, rr);
    this.closePath();
  }

  _emit() {
    const p = this.pdf;
    this.path.forEach((seg) => {
      if (seg[0] === "M") p.moveTo(seg[1], seg[2]);
      else if (seg[0] === "L") p.lineTo(seg[1], seg[2]);
      else if (seg[0] === "C") p.curveTo(seg[1], seg[2], seg[3], seg[4], seg[5], seg[6]);
      else p.close();
    });
  }
  fill() {
    if (!this.path.length) return;
    const c = parseColour(this.fillStyle);
    this._opacity(c.a, () => { this._fill(c); this._emit(); this.pdf.fill(); });
  }
  stroke() {
    if (!this.path.length) return;
    const c = parseColour(this.strokeStyle);
    this._opacity(c.a, () => { this._stroke(c); this._emit(); this.pdf.stroke(); });
  }
  clip() {
    if (!this.path.length) return;
    this._emit(); this.pdf.clip(); this.pdf.discardPath();
  }

  // ---- text
  _setFont() {
    const m = String(this.font).match(/(?:(italic|oblique)\s+)?(?:(bold|bolder|normal|[1-9]00)\s+)?([\d.]+)px/i) || [];
    const w = String(m[2] || "normal").toLowerCase();
    const bold = w === "bold" || w === "bolder" || (parseInt(w, 10) >= 600);
    const italic = !!m[1];
    this.pdf.setFont("helvetica", bold ? (italic ? "bolditalic" : "bold") : (italic ? "italic" : "normal"));
    const px = parseFloat(m[3]) || 12;
    this.pdf.setFontSize(px * this.s);
    return px;
  }
  measureText(str) {
    this._setFont();
    return { width: this.pdf.getTextWidth(clean(str)) / this.s };
  }
  fillText(str, x, y) {
    const text = clean(str);
    if (!text) return;
    const px = this._setFont();
    const c = parseColour(this.fillStyle);
    // Canvas baselines → PDF baseline (Arial: ascent .905, descent .212 of the em)
    const off = this.textBaseline === "middle" ? 0.3465 * px
      : this.textBaseline === "top" || this.textBaseline === "hanging" ? 0.905 * px
      : this.textBaseline === "bottom" || this.textBaseline === "ideographic" ? -0.212 * px : 0;
    this._opacity(c.a, () => {
      this.pdf.setTextColor(c.r, c.g, c.b);
      this.pdf.text(text, this.X(x), this.Y(y + off), { align: this.textAlign === "start" ? "left" : this.textAlign === "end" ? "right" : this.textAlign });
    });
  }

  // ---- images
  drawImage(img, x, y, w, h) {
    if (!img) return;
    let alias = aliasFor.get(img);
    if (!alias) { alias = "img" + ++aliasCounter; aliasFor.set(img, alias); }
    this.pdf.addImage(imageDataUrl(img), "PNG", this.X(x), this.Y(y), w * this.s, h * this.s, alias, "FAST");
  }
}
