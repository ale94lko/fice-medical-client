<template>
  <div>
    <h1 class="portal-page__title">
      {{ welcomeTitle }}
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

    <div class="row q-col-gutter-md portal-dashboard-kpis">
      <div class="col-12 col-sm-6 col-lg-3">
        <PortalDashboardKpiCard
          :label="t('kpiUpcomingLabel')"
          :hint="t('kpiUpcomingHint')"
          :value="scheduledCount"
          icon="event"
          tone="primary"
          to="/appointments"
          :test-id="portalTestIds.dashboardKpiScheduled"
        />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <PortalDashboardKpiCard
          :label="t('kpiRequestsLabel')"
          :hint="t('kpiRequestsHint')"
          :value="requestCount"
          icon="schedule"
          tone="warning"
          to="/appointments"
          :test-id="portalTestIds.dashboardKpiRequests"
        />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <PortalDashboardKpiCard
          :label="t('kpiDocumentsLabel')"
          :hint="t('kpiDocumentsHint')"
          :value="documentCount"
          icon="description"
          tone="info"
          to="/documents"
          :test-id="portalTestIds.dashboardKpiDocuments"
        />
      </div>
      <div class="col-12 col-sm-6 col-lg-3">
        <PortalDashboardKpiCard
          :label="t('kpiConsentsLabel')"
          :hint="t('kpiConsentsHint')"
          :value="consentCount"
          icon="verified_user"
          tone="accent"
          to="/consents"
          :test-id="portalTestIds.dashboardKpiConsents"
        />
      </div>
    </div>

    <div class="row q-col-gutter-md portal-dashboard-grid q-mt-md">
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
    </div>

    <div class="row q-col-gutter-md portal-dashboard-grid q-mt-md">
      <div class="col-12 col-md-5">
        <q-card
          class="portal-card portal-action-card"
          :data-testid="portalTestIds.dashboardTasks"
        >
          <q-card-section class="portal-action-card__section">
            <div class="portal-section-head">
              <div
                class="portal-section-head__icon"
                aria-hidden="true"
              >
                <q-icon name="task_alt" size="22px" />
              </div>
              <div class="portal-section-head__text">
                <div class="portal-section-head__title-row">
                  <h2 class="portal-section-head__title">
                    {{ t('dashboardTasksTitle') }}
                  </h2>
                  <span
                    v-if="taskItems.length"
                    class="portal-count-chip"
                  >
                    {{ taskItems.length }}
                  </span>
                </div>
              </div>
            </div>
            <div v-if="taskItems.length" class="portal-task-list">
              <router-link
                v-for="task in taskItems"
                :key="task.key"
                class="portal-task"
                :to="task.to"
                :data-testid="task.testId"
              >
                <div class="portal-task__icon" aria-hidden="true">
                  <q-icon :name="task.icon" size="18px" />
                </div>
                <div class="portal-task__body">
                  <div class="portal-task__title">
                    {{ task.title }}
                  </div>
                  <div v-if="task.meta" class="portal-task__meta">
                    {{ task.meta }}
                  </div>
                </div>
                <q-icon
                  name="chevron_right"
                  size="18px"
                  class="portal-task__chevron"
                />
              </router-link>
            </div>
            <div v-else class="portal-empty">
              <div class="text-body2 text-grey-7">
                {{ t('dashboardTasksEmpty') }}
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-7">
        <q-card
          class="portal-card portal-action-card"
          :data-testid="portalTestIds.dashboardQuickActions"
        >
          <q-card-section class="portal-action-card__section">
            <div class="portal-section-head">
              <div
                class="portal-section-head__icon"
                aria-hidden="true"
              >
                <q-icon name="bolt" size="22px" />
              </div>
              <div class="portal-section-head__text">
                <h2 class="portal-section-head__title">
                  {{ t('quickActionsTitle') }}
                </h2>
              </div>
            </div>
            <div class="portal-quick-actions">
              <router-link
                v-for="action in linkActions"
                :key="action.key"
                class="portal-quick-action"
                :to="action.to"
                :data-testid="action.testId"
              >
                <q-icon :name="action.icon" size="22px" />
                <span>{{ action.label }}</span>
              </router-link>
              <button
                type="button"
                class="portal-quick-action"
                :data-testid="portalTestIds.dashboardQuickMessage"
                @click="openChat"
              >
                <q-icon name="chat" size="22px" />
                <span>{{ t('quickActionMessage') }}</span>
              </button>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
