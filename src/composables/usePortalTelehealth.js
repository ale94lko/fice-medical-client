import { computed, ref } from 'vue'
import {
  telehealthHeartbeatIntervalMs,
  telehealthParticipantStatuses,
  telehealthRoles,
  telehealthSessionStatuses,
} from 'src/utils/telehealth-constants.js'
import {
  apiErrorMessage,
  getTelehealthSession,
  joinTelehealthSession,
  leaveTelehealthSession,
  listTelehealthChat,
  markWaitingRoomReady,
  postTelehealthChat,
  sendTelehealthHeartbeat,
  setPortalAppointmentId,
} from 'src/utils/portal-telehealth-api.js'
import {
  formatTelehealthElapsedLabel,
  isTelehealthTerminalStatus,
  mapParticipantsFromApi,
  normalizeTelehealthChatMessage,
  normalizeTelehealthParticipant,
  resolveTelehealthDurationSeconds,
  resolveTelehealthElapsedSeconds,
} from 'src/utils/telehealth-normalize.js'
import { createTelehealthStompClient } from 'src/utils/telehealth-stomp.js'
import { useTelehealthWebRtc } from 'src/composables/useTelehealthWebRtc.js'

function findSelfParticipant(session, role, displayName) {
  const list = session?.participants ?? []
  const selfId = toSessionSelfId(session)
  if (selfId != null) {
    const byId = list.find(p => p.id === selfId)
    if (byId) {
      return byId
    }
  }
  const byRole = list.filter(p => isClientLikeRole(p.role)
    || p.role === String(role ?? '').toUpperCase())
  if (byRole.length === 1) {
    return byRole[0]
  }
  const name = String(displayName ?? '').trim().toLowerCase()
  if (name) {
    const byName = byRole.find(
      p => String(p.displayName ?? '').trim().toLowerCase() === name,
    )
    if (byName) {
      return byName
    }
  }

  return byRole[0] || null
}

function toSessionSelfId(session) {
  const raw = session?.selfParticipantId
  if (raw == null || raw === '') {
    return null
  }
  const n = Number(raw)

  return Number.isFinite(n) ? n : null
}

function isClientLikeRole(role) {
  const token = String(role ?? '').toUpperCase()

  return (
    token === telehealthRoles.client
    || token === telehealthRoles.guest
    || token === 'PATIENT'
  )
}

function isParticipantInCallStatus(status) {
  const token = String(status ?? '').toUpperCase()

  return (
    token === telehealthParticipantStatuses.admitted
    || token === telehealthParticipantStatuses.inSession
    || token === 'IN_CALL'
    || token === 'CONNECTED'
  )
}

function isParticipantLeft(status) {
  const token = String(status ?? '').toUpperCase()

  return token === telehealthParticipantStatuses.left || token === 'LEFT'
}

function findRemoteParticipant(session, selfId) {
  const selfNum = Number(selfId)
  const list = (session?.participants ?? []).filter(
    p => p.id != null && Number(p.id) !== selfNum,
  )
  const clinicianPeer = list.find(
    p => p.role === telehealthRoles.clinician && !isParticipantLeft(p.status),
  )
  if (clinicianPeer) {
    return clinicianPeer
  }
  const active = list.filter(p => isParticipantInCallStatus(p.status))

  return active[0] || null
}

function isParticipantAdmitted(participant) {
  return isParticipantInCallStatus(participant?.status)
}

function mergeParticipants(current = [], incoming = []) {
  const byId = new Map()
  for (const participant of current) {
    if (participant?.id != null) {
      byId.set(participant.id, participant)
    }
  }
  for (const participant of incoming) {
    if (participant?.id == null) {
      continue
    }
    byId.set(participant.id, {
      ...(byId.get(participant.id) || {}),
      ...participant,
    })
  }

  return [...byId.values()]
}

function participantsFromWaitingPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    return []
  }
  const body = payload.data && typeof payload.data === 'object'
    ? payload.data
    : payload
  const list = body.participants
    ?? body.participant_list
    ?? body.waiting_participants
    ?? body.waitingParticipants
  if (Array.isArray(list)) {
    return mapParticipantsFromApi(list)
  }
  const single = body.participant
    || (
      body.id != null && (body.role || body.status)
        ? body
        : null
    )
  const normalized = normalizeTelehealthParticipant(single)

  return normalized ? [normalized] : []
}

