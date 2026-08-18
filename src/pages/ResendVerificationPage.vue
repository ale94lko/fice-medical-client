<template>
  <div class="auth-form">
    <div class="auth-form__title">
      {{ t('resendVerification') }}
    </div>
    <p class="auth-form__subtitle">
      {{ t('resendVerificationLead') }}
    </p>
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
        :test-id="portalTestIds.resendVerificationEmail"
      />
      <div class="auth-form__actions">
        <q-btn
          type="submit"
          color="primary"
          unelevated
          no-caps
          class="full-width auth-submit"
          :label="t('sendVerificationLink')"
          :loading="loading"
          :data-testid="portalTestIds.resendVerificationSubmit"
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
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
import LoginTextInput from 'src/components/LoginTextInput.vue'
import { portalPaths } from 'src/utils/portal-api.js'
import { portalTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const route = useRoute()
const email = ref(
  typeof route.query.email === 'string' ? route.query.email : '',
)
const loading = ref(false)
const sent = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await api.post(portalPaths.verifyEmailRequest, {
      email: email.value.trim(),
    })
    sent.value = true
  } finally {
    loading.value = false
  }
}
</script>
