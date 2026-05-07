'use client';

import { useState, useEffect, useRef } from 'react';

// All symbols are Unicode — they print and DOCX-export perfectly.
// Organized by tab. Each entry: { s: symbol, n: name (tooltip) }
const SYMBOL_SETS = {
  Math: [
    // Basic operators
    { s: '×', n: 'multiply' }, { s: '÷', n: 'divide' }, { s: '±', n: 'plus-minus' },
    { s: '∓', n: 'minus-plus' }, { s: '·', n: 'dot product' }, { s: '∗', n: 'asterisk' },
    // Comparison
    { s: '≤', n: 'less or equal' }, { s: '≥', n: 'greater or equal' },
    { s: '≠', n: 'not equal' }, { s: '≈', n: 'approximately' }, { s: '≡', n: 'identical' },
    // Powers & roots
    { s: '²', n: 'squared' }, { s: '³', n: 'cubed' }, { s: '⁴', n: 'to the 4th' },
    { s: '⁵', n: 'to the 5th' }, { s: 'ⁿ', n: 'to the n' }, { s: '√', n: 'square root' },
    { s: '∛', n: 'cube root' }, { s: '∜', n: 'fourth root' },
    // Subscripts (handy for chemistry too)
    { s: '₀', n: 'sub 0' }, { s: '₁', n: 'sub 1' }, { s: '₂', n: 'sub 2' },
    { s: '₃', n: 'sub 3' }, { s: '₄', n: 'sub 4' }, { s: '₅', n: 'sub 5' },
    // Fractions
    { s: '½', n: 'one half' }, { s: '⅓', n: 'one third' }, { s: '⅔', n: 'two thirds' },
    { s: '¼', n: 'one quarter' }, { s: '¾', n: 'three quarters' }, { s: '⅛', n: 'one eighth' },
    // Geometry
    { s: '°', n: 'degree' }, { s: '∠', n: 'angle' }, { s: '⊥', n: 'perpendicular' },
    { s: '∥', n: 'parallel' }, { s: '△', n: 'triangle' }, { s: '□', n: 'square' },
    { s: '○', n: 'circle' }, { s: 'π', n: 'pi' },
    // Calculus & sets
    { s: '∫', n: 'integral' }, { s: '∑', n: 'sum' }, { s: '∏', n: 'product' },
    { s: '∞', n: 'infinity' }, { s: '∂', n: 'partial' }, { s: '∇', n: 'nabla' },
    { s: '∈', n: 'element of' }, { s: '∉', n: 'not element of' },
    { s: '⊂', n: 'subset' }, { s: '⊆', n: 'subset or equal' },
    { s: '∪', n: 'union' }, { s: '∩', n: 'intersection' }, { s: '∅', n: 'empty set' },
    // Logic & misc
    { s: '∴', n: 'therefore' }, { s: '∵', n: 'because' }, { s: '⇒', n: 'implies' },
    { s: '⇔', n: 'if and only if' }, { s: '∀', n: 'for all' }, { s: '∃', n: 'there exists' },
  ],
  Science: [
    // Subscripts (chemistry formulas)
    { s: '₀', n: 'sub 0' }, { s: '₁', n: 'sub 1' }, { s: '₂', n: 'sub 2' },
    { s: '₃', n: 'sub 3' }, { s: '₄', n: 'sub 4' }, { s: '₅', n: 'sub 5' },
    { s: '₆', n: 'sub 6' }, { s: '₇', n: 'sub 7' }, { s: '₈', n: 'sub 8' }, { s: '₉', n: 'sub 9' },
    // Superscripts (charges, isotopes)
    { s: '⁰', n: 'super 0' }, { s: '¹', n: 'super 1' }, { s: '²', n: 'super 2' },
    { s: '³', n: 'super 3' }, { s: '⁴', n: 'super 4' }, { s: '⁻', n: 'super minus' },
    { s: '⁺', n: 'super plus' }, { s: 'ⁿ', n: 'super n' },
    // Reaction arrows
    { s: '→', n: 'yields' }, { s: '⇌', n: 'reversible' }, { s: '⇋', n: 'reversible 2' },
    { s: '↑', n: 'gas evolved' }, { s: '↓', n: 'precipitate' }, { s: '⟶', n: 'long arrow' },
    // Physics
    { s: '°', n: 'degree' }, { s: '℃', n: 'Celsius' }, { s: '℉', n: 'Fahrenheit' },
    { s: 'Å', n: 'Angstrom' }, { s: 'µ', n: 'micro' }, { s: 'Ω', n: 'ohm' },
    { s: '·', n: 'middle dot' }, { s: '×', n: 'multiply' },
    // Common constants/units (Greek used in science)
    { s: 'α', n: 'alpha' }, { s: 'β', n: 'beta' }, { s: 'γ', n: 'gamma' },
    { s: 'λ', n: 'lambda (wavelength)' }, { s: 'ν', n: 'nu (frequency)' },
    { s: 'ρ', n: 'rho (density)' }, { s: 'σ', n: 'sigma' },
    // Biology / misc
    { s: '♀', n: 'female' }, { s: '♂', n: 'male' }, { s: '∞', n: 'infinity' },
    { s: '≈', n: 'approximately' }, { s: '∝', n: 'proportional to' },
  ],
  Greek: [
    // Lowercase
    { s: 'α', n: 'alpha' }, { s: 'β', n: 'beta' }, { s: 'γ', n: 'gamma' },
    { s: 'δ', n: 'delta' }, { s: 'ε', n: 'epsilon' }, { s: 'ζ', n: 'zeta' },
    { s: 'η', n: 'eta' }, { s: 'θ', n: 'theta' }, { s: 'ι', n: 'iota' },
    { s: 'κ', n: 'kappa' }, { s: 'λ', n: 'lambda' }, { s: 'μ', n: 'mu' },
    { s: 'ν', n: 'nu' }, { s: 'ξ', n: 'xi' }, { s: 'ο', n: 'omicron' },
    { s: 'π', n: 'pi' }, { s: 'ρ', n: 'rho' }, { s: 'σ', n: 'sigma' },
    { s: 'τ', n: 'tau' }, { s: 'υ', n: 'upsilon' }, { s: 'φ', n: 'phi' },
    { s: 'χ', n: 'chi' }, { s: 'ψ', n: 'psi' }, { s: 'ω', n: 'omega' },
    // Uppercase (the ones that differ from Latin)
    { s: 'Γ', n: 'Gamma' }, { s: 'Δ', n: 'Delta' }, { s: 'Θ', n: 'Theta' },
    { s: 'Λ', n: 'Lambda' }, { s: 'Ξ', n: 'Xi' }, { s: 'Π', n: 'Pi' },
    { s: 'Σ', n: 'Sigma' }, { s: 'Φ', n: 'Phi' }, { s: 'Ψ', n: 'Psi' },
    { s: 'Ω', n: 'Omega' },
  ],
};

