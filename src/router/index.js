import { defineRouter } from '#q-app/wrappers'
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router'
import routes from './routes'
import { useAuthStore } from 'stores/auth-store.js'
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

    const authStore = useAuthStore()
    if (!authStore.accessToken) {
      await authStore.restoreSession()
    }
    const needsAuth = to.matched.some(record => record.meta.requiresAuth)
    const isGuest = to.matched.some(record => record.meta.guest)
    if (needsAuth && !authStore.isAuthenticated) {
      return { name: 'Login', query: { redirect: to.fullPath } }
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
