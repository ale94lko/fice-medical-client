import { api } from 'boot/axios'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import {
  mapPortalMessages,
  normalizePortalConversation,
  normalizePortalMessage,
} from 'src/utils/portal-messages-normalize.js'

export async function getPortalConversation() {
  const { data } = await api.get(portalPaths.messagesConversation)
  const payload = unwrapConversationEnvelope(data)

  return {
    canSend: Boolean(payload.can_send ?? payload.canSend),
    conversation: normalizePortalConversation(
      payload.conversation,
    ),
    messages: mapPortalMessages(asMessageRows(
      payload.messages ?? payload.items,
    )),
  }
}

export async function getPortalUnreadCount() {
  const { data } = await api.get(portalPaths.messagesUnreadCount)
  const payload = unwrapConversationEnvelope(data)

  return {
    canSend: Boolean(payload.can_send ?? payload.canSend),
    unreadCount: Number(
      payload.unread_count ?? payload.unreadCount ?? 0,
    ),
  }
}

export async function listPortalMessages(afterId) {
  const params = {}
  if (afterId) {
    params['after_id'] = afterId
  }
  const { data } = await api.get(portalPaths.messagesList, { params })

  return mapPortalMessages(asMessageRows(unwrapMessageList(data)))
}

export async function sendPortalMessage(body) {
  const { data } = await api.post(portalPaths.messagesSend, { body })

  return unwrapMessage(data)
}

export async function sendPortalMessageFile(file, caption) {
  const form = new FormData()
  form.append('file', file)
  if (caption) {
    form.append('caption', caption)
  }
  const { data } = await api.post(portalPaths.messagesFiles, form)

  return unwrapMessage(data)
}

export async function markPortalMessagesRead() {
  await api.post(portalPaths.messagesRead)
}

export async function downloadPortalMessageFile(fileId) {
  const { data, headers } = await api.get(
    portalPaths.messagesFile(fileId),
    { responseType: 'blob' },
  )

  return {
    blob: data,
    contentType: headers?.['content-type'] ?? '',
    filename: filenameFromHeader(headers?.['content-disposition']),
  }
}

export function triggerBlobDownload(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'file'
  link.click()
  URL.revokeObjectURL(url)
}

function unwrapConversationEnvelope(body) {
  let current = unwrapData(body) ?? {}
  for (let i = 0; i < 3; i += 1) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return {}
    }
    if (current.can_send != null || current.canSend != null
      || current.conversation != null
      || current.messages != null
      || current.unread_count != null
      || current.unreadCount != null) {
      return current
    }
    if (current.data && typeof current.data === 'object'
      && !Array.isArray(current.data)) {
      current = current.data
      continue
    }
    break
  }

  return current
}

function unwrapMessageList(body) {
  let current = unwrapData(body)
  for (let i = 0; i < 3; i += 1) {
    const rows = asMessageRows(current)
    if (rows.length) {
      return rows
    }
    if (Array.isArray(current)) {
      return current
    }
    if (Array.isArray(current?.data)) {
      return current.data
    }
    if (Array.isArray(current?.items)) {
      return current.items
    }
    if (Array.isArray(current?.messages)) {
      return current.messages
    }
    if (Array.isArray(current?.content)) {
      return current.content
    }
    if (current && typeof current === 'object' && 'data' in current
      && current.data != null && typeof current.data === 'object') {
      current = current.data
      continue
    }
    break
  }

  return asMessageRows(current)
}

function asMessageRows(value) {
  if (Array.isArray(value)) {
    return value
  }
  if (Array.isArray(value?.items)) {
    return value.items
  }
  if (Array.isArray(value?.messages)) {
    return value.messages
  }
  if (value && typeof value === 'object' && !Array.isArray(value)
    && looksLikeMessage(value)) {
    return [value]
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.values(value).filter(row =>
      row && typeof row === 'object'
      && !Array.isArray(row) && row.id != null)
  }

  return []
}

function looksLikeMessage(value) {
  return value.sender_type != null
    || value.senderType != null
    || value.message_type != null
    || value.messageType != null
    || value.body != null
    || value.mine != null
}

function unwrapMessage(body) {
  let current = unwrapData(body)
  for (let i = 0; i < 4; i += 1) {
    if (current == null) {
      return null
    }
    if (Array.isArray(current)) {
      return mapPortalMessages(current)[0] ?? null
    }
    const parsed = normalizePortalMessage(current)
    if (parsed) {
      return parsed
    }
    if (current && typeof current === 'object') {
      if (Array.isArray(current.data)) {
        return mapPortalMessages(current.data)[0] ?? null
      }
      if (current.data != null && typeof current.data === 'object') {
        current = current.data
        continue
      }
    }
    break
  }

  return null
}

function filenameFromHeader(header) {
  const raw = String(header ?? '')
  const match = raw.match(/filename="?([^"]+)"?/i)

  return match?.[1] ?? ''
}
