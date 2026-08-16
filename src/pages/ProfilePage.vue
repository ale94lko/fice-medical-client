<template>
  <div>
    <div class="text-h5 text-weight-bold q-mb-md">{{ t('profile') }}</div>
    <q-card>
      <q-card-section>
        <div class="text-caption text-grey-7">{{ t('email') }}</div>
        <div class="text-body1 q-mb-md">{{ profile?.email }}</div>
        <div class="text-caption text-grey-7">{{ t('profile') }}</div>
        <div class="text-body1">{{ profile?.preferred_name || '—' }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'

const { t } = useI18n()
const profile = ref(null)

onMounted(async() => {
  const { data } = await api.get(portalPaths.profile)
  profile.value = unwrapData(data)
})
</script>
