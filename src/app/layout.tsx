import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  title: {
    default: 'Lookout — Проверка компаний Казахстана',
    template: '%s | Lookout',
  },
  description: 'Проверьте любую компанию Казахстана бесплатно: реестр, суды, налоги и отзывы сотрудников в одном месте.',
  keywords: ['проверка компании', 'реестр компаний казахстан', 'КГД', 'отзывы работодателей', 'БИН', 'lookout'],
  openGraph: {
    type: 'website',
    locale: 'ru_KZ',
    siteName: 'Lookout',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={`${inter.className} bg-white text-gray-900 antialiased`}>
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
