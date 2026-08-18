<template>
  <div class="auth-form">
    <div class="auth-form__title">{{ t('invitationTitle') }}</div>
    <p v-if="preview?.initials" class="auth-form__subtitle">
      {{ t('invitationFor', {
        initials: preview.initials,
        year: preview.birth_year,
      }) }}
    </p>
    <p v-else class="auth-form__subtitle">
      {{ t('signInSubtitle') }}
    </p>
    <q-banner
      v-if="preview?.has_client_record && !invalid"
      class="auth-form__banner bg-teal-1"
      rounded
      :data-testid="portalTestIds.inviteHasClientRecord"
    >
      {{ t('invitationHasClientRecord') }}
    </q-banner>
    <q-banner
      v-if="invalid"
      class="auth-form__banner bg-red-1"
      rounded
    >
      {{ t('invitationInvalid') }}
    </q-banner>
    <q-form v-else @submit.prevent="onSubmit">
      <LoginTextInput
        v-model="email"
        type="email"
        icon-left="mail"
        :label="t('email')"
        test-id="inviteEmail"
      />
      <LoginTextInput
        v-model="password"
        type="password"
        icon-left="lock"
        :label="t('password')"
        :hint="t('passwordRequirements')"
        test-id="invitePassword"
      />
      <LoginTextInput
        v-model="confirmPassword"
        type="password"
        icon-left="lock"
        :label="t('confirmPassword')"
        test-id="inviteConfirmPassword"
      />
      <LoginTextInput
        v-model="dateOfBirth"
        type="date"
        icon-left="event"
        :label="t('dateOfBirth')"
        test-id="inviteDob"
      />
      <div class="auth-form__actions">
        <q-btn
          type="submit"
          color="primary"
          unelevated
          no-caps
          class="full-width auth-submit"
          :label="t('acceptInvitation')"
          :loading="loading"
          data-testid="inviteSubmit"
        />
      </div>
    </q-form>
    <div class="auth-form__links">
      <router-link class="auth-form__link" to="/login">
        {{ t('haveAccount') }}
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
import LoginTextInput from 'src/components/LoginTextInput.vue'
import { portalTestIds } from 'src/test-ids/index.js'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const dateOfBirth = ref('')
const loading = ref(false)
const invalid = ref(false)
const preview = ref(null)

function invitationToken() {
  const raw = route.query.t ?? route.query.token ?? route.params.token ?? ''
  return String(raw).trim()
}

onMounted(async() => {
  const token = invitationToken()
  if (!token) {
    invalid.value = true
    return
  }
  try {
    const { data } = await api.get(portalPaths.invitation(token))
    preview.value = unwrapData(data)
    if (preview.value?.valid === false) {
      invalid.value = true
    }
  } catch {
    invalid.value = true
  }
})

async function onSubmit() {
  if (password.value !== confirmPassword.value) {
    Notify.create({ type: 'negative', message: t('passwordMismatch') })
    return
  }
  loading.value = true
  try {
    await authStore.acceptInvitation(invitationToken(), {
      email: email.value.trim(),
      password: password.value,
      confirmPassword: confirmPassword.value,
      dateOfBirth: dateOfBirth.value || null,
    })
    await router.replace({ name: 'Dashboard' })
  } finally {
    loading.value = false
  }
}
</script>
