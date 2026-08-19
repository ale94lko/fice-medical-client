<template>
  <div>
    <h1 class="portal-page__title">
      {{ t('welcome') }}{{
        authStore.displayName ? `, ${authStore.displayName}` : ''
      }}
    </h1>
    <p class="portal-page__lead">{{ t('dashboardLead') }}</p>

    <q-banner
      v-if="dashboard?.needs_profile_completion"
      class="portal-banner q-mb-lg"
      rounded
    >
      {{ t('needsClientRecord') }}
      <template #action>
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="t('completeProfile')"
          to="/profile"
          :data-testid="portalTestIds.dashboardCompleteProfile"
        />
      </template>
    </q-banner>
    <q-banner
      v-else-if="waitingForChart"
      class="portal-banner q-mb-lg"
      rounded
    >
      {{ t('waitingForClientChart') }}
    </q-banner>

    <div class="row q-col-gutter-md portal-dashboard-grid">
      <div class="col-12 col-md-6">
        <PortalDashboardStatCard
          :title="t('dashboardRequestsTitle')"
          :hint="t('dashboardRequestsHint')"
          icon="event_available"
          :items="requestItems"
          :empty-text="t('openRequestsEmpty')"
          :test-id="portalTestIds.dashboardRequests"
          view-more-to="/appointments"
          :view-more-test-id="portalTestIds.dashboardViewMore(
            'requests',
          )"
        />
      </div>
      <div class="col-12 col-md-6">
        <PortalDashboardStatCard
          :title="t('dashboardScheduledTitle')"
          :hint="t('dashboardScheduledHint')"
          icon="event"
          :items="appointmentItems"
          :empty-text="t('noUpcomingAppointments')"
          :test-id="portalTestIds.dashboardScheduled"
          view-more-to="/appointments"
          :view-more-test-id="portalTestIds.dashboardViewMore(
            'scheduled',
          )"
        />
      </div>
      <div class="col-12 col-md-6">
        <PortalDashboardStatCard
          :title="t('dashboardConsentsTitle')"
          :hint="t('dashboardConsentsHint')"
          icon="verified_user"
          :items="consentItems"
          :empty-text="t('dashboardConsentsEmpty')"
          :test-id="portalTestIds.dashboardConsents"
          view-more-to="/consents"
          :view-more-test-id="portalTestIds.dashboardViewMore(
            'consents',
          )"
        />
      </div>
      <div class="col-12 col-md-6">
        <PortalDashboardStatCard
          :title="t('documents')"
          :hint="t('dashboardDocumentsHint')"
          icon="folder"
          :items="documentItems"
          :empty-text="t('dashboardDocumentsEmpty')"
          :test-id="portalTestIds.dashboardDocuments"
          view-more-to="/documents"
          :view-more-test-id="portalTestIds.dashboardViewMore(
            'documents',
          )"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
import PortalDashboardStatCard
  from 'src/components/PortalDashboardStatCard.vue'
import { portalTestIds } from 'src/test-ids/index.js'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import {
  formatPortalDate,
  formatPortalDateTime,
  formatPortalTime,
} from 'src/utils/portal-datetime.js'
import { toPortalPlaceFields }
  from 'src/utils/portal-place-of-service.js'
import { toPortalJoinFields }
  from 'src/utils/portal-telehealth-join.js'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const authStore = useAuthStore()
const dashboard = ref(null)

const waitingForChart = computed(() =>
  Boolean(dashboard.value)
  && !dashboard.value.needs_profile_completion
  && !dashboard.value.has_client,
)

const requestItems = computed(() =>
  (dashboard.value?.pending_requests || []).map((item) => ({
    key: `request-${item.id}`,
    chip: t('requestStatusPending'),
    ...splitWhen(
      item.preferred_start_at_utc,
      t('timeToBeConfirmed'),
    ),
    meta: requestMeta(item),
  })),
)

const appointmentItems = computed(() =>
  (dashboard.value?.scheduled_appointments || []).map((item) => ({
    key: `appt-${item.appointment_id}`,
    ...splitWhen(item.start_at_utc),
    meta: appointmentMeta(item),
    ...toPortalPlaceFields(item, t),
    ...toPortalJoinFields(
      item,
      t,
      portalTestIds.dashboardJoin(item.appointment_id),
    ),
  })),
)

const consentItems = computed(() =>
  (dashboard.value?.pending_consents || []).map((item) => ({
    key: `consent-${item.id}`,
    chip: t('consentToSign'),
    title: item.name || t('consents'),
    meta: formatPortalDate(item.assigned_at),
  })),
)

const documentItems = computed(() =>
  (dashboard.value?.documents || []).map((item) => ({
    key: `doc-${item.id}`,
    title: item.name || t('documents'),
    meta: formatPortalDateTime(item.uploaded_at),
  })),
)

onMounted(async() => {
  if (!authStore.me) {
    await authStore.loadMe()
  }
  const { data } = await api.get(portalPaths.dashboard)
  dashboard.value = unwrapData(data)
})

function splitWhen(value, fallback = '') {
  const date = formatPortalDate(value)
  const time = formatPortalTime(value)

  return {
    title: date || fallback,
    time: date ? time : '',
  }
}

function requestMeta(item) {
  return [item.service_name, item.notes]
    .filter(Boolean)
    .join(' · ')
}

function appointmentMeta(item) {
  const parts = [
    item.clinician_display_name,
    (item.service_names || []).join(', '),
  ].filter(Boolean)
  return parts.join(' · ')
}
</script>
