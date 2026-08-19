import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth-store.js'
import {
  refreshAccessToken,
  clearSessionAndRedirectToLogin,
} from 'boot/axios'
import {
  SESSION_ACTIVITY_EVENTS,
  SESSION_CAPTURE_ACTIVITY_EVENTS,
  SESSION_INACTIVITY_MS,
} from 'src/constants/session-inactivity.js'
import {
  formatSessionCountdown,
  resolveSessionInactivityMs,
} from 'src/utils/session-countdown.js'
import {
  broadcastSessionInactivityClosing,
  broadcastSessionInactivityKeepOpenDone,
  broadcastSessionInactivityKeepOpenFailed,
  broadcastSessionInactivityKeepOpenPending,
  beginFreshSessionInactivityClock,
  claimSessionInactivityCloseLock,
  claimSessionInactivityKeepOpenLock,
  dismissSharedSessionWarning,
  getSharedWarningSecondsRemaining,
  isSharedWarningActive,
  isSharedWarningExpired,
  prepareSharedSessionClose,
  readSharedSessionInactivityState,
  recordSharedSessionActivity,
  releaseSessionInactivityKeepOpenLock,
  sessionInactivityBroadcastTypes,
  startSharedSessionWarning,
  subscribeSessionInactivityBroadcast,
} from 'src/utils/session-inactivity-sync.js'

const IMMEDIATE_SHARED_ACTIVITY_EVENTS = new Set([
  'mousedown',
  'keydown',
  'touchstart',
  'click',
])

export function useSessionInactivity() {
  const router = useRouter()
  const authStore = useAuthStore()

  const warningVisible = ref(false)
  const secondsRemaining = ref(0)
  const keepOpenLoading = ref(false)
  const closingSection = ref(false)

  let tickTimer = null
  let unsubscribeBroadcast = null
  const inactivityMs = resolveSessionInactivityMs() ?? SESSION_INACTIVITY_MS

  const formattedCountdown = computed(() =>
    formatSessionCountdown(secondsRemaining.value),
  )

  function syncUIFromSharedState() {
    const remaining = getSharedWarningSecondsRemaining()
    if (remaining > 0) {
      warningVisible.value = true
      secondsRemaining.value = remaining
      return
    }

    warningVisible.value = false
    secondsRemaining.value = 0
  }

  function recordActivity(event) {
    if (warningVisible.value || closingSection.value) {
      return
    }

    const force = IMMEDIATE_SHARED_ACTIVITY_EVENTS.has(event?.type)
    recordSharedSessionActivity({ force })
    syncUIFromSharedState()
  }

  function showWarning() {
    if (isSharedWarningActive()) {
      syncUIFromSharedState()
      return
    }

    startSharedSessionWarning()
    syncUIFromSharedState()
  }

  function resetActivityClock() {
    dismissSharedSessionWarning()
    syncUIFromSharedState()
  }

  async function closeSection() {
    if (closingSection.value) {
      return
    }

    if (!claimSessionInactivityCloseLock()) {
      closingSection.value = true
      warningVisible.value = false
      return
    }

    prepareSharedSessionClose()
    closingSection.value = true
    warningVisible.value = false
    broadcastSessionInactivityClosing()

    try {
      await authStore.logout(router)
    } catch {
      await clearSessionAndRedirectToLogin()
    } finally {
      closingSection.value = false
    }
  }

  async function keepSectionOpen() {
    if (keepOpenLoading.value || closingSection.value) {
      return
    }

    if (!claimSessionInactivityKeepOpenLock()) {
      keepOpenLoading.value = true
      return
    }

    keepOpenLoading.value = true
    broadcastSessionInactivityKeepOpenPending()

    try {
      await refreshAccessToken()
      const state = dismissSharedSessionWarning()
      broadcastSessionInactivityKeepOpenDone(state)
      syncUIFromSharedState()
    } catch {
      broadcastSessionInactivityKeepOpenFailed()
      await closeSection()
    } finally {
      keepOpenLoading.value = false
      releaseSessionInactivityKeepOpenLock()
    }
  }

  function handleBroadcastMessage(message) {
    if (!message?.type) {
      return
    }

    switch (message.type) {
      case sessionInactivityBroadcastTypes.activity:
      case sessionInactivityBroadcastTypes.dismiss:
      case sessionInactivityBroadcastTypes.keepOpenDone:
        keepOpenLoading.value = false
        syncUIFromSharedState()
        break
      case sessionInactivityBroadcastTypes.warning:
        syncUIFromSharedState()
        break
      case sessionInactivityBroadcastTypes.keepOpenPending:
        keepOpenLoading.value = true
        break
      case sessionInactivityBroadcastTypes.keepOpenFailed:
        keepOpenLoading.value = false
        break
      case sessionInactivityBroadcastTypes.closing:
        closingSection.value = true
        warningVisible.value = false
        break
      default:
        break
    }
  }

  function tick() {
    if (!authStore.isAuthenticated) {
      resetActivityClock()
      return
    }

    if (closingSection.value) {
      return
    }

    if (isSharedWarningExpired()) {
      void closeSection()
      return
    }

    const shared = readSharedSessionInactivityState()
    const lastActivityAt = shared?.lastActivityAt ?? Date.now()

    if (isSharedWarningActive()) {
      syncUIFromSharedState()
      return
    }

    warningVisible.value = false
    secondsRemaining.value = 0

    if (Date.now() - lastActivityAt >= inactivityMs) {
      showWarning()
    }
  }

  function startMonitoring() {
    if (typeof window === 'undefined') {
      return
    }

    // Never rehydrate a warning from a previous session after auth.
    beginFreshSessionInactivityClock()
    warningVisible.value = false
    secondsRemaining.value = 0
    keepOpenLoading.value = false
    closingSection.value = false

    SESSION_ACTIVITY_EVENTS.forEach(eventName => {
      window.addEventListener(eventName, recordActivity, { passive: true })
    })

    SESSION_CAPTURE_ACTIVITY_EVENTS.forEach(eventName => {
      document.addEventListener(eventName, recordActivity, {
        passive: true,
        capture: true,
      })
    })

    unsubscribeBroadcast = subscribeSessionInactivityBroadcast(
      handleBroadcastMessage,
    )

    tickTimer = window.setInterval(tick, 1000)
  }

  function stopMonitoring() {
    if (typeof window === 'undefined') {
      return
    }

    SESSION_ACTIVITY_EVENTS.forEach(eventName => {
      window.removeEventListener(eventName, recordActivity)
    })

    SESSION_CAPTURE_ACTIVITY_EVENTS.forEach(eventName => {
      document.removeEventListener(eventName, recordActivity, {
        capture: true,
      })
    })

    unsubscribeBroadcast?.()
    unsubscribeBroadcast = null

    if (tickTimer != null) {
      window.clearInterval(tickTimer)
      tickTimer = null
    }
  }

  onMounted(() => {
    if (authStore.isAuthenticated) {
      startMonitoring()
    }
  })

  onUnmounted(() => {
    stopMonitoring()
  })

  return {
    warningVisible,
    formattedCountdown,
    keepOpenLoading,
    closingSection,
    closeSection,
    keepSectionOpen,
    startMonitoring,
    stopMonitoring,
  }
}
