import { pageMeta } from '@/lib/pageMeta'
import './globals.css'
import SiteChrome from '@/components/site/SiteChrome'

export const metadata = {
  metadataBase: new URL('https://www.coesialkot.com'),
  ...pageMeta('home'),
  icons: { icon: '/logo.png', apple: '/logo.png' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* shared header, footer and inner-page styles (also used by the plain .html pages) */}
        <link rel="stylesheet" href="/site-chrome.css" />
      </head>
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  )
}
