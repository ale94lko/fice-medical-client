function trimStr(value) {
  return String(value ?? '').trim()
}

function encodeStorageValue(value) {
  const str = trimStr(value)
  if (!str) {
    return ''
  }
  try {
    return btoa(unescape(encodeURIComponent(str)))
  } catch {
    return ''
  }
}

function decodeStorageValue(value) {
  const str = trimStr(value)
  if (!str) {
    return ''
  }
  try {
    return decodeURIComponent(escape(atob(str)))
  } catch {
    return ''
  }
}

function toNumberOrNull(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function toBool(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value
  }
  if (value == null) {
    return fallback
  }
  const token = String(value).trim().toLowerCase()
  if (token === 'true' || token === '1' || token === 'yes') {
    return true
  }
  if (token === 'false' || token === '0' || token === 'no') {
    return false
  }

  return fallback
}

export function normalizeIceServer(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const urls = raw.urls ?? raw.url
  if (urls == null || urls === '') {
    return null
  }

  const server = { urls }
  const username = trimStr(raw.username)
  const credential = trimStr(raw.credential ?? raw.password)
  if (username) {
    server.username = username
  }
  if (credential) {
    server.credential = credential
  }

  return server
}

export function mapIceServersFromApi(list) {
  return (Array.isArray(list) ? list : [])
    .map(normalizeIceServer)
    .filter(Boolean)
}

export function normalizeTelehealthParticipant(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = toNumberOrNull(raw.id ?? raw.participant_id)

  let role = trimStr(raw.role).toUpperCase()
  if (role === 'PATIENT') {
    role = 'CLIENT'
  }

  return {
    id,
    sessionId: toNumberOrNull(raw.session_id ?? raw.sessionId),
    role,
    displayName: trimStr(raw.display_name ?? raw.displayName),
    status: trimStr(raw.status).toUpperCase(),
    ready: toBool(raw.ready, false),
    cameraTested: toBool(raw.camera_tested ?? raw.cameraTested, false),
    microphoneTested: toBool(
      raw.microphone_tested ?? raw.microphoneTested,
      false,
    ),
    speakerTested: toBool(raw.speaker_tested ?? raw.speakerTested, false),
    connectionQuality: trimStr(
      raw.connection_quality ?? raw.connectionQuality,
    ),
    joinedAt: trimStr(raw.joined_at ?? raw.joinedAt ?? raw.joined_at_utc),
    leftAt: trimStr(raw.left_at ?? raw.leftAt ?? raw.left_at_utc),
    userId: toNumberOrNull(raw.user_id ?? raw.userId),
  }
}

export function mapParticipantsFromApi(list) {
  return (Array.isArray(list) ? list : [])
    .map(normalizeTelehealthParticipant)
    .filter(Boolean)
}

export function normalizeTelehealthServiceProcedure(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const name = trimStr(raw.name)
  if (!name) {
    return null
  }

  return {
    name,
    cptCode: trimStr(raw.cpt_code ?? raw.cptCode) || null,
    hcpcsCode: trimStr(raw.hcpcs_code ?? raw.hcpcsCode) || null,
  }
}

/**
 * Guest join/session: appointment_summary (no appointment/clinician IDs).
 */
export function normalizeTelehealthAppointmentSummary(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const proceduresRaw = raw.service_procedures ?? raw.serviceProcedures
  const serviceProcedures = (Array.isArray(proceduresRaw) ? proceduresRaw : [])
    .map(normalizeTelehealthServiceProcedure)
    .filter(Boolean)
  const servicesLabel = serviceProcedures
    .map(item => item.name)
    .filter(Boolean)
    .join(', ')
  const startAtUtc = trimStr(raw.start_at_utc ?? raw.startAtUtc)
  const endAtUtc = trimStr(raw.end_at_utc ?? raw.endAtUtc)
  const clinicianDisplayName = trimStr(
    raw.clinician_display_name ?? raw.clinicianDisplayName,
  )
  const durationMinutes = toNumberOrNull(
    raw.duration_minutes ?? raw.durationMinutes,
  )
  if (
    !startAtUtc
    && !endAtUtc
    && !clinicianDisplayName
    && !servicesLabel
    && durationMinutes == null
  ) {
    return null
  }

  return {
    startAtUtc,
    endAtUtc,
    durationMinutes,
    clinicianDisplayName,
    serviceProcedures,
    servicesLabel,
  }
}

