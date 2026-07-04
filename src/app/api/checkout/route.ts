import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
export async function POST(req: NextRequest) {
  try {
    const origin = req.headers.get('origin') ?? process.env.NEXT_PUBLIC_URL!
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price_data: { currency: 'ron', product_data: { name: 'Pace cu Farfuria', description: 'E-book: Nutriție conștientă & Reset metabolic — 5 capitole, PDF.' }, unit_amount: 4700 }, quantity: 1 }],
      mode: 'payment',
      success_url: `${origin}/succes?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#oferta`,
      metadata: { product: 'pace-cu-farfuria-ebook' },
      locale: 'ro',
    })
    return NextResponse.json({ url: session.url })
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    console.error('Checkout error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
