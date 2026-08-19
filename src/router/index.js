import { defineRouter } from '#q-app/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'stores/auth-store.js'
import { clearSharedSessionInactivityState } from
  'src/utils/session-inactivity-sync.js'
import {
  isStaleChunkLoadError,
  parseGithubPagesStoredRedirect,
  readGithubPagesStoredRedirect,
  reloadRouteAfterStaleChunk,
} from 'src/utils/gh-pages-router.js'

export default defineRouter(function(/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory)

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  const authStore = useAuthStore()
  authStore.router = Router

  let githubPagesRedirectHandled = false

  Router.beforeEach(async(to) => {
    if (!githubPagesRedirectHandled) {
      githubPagesRedirectHandled = true
      const stored = readGithubPagesStoredRedirect()
      if (stored) {
        const target = parseGithubPagesStoredRedirect(stored, Router)
        if (target && target !== to.fullPath) {
          return target
        }
      }
    }

    if (!authStore.accessToken) {
      await authStore.restoreSession()
    }
    const needsAuth = to.matched.some(record => record.meta.requiresAuth)
    const isGuest = to.matched.some(record => record.meta.guest)
    const isLocationPick = to.matched.some(
      record => record.meta.locationPick,
    )
    if (needsAuth && !authStore.isAuthenticated) {
      clearSharedSessionInactivityState()
      return { name: 'Login', query: { redirect: to.fullPath } }
    }
    if (to.name === 'Login') {
      clearSharedSessionInactivityState()
    }
    if (authStore.isAuthenticated && authStore.needsLocationSelection) {
      if (!isLocationPick) {
        return { name: 'SelectLocation' }
      }
      return true
    }
    if (isLocationPick && authStore.isAuthenticated) {
      return { name: 'Dashboard' }
    }
    if (isGuest && authStore.isAuthenticated && to.name === 'Login') {
      return { name: 'Dashboard' }
    }
    return true
  })

  Router.onError((error, to) => {
    if (isStaleChunkLoadError(error) && reloadRouteAfterStaleChunk(to)) {
      return
    }
    throw error
  })

  return Router
})
