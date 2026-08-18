import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { resolveTenantDomainFromHost } from 'src/utils/tenant-from-host.js'
import { deepMapRequestKeysToSnakeCase } from
  'src/utils/request-key-case.js'

function sockJsUrl() {
  const path = '/telehealth'
  if (import.meta.env.DEV) {
    return path
  }
  const fromEnv = String(import.meta.env.VITE_API_BASE_URL ?? '').trim()
  const base = fromEnv.replace(/\/$/, '')
  if (base) {
    const httpBase = base.replace(/^ws/i, 'http')

    return `${httpBase}${path}`
  }
  if (typeof window === 'undefined') {
    return path
  }

  return `${window.location.origin}${path}`
}

const SOCKJS_XHR_OPTS = {
  noCredentials: true,
  headers: { 'ngrok-skip-browser-warning': 'true' },
}

const SOCKJS_OPTIONS = {
  transports: ['websocket', 'xhr-streaming', 'xhr-polling'],
  transportOptions: {
    'xhr-streaming': SOCKJS_XHR_OPTS,
    'xhr-polling': SOCKJS_XHR_OPTS,
  },
}

function parseBody(message) {
  const raw = message?.body
  if (!raw) {
    return null
  }
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function stompFrameMessage(frame) {
  const headers = frame?.headers || {}
  const message = String(
    headers.message
    ?? headers['status-message']
    ?? frame?.body
    ?? '',
  ).trim()

  return message || 'Telehealth realtime connection was rejected'
}

async function resolveAccessToken() {
  const { useAuthStore } = await import('stores/auth-store.js')

  return String(useAuthStore().accessToken ?? '').trim()
}

/**
 * STOMP-over-SockJS for a portal telehealth session.
 * Auth is the client JWT (no guest_key).
 */
export function createTelehealthStompClient({
  sessionId,
  onSignal,
  onWaiting,
  onChat,
  onFiles,
  onConnect,
  onDisconnect,
  onError,
} = {}) {
  const id = String(sessionId ?? '').trim()
  if (!id) {
    throw new Error('Telehealth session id is required for STOMP')
  }

  const subscriptions = []
  let client = null

  async function authHeaders() {
    const token = await resolveAccessToken()
    if (!token) {
      throw new Error('Missing Authorization for telehealth STOMP')
    }

    return {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Key': resolveTenantDomainFromHost(),
    }
  }

  function publish(destination, body, { mapKeys = true } = {}) {
    if (!client?.connected) {
      return false
    }
    const prefix = `/app/telehealth/${id}/`
    if (!String(destination).startsWith(prefix)) {
      onError?.(new Error('STOMP publish blocked: wrong session destination'))

      return false
    }
    let payload = body
    if (
      mapKeys
      && body != null
      && typeof body === 'object'
    ) {
      payload = deepMapRequestKeysToSnakeCase(body)
    }
    client.publish({
      destination,
      body: JSON.stringify(payload ?? {}),
      headers: { 'content-type': 'application/json' },
    })

    return true
  }

  function publishSignal(body = {}) {
    const raw = body && typeof body === 'object' ? body : {}
    const candidate = raw.candidate
    const mapped = deepMapRequestKeysToSnakeCase(raw)
    const isCandidateObject = Boolean(
      candidate
      && typeof candidate === 'object'
      && !Array.isArray(candidate),
    )
    if (isCandidateObject) {
      mapped.candidate = {
        candidate: String(candidate.candidate ?? ''),
        sdpMid: candidate.sdpMid ?? candidate.sdp_mid ?? null,
        sdpMLineIndex:
          candidate.sdpMLineIndex
          ?? candidate.sdp_m_line_index
          ?? null,
        usernameFragment:
          candidate.usernameFragment
          ?? candidate.username_fragment
          ?? undefined,
      }
    }

    return publish(`/app/telehealth/${id}/signal`, mapped, {
      mapKeys: false,
    })
  }

  function connect() {
    if (client) {
      return client
    }
    client = new Client({
      webSocketFactory: () => new SockJS(
        sockJsUrl(),
        undefined,
        SOCKJS_OPTIONS,
      ),
      reconnectDelay: 3000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      connectHeaders: {},
      beforeConnect: async() => {
        try {
          client.connectHeaders = await authHeaders()
        } catch (error) {
          onError?.(error)
          throw error
        }
      },
      onConnect: () => {
        const signalDest = `/topic/telehealth/${id}/signal`
        const waitingDest = `/topic/telehealth/${id}/waiting`
        const chatDest = `/topic/telehealth/${id}/chat`
        const filesDest = `/topic/telehealth/${id}/files`

        if (typeof onSignal === 'function') {
          subscriptions.push(
            client.subscribe(signalDest, message => {
              onSignal(parseBody(message))
            }),
          )
        }
        if (typeof onWaiting === 'function') {
          subscriptions.push(
            client.subscribe(waitingDest, message => {
              onWaiting(parseBody(message))
            }),
          )
        }
        if (typeof onChat === 'function') {
          subscriptions.push(
            client.subscribe(chatDest, message => {
              onChat(parseBody(message))
            }),
          )
        }
        if (typeof onFiles === 'function') {
          subscriptions.push(
            client.subscribe(filesDest, message => {
              onFiles(parseBody(message))
            }),
          )
        }
        onConnect?.()
      },
      onDisconnect: () => {
        onDisconnect?.()
      },
      onStompError: frame => {
        onError?.(new Error(stompFrameMessage(frame)))
      },
      onWebSocketError: event => {
        onError?.(event instanceof Error
          ? event
          : new Error('Telehealth websocket error'))
      },
    })
    client.activate()

    return client
  }

  function disconnect() {
    while (subscriptions.length) {
      const sub = subscriptions.pop()
      try {
        sub?.unsubscribe?.()
      } catch {
        // ignore
      }
    }
    if (client) {
      try {
        client.deactivate()
      } catch {
        // ignore
      }
      client = null
    }
  }

  return {
    connect,
    disconnect,
    isConnected: () => Boolean(client?.connected),
    sendSignal: publishSignal,
    sendWaiting: payload => publish(`/app/telehealth/${id}/waiting`, payload),
    sendChat: payload => publish(`/app/telehealth/${id}/chat`, payload),
  }
}
