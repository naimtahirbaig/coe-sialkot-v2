// src/components/PublicShell.js
'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

const NAV_LINKS = [
  { href: '/student-resources', label: 'Student Resources', icon: '📚' },
  { href: '/notice-board',      label: 'Notice Board',      icon: '📋' },
  { href: '/practice-tests',    label: 'Practice Tests',    icon: '🧪' },
];

export default function PublicShell({ title, subtitle, accent = '#f59e0b', children }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0f172a',
      fontFamily: 'Inter, system-ui, sans-serif',
      color: '#e2e8f0',
    }}>

      {/* ── Top Navbar ─────────────────────────────────────────── */}
      <nav style={{
        background: '#1e293b',
        borderBottom: '1px solid #334155',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
        position: 'sticky', top: 0, zIndex: 50,
      }}>
        {/* Logo + School name */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <img
            src="/logo.png"
            alt="COE Logo"
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>
              COE Sialkot (Boys)
            </div>
            <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: 11, letterSpacing: '0.05em' }}>
              BOYS CAMPUS
            </div>
          </div>
        </Link>

        {/* Desktop nav links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {NAV_LINKS.map(link => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  color: active ? '#f59e0b' : '#94a3b8',
                  background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
                  border: active ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span>{link.icon}</span>
                <span style={{ display: 'none', ['@media (min-width: 640px)']: { display: 'inline' } }}>
                  {link.label}
                </span>
              </Link>
            );
          })}

          {/* Login button */}
          <Link
            href="/login"
            style={{
              marginLeft: 8,
              padding: '8px 18px',
              borderRadius: 8,
              background: '#f59e0b',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Page Header ────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        borderBottom: '1px solid #334155',
        padding: '48px 24px 40px',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative gold line */}
        <div style={{
          position: 'absolute', bottom: 0, left: '50%',
          transform: 'translateX(-50%)',
          width: 80, height: 3,
          background: accent,
          borderRadius: '3px 3px 0 0',
        }} />

        <div style={{
          display: 'inline-block',
          background: 'rgba(245,158,11,0.1)',
          border: '1px solid rgba(245,158,11,0.2)',
          borderRadius: 20,
          padding: '4px 16px',
          fontSize: 12,
          fontWeight: 700,
          color: '#f59e0b',
          letterSpacing: '0.08em',
          marginBottom: 16,
        }}>
          PUBLIC ACCESS — NO LOGIN REQUIRED
        </div>

        <h1 style={{
          margin: '0 0 12px',
          fontSize: 30,
          fontWeight: 800,
          color: '#f1f5f9',
          letterSpacing: '-0.5px',
        }}>
          {title}
        </h1>

        {subtitle && (
          <p style={{
            margin: 0,
            fontSize: 15,
            color: '#94a3b8',
            maxWidth: 500,
            marginLeft: 'auto',
            marginRight: 'auto',
            lineHeight: 1.6,
          }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* ── Main Content ───────────────────────────────────────── */}
      <main style={{
        maxWidth: 1100,
        margin: '0 auto',
        padding: '36px 20px 60px',
      }}>
        {children}
      </main>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer style={{
        background: '#1e293b',
        borderTop: '1px solid #334155',
        padding: '24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 13, color: '#64748b', marginBottom: 4 }}>
          © {new Date().getFullYear()} Centre of Excellence Sialkot (Boys)
        </div>
        <div style={{ fontSize: 12, color: '#475569' }}>
          Punjab Daanish Schools &amp; Centres of Excellence Authority · Government of Punjab
        </div>
      </footer>
    </div>
  );
}
