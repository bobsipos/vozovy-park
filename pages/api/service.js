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
      const rows = await getSheet('Servisy!A1:K200')
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
      const { Datum, ECV, Model, Typ, Popis, KmStav, Firma, Naklady, Faktura, DalsiServisKm, Poznamka } = req.body
      await appendRow('Servisy', [formatDate(Datum), ECV, Model, Typ, Popis, KmStav, Firma, Naklady, Faktura || '', DalsiServisKm || '', Poznamka || ''])
      return res.json({ ok: true })
    }
    if (req.method === 'DELETE') {
      const row = parseInt(req.query._row || req.body?._row)
      if (!row || isNaN(row)) return res.status(400).json({ error: 'Missing or invalid _row' })
      await deleteRow('Servisy', row)
      return res.json({ ok: true })
    }
    res.status(405).end()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
