<template>
  <div class="portal-messages">
    <div
      class="portal-messages__head"
      :data-testid="portalTestIds.messagesThreadHead"
    >
      <div
        class="portal-messages__head-icon"
        aria-hidden="true"
      >
        <q-icon name="forum" size="18px" />
      </div>
      <div class="portal-messages__head-copy">
        <div class="portal-messages__head-title-row">
          <div class="portal-messages__head-title ellipsis">
            {{ clinicLabel || t('messagesClinic') }}
          </div>
          <q-btn
            v-if="reloadable"
            flat
            dense
            round
            icon="sync"
            :loading="reloading"
            :aria-label="t('messagesRefresh')"
            :data-testid="portalTestIds.messagesRefresh"
            @click="$emit('reload')"
          />
        </div>
      </div>
      <q-space />
      <q-btn
        v-if="closable"
        flat
        dense
        round
        icon="close"
        :aria-label="t('close')"
        :data-testid="portalTestIds.messagesClose"
        @click="$emit('close')"
      />
    </div>
    <div
      class="portal-messages__list"
      :data-testid="portalTestIds.messagesList"
    >
      <div
        v-if="messages.length"
        class="portal-messages__grow"
        aria-hidden="true"
      />
      <template
        v-for="row in threadItems"
        :key="row.id"
      >
        <div
          v-if="row.type === 'day'"
          class="portal-messages__day"
          :data-testid="portalTestIds.messagesDay(row.id)"
        >
          {{ row.label }}
        </div>
        <article
          v-else
          class="portal-messages__item"
          :class="{
            'portal-messages__item--mine': row.message.mine,
            'portal-messages__item--pending':
              row.message.pending,
            'portal-messages__item--grouped': row.grouped,
          }"
          :data-testid="portalTestIds.messagesItem(
            row.message.id,
          )"
        >
          <div
            v-if="showAuthor(row)"
            class="portal-messages__author ellipsis"
          >
            {{ authorLabel(row.message) }}
          </div>
          <div class="portal-messages__bubble">
            <p
              v-if="row.message.body"
              class="portal-messages__body"
            >
              {{ row.message.body }}
            </p>
            <button
              v-if="row.message.file
                && isImageFile(row.message.file)"
              type="button"
              class="portal-messages__file
                portal-messages__file--image"
              :data-testid="portalTestIds.messagesFile(
                row.message.file.id,
              )"
              @click="$emit('download', row.message.file)"
            >
              <img
                v-if="previewUrls[row.message.file.id]"
                class="portal-messages__preview"
                :src="previewUrls[row.message.file.id]"
                :alt="row.message.file.originalFilename
                  || t('messagesAttachment')"
              >
              <span
                v-else
                class="ellipsis"
              >
                {{ row.message.file.originalFilename
                  || t('messagesAttachment') }}
              </span>
            </button>
            <button
              v-else-if="row.message.file"
              type="button"
              class="portal-messages__file"
              :data-testid="portalTestIds.messagesFile(
                row.message.file.id,
              )"
              @click="$emit('download', row.message.file)"
            >
              <q-icon
                name="picture_as_pdf"
                size="18px"
              />
              <span class="ellipsis">
                {{ row.message.file.originalFilename
                  || t('messagesAttachment') }}
              </span>
            </button>
            <div class="portal-messages__foot">
              <q-spinner
                v-if="row.message.pending"
                color="primary"
                size="12px"
                :aria-label="t('messagesSending')"
                :data-testid="portalTestIds.messagesSending(
                  row.message.id,
                )"
              />
              <span>{{ stampLabel(row.message) }}</span>
            </div>
          </div>
        </article>
      </template>
      <div
        ref="bottomRef"
        class="portal-messages__anchor"
        aria-hidden="true"
      />
    </div>
    <form
      v-if="canSend"
      class="portal-messages__composer"
      @submit.prevent="onSubmit"
    >
      <input
        ref="fileInputRef"
        class="hidden"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,
          image/png,image/jpeg,application/pdf"
        :data-testid="portalTestIds.messagesFileInput"
        @change="onPickFile"
      >
      <q-btn
        flat
        dense
        round
        icon="attach_file"
        :aria-label="t('messagesAttach')"
        :data-testid="portalTestIds.messagesAttach"
        @click="fileInputRef?.click()"
      />
      <q-input
        v-model="draft"
        outlined
        dense
        autogrow
        hide-bottom-space
        class="portal-messages__input col"
        :placeholder="t('messagesPlaceholder')"
        :data-testid="portalTestIds.messagesInput"
        @keydown.enter.exact.prevent="onSubmit"
      />
      <q-btn
        unelevated
        round
        color="primary"
        icon="send"
        type="submit"
        :disable="!canSubmit"
        :aria-label="t('messagesSend')"
        :data-testid="portalTestIds.messagesSend"
      />
    </form>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { portalTestIds } from 'src/test-ids/index.js'
