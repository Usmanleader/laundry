import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: order, error } = await supabase
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

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user owns the order or is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (order.user_id !== user.id && profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch tracking history
    const { data: tracking } = await supabase
      .from('order_tracking')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({ order, tracking })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { status, payment_status, assigned_driver_id, notes } = body

    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (status) updates.status = status
    if (payment_status) updates.payment_status = payment_status
    if (assigned_driver_id) updates.assigned_driver_id = assigned_driver_id

    const { data: order, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add tracking entry if status changed
    if (status) {
      await supabase.from('order_tracking').insert({
        order_id: id,
        status,
        notes: notes || `Status updated to ${status}`,
        updated_by: user.id,
      })

      // Notify customer
      await supabase.from('notifications').insert({
        user_id: order.user_id,
        title: 'Order Status Updated',
        message: `Your order #${order.order_number || id.slice(0, 8)} is now ${status.replace('_', ' ')}.`,
        type: 'order',
      })
    }

    return NextResponse.json({ order })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get order
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single()

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user owns the order
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow cancellation of pending orders
    if (order.status !== 'pending') {
      return NextResponse.json({ error: 'Cannot cancel order in current status' }, { status: 400 })
    }

    // Update order status to cancelled
    const { error } = await supabase
      .from('orders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add tracking entry
    await supabase.from('order_tracking').insert({
      order_id: id,
      status: 'cancelled',
      notes: 'Order cancelled by customer',
    })

    return NextResponse.json({ message: 'Order cancelled successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
