<template>
  <div :data-testid="portalTestIds.appointmentsPage">
    <div class="portal-appointments-head">
      <h1 class="portal-page__title">{{ t('appointments') }}</h1>
      <q-btn
        unelevated
        no-caps
        color="primary"
        class="portal-appointments-head__btn"
        :label="t('scheduleVisit')"
        :data-testid="portalTestIds.appointmentsBtnBook"
        @click="openSchedule"
      />
    </div>
    <p class="portal-page__lead">{{ t('appointmentsLead') }}</p>

    <q-banner
      v-if="payload?.needs_profile_completion"
      class="portal-banner q-mb-md"
      rounded
    >
      {{ t('needsClientRecord') }}
      <template #action>
        <q-btn
          flat
          no-caps
          color="primary"
          :label="t('completeProfile')"
          to="/profile"
        />
      </template>
    </q-banner>
    <q-banner
      v-else-if="waitingForChart"
      class="portal-banner q-mb-md"
      rounded
    >
      {{ t('waitingForClientChart') }}
    </q-banner>

    <div class="row q-col-gutter-md portal-dashboard-grid">
      <div class="col-12">
        <PortalDashboardStatCard
          :title="t('upcomingAppointments')"
          :hint="t('upcomingAppointmentsHint')"
          icon="event"
          :items="upcomingItems"
          :empty-text="t('noUpcomingAppointments')"
          :test-id="portalTestIds.appointmentsUpcoming"
          unlimited
          :max-visible="5"
          @cancel="onCancelAppointment"
        />
      </div>
      <div class="col-12 col-md-6">
        <PortalDashboardStatCard
          :title="t('pendingRequests')"
          :hint="t('openRequestsHint')"
          icon="event_available"
          :items="requestItems"
          :empty-text="t('openRequestsEmpty')"
          :test-id="portalTestIds.appointmentsOpenRequests"
          unlimited
          :max-visible="5"
          @cancel="onCancelRequest"
        />
      </div>
      <div class="col-12 col-md-6">
        <PortalDashboardStatCard
          :title="t('pastAppointments')"
          :hint="t('pastAppointmentsHint')"
          icon="history"
          :items="pastItems"
          :empty-text="t('noPastAppointments')"
          :test-id="portalTestIds.appointmentsPast"
          unlimited
          :max-visible="5"
        />
      </div>
    </div>

    <q-dialog
      v-model="scheduleOpen"
      persistent
      full-width
      content-class="portal-schedule-dialog"
      transition-show="scale"
      transition-hide="scale"
    >
      <q-card
        class="portal-dialog portal-dialog--wide portal-card"
        :data-testid="portalTestIds.appointmentsScheduleDialog"
      >
        <q-card-section class="portal-dialog__header">
          <h2 class="portal-dialog__title">
            {{ t('scheduleVisit') }}
          </h2>
          <q-btn
            flat
            round
            dense
            icon="close"
            :aria-label="t('close')"
            :data-testid="
              portalTestIds.appointmentsScheduleDialogClose
            "
            @click="closeSchedule"
          />
        </q-card-section>
        <q-card-section class="portal-dialog__body">
          <p class="portal-dialog__hint">
            {{ t('scheduleVisitHint') }}
          </p>
          <PortalBookingWizard
            v-if="scheduleOpen"
            :needs-profile="!profileReady"
            :can-choose-clinician="canChooseClinician"
            :can-book="canBookAppointment"
            @completed="onScheduleCompleted"
          />
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
import PortalBookingWizard
  from 'src/components/PortalBookingWizard.vue'
import PortalDashboardStatCard
  from 'src/components/PortalDashboardStatCard.vue'
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

const { t } = useI18n()
const payload = ref(null)
const bookingOptions = ref(null)
const scheduleOpen = ref(false)

const upcoming = computed(() => {
  const now = Date.now()
  return (payload.value?.appointments || []).filter((item) => {
    if (item.can_join_telehealth
      && item.status !== 'CANCELLED'
      && item.status !== 'COMPLETED'
      && item.status !== 'NO_SHOW') {
      return true
    }
    const start = new Date(item.start_at_utc).getTime()
    return Number.isFinite(start) && start >= now
      && item.status !== 'CANCELLED'
      && item.status !== 'COMPLETED'
      && item.status !== 'NO_SHOW'
  })
})

