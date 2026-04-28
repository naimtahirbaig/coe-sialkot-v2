export const metadata = {
  title: 'Student Resources — COE Sialkot (Boys)',
  description: 'Download free notes, past papers, and datesheets for classes 6-10. Based on Single National Curriculum. Centre of Excellence Sialkot Boys.',
  metadataBase: new URL('https://www.coesialkot.com'),
  openGraph: {
    title: '📚 Student Resources — COE Sialkot (Boys)',
    description: 'Free notes, past papers & datesheets for classes 6-10. Download or view online. No login required.',
    url: 'https://www.coesialkot.com/student-resources',
    siteName: 'COE Sialkot (Boys)',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'COE Sialkot Student Resources' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '📚 Student Resources — COE Sialkot (Boys)',
    description: 'Free notes, past papers & datesheets for classes 6-10.',
    images: ['/logo.png'],
  },
};

export default function Layout({ children }) {
  return children;
}
