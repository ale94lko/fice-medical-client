<template>
  <div class="fullscreen flex flex-center column">
    <div class="text-h4 q-mb-md">404</div>
    <q-btn color="primary" :label="t('backToLogin')" to="/login" />
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
</script>
