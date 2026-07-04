import type { Metadata } from 'next'
import './globals.css'
export const metadata: Metadata = {
  title: 'Pace cu Farfuria — Nutriție conștientă, fără dietă',
  description: 'Ghid practic de nutriție conștientă și reset metabolic. Fără restricții. Fără vinovăție.',
  openGraph: { title: 'Pace cu Farfuria', description: 'Fă pace cu mâncarea. Fă pace cu corpul tău.', type: 'website', locale: 'ro_RO' },
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ro"><body>{children}</body></html>
}
