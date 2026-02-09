'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import Link from 'next/link'
import { Package, Plus, Edit, Trash2, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { formatPrice } from '@/lib/utils'
import type { Service } from '@/types/database'

const CATEGORIES = [
  { value: 'wash_fold', label: 'Wash & Fold' },
  { value: 'dry_clean', label: 'Dry Clean' },
  { value: 'iron', label: 'Ironing' },
  { value: 'premium', label: 'Premium' },
]

const PRICE_TYPES = [
  { value: 'per_piece', label: 'Per Piece' },
  { value: 'per_kg', label: 'Per KG' },
]

interface ServiceForm {
  name: string
  description: string
  category: string
  priceType: string
  pricePerUnit: number
  turnaroundHours: number
  isActive: boolean
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ServiceForm>({
    defaultValues: {
      isActive: true,
      turnaroundHours: 48,
    },
  })

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .order('category')
      .order('name')

    setServices(data || [])
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
      
      fetchServices()
    }
    
    checkAdmin()
  }, [])

  const onSubmit = async (data: ServiceForm) => {
    setIsSubmitting(true)
    try {
      const serviceData = {
        name: data.name,
        description: data.description,
        category: data.category,
        price_type: data.priceType,
        price_per_unit: Number(data.pricePerUnit),
        turnaround_hours: Number(data.turnaroundHours),
        is_active: data.isActive,
      }

      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)

        if (error) throw error
        toast('success', 'Service Updated', 'The service has been updated.')
      } else {
        const { error } = await supabase
          .from('services')
          .insert(serviceData)

        if (error) throw error
        toast('success', 'Service Added', 'New service has been added.')
      }

      reset()
      setShowForm(false)
      setEditingService(null)
      fetchServices()
    } catch (error) {
      toast('error', 'Error', 'Failed to save service.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setValue('name', service.name)
    setValue('description', service.description || '')
    setValue('category', service.category)
    setValue('priceType', service.price_type || 'per_kg')
    setValue('pricePerUnit', service.price_per_unit || service.base_price)
    setValue('turnaroundHours', service.turnaround_hours || 48)
    setValue('isActive', service.is_active)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast('success', 'Service Deleted', 'The service has been removed.')
      fetchServices()
    } catch (error) {
      toast('error', 'Error', 'Failed to delete service. It may be in use by existing orders.')
    }
  }

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error
      toast('success', 'Status Updated', `Service is now ${!isActive ? 'active' : 'inactive'}.`)
      fetchServices()
    } catch (error) {
      toast('error', 'Error', 'Failed to update service status.')
    }
  }

  const groupedServices = services.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = []
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, Service[]>)

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manage Services</h1>
            <p className="text-slate-600">Add, edit, or remove laundry services</p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin">
              <Button variant="outline">Back to Dashboard</Button>
            </Link>
            <Button onClick={() => { setEditingService(null); reset(); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Service
            </Button>
          </div>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>{editingService ? 'Edit Service' : 'Add New Service'}</CardTitle>
              <button 
                onClick={() => { setShowForm(false); setEditingService(null); reset(); }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Service Name"
                    placeholder="e.g., Wash & Fold Regular"
                    {...register('name', { required: 'Name is required' })}
                    error={errors.name?.message}
                  />
                  <Select
                    label="Category"
                    options={CATEGORIES}
                    {...register('category', { required: 'Category is required' })}
                    error={errors.category?.message}
                  />
                </div>
                
                <Textarea
                  label="Description"
                  placeholder="Describe the service..."
                  rows={2}
                  {...register('description')}
                />
                
                <div className="grid sm:grid-cols-3 gap-4">
                  <Select
                    label="Price Type"
                    options={PRICE_TYPES}
                    {...register('priceType', { required: 'Price type is required' })}
                    error={errors.priceType?.message}
                  />
                  <Input
                    label="Price (PKR)"
                    type="number"
                    min={0}
                    step={10}
                    {...register('pricePerUnit', { required: 'Price is required', min: 0 })}
                    error={errors.pricePerUnit?.message}
                  />
                  <Input
                    label="Turnaround (hours)"
                    type="number"
                    min={1}
                    {...register('turnaroundHours', { required: true, min: 1 })}
                  />
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    {...register('isActive')}
                    className="rounded border-slate-300"
                  />
                  <label htmlFor="isActive" className="text-sm text-slate-600">
                    Service is active and available for booking
                  </label>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button type="submit" isLoading={isSubmitting}>
                    <Save className="h-4 w-4 mr-2" />
                    {editingService ? 'Update Service' : 'Add Service'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setShowForm(false); setEditingService(null); reset(); }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Services List */}
        {isLoading ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto" />
            </CardContent>
          </Card>
        ) : services.length > 0 ? (
          <div className="space-y-6">
            {Object.entries(groupedServices).map(([category, categoryServices]) => (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="capitalize">{category.replace('_', ' ')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b text-left">
                          <th className="py-2 px-2 text-sm font-medium text-slate-500">Service</th>
                          <th className="py-2 px-2 text-sm font-medium text-slate-500">Price</th>
                          <th className="py-2 px-2 text-sm font-medium text-slate-500">Turnaround</th>
                          <th className="py-2 px-2 text-sm font-medium text-slate-500">Status</th>
                          <th className="py-2 px-2 text-sm font-medium text-slate-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryServices.map((service) => (
                          <tr key={service.id} className="border-b hover:bg-slate-50">
                            <td className="py-3 px-2">
                              <p className="font-medium">{service.name}</p>
                              {service.description && (
                                <p className="text-sm text-slate-500 truncate max-w-xs">{service.description}</p>
                              )}
                            </td>
                            <td className="py-3 px-2">
                              <span className="font-medium">{formatPrice(service.price_per_unit ?? service.base_price)}</span>
                              <span className="text-slate-500">/{service.price_type === 'per_kg' ? 'kg' : 'pc'}</span>
                            </td>
                            <td className="py-3 px-2 text-slate-600">
                              {service.turnaround_hours || 48}h
                            </td>
                            <td className="py-3 px-2">
                              <button onClick={() => toggleActive(service.id, service.is_active)}>
                                <Badge variant={service.is_active ? 'success' : 'secondary'}>
                                  {service.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                              </button>
                            </td>
                            <td className="py-3 px-2">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEdit(service)}
                                  className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded transition-colors"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(service.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900">No services yet</h3>
              <p className="text-slate-600 mt-1">Add your first service to get started</p>
              <Button className="mt-4" onClick={() => setShowForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
