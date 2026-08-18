<template>
  <q-card
    class="portal-card portal-open-requests q-mb-md"
    :data-testid="portalTestIds.appointmentsOpenRequests"
  >
    <q-card-section>
      <div class="portal-section-head">
        <div class="portal-section-head__icon" aria-hidden="true">
          <q-icon name="event_available" size="22px" />
        </div>
        <div class="portal-section-head__text">
          <div class="portal-section-head__title-row">
            <h2 class="portal-section-head__title">
              {{ t('pendingRequests') }}
            </h2>
            <span
              v-if="items.length"
              class="portal-count-chip"
            >
              {{ items.length }}
            </span>
          </div>
          <p class="portal-section-head__hint">
            {{ t('openRequestsHint') }}
          </p>
        </div>
      </div>

      <div
        v-if="items.length"
        class="portal-open-requests__list"
      >
        <article
          v-for="item in items"
          :key="item.id"
          class="portal-request-item"
        >
          <div class="portal-request-item__main">
            <span class="portal-status-chip">
              {{ t('requestStatusPending') }}
            </span>
            <div class="portal-request-item__when">
              {{ requestDate(item) }}
            </div>
            <div
              v-if="requestTime(item)"
              class="portal-request-item__time"
            >
              {{ requestTime(item) }}
            </div>
            <div
              v-if="item.service_name"
              class="portal-request-item__service"
            >
              {{ item.service_name }}
            </div>
            <div
              v-if="item.notes"
              class="portal-request-item__notes"
            >
              {{ item.notes }}
            </div>
          </div>
          <q-btn
            v-if="item.can_cancel"
            outline
            no-caps
            color="primary"
            class="portal-request-item__action"
            :label="t('cancelRequest')"
            :data-testid="portalTestIds.appointmentsRequestCancel(
              item.id
            )"
            @click="emit('cancel', item)"
          />
        </article>
      </div>
      <div v-else class="portal-empty">
        <div class="text-body2 text-grey-7">
          {{ t('openRequestsEmpty') }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { portalTestIds } from 'src/test-ids/index.js'
import {
  formatPortalDate,
  formatPortalTime,
} from 'src/utils/portal-datetime.js'

defineProps({
  items: { type: Array, default: () => [] },
})

const emit = defineEmits(['cancel'])
const { t } = useI18n()

function requestDate(item) {
  return formatPortalDate(item.preferred_start_at_utc)
    || t('timeToBeConfirmed')
}

function requestTime(item) {
  const start = formatPortalTime(item.preferred_start_at_utc)
  if (!start) {
    return ''
  }
  const end = formatPortalTime(item.preferred_end_at_utc)
  if (end && end !== start) {
    return `${start} – ${end}`
  }

  return start
}
</script>
