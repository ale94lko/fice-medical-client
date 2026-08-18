<template>
  <div class="auth-form">
    <div class="auth-form__title">{{ t('verifyEmail') }}</div>
    <p v-if="status === 'ok'" class="auth-form__subtitle">
      {{ t('accountActivated') }}
    </p>
    <p
      v-else-if="status === 'error'"
      class="auth-form__subtitle text-negative"
    >
      {{ t('verifyEmailInvalid') }}
    </p>
    <p v-else class="auth-form__subtitle">{{ t('submit') }}…</p>
    <div class="auth-form__links">
      <router-link
        v-if="status === 'error'"
        class="auth-form__link"
        to="/resend-verification"
      >
        {{ t('didntGetEmail') }}
      </router-link>
      <router-link class="auth-form__link" to="/login">
        {{ t('backToLogin') }}
      </router-link>
    </div>
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
