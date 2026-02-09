import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Use a direct Supabase client with service_role key to bypass RLS for guest inserts
// Falls back to anon key if service_role is not configured
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createSupabaseClient(url, key)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const body = await request.json()

    const {
      guest_name,
      guest_email,
      guest_phone,
      pickup_address,
      delivery_address,
      items,
      preferred_pickup_time,
      preferred_delivery_time,
      subtotal,
      delivery_fee,
      discount_amount,
      total_amount,
      promo_code,
      special_instructions,
      payment_method,
    } = body

    // Validate required fields
    if (!guest_name || !guest_phone || !pickup_address || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: name, phone, address, and services are required' },
        { status: 400 }
      )
    }

    // Validate phone format (Pakistani)
    const phoneRegex = /^(\+92|0)?3[0-9]{9}$/
    const cleanPhone = guest_phone.replace(/\s/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      return NextResponse.json(
        { error: 'Please enter a valid Pakistani phone number (e.g. 03001234567)' },
        { status: 400 }
      )
    }

    // Generate order number
    const orderNumber = `WK${Date.now().toString(36).toUpperCase()}`

    // Store the guest order in the guest_orders table
    // Note: guest_orders table is created via migration-guest-orders.sql
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: guestOrder, error: orderError } = await (supabase as any)
      .from('guest_orders')
      .insert({
        order_number: orderNumber,
        guest_name,
        guest_email: guest_email || null,
        guest_phone: cleanPhone.startsWith('+92') ? cleanPhone : cleanPhone.startsWith('0') ? `+92${cleanPhone.slice(1)}` : `+92${cleanPhone}`,
        pickup_address: pickup_address,
        delivery_address: delivery_address || pickup_address,
        items: items,
        preferred_pickup_time,
        preferred_delivery_time,
        subtotal: subtotal || 0,
        delivery_fee: delivery_fee || 0,
        discount_amount: discount_amount || 0,
        total_amount: total_amount || 0,
        promo_code: promo_code || null,
        special_instructions: special_instructions || null,
        payment_method: payment_method || 'cash',
        payment_status: payment_method === 'cash' ? 'pending' : 'pending',
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      console.error('Guest order creation error:', JSON.stringify(orderError, null, 2))
      return NextResponse.json(
        { error: `Failed to create order: ${orderError.message || 'Unknown error'}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      order_id: guestOrder.id,
      order_number: orderNumber,
      message: `Order #${orderNumber} placed successfully! We will contact you at ${guest_phone} to confirm.`,
    })
  } catch (error) {
    console.error('Guest order API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
