<template>
  <div>
    <h1 class="portal-page__title">{{ title }}</h1>
    <p class="portal-page__lead">{{ t('comingSoonBody') }}</p>
    <q-card class="portal-card">
      <q-card-section class="portal-empty">
        <div class="portal-empty__icon" aria-hidden="true">
          <q-icon name="hourglass_empty" size="22px" />
        </div>
        <div class="text-subtitle1 text-weight-medium">
          {{ t('comingSoon') }}
        </div>
        <p class="text-body2 text-grey-7 q-mb-none">
          {{ t('comingSoonHint') }}
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
