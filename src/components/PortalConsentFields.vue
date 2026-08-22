<template>
  <div
    v-if="fields.length"
    class="portal-consent-fields q-mt-md">
    <h3 class="text-subtitle1 q-mb-sm">
      {{ t('consentAuthorizationTitle') }}
    </h3>
    <p
      v-if="showErrors && missing.length"
      class="text-body2 text-negative q-mb-sm">
      {{ t('consentFieldsRequired') }}
    </p>
    <div
      v-for="field in fields"
      :key="field.key"
      class="q-mb-md">
      <p class="text-body2 text-weight-medium q-mb-xs">
        {{ field.label }}
        <span v-if="isRequired(field)" class="text-negative">*</span>
      </p>
      <q-select
        v-if="field.fieldType === types.select"
        :model-value="valueOf(field)"
        outlined
        dense
        emit-value
        map-options
        hide-bottom-space
        class="full-width"
        :readonly="isLocked(field)"
        :disable="isLocked(field)"
        :options="selectOptions(field)"
        :data-testid="testId(field)"
        @update:model-value="onUpdate(field, $event)"
      />
      <q-select
        v-else-if="field.fieldType === types.multiSelect"
        :model-value="multiValue(field)"
        outlined
        dense
        emit-value
        map-options
        multiple
        use-chips
        hide-bottom-space
        class="full-width"
        :readonly="isLocked(field)"
        :disable="isLocked(field)"
        :options="selectOptions(field)"
        :data-testid="testId(field)"
        @update:model-value="onUpdate(field, $event)"
      />
      <PortalDateField
        v-else-if="field.fieldType === types.date"
        :model-value="valueOf(field)"
        dense
        :readonly="isLocked(field)"
        :test-id="testId(field)"
        @update:model-value="onUpdate(field, $event)"
      />
      <q-toggle
        v-else-if="field.fieldType === types.checkbox"
        :model-value="Boolean(valueOf(field))"
        color="primary"
        :disable="isLocked(field)"
        :data-testid="testId(field)"
        @update:model-value="onUpdate(field, $event)"
      />
      <q-input
        v-else
        :model-value="valueOf(field)"
        outlined
        dense
        hide-bottom-space
        class="full-width"
        :type="field.fieldType === types.textarea
          ? 'textarea'
          : 'text'"
        :autogrow="field.fieldType === types.textarea"
        :readonly="isLocked(field)"
        :placeholder="field.placeholder || undefined"
        :data-testid="testId(field)"
        @update:model-value="onUpdate(field, $event)"
      />
      <p
        v-if="field.helpText"
        class="text-caption text-grey-7 q-mt-xs q-mb-none">
        {{ field.helpText }}
      </p>
      <p
        v-if="showErrors && isMissing(field)"
        class="text-caption text-negative q-mt-xs q-mb-none">
        {{ t('consentFieldValueRequired') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PortalDateField from 'src/components/PortalDateField.vue'
import { portalTestIds } from 'src/test-ids/index.js'
import {
  consentFieldTypeValues as types,
  emptyValueForConsentField,
  isConsentFieldRequired,
  missingRequiredConsentFields,
} from 'src/utils/consent-fields.js'

const props = defineProps({
  fields: { type: Array, default: () => [] },
  modelValue: { type: Object, default: () => ({}) },
  readonly: { type: Boolean, default: false },
  showErrors: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const missing = computed(() => missingRequiredConsentFields(
  props.fields,
  props.modelValue,
))

function isRequired(field) {
  return isConsentFieldRequired(
    field,
    props.fields,
    props.modelValue,
  )
}

function isLocked(field) {
  return props.readonly || Boolean(field?.readOnly)
}

function isMissing(field) {
  return missing.value.some(item => item.key === field.key)
}

function valueOf(field) {
  if (Object.prototype.hasOwnProperty.call(
    props.modelValue || {},
    field.key,
  )) {
    return props.modelValue[field.key]
  }

  return emptyValueForConsentField(field.fieldType)
}

function multiValue(field) {
  const value = valueOf(field)

  return Array.isArray(value) ? value : []
}

function selectOptions(field) {
  return (field.options || []).map(item => ({
    value: item.value,
    label: item.label,
  }))
}

function testId(field) {
  return `${portalTestIds.consentsSignDialog}-field-${field.key}`
}

function onUpdate(field, value) {
  if (isLocked(field)) {
    return
  }
  emit('update:modelValue', {
    ...props.modelValue,
    [field.key]: value,
  })
}
</script>
