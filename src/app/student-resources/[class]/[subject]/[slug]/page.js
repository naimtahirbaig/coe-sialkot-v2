'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import PublicShell from '@/components/PublicShell';
import Link from 'next/link';

export default function ResourceViewerPage() {
  const params = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchResource() {
      const { data, error } = await supabase
        .from('public_resources')
        .select('*')
        .eq('slug', params.slug)
        .eq('is_visible', true)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setResource(data);
      }
      setLoading(false);
    }
    fetchResource();
  }, [params.slug]);

  if (loading) return (
    <PublicShell title="Loading..." accent="#60a5fa">
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
        Loading resource...
      </div>
    </PublicShell>
  );

  if (notFound) return (
    <PublicShell title="Not Found" accent="#dc2626">
      <div style={{ textAlign: 'center', padding: '80px 0' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>📭</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 8 }}>
          Resource not found
        </div>
        <div style={{ fontSize: 14, color: '#64748b', marginBottom: 24 }}>
          This resource may have been removed or the link is incorrect.
        </div>
        <Link href="/student-resources" style={{
          background: '#f59e0b', color: '#0f172a',
          padding: '10px 24px', borderRadius: 8,
          fontWeight: 700, textDecoration: 'none', fontSize: 14,
        }}>
          ← Back to Resources
        </Link>
      </div>
    </PublicShell>
  );

  const CAT_COLORS = {
    notes:       { bg: 'rgba(37,99,235,0.15)',  text: '#60a5fa', border: 'rgba(37,99,235,0.3)'  },
    past_papers: { bg: 'rgba(124,58,237,0.15)', text: '#a78bfa', border: 'rgba(124,58,237,0.3)' },
    datesheets:  { bg: 'rgba(5,150,105,0.15)',  text: '#34d399', border: 'rgba(5,150,105,0.3)'  },
  };
  const CAT_LABEL = { notes: 'Notes', past_papers: 'Past Paper', datesheets: 'Datesheet' };
  const colors = CAT_COLORS[resource.category] || { bg: 'rgba(100,116,139,0.15)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' };

  return (
    <PublicShell title="" accent="#60a5fa">

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: '#64748b' }}>
        <Link href="/student-resources" style={{ color: '#f59e0b', textDecoration: 'none', fontWeight: 600 }}>
          📚 Student Resources
        </Link>
        <span>›</span>
        {resource.subject && <span>{resource.subject}</span>}
        {resource.subject && <span>›</span>}
        <span style={{ color: '#94a3b8' }}>Class {resource.class}</span>
      </div>

      {/* Resource header */}
      <div style={{
        background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
        padding: '24px 28px', marginBottom: 20,
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{
              background: colors.bg, color: colors.text, border: `1px solid ${colors.border}`,
              fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
            }}>
              {CAT_LABEL[resource.category] || resource.category}
            </span>
            {resource.subject && (
              <span style={{
                background: 'rgba(245,158,11,0.1)', color: '#f59e0b',
                border: '1px solid rgba(245,158,11,0.2)',
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              }}>
                📖 {resource.subject}
              </span>
            )}
            {resource.class && (
              <span style={{
                background: 'rgba(100,116,139,0.15)', color: '#94a3b8',
                border: '1px solid rgba(100,116,139,0.3)',
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
              }}>
                Class {resource.class}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#f1f5f9', lineHeight: 1.3 }}>
            {resource.title}
          </h1>

          {/* Description */}
          {resource.description && (
            <p style={{ margin: '0 0 12px', fontSize: 14, color: '#94a3b8', lineHeight: 1.6 }}>
              {resource.description}
            </p>
          )}

          {/* Date */}
          <div style={{ fontSize: 12, color: '#475569' }}>
            Added {new Date(resource.created_at).toLocaleDateString('en-PK', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
            })}
          </div>
        </div>

        {/* Action buttons */}
        {resource.file_url && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
            <a
              href={resource.file_url}
              download
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: '#f59e0b', color: '#0f172a',
                padding: '10px 24px', borderRadius: 8,
                fontSize: 14, fontWeight: 700, textDecoration: 'none',
                textAlign: 'center',
              }}
            >
              ⬇ Download PDF
            </a>
            {/* Share link */}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert('Link copied to clipboard!');
              }}
              style={{
                background: 'rgba(100,116,139,0.2)', color: '#94a3b8',
                border: '1px solid #334155', borderRadius: 8,
                padding: '10px 24px', cursor: 'pointer',
                fontSize: 14, fontWeight: 700,
              }}
            >
              🔗 Copy Link
            </button>
          </div>
        )}
      </div>

      {/* PDF Viewer */}
      {resource.file_url ? (
        <div style={{
          background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
          overflow: 'hidden',
        }}>
          {/* Viewer toolbar */}
          <div style={{
            padding: '12px 20px', borderBottom: '1px solid #334155',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>
              📄 Document Viewer
            </span>
            <a
              href={resource.file_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#60a5fa', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              Open in new tab ↗
            </a>
          </div>

          {/* Google Docs iframe viewer */}
          <iframe
            src={`https://docs.google.com/gview?url=${encodeURIComponent(resource.file_url)}&embedded=true`}
            style={{
              width: '100%',
              height: '80vh',
              border: 'none',
              background: '#fff',
              display: 'block',
            }}
            title={resource.title}
          />
        </div>
      ) : (
        <div style={{
          background: '#1e293b', borderRadius: 12, border: '1px solid #334155',
          padding: '60px', textAlign: 'center', color: '#64748b',
        }}>
          No file available for this resource.
        </div>
      )}
    </PublicShell>
  );
}
