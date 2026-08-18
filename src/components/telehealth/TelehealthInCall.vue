<template>
  <div class="telehealth-room__body">
    <div class="telehealth-room__stage">
      <div
        class="telehealth-room__videos"
        :class="videosLayoutClass">
        <div
          v-if="showScreenStage"
          class="telehealth-video-tile telehealth-video-tile--screen">
          <div
            v-if="isLocalScreenPlaceholder"
            class="telehealth-video-tile__screen-placeholder">
            <q-icon name="screen_share" size="48px" />
            <p class="telehealth-video-tile__screen-title">
              {{ t('telehealthLocalScreenShare') }}
            </p>
            <p class="telehealth-video-tile__screen-hint">
              {{ t('telehealthLocalScreenShareHint') }}
            </p>
          </div>
          <video
            v-else
            ref="screenVideoRef"
            autoplay
            playsinline
            muted
          />
          <div
            v-if="!isLocalScreenPlaceholder"
            class="telehealth-video-tile__label">
            {{ screenStageLabel }}
          </div>
        </div>

        <div
          class="telehealth-room__people"
          :class="{
            'telehealth-room__people--strip': showScreenStage,
          }">
          <div
            v-if="hasRemoteMedia"
            class="telehealth-video-tile">
            <video
              ref="remoteVideoRef"
              autoplay
              playsinline
              :muted="!speakerEnabled"
            />
            <div class="telehealth-video-tile__label">
              {{ t('telehealthRemoteVideo') }}
            </div>
          </div>
          <div class="telehealth-video-tile">
            <video
              ref="localVideoRef"
              autoplay
              muted
              playsinline
            />
            <div class="telehealth-video-tile__label">
              {{ t('telehealthLocalVideo') }}
            </div>
          </div>
        </div>
      </div>

      <div class="telehealth-room__controls">
        <q-btn
          round
          unelevated
          class="telehealth-room__control-btn"
          :class="{
            'telehealth-room__control-btn--off': !audioEnabled,
          }"
          color="primary"
          text-color="white"
          :data-testid="telehealthTestIds.inCallMute"
          :icon="audioEnabled ? 'mic' : 'mic_off'"
          :aria-label="t('telehealthToggleMic')"
          @click="$emit('toggle-audio')">
          <q-tooltip
            anchor="top middle"
            self="bottom middle">
            {{ t('telehealthToggleMic') }}
          </q-tooltip>
        </q-btn>
        <q-btn
          round
          unelevated
          class="telehealth-room__control-btn"
          :class="{
            'telehealth-room__control-btn--off': !videoEnabled,
          }"
          color="primary"
          text-color="white"
          :data-testid="telehealthTestIds.inCallVideo"
          :icon="videoEnabled ? 'videocam' : 'videocam_off'"
          :aria-label="t('telehealthToggleCam')"
          @click="$emit('toggle-video')">
          <q-tooltip
            anchor="top middle"
            self="bottom middle">
            {{ t('telehealthToggleCam') }}
          </q-tooltip>
        </q-btn>
        <q-btn
          round
          unelevated
          class="telehealth-room__control-btn"
          :class="{
            'telehealth-room__control-btn--off': !speakerEnabled,
          }"
          color="primary"
          text-color="white"
          :data-testid="telehealthTestIds.inCallSpeaker"
          :icon="speakerEnabled ? 'volume_up' : 'volume_off'"
          :aria-label="t('telehealthToggleSpeaker')"
          @click="$emit('toggle-speaker')">
          <q-tooltip
            anchor="top middle"
            self="bottom middle">
            {{ t('telehealthToggleSpeaker') }}
          </q-tooltip>
        </q-btn>
        <q-btn
          round
          unelevated
          class="telehealth-room__control-btn"
          :class="{
            'telehealth-room__control-btn--active': isScreenSharing,
          }"
          color="primary"
          text-color="white"
          :data-testid="telehealthTestIds.inCallScreen"
          icon="screen_share"
          :aria-label="screenShareLabel"
          :disable="!canScreenShare"
          @click="onScreenShareClick">
          <q-tooltip
            anchor="top middle"
            self="bottom middle">
            {{
              canScreenShare
                ? screenShareLabel
                : t('telehealthScreenShareUnavailable')
            }}
          </q-tooltip>
        </q-btn>
        <q-btn
          v-if="canMinimize"
          round
          unelevated
          class="telehealth-room__control-btn"
          color="primary"
          text-color="white"
          :data-testid="telehealthTestIds.inCallMinimize"
          icon="picture_in_picture_alt"
          :aria-label="t('telehealthMinimize')"
          @click="$emit('minimize')">
          <q-tooltip
            anchor="top middle"
            self="bottom middle">
            {{ t('telehealthMinimize') }}
          </q-tooltip>
        </q-btn>
        <q-btn
          round
          unelevated
          class="telehealth-room__control-btn
            telehealth-room__control-btn--danger"
          :data-testid="telehealthTestIds.inCallLeave"
          icon="call_end"
          :aria-label="t('telehealthLeave')"
          @click="$emit('leave')">
          <q-tooltip
            anchor="top middle"
            self="bottom middle">
            {{ t('telehealthLeave') }}
          </q-tooltip>
        </q-btn>
      </div>
    </div>

    <div class="telehealth-room__sidebar">
      <nav
        class="telehealth-room__side-menu"
        :aria-label="t('telehealthSideMenuLabel')">
        <button
          v-if="showMeetInfo"
          type="button"
          class="telehealth-room__menu-item"
          :class="{
            'telehealth-room__menu-item--active':
              sidePanel === 'info',
          }"
          :aria-label="t('telehealthMeetInfoTitle')"
          :aria-pressed="sidePanel === 'info'"
          @click="toggleSide('info')">
          <q-icon name="info" size="22px" />
          <span class="telehealth-room__menu-label">
            {{ t('telehealthMeetInfoTitle') }}
          </span>
        </button>
        <button
          v-if="showWaitingAdmit"
          type="button"
          class="telehealth-room__menu-item"
          :class="{
            'telehealth-room__menu-item--active':
              sidePanel === 'waiting',
          }"
          :aria-label="t('telehealthWaitingPanelTitle')"
          :aria-pressed="sidePanel === 'waiting'"
          @click="toggleSide('waiting')">
          <q-icon name="group" size="22px" />
          <span class="telehealth-room__menu-label">
            {{ t('telehealthWaitingPanelTitle') }}
          </span>
          <span
            v-if="waitingCount"
            class="telehealth-room__menu-badge">
            {{ waitingCount }}
          </span>
        </button>
        <button
          v-if="canChat"
          type="button"
          class="telehealth-room__menu-item"
          :class="{
            'telehealth-room__menu-item--active':
              sidePanel === 'chat',
          }"
          :data-testid="telehealthTestIds.inCallChat"
          :aria-label="t('telehealthChatTitle')"
          :aria-pressed="sidePanel === 'chat'"
          @click="toggleSide('chat')">
          <q-icon name="chat" size="22px" />
          <span class="telehealth-room__menu-label">
            {{ t('telehealthChatTitle') }}
          </span>
        </button>
        <button
          type="button"
          class="telehealth-room__menu-item"
          :class="{
            'telehealth-room__menu-item--active':
              sidePanel === 'files',
          }"
          :aria-label="t('telehealthFilesTitle')"
          :aria-pressed="sidePanel === 'files'"
          @click="toggleSide('files')">
          <q-icon name="attach_file" size="22px" />
          <span class="telehealth-room__menu-label">
            {{ t('telehealthFilesTitle') }}
          </span>
        </button>
      </nav>

      <aside
        v-if="sidePanel"
        class="telehealth-room__side">
        <TelehealthMeetInfoPanel
          v-if="sidePanel === 'info'"
          :meeting-code="meetingCode"
          :status-label="statusLabel"
          :client-invite-url="clientInviteUrl"
          :invite-email="inviteEmail"
          :use-custom-invite-email="useCustomInviteEmail"
          :invite-loading="inviteLoading"
          :appointment="appointment"
          :show-invite-tools="showInviteTools"
          :show-meeting-code="showMeetingCode"
          :use-browser-time-zone="useBrowserTimeZone"
          @update:invite-email="
            $emit('update:inviteEmail', $event)
          "
          @update:use-custom-invite-email="
            $emit('update:useCustomInviteEmail', $event)
          "
          @copy-invite="$emit('copy-invite')"
          @resend-invite="$emit('resend-invite')"
        />
        <TelehealthWaitingAdmitPanel
          v-else-if="sidePanel === 'waiting'"
          :waiting-participants="waitingParticipants"
          :can-admit="canAdmit"
          :loading="admitLoading"
          @admit="$emit('admit', $event)"
        />
        <TelehealthChatPanel
          v-else-if="sidePanel === 'chat'"
          :messages="chatMessages"
          :can-send="canChat"
          :can-delete-any="canDeleteChat"
          :self-participant-id="selfParticipantId"
          @send="$emit('send-chat', $event)"
          @delete="$emit('delete-chat', $event)"
        />
        <TelehealthFilesPanel
          v-else
          :files="files"
          :can-upload="canUploadFiles"
          :can-delete="canDeleteFiles"
          @upload="$emit('upload-file', $event)"
          @download="$emit('download-file', $event)"
          @delete="$emit('delete-file', $event)"
        />
      </aside>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import TelehealthChatPanel from './TelehealthChatPanel.vue'
