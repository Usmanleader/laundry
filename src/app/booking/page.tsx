'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShoppingCart, 
  MapPin, 
  Calendar, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  Clock,
  User,
  LogIn
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import { TIME_SLOTS, KARACHI_AREAS } from '@/types'
import type { Service, Address } from '@/types/database'
import { useCart } from '@/context/CartContext'

interface Promotion {
  id: string
  code: string
  discount_type: 'percentage' | 'fixed'
  discount_value: number
  max_discount_amount: number | null
}

const BOOKING_STEPS = ['Services', 'Details', 'Schedule', 'Review']

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash on Delivery', description: 'Pay when your laundry is delivered', icon: '💵' },
  { value: 'card', label: 'Credit/Debit Card', description: 'Pay securely with your card', icon: '💳' },
  { value: 'easypaisa', label: 'EasyPaisa', description: 'Pay via EasyPaisa mobile wallet', icon: '📱' },
  { value: 'jazzcash', label: 'JazzCash', description: 'Pay via JazzCash mobile wallet', icon: '📲' },
]

export default function BookingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [services, setServices] = useState<Service[]>([])
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Guest info
  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')

  // Saved address selection (logged-in users)
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<string>('')
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState<string>('')
  const [sameAddress, setSameAddress] = useState(true)

  // Guest address fields
  const [addressLabel, setAddressLabel] = useState('Home')
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [addressArea, setAddressArea] = useState('')
  const [addressCity] = useState('Karachi')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')

  // Delivery address fields (when different)
  const [delAddressLabel, setDelAddressLabel] = useState('Office')
  const [delAddressLine1, setDelAddressLine1] = useState('')
  const [delAddressLine2, setDelAddressLine2] = useState('')
  const [delAddressArea, setDelAddressArea] = useState('')
  const [delDeliveryInstructions, setDelDeliveryInstructions] = useState('')

  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'easypaisa' | 'jazzcash'>('cash')

  const { cart, addToCart, updateQuantity, updateWeight, removeFromCart, getItemPrice, getSubtotal, clearCart } = useCart()

  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        setIsLoggedIn(true)
        setUserId(user.id)
        setGuestEmail(user.email || '')

        const [servicesRes, addressesRes] = await Promise.all([
          supabase.from('services').select('*').eq('is_active', true).order('category'),
          supabase.from('addresses').select('*').eq('user_id', user.id).order('is_primary', { ascending: false }),
        ])

        setServices((servicesRes.data || []) as Service[])
        setAddresses((addressesRes.data || []) as Address[])

        if (addressesRes.data && addressesRes.data.length > 0) {
          const addressList = addressesRes.data as Address[]
          const primary = addressList.find(a => a.is_primary) || addressList[0]
          setSelectedPickupAddress(primary.id)
          setSelectedDeliveryAddress(primary.id)
        }
      } else {
        const { data: servicesData } = await supabase
          .from('services')
          .select('*')
          .eq('is_active', true)
          .order('category')

        setServices((servicesData || []) as Service[])
      }

      setIsLoading(false)
    }

    fetchData()
  }, [supabase, router])

  const subtotal = getSubtotal()

  const getDeliveryFee = () => {
    if (subtotal >= 1000) return 0
    if (isLoggedIn && selectedPickupAddress) {
      const addr = addresses.find(a => a.id === selectedPickupAddress)
      if (addr) {
        const area = KARACHI_AREAS.find(a => a.name === addr.area)
        return area?.deliveryFee || 150
      }
    }
    if (addressArea) {
      const area = KARACHI_AREAS.find(a => a.name === addressArea)
      return area?.deliveryFee || 150
    }
    return 150
  }

  const deliveryFee = getDeliveryFee()
  const total = subtotal + deliveryFee - discount

  const applyPromoCode = async () => {
    if (!promoCode.trim()) return

    const { data: promo } = await supabase
      .from('promotions')
      .select('*')
      .eq('code', promoCode.toUpperCase())
      .eq('is_active', true)
      .gte('valid_until', new Date().toISOString())
      .single() as { data: Promotion | null }

    if (promo) {
      const discountAmount = promo.discount_type === 'percentage'
        ? (subtotal * promo.discount_value) / 100
        : promo.discount_value
      setDiscount(Math.min(discountAmount, promo.max_discount_amount || discountAmount))
      toast('success', 'Promo Applied', `You saved ${formatPrice(discountAmount)}!`)
    } else {
      toast('error', 'Invalid Code', 'This promo code is not valid.')
    }
  }

  const onSubmit = async () => {
    if (cart.length === 0) {
      toast('error', 'Empty Cart', 'Please add at least one service.')
      return
    }

    if (!isLoggedIn) {
      if (!guestName.trim()) { toast('error', 'Name Required', 'Please enter your full name.'); return }
      if (!guestPhone.trim()) { toast('error', 'Phone Required', 'Please enter your phone number.'); return }
      if (!addressLine1.trim() || !addressArea) { toast('error', 'Address Required', 'Please fill in your complete address.'); return }
    }

    setIsSubmitting(true)
    try {
      if (isLoggedIn && userId) {
        const orderPayload = {
          user_id: userId,
          pickup_address_id: selectedPickupAddress,
          delivery_address_id: sameAddress ? selectedPickupAddress : selectedDeliveryAddress,
          preferred_pickup_time: pickupDate && pickupTime ? `${pickupDate}T${pickupTime}:00` : null,
          preferred_delivery_time: deliveryDate && deliveryTime ? `${deliveryDate}T${deliveryTime}:00` : null,
          subtotal,
          delivery_fee: deliveryFee,
          discount_amount: discount,
          total_amount: total,
          promo_code: promoCode || null,
          special_instructions: specialInstructions || null,
          status: 'pending',
          payment_method: paymentMethod,
          payment_status: 'pending',
        }

        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert(orderPayload)
          .select()
          .single()

        if (orderError) throw orderError

        const orderItems = cart.map(item => ({
          order_id: order.id,
          service_id: item.service.id,
          quantity: item.quantity,
          weight_kg: item.weight || null,
          unit_price: item.service.price_per_kg || item.service.base_price,
          total_price: getItemPrice(item),
        }))

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
        if (itemsError) throw itemsError

        await supabase.from('order_tracking').insert({
          order_id: order.id,
          status: 'pending',
          notes: 'Order placed successfully',
        })

        const paymentResponse = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: order.id,
            amount: total,
            payment_method: paymentMethod,
            customer_phone: guestPhone || undefined,
            customer_email: guestEmail,
          }),
        })

        const paymentResult = await paymentResponse.json()
        if (!paymentResponse.ok) throw new Error(paymentResult.error || 'Payment processing failed')

        if (paymentResult.payment_url) {
          window.location.href = paymentResult.payment_url
          return
        }

        clearCart()
        toast('success', 'Order Placed!', paymentResult.message || 'Your laundry pickup has been scheduled.')
        router.push(`/dashboard/orders/${order.id}`)
      } else {
        // Guest checkout
        const guestOrderPayload = {
          guest_name: guestName,
          guest_email: guestEmail || null,
          guest_phone: guestPhone,
          pickup_address: {
            label: addressLabel,
            address_line1: addressLine1,
            address_line2: addressLine2 || null,
            area: addressArea,
            city: addressCity,
            delivery_instructions: deliveryInstructions || null,
          },
          delivery_address: sameAddress ? null : {
            label: delAddressLabel,
            address_line1: delAddressLine1,
            address_line2: delAddressLine2 || null,
            area: delAddressArea,
            city: addressCity,
            delivery_instructions: delDeliveryInstructions || null,
          },
          items: cart.map(item => ({
            service_id: item.service.id,
            service_name: item.service.name,
            quantity: item.quantity,
            weight_kg: item.weight || null,
            unit_price: item.service.price_per_kg || item.service.base_price,
            total_price: getItemPrice(item),
          })),
          preferred_pickup_time: pickupDate && pickupTime ? `${pickupDate}T${pickupTime}:00` : null,
          preferred_delivery_time: deliveryDate && deliveryTime ? `${deliveryDate}T${deliveryTime}:00` : null,
          subtotal,
          delivery_fee: deliveryFee,
          discount_amount: discount,
          total_amount: total,
          promo_code: promoCode || null,
          special_instructions: specialInstructions || null,
          payment_method: paymentMethod,
        }

        const response = await fetch('/api/orders/guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(guestOrderPayload),
        })

        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Failed to place order')

        clearCart()
        toast('success', 'Order Placed!', `Order #${result.order_number} placed! We'll call you at ${guestPhone} to confirm.`)
        router.push(`/booking/confirmation?order=${result.order_number}&phone=${encodeURIComponent(guestPhone)}`)
      }
    } catch (error: unknown) {
      const err = error as { code?: string; message?: string; details?: string }
      console.error('Order error:', err.code, err.message, err.details)
      toast('error', 'Error', err.message || 'Failed to place order. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 0: return cart.length > 0
      case 1: {
        if (isLoggedIn) return selectedPickupAddress && (sameAddress || selectedDeliveryAddress)
        return guestName.trim() && guestPhone.trim() && addressLine1.trim() && addressArea
      }
      case 2: return pickupDate && pickupTime && deliveryDate && deliveryTime
      default: return true
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-[3px] border-sky-500 border-t-transparent rounded-full mx-auto" />
          <p className="mt-4 text-slate-500 font-medium">Loading services...</p>
        </div>
      </div>
    )
  }

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = []
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  const minDate = new Date().toISOString().split('T')[0]
  const maxDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Book a Pickup</h1>
          <p className="mt-1 text-slate-500">Schedule your laundry service in a few easy steps</p>
          {!isLoggedIn && (
            <div className="mt-3 flex items-center gap-3 p-3 bg-sky-50 border border-sky-200 rounded-xl text-sm">
              <LogIn className="h-5 w-5 text-sky-600 flex-shrink-0" />
              <span className="text-slate-700">
                Ordering as guest.{' '}
                <Link href="/auth/login?redirectTo=/booking" className="text-sky-600 font-semibold hover:underline">Sign in</Link>
                {' '}or{' '}
                <Link href="/auth/register?redirectTo=/booking" className="text-sky-600 font-semibold hover:underline">create account</Link>
                {' '}to save addresses &amp; track orders.
              </span>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {BOOKING_STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold transition-all duration-300
                  ${index < currentStep
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                    : index === currentStep
                    ? 'bg-sky-500 text-white shadow-lg shadow-sky-200'
                    : 'bg-slate-200 text-slate-400'
                  }`}>
                  {index < currentStep ? '✓' : index + 1}
                </div>
                <span className={`ml-2 hidden sm:inline font-medium ${index <= currentStep ? 'text-slate-800' : 'text-slate-400'}`}>
                  {step}
                </span>
                {index < BOOKING_STEPS.length - 1 && (
                  <div className={`mx-4 h-0.5 w-8 sm:w-12 transition-colors ${index < currentStep ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Step 1: Services */}
            {currentStep === 0 && (
              <div className="space-y-6">
                {Object.keys(groupedServices).length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="p-8 text-center">
                      <ShoppingCart className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-slate-700">No Services Available</h3>
                      <p className="text-slate-500 mt-1">Services are being updated. Check back soon.</p>
                    </CardContent>
                  </Card>
                ) : (
                  Object.entries(groupedServices).map(([category, categoryServices]) => (
                    <Card key={category} className="overflow-hidden border-slate-200 shadow-sm">
                      <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                        <CardTitle className="capitalize text-slate-800">{category.replace(/_/g, ' ')} Services</CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="grid gap-3">
                          {categoryServices.map((service) => {
                            const inCart = cart.find(item => item.service.id === service.id)
                            const hasPricePerKg = service.price_per_kg !== null
                            return (
                              <div key={service.id} className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                                inCart
                                  ? 'border-sky-400 bg-sky-50/50 shadow-sm shadow-sky-100'
                                  : 'border-transparent bg-slate-50 hover:bg-slate-100 hover:border-slate-200'
                              }`}>
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-900">{service.name}</h4>
                                    <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{service.description}</p>
                                    <div className="flex items-center gap-3 mt-2">
                                      <p className="text-sky-600 font-bold text-lg">
                                        {formatPrice(hasPricePerKg ? service.price_per_kg! : service.base_price)}
                                        <span className="text-slate-400 font-normal text-sm ml-0.5">/{hasPricePerKg ? 'kg' : 'piece'}</span>
                                      </p>
                                      {service.estimated_hours && (
                                        <span className="text-xs text-slate-400 flex items-center gap-1">
                                          <Clock className="h-3 w-3" />{service.estimated_hours}h
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {inCart ? (
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {hasPricePerKg && (
                                        <Input
                                          type="number"
                                          min={0.5}
                                          step={0.5}
                                          value={inCart.weight || ''}
                                          onChange={(e) => updateWeight(service.id, parseFloat(e.target.value))}
                                          placeholder="kg"
                                          className="w-16 text-center text-sm"
                                        />
                                      )}
                                      <div className="flex items-center border border-slate-200 rounded-lg bg-white">
                                        <button type="button" onClick={() => updateQuantity(service.id, inCart.quantity - 1)} className="p-2 hover:bg-slate-50 text-slate-600"><Minus className="h-4 w-4" /></button>
                                        <span className="px-3 font-bold text-slate-800">{inCart.quantity}</span>
                                        <button type="button" onClick={() => updateQuantity(service.id, inCart.quantity + 1)} className="p-2 hover:bg-slate-50 text-slate-600"><Plus className="h-4 w-4" /></button>
                                      </div>
                                      <button type="button" onClick={() => removeFromCart(service.id)} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                  ) : (
                                    <Button type="button" size="sm" onClick={() => addToCart(service, 1)} className="bg-sky-500 hover:bg-sky-600 text-white flex-shrink-0">
                                      <Plus className="h-4 w-4 mr-1" />Add
                                    </Button>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            )}

            {/* Step 2: Details */}
            {currentStep === 1 && (
              <div className="space-y-6">
                {!isLoggedIn && (
                  <Card className="border-slate-200 shadow-sm">
                    <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                      <CardTitle className="flex items-center gap-2 text-slate-800"><User className="h-5 w-5 text-sky-500" />Your Information</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Input label="Full Name *" placeholder="e.g. Ahmed Khan" value={guestName} onChange={(e) => setGuestName(e.target.value)} />
                        <Input label="Phone Number *" placeholder="e.g. 03001234567" value={guestPhone} onChange={(e) => setGuestPhone(e.target.value)} />
                      </div>
                      <Input label="Email (Optional)" type="email" placeholder="you@example.com" value={guestEmail} onChange={(e) => setGuestEmail(e.target.value)} />
                    </CardContent>
                  </Card>
                )}

                <Card className="border-slate-200 shadow-sm">
                  <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-slate-800"><MapPin className="h-5 w-5 text-emerald-500" />Pickup &amp; Delivery Address</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {isLoggedIn && addresses.length > 0 ? (
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Pickup Address</label>
                        <div className="grid gap-3">
                          {addresses.map((address) => (
                            <label key={address.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                              selectedPickupAddress === address.id ? 'border-sky-400 bg-sky-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            }`}>
                              <input type="radio" name="pickupAddress" value={address.id} checked={selectedPickupAddress === address.id} onChange={() => setSelectedPickupAddress(address.id)} className="mt-1 accent-sky-500" />
                              <div>
                                <p className="font-semibold text-slate-800">{address.label}</p>
                                <p className="text-sm text-slate-500">{address.address_line1}</p>
                                <p className="text-sm text-slate-500">{address.area}, {address.city}</p>
                              </div>
                            </label>
                          ))}
                        </div>
                        <Button type="button" variant="outline" className="mt-3" onClick={() => router.push('/dashboard/addresses?redirectTo=/booking')}>
                          <Plus className="h-4 w-4 mr-1" />Add New Address
                        </Button>
                      </div>
                    ) : isLoggedIn && addresses.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                        <MapPin className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-600 font-medium">No saved addresses</p>
                        <Button type="button" variant="outline" className="mt-4" onClick={() => router.push('/dashboard/addresses?redirectTo=/booking')}>
                          <Plus className="h-4 w-4 mr-1" />Add Address
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <label className="block text-sm font-semibold text-slate-700">Pickup Address</label>
                        <div className="grid sm:grid-cols-2 gap-4">
                          <Input label="Address Label" placeholder="e.g. Home, Office" value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} />
                          <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700">Area *</label>
                            <select value={addressArea} onChange={(e) => setAddressArea(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-800">
                              <option value="">Select your area</option>
                              {KARACHI_AREAS.map(area => (
                                <option key={area.name} value={area.name}>{area.name} (Del: Rs. {area.deliveryFee})</option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <Input label="Street Address *" placeholder="House 123, Street 4, Block 7" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} />
                        <Input label="Landmark / Floor (Optional)" placeholder="Near XYZ Mosque, 3rd Floor" value={addressLine2} onChange={(e) => setAddressLine2(e.target.value)} />
                        <Input label="Delivery Instructions (Optional)" placeholder="Ring the bell twice, Gate code 1234" value={deliveryInstructions} onChange={(e) => setDeliveryInstructions(e.target.value)} />
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                      <input type="checkbox" id="sameAddress" checked={sameAddress} onChange={() => setSameAddress(!sameAddress)} className="rounded accent-sky-500 w-4 h-4" />
                      <label htmlFor="sameAddress" className="text-sm text-slate-700 font-medium cursor-pointer">Deliver to the same address</label>
                    </div>

                    {!sameAddress && (
                      <div className="space-y-4 pt-4 border-t border-slate-100">
                        <label className="block text-sm font-semibold text-slate-700"><MapPin className="inline h-4 w-4 mr-1 text-sky-500" />Delivery Address</label>
                        {isLoggedIn && addresses.length > 0 ? (
                          <div className="grid gap-3">
                            {addresses.map((address) => (
                              <label key={address.id} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                selectedDeliveryAddress === address.id ? 'border-sky-400 bg-sky-50/50' : 'border-slate-200 hover:border-slate-300'
                              }`}>
                                <input type="radio" name="deliveryAddress" value={address.id} checked={selectedDeliveryAddress === address.id} onChange={() => setSelectedDeliveryAddress(address.id)} className="mt-1 accent-sky-500" />
                                <div>
                                  <p className="font-semibold text-slate-800">{address.label}</p>
                                  <p className="text-sm text-slate-500">{address.address_line1}</p>
                                  <p className="text-sm text-slate-500">{address.area}, {address.city}</p>
                                </div>
                              </label>
                            ))}
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid sm:grid-cols-2 gap-4">
                              <Input label="Address Label" placeholder="e.g. Office" value={delAddressLabel} onChange={(e) => setDelAddressLabel(e.target.value)} />
                              <div className="space-y-1">
                                <label className="block text-sm font-medium text-slate-700">Area *</label>
                                <select value={delAddressArea} onChange={(e) => setDelAddressArea(e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 bg-white text-slate-800">
                                  <option value="">Select area</option>
                                  {KARACHI_AREAS.map(area => (<option key={area.name} value={area.name}>{area.name}</option>))}
                                </select>
                              </div>
                            </div>
                            <Input label="Street Address *" placeholder="Office 5, Building ABC" value={delAddressLine1} onChange={(e) => setDelAddressLine1(e.target.value)} />
                            <Input label="Landmark / Floor (Optional)" value={delAddressLine2} onChange={(e) => setDelAddressLine2(e.target.value)} />
                            <Input label="Delivery Instructions (Optional)" value={delDeliveryInstructions} onChange={(e) => setDelDeliveryInstructions(e.target.value)} />
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 3: Schedule */}
            {currentStep === 2 && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <CardTitle className="flex items-center gap-2 text-slate-800"><Calendar className="h-5 w-5 text-amber-500" />Schedule Pickup &amp; Delivery</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" />Pickup</h4>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                        <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} min={minDate} max={maxDate} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Time Slot</label>
                        <select value={pickupTime} onChange={(e) => setPickupTime(e.target.value)} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 bg-white">
                          <option value="">Select time slot</option>
                          {TIME_SLOTS.filter(s => s.available).map(slot => (<option key={slot.time} value={slot.time}>{slot.label}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-semibold text-slate-800 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-500" />Delivery</h4>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Date</label>
                        <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} min={pickupDate || minDate} max={maxDate} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 bg-white" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Time Slot</label>
                        <select value={deliveryTime} onChange={(e) => setDeliveryTime(e.target.value)} className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-slate-800 bg-white">
                          <option value="">Select time slot</option>
                          {TIME_SLOTS.filter(s => s.available).map(slot => (<option key={slot.time} value={slot.time}>{slot.label}</option>))}
                        </select>
                      </div>
                    </div>
                  </div>
                  <Textarea label="Special Instructions (Optional)" placeholder="Any special care instructions for your clothes..." rows={3} value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)} />
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100">
                  <CardTitle className="text-slate-800">Review Your Order</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {!isLoggedIn && (
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><User className="h-4 w-4 text-sky-500" />Customer</h4>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm">
                        <p className="text-slate-600"><span className="font-medium text-slate-700">Name:</span> {guestName}</p>
                        <p className="text-slate-600"><span className="font-medium text-slate-700">Phone:</span> {guestPhone}</p>
                        {guestEmail && <p className="text-slate-600"><span className="font-medium text-slate-700">Email:</span> {guestEmail}</p>}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Services</h4>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.service.id} className="flex justify-between py-3 border-b border-slate-100 last:border-0">
                          <div>
                            <p className="font-medium text-slate-800">{item.service.name}</p>
                            <p className="text-sm text-slate-500">Qty: {item.quantity} {item.weight ? `• ${item.weight} kg` : ''}</p>
                          </div>
                          <p className="font-semibold text-slate-800">{formatPrice(getItemPrice(item))}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500" />Pickup</h4>
                      <div className="p-3 bg-slate-50 rounded-xl text-sm">
                        {isLoggedIn ? (() => {
                          const addr = addresses.find(a => a.id === selectedPickupAddress)
                          return addr ? (<><p className="font-medium text-slate-700">{addr.label}</p><p className="text-slate-500">{addr.address_line1}</p><p className="text-slate-500">{addr.area}</p></>) : null
                        })() : (<><p className="font-medium text-slate-700">{addressLabel}</p><p className="text-slate-500">{addressLine1}</p><p className="text-slate-500">{addressArea}, {addressCity}</p></>)}
                        <p className="text-slate-400 mt-2">{pickupDate} • {TIME_SLOTS.find(s => s.time === pickupTime)?.label || pickupTime}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-500" />Delivery</h4>
                      <div className="p-3 bg-slate-50 rounded-xl text-sm">
                        {isLoggedIn ? (() => {
                          const addr = addresses.find(a => a.id === (sameAddress ? selectedPickupAddress : selectedDeliveryAddress))
                          return addr ? (<><p className="font-medium text-slate-700">{addr.label}</p><p className="text-slate-500">{addr.address_line1}</p><p className="text-slate-500">{addr.area}</p></>) : null
                        })() : sameAddress ? (<><p className="font-medium text-slate-700">{addressLabel}</p><p className="text-slate-500">{addressLine1}</p><p className="text-slate-500">{addressArea}, {addressCity}</p></>) : (<><p className="font-medium text-slate-700">{delAddressLabel}</p><p className="text-slate-500">{delAddressLine1}</p><p className="text-slate-500">{delAddressArea}, {addressCity}</p></>)}
                        <p className="text-slate-400 mt-2">{deliveryDate} • {TIME_SLOTS.find(s => s.time === deliveryTime)?.label || deliveryTime}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-slate-800 mb-3">Payment Method</h4>
                    <div className="grid gap-3">
                      {PAYMENT_METHODS.map((method) => (
                        <label key={method.value} className={`flex items-center p-4 border-2 rounded-xl cursor-pointer transition-all ${
                          paymentMethod === method.value ? 'border-sky-400 bg-sky-50/50 shadow-sm' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}>
                          <input type="radio" name="paymentMethod" value={method.value} checked={paymentMethod === method.value} onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)} className="sr-only" />
                          <span className="text-2xl mr-3">{method.icon}</span>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-800">{method.label}</p>
                            <p className="text-sm text-slate-500">{method.description}</p>
                          </div>
                          {paymentMethod === method.value && (
                            <div className="w-6 h-6 bg-sky-500 rounded-full flex items-center justify-center">
                              <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Promo Code</label>
                    <div className="flex gap-2">
                      <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="Enter code" className="uppercase" />
                      <Button type="button" variant="outline" onClick={applyPromoCode}>Apply</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              {currentStep > 0 ? (
                <Button type="button" variant="outline" onClick={() => setCurrentStep(currentStep - 1)} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <ArrowLeft className="h-4 w-4 mr-2" />Back
                </Button>
              ) : <div />}
              {currentStep < BOOKING_STEPS.length - 1 ? (
                <Button type="button" onClick={() => setCurrentStep(currentStep + 1)} disabled={!canProceed()} className="bg-sky-500 hover:bg-sky-600">
                  Next<ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={onSubmit} isLoading={isSubmitting} disabled={!canProceed()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-8">
                  {isSubmitting ? 'Placing Order...' : '🎉 Place Order'}
                </Button>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 border-slate-200 shadow-sm">
              <CardHeader className="bg-gradient-to-r from-sky-50 to-white border-b border-slate-100">
                <CardTitle className="flex items-center gap-2 text-slate-800"><ShoppingCart className="h-5 w-5 text-sky-500" />Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                {cart.length > 0 ? (
                  <>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.service.id} className="flex justify-between text-sm">
                          <div>
                            <p className="font-medium text-slate-800">{item.service.name}</p>
                            <p className="text-slate-400">{item.quantity} × {formatPrice(item.service.price_per_kg || item.service.base_price)}{item.weight ? ` × ${item.weight}kg` : ''}</p>
                          </div>
                          <p className="font-semibold text-slate-700">{formatPrice(getItemPrice(item))}</p>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 mt-4 pt-4 space-y-2">
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="text-slate-700">{formatPrice(subtotal)}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-slate-500">Delivery</span><span className={deliveryFee === 0 ? 'text-emerald-600 font-medium' : 'text-slate-700'}>{deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}</span></div>
                      {discount > 0 && <div className="flex justify-between text-sm text-emerald-600"><span>Discount</span><span>-{formatPrice(discount)}</span></div>}
                      <div className="flex justify-between font-bold text-lg pt-3 border-t border-slate-100"><span className="text-slate-800">Total</span><span className="text-sky-600">{formatPrice(total)}</span></div>
                    </div>
                    {subtotal < 1000 && (
                      <p className="text-xs text-slate-400 mt-3 p-2 bg-amber-50 rounded-lg text-center">🚚 Add {formatPrice(1000 - subtotal)} more for <span className="font-semibold text-amber-700">free delivery</span></p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-10 w-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-400 text-sm">Your cart is empty</p>
                    <p className="text-slate-400 text-xs mt-1">Add services from Step 1</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
