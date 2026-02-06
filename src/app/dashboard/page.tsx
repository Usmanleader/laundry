import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Package, MapPin, User, Plus, Clock, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils'
import type { Profile, Order } from '@/types/database'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single() as { data: Profile | null }

  // Fetch recent orders
  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5) as { data: Order[] | null }

  // Fetch addresses count
  const { count: addressCount } = await supabase
    .from('addresses')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Calculate stats
  const stats = {
    totalOrders: orders?.length || 0,
    pendingOrders: orders?.filter(o => !['delivered', 'cancelled'].includes(o.status)).length || 0,
    completedOrders: orders?.filter(o => o.status === 'delivered').length || 0,
    addresses: addressCount || 0,
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome back, {profile?.full_name?.split(' ')[0] || 'there'}!
            </h1>
            <p className="text-gray-600">Here&apos;s an overview of your laundry activity</p>
          </div>
          <Link href="/booking">
            <Button size="lg">
              <Plus className="h-4 w-4 mr-2" />
              New Booking
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <Package className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedOrders}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Saved Addresses</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.addresses}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Orders */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/booking" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-blue-600" />
                      <span>Book a Pickup</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
                <Link href="/dashboard/orders" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span>Track Orders</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
                <Link href="/dashboard/addresses" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-purple-600" />
                      <span>Manage Addresses</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
                <Link href="/dashboard/profile" className="block">
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <User className="h-5 w-5 text-green-600" />
                      <span>Edit Profile</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                </Link>
              </CardContent>
            </Card>

            {/* Promo Card */}
            <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold">20% OFF</h3>
                <p className="mt-1 text-blue-100 text-sm">
                  Use code WELCOME20 on your next order
                </p>
                <Link href="/booking" className="mt-4 inline-block">
                  <Button size="sm" className="bg-white text-blue-600 hover:bg-blue-50">
                    Book Now
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:underline">
                  View All
                </Link>
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
                        <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                              <Package className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                Order #{order.order_number || order.id.slice(0, 8)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatDate(order.created_at)}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge className={getOrderStatusColor(order.status)}>
                              {order.status.replace('_', ' ')}
                            </Badge>
                            <p className="mt-1 text-sm font-medium text-gray-900">
                              {formatPrice(order.total_amount)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No orders yet</p>
                    <Link href="/booking" className="mt-4 inline-block">
                      <Button>Book Your First Pickup</Button>
                    </Link>
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
