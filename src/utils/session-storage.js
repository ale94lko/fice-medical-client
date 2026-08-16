const REFRESH_KEY = 'fice.client.refresh'

export function readRefreshToken() {
  return sessionStorage.getItem(REFRESH_KEY)
}

export function writeRefreshToken(token) {
  if (!token) {
    sessionStorage.removeItem(REFRESH_KEY)
    return
  }
  sessionStorage.setItem(REFRESH_KEY, token)
}

export function clearRefreshToken() {
  sessionStorage.removeItem(REFRESH_KEY)
}