function findParticipantById(session, participantId) {
  if (participantId == null) {
    return null
  }

  return (session?.participants ?? []).find(
    p => p.id === participantId,
  ) || null
}

function mergeChatList(current, incoming) {
  const list = Array.isArray(incoming) ? incoming : []
  if (!list.length) {
    return current
  }
  const byId = new Map(current.map(item => [item.id, item]))
  for (const msg of list) {
    if (msg?.id == null || msg.type === 'message_deleted') {
      continue
    }
    byId.set(msg.id, msg)
  }

  return [...byId.values()].sort((a, b) => {
    const aTime = String(a.createdAt || '')
    const bTime = String(b.createdAt || '')
    if (aTime && bTime && aTime !== bTime) {
      return aTime.localeCompare(bTime)
    }

    return Number(a.id) - Number(b.id)
  })
}

function mergeSessionSnapshot(prev, next) {
  const nextParticipants = Array.isArray(next.participants)
    ? next.participants
    : null
  const mergedParticipants = nextParticipants == null
    ? (prev.participants ?? [])
    : (
      nextParticipants.length
        ? mergeParticipants(prev.participants, nextParticipants)
        : nextParticipants
    )

  return {
    ...next,
    iceServers: next.iceServers?.length
      ? next.iceServers
      : (prev.iceServers ?? []),
    clinicianDisplayName:
      next.clinicianDisplayName || prev.clinicianDisplayName || null,
    appointmentSummary:
      next.appointmentSummary || prev.appointmentSummary || null,
    participants: mergedParticipants,
  }
}

function normalizeIncomingSignal(payload) {
  if (!payload || typeof payload !== 'object') {
    return null
  }
  const nested = payload.data
  if (
    nested
    && typeof nested === 'object'
    && !Array.isArray(nested)
    && payload.type == null
    && nested.type != null
  ) {
    return nested
  }

  return payload
}

function isWebRtcConnected(webrtc) {
  const state = String(webrtc.connectionState.value || '')
  const ice = String(webrtc.iceConnectionState.value || '')

  return state === 'connected'
    || ice === 'connected'
    || ice === 'completed'
}

function shouldRecoverWebRtc(webrtc) {
  const state = String(webrtc.connectionState.value || '')
  const ice = String(webrtc.iceConnectionState.value || '')

  return (
    state === 'failed'
    || state === 'disconnected'
    || state === 'closed'
    || ice === 'failed'
    || ice === 'disconnected'
    || ice === 'closed'
  )
}

function createRuntime() {
  const mut = {
    stomp: null,
    heartbeatTimer: null,
    pollTimer: null,
    chatPollTimer: null,
    elapsedTimer: null,
    mediaStarted: false,
    webrtcStarted: false,
    callStartedAtMs: null,
    clientAdmittedOnce: false,
  }

  return {
    session: ref(null),
    role: ref(telehealthRoles.client),
    displayName: ref(''),
    selfParticipantId: ref(null),
    phase: ref('lobby'),
    loading: ref(false),
    error: ref(''),
    chatMessages: ref([]),
    stompConnected: ref(false),
    lastCallDurationSeconds: ref(null),
    nowTick: ref(Date.now()),
    webrtc: useTelehealthWebRtc(),
    mut,
  }
}

