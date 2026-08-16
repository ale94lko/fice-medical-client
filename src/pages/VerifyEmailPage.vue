<template>
  <div>
    <div class="text-h5 text-weight-bold q-mb-lg">{{ t('verifyEmail') }}</div>
    <p v-if="status === 'ok'" class="text-body1">
      {{ t('accountActivated') }}
    </p>
    <p v-else-if="status === 'error'" class="text-body1 text-negative">
      {{ t('invitationInvalid') }}
    </p>
    <p v-else class="text-body1">{{ t('submit') }}…</p>
    <router-link class="text-primary text-caption" to="/login">
      {{ t('backToLogin') }}
    </router-link>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
import { portalPaths } from 'src/utils/portal-api.js'

const { t } = useI18n()
const route = useRoute()
const status = ref('pending')

onMounted(async() => {
  const token = String(route.query.t ?? route.query.token ?? '').trim()
  if (!token) {
    status.value = 'error'
    return
  }
  try {
    await api.post(portalPaths.verifyEmail, { token })
    status.value = 'ok'
  } catch {
    status.value = 'error'
  }
})
</script>
