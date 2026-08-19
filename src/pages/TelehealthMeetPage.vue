<template>
  <div class="telehealth-room">
    <header class="telehealth-room__topbar">
      <div class="telehealth-room__brand">
        <span class="telehealth-room__brand-mark">
          <q-icon name="videocam" size="18px" />
        </span>
        <span>{{ t('telehealthBrand') }}</span>
      </div>
      <div
        v-if="showTopbarMeta"
        class="telehealth-room__meta"
      >
        <span
          v-if="topbarClinician"
          class="telehealth-room__meta-item"
        >
          {{ topbarClinician }}
        </span>
        <span
          v-if="topbarDate"
          class="telehealth-room__meta-item"
        >
          {{ topbarDate }}
        </span>
        <span
          v-if="topbarTime"
          class="telehealth-room__meta-item"
        >
          {{ topbarTime }}
        </span>
        <span
          v-if="phase === 'in_call' && sessionElapsedLabel"
          class="telehealth-room__meta-item
            telehealth-room__meta-item--elapsed"
        >
          {{ t('telehealthElapsed', { time: sessionElapsedLabel }) }}
        </span>
      </div>
    </header>

    <div
      v-if="linkError"
      class="telehealth-lobby"
    >
      <div class="telehealth-card">
        <h1>{{ t('telehealthSessionNotReady') }}</h1>
        <p>{{ linkError }}</p>
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="q-mt-md"
          :label="t('telehealthBackToAppointments')"
          :to="{ name: 'Appointments' }"
        />
      </div>
    </div>

    <TelehealthLobby
      v-else-if="phase === 'lobby'"
      :initial-name="displayName"
      :joining="loading"
      :error="error"
      :show-back="true"
      :show-admit-notice="true"
      @join="onLobbyJoin"
      @back="goAppointments"
    />

    <TelehealthWaitingRoomClient
      v-else-if="phase === 'waiting'"
      :local-stream="webrtc.localStream.value"
      :camera-enabled="webrtc.videoEnabled.value"
      :mic-enabled="webrtc.audioEnabled.value"
      :speaker-enabled="webrtc.speakerEnabled.value"
      :loading="loading"
      :error="error"
      @leave="onLeave"
      @toggle-camera="webrtc.toggleVideo()"
      @toggle-mic="webrtc.toggleAudio()"
      @toggle-speaker="webrtc.toggleSpeaker()"
    />

    <TelehealthInCall
      v-else-if="phase === 'in_call'"
      :local-stream="webrtc.localStream.value"
      :remote-stream="webrtc.remoteStream.value"
      :local-screen-stream="webrtc.screenStream.value"
      :remote-screen-stream="webrtc.remoteScreenStream.value"
      :remote-media-generation="webrtc.remoteMediaGeneration.value"
      :audio-enabled="webrtc.audioEnabled.value"
      :video-enabled="webrtc.videoEnabled.value"
      :speaker-enabled="webrtc.speakerEnabled.value"
      :is-screen-sharing="webrtc.isScreenSharing.value"
      :is-remote-screen-sharing="webrtc.isRemoteScreenSharing.value"
      :can-screen-share="false"
      :can-chat="true"
      :can-upload-files="false"
      :can-delete-files="false"
      :show-meet-info="true"
      :show-invite-tools="false"
      :show-meeting-code="false"
      :use-browser-time-zone="true"
      :status-label="sessionStatusLabel"
      :appointment="appointmentView"
      :chat-messages="chatMessages"
      :files="[]"
      :self-participant-id="selfParticipantId"
      @toggle-audio="webrtc.toggleAudio()"
      @toggle-video="webrtc.toggleVideo()"
      @toggle-speaker="webrtc.toggleSpeaker()"
      @leave="onLeave"
      @send-chat="onSendChat"
    />

    <TelehealthEnded
      v-else
      :duration-seconds="lastCallDurationSeconds"
      :show-back-to-app="true"
      @back-meet="goAppointments"
      @back-calendar="goAppointments"
    />
    <PortalSessionExpiryHost />
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { usePortalTelehealth } from
  'src/composables/usePortalTelehealth.js'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
  resolveBrowserTimeZone,
} from 'src/utils/telehealth-datetime.js'
import {
  fetchPortalTelehealthLobby,
  apiErrorMessage,
} from 'src/utils/portal-telehealth-api.js'
import {
  telehealthAppointmentViewFromSession,
  telehealthSessionStatusLabel,
  normalizeTelehealthAppointmentSummary,
} from 'src/utils/telehealth-normalize.js'
import { useAuthStore } from 'stores/auth-store.js'
import TelehealthLobby from
  'src/components/telehealth/TelehealthLobby.vue'
