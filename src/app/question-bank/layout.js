export const metadata = {
  title: "Question Bank for Teachers | Centre of Excellence Sialkot",
  description: "Add your questions online. They save automatically and are used to make the school papers.",
  robots: { index: false, follow: false }, // teachers' tool: log-in only, not for search engines
  openGraph: {
    title: "Question Bank for Teachers",
    description: "Centre of Excellence Sialkot — add your questions online, they save automatically.",
    url: "https://www.coesialkot.com/question-bank",
    siteName: "Centre of Excellence Sialkot",
    images: [{ url: "https://coesialkot.com/og-question-bank.png", width: 1200, height: 630, alt: "COE Sialkot — Question Bank for Teachers" }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Question Bank for Teachers",
    description: "Centre of Excellence Sialkot — add your questions online, they save automatically.",
    images: ["https://coesialkot.com/og-question-bank.png"],
  },
};

export default function QuestionBankLayout({ children }) {
  return children;
}