const past = computed(() => {
  const now = Date.now()
  const upcomingIds = new Set(
    upcoming.value.map(item => item.appointment_id),
  )
  return (payload.value?.appointments || []).filter((item) => {
    if (upcomingIds.has(item.appointment_id)) {
      return false
    }
    const start = new Date(item.start_at_utc).getTime()
    return !Number.isFinite(start) || start < now
      || item.status === 'CANCELLED'
      || item.status === 'COMPLETED'
      || item.status === 'NO_SHOW'
  })
})

const pendingRequests = computed(() => (
  (payload.value?.requests || []).filter(
    (item) => item.status === 'PENDING',
  )
))

const upcomingItems = computed(() =>
  upcoming.value.map(toVisitItem),
)

const requestItems = computed(() =>
  pendingRequests.value.map(toRequestItem),
)

const pastItems = computed(() => past.value.map(toVisitItem))

const profileReady = computed(() =>
  !payload.value?.needs_profile_completion,
)

const canRequestAppointment = computed(() =>
  Boolean(payload.value?.can_request) && profileReady.value,
)

const canBookAppointment = computed(() =>
  Boolean(
    bookingOptions.value?.can_book ?? payload.value?.can_book,
  ) && profileReady.value,
)

const canChooseClinician = computed(() =>
  bookingOptions.value?.can_choose_clinician !== false,
)

const waitingForChart = computed(() =>
  profileReady.value
  && !payload.value?.has_client
  && canRequestAppointment.value
  && !canBookAppointment.value,
)

onMounted(async() => {
  await reload()
})

async function reload() {
  const [listRes, optionsRes] = await Promise.all([
    api.get(portalPaths.appointments),
    api.get(portalPaths.bookingOptions),
  ])
  payload.value = unwrapData(listRes.data)
  bookingOptions.value = unwrapData(optionsRes.data)
}

const STATUS_KEYS = {
  SCHEDULED: 'appointmentStatusScheduled',
  CONFIRMED: 'appointmentStatusConfirmed',
  CHECKED_IN: 'appointmentStatusCheckedIn',
  IN_PROGRESS: 'appointmentStatusInProgress',
  COMPLETED: 'appointmentStatusCompleted',
  CANCELLED: 'appointmentStatusCancelled',
  NO_SHOW: 'appointmentStatusNoShow',
  RESCHEDULED: 'appointmentStatusRescheduled',
  PENDING: 'appointmentStatusScheduled',
}

function visitStatus(item) {
  const status = String(item?.status || '').toUpperCase()
  const key = STATUS_KEYS[status]
  return key ? t(key) : (item?.status || '')
}

function splitWhen(value, fallback = '') {
  const date = formatPortalDate(value)
  const time = formatPortalTime(value)
  return {
    title: date || fallback,
    time: date ? time : '',
  }
}

function visitMeta(item) {
  return [
    item.clinician_display_name,
    (item.service_names || []).filter(Boolean).join(', '),
  ].filter(Boolean).join(' · ')
}

function toVisitItem(item) {
  const id = item.appointment_id
  return {
    key: `appt-${id}`,
    chip: visitStatus(item),
    ...splitWhen(item.start_at_utc),
    meta: visitMeta(item),
    ...toPortalPlaceFields(item, t),
    ...toPortalJoinFields(
      item,
      t,
      portalTestIds.appointmentsJoin(id),
    ),
    cancelLabel: item.can_cancel ? t('cancelAppointment') : '',
    cancelTestId: portalTestIds.appointmentsCancel(id),
    source: item,
  }
}

function toRequestItem(item) {
  return {
    key: `request-${item.id}`,
    chip: t('requestStatusPending'),
    ...splitWhen(
      item.preferred_start_at_utc,
      t('timeToBeConfirmed'),
    ),
    meta: [item.service_name, item.notes]
      .filter(Boolean)
      .join(' · '),
    cancelLabel: item.can_cancel ? t('cancelRequest') : '',
    cancelTestId: portalTestIds.appointmentsRequestCancel(item.id),
    source: item,
  }
}

async function onCancelAppointment(item) {
  await api.post(portalPaths.appointmentCancel(item.appointment_id), {
    reason: 'Cancelled by client',
  })
  await reload()
}

async function onCancelRequest(item) {
  await api.post(portalPaths.appointmentRequestCancel(item.id))
  await reload()
}

function openSchedule() {
  scheduleOpen.value = true
}

function closeSchedule() {
  scheduleOpen.value = false
}

async function onScheduleCompleted() {
  await reload()
}
</script>
