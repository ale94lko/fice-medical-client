<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="onOpenChange"
  >
    <q-card
      class="portal-dialog portal-card"
      :data-testid="portalTestIds.appointmentsRequestDialog"
    >
      <q-card-section class="portal-dialog__header">
        <h2 class="portal-dialog__title">
          {{ t('requestAppointment') }}
        </h2>
        <q-btn
          flat
          round
          dense
          icon="close"
          :aria-label="t('close')"
          :data-testid="portalTestIds.appointmentsRequestDialogClose"
          @click="close"
        />
      </q-card-section>
      <q-form @submit.prevent="onSubmit">
        <q-card-section class="portal-dialog__body portal-form">
          <p class="portal-dialog__hint">
            {{ t('requestAppointmentHint') }}
          </p>
          <q-select
            v-model="serviceId"
            outlined
            emit-value
            map-options
            clearable
            hide-bottom-space
            class="login-text-input full-width"
            :options="serviceOptions"
            :label="t('serviceOptional')"
            :data-testid="portalTestIds.appointmentsFieldRequestService"
          />
          <div class="row q-col-gutter-sm portal-datetime-row">
            <div class="col-6">
              <PortalDateField
                v-model="preferredDate"
                min-tomorrow
                :label="t('preferredDate')"
                :close-label="t('close')"
                :test-id="portalTestIds.appointmentsFieldPreferredStart"
              />
            </div>
            <div class="col-6">
              <PortalTimeField
                v-model="preferredTime"
                :label="t('preferredTime')"
                :placeholder="t('preferredTimePlaceholder')"
                :close-label="t('close')"
                :test-id="portalTestIds.appointmentsFieldPreferredTime"
              />
            </div>
          </div>
          <LoginTextInput
            v-model="notes"
            icon-left="notes"
            :label="t('notesOptional')"
            :test-id="portalTestIds.appointmentsFieldNotes"
          />
        </q-card-section>
        <q-card-actions
          align="right"
          class="portal-dialog__actions"
        >
          <q-btn
            outline
            no-caps
            color="primary"
            :label="t('cancel')"
            :data-testid="portalTestIds.appointmentsRequestDialogCancel"
            @click="close"
          />
          <q-btn
            type="submit"
            unelevated
            no-caps
            color="primary"
            :label="t('sendRequest')"
            :loading="saving"
            :data-testid="portalTestIds.appointmentsBtnRequest"
          />
        </q-card-actions>
      </q-form>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
import LoginTextInput from 'src/components/LoginTextInput.vue'
import PortalDateField from 'src/components/PortalDateField.vue'
import PortalTimeField from 'src/components/PortalTimeField.vue'
import { portalTestIds } from 'src/test-ids/index.js'
import { portalPaths } from 'src/utils/portal-api.js'
import {
  DEFAULT_PREFERRED_TIME,
  preferredDateTimeToIso,
  tomorrowUsDate,
} from 'src/utils/portal-datetime.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  services: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue', 'created'])
const { t } = useI18n()
const serviceId = ref(null)
const preferredDate = ref('')
const preferredTime = ref('')
const notes = ref('')
const saving = ref(false)

const serviceOptions = computed(() => props.services.map((item) => ({
  label: item.name,
  value: item.id,
})))

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})

function resetForm() {
  serviceId.value = null
  preferredDate.value = tomorrowUsDate()
  preferredTime.value = DEFAULT_PREFERRED_TIME
  notes.value = ''
}

function onOpenChange(value) {
  emit('update:modelValue', value)
}

function close() {
  emit('update:modelValue', false)
}

async function onSubmit() {
  saving.value = true
  try {
    await api.post(portalPaths.appointmentRequests, {
      preferredStartAtUtc: preferredDateTimeToIso(
        preferredDate.value,
        preferredTime.value,
      ),
      serviceProcedureId: serviceId.value,
      notes: notes.value.trim() || null,
    })
    Notify.create({ type: 'positive', message: t('requestSent') })
    emit('created')
    close()
  } finally {
    saving.value = false
  }
}
</script>
