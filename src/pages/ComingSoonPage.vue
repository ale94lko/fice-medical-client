<template>
  <div>
    <div class="text-h5 text-weight-bold q-mb-md">{{ title }}</div>
    <q-card>
      <q-card-section>
        <div class="text-subtitle1">{{ t('comingSoon') }}</div>
        <p class="text-body2 text-grey-7 q-mb-none">
          {{ t('comingSoonBody') }}
        </p>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const route = useRoute()
const title = computed(() => t(route.meta.titleKey || 'comingSoon'))
</script>
