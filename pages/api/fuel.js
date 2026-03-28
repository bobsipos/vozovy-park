import { getSheet, appendRow, deleteRow } from '../../lib/sheets'
import { checkAuth } from '../../lib/auth'

function formatDate(d) {
  if (!d) return ''
  if (d.includes('.')) return d
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y}`
}

export default async function handler(req, res) {
  if (!checkAuth(req, res)) return
  try {
    if (req.method === 'GET') {
      const rows = await getSheet('Tankovania!A1:J200')
      if (!rows.length) return res.json([])
      const [headers, ...data] = rows
      return res.json(data.map((row, i) => {
        const obj = {}
        headers.forEach((h, j) => obj[h.trim()] = row[j] || '')
        obj._row = i + 2
        return obj
      }))
    }
    if (req.method === 'POST') {
      const { Datum, ECV, Vodic, KmPred, KmPo, Litrov, CenaLiter, Poznamka, JeMth } = req.body
      const rozdiel = parseFloat(KmPo) - parseFloat(KmPred)
      const cena = (parseFloat(Litrov) * parseFloat(CenaLiter)).toFixed(2)
      let spotreba = '0'
      if (rozdiel > 0) {
        if (JeMth === 'Áno') {
          // l/mth = litre / rozdiel motohodín
          spotreba = (parseFloat(Litrov) / rozdiel).toFixed(2)
        } else {
          // l/100km = (litre / km) * 100
          spotreba = ((parseFloat(Litrov) / rozdiel) * 100).toFixed(2)
        }
      }
      await appendRow('Tankovania', [formatDate(Datum), ECV, Vodic, KmPred, KmPo, Litrov, CenaLiter, cena, spotreba, Poznamka || ''])
      return res.json({ ok: true })
    }
    if (req.method === 'DELETE') {
      const row = parseInt(req.query._row)
      if (!row || isNaN(row)) return res.status(400).json({ error: 'Missing or invalid _row' })
      await deleteRow('Tankovania', row)
      return res.json({ ok: true })
    }
    res.status(405).end()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
