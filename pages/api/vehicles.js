import { getSheet, appendRow, deleteRow, updateRow } from '../../lib/sheets'
import { checkAuth } from '../../lib/auth'

export default async function handler(req, res) {
  if (!checkAuth(req, res)) return
  try {
    if (req.method === 'GET') {
      const rows = await getSheet('Vozidla!A1:L200')
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
      const { ECV, Znacka, Model, Rok, Palivo, Zamestnanec, Oddelenie, Stav, STK, Poistenie, Najazdene, Poznamka } = req.body
      await appendRow('Vozidla', [ECV, Znacka, Model, Rok, Palivo, Zamestnanec, Oddelenie, Stav || 'Aktívne', STK, Poistenie, Najazdene, Poznamka || ''])
      return res.json({ ok: true })
    }
    if (req.method === 'PUT') {
      const { _row, ECV, Znacka, Model, Rok, Palivo, Zamestnanec, Oddelenie, Stav, STK, Poistenie, Najazdene, Poznamka } = req.body
      await updateRow('Vozidla', _row, [ECV, Znacka, Model, Rok, Palivo, Zamestnanec, Oddelenie, Stav, STK, Poistenie, Najazdene, Poznamka || ''])
      return res.json({ ok: true })
    }
    if (req.method === 'DELETE') {
      const row = parseInt(req.query._row)
      if (!row || isNaN(row)) return res.status(400).json({ error: 'Missing or invalid _row' })
      await deleteRow('Vozidla', row)
      return res.json({ ok: true })
    }
    res.status(405).end()
  } catch (e) {
    res.status(500).json({ error: e.message })
  }
}
