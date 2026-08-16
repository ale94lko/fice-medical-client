<template>
  <div>
    <div class="text-h5 text-weight-bold q-mb-xs">{{ t('login') }}</div>
    <p class="text-body2 text-grey-7 q-mb-lg">{{ t('signInSubtitle') }}</p>
    <q-form @submit.prevent="onSubmit">
      <q-input
        v-model="email"
        type="email"
        outlined
        dense
        class="q-mb-md"
        :label="t('email')"
        data-testid="emailInput"
        :rules="[val => !!val || t('email')]"
      />
      <q-input
        v-model="password"
        :type="showPassword ? 'text' : 'password'"
        outlined
        dense
        class="q-mb-md"
        :label="t('password')"
        data-testid="passwordInput"
      >
        <template #append>
          <q-icon
            :name="showPassword ? 'visibility_off' : 'visibility'"
            class="cursor-pointer"
            @click="showPassword = !showPassword"
          />
        </template>
      </q-input>
      <div class="row justify-between items-center q-mb-md">
        <router-link class="text-primary text-caption" to="/forgot-password">
          {{ t('forgotPassword') }}
        </router-link>
        <router-link class="text-primary text-caption" to="/register">
          {{ t('needAccount') }}
        </router-link>
      </div>
      <q-btn
        type="submit"
        color="primary"
        class="full-width"
        :label="t('submit')"
        :loading="loading"
        data-testid="loginSubmit"
      />
    </q-form>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)

async function onSubmit() {
  loading.value = true
  try {
    await authStore.login(email.value.trim(), password.value)
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
