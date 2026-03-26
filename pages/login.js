import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'

export default function Login() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    if (res.ok) {
      const data = await res.json()
      localStorage.setItem('vp_token', data.token)
      document.cookie = `auth=${data.token}; path=/; max-age=86400`
      router.push('/')
    } else {
      setError('Nesprávne heslo. Skúste znova.')
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Prihlásenie — Vozový park</title></Head>
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f1117', fontFamily: "'DM Sans', sans-serif" }}>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
        <div style={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 16, padding: '48px 40px', width: '100%', maxWidth: 400, textAlign: 'center' }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 24 }}>🚗</div>
          <h1 style={{ color: '#f1f0ec', fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Vozový park</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 32 }}>Zadajte heslo pre prístup k dashboardu</p>
          <form onSubmit={handleSubmit}>
            <input type="password" placeholder="Heslo" value={password} onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', background: '#0f1117', border: `1px solid ${error ? '#ef4444' : '#2a2d3a'}`, borderRadius: 10, color: '#f1f0ec', fontSize: 15, fontFamily: 'inherit', outline: 'none', marginBottom: error ? 8 : 16, boxSizing: 'border-box' }} />
            {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 16, textAlign: 'left' }}>{error}</p>}
            <button type="submit" disabled={loading || !password}
              style={{ width: '100%', padding: '12px', background: '#2563eb', border: 'none', borderRadius: 10, color: '#fff', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', opacity: !password ? 0.5 : 1 }}>
              {loading ? 'Prihlasujem...' : 'Prihlásiť sa'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
