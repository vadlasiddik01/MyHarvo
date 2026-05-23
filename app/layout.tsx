import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/lib/languageContext'
import './globals.css'

const appIconUrl = process.env.NEXT_PUBLIC_APP_ICON_URL || '/myharvo-logo.jpg'

export const metadata: Metadata = {
  title: 'MyHarvo - Harvesting Machine Management',
  description: 'Track harvesting records, diesel costs, and services for your harvesting machine',
  generator: 'MyHarvo',
  icons: {
    icon: [
      {
        url: appIconUrl,
        type: 'image/jpeg',
      },
    ],
    shortcut: appIconUrl,
    apple: appIconUrl,
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
