import { NextResponse } from 'next/server'
export async function GET() {
  const key = process.env.STRIPE_SECRET_KEY ?? ''
  return NextResponse.json({
    stripe_key_set: key.length > 0,
    stripe_key_prefix: key.slice(0, 12) || '(empty)',
    next_public_url: process.env.NEXT_PUBLIC_URL ?? '(not set)',
    supabase_url_set: !!(process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabase_key_set: !!(process.env.SUPABASE_SERVICE_ROLE_KEY),
  })
}
