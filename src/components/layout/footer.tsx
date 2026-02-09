import Link from 'next/link'
import { Shirt, Facebook, Instagram, Twitter, Mail, Phone, MapPin } from 'lucide-react'

const footerLinks = {
  company: [
    { label: 'About Us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
    { label: 'Blog', href: '/blog' },
  ],
  services: [
    { label: 'Wash & Fold', href: '/services#wash-fold' },
    { label: 'Dry Cleaning', href: '/services#dry-cleaning' },
    { label: 'Ironing', href: '/services#ironing' },
    { label: 'Premium Care', href: '/services#premium' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Track Order', href: '/track' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'FAQs', href: '/faq' },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Refund Policy', href: '/refund' },
  ],
}

const socialLinks = [
  { icon: Facebook, href: 'https://facebook.com/washermankarachi', label: 'Facebook' },
  { icon: Instagram, href: 'https://instagram.com/washermankarachi', label: 'Instagram' },
  { icon: Twitter, href: 'https://twitter.com/washermankarachi', label: 'Twitter' },
]

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Main Footer */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500 shadow-md">
                <Shirt className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-xl font-bold text-white">Washerman</span>
                <span className="text-sm text-slate-400 ml-1">Karachi</span>
              </div>
            </Link>
            <p className="mt-4 text-sm text-slate-400 max-w-xs">
              Premium laundry services across Karachi. We pick up, clean, and deliver your clothes with care.
            </p>
            
            {/* Contact Info */}
            <div className="mt-6 space-y-3">
              <a href="https://wa.me/923362793950" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm hover:text-white">
                <Phone className="h-4 w-4" />
                +92 336 279 3950
              </a>
              <a href="mailto:hello@washerman.pk" className="flex items-center gap-2 text-sm hover:text-white">
                <Mail className="h-4 w-4" />
                hello@washerman.pk
              </a>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>Block 7, Clifton, Karachi</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="mt-6 flex gap-4">
              {socialLinks.map((social) => {
                const Icon = social.icon
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 hover:bg-sky-500 transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Company</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Services</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.services.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Support</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider">Legal</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-sm hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} Washerman Karachi. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-400">
              <span>🇵🇰 Made in Pakistan</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
