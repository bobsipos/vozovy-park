export function authFetch(url, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('vp_token') || '' : ''
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'x-auth-token': token,
      ...(options.headers || {}),
    },
  })
}
