import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  try {
    const key = process.env.STRIPE_SECRET_KEY!
    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_URL!

    const body = new URLSearchParams({
      'payment_method_types[0]': 'card',
      'line_items[0][price_data][currency]': 'ron',
      'line_items[0][price_data][product_data][name]': 'Pace cu Farfuria',
      'line_items[0][price_data][product_data][description]': 'E-book: Nutriție conștientă & Reset metabolic — 5 capitole, PDF.',
      'line_items[0][price_data][unit_amount]': '4700',
      'line_items[0][quantity]': '1',
      'mode': 'payment',
      'success_url': `${origin}/succes?session_id={CHECKOUT_SESSION_ID}`,
      'cancel_url': `${origin}/#oferta`,
      'metadata[product]': 'pace-cu-farfuria-ebook',
      'locale': 'ro',
    })

    const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await res.json() as { url?: string; error?: { message: string } }

    if (!res.ok) {
      console.error('Stripe error:', data.error?.message)
      return NextResponse.json({ error: data.error?.message ?? 'Stripe error' }, { status: 500 })
    }

    return NextResponse.json({ url: data.url })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Checkout error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
