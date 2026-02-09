'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Package, MapPin, User, Phone, Calendar, Edit, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils'
import { ORDER_STATUSES, PAYMENT_STATUSES } from '@/types'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function AdminOrderDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const [order, setOrder] = useState<any>(null)
  const [tracking, setTracking] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newPaymentStatus, setNewPaymentStatus] = useState('')
  const [trackingNote, setTrackingNote] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchOrder = async () => {
      // Check admin access
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      // Fetch order
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id(full_name, email, phone),
          pickup_address:pickup_address_id(*),
          delivery_address:delivery_address_id(*),
          order_items(*, service:service_id(*)),
          driver:assigned_driver_id(full_name, phone)
        `)
        .eq('id', id)
        .single()

      if (orderData) {
        setOrder(orderData)
        setNewStatus(orderData.status)
        setNewPaymentStatus(orderData.payment_status)
      }

      // Fetch tracking
      const { data: trackingData } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false })

      setTracking(trackingData || [])
      setIsLoading(false)
    }

    fetchOrder()
  }, [id, supabase, router])

  const handleUpdateOrder = async () => {
    setIsUpdating(true)
    try {
      const updates: any = {
        updated_at: new Date().toISOString(),
      }

      if (newStatus !== order.status) {
        updates.status = newStatus
      }
      if (newPaymentStatus !== order.payment_status) {
        updates.payment_status = newPaymentStatus
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Add tracking entry if status changed
      if (newStatus !== order.status || trackingNote) {
        await supabase.from('order_tracking').insert({
          order_id: id,
          status: newStatus,
          notes: trackingNote || `Status updated to ${newStatus}`,
        })
      }

      toast('success', 'Order Updated', 'Order has been updated successfully.')
      
      // Refresh data
      setOrder({ ...order, status: newStatus, payment_status: newPaymentStatus })
      const { data: trackingData } = await supabase
        .from('order_tracking')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false })
      setTracking(trackingData || [])
      setTrackingNote('')
    } catch (error) {
      toast('error', 'Error', 'Failed to update order.')
    } finally {
      setIsUpdating(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 py-8 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 py-8">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900">Order not found</h2>
          <Link href="/admin/orders" className="mt-4 inline-block">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/admin/orders" className="inline-flex items-center text-slate-600 hover:text-slate-900 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Order #{order.order_number || order.id.slice(0, 8)}
              </h1>
              <p className="text-slate-600">Placed on {formatDate(order.created_at)}</p>
            </div>
            <div className="flex gap-2">
              <Badge className={`${getOrderStatusColor(order.status)} text-sm px-3 py-1`}>
                {order.status.replace('_', ' ')}
              </Badge>
              <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'} className="text-sm px-3 py-1">
                {order.payment_status}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Name</p>
                    <p className="font-medium">{order.profiles?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Email</p>
                    <p className="font-medium">{order.profiles?.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Phone</p>
                    <p className="font-medium">{order.profiles?.phone || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Addresses */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Addresses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-2">Pickup Address</p>
                    <p className="font-medium">{order.pickup_address?.label}</p>
                    <p className="text-sm text-slate-600">{order.pickup_address?.address_line1}</p>
                    <p className="text-sm text-slate-600">{order.pickup_address?.area}, {order.pickup_address?.city}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {formatDate(order.preferred_pickup_time)}
                    </p>
                  </div>
                  <div className="p-4 bg-sky-50 rounded-lg">
                    <p className="text-sm font-medium text-sky-800 mb-2">Delivery Address</p>
                    <p className="font-medium">{order.delivery_address?.label}</p>
                    <p className="text-sm text-slate-600">{order.delivery_address?.address_line1}</p>
                    <p className="text-sm text-slate-600">{order.delivery_address?.area}, {order.delivery_address?.city}</p>
                    <p className="text-sm text-slate-500 mt-2">
                      <Calendar className="inline h-3 w-3 mr-1" />
                      {formatDate(order.preferred_delivery_time)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Order Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="py-2 px-2 text-sm font-medium text-slate-500">Service</th>
                        <th className="py-2 px-2 text-sm font-medium text-slate-500">Qty</th>
                        <th className="py-2 px-2 text-sm font-medium text-slate-500">Weight</th>
                        <th className="py-2 px-2 text-sm font-medium text-slate-500">Unit Price</th>
                        <th className="py-2 px-2 text-sm font-medium text-slate-500 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.order_items?.map((item: any) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-2 px-2 font-medium">{item.service?.name}</td>
                          <td className="py-2 px-2">{item.quantity}</td>
                          <td className="py-2 px-2">{item.weight_kg ? `${item.weight_kg} kg` : '-'}</td>
                          <td className="py-2 px-2">{formatPrice(item.unit_price)}</td>
                          <td className="py-2 px-2 text-right font-medium">{formatPrice(item.total_price)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t">
                        <td colSpan={4} className="py-2 px-2 text-right text-slate-600">Subtotal</td>
                        <td className="py-2 px-2 text-right font-medium">{formatPrice(order.subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="py-2 px-2 text-right text-slate-600">Delivery Fee</td>
                        <td className="py-2 px-2 text-right font-medium">{formatPrice(order.delivery_fee)}</td>
                      </tr>
                      {order.discount_amount > 0 && (
                        <tr className="text-green-600">
                          <td colSpan={4} className="py-2 px-2 text-right">Discount</td>
                          <td className="py-2 px-2 text-right font-medium">-{formatPrice(order.discount_amount)}</td>
                        </tr>
                      )}
                      <tr className="border-t font-semibold text-lg">
                        <td colSpan={4} className="py-2 px-2 text-right">Total</td>
                        <td className="py-2 px-2 text-right">{formatPrice(order.total_amount)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {order.special_instructions && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Special Instructions</p>
                    <p className="text-sm text-yellow-700">{order.special_instructions}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Order Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                {tracking.length > 0 ? (
                  <div className="space-y-4">
                    {tracking.map((item, index) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-sky-500' : 'bg-slate-300'}`} />
                          {index < tracking.length - 1 && (
                            <div className="w-0.5 h-full bg-slate-200 mt-1" />
                          )}
                        </div>
                        <div className="pb-4 flex-1">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-slate-900 capitalize">
                              {item.status.replace('_', ' ')}
                            </p>
                            <p className="text-xs text-slate-500">
                              {formatDate(item.created_at)}
                            </p>
                          </div>
                          {item.notes && (
                            <p className="text-sm text-slate-600 mt-1">{item.notes}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 text-center py-4">No tracking history</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Update Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Update Order
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  label="Order Status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  options={ORDER_STATUSES.map(status => ({
                    value: status,
                    label: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
                  }))}
                />

                <Select
                  label="Payment Status"
                  value={newPaymentStatus}
                  onChange={(e) => setNewPaymentStatus(e.target.value)}
                  options={PAYMENT_STATUSES.map(status => ({
                    value: status,
                    label: status.charAt(0).toUpperCase() + status.slice(1),
                  }))}
                />

                <Textarea
                  label="Tracking Note (Optional)"
                  placeholder="Add a note for this update..."
                  value={trackingNote}
                  onChange={(e) => setTrackingNote(e.target.value)}
                  rows={3}
                />

                <Button 
                  className="w-full" 
                  onClick={handleUpdateOrder}
                  isLoading={isUpdating}
                  disabled={newStatus === order.status && newPaymentStatus === order.payment_status && !trackingNote}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Update Order
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
