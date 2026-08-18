<template>
  <q-input
    outlined
    hide-bottom-space
    class="portal-time-field login-text-input full-width"
    :model-value="modelValue"
    :label="label || undefined"
    :placeholder="placeholder || undefined"
    :data-testid="testId || undefined"
    @update:model-value="onInput"
    @blur="onBlur"
  >
    <template #append>
      <q-icon
        name="schedule"
        class="cursor-pointer portal-time-field__icon"
      >
        <q-popup-proxy
          cover
          transition-show="scale"
          transition-hide="scale"
        >
          <q-time
            :model-value="modelValue"
            mask="h:mm A"
            format12h
            @update:model-value="onInput"
          >
            <div class="row items-center justify-end">
              <q-btn
                v-close-popup
                no-caps
                flat
                color="primary"
                :data-testid="timeCloseTestId"
                :label="closeLabel"
              />
            </div>
          </q-time>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup>
import { computed } from 'vue'
import { normalizeTime12h } from 'src/utils/portal-datetime.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  closeLabel: { type: String, default: 'Close' },
  testId: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue'])

const timeCloseTestId = computed(() => (
  props.testId ? `${props.testId}-close` : undefined
))

function onInput(value) {
  emit('update:modelValue', value ?? '')
}

function onBlur() {
  const next = normalizeTime12h(props.modelValue)
  if (next !== props.modelValue) {
    emit('update:modelValue', next)
  }
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.portal-time-field__icon {
  color: $primary;
}
</style>