/** Client label from session field or joined CLIENT/GUEST participant. */
export function resolveTelehealthClientDisplayName(session) {
  const fromSession = trimStr(session?.clientDisplayName)
  if (fromSession) {
    return fromSession
  }
  const participants = Array.isArray(session?.participants)
    ? session.participants
    : []
  const client = participants.find(item => {
    const role = trimStr(item?.role).toUpperCase()

    return role === 'CLIENT' || role === 'GUEST' || role === 'PATIENT'
  })

  return trimStr(client?.displayName)
}

/**
 * Appointment-shaped view model for lobby / topbar / meet info.
 * Prefers full staff appointment when present; else guest summary.
 * Staff sessions may also carry client_display_name / client_number.
 */
export function telehealthAppointmentViewFromSession(
  session,
  appointment = null,
) {
  const summary = session?.appointmentSummary || null
  const clinicianDisplayName = trimStr(
    appointment?.clinicianDisplayName
    || session?.clinicianDisplayName
    || summary?.clinicianDisplayName,
  )
  const clientDisplayName = trimStr(
    session?.clientDisplayName
    || appointment?.clientDisplayName
    || resolveTelehealthClientDisplayName(session),
  )
  const clientNumber = trimStr(
    session?.clientNumber
    || appointment?.clientNumber,
  )
  if (appointment && typeof appointment === 'object') {
    return {
      ...appointment,
      clinicianDisplayName:
        clinicianDisplayName || appointment.clinicianDisplayName || '',
      clientDisplayName:
        clientDisplayName || appointment.clientDisplayName || '',
      clientNumber: clientNumber || appointment.clientNumber || '',
    }
  }
  if (
    !summary
    && !clinicianDisplayName
    && !clientDisplayName
    && !clientNumber
  ) {
    return null
  }

  return {
    clinicianDisplayName,
    startAtUtc: summary?.startAtUtc || '',
    endAtUtc: summary?.endAtUtc || '',
    durationMin: summary?.durationMinutes ?? null,
    servicesLabel: summary?.servicesLabel || '',
    serviceProcedures: summary?.serviceProcedures || [],
    appointmentNumber: '',
    clientDisplayName,
    clientNumber,
  }
}

const GUEST_APPT_CACHE_PREFIX = 'fice.telehealth.apptSummary.'

export function cacheGuestAppointmentSummary(meetingToken, payload = {}) {
  const token = trimStr(meetingToken)
  if (!token || typeof sessionStorage === 'undefined') {
    return
  }
  const summary = payload.appointmentSummary || null
  const clinicianDisplayName = trimStr(
    payload.clinicianDisplayName
    || summary?.clinicianDisplayName,
  )
  if (!clinicianDisplayName) {
    return
  }
  try {
    sessionStorage.setItem(
      `${GUEST_APPT_CACHE_PREFIX}${token}`,
      JSON.stringify({
        clinicianDisplayName: encodeStorageValue(clinicianDisplayName) || null,
      }),
    )
  } catch {
    // ignore quota / private mode
  }
}

export function readCachedGuestAppointmentSummary(meetingToken) {
  const token = trimStr(meetingToken)
  if (!token || typeof sessionStorage === 'undefined') {
    return null
  }
  try {
    const raw = sessionStorage.getItem(
      `${GUEST_APPT_CACHE_PREFIX}${token}`,
    )
    if (!raw) {
      return null
    }
    const parsed = JSON.parse(raw)
    const appointmentSummary = null
    const clinicianDisplayName = trimStr(
      decodeStorageValue(parsed?.clinicianDisplayName),
    ) || null
    if (!appointmentSummary && !clinicianDisplayName) {
      return null
    }

    return {
      clinicianDisplayName,
      appointmentSummary,
    }
  } catch {
    return null
  }
}

function pickGuestCredentialsFromSessionRaw(raw = {}) {
  const nestedAuth = raw.auth && typeof raw.auth === 'object'
    ? raw.auth
    : null
  const selfParticipant = raw.self_participant
    ?? raw.selfParticipant
    ?? null
  const meetingToken = trimStr(
    raw.meeting_token
    ?? raw.meetingToken
    ?? nestedAuth?.meeting_token
    ?? nestedAuth?.meetingToken,
  ) || null
  const guestKey = trimStr(
    raw.guest_key
    ?? raw.guestKey
    ?? nestedAuth?.guest_key
    ?? nestedAuth?.guestKey
    ?? selfParticipant?.guest_key
    ?? selfParticipant?.guestKey,
  ) || null

  return { meetingToken, guestKey }
}

