import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Payment gateway configuration
// For production, use environment variables
const EASYPAISA_MERCHANT_ID = process.env.EASYPAISA_MERCHANT_ID
const JAZZCASH_MERCHANT_ID = process.env.JAZZCASH_MERCHANT_ID
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY

interface PaymentRequest {
  order_id: string
  amount: number
  payment_method: 'cash' | 'card' | 'easypaisa' | 'jazzcash'
  customer_phone?: string
  customer_email?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: PaymentRequest = await request.json()
    const { order_id, amount, payment_method, customer_phone, customer_email } = body

    // Validate order exists and belongs to user
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Validate amount matches
    if (Math.abs(order.total_amount - amount) > 0.01) {
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    let paymentResult: {
      success: boolean
      transaction_id?: string
      payment_url?: string
      message?: string
    }

    switch (payment_method) {
      case 'cash':
        // Cash on delivery - mark as pending payment
        paymentResult = {
          success: true,
          transaction_id: `COD-${Date.now()}`,
          message: 'Cash on Delivery confirmed. Pay when your laundry is delivered.',
        }
        break

      case 'easypaisa':
        // EasyPaisa integration
        // In production, integrate with EasyPaisa API
        // https://easypay.easypaisa.com.pk/
        paymentResult = await processEasyPaisaPayment(order_id, amount, customer_phone || '')
        break

      case 'jazzcash':
        // JazzCash integration
        // In production, integrate with JazzCash API
        // https://sandbox.jazzcash.com.pk/
        paymentResult = await processJazzCashPayment(order_id, amount, customer_phone || '')
        break

      case 'card':
        // Card payment via Stripe
        // In production, use Stripe or local payment gateway
        paymentResult = await processCardPayment(order_id, amount, customer_email || user.email!)
        break

      default:
        return NextResponse.json({ error: 'Invalid payment method' }, { status: 400 })
    }

    if (paymentResult.success) {
      // Update order with payment info
      await supabase
        .from('orders')
        .update({
          payment_status: payment_method === 'cash' ? 'pending' : 'paid',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id)

      // Add tracking entry
      await supabase.from('order_tracking').insert({
        order_id,
        status: 'confirmed',
        notes: `Payment ${payment_method === 'cash' ? 'method confirmed (COD)' : 'received'}: ${paymentResult.transaction_id}`,
      })

      // Update order status to confirmed
      await supabase
        .from('orders')
        .update({ status: 'confirmed' })
        .eq('id', order_id)
    }

    return NextResponse.json(paymentResult)
  } catch (error) {
    console.error('Payment error:', error)
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
  }
}

// EasyPaisa Payment Processing
async function processEasyPaisaPayment(
  orderId: string,
  amount: number,
  phone: string
): Promise<{ success: boolean; transaction_id?: string; payment_url?: string; message?: string }> {
  // TODO: Implement actual EasyPaisa API integration
  // Documentation: https://easypay.easypaisa.com.pk/
  
  if (!EASYPAISA_MERCHANT_ID) {
    // For development, simulate success
    return {
      success: true,
      transaction_id: `EP-${Date.now()}`,
      message: 'EasyPaisa payment initiated. Please confirm on your phone.',
    }
  }

  // Production implementation would look like:
  // const response = await fetch('https://easypay.easypaisa.com.pk/easypay/Index.jsf', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     storeId: EASYPAISA_MERCHANT_ID,
  //     amount: amount,
  //     orderRefNum: orderId,
  //     mobileAccountNo: phone,
  //     // ... other required fields
  //   }),
  // })

  return {
    success: true,
    transaction_id: `EP-${Date.now()}`,
    message: 'Payment request sent to your EasyPaisa account.',
  }
}

// JazzCash Payment Processing
async function processJazzCashPayment(
  orderId: string,
  amount: number,
  phone: string
): Promise<{ success: boolean; transaction_id?: string; payment_url?: string; message?: string }> {
  // TODO: Implement actual JazzCash API integration
  // Documentation: https://sandbox.jazzcash.com.pk/

  if (!JAZZCASH_MERCHANT_ID) {
    // For development, simulate success
    return {
      success: true,
      transaction_id: `JC-${Date.now()}`,
      message: 'JazzCash payment initiated. Please confirm on your phone.',
    }
  }

  // Production implementation would look like:
  // const response = await fetch('https://sandbox.jazzcash.com.pk/ApplicationAPI/API/Payment/DoTransaction', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     pp_MerchantID: JAZZCASH_MERCHANT_ID,
  //     pp_Amount: amount * 100, // in paisa
  //     pp_TxnRefNo: orderId,
  //     pp_MobileNumber: phone,
  //     // ... other required fields with secure hash
  //   }),
  // })

  return {
    success: true,
    transaction_id: `JC-${Date.now()}`,
    message: 'Payment request sent to your JazzCash account.',
  }
}

// Card Payment Processing (Stripe)
async function processCardPayment(
  orderId: string,
  amount: number,
  email: string
): Promise<{ success: boolean; transaction_id?: string; payment_url?: string; message?: string }> {
  // TODO: Implement Stripe or local card payment gateway

  if (!STRIPE_SECRET_KEY) {
    // For development, simulate success
    return {
      success: true,
      transaction_id: `CARD-${Date.now()}`,
      message: 'Card payment processed successfully.',
    }
  }

  // Production implementation with Stripe:
  // const stripe = new Stripe(STRIPE_SECRET_KEY)
  // const session = await stripe.checkout.sessions.create({
  //   payment_method_types: ['card'],
  //   line_items: [{
  //     price_data: {
  //       currency: 'pkr',
  //       product_data: { name: `Washerman Order ${orderId}` },
  //       unit_amount: Math.round(amount * 100),
  //     },
  //     quantity: 1,
  //   }],
  //   mode: 'payment',
  //   success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}?payment=success`,
  //   cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders/${orderId}?payment=cancelled`,
  //   customer_email: email,
  //   metadata: { order_id: orderId },
  // })
  // return { success: true, payment_url: session.url }

  return {
    success: true,
    transaction_id: `CARD-${Date.now()}`,
    message: 'Card payment processed successfully.',
  }
}
