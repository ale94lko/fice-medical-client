const TERMINAL_VISIT_STATUSES = new Set([
  'CANCELLED',
  'COMPLETED',
  'NO_SHOW',
])

const TELEHEALTH_CODES = new Set(['02', '10'])

function normalizePosCode(code) {
  const raw = String(code ?? '').trim().toUpperCase()
  if (/^\d$/.test(raw)) {
    return `0${raw}`
  }
  return raw
}

export function isPortalTelehealthVisit(item) {
  if (item?.telemedicine === true || item?.telemedicine === 'true') {
    return true
  }
  return TELEHEALTH_CODES.has(
    normalizePosCode(item?.place_of_service_code),
  )
}

export function toPortalJoinFields(item, t, testId) {
  if (!isPortalTelehealthVisit(item)) {
    return {}
  }
  const status = String(item?.status || '').toUpperCase()
  if (TERMINAL_VISIT_STATUSES.has(status)) {
    return {}
  }
  const canJoin = Boolean(item.can_join_telehealth)
  const id = item.appointment_id
  return {
    showJoin: true,
    to: canJoin
      ? { name: 'PortalTelehealth', params: { id } }
      : null,
    joinDisabled: !canJoin,
    joinHint: canJoin ? '' : t('telehealthJoinWhenReady'),
    actionLabel: t('telehealthJoinVisit'),
    testId,
  }
}