export function normalizeTelehealthSession(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = toNumberOrNull(raw.id ?? raw.session_id)
  if (id == null) {
    return null
  }
  const { meetingToken, guestKey } = pickGuestCredentialsFromSessionRaw(raw)

  const appointmentSummary = normalizeTelehealthAppointmentSummary(
    raw.appointment_summary ?? raw.appointmentSummary,
  )
  const nestedAppointment = (
    raw.appointment
    && typeof raw.appointment === 'object'
  )
    ? raw.appointment
    : null
  const clinicianDisplayName = trimStr(
    raw.clinician_display_name
    ?? raw.clinicianDisplayName
    ?? appointmentSummary?.clinicianDisplayName
    ?? nestedAppointment?.clinician_display_name
    ?? nestedAppointment?.clinicianDisplayName,
  ) || null
  // Authenticated staff sessions (GET/POST /meet/v1/sessions/...).
  const clientDisplayName = trimStr(
    raw.client_display_name
    ?? raw.clientDisplayName
    ?? raw.patient_display_name
    ?? raw.patientDisplayName
    ?? nestedAppointment?.client_display_name
    ?? nestedAppointment?.clientDisplayName
    ?? nestedAppointment?.patient_name
    ?? nestedAppointment?.patientName,
  ) || null
  const clientNumber = trimStr(
    raw.client_number
    ?? raw.clientNumber
    ?? nestedAppointment?.client_number
    ?? nestedAppointment?.clientNumber,
  ) || null

  return {
    id,
    appointmentId: toNumberOrNull(raw.appointment_id ?? raw.appointmentId),
    status: trimStr(raw.status).toUpperCase(),
    meetingCode: trimStr(raw.meeting_code ?? raw.meetingCode),
    meetingToken,
    guestKey,
    clientMeetingToken: trimStr(
      raw.client_meeting_token
      ?? raw.clientMeetingToken
      ?? raw.patient_meeting_token
      ?? raw.patientMeetingToken,
    ) || null,
    clientInviteUrl: trimStr(
      raw.client_invite_url
      ?? raw.clientInviteUrl
      ?? raw.patient_invite_url
      ?? raw.patientInviteUrl,
    ) || null,
    clinicianDisplayName,
    clientDisplayName,
    clientNumber,
    appointmentSummary,
    startedAtUtc: trimStr(
      raw.started_at_utc ?? raw.startedAtUtc ?? raw.started_at,
    ),
    endedAtUtc: trimStr(
      raw.ended_at_utc ?? raw.endedAtUtc ?? raw.ended_at,
    ),
    durationSeconds: toNumberOrNull(
      raw.duration_seconds ?? raw.durationSeconds,
    ),
    recordingEnabled: toBool(
      raw.recording_enabled ?? raw.recordingEnabled,
      false,
    ),
    allowClientScreenShare: toBool(
      raw.allow_client_screen_share
      ?? raw.allowClientScreenShare
      ?? raw.allow_patient_screen_share
      ?? raw.allowPatientScreenShare,
      false,
    ),
    screenSharingParticipantId: toNumberOrNull(
      raw.screen_sharing_participant_id
      ?? raw.screenSharingParticipantId,
    ),
    participants: mapParticipantsFromApi(
      raw.participants ?? raw.participant_list,
    ),
    iceServers: mapIceServersFromApi(raw.ice_servers ?? raw.iceServers),
    selfParticipantId: toNumberOrNull(
      raw.self_participant_id
      ?? raw.selfParticipantId
      ?? raw.participant_id
      ?? raw.participantId,
    ),
  }
}

/**
 * STOMP / REST chat payloads may be bare, `{ data }`, or `{ message }`.
 * Prefer the nested object when the wrapper has no message id.
 */
function unwrapChatMessagePayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null
  }
  let body = raw
  const nestedData = raw.data
  if (
    nestedData
    && typeof nestedData === 'object'
    && !Array.isArray(nestedData)
    && raw.id == null
    && raw.message_id == null
    && raw.messageId == null
  ) {
    body = nestedData
  }
  const nestedMessage = body.message
  if (
    nestedMessage
    && typeof nestedMessage === 'object'
    && !Array.isArray(nestedMessage)
    && body.id == null
    && body.message_id == null
    && body.messageId == null
  ) {
    body = nestedMessage
  }

  return body
}

function chatMessageBodyText(raw) {
  if (raw == null || typeof raw !== 'object') {
    return ''
  }
  if (typeof raw.message === 'string') {
    return String(
      raw.body ?? raw.text ?? raw.content ?? raw.message ?? '',
    )
  }
  const nested = raw.message
  const fromNested = (
    nested
    && typeof nested === 'object'
    && !Array.isArray(nested)
  )
    ? (nested.body ?? nested.text ?? nested.content)
    : null

  return String(
    raw.body
    ?? raw.text
    ?? raw.content
    ?? fromNested
    ?? '',
  )
}

