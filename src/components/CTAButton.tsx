'use client'
import { useState } from 'react'
export function CTAButton({ label = 'Obțin accesul — 47 RON' }: { label?: string }) {
  const [loading, setLoading] = useState(false)
  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`)
      window.location.href = data.url
    } catch (err) {
      console.error(err)
      alert(err instanceof Error ? err.message : 'Eroare necunoscută')
      setLoading(false)
    }
  }
  return <button onClick={handleClick} disabled={loading} className="cta-btn">{loading ? 'Se procesează…' : label}</button>
}