function bindChat(rt) {
  function upsertChatMessage(msg) {
    if (!msg || msg.type === 'message_deleted') {
      return
    }
    if (rt.chatMessages.value.some(m => m.id === msg.id)) {
      return
    }
    rt.chatMessages.value = [...rt.chatMessages.value, msg]
  }

  function applyChatPayload(payload) {
    const msg = normalizeTelehealthChatMessage(payload)
    if (!msg) {
      return
    }
    if (msg.type === 'message_deleted') {
      rt.chatMessages.value = rt.chatMessages.value.filter(
        m => m.id !== msg.messageId,
      )

      return
    }
    upsertChatMessage(msg)
  }

  function mergeChatMessages(incoming) {
    rt.chatMessages.value = mergeChatList(
      rt.chatMessages.value,
      incoming,
    )
  }

  function stopChatPolling() {
    if (rt.mut.chatPollTimer) {
      clearInterval(rt.mut.chatPollTimer)
      rt.mut.chatPollTimer = null
    }
  }

  function startChatPolling() {
    stopChatPolling()
    rt.mut.chatPollTimer = setInterval(() => {
      if (rt.phase.value !== 'in_call') {
        return
      }
      listTelehealthChat()
        .then(mergeChatMessages)
        .catch(() => {})
    }, 2500)
  }

  async function loadChat() {
    mergeChatMessages(await listTelehealthChat())
  }

  async function sendChat(body) {
    const text = String(body ?? '').trim()
    if (!text) {
      return null
    }
    const msg = await postTelehealthChat(null, text)
    upsertChatMessage(msg)

    return msg
  }

  Object.assign(rt, {
    applyChatPayload,
    mergeChatMessages,
    stopChatPolling,
    startChatPolling,
    loadChat,
    sendChat,
  })
}

function resolveSelfParticipant(rt, sess = rt.session.value) {
  if (rt.selfParticipantId.value != null) {
    const byId = findParticipantById(sess, rt.selfParticipantId.value)
    if (byId) {
      return byId
    }
  }

  return findSelfParticipant(
    sess,
    rt.role.value,
    rt.displayName.value,
  )
}

function isSelfAdmitted(rt, sess = rt.session.value) {
  return isParticipantAdmitted(resolveSelfParticipant(rt, sess))
}

function hasActiveMeetPresence(sess, selfId) {
  return (sess?.participants ?? []).some(participant => {
    if (participant?.id == null || participant.id === selfId) {
      return false
    }

    return isParticipantAdmitted(participant)
  })
}

function canClientReenterMeet(rt, sess = rt.session.value) {
  if (!rt.mut.clientAdmittedOnce) {
    return false
  }
  if (sess?.status !== telehealthSessionStatuses.inProgress) {
    return false
  }

  return hasActiveMeetPresence(sess, rt.selfParticipantId.value)
}

function shouldClientEnterCall(rt, sess = rt.session.value) {
  return (
    sess?.status === telehealthSessionStatuses.inProgress
    && (isSelfAdmitted(rt, sess) || canClientReenterMeet(rt, sess))
  )
}

function bindClocks(rt) {
  function stopElapsedTicker() {
    if (rt.mut.elapsedTimer == null) {
      return
    }
    window.clearInterval(rt.mut.elapsedTimer)
    rt.mut.elapsedTimer = null
  }

  function startElapsedTicker() {
    if (rt.mut.elapsedTimer != null || typeof window === 'undefined') {
      return
    }
    rt.nowTick.value = Date.now()
    rt.mut.elapsedTimer = window.setInterval(() => {
      rt.nowTick.value = Date.now()
    }, 1000)
  }

  function syncCallClockFromSession(sess = rt.session.value) {
    const startIso = String(sess?.startedAtUtc ?? '').trim()
    if (!startIso) {
      return
    }
    const startMs = new Date(startIso).getTime()
    if (Number.isFinite(startMs)) {
      rt.mut.callStartedAtMs = startMs
    }
  }

  function markCallClock() {
    syncCallClockFromSession()
    if (rt.mut.callStartedAtMs == null) {
      rt.mut.callStartedAtMs = Date.now()
    }
    startElapsedTicker()
  }

  function captureCallDuration() {
    const seconds = resolveTelehealthDurationSeconds(
      rt.session.value,
      rt.mut.callStartedAtMs,
    )
    if (seconds != null && seconds > 0) {
      rt.lastCallDurationSeconds.value = seconds
    }
    rt.mut.callStartedAtMs = null
    stopElapsedTicker()
  }

  Object.assign(rt, {
    stopElapsedTicker,
    startElapsedTicker,
    syncCallClockFromSession,
    markCallClock,
    captureCallDuration,
  })
}

