'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, User, LogOut, ShoppingBag, ShoppingCart, Home, Shirt, DollarSign, Phone, Info, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types/database'
import { useCart } from '@/context/CartContext'

const publicLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/services', label: 'Services', icon: Shirt },
  { href: '/pricing', label: 'Pricing', icon: DollarSign },
  { href: '/about', label: 'About', icon: Info },
  { href: '/contact', label: 'Contact', icon: Phone },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [user, setUser] = useState<{ email: string; profile?: Profile } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const supabase = createClient()
  const { getItemCount, clearCart } = useCart()
  const cartCount = getItemCount()

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        setUser({ email: authUser.email!, profile: profile || undefined })
      }
      setIsLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
        setUser({ email: session.user.email!, profile: profile || undefined })
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    clearCart() // Clear cart on logout
    setUser(null)
    window.location.href = '/'
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <Shirt className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Washerman</span>
              <span className="hidden sm:inline text-sm text-gray-500 ml-1">Karachi</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-1">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                  pathname === link.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {!isLoading && (
              <>
                {/* Cart Button - Always visible */}
                <Link href="/booking" className="relative">
                  <Button variant="ghost" size="sm" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {cartCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Button>
                </Link>
                
                {user ? (
                  <div className="hidden md:flex items-center gap-3">
                    <Link href="/booking">
                      <Button size="sm">
                        <ShoppingBag className="h-4 w-4" />
                        Book Now
                      </Button>
                    </Link>
                    <Link href="/dashboard">
                      <Button variant="ghost" size="sm">
                        <LayoutDashboard className="h-4 w-4" />
                        Dashboard
                      </Button>
                    </Link>
                    {user.profile?.role && ['admin', 'manager'].includes(user.profile.role) && (
                      <Link href="/admin">
                        <Button variant="outline" size="sm">
                          Admin
                        </Button>
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="hidden md:flex items-center gap-2">
                    <Link href="/auth/login">
                      <Button variant="ghost" size="sm">
                        Login
                      </Button>
                    </Link>
                    <Link href="/auth/register">
                      <Button size="sm">
                        Sign Up
                      </Button>
                    </Link>
                  </div>
                )}
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="space-y-1">
              {publicLinks.map((link) => {
                const Icon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors',
                      pathname === link.href
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              })}

              <div className="border-t pt-2 mt-2">
                {user ? (
                  <>
                    <Link
                      href="/booking"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-600"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Book Now
                    </Link>
                    <Link
                      href="/dashboard"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600"
                    >
                      <LayoutDashboard className="h-5 w-5" />
                      Dashboard
                    </Link>
                    <button
                      onClick={() => {
                        handleSignOut()
                        setIsOpen(false)
                      }}
                      className="flex w-full items-center gap-3 px-3 py-2 text-sm font-medium text-red-600"
                    >
                      <LogOut className="h-5 w-5" />
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600"
                    >
                      <User className="h-5 w-5" />
                      Login
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-blue-600"
                    >
                      <User className="h-5 w-5" />
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
