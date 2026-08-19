import { computed, ref } from 'vue'
import {
  clinicBrowserTimezonesDiffer,
  clearSessionDisplayTzMode,
  getSessionDisplayTzMode,
  resolveBrowserTimeZone,
  resolveClinicTimeZone,
  setSessionDisplayTzMode,
} from 'src/utils/portal-datetime-config.js'

const tick = ref(0)

export function bumpDisplayTimezoneTick() {
  tick.value += 1
}

export function clearSessionDisplayTimezone() {
  clearSessionDisplayTzMode()
  bumpDisplayTimezoneTick()
}

function reloadForTimezoneChange() {
  bumpDisplayTimezoneTick()
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

export function useSessionDisplayTimezone() {
  const mode = computed(() => {
    void tick.value

    return getSessionDisplayTzMode()
  })
  const clinicZone = computed(() => {
    void tick.value

    return resolveClinicTimeZone()
  })
  const browserZone = computed(() => resolveBrowserTimeZone())
  const mismatch = computed(() => clinicBrowserTimezonesDiffer())
  const usingBrowser = computed(() => mode.value === 'browser')
  const showBanner = computed(() => mismatch.value)

  function useBrowserZone() {
    setSessionDisplayTzMode('browser')
    reloadForTimezoneChange()
  }

  function useClinicZone() {
    setSessionDisplayTzMode(null)
    reloadForTimezoneChange()
  }

  return {
    mode,
    clinicZone,
    browserZone,
    mismatch,
    usingBrowser,
    showBanner,
    useBrowserZone,
    useClinicZone,
  }
}
