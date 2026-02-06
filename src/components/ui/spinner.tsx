import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  }

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        sizeClasses[size],
        className
      )}
    />
  )
}

export function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto" />
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-12">
      <Spinner />
    </div>
  )
}
