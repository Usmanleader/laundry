'use client'

import { useState, useEffect } from 'react'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

const toastIcons = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
}

const toastStyles = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
}

const iconStyles = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
}

function ToastItem({ toast, onDismiss }: ToastProps) {
  const Icon = toastIcons[toast.type]

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id)
    }, 5000)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-lg border p-4 shadow-lg animate-in slide-in-from-right',
        toastStyles[toast.type]
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', iconStyles[toast.type])} />
      <div className="flex-1">
        <p className="font-medium">{toast.title}</p>
        {toast.message && <p className="mt-1 text-sm opacity-90">{toast.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="shrink-0 rounded p-1 hover:bg-black/10"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

// Global toast state
let toastListeners: ((toasts: Toast[]) => void)[] = []
let toasts: Toast[] = []

function notifyListeners() {
  toastListeners.forEach(listener => listener([...toasts]))
}

export function toast(type: ToastType, title: string, message?: string) {
  const id = Math.random().toString(36).substring(2, 9)
  toasts = [...toasts, { id, type, title, message }]
  notifyListeners()
}

export function dismissToast(id: string) {
  toasts = toasts.filter(t => t.id !== id)
  notifyListeners()
}

export function ToastContainer() {
  const [localToasts, setLocalToasts] = useState<Toast[]>([])

  useEffect(() => {
    toastListeners.push(setLocalToasts)
    return () => {
      toastListeners = toastListeners.filter(l => l !== setLocalToasts)
    }
  }, [])

  if (localToasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {localToasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
