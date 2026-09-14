'use client';

import { useState, useEffect, useRef } from 'react';
import AdminAuth from '@/components/AdminAuth';

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
const STEP = 0.1;
const LETTER_URL = '/staff/warning-letter.html';

function WarningLetterInner() {
  const [isMobile, setIsMobile] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [frameH, setFrameH] = useState(1400);
  const frameRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // On mobile the iframe is laid out at its full natural height so the whole
  // document scrolls and the browser's own pinch-zoom works. A fixed-height
  // scrolling container (what we use on desktop) swallows the pinch gesture,
  // which is why zoom buttons were needed there in the first place.
  // Same-origin, so we can read the real content height.
  function sizeToContent() {
    try {
      const doc = frameRef.current?.contentDocument;
      if (doc?.body) {
        const h = Math.max(
          doc.body.scrollHeight,
          doc.documentElement?.scrollHeight || 0
        );
        if (h > 200) setFrameH(h + 40);
      }
    } catch {
      /* cross-origin — keep the fallback height */
    }
  }

  useEffect(() => {
    if (!isMobile) return;
    const t = setInterval(sizeToContent, 800); // content grows as fields are filled
    return () => clearInterval(t);
  }, [isMobile]);

  const clamp = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round(z * 100) / 100));
  const zoomIn = () => setZoom((z) => clamp(z + STEP));
  const zoomOut = () => setZoom((z) => clamp(z - STEP));
  const reset = () => setZoom(1);

  useEffect(() => {
    if (isMobile) return;
    function onKey(e) {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === '=' || e.key === '+') { e.preventDefault(); zoomIn(); }
      else if (e.key === '-' || e.key === '_') { e.preventDefault(); zoomOut(); }
      else if (e.key === '0') { e.preventDefault(); reset(); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile]);

  const btn = {
    border: '1px solid #d8d2c2', background: '#fff', color: '#0E1F3D',
    borderRadius: 8, width: 34, height: 34, fontSize: 18, lineHeight: 1,
    cursor: 'pointer', display: 'flex', alignItems: 'center',
    justifyContent: 'center', padding: 0,
  };

  return (
    <div style={{ minHeight: '100vh', background: '#faf7ef' }}>
      <div
        style={{
          padding: '10px 16px', borderBottom: '1px solid #e5e0d4',
          display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
          background: '#faf7ef',
        }}
      >
        <a href="/admin" style={{ color: '#0E1F3D', textDecoration: 'none', fontSize: 14 }}>
          &larr; Back
        </a>
        <strong style={{ color: '#0E1F3D', fontSize: 15 }}>Student Warning Letter</strong>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          {!isMobile && (
            <>
              <button onClick={zoomOut} disabled={zoom <= MIN_ZOOM} style={btn} title="Zoom out (Ctrl -)">
                &minus;
              </button>
              <button
                onClick={reset}
                style={{ ...btn, width: 'auto', padding: '0 12px', fontSize: 13,
                         fontVariantNumeric: 'tabular-nums' }}
                title="Reset to 100% (Ctrl 0)"
              >
                {Math.round(zoom * 100)}%
              </button>
              <button onClick={zoomIn} disabled={zoom >= MAX_ZOOM} style={btn} title="Zoom in (Ctrl +)">
                +
              </button>
            </>
          )}
          <a
            href={LETTER_URL}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#C9922A', fontSize: 14, marginLeft: 8, whiteSpace: 'nowrap' }}
          >
            Full screen
          </a>
        </div>
      </div>

      {isMobile ? (
        // Natural document flow: page scrolls, pinch-zoom works normally.
        <iframe
          ref={frameRef}
          src={LETTER_URL}
          title="Student Warning Letter"
          onLoad={sizeToContent}
          scrolling="no"
          style={{
            width: '100%',
            height: frameH,
            border: 0,
            display: 'block',
            background: '#fff',
          }}
        />
      ) : (
        <div
          style={{
            height: 'calc(100vh - 57px)',
            overflow: 'auto',
            background: '#efeade',
          }}
        >
          <iframe
            src={LETTER_URL}
            title="Student Warning Letter"
            style={{
              width: `${100 / zoom}%`,
              height: `calc((100vh - 57px) / ${zoom})`,
              border: 0,
              display: 'block',
              transform: `scale(${zoom})`,
              transformOrigin: '0 0',
              background: '#fff',
            }}
          />
        </div>
      )}
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
