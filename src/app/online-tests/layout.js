export const metadata = {
  metadataBase: new URL('https://www.coesialkot.com'),
  title: 'Online Tests — Centre of Excellence Sialkot (Boys)',
  description:
    'MCQs Online Tests, September 2026. 25 tests across Class 6, 7 and 8. ' +
    '52 MCQs each, auto-graded with a result card at the end. No login needed.',
  openGraph: {
    type: 'website',
    siteName: 'Centre of Excellence Sialkot (Boys)',
    title: 'Online Tests — Class 6, 7 and 8',
    description:
      'MCQs Online Tests, September 2026. 25 tests across Class 6, 7 and 8. ' +
      '52 MCQs each, auto-graded with a result card at the end. No login needed.',
    url: 'https://www.coesialkot.com/online-tests',
    images: [
      {
        url: '/online-tests/og-online-tests-home.png',
        width: 1200,
        height: 630,
        alt: 'Online Tests — Centre of Excellence Sialkot (Boys)',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Online Tests — Class 6, 7 and 8',
    description:
      'MCQs Online Tests, September 2026. 25 tests, 52 MCQs each, auto-graded result card.',
    images: ['/online-tests/og-online-tests-home.png'],
  },
};

export default function OnlineTestsLayout({ children }) {
  return children;
}
