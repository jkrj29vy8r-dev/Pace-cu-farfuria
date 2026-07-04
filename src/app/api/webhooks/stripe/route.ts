import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_details?.email

    if (!email) {
      return NextResponse.json({ error: 'No email on session' }, { status: 400 })
    }

    // Insert purchase — unique constraint on stripe_session_id handles duplicates
    const { data: purchase, error: purchaseError } = await supabase
      .from('purchases')
      .insert({
        email,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        amount_total: session.amount_total,
        currency: session.currency,
        status: 'completed',
      })
      .select()
      .single()

    if (purchaseError) {
      // Duplicate webhook — already processed
      if (purchaseError.code === '23505') {
        return NextResponse.json({ received: true })
      }
      console.error('Purchase insert error:', purchaseError)
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    // Generate download token
    const token = crypto.randomBytes(32).toString('hex')
    await supabase.from('download_tokens').insert({
      purchase_id: purchase.id,
      token,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })

    // Send welcome email
    const downloadUrl = `${process.env.NEXT_PUBLIC_URL}/api/download?token=${token}`
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'noreply@pacecufarfuria.ro',
      to: email,
      subject: 'E-book-ul tău — Pace cu Farfuria',
      html: buildWelcomeEmail(downloadUrl, email),
    })
  }

  return NextResponse.json({ received: true })
}

function buildWelcomeEmail(downloadUrl: string, email: string): string {
  return `<!doctype html>
<html lang="ro">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#FAF6EF;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:3rem 2rem;">
    <div style="height:2px;background:#8FA08A;margin-bottom:2.5rem;"></div>
    <h1 style="font-family:Georgia,serif;font-weight:400;font-size:2rem;color:#3E3830;margin:0 0 1.5rem;">Bun venit.</h1>
    <p style="font-family:Georgia,serif;font-size:1.05rem;line-height:1.8;color:#3E3830;margin:0 0 1rem;">
      Ai făcut primul pas.
    </p>
    <p style="font-family:system-ui,sans-serif;font-size:0.9rem;line-height:1.75;color:#7A6C60;margin:0 0 2rem;">
      Nu te grăbi să citești totul dintr-o dată. Începe cu Capitolul I și
      acordă-ți timp să simți ce rezonează cu tine. Nu există ritm corect sau greșit.
    </p>
    <a href="${downloadUrl}" style="display:inline-block;background:#C08460;color:#FFF5ED;padding:14px 28px;text-decoration:none;font-family:system-ui,sans-serif;font-size:0.75rem;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;">
      Descarcă E-book-ul
    </a>
    <p style="font-family:system-ui,sans-serif;font-size:0.75rem;color:#7A6C60;margin-top:1.5rem;line-height:1.6;">
      Link valid 30 de zile &middot; Maxim 5 descărcări<br>
      Trimis la: ${email}
    </p>
    <div style="height:1px;background:rgba(143,160,138,0.25);margin:2.5rem 0;"></div>
    <p style="font-family:system-ui,sans-serif;font-size:0.72rem;color:#7A6C60;line-height:1.6;">
      Dacă ai întrebări, răspunde direct la acest email. Nu suntem o platformă anonimă.
    </p>
  </div>
</body>
</html>`
}
