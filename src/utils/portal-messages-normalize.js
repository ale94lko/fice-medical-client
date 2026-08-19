function parseOptionalNumber(value) {
  if (value == null || value === '') {
    return null
  }
  const n = Number(value)

  return Number.isFinite(n) ? n : null
}

function trim(value) {
  return String(value ?? '').trim()
}

export function normalizePortalMessageFile(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = parseOptionalNumber(raw.id)
  if (id == null) {
    return null
  }

  return {
    id,
    originalFilename: trim(
      raw.original_filename ?? raw.originalFilename,
    ),
    contentType: trim(
      raw.content_type ?? raw.contentType,
    ).toLowerCase(),
    fileSize: parseOptionalNumber(raw.file_size ?? raw.fileSize),
  }
}

export function normalizePortalMessage(raw) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = parseOptionalNumber(raw.id)
  if (id == null) {
    return null
  }
  const file = normalizePortalMessageFile(raw.file)

  return {
    id,
    conversationId: parseOptionalNumber(
      raw.conversation_id ?? raw.conversationId,
    ),
    senderType: trim(raw.sender_type ?? raw.senderType).toUpperCase(),
    senderDisplayName: trim(
      raw.sender_display_name ?? raw.senderDisplayName,
    ),
    mine: Boolean(raw.mine),
    messageType: trim(raw.message_type ?? raw.messageType).toUpperCase(),
    body: trim(raw.body),
    file,
    createdAt: raw.created_at ?? raw.createdAt ?? null,
  }
}

export function mapPortalMessages(list) {
  const rows = Array.isArray(list) ? list : []

  return rows.map(normalizePortalMessage).filter(Boolean)
}

export function mergePortalMessages(existing, incoming) {
  const byId = new Map()
  ;[...existing, ...incoming].forEach(row => {
    if (row?.id != null) {
      byId.set(row.id, row)
    }
  })

  return [...byId.values()].sort(comparePortalMessages)
}

export function reconcilePortalPendingMessages(existing, incoming) {
  const merged = mergePortalMessages(existing, incoming)
  const confirmed = merged.filter(row => !row.pending)
  const pendingRows = merged.filter(row => row.pending)
  if (!pendingRows.length) {
    return merged
  }
  const leftover = pendingRows.filter(row =>
    !pendingHasConfirmedMatch(row, confirmed),
  )

  return mergePortalMessages(confirmed, leftover)
}

function pendingHasConfirmedMatch(pending, confirmed) {
  return confirmed.some(row => {
    if (!row.mine || row.messageType !== pending.messageType) {
      return false
    }
    if (pending.messageType === 'FILE') {
      return row.file?.originalFilename
        === pending.file?.originalFilename
    }

    return row.body === pending.body
  })
}

function comparePortalMessages(a, b) {
  const aPending = Boolean(a?.pending)
  const bPending = Boolean(b?.pending)
  if (aPending !== bPending) {
    return aPending ? 1 : -1
  }
  const aId = Number(a?.id)
  const bId = Number(b?.id)
  if (Number.isFinite(aId) && Number.isFinite(bId)) {
    return aId - bId
  }

  return String(a?.id ?? '').localeCompare(String(b?.id ?? ''))
}

export function lastNumericMessageId(rows) {
  const list = Array.isArray(rows) ? rows : []
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const n = Number(list[i]?.id)
    if (Number.isFinite(n) && n > 0) {
      return n
    }
  }

  return null
}

export function asOwnPortalMessage(msg) {
  if (!msg) {
    return null
  }

  return { ...msg, mine: true, pending: false }
}

export function createPendingPortalMessage({ body = '', file = null }) {
  return {
    id: `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    conversationId: null,
    senderType: 'PORTAL',
    senderDisplayName: '',
    mine: true,
    messageType: file ? 'FILE' : 'TEXT',
    body: String(body ?? '').trim(),
    file: pendingFile(file),
    createdAt: new Date().toISOString(),
    pending: true,
  }
}

function pendingFile(file) {
  if (!file) {
    return null
  }

  return {
    id: `tmp-file-${Date.now()}`,
    originalFilename: file.name || '',
    contentType: String(file.type || '').toLowerCase(),
    fileSize: file.size ?? null,
  }
}

export function normalizePortalConversation(raw = {}) {
  if (!raw || typeof raw !== 'object') {
    return null
  }
  const id = parseOptionalNumber(raw.id)
  if (id == null) {
    return null
  }

  return {
    id,
    clientId: parseOptionalNumber(raw.client_id ?? raw.clientId),
    clientNumber: trim(raw.client_number ?? raw.clientNumber),
    clientDisplayName: trim(
      raw.client_display_name ?? raw.clientDisplayName,
    ),
    status: trim(raw.status),
    lastMessageAt: raw.last_message_at ?? raw.lastMessageAt ?? null,
    lastMessagePreview: trim(
      raw.last_message_preview ?? raw.lastMessagePreview,
    ),
    unreadCount: parseOptionalNumber(
      raw.unread_count ?? raw.unreadCount,
    ) ?? 0,
  }
}

export function isImageContentType(contentType) {
  return String(contentType ?? '').toLowerCase().startsWith('image/')
}
