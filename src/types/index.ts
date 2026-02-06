export interface NavItem {
  title: string
  href: string
  disabled?: boolean
  external?: boolean
  icon?: string
  label?: string
}

export interface NavItemWithChildren extends NavItem {
  items?: NavItemWithChildren[]
}

export interface SiteConfig {
  name: string
  description: string
  url: string
  ogImage: string
  links: {
    twitter: string
    github: string
  }
}

export interface DashboardConfig {
  mainNav: NavItem[]
  sidebarNav: NavItem[]
}

export interface CartItem {
  serviceId: string
  serviceName: string
  quantity: number
  weightKg?: number
  unitPrice: number
  totalPrice: number
  notes?: string
}

export interface BookingData {
  pickupAddressId: string
  deliveryAddressId: string
  preferredPickupTime: string
  preferredDeliveryTime: string
  items: CartItem[]
  specialInstructions?: string
  promotionCode?: string
  isUrgent?: boolean
}

export interface PriceBreakdown {
  subtotal: number
  deliveryFee: number
  discount: number
  tax: number
  total: number
}

export interface TimeSlot {
  time: string
  label: string
  available: boolean
}

export const TIME_SLOTS: TimeSlot[] = [
  { time: '08:00', label: '8:00 AM - 10:00 AM', available: true },
  { time: '10:00', label: '10:00 AM - 12:00 PM', available: true },
  { time: '12:00', label: '12:00 PM - 2:00 PM', available: true },
  { time: '14:00', label: '2:00 PM - 4:00 PM', available: true },
  { time: '16:00', label: '4:00 PM - 6:00 PM', available: true },
  { time: '18:00', label: '6:00 PM - 8:00 PM', available: true },
  { time: '20:00', label: '8:00 PM - 10:00 PM', available: false },
]

export interface KarachiArea {
  name: string
  deliveryFee: number
  estimatedTime: string
}

export const KARACHI_AREAS: KarachiArea[] = [
  { name: 'DHA Phase 1', deliveryFee: 150, estimatedTime: '45-60 min' },
  { name: 'DHA Phase 2', deliveryFee: 150, estimatedTime: '45-60 min' },
  { name: 'DHA Phase 4', deliveryFee: 150, estimatedTime: '45-60 min' },
  { name: 'DHA Phase 5', deliveryFee: 150, estimatedTime: '45-60 min' },
  { name: 'DHA Phase 6', deliveryFee: 150, estimatedTime: '45-60 min' },
  { name: 'DHA Phase 7', deliveryFee: 175, estimatedTime: '50-70 min' },
  { name: 'DHA Phase 8', deliveryFee: 175, estimatedTime: '50-70 min' },
  { name: 'Clifton', deliveryFee: 150, estimatedTime: '40-55 min' },
  { name: 'PECHS', deliveryFee: 150, estimatedTime: '35-50 min' },
  { name: 'Gulshan-e-Iqbal', deliveryFee: 175, estimatedTime: '50-70 min' },
  { name: 'Gulistan-e-Johar', deliveryFee: 175, estimatedTime: '55-75 min' },
  { name: 'North Nazimabad', deliveryFee: 200, estimatedTime: '60-80 min' },
  { name: 'Nazimabad', deliveryFee: 200, estimatedTime: '55-75 min' },
  { name: 'Saddar', deliveryFee: 175, estimatedTime: '45-65 min' },
  { name: 'Korangi', deliveryFee: 200, estimatedTime: '60-80 min' },
  { name: 'Malir', deliveryFee: 225, estimatedTime: '70-90 min' },
  { name: 'Scheme 33', deliveryFee: 200, estimatedTime: '55-75 min' },
  { name: 'Bahria Town', deliveryFee: 250, estimatedTime: '80-100 min' },
  { name: 'FB Area', deliveryFee: 175, estimatedTime: '50-70 min' },
  { name: 'Garden', deliveryFee: 175, estimatedTime: '45-65 min' },
]

export const ORDER_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800' },
  assigned: { label: 'Driver Assigned', color: 'bg-indigo-100 text-indigo-800' },
  picked_up: { label: 'Picked Up', color: 'bg-purple-100 text-purple-800' },
  at_facility: { label: 'At Facility', color: 'bg-pink-100 text-pink-800' },
  washing: { label: 'Washing', color: 'bg-cyan-100 text-cyan-800' },
  quality_check: { label: 'Quality Check', color: 'bg-teal-100 text-teal-800' },
  ready_for_delivery: { label: 'Ready for Delivery', color: 'bg-green-100 text-green-800' },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-lime-100 text-lime-800' },
  delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
}

export const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'assigned',
  'picked_up',
  'at_facility',
  'washing',
  'quality_check',
  'ready_for_delivery',
  'out_for_delivery',
  'delivered',
  'cancelled',
] as const

export const PAYMENT_STATUSES = [
  'pending',
  'paid',
  'failed',
  'refunded',
] as const

export const SERVICE_CATEGORIES = [
  'wash',
  'dry_clean',
  'iron',
  'premium',
] as const
