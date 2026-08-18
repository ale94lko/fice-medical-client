<template>
  <div class="auth-form">
    <div class="auth-form__title">{{ t('register') }}</div>
    <p class="auth-form__subtitle">{{ t('signInSubtitle') }}</p>
    <q-banner
      v-if="sent"
      class="auth-form__banner bg-teal-1"
      rounded
    >
      {{ t('accountCreated') }}
    </q-banner>
    <q-banner
      v-else-if="locationsReady && !locationOptions.length"
      class="auth-form__banner bg-red-1"
      rounded
    >
      {{ t('registerNoLocations') }}
    </q-banner>
    <div v-if="sent" class="auth-form__actions">
      <q-btn
        color="primary"
        outline
        unelevated
        no-caps
        class="full-width auth-submit"
        :label="t('sendVerificationLink')"
        :loading="resending"
        :data-testid="portalTestIds.registerResend"
        @click="onResend"
      />
    </div>
    <q-form v-else @submit.prevent="onSubmit">
      <q-select
        v-model="subtenantId"
        outlined
        emit-value
        map-options
        class="login-text-input full-width"
        :options="locationOptions"
        :label="t('registerLocation')"
        :hint="t('registerLocationHint')"
        :loading="loadingLocations"
        :disable="!locationOptions.length"
        :data-testid="portalTestIds.registerFieldLocation"
        lazy-rules="ondemand"
        :rules="[val => !!val || t('registerLocationRequired')]"
      />
      <LoginTextInput
        v-model="email"
        type="email"
        icon-left="mail"
        :label="t('email')"
        test-id="registerEmail"
      />
      <LoginTextInput
        v-model="password"
        type="password"
        icon-left="lock"
        :label="t('password')"
        :hint="t('passwordRequirements')"
        test-id="registerPassword"
      />
      <LoginTextInput
        v-model="confirmPassword"
        type="password"
        icon-left="lock"
        :label="t('confirmPassword')"
        test-id="registerConfirmPassword"
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
          :disable="!locationOptions.length"
          data-testid="registerSubmit"
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
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import LoginTextInput from 'src/components/LoginTextInput.vue'
import { useAuthStore } from 'stores/auth-store.js'
import { api } from 'boot/axios'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import { portalTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const subtenantId = ref(null)
const locations = ref([])
const loading = ref(false)
const loadingLocations = ref(false)
const locationsReady = ref(false)
const resending = ref(false)
const sent = ref(false)

const locationOptions = computed(() => locations.value.map((item) => ({
  label: String(item?.subtenant_name ?? '').trim(),
  value: item?.subtenant_id,
})).filter(item => item.label && item.value != null))

function applyDefaultLocation() {
  if (subtenantId.value != null) {
    return
  }
  if (locationOptions.value.length === 1) {
    subtenantId.value = locationOptions.value[0].value
  }
}

async function loadLocations() {
  loadingLocations.value = true
  try {
    const { data } = await api.get(portalPaths.authLocations)
    const items = unwrapData(data)
    locations.value = Array.isArray(items) ? items : []
    applyDefaultLocation()
  } catch {
    locations.value = []
  } finally {
    loadingLocations.value = false
    locationsReady.value = true
  }
}

async function onSubmit() {
  if (!subtenantId.value) {
    Notify.create({
      type: 'negative',
      message: t('registerLocationRequired'),
    })
    return
  }
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
      subtenantId.value,
    )
    sent.value = true
    Notify.create({ type: 'positive', message: t('continueMessage') })
  } finally {
    loading.value = false
  }
}

async function onResend() {
  resending.value = true
  try {
    await api.post(portalPaths.verifyEmailRequest, {
      email: email.value.trim(),
    })
    Notify.create({ type: 'positive', message: t('continueMessage') })
  } finally {
    resending.value = false
  }
}

onMounted(loadLocations)
</script>
