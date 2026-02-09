'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { MapPin, Plus, Edit, Trash2, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { createClient } from '@/lib/supabase/client'
import { addressSchema, AddressInput } from '@/lib/validations'
import { KARACHI_AREAS } from '@/types'
import type { Address } from '@/types/database'

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      city: 'Karachi',
      isPrimary: false,
    },
  })

  const fetchAddresses = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/login')
      return
    }

    const { data } = await supabase
      .from('addresses')
      .select('*')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    setAddresses(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const onSubmit = async (data: AddressInput) => {
    setIsSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Ensure profile exists before creating address (fixes 409 foreign key error)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!existingProfile) {
        // Create profile if it doesn't exist using upsert to handle RLS
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          }, { onConflict: 'id' })
        
        if (profileError) {
          console.error('Profile creation error:', profileError.code, profileError.message, profileError.details)
          // Continue anyway - the profile might exist but RLS prevents reading it
        }
      }

      const addressData = {
        user_id: user.id,
        label: data.label,
        address_line1: data.addressLine1,
        address_line2: data.addressLine2 || null,
        area: data.area,
        city: data.city || 'Karachi',
        postal_code: data.postalCode || null,
        delivery_instructions: data.deliveryInstructions || null,
        is_primary: data.isPrimary || false,
      }

      if (editingAddress) {
        const { error } = await supabase
          .from('addresses')
          .update(addressData)
          .eq('id', editingAddress.id)

        if (error) {
          console.error('Address update error:', error.code, error.message, error.details)
          throw error
        }
        toast('success', 'Address Updated', 'Your address has been updated successfully.')
      } else {
        const { error } = await supabase
          .from('addresses')
          .insert(addressData)

        if (error) {
          console.error('Address insert error:', error.code, error.message, error.details)
          throw error
        }
        toast('success', 'Address Added', 'Your new address has been added.')
      }

      reset()
      setShowForm(false)
      setEditingAddress(null)
      fetchAddresses()
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save address. Please try again.'
      console.error('Address operation failed:', error)
      toast('error', 'Error', errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (address: Address) => {
    setEditingAddress(address)
    setValue('label', address.label)
    setValue('addressLine1', address.address_line1)
    setValue('addressLine2', address.address_line2 || '')
    setValue('area', address.area)
    setValue('postalCode', address.postal_code || '')
    setValue('deliveryInstructions', address.delivery_instructions || '')
    setValue('isPrimary', address.is_primary)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) return

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)

      if (error) throw error
      toast('success', 'Address Deleted', 'The address has been removed.')
      fetchAddresses()
    } catch (error) {
      toast('error', 'Error', 'Failed to delete address.')
    }
  }

  const handleSetPrimary = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Remove primary from all addresses
      await supabase
        .from('addresses')
        .update({ is_primary: false })
        .eq('user_id', user.id)

      // Set new primary
      await supabase
        .from('addresses')
        .update({ is_primary: true })
        .eq('id', id)

      toast('success', 'Primary Address Set', 'This address is now your primary address.')
      fetchAddresses()
    } catch (error) {
      toast('error', 'Error', 'Failed to update primary address.')
    }
  }

  const areaOptions = KARACHI_AREAS.map(area => ({
    value: area.name,
    label: area.name,
  }))

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Addresses</h1>
            <p className="text-slate-600">Manage your pickup and delivery addresses</p>
          </div>
          <Button onClick={() => { setEditingAddress(null); reset(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </div>

        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="Label"
                    placeholder="Home, Office, etc."
                    error={errors.label?.message}
                    {...register('label')}
                  />
                  <Select
                    label="Area"
                    options={areaOptions}
                    placeholder="Select area"
                    error={errors.area?.message}
                    {...register('area')}
                  />
                </div>
                
                <Input
                  label="Address Line 1"
                  placeholder="House/Apartment number, Street name"
                  error={errors.addressLine1?.message}
                  {...register('addressLine1')}
                />
                
                <Input
                  label="Address Line 2 (Optional)"
                  placeholder="Building name, Landmark"
                  {...register('addressLine2')}
                />
                
                <div className="grid sm:grid-cols-2 gap-4">
                  <Input
                    label="City"
                    value="Karachi"
                    disabled
                    {...register('city')}
                  />
                  <Input
                    label="Postal Code (Optional)"
                    placeholder="75500"
                    {...register('postalCode')}
                  />
                </div>
                
                <Textarea
                  label="Delivery Instructions (Optional)"
                  placeholder="Gate code, parking instructions, etc."
                  rows={2}
                  {...register('deliveryInstructions')}
                />
                
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPrimary"
                    className="rounded border-slate-300"
                    {...register('isPrimary')}
                  />
                  <label htmlFor="isPrimary" className="text-sm text-slate-600">
                    Set as primary address
                  </label>
                </div>
                
                <div className="flex gap-3 pt-2">
                  <Button type="submit" isLoading={isSubmitting}>
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => { setShowForm(false); setEditingAddress(null); reset(); }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Addresses List */}
        <div className="space-y-4">
          {isLoading ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="animate-spin h-8 w-8 border-2 border-sky-500 border-t-transparent rounded-full mx-auto" />
              </CardContent>
            </Card>
          ) : addresses.length > 0 ? (
            addresses.map((address) => (
              <Card key={address.id} className={address.is_primary ? 'border-sky-500' : ''}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-50 flex-shrink-0">
                        <MapPin className="h-5 w-5 text-sky-500" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-slate-900">{address.label}</h3>
                          {address.is_primary && (
                            <Badge variant="default" className="text-xs">Primary</Badge>
                          )}
                        </div>
                        <p className="text-slate-600 mt-1">{address.address_line1}</p>
                        {address.address_line2 && (
                          <p className="text-slate-600">{address.address_line2}</p>
                        )}
                        <p className="text-slate-600">{address.area}, {address.city}</p>
                        {address.delivery_instructions && (
                          <p className="text-sm text-slate-500 mt-2 italic">
                            Note: {address.delivery_instructions}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!address.is_primary && (
                        <button
                          onClick={() => handleSetPrimary(address.id)}
                          className="p-2 text-slate-400 hover:text-yellow-500 transition-colors"
                          title="Set as primary"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleEdit(address)}
                        className="p-2 text-slate-400 hover:text-sky-500 transition-colors"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(address.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MapPin className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900">No addresses yet</h3>
                <p className="text-slate-600 mt-1">Add your first address to get started</p>
                <Button className="mt-4" onClick={() => setShowForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
