import './globals.css'

export const metadata = {
  title: 'Centre of Excellence Sialkot (Boys)',
  description: 'Punjab Daanish Schools & Centres of Excellence Authority — Government of Punjab',
  metadataBase: new URL('https://www.coesialkot.com'),
  openGraph: {
    title: 'Centre of Excellence Sialkot (Boys)',
    description: 'Punjab Daanish Schools & Centres of Excellence Authority — Government of Punjab',
    url: 'https://www.coesialkot.com',
    siteName: 'COE Sialkot (Boys)',
    images: [
      {
        url: '/logo.png',
        width: 512,
        height: 512,
        alt: 'Centre of Excellence Sialkot Logo',
      },
    ],
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Centre of Excellence Sialkot (Boys)',
    description: 'Punjab Daanish Schools & Centres of Excellence Authority — Government of Punjab',
    images: ['/logo.png'],
  },
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
