<template>
  <div
    class="auth-form"
    :data-testid="portalTestIds.selectLocationPage"
  >
    <div class="auth-form__title">{{ t('selectLocation') }}</div>
    <p class="auth-form__subtitle">
      {{ t('selectLocationSubtitle') }}
    </p>
    <div class="auth-form__locations">
      <q-btn
        v-for="loc in locations"
        :key="loc.account_id"
        outline
        no-caps
        color="primary"
        class="full-width auth-form__location"
        :label="locationLabel(loc)"
        :loading="loadingId === loc.account_id"
        :disable="loadingId != null"
        :data-testid="portalTestIds.selectLocationItem(loc.account_id)"
        @click="onSelect(loc.account_id)"
      />
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { Notify } from 'quasar'
import { useAuthStore } from 'stores/auth-store.js'
import { portalTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const loadingId = ref(null)

const locations = computed(() => authStore.locationOptions)

function locationLabel(loc) {
  return String(loc?.subtenant_name ?? '').trim() || t('selectLocation')
}

async function onSelect(accountId) {
  loadingId.value = accountId
  try {
    await authStore.selectLocation(accountId)
    const redirect = typeof route.query.redirect === 'string'
      ? route.query.redirect
      : '/dashboard'
    await router.replace(redirect)
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error.response?.data?.message || t('invalidLocation'),
    })
  } finally {
    loadingId.value = null
  }
}

onMounted(async() => {
  if (locations.value.length === 0) {
    try {
      await authStore.loadLocations()
    } catch {
      Notify.create({
        type: 'negative',
        message: t('invalidLocation'),
      })
    }
  }
})
</script>
