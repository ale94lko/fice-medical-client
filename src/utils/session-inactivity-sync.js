import {
  SESSION_WARNING_COUNTDOWN_SEC,
} from 'src/constants/session-inactivity.js'

export const sessionInactivityStorageKeys = {
  state: 'fice-medical-client.session-inactivity.state',
  closeLock: 'fice-medical-client.session-inactivity.close-lock',
  keepOpenLock: 'fice-medical-client.session-inactivity.keep-open-lock',
}

export const sessionInactivityBroadcastTypes = {
  activity: 'activity',
  warning: 'warning',
  dismiss: 'dismiss',
  keepOpenPending: 'keep-open-pending',
  keepOpenDone: 'keep-open-done',
  keepOpenFailed: 'keep-open-failed',
  closing: 'closing',
}

const CHANNEL_NAME = 'fice-medical-client-session-inactivity'
const CLOSE_LOCK_MS = 15_000
const KEEP_OPEN_LOCK_MS = 30_000
const SHARED_ACTIVITY_THROTTLE_MS = 1_000

let tabId = null
let broadcastChannel = null
let lastSharedActivityWriteAt = 0

function resolveTabId() {
  if (tabId) {
    return tabId
  }
  tabId = `tab-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

  return tabId
}

function parseSharedState(raw) {
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    const lastActivityAt = Number(parsed?.lastActivityAt)
    const warningDeadlineAt = parsed?.warningDeadlineAt == null
      ? null
      : Number(parsed.warningDeadlineAt)

    if (!Number.isFinite(lastActivityAt)) {
      return null
    }

    return {
      lastActivityAt,
      warningDeadlineAt: Number.isFinite(warningDeadlineAt)
        ? warningDeadlineAt
        : null,
    }
  } catch {
    return null
  }
}

export function readSharedSessionInactivityState() {
  if (typeof localStorage === 'undefined') {
    return null
  }

  return parseSharedState(
    localStorage.getItem(sessionInactivityStorageKeys.state),
  )
}

export function writeSharedSessionInactivityState(nextState) {
  if (typeof localStorage === 'undefined') {
    return null
  }

  const current = readSharedSessionInactivityState()
  const merged = {
    lastActivityAt: nextState.lastActivityAt
      ?? current?.lastActivityAt
      ?? Date.now(),
    warningDeadlineAt: nextState.warningDeadlineAt !== undefined
      ? nextState.warningDeadlineAt
      : current?.warningDeadlineAt ?? null,
  }

  localStorage.setItem(
    sessionInactivityStorageKeys.state,
    JSON.stringify(merged),
  )

  return merged
}

export function clearSharedSessionInactivityState() {
  if (typeof localStorage === 'undefined') {
    return
  }
  localStorage.removeItem(sessionInactivityStorageKeys.state)
  localStorage.removeItem(sessionInactivityStorageKeys.closeLock)
  localStorage.removeItem(sessionInactivityStorageKeys.keepOpenLock)
}

/**
 * Drop any leftover warning / stale activity clock (e.g. after login or
 * when starting monitoring for a newly authenticated session).
 */
export function beginFreshSessionInactivityClock() {
  clearSharedSessionInactivityState()
  lastSharedActivityWriteAt = 0

  return recordSharedSessionActivity({ force: true })
}

export function getSharedWarningSecondsRemaining() {
  const shared = readSharedSessionInactivityState()
  if (!shared?.warningDeadlineAt) {
    return 0
  }

  return Math.max(
    0,
    Math.ceil((shared.warningDeadlineAt - Date.now()) / 1000),
  )
}

export function isSharedWarningActive() {
  const shared = readSharedSessionInactivityState()
  if (!shared?.warningDeadlineAt) {
    return false
  }

  return shared.warningDeadlineAt > Date.now()
}

export function isSharedWarningExpired() {
  const shared = readSharedSessionInactivityState()
  if (!shared?.warningDeadlineAt) {
    return false
  }

  return shared.warningDeadlineAt <= Date.now()
}

export function prepareSharedSessionClose() {
  return writeSharedSessionInactivityState({
    lastActivityAt: Date.now(),
    warningDeadlineAt: null,
  })
}

export function recordSharedSessionActivity({ force = false } = {}) {
  const now = Date.now()
  if (
    !force
    && now - lastSharedActivityWriteAt < SHARED_ACTIVITY_THROTTLE_MS
  ) {
    return readSharedSessionInactivityState()
  }

  lastSharedActivityWriteAt = now
  const state = writeSharedSessionInactivityState({
    lastActivityAt: now,
    warningDeadlineAt: null,
  })

  postSessionInactivityBroadcast({
    type: sessionInactivityBroadcastTypes.activity,
    state,
  })

  return state
}

export function startSharedSessionWarning() {
  const shared = readSharedSessionInactivityState()
  if (shared?.warningDeadlineAt && shared.warningDeadlineAt > Date.now()) {
    return shared
  }

  const warningDeadlineAt = Date.now()
    + (SESSION_WARNING_COUNTDOWN_SEC * 1000)
  const state = writeSharedSessionInactivityState({
    warningDeadlineAt,
  })

  postSessionInactivityBroadcast({
    type: sessionInactivityBroadcastTypes.warning,
    state,
  })

  return state
}

export function dismissSharedSessionWarning(lastActivityAt = Date.now()) {
  const state = writeSharedSessionInactivityState({
    lastActivityAt,
    warningDeadlineAt: null,
  })

  postSessionInactivityBroadcast({
    type: sessionInactivityBroadcastTypes.dismiss,
    state,
  })

  return state
}

function readLock(storageKey) {
  if (typeof localStorage === 'undefined') {
    return null
  }
  const raw = localStorage.getItem(storageKey)
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeLock(storageKey, lockMs) {
  const currentTabId = resolveTabId()
  const payload = {
    tabId: currentTabId,
    at: Date.now(),
  }
  const existing = readLock(storageKey)
  if (
    existing?.tabId
    && existing.tabId !== currentTabId
    && Date.now() - Number(existing.at) < lockMs
  ) {
    return false
  }

  localStorage.setItem(storageKey, JSON.stringify(payload))

  return readLock(storageKey)?.tabId === currentTabId
}

export function claimSessionInactivityCloseLock() {
  return writeLock(
    sessionInactivityStorageKeys.closeLock,
    CLOSE_LOCK_MS,
  )
}

export function claimSessionInactivityKeepOpenLock() {
  return writeLock(
    sessionInactivityStorageKeys.keepOpenLock,
    KEEP_OPEN_LOCK_MS,
  )
}

export function releaseSessionInactivityKeepOpenLock() {
  const lock = readLock(sessionInactivityStorageKeys.keepOpenLock)
  if (lock?.tabId === resolveTabId()) {
    localStorage.removeItem(sessionInactivityStorageKeys.keepOpenLock)
  }
}

function postSessionInactivityBroadcast(message) {
  if (typeof BroadcastChannel === 'undefined') {
    return
  }
  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME)
  }
  broadcastChannel.postMessage({
    ...message,
    sourceTabId: resolveTabId(),
  })
}

export function subscribeSessionInactivityBroadcast(handler) {
  const listeners = []

  if (typeof BroadcastChannel !== 'undefined') {
    if (!broadcastChannel) {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME)
    }
    const onMessage = event => {
      if (event.data?.sourceTabId === resolveTabId()) {
        return
      }
      handler(event.data)
    }
    broadcastChannel.addEventListener('message', onMessage)
    listeners.push(() => {
      broadcastChannel?.removeEventListener('message', onMessage)
    })
  }

  if (typeof window !== 'undefined') {
    const onStorage = event => {
      if (event.key !== sessionInactivityStorageKeys.state) {
        return
      }
      const state = parseSharedState(event.newValue)
      if (!state) {
        handler({
          type: sessionInactivityBroadcastTypes.dismiss,
          state: null,
        })
        return
      }
      if (state.warningDeadlineAt && state.warningDeadlineAt > Date.now()) {
        handler({
          type: sessionInactivityBroadcastTypes.warning,
          state,
        })
        return
      }
      handler({
        type: sessionInactivityBroadcastTypes.activity,
        state,
      })
    }
    window.addEventListener('storage', onStorage)
    listeners.push(() => {
      window.removeEventListener('storage', onStorage)
    })
  }

  return () => {
    listeners.forEach(unsubscribe => unsubscribe())
  }
}

export function broadcastSessionInactivityClosing() {
  postSessionInactivityBroadcast({
    type: sessionInactivityBroadcastTypes.closing,
  })
}

export function broadcastSessionInactivityKeepOpenPending() {
  postSessionInactivityBroadcast({
    type: sessionInactivityBroadcastTypes.keepOpenPending,
  })
}

export function broadcastSessionInactivityKeepOpenDone(state) {
  postSessionInactivityBroadcast({
    type: sessionInactivityBroadcastTypes.keepOpenDone,
    state,
  })
}

export function broadcastSessionInactivityKeepOpenFailed() {
  postSessionInactivityBroadcast({
    type: sessionInactivityBroadcastTypes.keepOpenFailed,
  })
}
