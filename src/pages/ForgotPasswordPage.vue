<template>
  <div class="auth-form">
    <div class="auth-form__title">{{ t('forgotPassword') }}</div>
    <p class="auth-form__subtitle">{{ t('continueMessage') }}</p>
    <q-banner
      v-if="sent"
      class="auth-form__banner bg-teal-1"
      rounded
    >
      {{ t('continueMessage') }}
    </q-banner>
    <q-form v-else @submit.prevent="onSubmit">
      <LoginTextInput
        v-model="email"
        type="email"
        icon-left="mail"
        :label="t('email')"
        test-id="forgotEmail"
      />
      <div class="auth-form__actions">
        <q-btn
          type="submit"
          color="primary"
          unelevated
          no-caps
          class="full-width auth-submit"
          :label="t('sendResetLink')"
          :loading="loading"
          data-testid="forgotSubmit"
        />
      </div>
    </q-form>
    <div class="auth-form__links">
      <router-link class="auth-form__link" to="/login">
        {{ t('backToLogin') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
import LoginTextInput from 'src/components/LoginTextInput.vue'
import { portalPaths } from 'src/utils/portal-api.js'

const { t } = useI18n()
const email = ref('')
const loading = ref(false)
const sent = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await api.post(portalPaths.passwordResetRequest, {
      email: email.value.trim(),
    })
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>