import TelehealthWaitingRoomClient from
  'src/components/telehealth/TelehealthWaitingRoomClient.vue'
import TelehealthInCall from
  'src/components/telehealth/TelehealthInCall.vue'
import TelehealthEnded from
  'src/components/telehealth/TelehealthEnded.vue'
import PortalSessionExpiryHost from
  'src/components/PortalSessionExpiryHost.vue'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const authStore = useAuthStore()

const {
  session,
  phase,
  loading,
  error,
  chatMessages,
  selfParticipantId,
  displayName,
  webrtc,
  join,
  markReady,
  leave,
  beginLobbyEntry,
  lastCallDurationSeconds,
  elapsedLabel: sessionElapsedLabel,
  sendChat,
  bindAppointment,
} = usePortalTelehealth()

const readyFlags = ref({
  cameraTested: false,
  microphoneTested: false,
  speakerTested: false,
})
const linkError = ref('')
const lobbyAppointment = ref(null)

const appointmentId = computed(() =>
  Number(route.params.id),
)

const appointmentView = computed(() =>
  telehealthAppointmentViewFromSession(session.value)
  || lobbyAppointment.value,
)

const displayTimeZone = resolveBrowserTimeZone()

const topbarClinician = computed(() =>
  String(appointmentView.value?.clinicianDisplayName ?? '').trim(),
)
const topbarDate = computed(() =>
  formatUtcDateLong(
    appointmentView.value?.startAtUtc,
    displayTimeZone,
  ) || '',
)
const topbarTime = computed(() =>
  formatUtcTimeRange(
    appointmentView.value?.startAtUtc,
    appointmentView.value?.endAtUtc,
    displayTimeZone,
  ) || '',
)
const showTopbarMeta = computed(() =>
  Boolean(
    topbarClinician.value
    || topbarDate.value
    || topbarTime.value
    || (phase.value === 'in_call' && sessionElapsedLabel.value),
  ),
)

const sessionStatusLabel = computed(() =>
  telehealthSessionStatusLabel(session.value?.status, t),
)

async function onLobbyJoin(payload) {
  readyFlags.value = {
    cameraTested: Boolean(payload.cameraTested),
    microphoneTested: Boolean(payload.microphoneTested),
    speakerTested: Boolean(payload.speakerTested),
  }
  try {
    await join({
      sessionId: appointmentId.value,
      joinRole: 'CLIENT',
      name: payload.displayName,
      previewStream: payload.previewStream || null,
      mediaPrefs: {
        audioEnabled: payload.microphoneEnabled !== false,
        videoEnabled: payload.cameraEnabled !== false,
        speakerEnabled: payload.speakerEnabled !== false,
      },
    })
    await markReady(readyFlags.value)
  } catch {
    // Stay on lobby; session.error is set by the composable.
  }
}

async function onLeave() {
  await leave()
}

async function onSendChat(body) {
  try {
    await sendChat(body)
  } catch (err) {
    $q.notify({
      type: 'negative',
      message: String(err?.message || err),
    })
  }
}

function goAppointments() {
  router.push({ name: 'Appointments' })
}

onMounted(async() => {
  if (!Number.isFinite(appointmentId.value)) {
    linkError.value = t('telehealthSessionNotReady')

    return
  }
  bindAppointment(appointmentId.value)
  displayName.value = authStore.displayName || ''
  await beginLobbyEntry(null)
  try {
    const lobby = await fetchPortalTelehealthLobby()
    lobbyAppointment.value = telehealthAppointmentViewFromSession({
      clinicianDisplayName: lobby?.clinician_display_name
        || lobby?.clinicianDisplayName,
      appointmentSummary: normalizeTelehealthAppointmentSummary(
        lobby?.appointment_summary
        || lobby?.appointmentSummary,
      ),
    })
  } catch (err) {
    linkError.value = apiErrorMessage(
      err,
      t('telehealthSessionNotReady'),
    )
  }
})

onUnmounted(() => {
  if (phase.value === 'in_call' || phase.value === 'waiting') {
    leave().catch(() => {})
  }
})
</script>

<style lang="scss">
@import 'src/css/telehealth-room.scss';
</style>
