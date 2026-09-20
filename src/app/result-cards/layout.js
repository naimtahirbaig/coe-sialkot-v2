export const metadata = {
  title: "Result Cards | Centre of Excellence Sialkot",
  description: "Printable student progress report cards, built from the award lists.",
  robots: { index: false, follow: false }, // internal, password-protected
  openGraph: {
    title: "Result Cards",
    description: "Centre of Excellence Sialkot — printable student progress report cards.",
    url: "https://www.coesialkot.com/result-cards",
    siteName: "Centre of Excellence Sialkot",
    images: [{ url: "https://www.coesialkot.com/og-result-cards.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Result Cards",
    images: ["https://www.coesialkot.com/og-result-cards.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function ResultCardsLayout({ children }) {
  return children;
}
