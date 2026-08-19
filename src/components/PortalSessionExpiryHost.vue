<template>
  <SessionExpiryDialog
    v-model="sessionWarningVisible"
    :countdown="formattedCountdown"
    :keep-open-loading="keepOpenLoading"
    :closing-section="closingSection"
    @close-section="closeSection"
    @keep-open="keepSectionOpen"
  />
</template>

<script setup>
import SessionExpiryDialog from
  'src/components/SessionExpiryDialog.vue'
import { useSessionInactivity } from
  'src/composables/useSessionInactivity.js'

const {
  warningVisible: sessionWarningVisible,
  formattedCountdown,
  keepOpenLoading,
  closingSection,
  closeSection,
  keepSectionOpen,
} = useSessionInactivity()
</script>