import TelehealthFilesPanel from './TelehealthFilesPanel.vue'
import TelehealthMeetInfoPanel from './TelehealthMeetInfoPanel.vue'
import TelehealthWaitingAdmitPanel from
  './TelehealthWaitingAdmitPanel.vue'
import { telehealthTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  localStream: { type: Object, default: null },
  remoteStream: { type: Object, default: null },
  localScreenStream: { type: Object, default: null },
  remoteScreenStream: { type: Object, default: null },
  /** Increments when remote tracks change (shallowRef-safe). */
  remoteMediaGeneration: { type: Number, default: 0 },
  audioEnabled: { type: Boolean, default: true },
  videoEnabled: { type: Boolean, default: true },
  speakerEnabled: { type: Boolean, default: true },
  isScreenSharing: { type: Boolean, default: false },
  isRemoteScreenSharing: { type: Boolean, default: false },
  canScreenShare: { type: Boolean, default: false },
  /** Staff only — guests stay on the meet page. */
  canMinimize: { type: Boolean, default: false },
  canChat: { type: Boolean, default: false },
  canAdmit: { type: Boolean, default: false },
  canDeleteChat: { type: Boolean, default: false },
  canUploadFiles: { type: Boolean, default: false },
  canDeleteFiles: { type: Boolean, default: false },
  showMeetInfo: { type: Boolean, default: false },
  showInviteTools: { type: Boolean, default: true },
  showMeetingCode: { type: Boolean, default: true },
  useBrowserTimeZone: { type: Boolean, default: false },
  meetingCode: { type: String, default: '' },
  statusLabel: { type: String, default: '' },
  clientInviteUrl: { type: String, default: '' },
  inviteEmail: { type: String, default: '' },
  useCustomInviteEmail: { type: Boolean, default: false },
  inviteLoading: { type: Boolean, default: false },
  appointment: { type: Object, default: null },
  waitingParticipants: { type: Array, default: () => [] },
  admitLoading: { type: Boolean, default: false },
  chatMessages: { type: Array, default: () => [] },
  files: { type: Array, default: () => [] },
  selfParticipantId: { type: [Number, String], default: null },
})

