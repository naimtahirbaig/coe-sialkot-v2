'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';

const PORTALS = [
  { label: 'Student Portal',    icon: '🎓', href: '/portal/student',    color: '#3b82f6', desc: 'Assignments, results & schedule' },
  { label: 'Teacher Portal',    icon: '📖', href: '/portal/teacher',    color: '#8b5cf6', desc: 'Classes, gradebook & attendance' },
  { label: 'Parent Portal',     icon: '👨‍👩‍👦', href: '/portal/parent',     color: '#06b6d4', desc: 'Progress, fees & notices' },
  { label: 'Management Portal', icon: '🏛️', href: '/portal/management', color: '#f59e0b', desc: 'Admin, reports & operations' },
];

const PUBLIC_SECTIONS = [
  { label: 'Student Resources', icon: '📚', href: '/student-resources', color: '#3b82f6', badge: 'Free', desc: 'Notes, past papers & datesheets' },
  { label: 'Notice Board',      icon: '📋', href: '/notice-board',      color: '#ef4444', badge: 'Live', desc: 'Announcements & official notices' },
  { label: 'Practice Tests',    icon: '🧪', href: '/practice-tests',    color: '#8b5cf6', badge: 'Free', desc: 'Interactive quizzes & MCQs' },
];

const STATS = [
  { n: '500+', label: 'Students' },
  { n: '40+',  label: 'Teachers' },
  { n: '10',   label: 'Classes' },
  { n: '7',    label: 'Sections' },
];

