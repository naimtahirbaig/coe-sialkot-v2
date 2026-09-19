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

// Slugs that have their own image in public/
const KNOWN_OG = new Set([
  "first-term-sba-sep-2026",
]);

const SHORT_MONTHS = {
  jan: "January", feb: "February", mar: "March", apr: "April",
  may: "May", jun: "June", jul: "July", aug: "August",
  sep: "September", oct: "October", nov: "November", dec: "December",
};

// Words with a fixed spelling, rather than plain title-casing.
const SPECIAL_WORDS = {
  sba: "SBA", mcq: "MCQ", mcqs: "MCQs", thq: "THQ",
  ict: "ICT", pe: "PE", hod: "HOD", coe: "COE", sst: "SST",
};

// "first-term-sba-sep-2026" -> { name: "First Term SBA", period: "September 2026" }
function readSlug(slug) {
  const parts = String(slug || "").split("-").filter(Boolean);
  const year = parts.length && /^\d{4}$/.test(parts[parts.length - 1])
    ? parts.pop()
    : null;
  const month = parts.length && SHORT_MONTHS[parts[parts.length - 1]]
    ? SHORT_MONTHS[parts.pop()]
    : null;

  const name = parts
    .map((w) => SPECIAL_WORDS[w] || w[0].toUpperCase() + w.slice(1))
    .join(" ");

  const period = [month, year].filter(Boolean).join(" ");
  return { name: name || "Award List", period };
}

export async function generateMetadata({ params }) {
  const slug = params.slug;
  const { name, period } = readSlug(slug);

  const heading = period ? `${name} — ${period}` : name;
  const title = `${heading} | Award List — Marks Entry`;
  const description =
    `Centre of Excellence Sialkot — subject teachers enter marks for ${heading}.`;

  const image = KNOWN_OG.has(slug)
    ? `${SITE}/og-award-list-${slug}.png`
    : `${SITE}/og-award-list.png`;

  return {
    title,
    description,
    robots: { index: false, follow: false }, // PIN-protected internal tool
    openGraph: {
      title: heading,
      description,
      url: `${SITE}/award-list/${slug}`,
      siteName: "Centre of Excellence Sialkot",
      images: [{ url: image, width: 1200, height: 630, alt: heading }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: heading,
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
