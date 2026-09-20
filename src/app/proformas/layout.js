export const metadata = {
  title: "Teacher-wise & Class-wise Detail Proformas | Centre of Excellence Sialkot",
  description:
    "Live class/section-wise and teacher-wise result proformas, built from the award lists.",
  robots: { index: false, follow: false }, // internal, password-protected
  openGraph: {
    title: "Teacher-wise & Class-wise Detail Proformas",
    description:
      "Centre of Excellence Sialkot — live result proformas built from the award lists.",
    url: "https://www.coesialkot.com/proformas",
    siteName: "Centre of Excellence Sialkot",
    images: [{ url: "https://www.coesialkot.com/og-proformas.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Teacher-wise & Class-wise Detail Proformas",
    images: ["https://www.coesialkot.com/og-proformas.png"],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function ProformasLayout({ children }) {
  return children;
}
