<template>
  <div class="portal-chat">
    <div
      v-if="open"
      class="portal-card portal-chat__panel"
      :data-testid="portalTestIds.messagesPanel"
    >
      <q-banner
        v-if="needsProfile"
        class="portal-banner portal-chat__banner"
        dense
        rounded
      >
        {{ t('needsClientRecord') }}
        <template #action>
          <q-btn
            flat
            no-caps
            color="primary"
            :label="t('completeProfile')"
            to="/profile"
            @click="close"
          />
        </template>
      </q-banner>
      <PortalMessageThread
        closable
        reloadable
        :reloading="loading"
        :messages="messages"
        :can-send="canSend"
        :sending="sending"
        :clinic-label="clinicLabel"
        :preview-urls="previewUrls"
        @close="close"
        @reload="onReload"
        @send="onSend"
        @upload="onUpload"
        @download="onDownload"
      />
    </div>
    <q-btn
      v-show="!open"
      round
      unelevated
      color="primary"
      icon="chat"
      size="lg"
      class="portal-chat__fab"
      :aria-label="t('messagesChatTooltip')"
      :data-testid="portalTestIds.messagesFab"
      @click="openChat"
    >
      <q-tooltip
        class="app-info-tooltip"
        anchor="top middle"
        self="bottom middle"
        :offset="[0, 6]"
      >
        {{ t('messagesChatTooltip') }}
      </q-tooltip>
      <q-badge
        v-if="unreadCount"
        floating
        rounded
        color="negative"
        :label="unreadCount"
        :data-testid="portalTestIds.messagesUnreadBadge"
      />
    </q-btn>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import PortalMessageThread from
  'src/components/PortalMessageThread.vue'
import { usePortalChat } from
  'src/composables/usePortalChat.js'
import { portalTestIds } from 'src/test-ids/index.js'
import { useAuthStore } from 'stores/auth-store.js'

const POLL_MS = 15000
const { t } = useI18n()
const authStore = useAuthStore()
const open = ref(false)
const {
  messages,
  canSend,
  sending,
  loading,
  previewUrls,
  unreadCount,
  needsProfile,
  clinicLabel,
  refreshUnread,
  ensureLoaded,
  reloadThread,
  resetForLocation,
  pollNew,
  onSend,
  onUpload,
  onDownload,
} = usePortalChat()

let unreadTimer = null
let chatTimer = null

function close() {
  open.value = false
  stopChatPoll()
}

async function openChat() {
  open.value = true
  await ensureLoaded()
  startChatPoll()
}

async function onReload() {
  await reloadThread()
}

function startChatPoll() {
  stopChatPoll()
  chatTimer = window.setInterval(() => {
    void pollNew()
  }, POLL_MS)
}

function stopChatPoll() {
  if (chatTimer) {
    window.clearInterval(chatTimer)
    chatTimer = null
  }
}

onMounted(() => {
  void refreshUnread()
  unreadTimer = window.setInterval(() => {
    if (!document.hidden) {
      void refreshUnread()
    }
  }, POLL_MS)
})

onUnmounted(() => {
  if (unreadTimer) {
    window.clearInterval(unreadTimer)
  }
  stopChatPoll()
})

watch(
  () => authStore.me?.account_id,
  async() => {
    resetForLocation()
    void refreshUnread()
    if (open.value) {
      await ensureLoaded()
    }
  },
)
</script>
