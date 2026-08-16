<template>
  <q-layout view="hHh lpR fFf" class="portal-layout">
    <q-header class="portal-header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          class="lt-md"
          @click="drawer = !drawer"
        />
        <div class="text-weight-bold q-ml-sm">{{ t('appName') }}</div>
        <q-space />
        <div class="text-caption q-mr-md ellipsis">
          {{ authStore.displayName }}
        </div>
        <q-btn
          flat
          dense
          :label="t('logout')"
          data-testid="logout"
          @click="onLogout"
        />
      </q-toolbar>
    </q-header>
    <q-drawer
      v-model="drawer"
      show-if-above
      bordered
      :width="228"
    >
      <q-list padding>
        <q-item
          v-for="item in navItems"
          :key="item.to"
          clickable
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
        <router-view />
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const drawer = ref(true)

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

async function onLogout() {
  await authStore.logout()
  await router.replace({ name: 'Login' })
}
</script>
