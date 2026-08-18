<template>
  <div class="telehealth-lobby">
    <div class="telehealth-card telehealth-lobby__card">
      <div class="telehealth-lobby__layout">
        <div class="telehealth-lobby__preview-col">
          <div class="telehealth-preview telehealth-lobby__preview">
            <video
              ref="previewRef"
              autoplay
              muted
              playsinline
            />
            <div
              v-if="!cameraEnabled || !cameraAvailable"
              class="telehealth-lobby__preview-off">
              <q-icon name="videocam_off" size="40px" />
              <span>{{ t('telehealthLobbyCameraOff') }}</span>
            </div>
          </div>
        </div>

        <div class="telehealth-lobby__controls">
          <div class="telehealth-lobby__header">
            <div class="telehealth-lobby__intro">
              <h1>{{ t('telehealthLobbyTitle') }}</h1>
              <p>{{ t('telehealthLobbySubtitle') }}</p>
            </div>
          </div>

          <label class="telehealth-lobby__field-label">
            {{ t('telehealthDisplayName') }}
          </label>
          <q-input
            v-model="name"
            outlined
            dark
            dense
            class="telehealth-lobby__name-input q-mb-sm"
            :disable="joining"
            :placeholder="t('telehealthDisplayName')"
          >
            <template #append>
              <q-icon name="edit" size="18px" />
            </template>
          </q-input>

          <div class="telehealth-lobby__devices">
            <button
              type="button"
              class="telehealth-lobby__device"
              :class="deviceClass(cameraAvailable, cameraEnabled)"
              :disabled="joining || !cameraAvailable"
              :aria-label="t('telehealthToggleCam')"
              @click="toggleCamera">
              <div class="telehealth-lobby__device-top">
                <q-icon
                  :name="cameraEnabled ? 'videocam' : 'videocam_off'"
                  size="20px"
                />
                <q-icon
                  :name="cameraAvailable ? 'check_circle' : 'error'"
                  size="18px"
                  class="telehealth-lobby__device-status"
                />
              </div>
              <span class="telehealth-lobby__device-title">
                {{ t('telehealthCameraTest') }}
              </span>
              <span class="telehealth-lobby__device-name">
                {{ cameraLabel }}
              </span>
            </button>

            <button
              type="button"
              class="telehealth-lobby__device"
              :class="deviceClass(micAvailable, micEnabled)"
              :disabled="joining || !micAvailable"
              :aria-label="t('telehealthToggleMic')"
              @click="toggleMic">
              <div class="telehealth-lobby__device-top">
                <q-icon
                  :name="micEnabled ? 'mic' : 'mic_off'"
                  size="20px"
                />
                <q-icon
                  :name="micAvailable ? 'check_circle' : 'error'"
                  size="18px"
                  class="telehealth-lobby__device-status"
                />
              </div>
              <span class="telehealth-lobby__device-title">
                {{ t('telehealthMicTest') }}
              </span>
              <span class="telehealth-lobby__device-name">
                {{ micLabel }}
              </span>
            </button>

            <button
              type="button"
              class="telehealth-lobby__device"
              :class="deviceClass(true, speakerEnabled)"
              :disabled="joining"
              :aria-label="t('telehealthToggleSpeaker')"
              @click="toggleSpeaker">
              <div class="telehealth-lobby__device-top">
                <q-icon
                  :name="speakerEnabled ? 'volume_up' : 'volume_off'"
                  size="20px"
                />
                <q-icon
                  name="check_circle"
                  size="18px"
                  class="telehealth-lobby__device-status"
                />
              </div>
              <span class="telehealth-lobby__device-title">
                {{ t('telehealthSpeakerTest') }}
              </span>
              <span class="telehealth-lobby__device-name">
                {{ speakerLabel }}
              </span>
            </button>
          </div>

          <div
            v-if="showAdmitNotice"
            class="telehealth-lobby__trust">
            <q-icon
              name="verified_user"
              size="28px"
              class="telehealth-lobby__trust-icon"
            />
            <div class="telehealth-lobby__trust-body">
              <div class="telehealth-lobby__trust-title-row">
                <p class="telehealth-lobby__trust-title">
                  {{ t('telehealthLobbyTrustTitle') }}
                </p>
                <button
                  type="button"
                  class="telehealth-lobby__learn-more"
                  @click="showPrivacyInfo = true">
                  {{ t('telehealthLobbyLearnMore') }}
                </button>
              </div>
              <p class="telehealth-lobby__trust-text">
                {{ t('telehealthLobbyTrustBodyClient') }}
              </p>
            </div>
          </div>

          <div class="telehealth-lobby__actions">
            <q-btn
              no-caps
              unelevated
              color="primary"
              size="lg"
              icon="lock"
              class="telehealth-lobby__join-btn full-width"
              :data-testid="telehealthTestIds.lobbyJoin"
              :label="t('telehealthJoin')"
              :loading="joining"
              :disable="!nameTrimmed"
              @click="onJoin"
            />
            <button
              type="button"
              class="telehealth-lobby__troubleshoot"
              :disabled="joining || troubleshooting"
              @click="onTroubleshoot">
              <q-icon name="settings" size="18px" />
              <span>{{ t('telehealthLobbyTroubleshoot') }}</span>
            </button>
            <q-btn
              v-if="showBack"
              no-caps
              outline
              color="white"
              class="telehealth-lobby__back-btn full-width"
              :data-testid="telehealthTestIds.lobbyBack"
              :label="t('telehealthBackToApp')"
              :disable="joining"
              @click="$emit('back')"
            />
          </div>

          <p
            v-if="error"
            class="text-negative q-mt-sm q-mb-none">
            {{ error }}
          </p>
        </div>
      </div>
    </div>

    <q-dialog v-model="showPrivacyInfo">
      <q-card class="telehealth-lobby__privacy-dialog">
        <q-card-section>
          <div class="text-h6">
            {{ t('telehealthLobbyTrustTitle') }}
          </div>
        </q-card-section>
        <q-card-section class="q-pt-none">
          {{ t('telehealthLobbyPrivacyDialog') }}
        </q-card-section>
        <q-card-actions align="right">
          <q-btn
            v-close-popup
            flat
            no-caps
            color="primary"
            :data-testid="telehealthTestIds.lobbyDeviceClose"
            :label="t('close')"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { telehealthTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  initialName: { type: String, default: '' },
  joining: { type: Boolean, default: false },
  error: { type: String, default: '' },
  showBack: { type: Boolean, default: true },
  /** Client/guest: explain provider admit. Staff: secure session copy. */
  showAdmitNotice: { type: Boolean, default: true },
})

