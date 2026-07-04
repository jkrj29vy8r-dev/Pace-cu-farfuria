import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'
import crypto from 'crypto'

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder')

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET || '')
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const email = session.customer_details?.email
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({ user_email: email, stripe_payment_id: session.payment_intent as string })
      .select()
      .single()

    if (orderError || !order) {
      if ((orderError as { code?: string })?.code === '23505') return NextResponse.json({ received: true })
      return NextResponse.json({ error: 'DB error' }, { status: 500 })
    }

    const token = crypto.randomBytes(32).toString('hex')
    const downloadUrl = `${process.env.NEXT_PUBLIC_URL || ''}/api/download?token=${token}`

    await supabase.from('download_tokens').insert({
      order_id: order.id,
      token,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
    await supabase.from('orders').update({ download_url: downloadUrl }).eq('id', order.id)

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev',
      to: email,
      subject: 'E-book-ul tău — Pace cu Farfuria',
      html: `<!doctype html><html lang="ro"><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#FAF6EF;font-family:Georgia,serif;"><div style="max-width:560px;margin:0 auto;padding:3rem 2rem;"><div style="height:2px;background:#8FA08A;margin-bottom:2.5rem;"></div><h1 style="font-weight:400;font-size:2rem;color:#3E3830;margin:0 0 1.5rem;">Bun venit.</h1><p style="font-size:1.05rem;line-height:1.8;color:#3E3830;margin:0 0 1rem;">Ai făcut primul pas.</p><p style="font-family:system-ui;font-size:.9rem;line-height:1.75;color:#7A6C60;margin:0 0 2rem;">Nu te grăbi să citești totul dintr-o dată. Începe cu Capitolul I și acordă-ți timp să simți ce rezonează.</p><a href="${downloadUrl}" style="display:inline-block;background:#C08460;color:#FFF5ED;padding:14px 28px;text-decoration:none;font-family:system-ui;font-size:.75rem;font-weight:600;letter-spacing:.14em;text-transform:uppercase;">Descarcă E-book-ul</a><p style="font-family:system-ui;font-size:.75rem;color:#7A6C60;margin-top:1.5rem;">Link valid 30 de zile &middot; Maxim 5 descărcări</p></div></body></html>`,
    })
  }

  return NextResponse.json({ received: true })
}
