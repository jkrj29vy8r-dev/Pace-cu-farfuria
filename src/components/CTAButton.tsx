'use client'
import { useState } from 'react'

export function CTAButton({ label = 'Obțin accesul — 47 RON' }: { label?: string }) {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { url } = await res.json()
      window.location.href = url
    } catch (err) {
      console.error('Checkout error:', err)
      alert('A apărut o eroare. Te rugăm să încerci din nou.')
      setLoading(false)
    }
  }

  return (
    <button onClick={handleClick} disabled={loading} className="cta-btn">
      {loading ? 'Se procesează…' : label}
    </button>
  )
}
