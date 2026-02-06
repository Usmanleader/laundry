'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Search, Mail, Phone, Calendar, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import { formatDate, formatPrice } from '@/lib/utils'
import type { Profile } from '@/types/database'

interface UserWithStats extends Profile {
  orderCount: number
  totalSpent: number
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchUsers = async () => {
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

      // Fetch all profiles with order counts
      const { data: profiles } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profiles) {
        // Fetch order stats for each user
        const usersWithStats = await Promise.all(
          profiles.map(async (p) => {
            const { data: orders } = await supabase
              .from('orders')
              .select('total_amount')
              .eq('user_id', p.id)

            return {
              ...p,
              orderCount: orders?.length || 0,
              totalSpent: orders?.reduce((sum, o) => sum + o.total_amount, 0) || 0,
            }
          })
        )
        setUsers(usersWithStats)
      }
      
      setIsLoading(false)
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      user.full_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    )
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="destructive">Admin</Badge>
      case 'driver':
        return <Badge variant="warning">Driver</Badge>
      default:
        return <Badge variant="secondary">Customer</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manage Users</h1>
            <p className="text-gray-600">View and manage customer accounts</p>
          </div>
          <Link href="/admin">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{users.length}</p>
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
                  <p className="text-sm text-gray-600">With Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => u.orderCount > 0).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">New This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users.filter(u => {
                      const created = new Date(u.created_at)
                      const now = new Date()
                      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                    }).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({filteredUsers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="py-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
              </div>
            ) : filteredUsers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">User</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Contact</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Role</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Orders</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Total Spent</th>
                      <th className="py-3 px-4 text-sm font-medium text-gray-500">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-semibold">
                              {user.full_name?.charAt(0) || user.email?.charAt(0) || '?'}
                            </div>
                            <div>
                              <p className="font-medium">{user.full_name || 'No Name'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {user.phone ? (
                            <a href={`tel:${user.phone}`} className="flex items-center gap-1 text-gray-600 hover:text-blue-600">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </a>
                          ) : (
                            <span className="text-gray-400">Not provided</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-medium">{user.orderCount}</span>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatPrice(user.totalSpent)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(user.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
