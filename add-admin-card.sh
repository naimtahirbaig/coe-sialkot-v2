#!/bin/bash
# Smart helper: detects /admin homepage and offers ways to add a Paper Submissions card

set -e

PROJECT_DIR="$(pwd)"

if [ ! -f "$PROJECT_DIR/package.json" ]; then
  echo "❌ Run from inside ~/Desktop/coe-sialkot-v2"
  exit 1
fi

ADMIN_PAGE="$PROJECT_DIR/src/app/admin/page.js"

NAVY="#0E1F3D"
GOLD="#C9922A"
CREAM="#F5E6C3"

if [ ! -f "$ADMIN_PAGE" ]; then
  echo "ℹ️  No /admin homepage found at: $ADMIN_PAGE"
  echo "   Creating a new one with a Paper Submissions card."
  echo ""

  mkdir -p "$PROJECT_DIR/src/app/admin"
  cat > "$ADMIN_PAGE" << 'NEW_ADMIN_EOF'
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
NEW_ADMIN_EOF

  echo "✓ Created new admin homepage with 3 cards (Paper Submissions, Exams, Students)"
  echo "  File: $ADMIN_PAGE"
  exit 0
fi

# File exists — show what's there and offer guidance
echo "ℹ️  Existing admin homepage detected at: $ADMIN_PAGE"
LINES=$(wc -l < "$ADMIN_PAGE")
echo "   ($LINES lines)"
echo ""
echo "Below are the first 80 lines of your current admin homepage so you can see"
echo "the existing structure. After this output, you'll see two options for how"
echo "to add a Paper Submissions card."
echo ""
echo "════════════════════════════════════════════════════════════════════════════"
head -80 "$ADMIN_PAGE"
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Two options:"
echo ""
echo "  OPTION A — Replace with a clean card-based home (backs up your current file):"
echo "             Re-run this script with the --replace flag."
echo "             ./add-admin-card.sh --replace"
echo ""
echo "  OPTION B — Manually add a card. Open $ADMIN_PAGE in VS Code and paste"
echo "             one of these snippets where your existing cards/links are:"
echo ""
echo "  If you have <a href> link cards:"
echo ""
echo "      <a href=\"/admin/papers\" style={cardStyle}>"
echo "        <div style={{ fontSize: 28 }}>📄</div>"
echo "        <h3>Paper Submissions</h3>"
echo "        <p>Review, unlock, and download exam papers as Word.</p>"
echo "      </a>"
echo ""
echo "  Or just a plain link:"
echo ""
echo "      <a href=\"/admin/papers\">📄 Paper Submissions</a>"
echo ""

# Handle --replace flag
if [ "$1" = "--replace" ]; then
  echo ""
  echo "──────────────────────────────────────────────────────────────────────"
  echo "REPLACING admin homepage with a clean card layout..."
  cp "$ADMIN_PAGE" "$ADMIN_PAGE.backup"
  echo "✓ Backup saved: $ADMIN_PAGE.backup"

  # Recursively call ourselves to create a fresh one
  rm "$ADMIN_PAGE"
  bash "$0"
fi

