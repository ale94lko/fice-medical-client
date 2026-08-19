/* eslint-disable camelcase -- API config_data field names */
const DEFAULT_CONFIG = {
  timezone: 'UTC',
  locale: 'en_US',
  date_format: 'MM/DD/YYYY',
  time_format: '12h',
  first_day_of_week: 'SUNDAY',
}

const SUPPORTED_DATE_FORMATS = [
  'MM/DD/YYYY',
  'DD/MM/YYYY',
  'YYYY-MM-DD',
  'YYYY/MM/DD',
]
const SUPPORTED_TIME_FORMATS = ['12h', '24h']
const SUPPORTED_FIRST_DAYS = ['SUNDAY', 'MONDAY']
const SESSION_TZ_KEY = 'fice.sessionDisplayTzMode'

let runtimeConfig = { ...DEFAULT_CONFIG }

export function normalizePortalDateTimeConfig(config = {}) {
  const rawFormat = String(
    config.date_format ?? config.dateFormat ?? DEFAULT_CONFIG.date_format,
  ).trim().toUpperCase()
  const rawTime = String(
    config.time_format ?? config.timeFormat ?? DEFAULT_CONFIG.time_format,
  ).trim().toLowerCase()
  const rawFirst = String(
    config.first_day_of_week
      ?? config.firstDayOfWeek
      ?? DEFAULT_CONFIG.first_day_of_week,
  ).trim().toUpperCase()

  return {
    timezone: String(config.timezone ?? DEFAULT_CONFIG.timezone).trim()
      || DEFAULT_CONFIG.timezone,
    locale: String(config.locale ?? DEFAULT_CONFIG.locale).trim()
      || DEFAULT_CONFIG.locale,
    date_format: SUPPORTED_DATE_FORMATS.includes(rawFormat)
      ? rawFormat
      : DEFAULT_CONFIG.date_format,
    time_format: SUPPORTED_TIME_FORMATS.includes(rawTime)
      ? rawTime
      : DEFAULT_CONFIG.time_format,
    first_day_of_week: SUPPORTED_FIRST_DAYS.includes(rawFirst)
      ? rawFirst
      : DEFAULT_CONFIG.first_day_of_week,
  }
}

export function setPortalDateTimeConfig(config) {
  if (!config) {
    runtimeConfig = { ...DEFAULT_CONFIG }

    return
  }
  runtimeConfig = normalizePortalDateTimeConfig(config)
}

export function getPortalDateTimeConfig() {
  return { ...runtimeConfig }
}

export function resolveIntlLocale(locale = runtimeConfig.locale) {
  return String(locale ?? DEFAULT_CONFIG.locale).replace(/_/g, '-')
}

export function resolveIntlTimeZone(timezone = runtimeConfig.timezone) {
  const raw = String(timezone ?? DEFAULT_CONFIG.timezone).trim()
  if (!raw) {
    return DEFAULT_CONFIG.timezone
  }
  if (raw.includes('/') || /^UTC$/i.test(raw)) {
    return raw
  }

  return raw.replace(/_/g, '/') || 'UTC'
}

export function resolveBrowserTimeZone() {
  try {
    // eslint-disable-next-line new-cap
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

export function resolveClinicTimeZone() {
  return resolveIntlTimeZone(runtimeConfig.timezone) || 'UTC'
}

function readSessionTzMode() {
  if (typeof sessionStorage === 'undefined') {
    return null
  }
  try {
    const raw = sessionStorage.getItem(SESSION_TZ_KEY)

    return raw === 'browser' || raw === 'dismissed' ? raw : null
  } catch {
    return null
  }
}

export function getSessionDisplayTzMode() {
  return readSessionTzMode()
}

export function setSessionDisplayTzMode(mode) {
  if (typeof sessionStorage === 'undefined') {
    return
  }
  try {
    if (!mode) {
      sessionStorage.removeItem(SESSION_TZ_KEY)

      return
    }
    sessionStorage.setItem(SESSION_TZ_KEY, mode)
  } catch {
    // ignore quota / private mode
  }
}

export function clearSessionDisplayTzMode() {
  setSessionDisplayTzMode(null)
}

export function resolveActiveDisplayTimeZone() {
  if (readSessionTzMode() === 'browser') {
    return resolveBrowserTimeZone()
  }

  return resolveClinicTimeZone()
}

export function clinicBrowserTimezonesDiffer() {
  return resolveClinicTimeZone() !== resolveBrowserTimeZone()
}

function parseUtcInstant(value) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    return null
  }
  const date = new Date(raw)

  return Number.isNaN(date.getTime()) ? null : date
}

function formatDisplayDate(date, config = runtimeConfig) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const year = String(date.getFullYear())

  return config.date_format
    .replace(/YYYY/g, year)
    .replace(/MM/g, month)
    .replace(/DD/g, day)
}

export function formatDate(
  utcInstant,
  timeZone = resolveActiveDisplayTimeZone(),
) {
  const date = parseUtcInstant(utcInstant)
  if (!date) {
    return ''
  }
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = Number(parts.find(part => part.type === 'year')?.value)
  const month = Number(parts.find(part => part.type === 'month')?.value) - 1
  const day = Number(parts.find(part => part.type === 'day')?.value)

  return formatDisplayDate(new Date(year, month, day))
}

export function formatTime(
  utcInstant,
  timeZone = resolveActiveDisplayTimeZone(),
) {
  const date = parseUtcInstant(utcInstant)
  if (!date) {
    return ''
  }
  const config = getPortalDateTimeConfig()

  return new Intl.DateTimeFormat(resolveIntlLocale(config.locale), {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: config.time_format !== '24h',
  }).format(date)
}

export function formatDateTime(
  utcInstant,
  timeZone = resolveActiveDisplayTimeZone(),
) {
  const datePart = formatDate(utcInstant, timeZone)
  const timePart = formatTime(utcInstant, timeZone)
  if (!datePart) {
    return timePart
  }

  return timePart ? `${datePart} ${timePart}` : datePart
}

function getTimeZoneOffsetMs(date, timeZone) {
  const utc = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const local = new Date(date.toLocaleString('en-US', { timeZone }))

  return utc.getTime() - local.getTime()
}

export function toUtc(
  localDate,
  localTime,
  timeZone = resolveActiveDisplayTimeZone(),
) {
  if (!(localDate instanceof Date) || Number.isNaN(localDate.getTime())) {
    return ''
  }
  const time = String(localTime ?? '00:00')
  const match = /^(\d{1,2}):(\d{2})/.exec(time)
  const hours = match ? Number(match[1]) : 0
  const minutes = match ? Number(match[2]) : 0
  const noonUtc = new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    12,
  ))
  const offsetMs = getTimeZoneOffsetMs(noonUtc, timeZone)
  const asUtc = new Date(Date.UTC(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    hours,
    minutes,
    0,
    0,
  ))

  return new Date(asUtc.getTime() + offsetMs).toISOString()
}
