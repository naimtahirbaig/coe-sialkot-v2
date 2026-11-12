"use client";
// Shows question text: line breaks are kept, and anything between $...$ is drawn as maths (LaTeX).
// Example: "The square root of $\frac{49}{64}$ is:"
import katex from "katex";
import "katex/dist/katex.min.css";

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function richHtml(text) {
  const src = String(text ?? "");
  let out = "", last = 0;
  const re = /\$([^$\n]+)\$/g;
  let m;
  while ((m = re.exec(src))) {
    out += esc(src.slice(last, m.index));
    try { out += katex.renderToString(m[1], { throwOnError: false, output: "html" }); }
    catch { out += esc(m[0]); }
    last = m.index + m[0].length;
  }
  return out + esc(src.slice(last));
}

export default function Rich({ text, style, className }) {
  return <span dir="auto" className={className} style={{ whiteSpace: "pre-line", ...style }} dangerouslySetInnerHTML={{ __html: richHtml(text) }} />;
}