function bindTimers(rt) {
  function stopHeartbeat() {
    if (rt.mut.heartbeatTimer) {
      clearInterval(rt.mut.heartbeatTimer)
      rt.mut.heartbeatTimer = null
    }
  }

  function startHeartbeat() {
    stopHeartbeat()
    rt.mut.heartbeatTimer = setInterval(() => {
      if (rt.session.value?.id) {
        sendTelehealthHeartbeat().catch(() => {})
      }
    }, telehealthHeartbeatIntervalMs)
  }

  function stopPolling() {
    if (rt.mut.pollTimer) {
      clearInterval(rt.mut.pollTimer)
      rt.mut.pollTimer = null
    }
  }

  function startPolling() {
    stopPolling()
    rt.mut.pollTimer = setInterval(() => {
      rt.refreshSession()
        .then(next => {
          rt.tryEnterCallAfterAdmitCheck(next)
        })
        .catch(() => {})
    }, 2000)
  }

  Object.assign(rt, {
    stopHeartbeat,
    startHeartbeat,
    stopPolling,
    startPolling,
  })
}

function applyWaitingPayload(rt, payload) {
  const incoming = participantsFromWaitingPayload(payload)
  if (!incoming.length || !rt.session.value) {
    return
  }
  rt.session.value = {
    ...rt.session.value,
    participants: mergeParticipants(
      rt.session.value.participants,
      incoming,
    ),
  }
}

function teardownStomp(rt) {
  rt.mut.stomp?.disconnect()
  rt.mut.stomp = null
  rt.stompConnected.value = false
}

function teardownMedia(rt) {
  rt.webrtc.cleanup()
  rt.mut.mediaStarted = false
  rt.mut.webrtcStarted = false
  rt.stopChatPolling()
  teardownStomp(rt)
}

function setError(rt, err, fallback) {
  rt.error.value = apiErrorMessage(err, fallback)
}

function clearError(rt) {
  rt.error.value = ''
}

function applyPreCallPhase(rt) {
  if (rt.phase.value === 'lobby') {
    return
  }
  rt.phase.value = 'waiting'
  rt.stopElapsedTicker()
}

function applyInProgressPhase(rt) {
  if (!isSelfAdmitted(rt) && !canClientReenterMeet(rt)) {
    if (rt.phase.value !== 'lobby') {
      rt.phase.value = 'waiting'
    }

    return
  }
  rt.mut.clientAdmittedOnce = true
  const wasWaiting = rt.phase.value === 'waiting'
  rt.phase.value = 'in_call'
  rt.startElapsedTicker()
  if (wasWaiting && !rt.mut.mediaStarted) {
    void rt.ensureInCallMedia()
  }
}

function applySession(rt, next, options = {}) {
  if (!next) {
    return
  }
  const syncPhase = options.syncPhase !== false
  rt.session.value = mergeSessionSnapshot(rt.session.value || {}, next)
  rt.syncCallClockFromSession(rt.session.value)
  if (!syncPhase) {
    return
  }
  if (isTelehealthTerminalStatus(next.status)) {
    rt.phase.value = 'ended'
    rt.mut.clientAdmittedOnce = false
    rt.stopHeartbeat()
    rt.stopPolling()
    rt.stopChatPolling()
    rt.stopElapsedTicker()
    teardownMedia(rt)

    return
  }
  if (next.status === telehealthSessionStatuses.inProgress) {
    applyInProgressPhase(rt)

    return
  }
  if (
    next.status === telehealthSessionStatuses.waitingRoom
    || next.status === telehealthSessionStatuses.ready
    || next.status === telehealthSessionStatuses.scheduled
  ) {
    applyPreCallPhase(rt)
  }
}

async function refreshSession(rt) {
  if (!rt.session.value?.id) {
    return null
  }
  const next = await getTelehealthSession()
  applySession(rt, next)

  return next
}

function stompOptions(rt, extra = {}) {
  return {
    sessionId: rt.session.value?.id,
    onError: err => {
      const message = String(
        err?.message
        ?? err
        ?? 'Telehealth realtime connection failed',
      )
      if (message) {
        rt.error.value = message
      }
    },
    ...extra,
  }
}

