import { pageMeta, SITE } from '@/lib/pageMeta';

// Each resource link gets its own title, e.g. "Class 8 Mathematics: Chapter 3 Notes"
const words = (s) => decodeURIComponent(String(s || '')).replace(/[-_]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()).trim();

export async function generateMetadata({ params }) {
  const cls = words(params.class), subject = words(params.subject), name = words(params.slug);
  const heading = [`Class ${cls}`, subject].filter(Boolean).join(' ') + (name ? `: ${name}` : '');
  const description = `${name || 'Study material'} for Class ${cls} ${subject}. Read online or download, free. Centre of Excellence Sialkot (Boys).`;
  const url = `${SITE}/student-resources/${params.class}/${params.subject}/${params.slug}`;
  return pageMeta('student-resources', {
    title: `${heading} | Student Resources, COE Sialkot (Boys)`,
    description,
    alternates: { canonical: url },
    openGraph: { ...pageMeta('student-resources').openGraph, title: heading, description, url },
    twitter: { ...pageMeta('student-resources').twitter, title: heading, description },
  });
}

export default function Layout({ children }) {
  return children;
}
