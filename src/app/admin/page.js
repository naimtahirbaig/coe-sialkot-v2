'use client';

import AdminAuth from '@/components/AdminAuth';

const NAVY = '#0E1F3D';
const GOLD = '#C9922A';
const CREAM = '#F5E6C3';
const SOFT = '#faf7ef';
const LINE = '#e5e0d4';

const CARDS = [
  {
    href: '/admin/papers',
    icon: '📄',
    title: 'Paper Submissions',
    desc: 'Review, unlock, and download teacher-submitted exam papers as Word documents.',
    accent: GOLD,
  },
  {
    href: '/admin/exams',
    icon: '📊',
    title: 'Exam Results',
    desc: 'View results, lock/unlock marks, print result sheets and individual cards.',
    accent: NAVY,
  },
  {
    href: '/admin/students',
    icon: '🎓',
    title: 'Student Promotion',
    desc: 'Manage 938 students across all classes and sections.',
    accent: NAVY,
  },
  {
    href: '/admin/warning-letter',
    icon: '\u26a0\ufe0f',
    title: 'Warning Letter',
    desc: 'Fill and issue a student disciplinary warning letter, then save it as PDF.',
    accent: GOLD,
  },
];

function AdminHomeInner() {
  const s = {
    page: { minHeight: '100vh', background: SOFT, fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a' },
    topbar: {
      background: NAVY, color: '#fff', padding: '18px 28px',
      borderBottom: `4px solid ${GOLD}`, display: 'flex',
      alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
    },
    brand: { display: 'flex', alignItems: 'center', gap: 14 },
    crest: {
      width: 44, height: 44, borderRadius: '50%', background: GOLD, color: NAVY,
      display: 'grid', placeItems: 'center',
      fontFamily: 'Georgia, serif', fontWeight: 800, fontSize: 18,
      border: `2px solid ${CREAM}`,
    },
    h1: { margin: 0, fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700 },
    sub: { margin: 0, fontSize: 12, opacity: 0.85, letterSpacing: 0.5 },
    container: { maxWidth: 1180, margin: '0 auto', padding: '40px 24px 80px' },
    welcome: {
      fontFamily: 'Georgia, serif', fontSize: 28, color: NAVY,
      marginBottom: 8, fontWeight: 700,
    },
    welcomeSub: { color: '#555', marginBottom: 36, fontSize: 15 },
    grid: {
      display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: 20,
    },
    card: {
      background: '#fff', border: `1px solid ${LINE}`, borderRadius: 12,
      padding: 24, textDecoration: 'none', color: 'inherit',
      transition: 'transform .15s, box-shadow .15s',
      display: 'flex', flexDirection: 'column', gap: 10,
      cursor: 'pointer', position: 'relative', overflow: 'hidden',
    },
    accentBar: {
      position: 'absolute', top: 0, left: 0, right: 0, height: 4,
    },
    icon: { fontSize: 32, marginBottom: 6 },
    cardTitle: {
      fontFamily: 'Georgia, serif', fontSize: 19, fontWeight: 700, color: NAVY,
      margin: 0,
    },
    cardDesc: { fontSize: 13.5, color: '#555', lineHeight: 1.5, margin: 0 },
    arrow: { color: GOLD, fontWeight: 700, fontSize: 14, marginTop: 6 },
  };

  return (
    <div style={s.page}>
      <style>{`
        a.admin-card:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(14,31,61,.12); }
      `}</style>

      <div style={s.topbar}>
        <div style={s.brand}>
          <div style={s.crest}>COE</div>
          <div>
            <h1 style={s.h1}>Admin Portal</h1>
            <p style={s.sub}>Center of Excellence Sialkot (Boys)</p>
          </div>
        </div>
        <a href="/" style={{
          color: '#fff', textDecoration: 'none', fontSize: 13,
          padding: '8px 14px', border: `1px solid ${CREAM}`, borderRadius: 6,
        }}>← Back to Site</a>
      </div>

      <div style={s.container}>
        <div style={s.welcome}>Welcome back</div>
        <div style={s.welcomeSub}>Choose a section to manage:</div>

        <div style={s.grid}>
          {CARDS.map((c) => (
            <a key={c.href} href={c.href} className="admin-card" style={s.card}>
              <div style={{ ...s.accentBar, background: c.accent }} />
              <div style={s.icon}>{c.icon}</div>
              <h2 style={s.cardTitle}>{c.title}</h2>
              <p style={s.cardDesc}>{c.desc}</p>
              <div style={s.arrow}>Open →</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminHomePage() {
  return (
    <AdminAuth>
      <AdminHomeInner />
    </AdminAuth>
  );
}
