<template>
  <q-input
    outlined
    hide-bottom-space
    class="login-text-input full-width"
    :model-value="modelValue"
    :type="resolvedType"
    :label="label || undefined"
    :hint="hint || undefined"
    :error="error"
    :error-message="errorMessage || undefined"
    :data-testid="testId || undefined"
    :disable="disable"
    :rules="rules"
    lazy-rules="ondemand"
    @update:model-value="emit('update:modelValue', $event ?? '')"
  >
    <template v-if="iconLeft" #prepend>
      <q-icon :name="iconLeft" class="login-text-input__icon" />
    </template>
    <template v-if="isPassword" #append>
      <q-icon
        :name="showPlain ? 'visibility_off' : 'visibility'"
        class="cursor-pointer"
        @click="showPlain = !showPlain"
      />
    </template>
  </q-input>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  type: { type: String, default: 'text' },
  label: { type: String, default: '' },
  hint: { type: String, default: '' },
  iconLeft: { type: String, default: '' },
  testId: { type: String, default: '' },
  error: { type: Boolean, default: false },
  errorMessage: { type: String, default: '' },
  disable: { type: Boolean, default: false },
  rules: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])
const showPlain = ref(false)

const isPassword = computed(() => props.type === 'password')
const resolvedType = computed(() => {
  if (!isPassword.value) {
    return props.type
  }

  return showPlain.value ? 'text' : 'password'
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.login-text-input__icon {
  color: $primary;
}
</style>
