import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { Notify } from 'quasar'
import { i18nGlobalT } from 'boot/i18n'
import { resolveTenantDomainFromHost } from 'src/utils/tenant-from-host.js'
import { deepMapRequestKeysToSnakeCase } from 'src/utils/request-key-case.js'

const DEFAULT_API_BASE_URL =
  'https://drippy-phonebook-wildcard.ngrok-free.dev'

function isNgrokUrl(url) {
  return /ngrok(-free)?\.(dev|app|io)/i.test(String(url ?? ''))
}

function resolveApiBaseUrl() {
  // DEV: same-origin so Quasar can proxy /portal and skip ngrok CORS.
  if (import.meta.env.DEV) {
    return ''
  }
  const fromEnv = String(import.meta.env.VITE_API_BASE_URL ?? '').trim()
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '')
  }
  return DEFAULT_API_BASE_URL
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
})

let refreshInFlight = null
let lastSessionExpiredNotifyAt = 0

function isAuthPath(url) {
  const path = String(url ?? '')
  return path.includes('/portal/v1/auth/login')
    || path.includes('/portal/v1/auth/refresh')
    || path.includes('/portal/v1/auth/register')
    || path.includes('/portal/v1/auth/locations')
}

async function redirectToLogin() {
  try {
    const { useAuthStore } = await import('stores/auth-store.js')
    const router = useAuthStore().router
    if (router && typeof router.replace === 'function') {
      await router.replace({ name: 'Login' }).catch(() => {})
    }
  } catch {
    // Router may not be mounted yet
  }
}

export async function clearSessionAndRedirectToLogin() {
  const now = Date.now()
  if (now - lastSessionExpiredNotifyAt > 600) {
    lastSessionExpiredNotifyAt = now
    Notify.create({
      type: 'negative',
      message: i18nGlobalT('sessionExpiredRelogin'),
      position: 'top',
      timeout: 6000,
    })
  }
  try {
    const { useAuthStore } = await import('stores/auth-store.js')
    useAuthStore().clearSession()
  } catch {
    // Pinia may be unavailable during very early boot
  }
  await redirectToLogin()
}

export async function refreshAccessToken() {
  const { useAuthStore } = await import('stores/auth-store.js')
  const store = useAuthStore()
  if (!refreshInFlight) {
    refreshInFlight = store.refreshSession().finally(() => {
      refreshInFlight = null
    })
  }
  await refreshInFlight
  return store.accessToken
}

api.interceptors.request.use(async(config) => {
  config.headers = config.headers ?? {}
  config.headers['X-Tenant-Key'] = resolveTenantDomainFromHost()
  if (isNgrokUrl(config.baseURL ?? api.defaults.baseURL)) {
    // TODO(producción): quitar — header provisional ngrok (desarrollo).
    config.headers['ngrok-skip-browser-warning'] = 'true'
  }
  if (config.data && !(config.data instanceof FormData)) {
    config.data = deepMapRequestKeysToSnakeCase(config.data)
  }
  if (config.params && typeof config.params === 'object') {
    config.params = deepMapRequestKeysToSnakeCase(config.params)
  }
  try {
    const { useAuthStore } = await import('stores/auth-store.js')
    const token = useAuthStore().accessToken
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    // Pinia may be unavailable during very early boot
  }
  return config
})

api.interceptors.response.use(
  response => response,
  async(error) => {
    const status = error.response?.status
    const original = error.config
    const canRefresh = status === 401
      && original
      && !original._retry
      && !isAuthPath(original.url)
    if (canRefresh) {
      original._retry = true
      try {
        const token = await refreshAccessToken()
        original.headers = original.headers ?? {}
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      } catch {
        await clearSessionAndRedirectToLogin()
      }
    }
    const message = error.response?.data?.message
      || error.response?.data?.error_description
      || error.response?.data?.error
    if (status >= 400 && message && status !== 401) {
      Notify.create({ type: 'negative', message: String(message) })
    }
    return Promise.reject(error)
  },
)

export default defineBoot(({ app }) => {
  app.config.globalProperties.$api = api
})

export { api }
