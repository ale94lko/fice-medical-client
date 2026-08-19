/** Inactivity threshold before showing the session warning (30 minutes). */
export const SESSION_INACTIVITY_MS = 30 * 60 * 1000

/** Countdown duration while the warning is visible (2 minutes). */
export const SESSION_WARNING_COUNTDOWN_SEC = 2 * 60

export const SESSION_ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'touchstart',
  'click',
]

/** Scroll does not bubble; listen in capture phase on document. */
export const SESSION_CAPTURE_ACTIVITY_EVENTS = [
  'scroll',
]