export default function HomePage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0d1a',
      fontFamily: "'Outfit', system-ui, sans-serif",
      color: '#e2e8f0',
      overflowX: 'hidden',
    }}>

      {/* ── Google Font ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }
        @keyframes float { 0%,100% { transform:translateY(0px); } 50% { transform:translateY(-12px); } }
        @keyframes pulse-ring { 0% { transform:scale(0.95); box-shadow:0 0 0 0 rgba(245,158,11,0.4); } 70% { transform:scale(1); box-shadow:0 0 0 16px rgba(245,158,11,0); } 100% { transform:scale(0.95); box-shadow:0 0 0 0 rgba(245,158,11,0); } }
        @keyframes shimmer { 0% { background-position:-200% center; } 100% { background-position:200% center; } }
        @keyframes spin-slow { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .portal-card:hover { transform:translateY(-6px) !important; }
        .portal-card:hover .portal-arrow { opacity:1 !important; transform:translateX(4px) !important; }
        .public-card:hover { transform:translateY(-4px) scale(1.02) !important; }
        .nav-link:hover { color:#f59e0b !important; }
        .stat-item { animation: fadeUp 0.6s ease both; }
      `}</style>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(10,13,26,0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(245,158,11,0.15)',
        padding: '0 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 64,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/logo.png" alt="COE Logo" style={{
            width: 40, height: 40, borderRadius: '50%',
            border: '2px solid #f59e0b',
            animation: 'pulse-ring 2.5s ease infinite',
          }} onError={e => e.target.style.display='none'} />
          <div>
            <div style={{ color: '#f1f5f9', fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px' }}>
              Centre of Excellence Sialkot
            </div>
            <div style={{ color: '#f59e0b', fontWeight: 600, fontSize: 10, letterSpacing: '0.15em' }}>
              BOYS CAMPUS
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {[
            { href: '/student-resources', label: 'Resources' },
            { href: '/notice-board',      label: 'Notices' },
            { href: '/practice-tests',    label: 'Tests' },
          ].map(l => (
            <Link key={l.href} href={l.href} className="nav-link" style={{
              color: '#94a3b8', fontSize: 13, fontWeight: 600,
              padding: '8px 14px', borderRadius: 8, textDecoration: 'none',
              transition: 'color 0.2s',
            }}>
              {l.label}
            </Link>
          ))}
          <Link href="/login" style={{
            marginLeft: 8, background: '#f59e0b', color: '#0a0d1a',
            padding: '8px 20px', borderRadius: 8, fontWeight: 800,
            fontSize: 13, textDecoration: 'none',
          }}>
            Sign In
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        minHeight: '100vh',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px',
        position: 'relative',
        textAlign: 'center',
        overflow: 'hidden',
      }}>
        {/* Background glow orbs */}
        <div style={{
          position: 'absolute', top: '15%', left: '10%',
          width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: '10%', right: '5%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{
          animation: mounted ? 'float 4s ease-in-out infinite, fadeUp 0.8s ease both' : 'none',
          marginBottom: 32,
        }}>
          <img src="/logo.png" alt="COE Sialkot" style={{
            width: 120, height: 120, borderRadius: '50%',
            border: '3px solid #f59e0b',
            boxShadow: '0 0 40px rgba(245,158,11,0.3), 0 0 80px rgba(245,158,11,0.1)',
          }} onError={e => e.target.style.display='none'} />
        </div>

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: 24, padding: '6px 18px', marginBottom: 24,
          animation: mounted ? 'fadeUp 0.8s ease 0.1s both' : 'none',
        }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 6px #22c55e' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em' }}>
            PUNJAB DAANISH SCHOOLS & COE AUTHORITY
          </span>
        </div>

        {/* Main heading */}
        <h1 style={{
          fontSize: 'clamp(2.2rem, 6vw, 4.5rem)',
          fontWeight: 900,
          lineHeight: 1.1,
          letterSpacing: '-1.5px',
          marginBottom: 12,
          animation: mounted ? 'fadeUp 0.8s ease 0.2s both' : 'none',
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #f1f5f9 30%, #94a3b8)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Centre of Excellence
          </span>
          <br />
          <span style={{
            background: 'linear-gradient(135deg, #f59e0b, #fcd34d, #f59e0b)',
            backgroundSize: '200% auto',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            animation: 'shimmer 3s linear infinite',
          }}>
            Sialkot (Boys)
          </span>
        </h1>

        <p style={{
          fontSize: 'clamp(0.95rem, 2vw, 1.2rem)',
          color: '#64748b', maxWidth: 540, lineHeight: 1.7,
          marginBottom: 40,
          animation: mounted ? 'fadeUp 0.8s ease 0.3s both' : 'none',
        }}>
          A premier institution under the Government of Punjab, delivering excellence in education for grades 6 through 10.
        </p>

        {/* CTA buttons */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
          animation: mounted ? 'fadeUp 0.8s ease 0.4s both' : 'none',
          marginBottom: 64,
        }}>
          <Link href="/login" style={{
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            color: '#0a0d1a', padding: '14px 32px', borderRadius: 10,
            fontWeight: 800, fontSize: 15, textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(245,158,11,0.35)',
          }}>
            🔐 Access Portal
          </Link>
          <Link href="/student-resources" style={{
            background: 'rgba(255,255,255,0.05)', color: '#e2e8f0',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '14px 32px', borderRadius: 10,
            fontWeight: 700, fontSize: 15, textDecoration: 'none',
          }}>
            📚 Free Resources
          </Link>
        </div>



        {/* Scroll indicator */}
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          animation: 'float 2s ease-in-out infinite',
        }}>
          <span style={{ fontSize: 11, color: '#334155', letterSpacing: '0.1em' }}>SCROLL</span>
          <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, #334155, transparent)' }} />
        </div>
      </section>

      {/* ── Portals Section ── */}
      <section style={{ padding: '80px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#f59e0b',
            letterSpacing: '0.15em', marginBottom: 12,
          }}>
            — SECURE ACCESS —
          </div>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
            Choose Your Portal
          </h2>
          <p style={{ color: '#475569', marginTop: 10, fontSize: 15 }}>
            Sign in with your credentials to access your personalized dashboard
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {PORTALS.map((p, i) => (
            <Link key={i} href={p.href} style={{ textDecoration: 'none' }}>
              <div className="portal-card" style={{
                background: 'linear-gradient(145deg, #0f1629, #111827)',
                border: `1px solid ${p.color}22`,
                borderRadius: 16, padding: '28px 24px',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Top glow */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                  background: `linear-gradient(90deg, transparent, ${p.color}, transparent)`,
                }} />

                <div style={{ fontSize: 36, marginBottom: 16 }}>{p.icon}</div>
                <div style={{ fontWeight: 800, fontSize: 17, color: '#f1f5f9', marginBottom: 6 }}>
                  {p.label}
                </div>
                <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.5, marginBottom: 20 }}>
                  {p.desc}
                </div>
                <div className="portal-arrow" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  color: p.color, fontSize: 13, fontWeight: 700,
                  opacity: 0.7, transition: 'all 0.2s',
                }}>
                  Sign In <span>→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto 80px', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, transparent, #1e293b)' }} />
          <div style={{
            padding: '8px 20px', borderRadius: 20,
            border: '1px solid #1e293b', background: '#0f1629',
            fontSize: 12, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.1em',
          }}>
            ⚜ PUBLIC ACCESS — NO LOGIN REQUIRED ⚜
          </div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left, transparent, #1e293b)' }} />
        </div>
      </div>

      {/* ── Public Sections ── */}
      <section style={{ padding: '0 24px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.5px' }}>
            Open to Everyone
          </h2>
          <p style={{ color: '#475569', marginTop: 10, fontSize: 15 }}>
            Free resources available to all students — no account needed
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
          {PUBLIC_SECTIONS.map((s, i) => (
            <Link key={i} href={s.href} style={{ textDecoration: 'none' }}>
              <div className="public-card" style={{
                background: `linear-gradient(145deg, ${s.color}08, ${s.color}04)`,
                border: `1px solid ${s.color}25`,
                borderRadius: 20, padding: '32px 28px',
                transition: 'all 0.3s ease',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Corner decoration */}
                <div style={{
                  position: 'absolute', top: -20, right: -20,
                  width: 80, height: 80, borderRadius: '50%',
                  background: `${s.color}10`,
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <span style={{ fontSize: 40 }}>{s.icon}</span>
                  <span style={{
                    background: `${s.color}20`, color: s.color,
                    border: `1px solid ${s.color}40`,
                    fontSize: 11, fontWeight: 800, padding: '4px 12px',
                    borderRadius: 20, letterSpacing: '0.08em',
                  }}>
                    {s.badge}
                  </span>
                </div>

                <div style={{ fontWeight: 800, fontSize: 20, color: '#f1f5f9', marginBottom: 8 }}>
                  {s.label}
                </div>
                <div style={{ fontSize: 14, color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
                  {s.desc}
                </div>

                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: s.color, color: '#fff',
                  padding: '10px 20px', borderRadius: 10,
                  fontSize: 13, fontWeight: 700,
                }}>
                  Explore →
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{
        background: '#060810',
        borderTop: '1px solid #0f1629',
        padding: '48px 24px 32px',
        textAlign: 'center',
      }}>
        <img src="/logo.png" alt="COE" style={{
          width: 56, height: 56, borderRadius: '50%',
          border: '2px solid #1e293b', marginBottom: 20,
        }} onError={e => e.target.style.display='none'} />

        <div style={{ fontSize: 18, fontWeight: 800, color: '#f1f5f9', marginBottom: 4 }}>
          Centre of Excellence Sialkot (Boys)
        </div>
        <div style={{ fontSize: 13, color: '#334155', marginBottom: 24 }}>
          Punjab Daanish Schools & Centres of Excellence Authority · Government of Punjab
        </div>

        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32 }}>
          {[
            { href: '/student-resources', label: '📚 Resources' },
            { href: '/notice-board',      label: '📋 Notices' },
            { href: '/practice-tests',    label: '🧪 Tests' },
            { href: '/login',             label: '🔐 Portal Login' },
          ].map(l => (
            <Link key={l.href} href={l.href} style={{
              color: '#475569', fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
            }}>
              {l.label}
            </Link>
          ))}
        </div>

        <div style={{ height: 1, background: '#0f1629', marginBottom: 24 }} />

        <div style={{ fontSize: 13, color: '#334155' }}>
          Designed & Developed by{' '}
          <span style={{ color: '#f59e0b', fontWeight: 700 }}>Dr Naim Tahir Baig</span>
          {' '}· © {new Date().getFullYear()} COE Sialkot (Boys)
        </div>
      </footer>
    </div>
  );
}
