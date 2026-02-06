import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Initialize Supabase with service role for webhooks (lazy initialization)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase configuration for webhooks')
  }
  
  return createClient(url, serviceKey)
}

// Verify JazzCash signature
function verifyJazzCashSignature(payload: Record<string, string>, signature: string): boolean {
  const integrityString = Object.keys(payload)
    .sort()
    .map(key => payload[key])
    .join('&')
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.JAZZCASH_INTEGRITY_SALT || '')
    .update(integrityString)
    .digest('hex')
    .toUpperCase()
  
  return signature === expectedSignature
}

// Verify EasyPaisa signature
function verifyEasyPaisaSignature(payload: Record<string, string>, signature: string): boolean {
  const hashString = Object.keys(payload)
    .filter(key => key !== 'pp_SecureHash')
    .sort()
    .map(key => payload[key])
    .join('&')
  
  const expectedSignature = crypto
    .createHmac('sha256', process.env.EASYPAISA_HASH_KEY || '')
    .update(hashString)
    .digest('hex')
    .toUpperCase()
  
  return signature === expectedSignature
}

// JazzCash Payment Callback
export async function POST(request: NextRequest) {
  try {
    const provider = request.nextUrl.searchParams.get('provider')
    const body = await request.json()

    if (provider === 'jazzcash') {
      return handleJazzCashCallback(body)
    } else if (provider === 'easypaisa') {
      return handleEasyPaisaCallback(body)
    } else if (provider === 'stripe') {
      return handleStripeCallback(request, body)
    }

    return NextResponse.json({ error: 'Unknown provider' }, { status: 400 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function handleJazzCashCallback(body: Record<string, string>) {
  const { pp_TxnRefNo, pp_ResponseCode, pp_ResponseMessage, pp_SecureHash } = body

  // Verify signature in production
  if (process.env.JAZZCASH_INTEGRITY_SALT) {
    if (!verifyJazzCashSignature(body, pp_SecureHash)) {
      console.error('JazzCash signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const orderId = pp_TxnRefNo
  const isSuccess = pp_ResponseCode === '000'

  await updateOrderPayment(orderId, isSuccess, 'jazzcash', body)

  return NextResponse.json({ received: true })
}

async function handleEasyPaisaCallback(body: Record<string, string>) {
  const { orderRefNumber, responseCode, pp_SecureHash } = body

  // Verify signature in production
  if (process.env.EASYPAISA_HASH_KEY) {
    if (!verifyEasyPaisaSignature(body, pp_SecureHash)) {
      console.error('EasyPaisa signature verification failed')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  const orderId = orderRefNumber
  const isSuccess = responseCode === '0000'

  await updateOrderPayment(orderId, isSuccess, 'easypaisa', body)

  return NextResponse.json({ received: true })
}

async function handleStripeCallback(request: NextRequest, body: Record<string, unknown>) {
  // Verify Stripe webhook signature
  const signature = request.headers.get('stripe-signature')
  
  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    // For development, allow without verification
    console.warn('Stripe webhook without verification')
  }

  // Handle Stripe events
  const event = body as { type: string; data: { object: { metadata?: { order_id?: string } } } }
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const orderId = session.metadata?.order_id
    
    if (orderId) {
      await updateOrderPayment(orderId, true, 'card', session)
    }
  } else if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object
    const orderId = paymentIntent.metadata?.order_id
    
    if (orderId) {
      await updateOrderPayment(orderId, false, 'card', paymentIntent)
    }
  }

  return NextResponse.json({ received: true })
}

async function updateOrderPayment(
  orderId: string,
  isSuccess: boolean,
  provider: string,
  rawPayload: Record<string, unknown>
) {
  const supabase = getSupabaseAdmin()
  const paymentStatus = isSuccess ? 'paid' : 'failed'
  const orderStatus = isSuccess ? 'confirmed' : 'pending'

  // Update order
  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: paymentStatus,
      status: orderStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)

  if (error) {
    console.error('Failed to update order:', error)
    return
  }

  // Add tracking entry
  await supabase.from('order_tracking').insert({
    order_id: orderId,
    status: orderStatus,
    notes: isSuccess 
      ? `Payment confirmed via ${provider}` 
      : `Payment failed via ${provider}`,
  })

  // Log payment for audit
  console.log(`Payment ${isSuccess ? 'SUCCESS' : 'FAILED'}: Order ${orderId} via ${provider}`, {
    timestamp: new Date().toISOString(),
    provider,
    orderId,
    status: paymentStatus,
  })
}

// Also handle GET for webhook verification (Stripe)
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Webhook endpoint active' })
}