import PortalDashboardKpiCard from
  'src/components/PortalDashboardKpiCard.vue'
import PortalDashboardStatCard
  from 'src/components/PortalDashboardStatCard.vue'
import { usePortalChatPanel } from
  'src/composables/usePortalChatPanel.js'
import { portalTestIds } from 'src/test-ids/index.js'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import {
  formatPortalDate,
  formatPortalTime,
} from 'src/utils/portal-datetime.js'
import { toPortalPlaceFields }
  from 'src/utils/portal-place-of-service.js'
import { toPortalJoinFields }
  from 'src/utils/portal-telehealth-join.js'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const authStore = useAuthStore()
const { openChat } = usePortalChatPanel()
const dashboard = ref(null)

const welcomeTitle = computed(() => {
  const name = String(authStore.displayName ?? '').trim()
  if (!name) {
    return t('welcome')
  }
  return t('welcomeBack', { name })
})

const waitingForChart = computed(() =>
  Boolean(dashboard.value)
  && !dashboard.value.needs_profile_completion
  && !dashboard.value.has_client,
)

const scheduledCount = computed(() => kpiCount(
  dashboard.value?.scheduled_appointment_count,
  dashboard.value?.scheduled_appointments,
))
const requestCount = computed(() => kpiCount(
  dashboard.value?.pending_request_count,
  dashboard.value?.pending_requests,
))
const documentCount = computed(() => kpiCount(
  dashboard.value?.document_count,
  dashboard.value?.documents,
))
const consentCount = computed(() => kpiCount(
  dashboard.value?.pending_consent_count,
  dashboard.value?.pending_consents,
))

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

const taskItems = computed(() => {
  const tasks = []
  if (dashboard.value?.needs_profile_completion) {
    tasks.push({
      key: 'profile',
      icon: 'person',
      title: t('dashboardTaskCompleteProfile'),
      to: '/profile',
      testId: portalTestIds.dashboardTaskProfile,
    })
  }
  for (const item of dashboard.value?.pending_consents || []) {
    tasks.push({
      key: `consent-${item.id}`,
      icon: 'verified_user',
      title: t('dashboardTaskSignConsent', {
        name: item.name || t('consents'),
      }),
      meta: formatPortalDate(item.assigned_at),
      to: '/consents',
      testId: portalTestIds.dashboardTaskConsent(item.id),
    })
  }
  return tasks
})

const linkActions = computed(() => [
  {
    key: 'book',
    icon: 'event',
    label: t('quickActionBook'),
    to: '/appointments',
    testId: portalTestIds.dashboardQuickBook,
  },
  {
    key: 'docs',
    icon: 'upload_file',
    label: t('quickActionDocuments'),
    to: '/documents',
    testId: portalTestIds.dashboardQuickDocuments,
  },
  {
    key: 'consents',
    icon: 'verified_user',
    label: t('quickActionConsents'),
    to: '/consents',
    testId: portalTestIds.dashboardQuickConsents,
  },
  {
    key: 'profile',
    icon: 'person',
    label: t('quickActionProfile'),
    to: '/profile',
    testId: portalTestIds.dashboardQuickProfile,
  },
  {
    key: 'settings',
    icon: 'settings',
    label: t('quickActionSettings'),
    to: '/security',
    testId: portalTestIds.dashboardQuickSettings,
  },
])

onMounted(async() => {
  if (!authStore.me) {
    await authStore.loadMe()
  }
  const { data } = await api.get(portalPaths.dashboard)
  dashboard.value = unwrapData(data)
})

function kpiCount(value, list) {
  const n = Number(value)
  if (Number.isFinite(n)) {
    return n
  }
  return (list || []).length
}

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
