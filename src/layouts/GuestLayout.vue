<template>
  <q-layout view="hHh Lpr lff" class="guest-layout">
    <q-page-container>
      <div class="row justify-between login-container">
        <q-page
          :class="['login-card flex flex-center', { mobile: !showPromo }]">
          <q-btn-dropdown
            flat
            dense
            no-caps
            class="guest-locale"
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
          <q-img
            class="logo"
            src="logo.png"
            spinner-color="white"
          />
          <q-card class="my-card">
            <q-card-section class="q-pa-none">
              <router-view />
            </q-card-section>
          </q-card>
        </q-page>
        <LoginPromoPanel v-if="showPromo" />
      </div>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import LoginPromoPanel from 'src/components/LoginPromoPanel.vue'

const MD_BREAKPOINT = 1024
const { t, locale } = useI18n()
const $q = useQuasar()

const showPromo = computed(() => $q.screen.width >= MD_BREAKPOINT)

const localeLabel = computed(() => (
  locale.value.startsWith('es') ? t('localeEs') : t('localeEn')
))

function setLocale(value) {
  locale.value = value
  localStorage.setItem('locale', value)
}
</script>
