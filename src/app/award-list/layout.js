export const metadata = {
  title: "Award List — Marks Entry | Centre of Excellence Sialkot",
  description: "Enter your class-section's subject marks for the COE Sialkot award list.",
  robots: { index: false, follow: false }, // internal tool — don't index, PIN-protected
  openGraph: {
    title: "Award List — Marks Entry",
    description: "Centre of Excellence Sialkot — enter your section's subject marks online.",
    url: "https://www.coesialkot.com/online-mcqs-award-list-sep2026",
    siteName: "Centre of Excellence Sialkot",
    images: [
      {
        url: "https://coesialkot.com/og-award-list.png",
        width: 1200,
        height: 630,
        alt: "COE Sialkot — Award List Marks Entry",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Award List — Marks Entry",
    description: "Centre of Excellence Sialkot — enter your section's subject marks online.",
    images: ["https://coesialkot.com/og-award-list.png"],
  },
};

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
