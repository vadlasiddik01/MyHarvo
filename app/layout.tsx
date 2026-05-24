import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/lib/languageContext'
import './globals.css'

export const metadata: Metadata = {
  title: 'MyHarvo - Siddik Harvesting Machine Management',
  description: 'Track harvesting records, diesel costs, and services for your harvesting machine',
  generator: 'MyHarvo',
  icons: {
    icon: [
      {
        url: '/myharvo-logo.jpg',
        type: 'image/jpeg',
      },
    ],
    shortcut: '/myharvo-logo.jpg',
    apple: '/myharvo-logo.jpg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-slate-950">
      <body className="font-sans antialiased bg-slate-900 text-slate-100">
        <LanguageProvider>{children}</LanguageProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
