'use client'

import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-md">
        <h1 className="text-9xl font-bold text-blue-600">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mt-4 mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. 
          It might have been moved or doesn&apos;t exist.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </Link>
          <Link href="/services">
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Browse Services
            </Button>
          </Link>
        </div>
        <button 
          onClick={() => window.history.back()} 
          className="mt-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Go back
        </button>
      </div>
    </div>
  )
}