export function normalizeTelehealthChatMessage(raw) {
  const payload = unwrapChatMessagePayload(raw)
  if (!payload) {
    return null
  }
  const typeToken = trimStr(
    payload.type ?? raw?.type,
  ).toLowerCase()
  if (typeToken === 'message_deleted') {
    return {
      type: 'message_deleted',
      messageId: toNumberOrNull(
        payload.message_id
        ?? payload.messageId
        ?? payload.id
        ?? raw?.message_id
        ?? raw?.messageId
        ?? raw?.id,
      ),
    }
  }
  const id = toNumberOrNull(
    payload.id ?? payload.message_id ?? payload.messageId,
  )
  if (id == null) {
    return null
  }

  return {
    id,
    sessionId: toNumberOrNull(payload.session_id ?? payload.sessionId),
    participantId: toNumberOrNull(
      payload.participant_id ?? payload.participantId,
    ),
    displayName: trimStr(
      payload.display_name
      ?? payload.displayName
      ?? payload.sender_name
      ?? payload.senderName,
    ),
    role: trimStr(
      payload.role ?? payload.sender_role ?? payload.senderRole,
    ).toUpperCase(),
    messageType: trimStr(
      payload.message_type ?? payload.messageType ?? 'TEXT',
    ).toUpperCase(),
    body: chatMessageBodyText(payload),
    createdAt: trimStr(payload.created_at ?? payload.createdAt),
  }
}

export function mapChatMessagesFromApi(list) {
  return (Array.isArray(list) ? list : [])
    .map(normalizeTelehealthChatMessage)
    .filter(item => item && item.type !== 'message_deleted')
}

export function normalizeStoredFileMeta(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }

  return {
    id: toNumberOrNull(raw.id ?? raw.stored_file_id),
    originalName: trimStr(
      raw.original_name ?? raw.originalName ?? raw.file_name ?? raw.fileName,
    ),
    contentType: trimStr(
      raw.content_type ?? raw.contentType ?? raw.mime_type,
    ),
    sizeBytes: toNumberOrNull(raw.size_bytes ?? raw.sizeBytes ?? raw.size),
    uploadedBy: toNumberOrNull(raw.uploaded_by ?? raw.uploadedBy),
    uploadedByName: trimStr(
      raw.uploaded_by_name
      ?? raw.uploadedByName
      ?? raw.uploader_name
      ?? raw.uploaderName,
    ) || null,
  }
}

export function normalizeTelehealthFile(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  if (trimStr(raw.type).toLowerCase() === 'file_deleted') {
    return {
      type: 'file_deleted',
      id: toNumberOrNull(raw.id ?? raw.file_id),
    }
  }
  const id = toNumberOrNull(raw.id ?? raw.file_id)
  if (id == null) {
    return null
  }
  const fileMeta = normalizeStoredFileMeta(raw.file ?? raw.stored_file)

  return {
    id,
    sessionId: toNumberOrNull(raw.session_id ?? raw.sessionId),
    storedFileId: toNumberOrNull(
      raw.stored_file_id ?? raw.storedFileId,
    ),
    uploadedBy: toNumberOrNull(raw.uploaded_by ?? raw.uploadedBy)
      ?? fileMeta?.uploadedBy
      ?? null,
    uploadedByName: trimStr(
      raw.uploaded_by_name
      ?? raw.uploadedByName
      ?? fileMeta?.uploadedByName,
    ) || null,
    category: trimStr(raw.category) || 'CLINICAL_DOCUMENT',
    createdAt: trimStr(raw.created_at ?? raw.createdAt),
    file: fileMeta,
  }
}

export function mapTelehealthFilesFromApi(list) {
  return (Array.isArray(list) ? list : [])
    .map(normalizeTelehealthFile)
    .filter(item => item && item.type !== 'file_deleted')
}

export function isTelehealthTerminalStatus(status) {
  const token = trimStr(status).toUpperCase()

  return (
    token === 'COMPLETED'
    || token === 'CANCELLED'
    || token === 'FAILED'
  )
}

/**
 * Live elapsed seconds for an active meet.
 * Prefer server started_at_utc so staff and guest share one clock.
 */
export function resolveTelehealthElapsedSeconds(
  session,
  localStartedAtMs = null,
  nowMs = Date.now(),
) {
  const startIso = trimStr(session?.startedAtUtc)
  if (startIso) {
    const startMs = new Date(startIso).getTime()
    if (Number.isFinite(startMs)) {
      return Math.max(0, Math.floor((nowMs - startMs) / 1000))
    }
  }
  if (Number.isFinite(localStartedAtMs) && localStartedAtMs > 0) {
    return Math.max(0, Math.floor((nowMs - localStartedAtMs) / 1000))
  }

  return null
}

