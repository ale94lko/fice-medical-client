<template>
  <div>
    <div class="text-h5 text-weight-bold q-mb-lg">
      {{ t('resetPassword') }}
    </div>
    <q-banner v-if="done" class="bg-teal-1 q-mb-md" rounded>
      {{ t('accountActivated') }}
    </q-banner>
    <q-form v-else @submit.prevent="onSubmit">
      <q-input
        v-model="password"
        type="password"
        outlined
        dense
        class="q-mb-md"
        :label="t('password')"
        :hint="t('passwordRequirements')"
        data-testid="resetPassword"
      />
      <q-input
        v-model="confirmPassword"
        type="password"
        outlined
        dense
        class="q-mb-md"
        :label="t('confirmPassword')"
        data-testid="resetConfirmPassword"
      />
      <q-btn
        type="submit"
        color="primary"
        class="full-width q-mb-md"
        :label="t('submit')"
        :loading="loading"
        :disable="!token"
        data-testid="resetSubmit"
      />
    </q-form>
    <router-link class="text-primary text-caption" to="/login">
      {{ t('backToLogin') }}
    </router-link>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
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
