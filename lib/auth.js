export function checkAuth(req, res) {
  const token = req.headers['x-auth-token']
  const password = process.env.DASHBOARD_PASSWORD || 'vozovypark2026'
  if (token !== password) {
    res.status(401).json({ error: 'Unauthorized' })
    return false
  }
  return true
}
