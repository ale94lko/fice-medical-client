<template>
  <div class="telehealth-waiting telehealth-waiting--with-preview">
    <div class="telehealth-card telehealth-waiting__card">
      <div class="telehealth-waiting__layout">
        <div class="telehealth-waiting__preview-col">
          <div class="telehealth-waiting__preview-wrap">
            <TelehealthSelfPreview :stream="localStream" />
            <div
              v-if="!cameraEnabled"
              class="telehealth-waiting__preview-off">
              <q-icon name="videocam_off" size="40px" />
              <span>{{ t('telehealthLobbyCameraOff') }}</span>
            </div>
          </div>
        </div>

        <div class="telehealth-waiting__controls">
          <div class="telehealth-waiting__status">
            <span class="telehealth-waiting__status-dot" aria-hidden="true" />
            <span>{{ t('telehealthWaitingClientStatus') }}</span>
          </div>

          <h1 class="telehealth-waiting__title">
            {{ t('telehealthWaitingClientTitle') }}
          </h1>
          <p class="telehealth-waiting__body">
            {{ t('telehealthWaitingClientBody') }}
          </p>

          <div class="telehealth-waiting__devices">
            <button
              type="button"
              class="telehealth-waiting__device"
              :class="{
                'telehealth-waiting__device--ok': cameraEnabled,
                'telehealth-waiting__device--off': !cameraEnabled,
              }"
              :disabled="loading"
              :aria-label="t('telehealthToggleCam')"
              @click="$emit('toggle-camera')">
              <q-icon
                :name="cameraEnabled ? 'videocam' : 'videocam_off'"
                size="22px"
              />
              <span>{{ t('telehealthCameraTest') }}</span>
            </button>
            <button
              type="button"
              class="telehealth-waiting__device"
              :class="{
                'telehealth-waiting__device--ok': micEnabled,
                'telehealth-waiting__device--off': !micEnabled,
              }"
              :disabled="loading"
              :aria-label="t('telehealthToggleMic')"
              @click="$emit('toggle-mic')">
              <q-icon
                :name="micEnabled ? 'mic' : 'mic_off'"
                size="22px"
              />
              <span>{{ t('telehealthMicTest') }}</span>
            </button>
            <button
              type="button"
              class="telehealth-waiting__device"
              :class="{
                'telehealth-waiting__device--ok': speakerEnabled,
                'telehealth-waiting__device--off': !speakerEnabled,
              }"
              :disabled="loading"
              :aria-label="t('telehealthToggleSpeaker')"
              @click="$emit('toggle-speaker')">
              <q-icon
                :name="speakerEnabled ? 'volume_up' : 'volume_off'"
                size="22px"
              />
              <span>{{ t('telehealthSpeakerTest') }}</span>
            </button>
          </div>

          <div class="telehealth-waiting__trust">
            <q-icon
              name="hourglass_top"
              size="26px"
              class="telehealth-waiting__trust-icon"
            />
            <div class="telehealth-waiting__trust-body">
              <p class="telehealth-waiting__trust-title">
                {{ t('telehealthWaitingClientTrustTitle') }}
              </p>
              <p class="telehealth-waiting__trust-text">
                {{ t('telehealthWaitingClientTrustBody') }}
              </p>
            </div>
          </div>

          <div class="telehealth-waiting__actions">
            <q-btn
              no-caps
              unelevated
              color="negative"
              size="lg"
              icon="call_end"
              class="telehealth-waiting__leave-btn full-width"
              :data-testid="telehealthTestIds.waitingLeave"
              :label="t('telehealthLeave')"
              :loading="loading"
              @click="$emit('leave')"
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
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import TelehealthSelfPreview from
  'components/telehealth/TelehealthSelfPreview.vue'
import { telehealthTestIds } from 'src/test-ids/index.js'

defineProps({
  localStream: { type: Object, default: null },
  cameraEnabled: { type: Boolean, default: true },
  micEnabled: { type: Boolean, default: true },
  speakerEnabled: { type: Boolean, default: true },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

defineEmits([
  'leave',
  'toggle-camera',
  'toggle-mic',
  'toggle-speaker',
])
const { t } = useI18n()
</script>
