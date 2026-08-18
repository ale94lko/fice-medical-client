<template>
  <div class="telehealth-resend-invite">
    <q-checkbox
      :model-value="useCustomEmail"
      dense
      dark
      color="primary"
      class="telehealth-resend-invite__check"
      :label="t('telehealthResendInviteOtherEmail')"
      @update:model-value="onToggleCustomEmail"
    />
    <q-input
      v-if="useCustomEmail"
      :model-value="inviteEmail"
      dense
      outlined
      dark
      type="email"
      class="q-mt-sm q-mb-sm"
      :label="t('telehealthResendInviteEmail')"
      :disable="loading"
      @update:model-value="$emit('update:inviteEmail', $event)"
    />
    <q-btn
      no-caps
      outline
      color="white"
      class="full-width q-mt-sm"
      :data-testid="telehealthTestIds.resendInvite"
      :label="t('telehealthResendInvite')"
      :loading="loading"
      :disable="useCustomEmail && !emailTrimmed"
      @click="$emit('resend')"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { telehealthTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  inviteEmail: { type: String, default: '' },
  useCustomEmail: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits([
  'update:inviteEmail',
  'update:useCustomEmail',
  'resend',
])

const { t } = useI18n()

const emailTrimmed = computed(() =>
  String(props.inviteEmail ?? '').trim(),
)

function onToggleCustomEmail(value) {
  emit('update:useCustomEmail', Boolean(value))
  if (!value) {
    emit('update:inviteEmail', '')
  }
}
</script>
