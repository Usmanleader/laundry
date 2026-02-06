import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, Filter, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils'

interface OrderWithAddresses {
  id: string
  order_number: string | null
  status: string
  created_at: string
  total_amount: number
  payment_status: string
  pickup_address: { label: string; area: string } | null
  delivery_address: { label: string; area: string } | null
}

export default async function OrdersPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch all orders
  const { data: orders } = await supabase
    .from('orders')
    .select(`
      *,
      pickup_address:pickup_address_id(label, area),
      delivery_address:delivery_address_id(label, area)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false }) as { data: OrderWithAddresses[] | null }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600">Track and manage your laundry orders</p>
          </div>
          <Link href="/booking">
            <Button>
              <Package className="h-4 w-4 mr-2" />
              New Order
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        <Card>
          <CardHeader>
            <CardTitle>All Orders ({orders?.length || 0})</CardTitle>
          </CardHeader>
          <CardContent>
            {orders && orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Link 
                    key={order.id} 
                    href={`/dashboard/orders/${order.id}`}
                    className="block"
                  >
                    <div className="p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 flex-shrink-0">
                            <Package className="h-6 w-6 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900">
                                Order #{order.order_number || order.id.slice(0, 8)}
                              </p>
                              <Badge className={getOrderStatusColor(order.status)}>
                                {order.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              Placed on {formatDate(order.created_at)}
                            </p>
                            <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-600">
                              <span>
                                Pickup: {(order.pickup_address as { label: string; area: string })?.label || 'N/A'}, {(order.pickup_address as { label: string; area: string })?.area || ''}
                              </span>
                              <span>•</span>
                              <span>
                                Delivery: {(order.delivery_address as { label: string; area: string })?.label || 'N/A'}, {(order.delivery_address as { label: string; area: string })?.area || ''}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">
                            {formatPrice(order.total_amount)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order.payment_status === 'paid' ? 'Paid' : 'Payment Pending'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No orders yet</h3>
                <p className="text-gray-600 mt-1">Book your first pickup to get started</p>
                <Link href="/booking" className="mt-6 inline-block">
                  <Button>Book Now</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
