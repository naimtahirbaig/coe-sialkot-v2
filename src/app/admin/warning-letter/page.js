'use client';

import AdminAuth from '@/components/AdminAuth';

function WarningLetterInner() {
  return (
    <div style={{ minHeight: '100vh', background: '#faf7ef' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e0d4',
                    display: 'flex', alignItems: 'center', gap: 12 }}>
        <a href="/admin" style={{ color: '#0E1F3D', textDecoration: 'none', fontSize: 14 }}>
          &larr; Back to Admin
        </a>
        <strong style={{ color: '#0E1F3D' }}>Student Warning Letter</strong>
        <a href="/staff/warning-letter.html" target="_blank" rel="noreferrer"
           style={{ marginLeft: 'auto', color: '#C9922A', fontSize: 14 }}>
          Open full screen
        </a>
      </div>
      <iframe
        src="/staff/warning-letter.html"
        title="Student Warning Letter"
        style={{ width: '100%', height: 'calc(100vh - 57px)', border: 0 }}
      />
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