const emit = defineEmits([
  'toggle-audio',
  'toggle-video',
  'toggle-speaker',
  'start-screen-share',
  'stop-screen-share',
  'leave',
  'minimize',
  'admit',
  'send-chat',
  'delete-chat',
  'upload-file',
  'download-file',
  'delete-file',
  'copy-invite',
  'resend-invite',
  'update:inviteEmail',
  'update:useCustomInviteEmail',
])

const { t } = useI18n()
const localVideoRef = ref(null)
const remoteVideoRef = ref(null)
const screenVideoRef = ref(null)
const sidePanel = ref(null)
const hasRemoteMedia = ref(false)
let detachRemoteTrackWatchers = null

const waitingCount = computed(() => props.waitingParticipants.length)
const showWaitingAdmit = computed(() =>
  props.canAdmit || waitingCount.value > 0,
)
const screenShareLabel = computed(() => (
  props.isScreenSharing
    ? t('telehealthStopScreenShare')
    : t('telehealthScreenShare')
))

const hasRemoteScreenTracks = computed(() => (
  Boolean(
    props.remoteScreenStream
    && typeof props.remoteScreenStream.getTracks === 'function'
    && props.remoteScreenStream.getTracks().some(
      track => track && track.readyState !== 'ended',
    ),
  )
))

