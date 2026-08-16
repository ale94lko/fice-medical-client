const reserved = new Set(['www', 'app', 'api', 'admin'])

export function resolveTenantDomainFromHost(hostname) {
  const host = String(hostname ?? window.location.hostname)
    .trim()
    .toLowerCase()
    .split(':')[0]
  if (!host || host === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const params = new URLSearchParams(window.location.search)
    return String(params.get('domain') ?? '').trim().toLowerCase() || 'pruebas'
  }
  const labels = host.split('.').filter(Boolean)
  const isPortalHost = labels[0] === 'portal'
    && labels.length >= 2
    && !reserved.has(labels[1])
  if (isPortalHost) {
    return labels[1]
  }
  if (labels.length >= 2 && !reserved.has(labels[0])) {
    return labels[0]
  }
  return 'pruebas'
}
