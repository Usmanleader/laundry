import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, MapPin, Clock, Phone, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils'

interface OrderDetail {
  id: string
  order_number: string | null
  status: string
  created_at: string
  subtotal: number
  delivery_fee: number
  discount_amount: number
  total_amount: number
  payment_status: string
  special_instructions: string | null
  preferred_pickup_time: string | null
  preferred_delivery_time: string | null
  pickup_address: { address_line1: string; area: string } | null
  delivery_address: { address_line1: string; area: string } | null
  order_items: Array<{ id: string; service: { name: string }; quantity: number; weight_kg: number | null; total_price: number }> | null
  driver: { full_name: string; phone: string } | null
}

interface TrackingItem {
  id: string
  status: string
  notes: string | null
  created_at: string
}

const ORDER_STEPS = [
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
]

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch order with details
  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      pickup_address:pickup_address_id(*),
      delivery_address:delivery_address_id(*),
      order_items(*, service:service_id(*)),
      driver:assigned_driver_id(full_name, phone)
    `)
    .eq('id', id)
    .eq('user_id', user.id)
    .single() as { data: OrderDetail | null; error: Error | null }

  if (error || !order) {
    notFound()
  }

  // Fetch order tracking
  const { data: tracking } = await supabase
    .from('order_tracking')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: false }) as { data: TrackingItem[] | null }

  const currentStepIndex = ORDER_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/dashboard/orders" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.order_number || order.id.slice(0, 8)}
              </h1>
              <p className="text-gray-600">Placed on {formatDate(order.created_at)}</p>
            </div>
            <Badge className={`${getOrderStatusColor(order.status)} text-sm px-3 py-1`}>
              {order.status.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Order Progress */}
        {!isCancelled && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                {/* Progress Line */}
                <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 rounded" />
                <div 
                  className="absolute top-5 left-0 h-1 bg-blue-600 rounded transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (ORDER_STEPS.length - 1)) * 100}%` }}
                />
                
                {/* Steps */}
                <div className="relative flex justify-between">
                  {ORDER_STEPS.filter((_, i) => i % 2 === 0 || i === ORDER_STEPS.length - 1).map((step, index, arr) => {
                    const actualIndex = ORDER_STEPS.indexOf(step)
                    const isCompleted = actualIndex <= currentStepIndex
                    const isCurrent = actualIndex === currentStepIndex
                    
                    return (
                      <div key={step} className="flex flex-col items-center">
                        <div 
                          className={`w-10 h-10 rounded-full flex items-center justify-center z-10 
                            ${isCompleted ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}
                            ${isCurrent ? 'ring-4 ring-blue-200' : ''}
                          `}
                        >
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <span className="text-sm">{index + 1}</span>
                          )}
                        </div>
                        <span className={`mt-2 text-xs text-center max-w-[80px] ${isCurrent ? 'font-semibold text-blue-600' : 'text-gray-500'}`}>
                          {step.replace('_', ' ')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Pickup Address</p>
                  <p className="text-sm text-gray-600">
                    {order.pickup_address?.address_line1}, {order.pickup_address?.area}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.preferred_pickup_time ? formatDate(order.preferred_pickup_time) : 'Not scheduled'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Delivery Address</p>
                  <p className="text-sm text-gray-600">
                    {order.delivery_address?.address_line1}, {order.delivery_address?.area}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.preferred_delivery_time ? formatDate(order.preferred_delivery_time) : 'Not scheduled'}
                  </p>
                </div>
              </div>

              {order.driver && (
                <div className="flex items-start gap-3 pt-4 border-t">
                  <Phone className="h-5 w-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Driver</p>
                    <p className="text-sm text-gray-600">{order.driver?.full_name}</p>
                    <a href={`tel:${order.driver?.phone}`} className="text-sm text-blue-600 hover:underline">
                      {order.driver?.phone}
                    </a>
                  </div>
                </div>
              )}

              {order.special_instructions && (
                <div className="pt-4 border-t">
                  <p className="font-medium text-gray-900 mb-1">Special Instructions</p>
                  <p className="text-sm text-gray-600">{order.special_instructions}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Order Items & Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.order_items && order.order_items.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-medium">{item.service?.name || 'Service'}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} {item.weight_kg ? `• ${item.weight_kg} kg` : ''}
                      </p>
                    </div>
                    <p className="font-medium">{formatPrice(item.total_price)}</p>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>{formatPrice(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span>{formatPrice(order.delivery_fee)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>{formatPrice(order.total_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment</span>
                  <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                    {order.payment_status}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Timeline */}
        {tracking && tracking.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tracking.map((item, index) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
                      {index < tracking.length - 1 && (
                        <div className="w-0.5 h-full bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-medium text-gray-900 capitalize">
                        {item.status.replace('_', ' ')}
                      </p>
                      {item.notes && (
                        <p className="text-sm text-gray-600">{item.notes}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="mt-6 flex gap-4">
          {order.status === 'pending' && (
            <Button variant="destructive">Cancel Order</Button>
          )}
          <Link href="/contact">
            <Button variant="outline">Need Help?</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
