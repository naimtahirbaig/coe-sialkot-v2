// src/components/PublicShell.js
// Shared layout wrapper for all public (no-login) pages

import Link from 'next/link';

export default function PublicShell({ title, subtitle, accent = '#2563eb', children }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Top navbar */}
      <nav style={{
        background: '#1e293b',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 56,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <span style={{ fontSize: 22 }}>🏫</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>COE Sialkot</span>
        </Link>

        <div style={{ display: 'flex', gap: 6 }}>
          <NavLink href="/student-resources" label="📚 Resources" accent={accent} />
          <NavLink href="/notice-board"      label="📋 Notices"   accent={accent} />
          <NavLink href="/practice-tests"    label="🧪 Tests"     accent={accent} />
        </div>
      </nav>

      {/* Page header */}
      <div style={{
        background: `linear-gradient(135deg, ${accent} 0%, ${accent}cc 100%)`,
        padding: '40px 24px',
        textAlign: 'center',
        color: '#fff',
      }}>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: '-0.5px' }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{ margin: '10px 0 0', fontSize: 15, opacity: 0.88, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Content */}
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>
        {children}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center', padding: '24px',
        color: '#94a3b8', fontSize: 13, borderTop: '1px solid #e2e8f0',
        background: '#fff', marginTop: 40,
      }}>
        © {new Date().getFullYear()} Centre of Excellence Sialkot (Boys) · All rights reserved
      </footer>
    </div>
  );
}

function NavLink({ href, label, accent }) {
  return (
    <Link
      href={href}
      style={{
        color: '#cbd5e1',
        textDecoration: 'none',
        fontSize: 13,
        fontWeight: 600,
        padding: '6px 12px',
        borderRadius: 8,
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
        e.currentTarget.style.color = '#fff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = '#cbd5e1';
      }}
    >
      {label}
    </Link>
  );
}
