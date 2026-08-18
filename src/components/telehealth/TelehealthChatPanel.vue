<template>
  <div class="telehealth-room__panel">
    <h3 class="telehealth-room__panel-title">
      {{ t('telehealthChatTitle') }}
    </h3>
    <div
      ref="listRef"
      class="telehealth-chat-list">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="telehealth-chat-item">
        <div class="telehealth-chat-item__meta row items-center no-wrap">
          <span class="col telehealth-chat-item__author ellipsis">
            {{ msg.displayName || msg.role || t('telehealthChatUnknown') }}
          </span>
          <span
            v-if="formatMessageTime(msg)"
            class="telehealth-chat-item__time">
            {{ formatMessageTime(msg) }}
          </span>
          <q-btn
            v-if="canDeleteMessage(msg)"
            flat
            dense
            round
            size="sm"
            icon="delete"
            :data-testid="telehealthTestIds.chatDelete(msg.id)"
            :aria-label="t('delete')"
            @click="$emit('delete', msg.id)">
            <q-tooltip>{{ t('delete') }}</q-tooltip>
          </q-btn>
        </div>
        <div>{{ msg.body }}</div>
      </div>
      <div
        ref="bottomRef"
        class="telehealth-chat-list__anchor"
        aria-hidden="true"
      />
      <p
        v-if="!messages.length"
        class="text-caption"
        style="opacity: 0.7">
        {{ t('telehealthChatEmpty') }}
      </p>
    </div>
    <div
      v-if="canSend"
      class="row q-gutter-sm items-end">
      <q-input
        ref="inputRef"
        v-model="draft"
        dense
        outlined
        dark
        class="col"
        :maxlength="maxLength"
        :placeholder="t('telehealthChatPlaceholder')"
        @keyup.enter="onSend"
      />
      <q-btn
        unelevated
        color="primary"
        icon="send"
        :data-testid="telehealthTestIds.chatSend"
        :disable="!draftTrimmed"
        :aria-label="t('telehealthChatSend')"
        @click="onSend">
        <q-tooltip>{{ t('telehealthChatSend') }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  nextTick,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { telehealthChatBodyMaxLength } from
  'src/utils/telehealth-constants.js'
import { telehealthTestIds } from 'src/test-ids/index.js'
import {
  formatUtcTime,
  resolveBrowserTimeZone,
} from 'src/utils/telehealth-datetime.js'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  canSend: { type: Boolean, default: true },
  canDeleteAny: { type: Boolean, default: false },
  selfParticipantId: { type: [Number, String], default: null },
})

const emit = defineEmits(['send', 'delete'])
const { t } = useI18n()
const draft = ref('')
const listRef = ref(null)
const bottomRef = ref(null)
const inputRef = ref(null)
const maxLength = telehealthChatBodyMaxLength
const draftTrimmed = computed(() => String(draft.value ?? '').trim())
const chatTimeZone = resolveBrowserTimeZone()

function formatMessageTime(msg) {
  const iso = String(msg?.createdAt ?? '').trim()
  if (!iso) {
    return ''
  }

  return formatUtcTime(iso, chatTimeZone)
}

function canDeleteMessage(msg) {
  if (props.canDeleteAny) {
    return true
  }
  if (props.selfParticipantId == null || msg?.participantId == null) {
    return false
  }

  return Number(msg.participantId) === Number(props.selfParticipantId)
}

function scrollToLatest() {
  const list = listRef.value
  if (list) {
    list.scrollTop = list.scrollHeight
  }
  bottomRef.value?.scrollIntoView?.({ block: 'end' })
}

async function focusLatest() {
  await nextTick()
  scrollToLatest()
  // Keep typing focus on the composer after send / new messages.
  inputRef.value?.focus?.()
}

function onSend() {
  const text = draftTrimmed.value
  if (!text) {
    return
  }
  emit('send', text)
  draft.value = ''
  void focusLatest()
}

watch(
  () => props.messages,
  () => {
    void focusLatest()
  },
  { deep: true, immediate: true },
)
</script>