async function ensureWaitingPreview(
  rt,
  previewStream = null,
  mediaPrefs = {},
) {
  try {
    if (previewStream) {
      rt.webrtc.adoptLocalStream(previewStream, mediaPrefs)
    }
    if (!rt.webrtc.localStream.value) {
      await rt.webrtc.getLocalMedia({ audio: true, video: true })
      if (mediaPrefs.audioEnabled != null) {
        rt.webrtc.setAudioEnabled(mediaPrefs.audioEnabled)
      }
      if (mediaPrefs.videoEnabled != null) {
        rt.webrtc.setVideoEnabled(mediaPrefs.videoEnabled)
      }
      if (mediaPrefs.speakerEnabled != null) {
        rt.webrtc.setSpeakerEnabled(mediaPrefs.speakerEnabled)
      }
    }
  } catch (err) {
    setError(rt, err, 'Could not start camera preview')
  }
}

function announcePeerReady(rt, remoteId) {
  if (!remoteId || !rt.mut.stomp?.isConnected?.()) {
    return
  }
  rt.mut.stomp.sendSignal({
    type: 'peer_ready',
    fromParticipantId: rt.selfParticipantId.value,
    toParticipantId: remoteId,
    role: rt.role.value,
  })
}

function schedulePeerReadyPings(rt, remoteId) {
  announcePeerReady(rt, remoteId)
  ;[1000, 2500, 5000].forEach(delayMs => {
    window.setTimeout(() => {
      if (rt.phase.value !== 'in_call' || isWebRtcConnected(rt.webrtc)) {
        return
      }
      announcePeerReady(rt, remoteId)
    }, delayMs)
  })
}

function tryStartWebRtc(rt, { force = false } = {}) {
  if (!rt.mut.stomp?.isConnected?.() || !rt.selfParticipantId.value) {
    return
  }
  const remote = findRemoteParticipant(
    rt.session.value,
    rt.selfParticipantId.value,
  )
  if (!remote?.id) {
    return
  }
  let shouldForce = force
  if (rt.mut.webrtcStarted && !shouldForce) {
    if (isWebRtcConnected(rt.webrtc)) {
      return
    }
    shouldForce = shouldRecoverWebRtc(rt.webrtc)
    if (!shouldForce) {
      return
    }
  }
  startPortalPeerConnection(rt, remote, shouldForce)
}

function startPortalPeerConnection(rt, remote, shouldForce) {
  try {
    if (shouldForce) {
      rt.webrtc.closePeerConnection({ keepLocal: true })
      rt.mut.webrtcStarted = false
    }
    rt.mut.webrtcStarted = true
    rt.webrtc.startCall({
      iceServers: rt.session.value?.iceServers ?? [],
      selfId: rt.selfParticipantId.value,
      remoteId: remote.id,
      publishSignal: body => rt.mut.stomp?.sendSignal(body),
      isPolite: true,
      offerImmediately: false,
    }).then(() => {
      schedulePeerReadyPings(rt, remote.id)
    }).catch(() => {
      rt.mut.webrtcStarted = false
    })
  } catch {
    rt.mut.webrtcStarted = false
  }
}

function handleCallSignal(rt, payload) {
  const msg = normalizeIncomingSignal(payload)
  const type = String(msg?.type ?? '')
    .toLowerCase()
    .replace(/_/g, '-')
  if (type === 'peer-ready' || type === 'webrtc-ready') {
    return
  }
  if (type === 'screen-share-start') {
    rt.webrtc.setRemoteScreenSharing(
      true,
      msg?.streamId ?? msg?.stream_id ?? null,
    )
    refreshSession(rt).catch(() => {})

    return
  }
  if (type === 'screen-share-stop') {
    rt.webrtc.setRemoteScreenSharing(false)
    refreshSession(rt).catch(() => {})

    return
  }
  rt.webrtc.handleSignal(msg)
}

