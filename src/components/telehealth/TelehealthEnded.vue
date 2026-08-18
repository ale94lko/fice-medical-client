<template>
  <div class="telehealth-ended">
    <div class="telehealth-card telehealth-ended__card">
      <div
        class="telehealth-ended__icon"
        :class="{
          'telehealth-ended__icon--done': completed,
        }">
        <q-icon
          :name="completed ? 'task_alt' : 'call_end'"
          size="36px"
        />
      </div>

      <h2 class="telehealth-ended__title">
        {{ t('telehealthEndedTitle') }}
      </h2>
      <p class="telehealth-ended__body">
        {{ t('telehealthEndedBody') }}
      </p>

      <div
        v-if="summaryRows.length"
        class="telehealth-ended__summary">
        <div
          v-for="row in summaryRows"
          :key="row.label"
          class="telehealth-ended__summary-row">
          <span class="telehealth-ended__summary-label">
            {{ row.label }}
          </span>
          <span class="telehealth-ended__summary-value">
            {{ row.value }}
          </span>
        </div>
      </div>

      <div
        v-if="durationLabel"
        class="telehealth-ended__duration">
        <span class="telehealth-ended__duration-label">
          {{ t('telehealthEndedDurationLabel') }}
        </span>
        <span class="telehealth-ended__duration-value">
          {{ durationLabel }}
        </span>
      </div>

      <div
        v-if="completed"
        class="telehealth-ended__badge">
        <q-icon name="check_circle" size="18px" />
        <span>{{ t('telehealthEndedCompleted') }}</span>
      </div>

      <div class="telehealth-ended__actions">
        <q-btn
          v-if="canComplete && !completed"
          no-caps
          unelevated
          color="primary"
          class="telehealth-ended__action-btn"
          :data-testid="telehealthTestIds.endedComplete"
          :label="t('telehealthMarkCompleted')"
          :loading="completeLoading"
          @click="$emit('complete')"
        />
        <q-btn
          no-caps
          :unelevated="!(canComplete && !completed)"
          :outline="canComplete && !completed"
          :color="canComplete && !completed ? 'white' : 'primary'"
          class="telehealth-ended__action-btn"
          :data-testid="telehealthTestIds.endedLeave"
          :label="t('telehealthBackToMeet')"
          @click="$emit('back-meet')"
        />
        <q-btn
          v-if="showBackToApp"
          no-caps
          outline
          color="white"
          class="telehealth-ended__action-btn
            telehealth-ended__action-btn--subtle"
          :data-testid="telehealthTestIds.endedBack"
          :label="t('telehealthBackToApp')"
          @click="$emit('back-calendar')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { telehealthTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  durationSeconds: { type: Number, default: null },
  appointmentNumber: { type: String, default: '' },
  clientDisplayName: { type: String, default: '' },
  canComplete: { type: Boolean, default: false },
  completed: { type: Boolean, default: false },
  completeLoading: { type: Boolean, default: false },
  /** Staff only — guests stay in the meet invite flow. */
  showBackToApp: { type: Boolean, default: false },
})

defineEmits(['back-calendar', 'back-meet', 'complete'])
const { t } = useI18n()

const durationLabel = computed(() => {
  const total = Number(props.durationSeconds)
  if (!Number.isFinite(total) || total <= 0) {
    return ''
  }
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  const secs = Math.floor(total % 60)
  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:`
      + `${String(secs).padStart(2, '0')}`
  }

  return `${mins}:${String(secs).padStart(2, '0')}`
})

const summaryRows = computed(() => {
  const rows = []
  const number = String(props.appointmentNumber ?? '').trim()
  const client = String(props.clientDisplayName ?? '').trim()
  if (number) {
    rows.push({
      label: t('appointmentDetailNumberLabel'),
      value: number,
    })
  }
  if (client) {
    rows.push({
      label: t('client'),
      value: client,
    })
  }

  return rows
})
</script>
