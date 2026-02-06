import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    // Check if admin - if so, get all orders
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    let query = supabase
      .from('orders')
      .select(`
        *,
        pickup_address:pickup_address_id(label, area),
        delivery_address:delivery_address_id(label, area),
        order_items(*, service:service_id(name))
      `)
      .order('created_at', { ascending: false })

    // Non-admin users can only see their own orders
    if (profile?.role !== 'admin') {
      query = query.eq('user_id', user.id)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (limit) {
      query = query.limit(parseInt(limit))
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ orders: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      pickup_address_id,
      delivery_address_id,
      preferred_pickup_time,
      preferred_delivery_time,
      special_instructions,
      promo_code,
      items,
    } = body

    // Validate required fields
    if (!pickup_address_id || !delivery_address_id || !items?.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Calculate totals
    let subtotal = 0
    const orderItems = []

    for (const item of items) {
      const { data: service } = await supabase
        .from('services')
        .select('*')
        .eq('id', item.service_id)
        .single()

      if (!service) {
        return NextResponse.json({ error: `Service not found: ${item.service_id}` }, { status: 400 })
      }

      const unitPrice = service.price_per_unit ?? service.base_price
      let itemTotal = unitPrice * item.quantity
      if (service.price_type === 'per_kg' && item.weight_kg) {
        itemTotal = unitPrice * item.weight_kg * item.quantity
      }

      subtotal += itemTotal
      orderItems.push({
        service_id: item.service_id,
        quantity: item.quantity,
        weight_kg: item.weight_kg || null,
        unit_price: unitPrice,
        total_price: itemTotal,
      })
    }

    // Calculate delivery fee
    const deliveryFee = subtotal >= 1000 ? 0 : 150

    // Apply promo code if provided
    let discountAmount = 0
    if (promo_code) {
      const { data: promo } = await supabase
        .from('promotions')
        .select('*')
        .eq('code', promo_code.toUpperCase())
        .eq('is_active', true)
        .gte('valid_until', new Date().toISOString())
        .single()

      if (promo) {
        discountAmount = promo.discount_type === 'percentage'
          ? (subtotal * promo.discount_value) / 100
          : promo.discount_value
        discountAmount = Math.min(discountAmount, promo.max_discount_amount || discountAmount)
      }
    }

    const totalAmount = subtotal + deliveryFee - discountAmount

    // Generate order number
    const orderNumber = `WK${Date.now().toString(36).toUpperCase()}`

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        order_number: orderNumber,
        pickup_address_id,
        delivery_address_id,
        preferred_pickup_time,
        preferred_delivery_time,
        subtotal,
        delivery_fee: deliveryFee,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        promo_code: promo_code || null,
        special_instructions: special_instructions || null,
        status: 'pending',
        payment_method: 'cash',
        payment_status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 })
    }

    // Create order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId)

    if (itemsError) {
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }

    // Create initial tracking entry
    await supabase.from('order_tracking').insert({
      order_id: order.id,
      status: 'pending',
      notes: 'Order placed successfully',
    })

    // Create notification
    await supabase.from('notifications').insert({
      user_id: user.id,
      title: 'Order Placed',
      message: `Your order #${orderNumber} has been placed successfully.`,
      type: 'order',
    })

    return NextResponse.json({ order }, { status: 201 })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