function connectStompAndCall(rt) {
  const id = rt.session.value?.id
  if (!id) {
    return
  }
  teardownStomp(rt)
  rt.mut.stomp = createTelehealthStompClient(stompOptions(rt, {
    onSignal: payload => handleCallSignal(rt, payload),
    onWaiting: () => {
      refreshSession(rt)
        .then(() => tryStartWebRtc(rt))
        .catch(() => {})
    },
    onChat: rt.applyChatPayload,
    onConnect: () => {
      rt.stompConnected.value = true
      tryStartWebRtc(rt)
    },
    onDisconnect: () => {
      rt.stompConnected.value = false
    },
  }))
  rt.mut.stomp.connect()
}

function scheduleGuestWebRtcRetries(rt) {
  ;[500, 2000, 4000].forEach(delayMs => {
    window.setTimeout(() => {
      if (rt.phase.value !== 'in_call' || isWebRtcConnected(rt.webrtc)) {
        return
      }
      tryStartWebRtc(rt, {
        force: rt.mut.webrtcStarted && shouldRecoverWebRtc(rt.webrtc),
      })
    }, delayMs)
  })
}

async function ensureInCallMedia(rt) {
  if (rt.mut.mediaStarted || !rt.session.value?.id) {
    return
  }
  rt.mut.mediaStarted = true
  rt.mut.clientAdmittedOnce = true
  rt.markCallClock()
  rt.phase.value = 'in_call'
  rt.startHeartbeat()
  rt.stopPolling()
  try {
    if (!rt.webrtc.localStream.value) {
      await rt.webrtc.getLocalMedia({ audio: true, video: true })
    }
    connectStompAndCall(rt)
    scheduleGuestWebRtcRetries(rt)
    await rt.loadChat()
    rt.startChatPolling()
  } catch (err) {
    rt.mut.mediaStarted = false
    rt.stopChatPolling()
    setError(rt, err, 'Could not start media')
  }
}

function tryEnterCallAfterAdmitCheck(rt, sess) {
  if (!shouldClientEnterCall(rt, sess || rt.session.value)) {
    return false
  }
  void ensureInCallMedia(rt)

  return true
}

function connectWaitingStomp(rt, sessionId) {
  teardownStomp(rt)
  rt.mut.stomp = createTelehealthStompClient(stompOptions(rt, {
    sessionId,
    onChat: rt.applyChatPayload,
    onWaiting: payload => {
      applyWaitingPayload(rt, payload)
      if (tryEnterCallAfterAdmitCheck(rt, rt.session.value)) {
        return
      }
      refreshSession(rt)
        .then(next => tryEnterCallAfterAdmitCheck(rt, next))
        .catch(() => {})
    },
    onConnect: () => {
      rt.stompConnected.value = true
      refreshSession(rt)
        .then(next => tryEnterCallAfterAdmitCheck(rt, next))
        .catch(() => {})
    },
    onDisconnect: () => {
      rt.stompConnected.value = false
    },
  }))
  rt.mut.stomp.connect()
}

async function enterClientWaiting(rt, previewStream, mediaPrefs, sessionId) {
  rt.phase.value = 'waiting'
  await ensureWaitingPreview(rt, previewStream, mediaPrefs)
  rt.startPolling()
  connectWaitingStomp(rt, sessionId)
}

async function enterClientAfterJoin(
  rt,
  previewStream,
  mediaPrefs,
  sessionId,
  joined,
) {
  if (canClientReenterMeet(rt, joined)) {
    await ensureWaitingPreview(rt, previewStream, mediaPrefs)
    await ensureInCallMedia(rt)

    return
  }
  await enterClientWaiting(rt, previewStream, mediaPrefs, sessionId)
}

async function resolveJoinSession(rt) {
  try {
    return await joinTelehealthSession(null, {
      displayName: rt.displayName.value,
    })
  } catch (err) {
    const status = Number(err?.response?.status)
    if (status !== 400 && status !== 409) {
      throw err
    }
    const existing = await getTelehealthSession()
    const self = findSelfParticipant(
      existing,
      telehealthRoles.client,
      rt.displayName.value,
    )
    if (!existing?.selfParticipantId && !self) {
      throw err
    }

    return existing
  }
}

