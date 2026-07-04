import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse('Token lipsă.', { status: 400 })
  }

  const { data: dl, error } = await supabase
    .from('download_tokens')
    .select('id, download_count, max_downloads, expires_at')
    .eq('token', token)
    .single()

  if (error || !dl) {
    return new NextResponse('Token invalid sau expirat.', { status: 404 })
  }

  if (dl.download_count >= dl.max_downloads) {
    return new NextResponse('Limita de descărcări a fost atinsă.', { status: 403 })
  }

  if (new Date(dl.expires_at) < new Date()) {
    return new NextResponse('Link-ul a expirat.', { status: 403 })
  }

  // Increment before serving — prevents race-condition over-downloads
  await supabase
    .from('download_tokens')
    .update({ download_count: dl.download_count + 1 })
    .eq('id', dl.id)

  // Generate 5-minute signed URL from Supabase Storage (bucket: 'ebooks')
  const { data: signed, error: storageError } = await supabase.storage
    .from('ebooks')
    .createSignedUrl('pace-cu-farfuria.pdf', 300)

  if (storageError || !signed?.signedUrl) {
    console.error('Storage error:', storageError)
    return new NextResponse('Fișierul nu a fost găsit.', { status: 404 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
