export const metadata = {
  title: "Examinations | Centre of Excellence Sialkot",
  description:
    "Every exam link in one place: marks entry, result proformas, result cards and award lists.",
  openGraph: {
    title: "Examinations — All Exam Links",
    description:
      "Centre of Excellence Sialkot — marks entry, proformas, result cards and award lists.",
    url: "https://www.coesialkot.com/exams",
    siteName: "Centre of Excellence Sialkot",
    images: [{ url: "https://www.coesialkot.com/og-exams.png", width: 1200, height: 630,
               alt: "COE Sialkot — Examinations" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Examinations — All Exam Links",
    images: ["https://www.coesialkot.com/og-exams.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function ExamsLayout({ children }) {
  return children;
}
