const SHEET_ID = process.env.GOOGLE_SHEET_ID
const CLIENT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
const PRIVATE_KEY = (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n')

const SHEET_GID = {
  Vozidla: 0,
  Tankovania: 1374194033,
  Servisy: 1501333075,
}

async function getAccessToken() {
  const { webcrypto } = await import('node:crypto')
  const crypto = webcrypto
  const header = btoa(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const now = Math.floor(Date.now() / 1000)
  const payload = btoa(JSON.stringify({
    iss: CLIENT_EMAIL,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  })).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const signingInput = `${header}.${payload}`
  const pemContents = PRIVATE_KEY.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '')
  const binaryKey = Buffer.from(pemContents, 'base64')
  const cryptoKey = await crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign'])
  const signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', cryptoKey, new TextEncoder().encode(signingInput))
  const signature = Buffer.from(signatureBuffer).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  const jwt = `${signingInput}.${signature}`
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  })
  const data = await res.json()
  return data.access_token
}

async function sheetsRequest(path, method = 'GET', body = null) {
  const token = await getAccessToken()
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}${path}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : null,
  })
  return res.json()
}

export async function getSheet(range) {
  const data = await sheetsRequest(`/values/${range}`)
  return data.values || []
}

export async function appendRow(sheet, values) {
  return sheetsRequest(`/values/${sheet}!A1:Z1:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`, 'POST', {
    values: [values],
  })
}

export async function updateRow(sheet, row, values) {
  const range = `${sheet}!A${row}:Z${row}`
  return sheetsRequest(`/values/${range}?valueInputOption=RAW`, 'PUT', { values: [values] })
}

export async function deleteRow(sheetName, row) {
  const gid = SHEET_GID[sheetName]
  if (gid === undefined) throw new Error(`Unknown sheet: ${sheetName}`)
  return sheetsRequest('/batchUpdate', 'POST', {
    requests: [{
      deleteDimension: {
        range: {
          sheetId: gid,
          dimension: 'ROWS',
          startIndex: row - 1,
          endIndex: row,
        },
      },
    }],
  })
}
