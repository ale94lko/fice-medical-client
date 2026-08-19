import {
  formatDate,
  formatDateTime,
  formatTime,
  toUtc,
} from 'src/utils/portal-datetime-config.js'

export function formatPortalDateTime(value) {
  return formatDateTime(value) || (value ? String(value) : '')
}

export function formatPortalDate(value) {
  return formatDate(value)
}

export function formatPortalTime(value) {
  return formatTime(value)
}

export function toLocalDateTimeInput(value) {
  const date = value instanceof Date ? value : new Date(value || Date.now())
  if (Number.isNaN(date.getTime())) {
    return ''
  }
  const pad = (n) => String(n).padStart(2, '0')
  return [
    date.getFullYear(),
    '-',
    pad(date.getMonth() + 1),
    '-',
    pad(date.getDate()),
    'T',
    pad(date.getHours()),
    ':',
    pad(date.getMinutes()),
  ].join('')
}

export function localInputToIso(value) {
  if (!value) {
    return null
  }
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return date.toISOString()
}

export const PORTAL_DATE_MASK = '##/##/####'
export const PORTAL_DATE_PLACEHOLDER = 'mm/dd/yyyy'
export const PORTAL_DATE_PICKER_MASK = 'MM/DD/YYYY'

function pad2(value) {
  return String(value).padStart(2, '0')
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function todayStart(from = new Date()) {
  return startOfDay(from)
}

export function tomorrowStart(from = new Date()) {
  const next = startOfDay(from)
  next.setDate(next.getDate() + 1)

  return next
}

export function usDateToIsoDate(value) {
  const date = parseUsDateString(value)
  if (!date) {
    return null
  }

  return [
    date.getFullYear(),
    '-',
    pad2(date.getMonth() + 1),
    '-',
    pad2(date.getDate()),
  ].join('')
}

export function isoDateToUsDate(value) {
  const raw = String(value ?? '').trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw)
  if (iso) {
    return `${iso[2]}/${iso[3]}/${iso[1]}`
  }
  if (parseUsDateString(raw)) {
    return raw
  }
  return ''
}

export function formatIsoDateLabel(isoDate, options = {}) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(isoDate ?? ''))
  if (!match) {
    return String(isoDate ?? '')
  }
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
  )

  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...options,
  })
}

export function tomorrowUsDate(from = new Date()) {
  return formatUsDate(tomorrowStart(from))
}

export const DEFAULT_PREFERRED_TIME = '6:00 AM'

export function formatUsDate(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return ''
  }

  return [
    pad2(date.getMonth() + 1),
    '/',
    pad2(date.getDate()),
    '/',
    date.getFullYear(),
  ].join('')
}

export function parseUsDateString(value) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(
    String(value ?? '').trim(),
  )
  if (!match) {
    return null
  }
  const month = Number(match[1])
  const day = Number(match[2])
  const year = Number(match[3])
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year
    || date.getMonth() !== month - 1
    || date.getDate() !== day
  ) {
    return null
  }

  return date
}

export function isCompleteUsDateString(value) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(String(value ?? '').trim())
}

function clampDigits(raw, min, max) {
  let n = Number(raw)
  if (!Number.isFinite(n)) {
    return raw
  }
  if (n < min) {
    n = min
  }
  if (n > max) {
    n = max
  }

  return pad2(n)
}

export function sanitizeUsDateInput(value, {
  minTomorrow = false,
  minToday = false,
} = {}) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8)
  if (!digits.length) {
    return ''
  }

  let month = digits.slice(0, Math.min(2, digits.length))
  if (month.length === 1 && Number(month) > 1) {
    month = `0${month}`
  }
  if (month.length === 2) {
    month = clampDigits(month, 1, 12)
  }
  if (digits.length <= 2) {
    return month
  }

  let day = digits.slice(2, Math.min(4, digits.length))
  if (day.length === 1 && Number(day) > 3) {
    day = `0${day}`
  }
  if (day.length === 2) {
    day = clampDigits(day, 1, 31)
  }
  const year = digits.slice(4, 8)
  if (!year) {
    return `${month}/${day}`
  }
  const result = `${month}/${day}/${year}`
  if (!isCompleteUsDateString(result)) {
    return result
  }
  const parsed = parseUsDateString(result)
  if (!parsed) {
    return `${month}/${day}/`
  }
  if (minTomorrow) {
    const min = tomorrowStart()
    if (parsed.getTime() < min.getTime()) {
      return formatUsDate(min)
    }
  }
  if (minToday) {
    const min = todayStart()
    if (parsed.getTime() < min.getTime()) {
      return formatUsDate(min)
    }
  }

  return formatUsDate(parsed)
}

export function parseCalendarOptionDate(dateStr) {
  const raw = String(dateStr ?? '').trim()
  const fromDisplay = parseUsDateString(raw)
  if (fromDisplay) {
    return startOfDay(fromDisplay)
  }
  const isoSlash = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(raw)
  if (!isoSlash) {
    return null
  }

  return startOfDay(new Date(
    Number(isoSlash[1]),
    Number(isoSlash[2]) - 1,
    Number(isoSlash[3]),
  ))
}

export function isAllowedCalendarDate(dateStr, {
  minTomorrow = false,
  minToday = false,
} = {}) {
  const parsed = parseCalendarOptionDate(dateStr)
  if (!parsed) {
    return true
  }
  if (minTomorrow && parsed.getTime() < tomorrowStart().getTime()) {
    return false
  }
  if (minToday && parsed.getTime() < todayStart().getTime()) {
    return false
  }

  return true
}

export function normalizePickerDate(value, options = {}) {
  const raw = String(value ?? '').trim()
  const isoSlash = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec(raw)
  if (isoSlash) {
    const date = new Date(
      Number(isoSlash[1]),
      Number(isoSlash[2]) - 1,
      Number(isoSlash[3]),
    )

    return sanitizeUsDateInput(formatUsDate(date), options)
  }

  return sanitizeUsDateInput(raw, options)
}

export function parseTime12h(value) {
  const match = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(
    String(value ?? '').trim(),
  )
  if (!match) {
    return null
  }
  let hours = Number(match[1])
  const minutes = Number(match[2])
  const period = match[3].toUpperCase()
  if (
    !Number.isFinite(hours)
    || !Number.isFinite(minutes)
    || hours < 1
    || hours > 12
    || minutes < 0
    || minutes > 59
  ) {
    return null
  }
  if (period === 'PM' && hours !== 12) {
    hours += 12
  }
  if (period === 'AM' && hours === 12) {
    hours = 0
  }

  return { hours, minutes }
}

export function normalizeTime12h(value) {
  const parsed = parseTime12h(value)
  if (!parsed) {
    return ''
  }
  const period = parsed.hours >= 12 ? 'PM' : 'AM'
  let hours = parsed.hours % 12
  if (hours === 0) {
    hours = 12
  }

  return `${hours}:${pad2(parsed.minutes)} ${period}`
}

export function preferredDateTimeToIso(dateStr, timeStr) {
  const date = parseUsDateString(dateStr)
  if (!date) {
    return null
  }
  const time = parseTime12h(timeStr) || { hours: 6, minutes: 0 }
  const hh = String(time.hours).padStart(2, '0')
  const mm = String(time.minutes).padStart(2, '0')

  return toUtc(date, `${hh}:${mm}`) || null
}
