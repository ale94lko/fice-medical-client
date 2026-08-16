<template>
  <div>
    <div class="text-h5 text-weight-bold q-mb-lg">
      {{ t('invitationTitle') }}
    </div>
    <p v-if="preview?.initials" class="text-body2 text-grey-7 q-mb-md">
      {{ t('invitationFor', {
        initials: preview.initials,
        year: preview.birth_year,
      }) }}
    </p>
    <q-banner v-if="invalid" class="bg-red-1 q-mb-md" rounded>
      {{ t('invitationInvalid') }}
    </q-banner>
    <q-form v-else @submit.prevent="onSubmit">
      <q-input
        v-model="email"
        type="email"
        outlined
        dense
        class="q-mb-md"
        :label="t('email')"
        data-testid="inviteEmail"
      />
      <q-input
        v-model="password"
        type="password"
        outlined
        dense
        class="q-mb-md"
        :label="t('password')"
        :hint="t('passwordRequirements')"
        data-testid="invitePassword"
      />
      <q-input
        v-model="confirmPassword"
        type="password"
        outlined
        dense
        class="q-mb-md"
        :label="t('confirmPassword')"
        data-testid="inviteConfirmPassword"
      />
      <q-input
        v-model="dateOfBirth"
        type="date"
        outlined
        dense
        class="q-mb-md"
        :label="t('dateOfBirth')"
        data-testid="inviteDob"
      />
      <q-btn
        type="submit"
        color="primary"
        class="full-width"
        :label="t('acceptInvitation')"
        :loading="loading"
        data-testid="inviteSubmit"
      />
    </q-form>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
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
