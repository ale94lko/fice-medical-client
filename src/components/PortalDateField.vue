<template>
  <q-input
    outlined
    hide-bottom-space
    clear-icon="cancel"
    class="portal-date-field login-text-input full-width"
    :dense="dense"
    :data-testid="testId || undefined"
    :model-value="modelValue"
    :label="label || undefined"
    :readonly="readonly"
    :clearable="showClearable"
    :mask="PORTAL_DATE_MASK"
    :placeholder="PORTAL_DATE_PLACEHOLDER"
    :lazy-rules="'ondemand'"
    @update:model-value="onInput"
    @clear="onClear"
    @blur="onBlur"
  >
    <template v-if="!readonly" #append>
      <q-icon name="event" class="cursor-pointer portal-date-field__icon">
        <q-popup-proxy
          ref="datePopupRef"
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-date
            class="portal-date-field__calendar"
            color="primary"
            :model-value="datePickerValue"
            :mask="PORTAL_DATE_PICKER_MASK"
            :options="dateOptions"
            @update:model-value="onPickerChange"
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                no-caps
                flat
                color="primary"
                :data-testid="calendarCloseTestId"
                :label="closeLabel"
              />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup>
import { computed, ref } from 'vue'
import {
  PORTAL_DATE_MASK,
  PORTAL_DATE_PICKER_MASK,
  PORTAL_DATE_PLACEHOLDER,
  isAllowedCalendarDate,
  isCompleteUsDateString,
  normalizePickerDate,
  parseUsDateString,
  sanitizeUsDateInput,
} from 'src/utils/portal-datetime.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  clearable: { type: Boolean, default: true },
  minTomorrow: { type: Boolean, default: false },
  minToday: { type: Boolean, default: false },
  closeLabel: { type: String, default: 'Close' },
  testId: { type: String, default: '' },
  dense: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const datePopupRef = ref(null)

const calendarCloseTestId = computed(() => (
  props.testId
    ? `${props.testId}-calendar-close`
    : undefined
))

const showClearable = computed(() => (
  props.clearable
  && !props.readonly
  && Boolean(String(props.modelValue ?? '').trim())
))

const datePickerValue = computed(() => {
  if (!parseUsDateString(props.modelValue)) {
    return null
  }

  return props.modelValue
})

const sanitizeOptions = computed(() => ({
  minTomorrow: props.minTomorrow,
  minToday: props.minToday,
}))

function dateOptions(dateStr) {
  return isAllowedCalendarDate(dateStr, sanitizeOptions.value)
}

function onInput(value) {
  const next = sanitizeUsDateInput(value, sanitizeOptions.value)
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
  }
}

function onClear() {
  if (props.modelValue !== '') {
    emit('update:modelValue', '')
  }
}

function onBlur() {
  const raw = String(props.modelValue ?? '').trim()
  if (!raw) {
    return
  }
  if (isCompleteUsDateString(raw) && !parseUsDateString(raw)) {
    emit('update:modelValue', '')

    return
  }
  const next = sanitizeUsDateInput(raw, sanitizeOptions.value)
  if (next !== raw) {
    emit('update:modelValue', next)
  }
}

function onPickerChange(val) {
  const next = normalizePickerDate(val || '', sanitizeOptions.value)
  emit('update:modelValue', next)
  if (isCompleteUsDateString(next) && parseUsDateString(next)) {
    datePopupRef.value?.hide()
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.portal-date-field__icon {
  color: $primary;
}
</style>

<style lang="scss">
@import 'src/css/quasar.variables';

.portal-date-field__calendar {
  button.q-date__today:not(.bg-primary) {
    box-shadow: inset 0 0 0 2px $primary;
  }
}
</style>
