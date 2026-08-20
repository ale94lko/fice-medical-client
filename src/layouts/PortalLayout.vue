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
        <div
          class="portal-brand"
          :aria-label="t('appName')"
        >
          <q-img
            class="portal-brand__logo"
            src="test.png"
            fit="contain"
            spinner-color="primary"
          />
        </div>
        <q-space />
        <div class="portal-header__actions">
          <TimezoneMismatchBanner />
          <q-btn-dropdown
            v-if="authStore.hasMultipleLocations"
            flat
            dense
            no-caps
            class="portal-header-user"
            dropdown-icon="arrow_drop_down"
            :aria-label="t('switchLocation')"
            :data-testid="portalTestIds.headerLocationSwitch"
          >
            <template #label>
              <span
                class="portal-header-avatar"
                aria-hidden="true"
              >
                <q-icon name="location_on" size="16px" />
              </span>
              <span class="portal-header-user__name gt-xs">
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
            class="portal-header-clinic"
          >
            <span
              class="portal-header-avatar"
              aria-hidden="true"
            >
              <q-icon name="location_on" size="16px" />
            </span>
            <span class="portal-header-user__name">
              {{ authStore.currentLocationName }}
            </span>
          </div>
          <q-btn-dropdown
            flat
            dense
            no-caps
            class="portal-header-user"
            dropdown-icon="arrow_drop_down"
            :data-testid="portalTestIds.headerLocaleSwitch"
          >
            <template #label>
              <span
                class="portal-header-avatar"
                aria-hidden="true"
              >
                <q-icon name="public" size="16px" />
              </span>
              <span class="portal-header-user__name gt-xs">
                {{ localeLabel }}
              </span>
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
          <q-btn
            flat
            round
            dense
            class="portal-header-bell"
            icon="notifications"
            :aria-label="t('messages')"
            :data-testid="portalTestIds.headerNotifications"
            @click="openChat"
          >
            <q-badge
              v-if="unreadCount"
              floating
              rounded
              color="negative"
              :label="unreadCount"
            />
          </q-btn>
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
      <div class="portal-drawer__inner">
        <q-list class="portal-drawer__nav" padding>
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
        <div class="portal-drawer__footer">
          <div class="portal-help">
            <p class="portal-help__title">{{ t('needHelp') }}</p>
            <q-btn
              unelevated
              no-caps
              color="primary"
              class="portal-help__btn"
              icon="headset_mic"
              :label="t('contactSupport')"
              :data-testid="portalTestIds.headerContactSupport"
              @click="openChat"
            />
          </div>
          <p class="portal-copyright">
            {{ t('portalCopyright', { year: copyrightYear }) }}
          </p>
        </div>
      </div>
    </q-drawer>
    <q-page-container>
      <q-page class="portal-page">
        <div class="portal-page__inner">
          <router-view :key="authStore.me?.account_id" />
        </div>
      </q-page>
    </q-page-container>
    <PortalChatWidget />
    <PortalSessionExpiryHost />
  </q-layout>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth-store.js'
import { portalTestIds } from 'src/test-ids/index.js'
import { usePortalChatPanel } from
  'src/composables/usePortalChatPanel.js'
import { usePortalMessageUnread } from
  'src/composables/usePortalMessageUnread.js'
import PortalChatWidget from
  'src/components/PortalChatWidget.vue'
import TimezoneMismatchBanner from
  'src/components/TimezoneMismatchBanner.vue'
import PortalSessionExpiryHost from
  'src/components/PortalSessionExpiryHost.vue'

const { t, locale } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const drawer = ref(true)
const { openChat } = usePortalChatPanel()
const { unreadCount } = usePortalMessageUnread()
const copyrightYear = new Date().getFullYear()

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

const navItems = computed(() => [
  {
    to: '/dashboard',
    icon: 'home',
    labelKey: 'dashboard',
    testId: portalTestIds.navDashboard,
  },
  {
    to: '/appointments',
    icon: 'event',
    labelKey: 'appointments',
    testId: portalTestIds.navAppointments,
  },
  {
    to: '/documents',
    icon: 'folder',
    labelKey: 'documents',
    testId: portalTestIds.navDocuments,
  },
  {
    to: '/consents',
    icon: 'verified_user',
    labelKey: 'consents',
    testId: portalTestIds.navConsents,
  },
  {
    to: '/forms',
    icon: 'assignment',
    labelKey: 'forms',
    testId: portalTestIds.navForms,
  },
  {
    to: '/profile',
    icon: 'person',
    labelKey: 'profile',
    testId: portalTestIds.navProfile,
  },
  {
    to: '/security',
    icon: 'lock',
    labelKey: 'security',
    testId: portalTestIds.navSecurity,
  },
])

function setLocale(value) {
  locale.value = value
  localStorage.setItem('locale', value)
}

async function onLogout() {
  await authStore.logout(router)
}

async function onSwitchLocation(accountId) {
  if (accountId === authStore.me?.account_id) {
    return
  }
  await authStore.selectLocation(accountId)
}
</script>
