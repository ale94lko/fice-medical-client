<template>
  <div>
    <div class="text-h5 text-weight-bold q-mb-lg">
      {{ t('forgotPassword') }}
    </div>
    <q-banner v-if="sent" class="bg-teal-1 q-mb-md" rounded>
      {{ t('continueMessage') }}
    </q-banner>
    <q-form v-else @submit.prevent="onSubmit">
      <q-input
        v-model="email"
        type="email"
        outlined
        dense
        class="q-mb-md"
        :label="t('email')"
        data-testid="forgotEmail"
      />
      <q-btn
        type="submit"
        color="primary"
        class="full-width q-mb-md"
        :label="t('sendResetLink')"
        :loading="loading"
        data-testid="forgotSubmit"
      />
    </q-form>
    <router-link class="text-primary text-caption" to="/login">
      {{ t('backToLogin') }}
    </router-link>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
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
