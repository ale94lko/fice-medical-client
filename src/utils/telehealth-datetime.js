export function resolveBrowserTimeZone() {
  try {
    // eslint-disable-next-line new-cap
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function resolveTenantTimeZone() {
  return resolveBrowserTimeZone()
}

function parseUtcDate(iso) {
  const raw = String(iso ?? '').trim()
  if (!raw) {
    return null
  }
  const date = new Date(raw)

  return Number.isNaN(date.getTime()) ? null : date
}

export function formatUtcDateLong(iso, timeZone = resolveBrowserTimeZone()) {
  const date = parseUtcDate(iso)
  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function formatUtcTime(iso, timeZone = resolveBrowserTimeZone()) {
  const date = parseUtcDate(iso)
  if (!date) {
    return ''
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatUtcTimeRange(
  startIso,
  endIso,
  timeZone = resolveBrowserTimeZone(),
) {
  const start = formatUtcTime(startIso, timeZone)
  const end = formatUtcTime(endIso, timeZone)
  if (!start || !end) {
    return start || end || ''
  }

  return `${start} – ${end}`
}
