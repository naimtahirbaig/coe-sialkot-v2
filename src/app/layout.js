import './globals.css'

export const metadata = {
  title: 'Centre of Excellence Sialkot (Boys)',
  description: 'Punjab Daanish Schools & Centres of Excellence Authority — Government of Punjab',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
