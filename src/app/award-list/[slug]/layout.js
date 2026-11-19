import { readSlug } from "@/lib/examSlug";

// Per-exam link previews for /award-list/<slug>
//
// Each exam URL gets its own title/description built from the slug, and
// its own preview image if one exists at /og-award-list-<slug>.png.
// Otherwise it falls back to the generic /og-award-list.png, so a new
// exam still gets a sensible card without anyone making artwork first.
//
// To give a future exam its own artwork, drop a 1200x630 PNG into
// public/ named after the slug, e.g.
//     public/og-award-list-mid-term-dec-2026.png
// and add the slug to KNOWN_OG below.

const SITE = "https://www.coesialkot.com";

// Slugs that have their own hand-made image in public/ (others get /api/og/award-list)
const KNOWN_OG = new Set([]);

export async function generateMetadata({ params }) {
  const slug = params.slug;
  const { name, period } = readSlug(slug);

  const heading = period ? `${name} — ${period}` : name;
  const title = `${heading} | Award List — Marks Entry`;
  const description =
    `Centre of Excellence Sialkot — subject teachers enter marks for ${heading}.`;

  // every exam gets its own picture with the exam name printed large on it
  const image = KNOWN_OG.has(slug)
    ? `${SITE}/og-award-list-${slug}.png`
    : `${SITE}/api/og/award-list?slug=${encodeURIComponent(slug)}&v=3`;

  return {
    title,
    description,
    robots: { index: false, follow: false }, // PIN-protected internal tool
    openGraph: {
      title: `📝 ${heading.toUpperCase()} | Award List`,
      description,
      url: `${SITE}/award-list/${slug}`,
      siteName: "Centre of Excellence Sialkot",
      images: [{ url: image, width: 1200, height: 630, alt: heading }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `📝 ${heading.toUpperCase()} | Award List`,
      description,
      images: [image],
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function AwardListExamLayout({ children }) {
  return children;
}
