'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import InnerPage from '@/components/site/InnerPage';
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

  const [copied, setCopied] = useState(false);
  const CAT_LABEL = { notes: 'Notes', past_papers: 'Past Paper', datesheets: 'Date Sheet' };

  if (loading) return (
    <InnerPage section="students" title="Study" light="Material" short>
      <p className="ip-empty">Loading…</p>
    </InnerPage>
  );

  if (notFound) return (
    <InnerPage section="students" title="Not" light="Found" short lede="This resource may have been removed, or the link is not correct.">
      <Link className="ip-btn" href="/student-resources">Back to Student Resources</Link>
    </InnerPage>
  );

  return (
    <InnerPage section="students" title={resource.title} short crumb={resource.subject ? `${resource.subject}, Class ${resource.class}` : `Class ${resource.class}`}
      lede={resource.description || undefined}>
      <div className="rv-head">
        <div>
          <span className="ip-tag">{CAT_LABEL[resource.category] || resource.category}</span>
          {resource.subject && <span className="ip-tag gold">{resource.subject}</span>}
          {resource.class && <span className="ip-tag">Class {resource.class}</span>}
          {resource.created_at && <p className="ip-meta">Added {new Date(resource.created_at).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>}
        </div>
        {resource.file_url && (
          <div className="ip-btnrow">
            <a className="ip-btn" href={resource.file_url} download target="_blank" rel="noopener noreferrer">Download PDF</a>
            <button type="button" className="ip-btn line" onClick={() => { navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }}>{copied ? 'Link copied' : 'Copy link'}</button>
          </div>
        )}
      </div>
      {resource.file_url ? (
        <div className="rv-frame">
          <div className="rv-bar"><b>Document</b><a href={resource.file_url} target="_blank" rel="noopener noreferrer">Open in a new tab</a></div>
          <iframe src={`https://docs.google.com/gview?url=${encodeURIComponent(resource.file_url)}&embedded=true`} title={resource.title} />
        </div>
      ) : <p className="ip-empty">No file is attached to this resource.</p>}
      <p><Link className="ip-btn navy" href="/student-resources">All student resources</Link></p>
    </InnerPage>
  );
}
