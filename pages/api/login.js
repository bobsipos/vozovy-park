export default function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()
  const { password } = req.body
  const correct = process.env.DASHBOARD_PASSWORD || 'vozovypark2026'
  if (password === correct) {
    return res.status(200).json({ ok: true, token: correct })
  }
  return res.status(401).json({ error: 'Nesprávne heslo' })
}
