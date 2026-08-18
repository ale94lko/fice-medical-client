import { computed, ref } from 'vue'
import { api } from 'boot/axios'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import {
  parseUsDateString,
  usDateToIsoDate,
} from 'src/utils/portal-datetime.js'

export const BOOKING_STEPS = {
  service: 'service',
  clinician: 'clinician',
  when: 'when',
  slots: 'slots',
  review: 'review',
  success: 'success',
}

const MAX_RANGE_DAYS = 14

export function usePortalBookingWizard() {
  const step = ref(BOOKING_STEPS.service)
  const services = ref([])
  const clinicians = ref([])
  const loadingServices = ref(false)
  const loadingClinicians = ref(false)
  const searching = ref(false)
  const confirming = ref(false)
  const serviceId = ref(null)
  const clinicianId = ref(null)
  const anyClinician = ref(true)
  const whenMode = ref('')
  const dateUs = ref('')
  const fromDateUs = ref('')
  const toDateUs = ref('')
  const days = ref([])
  const selectedSlot = ref(null)
  const notes = ref('')
  const confirmedAccurate = ref(false)
  const outcome = ref(null)
  const resultAppointment = ref(null)
  const resultRequest = ref(null)
  const availabilityMeta = ref(null)

  const selectedService = computed(() =>
    services.value.find((item) => item.id === serviceId.value) || null,
  )

  const selectedClinician = computed(() => {
    if (anyClinician.value || !clinicianId.value) {
      return null
    }
    return clinicians.value.find((item) =>
      item.clinician_id === clinicianId.value,
    ) || null
  })

  function startOver() {
    step.value = BOOKING_STEPS.service
    serviceId.value = null
    clinicianId.value = null
    anyClinician.value = true
    whenMode.value = ''
    dateUs.value = ''
    fromDateUs.value = ''
    toDateUs.value = ''
    days.value = []
    selectedSlot.value = null
    notes.value = ''
    confirmedAccurate.value = false
    outcome.value = null
    resultAppointment.value = null
    resultRequest.value = null
    availabilityMeta.value = null
  }

  async function loadServices() {
    loadingServices.value = true
    try {
      const { data } = await api.get(portalPaths.bookingServices)
      services.value = unwrapData(data) || []
    } finally {
      loadingServices.value = false
    }
  }

  async function loadCliniciansForService(id) {
    loadingClinicians.value = true
    clinicians.value = []
    try {
      const { data } = await api.get(portalPaths.bookingClinicians, {
        params: { serviceProcedureId: id },
      })
      clinicians.value = unwrapData(data) || []
    } finally {
      loadingClinicians.value = false
    }
  }

  async function selectService(id, canChooseClinician) {
    serviceId.value = id
    clinicianId.value = null
    anyClinician.value = false
    days.value = []
    selectedSlot.value = null
    await loadCliniciansForService(id)
    if (canChooseClinician && clinicians.value.length) {
      step.value = BOOKING_STEPS.clinician
      return
    }
    anyClinician.value = true
    step.value = BOOKING_STEPS.when
  }

  function pickAnyClinician() {
    anyClinician.value = true
    clinicianId.value = null
  }

  function pickClinician(id) {
    anyClinician.value = false
    clinicianId.value = id
  }

  function continueFromClinician() {
    if (!anyClinician.value && !clinicianId.value) {
      return
    }
    step.value = BOOKING_STEPS.when
  }

  function validateWhen() {
    if (whenMode.value === 'soonest') {
      return true
    }
    if (whenMode.value === 'day') {
      return Boolean(usDateToIsoDate(dateUs.value))
    }
    if (whenMode.value !== 'range') {
      return false
    }
    const from = parseUsDateString(fromDateUs.value)
    const to = parseUsDateString(toDateUs.value)
    if (!from || !to || to.getTime() < from.getTime()) {
      return false
    }
    const daysCount = Math.round(
      (to.getTime() - from.getTime()) / 86400000,
    ) + 1
    return daysCount <= MAX_RANGE_DAYS
  }

  function rangeTooLong() {
    if (whenMode.value !== 'range') {
      return false
    }
    const from = parseUsDateString(fromDateUs.value)
    const to = parseUsDateString(toDateUs.value)
    if (!from || !to || to.getTime() < from.getTime()) {
      return false
    }
    const daysCount = Math.round(
      (to.getTime() - from.getTime()) / 86400000,
    ) + 1
    return daysCount > MAX_RANGE_DAYS
  }

  async function searchSlots() {
    if (!serviceId.value || !validateWhen()) {
      return false
    }
    searching.value = true
    selectedSlot.value = null
    try {
      const params = {
        serviceProcedureId: serviceId.value,
        when: whenMode.value,
      }
      if (whenMode.value === 'day') {
        params.date = usDateToIsoDate(dateUs.value)
      }
      if (whenMode.value === 'range') {
        params.fromDate = usDateToIsoDate(fromDateUs.value)
        params.toDate = usDateToIsoDate(toDateUs.value)
      }
      if (!anyClinician.value && clinicianId.value) {
        params.clinicianId = clinicianId.value
      }
      const { data } = await api.get(
        portalPaths.bookingAvailability,
        { params },
      )
      const payload = unwrapData(data) || {}
      availabilityMeta.value = payload
      days.value = payload.days || []
      step.value = BOOKING_STEPS.slots
      return true
    } finally {
      searching.value = false
    }
  }

  function pickSlot(slot) {
    selectedSlot.value = slot
    confirmedAccurate.value = false
  }

  function continueFromSlots() {
    if (!selectedSlot.value) {
      return
    }
    confirmedAccurate.value = false
    step.value = BOOKING_STEPS.review
  }

  async function confirm() {
    if (!selectedSlot.value || !serviceId.value) {
      return false
    }
    if (!confirmedAccurate.value) {
      return false
    }
    confirming.value = true
    try {
      const body = {
        serviceProcedureId: serviceId.value,
        startAtUtc: selectedSlot.value.start_at_utc,
        notes: notes.value.trim() || null,
        confirmedAccurate: true,
      }
      if (!anyClinician.value && clinicianId.value) {
        body.clinicianId = clinicianId.value
      }
      const { data } = await api.post(portalPaths.bookingConfirm, body, {
        headers: { 'Idempotency-Key': crypto.randomUUID() },
      })
      const payload = unwrapData(data) || {}
      outcome.value = payload.outcome
      resultAppointment.value = payload.appointment || null
      resultRequest.value = payload.request || null
      step.value = BOOKING_STEPS.success
      return true
    } finally {
      confirming.value = false
    }
  }

  function goBack() {
    if (step.value === BOOKING_STEPS.clinician) {
      step.value = BOOKING_STEPS.service
      return
    }
    if (step.value === BOOKING_STEPS.when) {
      step.value = clinicians.value.length
        ? BOOKING_STEPS.clinician
        : BOOKING_STEPS.service
      return
    }
    if (step.value === BOOKING_STEPS.slots) {
      step.value = BOOKING_STEPS.when
      return
    }
    if (step.value === BOOKING_STEPS.review) {
      step.value = BOOKING_STEPS.slots
    }
  }

  return {
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
    selectedSlot,
    notes,
    confirmedAccurate,
    outcome,
    resultAppointment,
    resultRequest,
    availabilityMeta,
    selectedService,
    selectedClinician,
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
    maxRangeDays: MAX_RANGE_DAYS,
  }
}
