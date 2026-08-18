<template>
  <q-layout view="hHh lpR fFf" class="portal-layout">
    <q-header class="portal-header" bordered>
      <q-toolbar class="portal-header__toolbar">
        <q-btn
          flat
          dense
          round
          icon="menu"
          class="lt-md"
          :aria-label="t('menu')"
          @click="drawer = !drawer"
        />
        <div class="portal-brand">
          <q-img
            class="portal-brand__logo"
            src="logo.png"
            spinner-color="primary"
          />
          <div class="portal-brand__name ellipsis">
            {{ t('appName') }}
          </div>
        </div>
        <q-space />
        <div class="portal-header__actions">
          <q-btn-dropdown
            v-if="authStore.hasMultipleLocations"
            flat
            dense
            no-caps
            class="portal-header-pill
              portal-header-pill--interactive"
            :aria-label="t('switchLocation')"
            :data-testid="portalTestIds.headerLocationSwitch"
          >
            <template #label>
              <q-icon
                name="location_on"
                size="18px"
                class="portal-header-pill__icon"
              />
              <span class="portal-header-pill__text">
                {{ authStore.currentLocationName }}
              </span>
            </template>
            <q-list>
              <q-item
                v-for="loc in authStore.locationOptions"
                :key="loc.account_id"
                v-close-popup
                clickable
                :data-testid="portalTestIds.headerLocationItem(
                  loc.account_id,
                )"
                @click="onSwitchLocation(loc.account_id)"
              >
                <q-item-section>
                  {{ loc.subtenant_name }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
          <div
            v-else-if="authStore.currentLocationName"
            class="portal-header-pill"
          >
            <q-icon
              name="location_on"
              size="18px"
              class="portal-header-pill__icon"
            />
            <span class="portal-header-pill__text">
              {{ authStore.currentLocationName }}
            </span>
          </div>
          <q-btn-dropdown
            flat
            dense
            no-caps
            class="portal-header-locale"
            :data-testid="portalTestIds.headerLocaleSwitch"
          >
            <template #label>
              <q-icon name="translate" size="18px" />
              <span class="gt-xs">{{ localeLabel }}</span>
            </template>
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
          <q-btn-dropdown
            flat
            dense
            no-caps
            class="portal-header-user"
            :aria-label="authStore.displayName || t('profile')"
            :data-testid="portalTestIds.headerUserMenu"
          >
            <template #label>
              <span class="portal-header-avatar" aria-hidden="true">
                {{ userInitials }}
              </span>
              <span class="portal-header-user__name gt-sm">
                {{ authStore.displayName }}
              </span>
            </template>
            <q-list class="portal-header-user__menu">
              <q-item>
                <q-item-section>
                  <q-item-label class="text-weight-medium">
                    {{ authStore.displayName }}
                  </q-item-label>
                  <q-item-label
                    v-if="authStore.currentLocationName"
                    caption
                  >
                    {{ authStore.currentLocationName }}
                  </q-item-label>
                </q-item-section>
              </q-item>
              <q-separator />
              <q-item
                v-close-popup
                clickable
                :data-testid="portalTestIds.headerLogout"
                @click="onLogout"
              >
                <q-item-section avatar>
                  <q-icon name="logout" color="primary" />
                </q-item-section>
                <q-item-section>
                  {{ t('logout') }}
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>
    <q-drawer
      v-model="drawer"
      show-if-above
      bordered
      class="portal-drawer"
      :width="248"
    >
      <q-list padding>
        <q-item
          v-for="item in navItems"
          :key="item.to"
          clickable
          v-ripple
          class="portal-nav-item"
          :to="item.to"
          :data-testid="item.testId"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>{{ t(item.labelKey) }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>
    <q-page-container>
      <q-page class="portal-page">
        <div class="portal-page__inner">
          <router-view :key="authStore.me?.account_id" />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth-store.js'
import { portalTestIds } from 'src/test-ids/index.js'

const { t, locale } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const drawer = ref(true)

const localeLabel = computed(() => (
  locale.value.startsWith('es') ? t('localeEs') : t('localeEn')
))

const userInitials = computed(() => {
  const parts = String(authStore.displayName ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (!parts.length) {
    return '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  const first = parts[0].charAt(0)
  const last = parts[parts.length - 1].charAt(0)
  return `${first}${last}`.toUpperCase()
})

const navItems = [
  {
    to: '/dashboard',
    icon: 'home',
    labelKey: 'dashboard',
    testId: 'navDashboard',
  },
  {
    to: '/appointments',
    icon: 'event',
    labelKey: 'appointments',
    testId: 'navAppointments',
  },
  {
    to: '/documents',
    icon: 'folder',
    labelKey: 'documents',
    testId: 'navDocuments',
  },
  {
    to: '/consents',
    icon: 'verified_user',
    labelKey: 'consents',
    testId: 'navConsents',
  },
  {
    to: '/forms',
    icon: 'assignment',
    labelKey: 'forms',
    testId: 'navForms',
  },
  {
    to: '/messages',
    icon: 'chat',
    labelKey: 'messages',
    testId: 'navMessages',
  },
  {
    to: '/profile',
    icon: 'person',
    labelKey: 'profile',
    testId: 'navProfile',
  },
  {
    to: '/security',
    icon: 'lock',
    labelKey: 'security',
    testId: 'navSecurity',
  },
]

function setLocale(value) {
  locale.value = value
  localStorage.setItem('locale', value)
}

async function onLogout() {
  await authStore.logout()
  await router.replace({ name: 'Login' })
}

async function onSwitchLocation(accountId) {
  if (accountId === authStore.me?.account_id) {
    return
  }
  await authStore.selectLocation(accountId)
}
</script>
