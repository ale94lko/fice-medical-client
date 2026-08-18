<template>
  <div class="telehealth-room__panel">
    <h3 class="telehealth-room__panel-title">
      {{ t('telehealthWaitingPanelTitle') }}
    </h3>
    <p
      v-if="!waitingParticipants.length"
      class="telehealth-waiting-admit__empty">
      {{ t('telehealthWaitingEmpty') }}
    </p>
    <div
      v-for="participant in waitingParticipants"
      :key="participant.id"
      class="telehealth-participant-row">
      <div>
        <div>
          {{ participant.displayName || t('telehealthChatUnknown') }}
        </div>
        <div class="telehealth-waiting-admit__meta">
          {{ roleLabel(participant.role) }}
          · {{ statusLabel(participant.status) }}
          <span v-if="participant.ready">
            · {{ t('telehealthReadyBadge') }}
          </span>
        </div>
      </div>
      <q-btn
        v-if="canAdmit"
        no-caps
        unelevated
        color="primary"
        dense
        :data-testid="telehealthTestIds.admit(participant.id)"
        :label="t('telehealthAdmit')"
        :loading="loading"
        @click="$emit('admit', participant.id)"
      />
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { telehealthTestIds } from 'src/test-ids/index.js'
import {
  telehealthParticipantStatusLabel,
  telehealthRoleLabel,
} from 'src/utils/telehealth-normalize.js'

defineProps({
  waitingParticipants: { type: Array, default: () => [] },
  canAdmit: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

defineEmits(['admit'])

const { t } = useI18n()

function roleLabel(role) {
  return telehealthRoleLabel(role, t)
}

function statusLabel(status) {
  return telehealthParticipantStatusLabel(status, t)
}
</script>
