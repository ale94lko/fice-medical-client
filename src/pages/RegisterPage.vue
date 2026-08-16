<template>
  <div>
    <div class="text-h5 text-weight-bold q-mb-lg">{{ t('register') }}</div>
    <q-banner v-if="sent" class="bg-teal-1 q-mb-md" rounded>
      {{ t('accountCreated') }}
    </q-banner>
    <q-form v-else @submit.prevent="onSubmit">
      <q-input
        v-model="email"
        type="email"
        outlined
        dense
        class="q-mb-md"
        :label="t('email')"
        data-testid="registerEmail"
      />
      <q-input
        v-model="password"
        type="password"
        outlined
        dense
        class="q-mb-md"
        :label="t('password')"
        :hint="t('passwordRequirements')"
        data-testid="registerPassword"
      />
      <q-input
        v-model="confirmPassword"
        type="password"
        outlined
        dense
        class="q-mb-md"
        :label="t('confirmPassword')"
        data-testid="registerConfirmPassword"
      />
      <q-btn
        type="submit"
        color="primary"
        class="full-width q-mb-md"
        :label="t('submit')"
        :loading="loading"
        data-testid="registerSubmit"
      />
    </q-form>
    <router-link class="text-primary text-caption" to="/login">
      {{ t('haveAccount') }}
    </router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const sent = ref(false)

async function onSubmit() {
  if (password.value !== confirmPassword.value) {
    Notify.create({ type: 'negative', message: t('passwordMismatch') })
    return
  }
  loading.value = true
  try {
    await authStore.register(
      email.value.trim(),
      password.value,
      confirmPassword.value,
    )
    sent.value = true
    Notify.create({ type: 'positive', message: t('continueMessage') })
  } finally {
    loading.value = false
  }
}
</script>
