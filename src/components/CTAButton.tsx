'use client'

const PAYMENT_URL = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || 'https://buy.stripe.com/test_4gMcMX7oP1qIeCU7sm63K00'

export function CTAButton({ label = 'Obțin accesul — 47 RON' }: { label?: string }) {
  return (
    <a href={PAYMENT_URL} className="cta-btn">
      {label}
    </a>
  )
}
