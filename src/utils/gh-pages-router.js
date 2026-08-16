/** Parse path saved by public/404.html for GitHub Pages SPA hosting. */
export function parseGithubPagesStoredRedirect(stored, router) {
  const raw = String(stored ?? '').trim()
  if (!raw) {
    return null
  }

  const base = router.options.history.base || '/'
  const basePath = base.endsWith('/') ? base.slice(0, -1) : base
  let path = raw
  if (basePath && path.startsWith(basePath)) {
    path = path.slice(basePath.length) || '/'
  }

  return path.startsWith('/') ? path : `/${path}`
}

export function readGithubPagesStoredRedirect() {
  if (typeof sessionStorage === 'undefined') {
    return null
  }
  const stored = sessionStorage.getItem('redirect')
  if (!stored) {
    return null
  }
  sessionStorage.removeItem('redirect')

  return stored
}

const CHUNK_RELOAD_SESSION_PREFIX = 'fice-medical-client:chunk-reload:'

/** True when a lazy route chunk failed to load (stale deploy / cache). */
export function isStaleChunkLoadError(error) {
  const message = String(error?.message ?? error ?? '')

  return /Failed to fetch dynamically imported module/i.test(message)
    || /error loading dynamically imported module/i.test(message)
    || /Importing a module script failed/i.test(message)
}

/**
 * After a deploy, hashed JS chunks change. Reload once so index.html
 * picks up the new entry bundle.
 */
export function reloadRouteAfterStaleChunk(to) {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') {
    return false
  }

  const reloadKey = `${CHUNK_RELOAD_SESSION_PREFIX}${to.fullPath}`
  if (sessionStorage.getItem(reloadKey)) {
    sessionStorage.removeItem(reloadKey)

    return false
  }

  sessionStorage.setItem(reloadKey, '1')
  window.location.assign(to.fullPath)

  return true
}