const emit = defineEmits(['join', 'back'])
const { t } = useI18n()

const name = ref(String(props.initialName ?? '').trim())
const previewRef = ref(null)
const previewStream = ref(null)
const cameraEnabled = ref(true)
const micEnabled = ref(true)
const speakerEnabled = ref(true)
const cameraAvailable = ref(false)
const micAvailable = ref(false)
const troubleshooting = ref(false)
const showPrivacyInfo = ref(false)
const deviceTick = ref(0)

const nameTrimmed = computed(() => String(name.value ?? '').trim())

const cameraLabel = computed(() => {
  deviceTick.value
  const label = previewStream.value?.getVideoTracks?.()?.[0]?.label

  return String(label || '').trim() || t('telehealthLobbyDeviceUnknown')
})

const micLabel = computed(() => {
  deviceTick.value
  const label = previewStream.value?.getAudioTracks?.()?.[0]?.label

  return String(label || '').trim() || t('telehealthLobbyDeviceUnknown')
})

const speakerLabel = computed(() => t('telehealthLobbySpeakerDefault'))

watch(
  () => props.initialName,
  value => {
    const next = String(value ?? '').trim()
    if (next) {
      name.value = next
    }
  },
)

function deviceClass(available, enabled) {
  return {
    'telehealth-lobby__device--ok': available && enabled,
    'telehealth-lobby__device--off': available && !enabled,
    'telehealth-lobby__device--missing': !available,
  }
}

function applyTrackEnabled() {
  const stream = previewStream.value
  if (!stream) {
    return
  }
  stream.getVideoTracks().forEach(track => {
    track.enabled = cameraEnabled.value
  })
  stream.getAudioTracks().forEach(track => {
    track.enabled = micEnabled.value
  })
  deviceTick.value += 1
}

function toggleCamera() {
  if (!cameraAvailable.value) {
    return
  }
  cameraEnabled.value = !cameraEnabled.value
  applyTrackEnabled()
}

function toggleMic() {
  if (!micAvailable.value) {
    return
  }
  micEnabled.value = !micEnabled.value
  applyTrackEnabled()
}

function toggleSpeaker() {
  speakerEnabled.value = !speakerEnabled.value
  if (speakerEnabled.value) {
    playSpeakerTestTone()
  }
}

function playSpeakerTestTone() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) {
      return
    }
    const ctx = new AudioCtx()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = 880
    gain.gain.value = 0.08
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + 0.18)
    oscillator.onended = () => {
      ctx.close().catch(() => {})
    }
  } catch {
    // ignore — speaker preference still toggles
  }
}

async function attachPreview() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    })
    if (previewStream.value) {
      previewStream.value.getTracks().forEach(track => track.stop())
    }
    previewStream.value = stream
    if (previewRef.value) {
      previewRef.value.srcObject = stream
    }
    cameraAvailable.value = stream.getVideoTracks().length > 0
    micAvailable.value = stream.getAudioTracks().length > 0
    if (!cameraAvailable.value) {
      cameraEnabled.value = false
    }
    if (!micAvailable.value) {
      micEnabled.value = false
    }
    applyTrackEnabled()
  } catch {
    cameraAvailable.value = false
    micAvailable.value = false
    cameraEnabled.value = false
    micEnabled.value = false
    deviceTick.value += 1
  }
}

function stopPreview() {
  previewStream.value?.getTracks().forEach(track => track.stop())
  previewStream.value = null
  if (previewRef.value) {
    previewRef.value.srcObject = null
  }
}

async function onTroubleshoot() {
  troubleshooting.value = true
  try {
    await attachPreview()
    if (speakerEnabled.value) {
      playSpeakerTestTone()
    }
  } finally {
    troubleshooting.value = false
  }
}

function onJoin() {
  const stream = previewStream.value
  applyTrackEnabled()
  // Hand off to waiting/in-call; do not stop tracks on unmount.
  previewStream.value = null
  if (previewRef.value) {
    previewRef.value.srcObject = null
  }
  emit('join', {
    displayName: nameTrimmed.value,
    cameraTested: cameraAvailable.value,
    microphoneTested: micAvailable.value,
    speakerTested: true,
    cameraEnabled: cameraEnabled.value,
    microphoneEnabled: micEnabled.value,
    speakerEnabled: speakerEnabled.value,
    previewStream: stream,
  })
}

onMounted(() => {
  attachPreview()
})

onBeforeUnmount(() => {
  stopPreview()
})
</script>
