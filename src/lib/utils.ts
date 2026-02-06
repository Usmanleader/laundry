import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date))
}

export function formatDateOnly(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PK', {
    dateStyle: 'medium',
  }).format(new Date(date))
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-PK', {
    timeStyle: 'short',
  }).format(new Date(date))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateTimeSlots(startHour: number = 8, endHour: number = 20): { time: string; label: string }[] {
  const slots = []
  for (let hour = startHour; hour <= endHour; hour++) {
    const time24 = `${hour.toString().padStart(2, '0')}:00`
    const period = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    const label = `${hour12}:00 ${period}`
    slots.push({ time: time24, label })
  }
  return slots
}

export function getAvailableDates(daysAhead: number = 7): Date[] {
  const dates = []
  const today = new Date()
  for (let i = 1; i <= daysAhead; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    dates.push(date)
  }
  return dates
}

export function calculateDeliveryDate(pickupDate: Date, hoursRequired: number = 24): Date {
  const delivery = new Date(pickupDate)
  delivery.setHours(delivery.getHours() + hoursRequired)
  return delivery
}

export function isValidPhoneNumber(phone: string): boolean {
  // Pakistani phone number format: +923XXXXXXXXX or 03XXXXXXXXX
  const regex = /^(\+92|0)?3[0-9]{9}$/
  return regex.test(phone.replace(/\s/g, ''))
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('92')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+92${cleaned.slice(1)}`
  }
  return `+92${cleaned}`
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    assigned: 'bg-indigo-100 text-indigo-800',
    picked_up: 'bg-purple-100 text-purple-800',
    at_facility: 'bg-pink-100 text-pink-800',
    washing: 'bg-cyan-100 text-cyan-800',
    quality_check: 'bg-teal-100 text-teal-800',
    ready_for_delivery: 'bg-green-100 text-green-800',
    out_for_delivery: 'bg-lime-100 text-lime-800',
    delivered: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export function calculateEstimatedDelivery(serviceCategory: string, isUrgent: boolean = false): number {
  // Returns hours
  const baseHours: Record<string, number> = {
    wash: 24,
    dry_clean: 48,
    iron: 12,
    premium: 36,
  }
  const hours = baseHours[serviceCategory] || 24
  return isUrgent ? Math.floor(hours / 2) : hours
}
