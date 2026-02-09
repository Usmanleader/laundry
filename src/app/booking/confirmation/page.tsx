'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, Phone, ArrowRight, Home, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export default function BookingConfirmationPage() {
  const searchParams = useSearchParams()
  const orderNumber = searchParams.get('order') || 'N/A'
  const phone = searchParams.get('phone') || ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center py-12 px-4">
      <Card className="w-full max-w-lg border-slate-200 shadow-xl">
        <CardContent className="p-8 text-center">
          <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-emerald-600" />
          </div>

          <h1 className="text-3xl font-bold text-slate-900">Order Confirmed!</h1>
          <p className="mt-2 text-slate-500">Thank you for choosing Washerman Karachi</p>

          <div className="mt-6 p-4 bg-slate-50 rounded-xl">
            <p className="text-sm text-slate-500">Order Number</p>
            <p className="text-2xl font-bold text-sky-600 mt-1">{orderNumber}</p>
          </div>

          <div className="mt-6 space-y-3 text-left">
            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
              <Phone className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800">We&apos;ll call you to confirm</p>
                <p className="text-sm text-slate-600">
                  Our team will reach out to <span className="font-medium">{phone}</span> within 30 minutes to confirm your order and pickup time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-sky-50 rounded-lg">
              <UserPlus className="h-5 w-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Create an account to track orders</p>
                <p className="text-sm text-slate-600">
                  Sign up to track your order status, save addresses, and get exclusive discounts.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/auth/register" className="flex-1">
              <Button className="w-full bg-sky-500 hover:bg-sky-600">
                <UserPlus className="h-4 w-4 mr-2" />
                Create Account
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full border-slate-300">
                <Home className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-400">
              Need help? Call us at{' '}
              <a href="tel:+923001234567" className="text-sky-600 font-medium hover:underline">
                +92 300 123 4567
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
