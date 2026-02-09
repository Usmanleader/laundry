import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  Package, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  Truck, 
  AlertCircle 
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils'

export default async function AdminDashboard() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard')
  }

  // Fetch statistics
  const today = new Date()
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString()

  // Total orders
  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  // Today's orders
  const { count: todayOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startOfDay)

  // Pending orders
  const { count: pendingOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Total revenue this month
  const { data: revenueData } = await supabase
    .from('orders')
    .select('total_amount')
    .eq('payment_status', 'paid')
    .gte('created_at', startOfMonth)

  const monthlyRevenue = revenueData?.reduce((sum, o) => sum + o.total_amount, 0) || 0

  // Total users
  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'customer')

  // Recent orders
  const { data: recentOrders } = await supabase
    .from('orders')
    .select(`
      *,
      profiles!orders_user_id_fkey(full_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(10)

  // Orders by status
  const statusCounts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    picked_up: 0,
    washing: 0,
    ready_for_delivery: 0,
    out_for_delivery: 0,
    delivered: 0,
  }

  if (recentOrders) {
    recentOrders.forEach(order => {
      if (order.status in statusCounts) {
        statusCounts[order.status as keyof typeof statusCounts]++
      }
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="text-slate-600">Manage your laundry business</p>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50">
                  <Package className="h-6 w-6 text-sky-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900">{totalOrders || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">{formatPrice(monthlyRevenue)}</p>
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
                  <p className="text-sm text-slate-600">Pending Orders</p>
                  <p className="text-2xl font-bold text-slate-900">{pendingOrders || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-600">Total Customers</p>
                  <p className="text-2xl font-bold text-slate-900">{totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats & Recent Orders */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Order Status Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Link href="/admin/orders?status=pending" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                    <span>Pending</span>
                  </div>
                  <Badge variant="warning">{statusCounts.pending}</Badge>
                </Link>
                <Link href="/admin/orders?status=picked_up" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-sky-500" />
                    <span>Picked Up</span>
                  </div>
                  <Badge>{statusCounts.picked_up}</Badge>
                </Link>
                <Link href="/admin/orders?status=washing" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    <span>Processing</span>
                  </div>
                  <Badge variant="secondary">{statusCounts.washing}</Badge>
                </Link>
                <Link href="/admin/orders?status=out_for_delivery" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-orange-500" />
                    <span>Out for Delivery</span>
                  </div>
                  <Badge variant="warning">{statusCounts.out_for_delivery}</Badge>
                </Link>
                <Link href="/admin/orders?status=delivered" className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span>Delivered</span>
                  </div>
                  <Badge variant="success">{statusCounts.delivered}</Badge>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link 
                href="/admin/orders" 
                className="block p-4 rounded-lg border hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-sky-500" />
                  <div>
                    <p className="font-medium">Manage Orders</p>
                    <p className="text-sm text-slate-500">View and update order status</p>
                  </div>
                </div>
              </Link>
              <Link 
                href="/admin/services" 
                className="block p-4 rounded-lg border hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium">Manage Services</p>
                    <p className="text-sm text-slate-500">Add or edit services</p>
                  </div>
                </div>
              </Link>
              <Link 
                href="/admin/users" 
                className="block p-4 rounded-lg border hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">Manage Users</p>
                    <p className="text-sm text-slate-500">View customer information</p>
                  </div>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Today's Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Today&apos;s Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-sky-50">
                  <div>
                    <p className="text-sm text-sky-500">Orders Today</p>
                    <p className="text-2xl font-bold text-sky-700">{todayOrders || 0}</p>
                  </div>
                  <Package className="h-8 w-8 text-sky-400" />
                </div>
                <div className="text-sm text-slate-600">
                  <p className="flex justify-between py-2 border-b">
                    <span>New Customers (Month)</span>
                    <span className="font-medium">{totalUsers || 0}</span>
                  </p>
                  <p className="flex justify-between py-2 border-b">
                    <span>Active Services</span>
                    <span className="font-medium">12</span>
                  </p>
                  <p className="flex justify-between py-2">
                    <span>Average Order Value</span>
                    <span className="font-medium">{formatPrice(850)}</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders Table */}
        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Orders</CardTitle>
            <Link href="/admin/orders" className="text-sm text-sky-500 hover:underline">
              View All
            </Link>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Order ID</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Customer</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Date</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Amount</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Status</th>
                    <th className="py-3 px-4 text-sm font-medium text-slate-500">Payment</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders && recentOrders.length > 0 ? (
                    recentOrders.map((order) => {
                      const profile = order.profiles as unknown as { full_name: string; email: string } | null
                      return (
                      <tr key={order.id} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <Link href={`/admin/orders/${order.id}`} className="text-sky-500 hover:underline font-medium">
                            #{order.order_number || order.id.slice(0, 8)}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{profile?.full_name || 'N/A'}</p>
                          <p className="text-sm text-slate-500">{profile?.email}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatPrice(order.total_amount)}
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getOrderStatusColor(order.status)}>
                            {order.status.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                            {order.payment_status}
                          </Badge>
                        </td>
                      </tr>
                    )})
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