function bindActions(rt) {
  rt.refreshSession = () => refreshSession(rt)
  rt.ensureInCallMedia = () => ensureInCallMedia(rt)
  rt.tryEnterCallAfterAdmitCheck = sess => (
    tryEnterCallAfterAdmitCheck(rt, sess)
  )

  async function beginLobbyEntry() {
    rt.lastCallDurationSeconds.value = null
    rt.mut.callStartedAtMs = null
    rt.stopElapsedTicker()
    if (rt.phase.value === 'in_call' || rt.phase.value === 'waiting') {
      await leave().catch(() => {})
    } else {
      rt.stopHeartbeat()
      rt.stopPolling()
      teardownMedia(rt)
    }
    rt.phase.value = 'lobby'
    rt.session.value = null
    rt.selfParticipantId.value = null
    clearError(rt)

    return { restored: false }
  }

  async function join({
    name,
    previewStream = null,
    mediaPrefs = {},
  } = {}) {
    rt.loading.value = true
    clearError(rt)
    try {
      rt.role.value = telehealthRoles.client
      rt.displayName.value = String(name ?? '').trim()
      const joined = await resolveJoinSession(rt)
      const self = findSelfParticipant(
        joined,
        rt.role.value,
        rt.displayName.value,
      )
      rt.selfParticipantId.value = joined.selfParticipantId ?? self?.id ?? null
      applySession(rt, joined)
      await enterClientAfterJoin(
        rt,
        previewStream,
        mediaPrefs,
        joined?.id,
        joined,
      )

      return joined
    } catch (err) {
      setError(rt, err, 'Could not join session')
      throw err
    } finally {
      rt.loading.value = false
    }
  }

  async function markReady(flags = {}) {
    rt.loading.value = true
    clearError(rt)
    try {
      await markWaitingRoomReady(null, {
        cameraTested: flags.cameraTested,
        microphoneTested: flags.microphoneTested,
        speakerTested: flags.speakerTested,
        ready: true,
      })
    } catch (err) {
      setError(rt, err, 'Could not update waiting room')
    } finally {
      rt.loading.value = false
    }
  }

  async function leave() {
    rt.loading.value = true
    clearError(rt)
    try {
      if (rt.session.value?.id) {
        const next = await leaveTelehealthSession()
        if (next) {
          applySession(rt, next)
        }
      }
    } catch (err) {
      setError(rt, err, 'Could not leave session')
    } finally {
      rt.captureCallDuration()
      rt.loading.value = false
      rt.stopHeartbeat()
      rt.stopPolling()
      teardownMedia(rt)
      if (!isTelehealthTerminalStatus(rt.session.value?.status)) {
        rt.phase.value = 'ended'
      }
    }
  }

  Object.assign(rt, { beginLobbyEntry, join, markReady, leave })
}

function createTelehealthSessionState() {
  const rt = createRuntime()
  bindChat(rt)
  bindClocks(rt)
  bindTimers(rt)
  bindActions(rt)

  const elapsedSeconds = computed(() => {
    rt.nowTick.value
    if (rt.phase.value !== 'in_call') {
      return null
    }

    return resolveTelehealthElapsedSeconds(
      rt.session.value,
      rt.mut.callStartedAtMs,
      Date.now(),
    )
  })
  const elapsedLabel = computed(() => {
    if (rt.phase.value !== 'in_call') {
      return ''
    }

    return formatTelehealthElapsedLabel(elapsedSeconds.value)
  })

  return {
    session: rt.session,
    displayName: rt.displayName,
    selfParticipantId: rt.selfParticipantId,
    phase: rt.phase,
    loading: rt.loading,
    error: rt.error,
    chatMessages: rt.chatMessages,
    lastCallDurationSeconds: rt.lastCallDurationSeconds,
    elapsedLabel,
    webrtc: rt.webrtc,
    beginLobbyEntry: rt.beginLobbyEntry,
    join: rt.join,
    markReady: rt.markReady,
    leave: rt.leave,
    sendChat: rt.sendChat,
  }
}

function bindAppointment(id) {
  setPortalAppointmentId(id)
}

let sharedTelehealthSession = null

export function usePortalTelehealth() {
  if (!sharedTelehealthSession) {
    sharedTelehealthSession = createTelehealthSessionState()
  }

  return {
    ...sharedTelehealthSession,
    bindAppointment,
  }
}
