export function formatSessionCountdown(totalSeconds) {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60

  return [
    String(minutes).padStart(2, '0'),
    String(seconds).padStart(2, '0'),
  ].join(':')
}

export function resolveSessionInactivityMs() {
  const fromEnv = Number(import.meta.env.VITE_SESSION_INACTIVITY_MS)
  if (import.meta.env.DEV && Number.isFinite(fromEnv) && fromEnv > 0) {
    return fromEnv
  }

  return null
}
