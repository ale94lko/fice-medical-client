<template>
  <div class="auth-form">
    <div class="auth-form__title">{{ t('resetPassword') }}</div>
    <p class="auth-form__subtitle">{{ t('passwordRequirements') }}</p>
    <q-banner
      v-if="done"
      class="auth-form__banner bg-teal-1"
      rounded
    >
      {{ t('accountActivated') }}
    </q-banner>
    <q-form v-else @submit.prevent="onSubmit">
      <LoginTextInput
        v-model="password"
        type="password"
        icon-left="lock"
        :label="t('password')"
        test-id="resetPassword"
      />
      <LoginTextInput
        v-model="confirmPassword"
        type="password"
        icon-left="lock"
        :label="t('confirmPassword')"
        test-id="resetConfirmPassword"
      />
      <div class="auth-form__actions">
        <q-btn
          type="submit"
          color="primary"
          unelevated
          no-caps
          class="full-width auth-submit"
          :label="t('submit')"
          :loading="loading"
          :disable="!token"
          data-testid="resetSubmit"
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
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
import LoginTextInput from 'src/components/LoginTextInput.vue'
import { portalPaths } from 'src/utils/portal-api.js'

const { t } = useI18n()
const route = useRoute()
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const done = ref(false)
const token = computed(() => {
  return String(route.query.t ?? route.query.token ?? '').trim()
})

async function onSubmit() {
  if (password.value !== confirmPassword.value) {
    Notify.create({ type: 'negative', message: t('passwordMismatch') })
    return
  }
  loading.value = true
  try {
    await api.post(portalPaths.passwordResetConfirm, {
      token: token.value,
      password: password.value,
      confirmPassword: confirmPassword.value,
    })
    done.value = true
  } finally {
    loading.value = false
  }
}
</script>
