'use client';

import { useState, useEffect } from 'react';
import AdminAuth from '@/components/AdminAuth';

const HEADER_H = 57;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const STEP = 0.1;

function WarningLetterInner() {
  const [zoom, setZoom] = useState(1);

  // The letter tool itself lives in public/staff/warning-letter.html and is
  // shown in an iframe. Rather than editing that file, we scale the whole
  // iframe with a CSS transform — the letter renders at its natural size and
  // we just magnify it, so printing / PDF output from inside the tool is
  // unaffected.
  //
  // The iframe's width/height are divided by the zoom factor so that after
  // scaling it still fills (or overflows) the container correctly, and the
  // wrapper scrolls in both directions when zoomed in.

  const clamp = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));
  const zoomIn = () => setZoom((z) => clamp(z + STEP));
  const zoomOut = () => setZoom((z) => clamp(z - STEP));
  const reset = () => setZoom(1);

  // Cmd/Ctrl + = / - / 0 shortcuts
  useEffect(() => {
    function onKey(e) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut(); }
      else if (e.key === '0') { e.preventDefault(); reset(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const btn = {
    border: '1px solid #d8d2c2',
    background: '#fff',
    color: '#0E1F3D',
    borderRadius: 8,
    width: 34,
    height: 34,
    fontSize: 18,
    lineHeight: 1,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf7ef' }}>
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #e5e0d4',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
          background: '#faf7ef',
          position: 'sticky',
          top: 0,
          zIndex: 5,
        }}
      >
        <a href="/admin" style={{ color: '#0E1F3D', textDecoration: 'none', fontSize: 14 }}>
          &larr; Back
        </a>
        <strong style={{ color: '#0E1F3D', fontSize: 15 }}>Student Warning Letter</strong>

        {/* Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM} style={btn} title="Zoom out (Ctrl -)">
            &minus;
          </button>
          <button
            onClick={reset}
            style={{
              ...btn,
              width: 'auto',
              padding: '0 12px',
              fontSize: 13,
              fontVariantNumeric: 'tabular-nums',
            }}
            title="Reset to 100% (Ctrl 0)"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM} style={btn} title="Zoom in (Ctrl +)">
            +
          </button>
          <a
            href="/staff/warning-letter.html"
            target="_blank"
            rel="noreferrer"
            style={{ color: '#C9922A', fontSize: 14, marginLeft: 8, whiteSpace: 'nowrap' }}
          >
            Full screen
          </a>
        </div>
      </div>

      {/* Scrollable, zoomable viewport */}
      <div
        style={{
          height: `calc(100vh - ${HEADER_H}px)`,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          background: '#efeade',
        }}
      >
        <iframe
          src="/staff/warning-letter.html"
          title="Student Warning Letter"
          style={{
            width: `${100 / zoom}%`,
            height: `calc((100vh - ${HEADER_H}px) / ${zoom})`,
            border: 0,
            display: 'block',
            transform: `scale(${zoom})`,
            transformOrigin: '0 0',
            background: '#fff',
          }}
        />
      </div>
    </div>
  );
}

export default function WarningLetterPage() {
  return (
    <AdminAuth>
      <WarningLetterInner />
    </AdminAuth>
  );
}
