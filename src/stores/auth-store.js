import { defineStore } from 'pinia'
import { api } from 'boot/axios'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import {
  clearRefreshToken,
  readRefreshToken,
  writeRefreshToken,
} from 'src/utils/session-storage.js'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    accessToken: null,
    refreshToken: null,
    me: null,
    restoring: false,
  }),
  getters: {
    isAuthenticated: state => Boolean(state.accessToken),
    displayName: (state) => {
      const name = String(state.me?.preferred_name ?? '').trim()
      return name || state.me?.email || ''
    },
  },
  actions: {
    applyAuthPayload(payload) {
      const data = unwrapData(payload) ?? payload
      this.accessToken = data?.access_token ?? null
      this.refreshToken = data?.refresh_token ?? null
      writeRefreshToken(this.refreshToken)
    },
    async login(email, password) {
      const { data } = await api.post(portalPaths.login, { email, password })
      this.applyAuthPayload(data)
      await this.loadMe()
    },
    async register(email, password, confirmPassword) {
      await api.post(portalPaths.register, {
        email,
        password,
        confirmPassword,
      })
    },
    async acceptInvitation(token, payload) {
      const { data } = await api.post(
        portalPaths.invitationAccept(token),
        payload,
      )
      this.applyAuthPayload(data)
      await this.loadMe()
    },
    async loadMe() {
      const { data } = await api.get(portalPaths.me)
      this.me = unwrapData(data)
    },
    async refreshSession() {
      const token = this.refreshToken || readRefreshToken()
      if (!token) {
        throw new Error('No refresh token')
      }
      const { data } = await api.post(portalPaths.refresh, {
        refreshToken: token,
      })
      this.applyAuthPayload(data)
      return this.accessToken
    },
    async restoreSession() {
      if (this.accessToken || this.restoring) {
        return Boolean(this.accessToken)
      }
      const token = readRefreshToken()
      if (!token) {
        return false
      }
      this.restoring = true
      try {
        await this.refreshSession()
        await this.loadMe()
        return true
      } catch {
        this.clearSession()
        return false
      } finally {
        this.restoring = false
      }
    },
    async logout() {
      try {
        if (this.accessToken) {
          await api.post(portalPaths.logout)
        }
      } catch {
        // Best-effort server revoke
      }
      this.clearSession()
    },
    clearSession() {
      this.accessToken = null
      this.refreshToken = null
      this.me = null
      clearRefreshToken()
    },
  },
})
