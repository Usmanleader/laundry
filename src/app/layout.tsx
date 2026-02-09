import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar, Footer } from '@/components/layout'
import { ToastContainer } from '@/components/ui/toast'
import { WhatsAppButton } from '@/components/ui/whatsapp-button'
import { CartProvider } from '@/context/CartContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Washerman Karachi - Premium Laundry Services',
    template: '%s | Washerman Karachi',
  },
  description: 'Premium laundry and dry cleaning services across Karachi. We pick up, clean, and deliver your clothes with care. Book online today!',
  keywords: ['laundry', 'dry cleaning', 'wash and fold', 'Karachi', 'Pakistan', 'clothes cleaning', 'ironing'],
  authors: [{ name: 'Washerman Karachi' }],
  creator: 'Washerman Karachi',
  openGraph: {
    type: 'website',
    locale: 'en_PK',
    url: 'https://washerman.pk',
    title: 'Washerman Karachi - Premium Laundry Services',
    description: 'Premium laundry and dry cleaning services across Karachi. We pick up, clean, and deliver your clothes with care.',
    siteName: 'Washerman Karachi',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Washerman Karachi - Premium Laundry Services',
    description: 'Premium laundry and dry cleaning services across Karachi.',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <CartProvider>
          <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <WhatsAppButton />
          <ToastContainer />
        </CartProvider>
      </body>
    </html>
  )
}
