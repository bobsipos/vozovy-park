export default function handler(req, res) {
  res.setHeader('Set-Cookie', 'auth=; Path=/; Max-Age=0')
  res.status(200).json({ ok: true })
}
