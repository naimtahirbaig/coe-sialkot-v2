import { pageMeta } from '@/lib/pageMeta';

export const metadata = pageMeta('award-list');

// Allow pinch-zoom on phones. If the site's root layout sets
// maximumScale: 1 (which blocks zooming), this per-page viewport export
// overrides it for the marks-entry screen, where teachers may want to
// zoom in on the number inputs.
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function AwardListLayout({ children }) {
  return children;
}
