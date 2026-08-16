<template>
  <q-layout view="hHh lpR fFf" class="guest-layout">
    <q-header class="guest-header">
      <q-toolbar>
        <div class="text-weight-bold">{{ t('appName') }}</div>
        <q-space />
        <q-btn-dropdown
          flat
          dense
          :label="localeLabel"
          data-testid="localeSwitch"
        >
          <q-list>
            <q-item
              v-close-popup
              clickable
              @click="setLocale('en-US')"
            >
              <q-item-section>{{ t('localeEn') }}</q-item-section>
            </q-item>
            <q-item
              v-close-popup
              clickable
              @click="setLocale('es-ES')"
            >
              <q-item-section>{{ t('localeEs') }}</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
      </q-toolbar>
    </q-header>
    <q-page-container>
      <q-page class="flex flex-center guest-page">
        <q-card class="guest-card">
          <q-card-section>
            <router-view />
          </q-card-section>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()

const localeLabel = computed(() => (
  locale.value.startsWith('es') ? t('localeEs') : t('localeEn')
))

function setLocale(value) {
  locale.value = value
  localStorage.setItem('locale', value)
}
</script>
