export const metadata = {
  title: 'Notice Board — COE Sialkot (Boys)',
  description: 'Official announcements, timetables and notices from Centre of Excellence Sialkot (Boys). Punjab Daanish Schools & COE Authority, Government of Punjab.',
  metadataBase: new URL('https://www.coesialkot.com'),
  openGraph: {
    title: '📋 Notice Board — COE Sialkot (Boys)',
    description: 'Official school notices, timetables and announcements. Updated regularly. No login required.',
    url: 'https://www.coesialkot.com/notice-board',
    siteName: 'COE Sialkot (Boys)',
    images: [{ url: '/logo.png', width: 512, height: 512, alt: 'COE Sialkot Notice Board' }],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: '📋 Notice Board — COE Sialkot (Boys)',
    description: 'Official school notices, timetables and announcements.',
    images: ['/logo.png'],
  },
};

export default function Layout({ children }) {
  return children;
}
