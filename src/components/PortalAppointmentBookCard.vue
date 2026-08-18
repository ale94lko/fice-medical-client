<template>
  <q-card class="portal-card q-mb-md">
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium q-mb-sm">
        {{ t('bookAppointment') }}
      </div>
      <p class="text-body2 text-grey-7 q-mb-md">
        {{ t('bookAppointmentHint') }}
      </p>
      <q-banner
        v-if="needsProfile"
        class="portal-banner q-mb-md"
        rounded
      >
        {{ t('completeProfileToBook') }}
      </q-banner>
      <q-form
        v-else
        class="portal-form"
        @submit.prevent="onSearch"
      >
        <q-select
          v-model="serviceId"
          outlined
          emit-value
          map-options
          hide-bottom-space
          class="login-text-input full-width"
          :options="serviceOptions"
          :label="t('service')"
          :data-testid="portalTestIds.appointmentsFieldBookService"
          :rules="[val => !!val || t('serviceRequired')]"
        />
        <div class="portal-form__actions">
          <q-btn
            type="submit"
            color="primary"
            unelevated
            no-caps
            class="auth-submit"
            :label="t('searchAvailability')"
            :loading="searching"
            :data-testid="portalTestIds.appointmentsBtnSearchSlots"
          />
        </div>
      </q-form>
      <div v-if="slots.length" class="portal-slot-list">
        <q-btn
          v-for="(slot, index) in slots"
          :key="`${slot.start_at_utc}-${index}`"
          outline
          no-caps
          color="primary"
          class="full-width"
          :disable="booking"
          :data-testid="portalTestIds.appointmentsSlot(index)"
          @click="onBook(slot)"
        >
          {{ slotLabel(slot) }}
        </q-btn>
      </div>
      <p
        v-else-if="searched && !searching"
        class="text-body2 text-grey-7 q-mt-md q-mb-none"
      >
        {{ t('noAvailability') }}
      </p>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
import { portalTestIds } from 'src/test-ids/index.js'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import { formatPortalDateTime } from 'src/utils/portal-datetime.js'

const props = defineProps({
  services: { type: Array, default: () => [] },
  needsProfile: { type: Boolean, default: false },
})

const emit = defineEmits(['booked'])
const { t } = useI18n()
const serviceId = ref(null)
const slots = ref([])
const searching = ref(false)
const booking = ref(false)
const searched = ref(false)

const serviceOptions = computed(() => props.services.map((item) => ({
  label: item.name,
  value: item.id,
})))

function slotLabel(slot) {
  const when = formatPortalDateTime(slot.start_at_utc)
  const name = slot.clinician_display_name
  return name ? `${when} · ${name}` : when
}

async function onSearch() {
  if (!serviceId.value) {
    return
  }
  searching.value = true
  searched.value = true
  try {
    const from = new Date()
    const to = new Date(from.getTime() + (14 * 24 * 60 * 60 * 1000))
    const { data } = await api.get(portalPaths.appointmentAvailability, {
      params: {
        fromUtc: from.toISOString(),
        toUtc: to.toISOString(),
        serviceProcedureId: serviceId.value,
      },
    })
    slots.value = unwrapData(data) || []
  } finally {
    searching.value = false
  }
}

async function onBook(slot) {
  booking.value = true
  try {
    await api.post(portalPaths.appointmentBook, {
      startAtUtc: slot.start_at_utc,
      serviceProcedureIds: [serviceId.value],
      clinicianId: slot.clinician_id,
    })
    Notify.create({ type: 'positive', message: t('appointmentBooked') })
    slots.value = []
    searched.value = false
    emit('booked')
  } finally {
    booking.value = false
  }
}
</script>
