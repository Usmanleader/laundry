'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Package, Search, Filter, Eye, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { formatPrice, formatDate, getOrderStatusColor } from '@/lib/utils'
import { ORDER_STATUSES } from '@/types'
import type { Order } from '@/types/database'

interface OrderWithProfile extends Order {
  profiles: {
    full_name: string
    email: string
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderWithProfile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const status = searchParams.get('status')
    if (status) setStatusFilter(status)
  }, [searchParams])

  const fetchOrders = async () => {
    setIsLoading(true)
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        profiles!orders_user_id_fkey(full_name, email)
      `)
      .order('created_at', { ascending: false })

    if (statusFilter) {
      query = query.eq('status', statusFilter)
    }

    const { data } = await query
    setOrders((data as unknown as OrderWithProfile[]) || [])
    setIsLoading(false)
  }

  useEffect(() => {
    // Check admin access
    const checkAdmin = async () => {
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
      
      fetchOrders()
    }
    
    checkAdmin()
  }, [statusFilter])

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId)

      if (error) throw error

      // Add tracking entry
      await supabase.from('order_tracking').insert({
        order_id: orderId,
        status: newStatus,
        notes: `Status updated to ${newStatus}`,
      })

      toast('success', 'Status Updated', `Order status changed to ${newStatus}`)
      fetchOrders()
    } catch (error) {
      toast('error', 'Error', 'Failed to update order status')
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower) ||
      order.profiles?.full_name?.toLowerCase().includes(searchLower) ||
      order.profiles?.email?.toLowerCase().includes(searchLower)
    )
  })

  const statusOptions = [
    { value: '', label: 'All Statuses' },
    ...ORDER_STATUSES.map(status => ({
      value: status,
      label: status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1),
    })),
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Orders</h1>
            <p className="text-gray-600">View and manage all customer orders</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
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
                  placeholder="Search by order ID, customer name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
                className="w-48"
              />
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <Card>
          <CardHeader>
            <CardTitle>Orders ({filteredOrders.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : filteredOrders.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Order ID</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Customer</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Date</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Payment</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-medium">
                            #{order.order_number || order.id.slice(0, 8)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">{order.profiles?.full_name || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{order.profiles?.email}</p>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatPrice(order.total_amount)}
                        </td>
                        <td className="py-3 px-4">
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className={`text-sm rounded-full px-3 py-1 font-medium border-0 cursor-pointer ${getOrderStatusColor(order.status)}`}
                          >
                            {ORDER_STATUSES.map(status => (
                              <option key={status} value={status}>
                                {status.replace('_', ' ')}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                            {order.payment_status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Link href={`/admin/orders/${order.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No orders found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
