<template>
  <div class="auth-form">
    <div class="auth-form__title">{{ t('login') }}</div>
    <p class="auth-form__subtitle">{{ t('signInSubtitle') }}</p>
    <q-form @submit.prevent="onSubmit">
      <LoginTextInput
        v-model="email"
        type="email"
        icon-left="mail"
        :label="t('email')"
        test-id="emailInput"
        :rules="[val => !!val || t('email')]"
      />
      <LoginTextInput
        v-model="password"
        type="password"
        icon-left="lock"
        :label="t('password')"
        test-id="passwordInput"
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
          data-testid="loginSubmit"
        />
      </div>
      <div class="auth-form__links">
        <router-link class="auth-form__link" to="/forgot-password">
          {{ t('forgotPassword') }}
        </router-link>
        <router-link class="auth-form__link" to="/register">
          {{ t('needAccount') }}
        </router-link>
      </div>
      <div class="auth-form__links">
        <router-link
          class="auth-form__link"
          :to="resendVerificationTo"
        >
          {{ t('didntGetEmail') }}
        </router-link>
      </div>
    </q-form>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'
import LoginTextInput from 'src/components/LoginTextInput.vue'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const loading = ref(false)

const resendVerificationTo = computed(() => {
  const value = email.value.trim()
  if (!value) {
    return { name: 'ResendVerification' }
  }
  return {
    name: 'ResendVerification',
    query: { email: value },
  }
})

async function onSubmit() {
  loading.value = true
  try {
    await authStore.login(email.value.trim(), password.value)
    if (authStore.needsLocationSelection) {
      await router.replace({
        name: 'SelectLocation',
        query: typeof route.query.redirect === 'string'
          ? { redirect: route.query.redirect }
          : {},
      })
      return
    }
    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/dashboard'
    await router.replace(redirect)
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || t('invalidCredentials'),
    })
  } finally {
    loading.value = false
  }
}
</script>
