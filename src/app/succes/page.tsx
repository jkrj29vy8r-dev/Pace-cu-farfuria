import { redirect } from 'next/navigation'
import { stripe } from '@/lib/stripe'
export default async function SuccesPage({ searchParams }: { searchParams: { session_id?: string } }) {
  const sessionId = searchParams.session_id
  if (!sessionId) redirect('/')
  let session
  try { session = await stripe.checkout.sessions.retrieve(sessionId) } catch { redirect('/') }
  if (session.payment_status !== 'paid') redirect('/')
  const email = session.customer_details?.email
  return (<main style={{minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem'}}><div style={{maxWidth:'520px',width:'100%',textAlign:'center'}}><div style={{width:'48px',height:'2px',background:'var(--acc)',margin:'0 auto 2.5rem'}} /><h1 className="font-serif" style={{fontSize:'clamp(1.8rem,4vw,2.5rem)',fontWeight:400,color:'var(--fg)',marginBottom:'1.5rem',lineHeight:1.2}}>Bun venit.</h1><p className="font-serif" style={{fontSize:'1.05rem',lineHeight:1.82,color:'var(--fg2)',marginBottom:'1.25rem'}}>Plata a fost confirmată. Un email cu link-ul de descărcare a fost trimis la <strong style={{color:'var(--fg)'}}>{email}</strong>.</p><p style={{fontSize:'.82rem',color:'var(--fg2)',lineHeight:1.7}}>Verifică și folderul Spam dacă nu îl găsești în Inbox.<br />Link valabil 30 de zile, maxim 5 descărcări.</p><div style={{width:'48px',height:'2px',background:'var(--acc)',margin:'2.5rem auto 0'}} /></div></main>)
}
