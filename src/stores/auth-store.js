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
    locations: [],
    needsLocationSelection: false,
    restoring: false,
  }),
  getters: {
    isAuthenticated: state => Boolean(state.accessToken),
    displayName: (state) => {
      const name = String(state.me?.preferred_name ?? '').trim()
      return name || state.me?.email || ''
    },
    currentLocationName: (state) => {
      const fromMe = String(state.me?.subtenant_name ?? '').trim()
      if (fromMe) {
        return fromMe
      }
      const current = (state.locations ?? []).find(item => item?.current)
      return String(current?.subtenant_name ?? '').trim()
    },
    locationOptions: (state) => {
      if (state.me?.locations?.length) {
        return state.me.locations
      }
      return state.locations ?? []
    },
    hasMultipleLocations() {
      return this.locationOptions.length > 1
    },
  },
  actions: {
    applyAuthPayload(payload) {
      const data = unwrapData(payload) ?? payload
      this.accessToken = data?.access_token ?? null
      this.refreshToken = data?.refresh_token ?? null
      writeRefreshToken(this.refreshToken)
      if (Array.isArray(data?.locations)) {
        this.locations = data.locations
      }
      if (typeof data?.needs_location_selection === 'boolean') {
        this.needsLocationSelection = data.needs_location_selection
      }
    },
    async login(email, password) {
      const { data } = await api.post(portalPaths.login, { email, password })
      this.applyAuthPayload(data)
      if (!this.needsLocationSelection) {
        await this.loadMe()
      }
    },
    async register(email, password, confirmPassword, subtenantId) {
      await api.post(portalPaths.register, {
        email,
        password,
        confirmPassword,
        subtenantId,
      })
    },
    async acceptInvitation(token, payload) {
      const { data } = await api.post(
        portalPaths.invitationAccept(token),
        payload,
      )
      this.applyAuthPayload(data)
      this.needsLocationSelection = false
      await this.loadMe()
    },
    async selectLocation(accountId) {
      const { data } = await api.post(portalPaths.selectLocation, {
        accountId,
      })
      this.applyAuthPayload(data)
      this.needsLocationSelection = false
      await this.loadMe()
    },
    async loadLocations() {
      const { data } = await api.get(portalPaths.locations)
      const items = unwrapData(data)
      this.locations = Array.isArray(items) ? items : []
      return this.locations
    },
    async loadMe() {
      const { data } = await api.get(portalPaths.me)
      this.me = unwrapData(data)
      if (Array.isArray(this.me?.locations)) {
        this.locations = this.me.locations
      }
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
        this.needsLocationSelection = false
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
      this.locations = []
      this.needsLocationSelection = false
      clearRefreshToken()
    },
  },
})
