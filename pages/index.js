import Head from 'next/head'
import { useState, useEffect } from 'react'


function authFetch(url, options = {}) {
  const token = typeof window !== 'undefined' ? (localStorage.getItem('vp_token') || '') : ''
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
      ...(options.headers || {}),
    },
  })
}

const TABS = ['Dashboard', 'Vozidlá', 'Tankovania', 'Servisy']

const STAV_OPTIONS = ['Aktívne', 'V servise', 'Vyradené']
const PALIVO_OPTIONS = ['Diesel', 'Benzín', 'Elektro', 'Hybrid', 'CNG']
const SERVIS_TYPES = ['Výmena oleja', 'Pneumatiky', 'STK + EK', 'Oprava', 'Údržba', 'Iné']

const s = {
  page: { minHeight: '100vh', background: '#0f1117', color: '#f1f0ec', fontFamily: "'DM Sans', sans-serif" },
  header: { borderBottom: '1px solid #1e2130', padding: '0 32px', position: 'sticky', top: 0, background: '#0f1117', zIndex: 100 },
  headerInner: { maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 60 },
  logo: { display: 'flex', alignItems: 'center', gap: 10 },
  logoIcon: { width: 34, height: 34, background: '#2563eb', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 17 },
  nav: { display: 'flex', gap: 4 },
  navBtn: (active) => ({ background: active ? '#1e2130' : 'transparent', border: 'none', color: active ? '#f1f0ec' : '#6b7280', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }),
  main: { maxWidth: 1200, margin: '0 auto', padding: '28px 32px' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 },
  kpi: { background: '#1a1d27', border: '1px solid #1e2130', borderRadius: 12, padding: '16px 20px' },
  kpiLabel: { fontSize: 12, color: '#6b7280', marginBottom: 6 },
  kpiVal: (color) => ({ fontSize: 26, fontWeight: 600, color: color || '#f1f0ec', fontFamily: 'DM Mono, monospace' }),
  card: { background: '#1a1d27', border: '1px solid #1e2130', borderRadius: 12, padding: '20px 24px', marginBottom: 20 },
  cardTitle: { fontSize: 15, fontWeight: 600, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th: { padding: '8px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 500, borderBottom: '1px solid #1e2130', whiteSpace: 'nowrap' },
  td: { padding: '10px 12px', borderBottom: '1px solid #12141c' },
  btn: (color) => ({ background: color || '#2563eb', border: 'none', color: '#fff', padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', fontWeight: 500 }),
  btnSm: (color) => ({ background: 'transparent', border: `1px solid ${color || '#2563eb'}`, color: color || '#2563eb', padding: '4px 10px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontFamily: 'inherit' }),
  badge: (stav) => {
    const colors = { 'Aktívne': ['#052e16', '#4ade80', '#166534'], 'V servise': ['#0c1a4d', '#60a5fa', '#1e40af'], 'Vyradené': ['#1f1f1f', '#9ca3af', '#374151'] }
    const [bg, text, border] = colors[stav] || colors['Vyradené']
    return { background: bg, color: text, border: `1px solid ${border}`, fontSize: 11, fontWeight: 500, padding: '3px 10px', borderRadius: 20, fontFamily: 'DM Mono, monospace', display: 'inline-block' }
  },
  modal: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200 },
  modalBox: { background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 16, padding: '28px 32px', width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto' },
  input: { width: '100%', padding: '9px 12px', background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: 8, color: '#f1f0ec', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' },
  select: { width: '100%', padding: '9px 12px', background: '#0f1117', border: '1px solid #2a2d3a', borderRadius: 8, color: '#f1f0ec', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box' },
  formGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 },
  formLabel: { fontSize: 12, color: '#6b7280', marginBottom: 4, display: 'block' },
  ecv: { color: '#3b82f6', fontFamily: 'DM Mono, monospace', fontWeight: 500 },
  mono: { fontFamily: 'DM Mono, monospace' },
}

function Modal({ title, onClose, children }) {
  return (
    <div style={s.modal} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={s.modalBox}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label style={s.formLabel}>{label}</label>
      {children}
    </div>
  )
}

export default function Dashboard() {
  const [tab, setTab] = useState('Dashboard')
  const [vehicles, setVehicles] = useState([])
  const [fuel, setFuel] = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [chartEcv, setChartEcv] = useState('')

  async function load() {
    setLoading(true)
    try {
      const [v, f, sv] = await Promise.all([
        authFetch('/api/vehicles').then(r => r.json()),
        authFetch('/api/fuel').then(r => r.json()),
        authFetch('/api/service').then(r => r.json()),
      ])
      setVehicles(Array.isArray(v) ? v : [])
      setFuel(Array.isArray(f) ? f : [])
      setServices(Array.isArray(sv) ? sv : [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    const token = localStorage.getItem('vp_token')
    if (!token) { window.location.href = '/login'; return }
    load()
  }, [])

  function openModal(type, data = {}) {
    // Konvertuj dátum z dd.mm.rrrr na rrrr-mm-dd pre date input
    if (data.Datum && data.Datum.includes('.')) {
      const [d, m, y] = data.Datum.split('.')
      data.Datum = `${y}-${m}-${d}`
    }
    setModal(type)
    setForm(data)
  }

  function closeModal() { setModal(null); setForm({}) }

  async function saveVehicle() {
    setSaving(true)
    const method = form._row ? 'PUT' : 'POST'
    await authFetch('/api/vehicles', { method, body: JSON.stringify(form) })
    await load()
    setSaving(false)
    closeModal()
  }

  async function saveFuel() {
    setSaving(true)
    const selV = vehicles.find(v => v.ECV === form.ECV)
    const payload = { ...form, JeMth: selV?.Motohodiny === 'Áno' ? 'Áno' : 'Nie' }
    const method = form._row ? 'PUT' : 'POST'
    await authFetch('/api/fuel', { method, body: JSON.stringify(payload) })
    await load()
    setSaving(false)
    closeModal()
  }

  async function saveService() {
    setSaving(true)
    const method = form._row ? 'PUT' : 'POST'
    await authFetch('/api/service', { method, body: JSON.stringify(form) })
    await load()
    setSaving(false)
    closeModal()
  }

  async function deleteItem(endpoint, row) {
    if (!row) { alert('Chyba: chýba číslo riadku'); return }
    if (!confirm('Naozaj chcete vymazať tento záznam?')) return
    try {
      const resp = await authFetch(`/api/${endpoint}?_row=${row}`, {
        method: 'DELETE',
      })
      const data = await resp.json()
      if (!resp.ok) { alert('Chyba pri mazaní: ' + (data.error || resp.status)); return }
    } catch (e) { alert('Chyba pri mazaní: ' + e.message); return }
    await load()
  }

  const today = new Date().toISOString().split('T')[0]
  
  function parseDateSk(dateStr) {
    if (!dateStr) return null
    const d = new Date(dateStr.split('.').reverse().join('-'))
    return isNaN(d) ? null : d
  }

  const stkWarn = vehicles.filter(v => {
    if (!v.STK) return false
    const d = parseDateSk(v.STK)
    if (!d) return false
    const diff = (d - new Date()) / 86400000
    return diff < 30
  })

  const poiWarn = vehicles.filter(v => {
    if (!v.Poistenie) return false
    const d = parseDateSk(v.Poistenie)
    if (!d) return false
    const diff = (d - new Date()) / 86400000
    return diff < 30
  })

  const totalFuelCost = fuel.reduce((s, f) => s + parseFloat(f.CenaCelkom || 0), 0)
  const totalServiceCost = services.reduce((s, sv) => s + parseFloat(sv.Naklady || 0), 0)
  const avgConsumption = fuel.length ? (fuel.reduce((s, f) => s + parseFloat(f.Spotreba || 0), 0) / fuel.filter(f => f.Spotreba).length).toFixed(2) : 0

  // Súhrn nákladov podľa vozidla
  const costByVehicle = {}
  vehicles.forEach(v => {
    if (!v.ECV) return
    costByVehicle[v.ECV] = { ecv: v.ECV, znacka: v.Znacka, model: v.Model, fuel: 0, service: 0 }
  })
  fuel.forEach(f => {
    if (costByVehicle[f.ECV]) costByVehicle[f.ECV].fuel += parseFloat(f.CenaCelkom || 0)
  })
  services.forEach(sv => {
    if (costByVehicle[sv.ECV]) costByVehicle[sv.ECV].service += parseFloat(sv.Naklady || 0)
  })
  const costSummary = Object.values(costByVehicle).filter(c => c.fuel > 0 || c.service > 0).sort((a, b) => (b.fuel + b.service) - (a.fuel + a.service))

  // Filtered data for search
  const q = search.toLowerCase()
  const filteredVehicles = vehicles.filter(v => !q || [v.ECV, v.Znacka, v.Model, v.Zamestnanec, v.Oddelenie, v.Stav].join(' ').toLowerCase().includes(q))
  const filteredFuel = fuel.filter(f => !q || [f.Datum, f.ECV, f.Vodic].join(' ').toLowerCase().includes(q))
  const filteredServices = services.filter(sv => !q || [sv.Datum, sv.ECV, sv.Typ, sv.Firma, sv.Popis].join(' ').toLowerCase().includes(q))

  // Monthly costs for chart (filtered by chartEcv)
  const monthlyData = {}
  const chartFuel = chartEcv ? fuel.filter(f => f.ECV === chartEcv) : fuel
  const chartServices = chartEcv ? services.filter(sv => sv.ECV === chartEcv) : services
  chartFuel.forEach(f => {
    const d = f.Datum || ''
    let key = ''
    if (d.includes('.')) { const p = d.split('.'); key = `${p[2]}-${p[1]}` }
    else if (d.includes('-')) { key = d.substring(0, 7) }
    if (!key) return
    if (!monthlyData[key]) monthlyData[key] = { month: key, fuel: 0, service: 0 }
    monthlyData[key].fuel += parseFloat(f.CenaCelkom || 0)
  })
  chartServices.forEach(sv => {
    const d = sv.Datum || ''
    let key = ''
    if (d.includes('.')) { const p = d.split('.'); key = `${p[2]}-${p[1]}` }
    else if (d.includes('-')) { key = d.substring(0, 7) }
    if (!key) return
    if (!monthlyData[key]) monthlyData[key] = { month: key, fuel: 0, service: 0 }
    monthlyData[key].service += parseFloat(sv.Naklady || 0)
  })
  const monthlyChart = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month)).slice(-12)
  const maxMonthlyCost = Math.max(...monthlyChart.map(m => m.fuel + m.service), 1)

  const ecvOptions = vehicles.map(v => v.ECV).filter(Boolean)

  return (
    <>
      <Head>
        <title>Vozový park</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </Head>
      <div style={s.page}>
        <div style={s.header}>
          <div style={s.headerInner}>
            <div style={s.logo}>
              <div style={s.logoIcon}>🚗</div>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Vozový park</span>
            </div>
            <div style={s.nav}>
              {TABS.map(t => <button key={t} style={s.navBtn(tab === t)} onClick={() => setTab(t)}>{t}</button>)}
            </div>
            <button onClick={() => { localStorage.removeItem('vp_token'); location.href = '/login'; }} style={{ background: 'transparent', border: '1px solid #2a2d3a', color: '#9ca3af', padding: '6px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>Odhlásiť</button>
          </div>
        </div>

        <div style={s.main}>
          {loading && <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>Načítavam dáta...</div>}

          {!loading && tab !== 'Dashboard' && (
            <div style={{ marginBottom: 16 }}>
              <input
                style={{ ...s.input, maxWidth: 320 }}
                placeholder="🔍 Hľadať (EČV, vodič, firma...)"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          )}

          {!loading && tab === 'Dashboard' && (
            <>
              <div style={s.kpiGrid}>
                <div style={s.kpi}><div style={s.kpiLabel}>Vozidlá celkom</div><div style={s.kpiVal()}>{vehicles.length}</div></div>
                <div style={s.kpi}><div style={s.kpiLabel}>Aktívne</div><div style={s.kpiVal('#3b82f6')}>{vehicles.filter(v => v.Stav === 'Aktívne').length}</div></div>
                <div style={s.kpi}><div style={s.kpiLabel}>V servise</div><div style={s.kpiVal('#f59e0b')}>{vehicles.filter(v => v.Stav === 'V servise').length}</div></div>
                <div style={s.kpi}><div style={s.kpiLabel}>STK do 30 dní</div><div style={s.kpiVal('#ef4444')}>{stkWarn.length}</div></div>
                <div style={s.kpi}><div style={s.kpiLabel}>Náklady — palivo</div><div style={s.kpiVal()}>{totalFuelCost.toFixed(2)} €</div></div>
                <div style={s.kpi}><div style={s.kpiLabel}>Náklady — servis</div><div style={s.kpiVal()}>{totalServiceCost.toFixed(2)} €</div></div>
                <div style={s.kpi}><div style={s.kpiLabel}>Priem. spotreba</div><div style={s.kpiVal()}>{avgConsumption} l/100</div></div>
                <div style={s.kpi}><div style={s.kpiLabel}>Záznamy tankovania</div><div style={s.kpiVal()}>{fuel.length}</div></div>
              </div>

              {stkWarn.length > 0 && (
                <div style={{ ...s.card, border: '1px solid #7f1d1d', background: '#1a0f0f' }}>
                  <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: 10 }}>⚠ Upozornenia — STK</div>
                  {stkWarn.map((v, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#fca5a5', padding: '4px 0' }}>
                      <span style={s.ecv}>{v.ECV}</span> — {v.Znacka} {v.Model} — STK: {v.STK}
                    </div>
                  ))}
                </div>
              )}

              {poiWarn.length > 0 && (
                <div style={{ ...s.card, border: '1px solid #78350f', background: '#1a150a' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 600, marginBottom: 10 }}>⚠ Upozornenia — Poistenie</div>
                  {poiWarn.map((v, i) => (
                    <div key={i} style={{ fontSize: 13, color: '#fcd34d', padding: '4px 0' }}>
                      <span style={s.ecv}>{v.ECV}</span> — {v.Znacka} {v.Model} — Poistenie do: {v.Poistenie}
                    </div>
                  ))}
                </div>
              )}

              {costSummary.length > 0 && (
                <div style={s.card}>
                  <div style={s.cardTitle}>Náklady podľa vozidla</div>
                  <table style={s.table}>
                    <thead><tr>
                      <th style={s.th}>EČV</th><th style={s.th}>Vozidlo</th>
                      <th style={s.th}>Palivo €</th><th style={s.th}>Servis €</th><th style={s.th}>Celkom €</th>
                    </tr></thead>
                    <tbody>{costSummary.map((c, i) => (
                      <tr key={i}>
                        <td style={{ ...s.td, ...s.ecv }}>{c.ecv}</td>
                        <td style={s.td}>{c.znacka} {c.model}</td>
                        <td style={{ ...s.td, ...s.mono }}>{c.fuel.toFixed(2)} €</td>
                        <td style={{ ...s.td, ...s.mono }}>{c.service.toFixed(2)} €</td>
                        <td style={{ ...s.td, ...s.mono, fontWeight: 600 }}>{(c.fuel + c.service).toFixed(2)} €</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}

              {monthlyChart.length > 0 && (
                <div style={s.card}>
                  <div style={s.cardTitle}>
                    <span>Mesačné náklady</span>
                    <select style={{ ...s.select, width: 'auto', minWidth: 160 }} value={chartEcv} onChange={e => setChartEcv(e.target.value)}>
                      <option value="">Všetky vozidlá</option>
                      {ecvOptions.map(e => {
                        const v = vehicles.find(v => v.ECV === e)
                        return <option key={e} value={e}>{e} — {v?.Znacka} {v?.Model}</option>
                      })}
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 180, padding: '10px 0' }}>
                    {monthlyChart.map((m, i) => {
                      const fuelH = (m.fuel / maxMonthlyCost) * 150
                      const serviceH = (m.service / maxMonthlyCost) * 150
                      const label = m.month.split('-')[1] + '/' + m.month.split('-')[0].slice(2)
                      return (
                        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'DM Mono, monospace' }}>{(m.fuel + m.service).toFixed(0)}€</div>
                          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 40 }}>
                            <div style={{ height: serviceH, background: '#f59e0b', borderRadius: '4px 4px 0 0', minHeight: m.service > 0 ? 2 : 0 }} title={`Servis: ${m.service.toFixed(2)} €`}></div>
                            <div style={{ height: fuelH, background: '#3b82f6', borderRadius: serviceH > 0 ? '0' : '4px 4px 0 0', borderBottomLeftRadius: 4, borderBottomRightRadius: 4, minHeight: m.fuel > 0 ? 2 : 0 }} title={`Palivo: ${m.fuel.toFixed(2)} €`}></div>
                          </div>
                          <div style={{ fontSize: 10, color: '#6b7280', fontFamily: 'DM Mono, monospace' }}>{label}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginTop: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ca3af' }}>
                      <div style={{ width: 10, height: 10, background: '#3b82f6', borderRadius: 2 }}></div> Palivo
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#9ca3af' }}>
                      <div style={{ width: 10, height: 10, background: '#f59e0b', borderRadius: 2 }}></div> Servis
                    </div>
                  </div>
                </div>
              )}

              <div style={s.card}>
                <div style={s.cardTitle}>Posledné tankovania</div>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>Dátum</th><th style={s.th}>EČV</th><th style={s.th}>Vodič</th><th style={s.th}>Litrov</th><th style={s.th}>Cena €</th><th style={s.th}>Spotreba</th></tr></thead>
                  <tbody>{fuel.slice(-5).reverse().map((f, i) => {
                    const fV = vehicles.find(v => v.ECV === f.ECV)
                    const spotUnit = fV?.Motohodiny === 'Áno' ? 'l/mth' : 'l/100'
                    return (
                    <tr key={i}>
                      <td style={{ ...s.td, ...s.mono, fontSize: 12, color: '#9ca3af' }}>{f.Datum}</td>
                      <td style={{ ...s.td, ...s.ecv }}>{f.ECV}</td>
                      <td style={s.td}>{f.Vodic}</td>
                      <td style={{ ...s.td, ...s.mono }}>{f.Litrov} l</td>
                      <td style={{ ...s.td, ...s.mono }}>{parseFloat(f.CenaCelkom || 0).toFixed(2)} €</td>
                      <td style={{ ...s.td, ...s.mono }}>{f.Spotreba} {spotUnit}</td>
                    </tr>
                    )
                  })}</tbody>
                </table>
              </div>

              <div style={s.card}>
                <div style={s.cardTitle}>Posledné servisy</div>
                <table style={s.table}>
                  <thead><tr><th style={s.th}>Dátum</th><th style={s.th}>EČV</th><th style={s.th}>Typ</th><th style={s.th}>Firma</th><th style={s.th}>Náklady</th></tr></thead>
                  <tbody>{services.slice(-5).reverse().map((sv, i) => (
                    <tr key={i}>
                      <td style={{ ...s.td, ...s.mono, fontSize: 12, color: '#9ca3af' }}>{sv.Datum}</td>
                      <td style={{ ...s.td, ...s.ecv }}>{sv.ECV}</td>
                      <td style={s.td}>{sv.Typ}</td>
                      <td style={s.td}>{sv.Firma}</td>
                      <td style={{ ...s.td, ...s.mono }}>{parseFloat(sv.Naklady || 0).toFixed(2)} €</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </>
          )}

          {!loading && tab === 'Vozidlá' && (
            <div style={s.card}>
              <div style={s.cardTitle}>
                Register vozidiel
                <button style={s.btn()} onClick={() => openModal('vehicle', { Stav: 'Aktívne', Palivo: 'Diesel' })}>+ Pridať vozidlo</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead><tr>
                    <th style={s.th}>EČV</th><th style={s.th}>Značka</th><th style={s.th}>Model</th><th style={s.th}>Rok</th>
                    <th style={s.th}>Palivo</th><th style={s.th}>Zamestnanec</th><th style={s.th}>Oddelenie</th>
                    <th style={s.th}>Stav</th><th style={s.th}>STK</th><th style={s.th}>Najazdené</th><th style={s.th}>Mth</th><th style={s.th}></th>
                  </tr></thead>
                  <tbody>{filteredVehicles.map((v, i) => {
                    const rowBg = v.Stav === 'V servise' ? 'rgba(59,130,246,0.06)' : v.Stav === 'Vyradené' ? 'rgba(107,114,128,0.08)' : 'transparent'
                    return (
                    <tr key={i} style={{ background: rowBg }}>
                      <td style={{ ...s.td, ...s.ecv }}>{v.ECV}</td>
                      <td style={s.td}>{v.Znacka}</td>
                      <td style={s.td}>{v.Model}</td>
                      <td style={{ ...s.td, ...s.mono }}>{v.Rok}</td>
                      <td style={s.td}>{v.Palivo}</td>
                      <td style={s.td}>{v.Zamestnanec}</td>
                      <td style={s.td}>{v.Oddelenie}</td>
                      <td style={s.td}><span style={s.badge(v.Stav)}>{v.Stav}</span></td>
                      <td style={{ ...s.td, ...s.mono, color: (() => { if (!v.STK) return '#9ca3af'; const d = new Date(v.STK.split('.').reverse().join('-')); return (d - new Date()) / 86400000 < 30 ? '#ef4444' : '#d1d5db' })() }}>{v.STK}</td>
                      <td style={{ ...s.td, ...s.mono }}>{v.Najazdene ? parseInt(v.Najazdene).toLocaleString('sk') + (v.Motohodiny === 'Áno' ? ' mth' : ' km') : ''}</td>
                      <td style={s.td}>{v.Motohodiny === 'Áno' ? <span style={{ ...s.badge('V servise'), fontSize: 10 }}>⏱ MTH</span> : ''}</td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={s.btnSm('#3b82f6')} onClick={() => openModal('vehicle', { ...v })}>Upraviť</button>
                          <button style={s.btnSm('#ef4444')} onClick={() => deleteItem('vehicles', v._row)}>Zmazať</button>
                        </div>
                      </td>
                    </tr>
                    )
                  })}</tbody>
                </table>
                {vehicles.length === 0 && <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>Žiadne vozidlá. Pridajte prvé vozidlo.</div>}
              </div>
            </div>
          )}

          {!loading && tab === 'Tankovania' && (
            <div style={s.card}>
              <div style={s.cardTitle}>
                Evidencia tankovania
                <button style={s.btn()} onClick={() => openModal('fuel', { Datum: today })}>+ Pridať tankovanie</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead><tr>
                    <th style={s.th}>Dátum</th><th style={s.th}>EČV</th><th style={s.th}>Vodič</th>
                    <th style={s.th}>Pred</th><th style={s.th}>Po</th><th style={s.th}>Litrov</th>
                    <th style={s.th}>Cena/l</th><th style={s.th}>Celkom €</th><th style={s.th}>Spotreba</th><th style={s.th}></th>
                  </tr></thead>
                  <tbody>{[...filteredFuel].reverse().map((f, i) => {
                    const fVehicle = vehicles.find(v => v.ECV === f.ECV)
                    const isMth = fVehicle?.Motohodiny === 'Áno'
                    const unit = isMth ? 'mth' : 'km'
                    const spotrebaUnit = isMth ? 'l/mth' : 'l/100'
                    return (
                    <tr key={i}>
                      <td style={{ ...s.td, ...s.mono, fontSize: 12, color: '#9ca3af' }}>{f.Datum}</td>
                      <td style={{ ...s.td, ...s.ecv }}>{f.ECV}</td>
                      <td style={s.td}>{f.Vodic}</td>
                      <td style={{ ...s.td, ...s.mono }}>{parseInt(f.KmPred || 0).toLocaleString('sk')} {unit}</td>
                      <td style={{ ...s.td, ...s.mono }}>{parseInt(f.KmPo || 0).toLocaleString('sk')} {unit}</td>
                      <td style={{ ...s.td, ...s.mono }}>{f.Litrov} l</td>
                      <td style={{ ...s.td, ...s.mono }}>{f.CenaLiter} €</td>
                      <td style={{ ...s.td, ...s.mono }}>{parseFloat(f.CenaCelkom || 0).toFixed(2)} €</td>
                      <td style={{ ...s.td, ...s.mono }}>{f.Spotreba} {spotrebaUnit}</td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={s.btnSm('#3b82f6')} onClick={() => openModal('fuel', { ...f })}>Upraviť</button>
                          <button style={s.btnSm('#ef4444')} onClick={() => deleteItem('fuel', f._row)}>Zmazať</button>
                        </div>
                      </td>
                    </tr>
                    )
                  })}</tbody>
                </table>
                {fuel.length === 0 && <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>Žiadne záznamy tankovania.</div>}
              </div>
            </div>
          )}

          {!loading && tab === 'Servisy' && (
            <div style={s.card}>
              <div style={s.cardTitle}>
                Evidencia servisov
                <button style={s.btn()} onClick={() => openModal('service', { Datum: today })}>+ Pridať servis</button>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={s.table}>
                  <thead><tr>
                    <th style={s.th}>Dátum</th><th style={s.th}>EČV</th><th style={s.th}>Typ</th>
                    <th style={s.th}>Popis</th><th style={s.th}>Firma</th><th style={s.th}>Km stav</th>
                    <th style={s.th}>Náklady</th><th style={s.th}>Faktúra</th><th style={s.th}></th>
                  </tr></thead>
                  <tbody>{[...filteredServices].reverse().map((sv, i) => (
                    <tr key={i}>
                      <td style={{ ...s.td, ...s.mono, fontSize: 12, color: '#9ca3af' }}>{sv.Datum}</td>
                      <td style={{ ...s.td, ...s.ecv }}>{sv.ECV}</td>
                      <td style={s.td}>{sv.Typ}</td>
                      <td style={{ ...s.td, color: '#9ca3af', fontSize: 12 }}>{sv.Popis}</td>
                      <td style={s.td}>{sv.Firma}</td>
                      <td style={{ ...s.td, ...s.mono }}>{parseInt(sv.KmStav || 0).toLocaleString('sk')}</td>
                      <td style={{ ...s.td, ...s.mono }}>{parseFloat(sv.Naklady || 0).toFixed(2)} €</td>
                      <td style={{ ...s.td, ...s.mono, fontSize: 12, color: '#9ca3af' }}>{sv.Faktura}</td>
                      <td style={s.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button style={s.btnSm('#3b82f6')} onClick={() => openModal('service', { ...sv })}>Upraviť</button>
                          <button style={s.btnSm('#ef4444')} onClick={() => deleteItem('service', sv._row)}>Zmazať</button>
                        </div>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
                {services.length === 0 && <div style={{ color: '#6b7280', textAlign: 'center', padding: 24 }}>Žiadne záznamy servisov.</div>}
              </div>
            </div>
          )}
        </div>

        {modal === 'vehicle' && (
          <Modal title={form._row ? 'Upraviť vozidlo' : 'Pridať vozidlo'} onClose={closeModal}>
            <div style={s.formGrid}>
              <Field label="EČV *"><input style={s.input} value={form.ECV || ''} onChange={e => setForm({ ...form, ECV: e.target.value })} placeholder="BA 123AB" /></Field>
              <Field label="Značka"><input style={s.input} value={form.Znacka || ''} onChange={e => setForm({ ...form, Znacka: e.target.value })} placeholder="Škoda" /></Field>
              <Field label="Model"><input style={s.input} value={form.Model || ''} onChange={e => setForm({ ...form, Model: e.target.value })} placeholder="Octavia" /></Field>
              <Field label="Rok výroby"><input style={s.input} value={form.Rok || ''} onChange={e => setForm({ ...form, Rok: e.target.value })} placeholder="2022" /></Field>
              <Field label="Palivo">
                <select style={s.select} value={form.Palivo || ''} onChange={e => setForm({ ...form, Palivo: e.target.value })}>
                  {PALIVO_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Stav">
                <select style={s.select} value={form.Stav || ''} onChange={e => setForm({ ...form, Stav: e.target.value })}>
                  {STAV_OPTIONS.map(p => <option key={p}>{p}</option>)}
                </select>
              </Field>
              <Field label="Zamestnanec"><input style={s.input} value={form.Zamestnanec || ''} onChange={e => setForm({ ...form, Zamestnanec: e.target.value })} placeholder="Ján Novák" /></Field>
              <Field label="Oddelenie"><input style={s.input} value={form.Oddelenie || ''} onChange={e => setForm({ ...form, Oddelenie: e.target.value })} placeholder="Obchod" /></Field>
              <Field label="STK (dd.mm.rrrr)"><input style={s.input} value={form.STK || ''} onChange={e => setForm({ ...form, STK: e.target.value })} placeholder="15.03.2026" /></Field>
              <Field label="Poistenie do"><input style={s.input} value={form.Poistenie || ''} onChange={e => setForm({ ...form, Poistenie: e.target.value })} placeholder="31.12.2026" /></Field>
              <Field label="Najazdené (km)"><input style={s.input} value={form.Najazdene || ''} onChange={e => setForm({ ...form, Najazdene: e.target.value })} placeholder="45000" /></Field>
              <Field label="Poznámka"><input style={s.input} value={form.Poznamka || ''} onChange={e => setForm({ ...form, Poznamka: e.target.value })} /></Field>
              <Field label="Evidovať motohodiny">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 0' }}>
                  <input type="checkbox" checked={form.Motohodiny === 'Áno'} onChange={e => setForm({ ...form, Motohodiny: e.target.checked ? 'Áno' : 'Nie' })} style={{ width: 18, height: 18, accentColor: '#2563eb', cursor: 'pointer' }} />
                  <span style={{ fontSize: 13, color: form.Motohodiny === 'Áno' ? '#f1f0ec' : '#6b7280' }}>{form.Motohodiny === 'Áno' ? 'Áno — motohodiny' : 'Nie — kilometre'}</span>
                </div>
              </Field>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button style={{ ...s.btn('#374151') }} onClick={closeModal}>Zrušiť</button>
              <button style={s.btn()} onClick={saveVehicle} disabled={saving}>{saving ? 'Ukladám...' : 'Uložiť'}</button>
            </div>
          </Modal>
        )}

        {modal === 'fuel' && (() => {
          const selVehicle = vehicles.find(v => v.ECV === form.ECV)
          const isMth = selVehicle?.Motohodiny === 'Áno'
          const unitLabel = isMth ? 'Mth' : 'Km'
          return (
          <Modal title={form._row ? 'Upraviť tankovanie' : 'Pridať tankovanie'} onClose={closeModal}>
            <div style={s.formGrid}>
              <Field label="Dátum"><input type="date" style={s.input} value={form.Datum || today} onChange={e => setForm({ ...form, Datum: e.target.value })} /></Field>
              <Field label="EČV">
                <select style={s.select} value={form.ECV || ''} onChange={e => setForm({ ...form, ECV: e.target.value })}>
                  <option value="">-- vybrať --</option>
                  {ecvOptions.map(e => <option key={e}>{e}</option>)}
                </select>
              </Field>
              <Field label="Vodič"><input style={s.input} value={form.Vodic || ''} onChange={e => setForm({ ...form, Vodic: e.target.value })} placeholder="Meno vodiča" /></Field>
              <Field label={`${unitLabel} pred tankovaním`}><input style={s.input} type="number" value={form.KmPred || ''} onChange={e => setForm({ ...form, KmPred: e.target.value })} /></Field>
              <Field label={`${unitLabel} po tankovaní`}><input style={s.input} type="number" value={form.KmPo || ''} onChange={e => setForm({ ...form, KmPo: e.target.value })} /></Field>
              <Field label="Natankované (l)"><input style={s.input} type="number" step="0.1" value={form.Litrov || ''} onChange={e => setForm({ ...form, Litrov: e.target.value })} /></Field>
              <Field label="Cena za liter (€)"><input style={s.input} type="number" step="0.001" value={form.CenaLiter || ''} onChange={e => setForm({ ...form, CenaLiter: e.target.value })} /></Field>
              <Field label="Poznámka"><input style={s.input} value={form.Poznamka || ''} onChange={e => setForm({ ...form, Poznamka: e.target.value })} /></Field>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button style={s.btn('#374151')} onClick={closeModal}>Zrušiť</button>
              <button style={s.btn()} onClick={saveFuel} disabled={saving}>{saving ? 'Ukladám...' : 'Uložiť'}</button>
            </div>
          </Modal>
          )
        })()}

        {modal === 'service' && (() => {
          const selVehicle = vehicles.find(v => v.ECV === form.ECV)
          const isMth = selVehicle?.Motohodiny === 'Áno'
          const unitLabel = isMth ? 'Mth' : 'Km'
          return (
          <Modal title={form._row ? 'Upraviť servis' : 'Pridať servis'} onClose={closeModal}>
            <div style={s.formGrid}>
              <Field label="Dátum"><input type="date" style={s.input} value={form.Datum || today} onChange={e => setForm({ ...form, Datum: e.target.value })} /></Field>
              <Field label="EČV">
                <select style={s.select} value={form.ECV || ''} onChange={e => setForm({ ...form, ECV: e.target.value })}>
                  <option value="">-- vybrať --</option>
                  {ecvOptions.map(e => <option key={e}>{e}</option>)}
                </select>
              </Field>
              <Field label="Model vozidla"><input style={s.input} value={form.Model || ''} onChange={e => setForm({ ...form, Model: e.target.value })} placeholder="Škoda Octavia" /></Field>
              <Field label="Typ zásahu">
                <select style={s.select} value={form.Typ || ''} onChange={e => setForm({ ...form, Typ: e.target.value })}>
                  <option value="">-- vybrať --</option>
                  {SERVIS_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>
              <Field label="Popis práce"><input style={s.input} value={form.Popis || ''} onChange={e => setForm({ ...form, Popis: e.target.value })} placeholder="Výmena oleja + filter" /></Field>
              <Field label={`Stav ${unitLabel.toLowerCase()}`}><input style={s.input} type="number" value={form.KmStav || ''} onChange={e => setForm({ ...form, KmStav: e.target.value })} /></Field>
              <Field label="Servisná firma"><input style={s.input} value={form.Firma || ''} onChange={e => setForm({ ...form, Firma: e.target.value })} /></Field>
              <Field label="Náklady (€)"><input style={s.input} type="number" step="0.01" value={form.Naklady || ''} onChange={e => setForm({ ...form, Naklady: e.target.value })} /></Field>
              <Field label="Faktúra č."><input style={s.input} value={form.Faktura || ''} onChange={e => setForm({ ...form, Faktura: e.target.value })} placeholder="F2026001" /></Field>
              <Field label={`Ďalší servis (${unitLabel.toLowerCase()})`}><input style={s.input} type="number" value={form.DalsiServisKm || ''} onChange={e => setForm({ ...form, DalsiServisKm: e.target.value })} /></Field>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <button style={s.btn('#374151')} onClick={closeModal}>Zrušiť</button>
              <button style={s.btn()} onClick={saveService} disabled={saving}>{saving ? 'Ukladám...' : 'Uložiť'}</button>
            </div>
          </Modal>
          )
        })()}
      </div>
    </>
  )
}
