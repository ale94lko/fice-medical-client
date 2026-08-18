<template>
  <div :data-testid="portalTestIds.appointmentsPage">
    <h1 class="portal-page__title">{{ t('appointments') }}</h1>
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

    <PortalBookingWizard
      v-if="showWizard"
      :needs-profile="!profileReady"
      :can-choose-clinician="canChooseClinician"
      :can-book="canBookAppointment"
      @completed="reload"
    />

    <PortalOpenRequestsCard
      :items="pendingRequests"
      @cancel="onCancelRequest"
    />

    <q-card class="portal-card q-mb-md">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          {{ t('upcomingAppointments') }}
        </div>
        <div v-if="upcoming.length">
          <div
            v-for="item in upcoming"
            :key="item.appointment_id"
            class="portal-list-row"
          >
            <div>
              <div class="text-body1 text-weight-medium">
                {{ formatPortalDateTime(item.start_at_utc) }}
              </div>
              <div class="portal-list-row__meta">
                {{ appointmentMeta(item) }}
              </div>
            </div>
            <div class="portal-list-row__actions">
              <q-btn
                v-if="item.can_join_telehealth"
                unelevated
                no-caps
                color="primary"
                :label="t('telehealthJoinVisit')"
                :data-testid="portalTestIds.appointmentsJoin(
                  item.appointment_id
                )"
                :to="{
                  name: 'PortalTelehealth',
                  params: { id: item.appointment_id },
                }"
              />
              <q-btn
                v-if="item.can_cancel"
                outline
                no-caps
                color="primary"
                :label="t('cancelAppointment')"
                :data-testid="portalTestIds.appointmentsCancel(
                  item.appointment_id
                )"
                @click="onCancelAppointment(item)"
              />
            </div>
          </div>
        </div>
        <div v-else class="portal-empty">
          <div class="text-body2 text-grey-7">
            {{ t('noUpcomingAppointments') }}
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="past.length" class="portal-card">
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">
          {{ t('pastAppointments') }}
        </div>
        <div
          v-for="item in past"
          :key="item.appointment_id"
          class="portal-list-row"
        >
          <div>
            <div class="text-body1 text-weight-medium">
              {{ formatPortalDateTime(item.start_at_utc) }}
            </div>
            <div class="portal-list-row__meta">
              {{ appointmentMeta(item) }}
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
import PortalBookingWizard
  from 'src/components/PortalBookingWizard.vue'
import PortalOpenRequestsCard
  from 'src/components/PortalOpenRequestsCard.vue'
import { portalTestIds } from 'src/test-ids/index.js'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import { formatPortalDateTime } from 'src/utils/portal-datetime.js'

const { t } = useI18n()
const payload = ref(null)
const bookingOptions = ref(null)

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
  (payload.value?.requests || []).filter((item) => item.status === 'PENDING')
))

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

const showWizard = computed(() => {
  const options = bookingOptions.value
  if (!options) {
    return Boolean(payload.value?.can_request || payload.value?.can_book)
      || Boolean(payload.value?.needs_profile_completion)
  }
  return Boolean(options.can_request || options.can_book)
    || Boolean(options.needs_profile_completion)
})

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

function appointmentMeta(item) {
  const parts = [
    item.clinician_display_name,
    (item.service_names || []).join(', '),
    item.status,
  ].filter(Boolean)
  return parts.join(' · ')
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
</script>