import {
  formatPortalDate,
  formatPortalTime,
} from 'src/utils/portal-datetime.js'
import { isImageContentType, lastNumericMessageId } from
  'src/utils/portal-messages-normalize.js'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  canSend: { type: Boolean, default: false },
  sending: { type: Boolean, default: false },
  clinicLabel: { type: String, default: '' },
  previewUrls: { type: Object, default: () => ({}) },
  closable: { type: Boolean, default: false },
  reloadable: { type: Boolean, default: false },
  reloading: { type: Boolean, default: false },
})

const emit = defineEmits([
  'send',
  'upload',
  'download',
  'close',
  'reload',
])
const { t } = useI18n()
const draft = ref('')
const bottomRef = ref(null)
const fileInputRef = ref(null)

const canSubmit = computed(() => Boolean(draft.value.trim()))

const threadItems = computed(() =>
  buildThreadItems(props.messages, dayLabel),
)

function isImageFile(file) {
  return isImageContentType(file?.contentType)
}

function looksLikeEmail(value) {
  return String(value ?? '').includes('@')
}

function authorLabel(msg) {
  if (msg?.mine) {
    return t('messagesYou')
  }
  const name = String(msg?.senderDisplayName ?? '').trim()
  if (name && !looksLikeEmail(name)) {
    return name
  }

  return props.clinicLabel || t('messagesClinic')
}

function showAuthor(row) {
  return Boolean(row?.message) && !row.message.mine && !row.grouped
}

function stampLabel(msg) {
  return formatPortalTime(msg?.createdAt) || ''
}

function dayLabel(value) {
  const label = formatPortalDate(value)
  if (!label) {
    return ''
  }
  if (label === formatPortalDate(new Date())) {
    return t('messagesToday')
  }
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (label === formatPortalDate(yesterday)) {
    return t('messagesYesterday')
  }

  return label
}

function onSubmit() {
  const body = draft.value.trim()
  if (!props.canSend || !body) {
    return
  }
  emit('send', body)
  draft.value = ''
}

function onPickFile(event) {
  const file = event.target?.files?.[0]
  event.target.value = ''
  if (!file || !props.canSend) {
    return
  }
  emit('upload', file)
}

async function scrollToBottom() {
  await nextTick()
  bottomRef.value?.scrollIntoView?.({ block: 'end' })
}

watch(
  () => [
    props.messages.length,
    lastNumericMessageId(props.messages),
  ],
  () => {
    void scrollToBottom()
  },
  { immediate: true },
)

function buildThreadItems(messages, labelDay) {
  const list = Array.isArray(messages) ? messages : []
  const rows = []
  let lastDay = ''
  let lastSender = ''
  list.forEach((msg) => {
    if (!msg) {
      return
    }
    const day = formatPortalDate(msg.createdAt) || ''
    if (day && day !== lastDay) {
      rows.push({
        type: 'day',
        id: `day-${day}`,
        label: labelDay(msg.createdAt),
      })
      lastDay = day
      lastSender = ''
    }
    const sender = msg.mine
      ? 'mine'
      : `other:${msg.senderDisplayName || ''}`
    rows.push({
      type: 'message',
      id: msg.id,
      grouped: sender === lastSender,
      message: msg,
    })
    lastSender = sender
  })

  return rows
}
</script>