/**
 * SymbolPicker — a small button that opens a popup with categorized Unicode symbols.
 *
 * Props:
 *   targetRef: React ref pointing to the <input> or <textarea> the symbol should
 *              be inserted into.
 *   onInsert:  (newValue: string) => void — called with the updated text after
 *              insertion. Wire this to the same setter you use for onChange.
 *
 * Usage:
 *   const ref = useRef(null);
 *   <textarea ref={ref} value={text} onChange={e => setText(e.target.value)} />
 *   <SymbolPicker targetRef={ref} onInsert={setText} />
 */
export default function SymbolPicker({ targetRef, onInsert }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState('Math');
  const popupRef = useRef(null);
  const buttonRef = useRef(null);

  // Close on outside click or Esc
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const insert = (sym) => {
    const el = targetRef?.current;
    if (!el) return;
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const before = el.value.slice(0, start);
    const after = el.value.slice(end);
    const next = before + sym + after;
    onInsert(next);
    // Restore focus + cursor position right after the inserted symbol
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + sym.length;
      el.setSelectionRange(pos, pos);
    });
  };

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(o => !o)}
        title="Insert math/science symbol"
        style={{
          padding: '4px 10px',
          fontSize: '13px',
          fontWeight: 600,
          background: open ? '#0E1F3D' : '#F5E6C3',
          color: open ? '#F5E6C3' : '#0E1F3D',
          border: '1px solid #0E1F3D',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'system-ui',
          lineHeight: 1.2,
        }}
      >
        Ω Symbols
      </button>

      {open && (
        <div
          ref={popupRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            zIndex: 1000,
            width: '340px',
            background: '#fff',
            border: '2px solid #0E1F3D',
            borderRadius: '6px',
            boxShadow: '0 6px 20px rgba(0,0,0,0.18)',
            overflow: 'hidden',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #ddd' }}>
            {Object.keys(SYMBOL_SETS).map(name => (
              <button
                key={name}
                type="button"
                onClick={() => setTab(name)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  fontSize: '13px',
                  fontWeight: 600,
                  background: tab === name ? '#0E1F3D' : '#F5E6C3',
                  color: tab === name ? '#F5E6C3' : '#0E1F3D',
                  border: 'none',
                  borderRight: '1px solid #ddd',
                  cursor: 'pointer',
                  fontFamily: 'system-ui',
                }}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Symbol grid */}
          <div
            style={{
              padding: '8px',
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '4px',
              maxHeight: '260px',
              overflowY: 'auto',
            }}
          >
            {SYMBOL_SETS[tab].map((item, i) => (
              <button
                key={`${tab}-${i}`}
                type="button"
                title={item.n}
                onClick={() => insert(item.s)}
                style={{
                  padding: '6px 0',
                  fontSize: '18px',
                  background: '#fff',
                  color: '#0E1F3D',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontFamily: 'Georgia, serif',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F5E6C3'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; }}
              >
                {item.s}
              </button>
            ))}
          </div>

          {/* Hint */}
          <div
            style={{
              padding: '6px 10px',
              fontSize: '11px',
              color: '#666',
              borderTop: '1px solid #eee',
              background: '#fafafa',
              fontFamily: 'system-ui',
            }}
          >
            Click a symbol to insert it at the cursor. Esc to close.
          </div>
        </div>
      )}
    </span>
  );
}