export function formatTelehealthElapsedLabel(totalSeconds) {
  const total = Math.floor(Number(totalSeconds))
  if (!Number.isFinite(total) || total < 0) {
    return ''
  }
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = total % 60
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:`
      + `${String(secs).padStart(2, '0')}`
  }

  return `${mins}:${String(secs).padStart(2, '0')}`
}

/** Prefer API duration, then started/ended UTC, then local clock. */
export function resolveTelehealthDurationSeconds(
  session,
  localStartedAtMs = null,
) {
  const api = Number(session?.durationSeconds)
  if (Number.isFinite(api) && api > 0) {
    return Math.floor(api)
  }
  const startIso = trimStr(session?.startedAtUtc)
  if (startIso) {
    const startMs = new Date(startIso).getTime()
    const endIso = trimStr(session?.endedAtUtc)
    const endMs = endIso ? new Date(endIso).getTime() : Date.now()
    if (
      Number.isFinite(startMs)
      && Number.isFinite(endMs)
      && endMs >= startMs
    ) {
      const seconds = Math.floor((endMs - startMs) / 1000)
      if (seconds > 0) {
        return seconds
      }
    }
  }
  if (Number.isFinite(localStartedAtMs) && localStartedAtMs > 0) {
    const seconds = Math.floor((Date.now() - localStartedAtMs) / 1000)
    if (seconds > 0) {
      return seconds
    }
  }

  return null
}

const SESSION_STATUS_I18N = {
  SCHEDULED: 'telehealthStatusScheduled',
  WAITING_ROOM: 'telehealthStatusWaitingRoom',
  READY: 'telehealthStatusReady',
  IN_PROGRESS: 'telehealthStatusInProgress',
  COMPLETED: 'telehealthStatusCompleted',
  CANCELLED: 'telehealthStatusCancelled',
  FAILED: 'telehealthStatusFailed',
}

const PARTICIPANT_STATUS_I18N = {
  WAITING: 'telehealthParticipantWaiting',
  ADMITTED: 'telehealthParticipantAdmitted',
  IN_SESSION: 'telehealthParticipantInSession',
  LEFT: 'telehealthParticipantLeft',
}

const ROLE_I18N = {
  CLINICIAN: 'telehealthRoleClinician',
  CLIENT: 'telehealthRoleClient',
  GUEST: 'telehealthRoleGuest',
  PATIENT: 'telehealthRoleClient',
}

/** Human-readable session status for UI (never show raw WAITING_ROOM). */
export function telehealthSessionStatusLabel(status, t) {
  const token = trimStr(status).toUpperCase()
  const key = SESSION_STATUS_I18N[token]
  if (key && typeof t === 'function') {
    return t(key)
  }

  return token || '—'
}

export function telehealthParticipantStatusLabel(status, t) {
  const token = trimStr(status).toUpperCase()
  const key = PARTICIPANT_STATUS_I18N[token]
  if (key && typeof t === 'function') {
    return t(key)
  }

  return token || '—'
}

export function telehealthRoleLabel(role, t) {
  const token = trimStr(role).toUpperCase()
  const key = ROLE_I18N[token]
  if (key && typeof t === 'function') {
    return t(key)
  }

  return token || '—'
}

export function isTelemedicineAppointment(record) {
  if (!record || typeof record !== 'object') {
    return false
  }
  // Primary signal from appointment API.
  if (record.telemedicine === true) {
    return true
  }
  // Fallbacks when list/detail omit the flag but POS is telehealth.
  if (record.telemedicineAllowed === true) {
    return true
  }
  const nested = record.placeOfService ?? record.place_of_service
  const nestedObj = nested && typeof nested === 'object' ? nested : null
  const code = trimStr(
    record.placeOfServiceCode
    ?? record.place_of_service_code
    ?? nestedObj?.code,
  )
  if (code === '02' || code === '10') {
    return true
  }
  const name = trimStr(
    record.placeOfServiceName
    ?? record.place_of_service_name
    ?? nestedObj?.name
    ?? record.placeOfServiceDisplayName
    ?? record.place_of_service_display_name
    ?? nestedObj?.display_name
    ?? nestedObj?.displayName,
  ).toLowerCase()

  return (
    name.includes('tele')
    || name.includes('virtual')
    || name.includes('video')
  )
}

/** Active visit statuses where starting a teleconsult makes sense. */
export function canStartTelehealthForAppointmentStatus(status) {
  const token = trimStr(status).toUpperCase()

  return (
    token === 'PENDING'
    || token === 'SCHEDULED'
    || token === 'CHECKED_IN'
  )
}
