import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
  label?: string
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, id, ...props }, ref) => {
    const textareaId = id || props.name
    
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[100px] w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20',
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
