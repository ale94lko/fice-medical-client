<template>
  <div>
    <div class="text-h5 text-weight-bold q-mb-md">
      {{ t('welcome') }}{{
        authStore.displayName ? `, ${authStore.displayName}` : ''
      }}
    </div>
    <q-banner
      v-if="dashboard?.needs_profile_completion"
      class="bg-amber-1 q-mb-md"
      rounded
    >
      {{ t('needsClientRecord') }}
    </q-banner>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm">
              {{ t('appointments') }}
            </div>
            <p class="text-body2 text-grey-7 q-mb-md">
              {{ t('upcomingPlaceholder') }}
            </p>
            <q-btn
              color="primary"
              outline
              :label="t('requestAppointment')"
              to="/appointments"
              data-testid="requestAppointment"
            />
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12 col-md-6">
        <q-card>
          <q-card-section>
            <div class="text-subtitle1 text-weight-medium q-mb-sm">
              {{ t('profile') }}
            </div>
            <p class="text-body2 q-mb-none">{{ authStore.me?.email }}</p>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const authStore = useAuthStore()
const dashboard = ref(null)

onMounted(async() => {
  if (!authStore.me) {
    await authStore.loadMe()
  }
  const { data } = await api.get(portalPaths.dashboard)
  dashboard.value = unwrapData(data)
})
</script>