const isLocalScreenPlaceholder = computed(() => (
  props.isScreenSharing && !hasRemoteScreenTracks.value
))

const showScreenStage = computed(() => (
  hasRemoteScreenTracks.value || isLocalScreenPlaceholder.value
))

/** Only bind a live screen preview for the remote share (never local). */
const screenStageStream = computed(() => (
  hasRemoteScreenTracks.value ? props.remoteScreenStream : null
))

const screenStageLabel = computed(() => t('telehealthRemoteScreenShare'))

const videosLayoutClass = computed(() => {
  if (showScreenStage.value) {
    return 'telehealth-room__videos--screen'
  }
  if (!hasRemoteMedia.value) {
    return 'telehealth-room__videos--solo'
  }

  return 'telehealth-room__videos--people'
})

watch(
  waitingCount,
  (count, previous) => {
    if (count > 0 && count > (previous || 0) && props.canAdmit) {
      sidePanel.value = 'waiting'
    }
  },
)

function bindVideo(el, stream, { remote = false } = {}) {
  if (!el) {
    return
  }
  if (el.srcObject !== stream) {
    el.srcObject = stream || null
  }
  if (!stream) {
    return
  }
  // Autoplay with audio is often blocked — start muted, play, then unmute.
  const wantSound = remote && props.speakerEnabled
  const run = async() => {
    try {
      if (wantSound) {
        el.muted = true
      }
      await el.play()
      if (wantSound) {
        el.muted = false
      } else if (remote) {
        el.muted = true
      }
    } catch {
      // Autoplay blocked until a user gesture; tile still shows frames
      // once the browser allows playback.
    }
  }
  void run()
}

function syncRemoteMediaFlag(stream) {
  // Depend on generation so track attach always re-evaluates.
  void props.remoteMediaGeneration
  if (!stream || typeof stream.getTracks !== 'function') {
    hasRemoteMedia.value = false

    return
  }
  hasRemoteMedia.value = stream.getTracks().some(
    track => track && track.readyState !== 'ended',
  )
}

function bindRemoteTrackWatchers(stream) {
  if (detachRemoteTrackWatchers) {
    detachRemoteTrackWatchers()
    detachRemoteTrackWatchers = null
  }
  syncRemoteMediaFlag(stream)
  if (!stream || typeof stream.addEventListener !== 'function') {
    return
  }
  const bump = () => syncRemoteMediaFlag(stream)
  stream.addEventListener('addtrack', bump)
  stream.addEventListener('removetrack', bump)
  detachRemoteTrackWatchers = () => {
    stream.removeEventListener('addtrack', bump)
    stream.removeEventListener('removetrack', bump)
  }
}

watch(
  () => props.localStream,
  stream => bindVideo(localVideoRef.value, stream),
  { immediate: true },
)

watch(
  () => [props.remoteStream, props.remoteMediaGeneration],
  async() => {
    const stream = props.remoteStream
    bindRemoteTrackWatchers(stream)
    await nextTick()
    bindVideo(remoteVideoRef.value, stream, { remote: true })
  },
  { immediate: true },
)

watch(
  screenStageStream,
  stream => bindVideo(screenVideoRef.value, stream),
  { immediate: true },
)

watch(localVideoRef, el => bindVideo(el, props.localStream))
watch(remoteVideoRef, el => {
  bindVideo(el, props.remoteStream, { remote: true })
})
watch(screenVideoRef, el => bindVideo(el, screenStageStream.value))

watch(
  () => props.speakerEnabled,
  enabled => {
    if (remoteVideoRef.value) {
      remoteVideoRef.value.muted = !enabled
      if (enabled && remoteVideoRef.value.srcObject) {
        void remoteVideoRef.value.play().catch(() => {})
      }
    }
  },
)

function toggleSide(name) {
  sidePanel.value = sidePanel.value === name ? null : name
}

function onScreenShareClick() {
  if (props.isScreenSharing) {
    emit('stop-screen-share')
  } else {
    emit('start-screen-share')
  }
}

onBeforeUnmount(() => {
  if (detachRemoteTrackWatchers) {
    detachRemoteTrackWatchers()
    detachRemoteTrackWatchers = null
  }
  bindVideo(localVideoRef.value, null)
  bindVideo(remoteVideoRef.value, null)
  bindVideo(screenVideoRef.value, null)
})
</script>
