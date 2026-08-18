<template>
  <q-card
    class="portal-card portal-booking q-mb-md"
    :data-testid="portalTestIds.bookingWizard"
  >
    <q-card-section>
      <div class="portal-section-head">
        <div class="portal-section-head__icon" aria-hidden="true">
          <q-icon name="event" size="22px" />
        </div>
        <div class="portal-section-head__text">
          <h2 class="portal-section-head__title">
            {{ t('scheduleVisit') }}
          </h2>
          <p class="portal-section-head__hint">
            {{ t('scheduleVisitHint') }}
          </p>
        </div>
      </div>

      <q-banner
        v-if="needsProfile"
        class="portal-banner"
        rounded
      >
        {{ t('completeProfileToBook') }}
      </q-banner>

      <div v-else>
        <div
          v-if="step !== BOOKING_STEPS.success"
          class="portal-booking__step-label"
        >
          {{ stepLabel }}
        </div>

        <div
          v-if="step === BOOKING_STEPS.service"
          class="portal-booking__choices"
        >
          <p
            v-if="loadingServices"
            class="text-body2 text-grey-7 q-mb-none"
          >
            {{ t('bookingLoading') }}
          </p>
          <p
            v-else-if="!services.length"
            class="text-body2 text-grey-7 q-mb-none"
          >
            {{ t('bookingNoServices') }}
          </p>
          <button
            v-for="item in services"
            :key="item.id"
            type="button"
            class="portal-booking-choice"
            :class="{
              'portal-booking-choice--active':
                serviceId === item.id,
            }"
            :data-testid="portalTestIds.bookingService(item.id)"
            @click="serviceId = item.id"
          >
            <span class="portal-booking-choice__title">
              {{ item.name }}
            </span>
            <span class="portal-booking-choice__meta">
              {{ serviceMeta(item) }}
            </span>
          </button>
        </div>

        <div
          v-else-if="step === BOOKING_STEPS.clinician"
          class="portal-booking__choices"
        >
          <p
            v-if="loadingClinicians"
            class="text-body2 text-grey-7 q-mb-none"
          >
            {{ t('bookingLoading') }}
          </p>
          <button
            type="button"
            class="portal-booking-choice portal-booking-choice--span"
            :class="{
              'portal-booking-choice--active': anyClinician,
            }"
            :data-testid="portalTestIds.bookingClinicianAny"
            @click="pickAnyClinician"
          >
            <span class="portal-booking-choice__title">
              {{ t('bookingAnyClinician') }}
            </span>
            <span class="portal-booking-choice__meta">
              {{ t('bookingAnyClinicianHint') }}
            </span>
          </button>
          <button
            v-for="item in clinicians"
            :key="item.clinician_id"
            type="button"
            class="portal-booking-choice"
            :class="{
              'portal-booking-choice--active':
                !anyClinician
                && clinicianId === item.clinician_id,
            }"
            :data-testid="portalTestIds.bookingClinician(
              item.clinician_id
            )"
            @click="pickClinician(item.clinician_id)"
          >
            <span class="portal-booking-choice__title">
              {{ item.display_name }}
            </span>
            <span
              class="portal-booking-choice__meta"
            >
              {{ item.specialty }}
            </span>
          </button>
        </div>

        <div
          v-else-if="step === BOOKING_STEPS.when"
          class="portal-form"
        >
          <div class="portal-booking__choices portal-booking__choices--grow">
            <div
              v-for="mode in whenModes"
              :key="mode.value"
              class="portal-booking-choice"
              :class="{
                'portal-booking-choice--active':
                  whenMode === mode.value,
                'portal-booking-choice--span': mode.span,
              }"
            >
              <button
                type="button"
                class="portal-booking-choice__hit"
                :data-testid="mode.testId"
                @click="whenMode = mode.value"
              >
                <span class="portal-booking-choice__title">
                  {{ mode.label }}
                </span>
                <span class="portal-booking-choice__meta">
                  {{ mode.hint }}
                </span>
              </button>
              <div
                v-if="mode.value === 'day' && whenMode === 'day'"
                class="portal-booking-choice__fields"
                @click.stop
              >
                <PortalDateField
                  v-model="dateUs"
                  dense
                  min-today
                  :label="t('bookingDate')"
                  :close-label="t('close')"
                  :test-id="portalTestIds.bookingFieldDate"
                />
              </div>
              <div
                v-if="mode.value === 'range' && whenMode === 'range'"
                class="portal-booking-choice__fields"
                @click.stop
              >
                <div class="portal-booking-choice__fields-row">
                  <PortalDateField
                    v-model="fromDateUs"
                    dense
                    min-today
                    :clearable="false"
                    :label="t('bookingFromDate')"
                    :close-label="t('close')"
                    :test-id="portalTestIds.bookingFieldFromDate"
                  />
                  <PortalDateField
                    v-model="toDateUs"
                    dense
                    min-today
                    :clearable="false"
                    :label="t('bookingToDate')"
                    :close-label="t('close')"
                    :test-id="portalTestIds.bookingFieldToDate"
                  />
                </div>
                <p
                  v-if="rangeTooLong()"
                  class="text-negative text-body2 q-mt-sm q-mb-none"
                >
                  {{ t('bookingRangeMaxDays', { n: maxRangeDays }) }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="step === BOOKING_STEPS.slots">
          <div class="portal-booking-slots">
            <div
              class="portal-booking-slots__tabs"
              role="tablist"
            >
              <button
                v-for="tab in slotTabs"
                :key="tab.key"
                type="button"
                role="tab"
                class="portal-booking-slots__tab"
                :class="{
                  'portal-booking-slots__tab--active':
                    slotPeriod === tab.key,
                }"
                :aria-selected="slotPeriod === tab.key"
                :data-testid="portalTestIds.bookingTab(tab.key)"
                @click="slotPeriod = tab.key"
              >
                {{ t(tab.labelKey) }}
              </button>
            </div>
            <div class="portal-booking-slots__body">
              <p
                v-if="!visibleSlotDays.length"
                class="text-body2 text-grey-7 q-mb-none"
              >
                {{ t('bookingNoSlotsInPeriod') }}
              </p>
              <div
                v-for="day in visibleSlotDays"
                :key="day.date"
                class="portal-booking-day"
              >
                <div class="portal-booking-day__title">
                  {{ slotDayLabel(day.date) }}
                </div>
                <div class="portal-booking-period__slots">
                  <button
                    v-for="slot in day.slots"
                    :key="slot.start_at_utc"
                    type="button"
                    class="portal-booking-slot"
                    :class="{
                      'portal-booking-slot--active':
                        selectedSlot?.start_at_utc
                        === slot.start_at_utc,
                    }"
                    :data-testid="portalTestIds.bookingSlot(
                      slot.start_at_utc
                    )"
                    @click="pickSlot(slot)"
                  >
                    {{ formatPortalTime(slot.start_at_utc) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          v-else-if="step === BOOKING_STEPS.review"
          class="portal-form portal-booking-review"
        >
          <div class="portal-booking-review__summary">
            <div
              v-for="row in reviewRows"
              :key="row.key"
              class="portal-booking-review__item"
            >
              <q-icon
                :name="row.icon"
                size="18px"
                class="portal-booking-review__icon"
              />
              <div class="portal-booking-review__item-text">
                <div class="portal-booking-review__label">
                  {{ row.label }}
                </div>
                <div class="portal-booking-review__value">
                  {{ row.value }}
                </div>
              </div>
            </div>
          </div>
          <div class="portal-booking-review__footer">
            <LoginTextInput
              v-model="notes"
              icon-left="notes"
              :label="t('bookingReasonOptional')"
              :test-id="portalTestIds.bookingFieldNotes"
            />
            <button
              type="button"
              class="portal-booking-review__confirm"
              :class="{
                'portal-booking-review__confirm--active':
                  confirmedAccurate,
              }"
              role="checkbox"
              :aria-checked="confirmedAccurate"
              :data-testid="
                portalTestIds.bookingConfirmAccurate
              "
              @click="confirmedAccurate = !confirmedAccurate"
            >
              <q-icon
                :name="confirmedAccurate
                  ? 'check_box'
                  : 'check_box_outline_blank'"
                size="22px"
              />
              <span>{{ t('bookingConfirmAccurate') }}</span>
            </button>
          </div>
        </div>

        <div
          v-else-if="step === BOOKING_STEPS.success"
          class="portal-booking-success"
          :data-testid="portalTestIds.bookingSuccess"
        >
          <q-icon
            :name="outcome === 'BOOKED'
              ? 'check_circle'
              : 'mark_email_read'"
            color="positive"
            size="40px"
          />
          <div class="portal-booking-success__title">
            {{ successTitle }}
          </div>
          <p
            v-if="selectedService || selectedSlot"
            class="portal-booking-success__meta"
          >
            {{ successSummary }}
          </p>
          <p class="portal-booking-success__body">
            {{ successBody }}
          </p>
          <q-btn
            unelevated
            no-caps
            color="primary"
            :label="t('scheduleAnother')"
            :data-testid="portalTestIds.bookingBtnAnother"
            @click="onScheduleAnother"
          />
        </div>

        <div
          v-if="step !== BOOKING_STEPS.success"
          class="portal-booking__nav"
        >
          <q-btn
            v-if="step !== BOOKING_STEPS.service"
            outline
            no-caps
            color="primary"
            :label="t('back')"
            :data-testid="portalTestIds.bookingBtnBack"
            @click="goBack"
          />
          <q-btn
            v-if="step === BOOKING_STEPS.service"
            unelevated
            no-caps
            color="primary"
            :label="t('next')"
            :loading="loadingClinicians"
            :disable="!serviceId"
            :data-testid="portalTestIds.bookingBtnNext"
            @click="onSelectService(serviceId)"
          />
          <q-btn
            v-if="step === BOOKING_STEPS.clinician"
            unelevated
            no-caps
            color="primary"
            :label="t('next')"
            :disable="!anyClinician && !clinicianId"
            :data-testid="portalTestIds.bookingBtnNextClinician"
            @click="continueFromClinician"
          />
          <q-btn
            v-if="step === BOOKING_STEPS.when"
            unelevated
            no-caps
            color="primary"
            :label="t('next')"
            :loading="searching"
            :disable="!validateWhen()"
            :data-testid="portalTestIds.bookingBtnSearchSlots"
            @click="searchSlots"
          />
          <q-btn
            v-if="step === BOOKING_STEPS.slots"
            unelevated
            no-caps
            color="primary"
            :label="t('next')"
            :disable="!selectedSlot"
            :data-testid="portalTestIds.bookingBtnNextSlots"
            @click="continueFromSlots"
          />
          <q-btn
            v-if="step === BOOKING_STEPS.review"
            unelevated
            no-caps
            color="primary"
            :label="confirmLabel"
            :loading="confirming"
            :disable="!confirmedAccurate"
            :data-testid="portalTestIds.bookingBtnConfirm"
            @click="onConfirm"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import LoginTextInput from 'src/components/LoginTextInput.vue'
import PortalDateField from 'src/components/PortalDateField.vue'
import {
  BOOKING_STEPS,
  usePortalBookingWizard,
} from 'src/composables/usePortalBookingWizard.js'
import { portalTestIds } from 'src/test-ids/index.js'
import {
  formatIsoDateLabel,
  formatPortalDate,
  formatPortalTime,
} from 'src/utils/portal-datetime.js'

const props = defineProps({
  needsProfile: { type: Boolean, default: false },
  canChooseClinician: { type: Boolean, default: true },
  canBook: { type: Boolean, default: false },
})

const emit = defineEmits(['completed'])
const { t } = useI18n()
const booking = usePortalBookingWizard()

const {
  step,
  services,
  clinicians,
  loadingServices,
  loadingClinicians,
  searching,
  confirming,
  serviceId,
  clinicianId,
  anyClinician,
  whenMode,
  dateUs,
  fromDateUs,
  toDateUs,
  days,
  notes,
  confirmedAccurate,
  outcome,
  selectedService,
  selectedClinician,
  selectedSlot,
  availabilityMeta,
  startOver,
  loadServices,
  selectService,
  pickAnyClinician,
  pickClinician,
  continueFromClinician,
  validateWhen,
  rangeTooLong,
  searchSlots,
  pickSlot,
  continueFromSlots,
  confirm,
  goBack,
  maxRangeDays,
} = booking

const whenModes = computed(() => [
  {
    value: 'soonest',
    label: t('bookingWhenSoonest'),
    hint: t('bookingSoonestHint'),
    span: true,
    testId: portalTestIds.bookingWhenSoonest,
  },
  {
    value: 'day',
    label: t('bookingWhenDay'),
    hint: t('bookingWhenDayHint'),
    testId: portalTestIds.bookingWhenDay,
  },
  {
    value: 'range',
    label: t('bookingWhenRange'),
    hint: t('bookingWhenRangeHint'),
    testId: portalTestIds.bookingWhenRange,
  },
])

const stepLabel = computed(() => {
  const labels = {
    [BOOKING_STEPS.service]: t('bookingStepService'),
    [BOOKING_STEPS.clinician]: t('bookingStepClinician'),
    [BOOKING_STEPS.when]: t('bookingStepWhen'),
    [BOOKING_STEPS.slots]: t('bookingStepSlots'),
    [BOOKING_STEPS.review]: t('bookingStepReview'),
  }
  return labels[step.value] || ''
})

const slotTabs = [
  { key: 'MORNING', labelKey: 'bookingMorning' },
  { key: 'AFTERNOON', labelKey: 'bookingAfternoon' },
  { key: 'EVENING', labelKey: 'bookingEvening' },
]
const slotPeriod = ref('MORNING')

const visibleSlotDays = computed(() =>
  days.value
    .map((day) => ({
      date: day.date,
      slots: (day.slots || []).filter(
        (slot) => slot.period === slotPeriod.value,
      ),
    }))
    .filter((day) => day.slots.length),
)

watch(days, (list) => {
  slotPeriod.value = firstSlotPeriod(list)
})

function slotDayLabel(isoDate) {
  return t('bookingSlotsOnDate', {
    date: formatIsoDateLabel(isoDate, { year: 'numeric' }),
  })
}

function firstSlotPeriod(list) {
  const match = slotTabs.find((tab) =>
    hasPeriodSlots(list, tab.key),
  )
  return match?.key || 'MORNING'
}

function hasPeriodSlots(list, period) {
  return (list || []).some((day) =>
    (day.slots || []).some((slot) => slot.period === period),
  )
}

const reviewDate = computed(() =>
  formatPortalDate(selectedSlot.value?.start_at_utc),
)

const reviewTime = computed(() =>
  formatPortalTime(selectedSlot.value?.start_at_utc),
)

const reviewClinician = computed(() => {
  if (availabilityMeta.value?.clinician_display_name) {
    return availabilityMeta.value.clinician_display_name
  }
  if (selectedClinician.value?.display_name) {
    return selectedClinician.value.display_name
  }
  return t('bookingAssignedByClinic')
})

const reviewRows = computed(() => [
  {
    key: 'service',
    icon: 'medical_services',
    label: t('service'),
    value: selectedService.value?.name,
  },
  {
    key: 'clinician',
    icon: 'person',
    label: t('bookingClinician'),
    value: reviewClinician.value,
  },
  {
    key: 'date',
    icon: 'event',
    label: t('bookingDate'),
    value: reviewDate.value,
  },
  {
    key: 'time',
    icon: 'schedule',
    label: t('bookingTime'),
    value: reviewTime.value,
  },
])

const confirmLabel = computed(() => (
  props.canBook ? t('confirmAppointment') : t('sendRequest')
))

const successTitle = computed(() => (
  outcome.value === 'BOOKED'
    ? t('bookingConfirmedTitle')
    : t('bookingRequestedTitle')
))

const successBody = computed(() => (
  outcome.value === 'BOOKED'
    ? t('bookingConfirmedBody')
    : t('bookingRequestedBody')
))

const successSummary = computed(() => {
  const parts = [
    selectedService.value?.name,
    reviewDate.value,
    reviewTime.value,
    reviewClinician.value,
  ].filter(Boolean)
  return parts.join(' · ')
})

function serviceMeta(item) {
  const parts = []
  if (item.default_duration_min) {
    parts.push(t('bookingDurationMin', {
      n: item.default_duration_min,
    }))
  }
  if (item.default_fee != null && item.default_fee !== '') {
    parts.push(formatFee(item.default_fee))
  }
  return parts.join(' · ')
}

function formatFee(value) {
  const amount = Number(value)
  if (!Number.isFinite(amount)) {
    return ''
  }
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

async function onSelectService(id) {
  await selectService(id, props.canChooseClinician)
}

async function onConfirm() {
  const ok = await confirm()
  if (!ok) {
    return
  }
  Notify.create({
    type: 'positive',
    message: outcome.value === 'BOOKED'
      ? t('appointmentBooked')
      : t('requestSent'),
  })
  emit('completed')
}

function onScheduleAnother() {
  startOver()
}

onMounted(() => {
  if (!props.needsProfile) {
    loadServices()
  }
})

watch(() => props.needsProfile, (needs) => {
  if (!needs) {
    loadServices()
  }
})

defineExpose({
  startOver,
  loadServices,
})
</script>
