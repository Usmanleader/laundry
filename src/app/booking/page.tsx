'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  MapPin, 
  Calendar, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  ChevronRight,
  Clock
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

const BOOKING_STEPS = ['Services', 'Address', 'Schedule', 'Review']

// Payment method options
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
  const [selectedPickupAddress, setSelectedPickupAddress] = useState<string>('')
  const [selectedDeliveryAddress, setSelectedDeliveryAddress] = useState<string>('')
  const [sameAddress, setSameAddress] = useState(true)
  const [promoCode, setPromoCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'easypaisa' | 'jazzcash'>('cash')
  
  // Use the shared cart context
  const { cart, addToCart, updateQuantity, updateWeight, removeFromCart, getItemPrice, getSubtotal, clearCart, getItemCount } = useCart()
  
  // Schedule state
  const [pickupDate, setPickupDate] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryTime, setDeliveryTime] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  // Fetch services and addresses
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login?redirectTo=/booking')
        return
      }

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
      
      setIsLoading(false)
    }

    fetchData()
  }, [supabase, router])

  // Calculate subtotal from cart context
  const subtotal = getSubtotal()
  
  // Get delivery fee from area
  const getDeliveryFee = () => {
    if (subtotal >= 1000) return 0
    const addr = addresses.find(a => a.id === selectedPickupAddress)
    if (addr) {
      const area = KARACHI_AREAS.find(a => a.name === addr.area)
      return area?.deliveryFee || 150
    }
    return 150
  }
  
  const deliveryFee = getDeliveryFee()
  const total = subtotal + deliveryFee - discount

  // Apply promo code
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

    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
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
        })
        .select()
        .single()

      if (orderError) throw orderError

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        service_id: item.service.id,
        quantity: item.quantity,
        weight_kg: item.weight || null,
        unit_price: item.service.price_per_kg || item.service.base_price,
        total_price: getItemPrice(item),
      }))

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

      if (itemsError) throw itemsError

      // Create initial tracking entry
      await supabase.from('order_tracking').insert({
        order_id: order.id,
        status: 'pending',
        notes: 'Order placed successfully',
      })

      // Process payment
      const paymentResponse = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          amount: total,
          payment_method: paymentMethod,
          customer_phone: user.phone || undefined,
          customer_email: user.email,
        }),
      })

      const paymentResult = await paymentResponse.json()

      if (!paymentResponse.ok) {
        throw new Error(paymentResult.error || 'Payment processing failed')
      }

      // If payment requires redirect (like Stripe checkout)
      if (paymentResult.payment_url) {
        window.location.href = paymentResult.payment_url
        return
      }

      // Clear the cart after successful order
      clearCart()

      toast('success', 'Order Placed!', paymentResult.message || 'Your laundry pickup has been scheduled.')
      router.push(`/dashboard/orders/${order.id}`)
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
      case 1: return selectedPickupAddress && (sameAddress || selectedDeliveryAddress)
      case 2: return pickupDate && pickupTime && deliveryDate && deliveryTime
      default: return true
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Book a Pickup</h1>
          <p className="text-gray-600">Schedule your laundry service in a few easy steps</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {BOOKING_STEPS.map((step, index) => (
              <div key={step} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold
                  ${index <= currentStep 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
                <span className={`ml-2 hidden sm:inline ${index <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                  {step}
                </span>
                {index < BOOKING_STEPS.length - 1 && (
                  <ChevronRight className="h-5 w-5 mx-4 text-gray-400" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Services */}
            {currentStep === 0 && (
              <div className="space-y-6">
                {Object.entries(groupedServices).map(([category, categoryServices]) => (
                  <Card key={category}>
                    <CardHeader>
                      <CardTitle className="capitalize">{category.replace('_', ' ')} Services</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4">
                        {categoryServices.map((service) => {
                          const inCart = cart.find(item => item.service.id === service.id)
                          const hasPricePerKg = service.price_per_kg !== null
                          return (
                            <div 
                              key={service.id} 
                              className={`p-4 rounded-lg border transition-colors ${
                                inCart ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <h4 className="font-semibold text-gray-900">{service.name}</h4>
                                  <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                                  <p className="text-blue-600 font-semibold mt-2">
                                    {formatPrice(hasPricePerKg ? service.price_per_kg! : service.base_price)}
                                    <span className="text-gray-500 font-normal">
                                      /{hasPricePerKg ? 'kg' : 'piece'}
                                    </span>
                                  </p>
                                  {service.estimated_hours && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      <Clock className="inline h-3 w-3 mr-1" />
                                      {service.estimated_hours}h turnaround
                                    </p>
                                  )}
                                </div>
                                
                                {inCart ? (
                                  <div className="flex items-center gap-2">
                                    {hasPricePerKg && (
                                      <Input
                                        type="number"
                                        min={0.5}
                                        step={0.5}
                                        value={inCart.weight || ''}
                                        onChange={(e) => updateWeight(service.id, parseFloat(e.target.value))}
                                        placeholder="kg"
                                        className="w-16 text-center"
                                      />
                                    )}
                                    <div className="flex items-center border rounded-lg">
                                      <button
                                        type="button"
                                        onClick={() => updateQuantity(service.id, inCart.quantity - 1)}
                                        className="p-2 hover:bg-gray-100"
                                      >
                                        <Minus className="h-4 w-4" />
                                      </button>
                                      <span className="px-3 font-medium">{inCart.quantity}</span>
                                      <button
                                        type="button"
                                        onClick={() => updateQuantity(service.id, inCart.quantity + 1)}
                                        className="p-2 hover:bg-gray-100"
                                      >
                                        <Plus className="h-4 w-4" />
                                      </button>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => removeFromCart(service.id)}
                                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <Button type="button" size="sm" onClick={() => addToCart(service, 1)}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add
                                  </Button>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Step 2: Address */}
            {currentStep === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle>Pickup & Delivery Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="inline h-4 w-4 mr-1 text-green-600" />
                      Pickup Address
                    </label>
                    {addresses.length > 0 ? (
                      <div className="grid gap-3">
                        {addresses.map((address) => (
                          <label
                            key={address.id}
                            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                              selectedPickupAddress === address.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="pickupAddress"
                              value={address.id}
                              checked={selectedPickupAddress === address.id}
                              onChange={() => setSelectedPickupAddress(address.id)}
                              className="mt-1"
                            />
                            <div>
                              <p className="font-medium">{address.label}</p>
                              <p className="text-sm text-gray-600">{address.address_line1}</p>
                              <p className="text-sm text-gray-600">{address.area}, {address.city}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 border rounded-lg">
                        <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No addresses saved</p>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="mt-2"
                          onClick={() => router.push('/dashboard/addresses')}
                        >
                          Add Address
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="sameAddress"
                      checked={sameAddress}
                      onChange={() => setSameAddress(!sameAddress)}
                      className="rounded"
                    />
                    <label htmlFor="sameAddress" className="text-sm text-gray-700">
                      Deliver to the same address
                    </label>
                  </div>

                  {!sameAddress && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="inline h-4 w-4 mr-1 text-blue-600" />
                        Delivery Address
                      </label>
                      <div className="grid gap-3">
                        {addresses.map((address) => (
                          <label
                            key={address.id}
                            className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                              selectedDeliveryAddress === address.id 
                                ? 'border-blue-500 bg-blue-50' 
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="deliveryAddress"
                              value={address.id}
                              checked={selectedDeliveryAddress === address.id}
                              onChange={() => setSelectedDeliveryAddress(address.id)}
                              className="mt-1"
                            />
                            <div>
                              <p className="font-medium">{address.label}</p>
                              <p className="text-sm text-gray-600">{address.address_line1}</p>
                              <p className="text-sm text-gray-600">{address.area}, {address.city}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Schedule */}
            {currentStep === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle>Schedule Pickup & Delivery</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-green-600" />
                        Pickup Schedule
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Date</label>
                          <input
                            type="date"
                            value={pickupDate}
                            onChange={(e) => setPickupDate(e.target.value)}
                            min={minDate}
                            max={maxDate}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                          <select
                            value={pickupTime}
                            onChange={(e) => setPickupTime(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select time slot</option>
                            {TIME_SLOTS.filter(s => s.available).map(slot => (
                              <option key={slot.time} value={slot.time}>{slot.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-900 mb-4 flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                        Delivery Schedule
                      </h4>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
                          <input
                            type="date"
                            value={deliveryDate}
                            onChange={(e) => setDeliveryDate(e.target.value)}
                            min={pickupDate || minDate}
                            max={maxDate}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Time</label>
                          <select
                            value={deliveryTime}
                            onChange={(e) => setDeliveryTime(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select time slot</option>
                            {TIME_SLOTS.filter(s => s.available).map(slot => (
                              <option key={slot.time} value={slot.time}>{slot.label}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <Textarea
                    label="Special Instructions (Optional)"
                    placeholder="Any special care instructions for your clothes..."
                    rows={3}
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Step 4: Review */}
            {currentStep === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle>Review Your Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Services Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Services</h4>
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.service.id} className="flex justify-between py-2 border-b">
                          <div>
                            <p className="font-medium">{item.service.name}</p>
                            <p className="text-sm text-gray-500">
                              Qty: {item.quantity} {item.weight ? `• ${item.weight} kg` : ''}
                            </p>
                          </div>
                          <p className="font-medium">{formatPrice(getItemPrice(item))}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Addresses */}
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Pickup</h4>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        {(() => {
                          const addr = addresses.find(a => a.id === selectedPickupAddress)
                          return addr ? (
                            <>
                              <p className="font-medium">{addr.label}</p>
                              <p className="text-gray-600">{addr.address_line1}</p>
                              <p className="text-gray-600">{addr.area}</p>
                              <p className="text-gray-500 mt-2">
                                {pickupDate} at {TIME_SLOTS.find(s => s.time === pickupTime)?.label || pickupTime}
                              </p>
                            </>
                          ) : null
                        })()}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Delivery</h4>
                      <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        {(() => {
                          const addr = addresses.find(a => a.id === (sameAddress ? selectedPickupAddress : selectedDeliveryAddress))
                          return addr ? (
                            <>
                              <p className="font-medium">{addr.label}</p>
                              <p className="text-gray-600">{addr.address_line1}</p>
                              <p className="text-gray-600">{addr.area}</p>
                              <p className="text-gray-500 mt-2">
                                {deliveryDate} at {TIME_SLOTS.find(s => s.time === deliveryTime)?.label || deliveryTime}
                              </p>
                            </>
                          ) : null
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Payment Method</h4>
                    <div className="grid gap-3">
                      {PAYMENT_METHODS.map((method) => (
                        <label
                          key={method.value}
                          className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                            paymentMethod === method.value
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.value}
                            checked={paymentMethod === method.value}
                            onChange={(e) => setPaymentMethod(e.target.value as typeof paymentMethod)}
                            className="sr-only"
                          />
                          <span className="text-2xl mr-3">{method.icon}</span>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{method.label}</p>
                            <p className="text-sm text-gray-500">{method.description}</p>
                          </div>
                          {paymentMethod === method.value && (
                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Promo Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Promo Code
                    </label>
                    <div className="flex gap-2">
                      <Input
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        placeholder="Enter code"
                        className="uppercase"
                      />
                      <Button type="button" variant="outline" onClick={applyPromoCode}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {currentStep > 0 ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              ) : (
                <div />
              )}
              
              {currentStep < BOOKING_STEPS.length - 1 ? (
                <Button 
                  type="button"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button 
                  type="button" 
                  onClick={onSubmit} 
                  isLoading={isSubmitting} 
                  disabled={!canProceed()}
                >
                  Place Order
                </Button>
              )}
            </div>
          </div>

          {/* Cart Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cart.length > 0 ? (
                  <>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {cart.map((item) => (
                        <div key={item.service.id} className="flex justify-between text-sm">
                          <div>
                            <p className="font-medium">{item.service.name}</p>
                            <p className="text-gray-500">
                              {item.quantity} × {formatPrice(item.service.price_per_kg || item.service.base_price)}
                              {item.weight ? ` × ${item.weight}kg` : ''}
                            </p>
                          </div>
                          <p className="font-medium">{formatPrice(getItemPrice(item))}</p>
                        </div>
                      ))}
                    </div>
                    
                    <div className="border-t mt-4 pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal</span>
                        <span>{formatPrice(subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Delivery</span>
                        <span className={deliveryFee === 0 ? 'text-green-600' : ''}>
                          {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount</span>
                          <span>-{formatPrice(discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>

                    {subtotal < 1000 && (
                      <p className="text-xs text-gray-500 mt-3">
                        Add {formatPrice(1000 - subtotal)} more for free delivery
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">Your cart is empty</p>
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
