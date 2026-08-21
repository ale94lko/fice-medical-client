import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessageImagePreviews } from
  'src/composables/useMessageImagePreviews.js'
import { usePortalMessageUnread } from
  'src/composables/usePortalMessageUnread.js'
import {
  downloadPortalMessageFile,
  getPortalConversation,
  listPortalMessages,
  markPortalMessagesRead,
  sendPortalMessage,
  sendPortalMessageFile,
  triggerBlobDownload,
} from 'src/utils/portal-messages-api.js'
import {
  asOwnPortalMessage,
  createPendingPortalMessage,
  lastNumericMessageId,
  reconcilePortalPendingMessages,
} from 'src/utils/portal-messages-normalize.js'
import { useAuthStore } from 'stores/auth-store.js'

export function usePortalChat() {
  const { t } = useI18n()
  const authStore = useAuthStore()
  const { unreadCount, refreshUnread } = usePortalMessageUnread()
  const messages = ref([])
  const canSend = ref(false)
  const sending = ref(false)
  const loaded = ref(false)
  const loading = ref(false)
  const previewUrls = useMessageImagePreviews(
    messages,
    downloadPortalMessageFile,
  )

  const needsProfile = computed(() =>
    Boolean(authStore.me?.needs_profile_completion),
  )

  const clinicLabel = computed(() =>
    authStore.currentLocationName || t('messagesClinic'),
  )

  function lastId() {
    return lastNumericMessageId(messages.value)
  }

  async function markReadAndBadge() {
    await markPortalMessagesRead()
    await refreshUnread()
  }

  async function refreshAfterSend(pendingId, saved) {
    const pending = messages.value.find(row => row.id === pendingId)
    const kept = messages.value.filter(row => row.id !== pendingId)
    const own = asOwnPortalMessage(saved)
    const local = own ? [own] : (pending ? [pending] : [])
    let listed = []
    try {
      listed = await listPortalMessages()
    } catch {
      listed = []
    }
    messages.value = reconcilePortalPendingMessages(
      [...kept, ...local],
      listed,
    )
  }

  async function loadInitial() {
    loading.value = true
    try {
      if (!authStore.me) {
        await authStore.loadMe()
      }
      const envelope = await getPortalConversation()
      canSend.value = envelope.canSend
      if (!envelope.canSend && !envelope.conversation) {
        messages.value = []
        loaded.value = true
        await refreshUnread()

        return
      }
      const listed = Array.isArray(envelope.messages)
        ? envelope.messages
        : []
      messages.value = listed.length
        ? listed
        : await listPortalMessages()
      loaded.value = true
      if (messages.value.length) {
        await markReadAndBadge()
      }
    } finally {
      loading.value = false
    }
  }

  async function ensureLoaded() {
    if (loaded.value) {
      return
    }
    await loadInitial()
  }

  async function reloadThread() {
    await loadInitial()
  }

  function resetForLocation() {
    loaded.value = false
    messages.value = []
    canSend.value = false
  }

  async function pollNew() {
    if (!canSend.value || document.hidden) {
      return
    }
    const incoming = await listPortalMessages(lastId())
    if (!incoming.length) {
      return
    }
    messages.value = reconcilePortalPendingMessages(
      messages.value,
      incoming,
    )
    await markReadAndBadge()
  }

  async function onSend(body) {
    const pending = createPendingPortalMessage({ body })
    messages.value = reconcilePortalPendingMessages(
      messages.value,
      [pending],
    )
    sending.value = true
    try {
      const saved = await sendPortalMessage(body)
      await refreshAfterSend(pending.id, saved)
    } catch {
      messages.value = messages.value.filter(
        row => row.id !== pending.id,
      )
    } finally {
      sending.value = false
    }
  }

  async function onUpload(file) {
    const pending = createPendingPortalMessage({ file })
    messages.value = reconcilePortalPendingMessages(
      messages.value,
      [pending],
    )
    sending.value = true
    try {
      const saved = await sendPortalMessageFile(file)
      await refreshAfterSend(pending.id, saved)
    } catch {
      messages.value = messages.value.filter(
        row => row.id !== pending.id,
      )
    } finally {
      sending.value = false
    }
  }

  async function onDownload(file) {
    const payload = await downloadPortalMessageFile(file.id)
    triggerBlobDownload(
      payload.blob,
      payload.filename || file.originalFilename || 'file',
    )
  }

  return {
    messages,
    canSend,
    sending,
    loaded,
    loading,
    previewUrls,
    unreadCount,
    needsProfile,
    clinicLabel,
    refreshUnread,
    loadInitial,
    ensureLoaded,
    reloadThread,
    resetForLocation,
    pollNew,
    onSend,
    onUpload,
    onDownload,
  }
}
