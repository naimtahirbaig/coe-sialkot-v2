export const metadata = {
  title: "Award Lists — Admin | Centre of Excellence Sialkot",
  description: "Lock, unlock, and download award lists for COE Sialkot.",
  robots: { index: false, follow: false }, // internal admin tool — don't index, password-protected
  openGraph: {
    title: "Award Lists — Admin",
    description: "Centre of Excellence Sialkot — lock, unlock & download award lists.",
    url: "https://coesialkot.com/admin/award-lists",
    siteName: "Centre of Excellence Sialkot",
    images: [
      {
        url: "https://coesialkot.com/og-admin-award-lists.png",
        width: 1200,
        height: 630,
        alt: "COE Sialkot — Award Lists Admin",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Award Lists — Admin",
    description: "Centre of Excellence Sialkot — lock, unlock & download award lists.",
    images: ["https://coesialkot.com/og-admin-award-lists.png"],
  },
};

export default function AdminAwardListsLayout({ children }) {
  return children;
}
