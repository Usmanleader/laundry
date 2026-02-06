'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/auth/login')
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const fullName = formData.get('fullName') as string
  const phone = formData.get('phone') as string
  const dateOfBirth = formData.get('dateOfBirth') as string
  const gender = formData.get('gender') as string

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      phone,
      date_of_birth: dateOfBirth || null,
      gender: gender || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/profile')
  return { success: true }
}

export async function createAddress(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const label = formData.get('label') as string
  const addressLine1 = formData.get('addressLine1') as string
  const addressLine2 = formData.get('addressLine2') as string
  const area = formData.get('area') as string
  const postalCode = formData.get('postalCode') as string
  const deliveryInstructions = formData.get('deliveryInstructions') as string
  const isPrimary = formData.get('isPrimary') === 'true'

  // If setting as primary, unset other primary addresses
  if (isPrimary) {
    await supabase
      .from('addresses')
      .update({ is_primary: false })
      .eq('user_id', user.id)
  }

  const { error } = await supabase.from('addresses').insert({
    user_id: user.id,
    label,
    address_line1: addressLine1,
    address_line2: addressLine2 || null,
    area,
    city: 'Karachi',
    postal_code: postalCode || null,
    delivery_instructions: deliveryInstructions || null,
    is_primary: isPrimary,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/addresses')
  return { success: true }
}

export async function updateAddress(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const label = formData.get('label') as string
  const addressLine1 = formData.get('addressLine1') as string
  const addressLine2 = formData.get('addressLine2') as string
  const area = formData.get('area') as string
  const postalCode = formData.get('postalCode') as string
  const deliveryInstructions = formData.get('deliveryInstructions') as string
  const isPrimary = formData.get('isPrimary') === 'true'

  // If setting as primary, unset other primary addresses
  if (isPrimary) {
    await supabase
      .from('addresses')
      .update({ is_primary: false })
      .eq('user_id', user.id)
  }

  const { error } = await supabase
    .from('addresses')
    .update({
      label,
      address_line1: addressLine1,
      address_line2: addressLine2 || null,
      area,
      postal_code: postalCode || null,
      delivery_instructions: deliveryInstructions || null,
      is_primary: isPrimary,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/addresses')
  return { success: true }
}

export async function deleteAddress(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/addresses')
  return { success: true }
}

export async function cancelOrder(orderId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check if order belongs to user and is cancellable
  const { data: order } = await supabase
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .eq('user_id', user.id)
    .single()

  if (!order) {
    return { error: 'Order not found' }
  }

  if (order.status !== 'pending') {
    return { error: 'Order cannot be cancelled at this stage' }
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  // Add tracking entry
  await supabase.from('order_tracking').insert({
    order_id: orderId,
    status: 'cancelled',
    notes: 'Order cancelled by customer',
  })

  revalidatePath('/dashboard/orders')
  return { success: true }
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function submitContactForm(formData: FormData) {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const subject = formData.get('subject') as string
  const message = formData.get('message') as string

  // In a real app, you would send this to an email service or store in database
  console.log('Contact form submission:', { name, email, phone, subject, message })

  // Simulate async operation
  await new Promise(resolve => setTimeout(resolve, 1000))

  return { success: true }
}

// Admin actions
export async function updateOrderStatus(orderId: string, status: string, notes?: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  if (error) {
    return { error: error.message }
  }

  // Add tracking entry
  await supabase.from('order_tracking').insert({
    order_id: orderId,
    status,
    notes: notes || `Status updated to ${status}`,
    updated_by: user.id,
  })

  // Get order user ID for notification
  const { data: order } = await supabase
    .from('orders')
    .select('user_id, order_number')
    .eq('id', orderId)
    .single()

  if (order) {
    await supabase.from('notifications').insert({
      user_id: order.user_id,
      title: 'Order Status Updated',
      message: `Your order #${order.order_number || orderId.slice(0, 8)} is now ${status.replace('_', ' ')}.`,
      type: 'order',
    })
  }

  revalidatePath('/admin/orders')
  return { success: true }
}

export async function createService(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const priceType = formData.get('priceType') as string
  const pricePerUnit = parseFloat(formData.get('pricePerUnit') as string)
  const turnaroundHours = parseInt(formData.get('turnaroundHours') as string)
  const isActive = formData.get('isActive') === 'true'

  const { error } = await supabase.from('services').insert({
    name,
    description,
    category,
    price_type: priceType,
    price_per_unit: pricePerUnit,
    turnaround_hours: turnaroundHours,
    is_active: isActive,
  })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/services')
  return { success: true }
}

export async function updateService(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const name = formData.get('name') as string
  const description = formData.get('description') as string
  const category = formData.get('category') as string
  const priceType = formData.get('priceType') as string
  const pricePerUnit = parseFloat(formData.get('pricePerUnit') as string)
  const turnaroundHours = parseInt(formData.get('turnaroundHours') as string)
  const isActive = formData.get('isActive') === 'true'

  const { error } = await supabase
    .from('services')
    .update({
      name,
      description,
      category,
      price_type: priceType,
      price_per_unit: pricePerUnit,
      turnaround_hours: turnaroundHours,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/services')
  return { success: true }
}

export async function deleteService(id: string) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'Not authenticated' }
  }

  // Check admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/services')
  return { success: true }
}
