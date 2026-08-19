<template>
  <div
    v-if="mismatch"
    class="timezone-mismatch"
    @mouseenter="openMenu"
    @mouseleave="scheduleClose"
  >
    <button
      type="button"
      class="timezone-mismatch__trigger"
      :aria-label="t('timezoneMismatchTitle')"
      :data-testid="portalTestIds.timezoneBanner"
      @click="toggleMenu"
    >
      <q-icon name="public" size="16px" />
    </button>
    <q-menu
      v-model="menuOpen"
      no-parent-event
      anchor="bottom start"
      self="top start"
      :offset="[0, 8]"
      class="timezone-mismatch-menu"
      :data-testid="portalTestIds.timezoneBannerMenu"
      @mouseenter="openMenu"
      @mouseleave="scheduleClose"
    >
      <div class="timezone-mismatch-menu__header">
        <div
          class="timezone-mismatch-menu__icon"
          aria-hidden="true"
        >
          <q-icon name="public" size="20px" />
        </div>
        <div class="timezone-mismatch-menu__heading">
          <p class="timezone-mismatch-menu__title">
            {{ t('timezoneMismatchTitle') }}
          </p>
          <p class="timezone-mismatch-menu__lead">
            {{ t('timezoneMismatchLead') }}
          </p>
        </div>
      </div>
      <div class="timezone-mismatch-menu__body">
        <div class="timezone-mismatch-menu__zones">
          <button
            type="button"
            class="timezone-mismatch-menu__card"
            :class="{
              'timezone-mismatch-menu__card--active':
                usingBrowser,
            }"
            :aria-pressed="usingBrowser ? 'true' : 'false'"
            :data-testid="portalTestIds.timezoneBannerUseDevice"
            @click="onUseDevice"
          >
            <span class="timezone-mismatch-menu__label">
              {{ t('timezoneMismatchDeviceLabel') }}
            </span>
            <span class="timezone-mismatch-menu__value">
              {{ browserZone }}
            </span>
            <span
              v-if="usingBrowser"
              class="timezone-mismatch-menu__badge"
            >
              {{ t('timezoneMismatchInUse') }}
            </span>
          </button>
          <button
            type="button"
            class="timezone-mismatch-menu__card"
            :class="{
              'timezone-mismatch-menu__card--active':
                !usingBrowser,
            }"
            :aria-pressed="usingBrowser ? 'false' : 'true'"
            :data-testid="
              portalTestIds.timezoneBannerKeepClinic
            "
            @click="onUseClinic"
          >
            <span class="timezone-mismatch-menu__label">
              {{ t('timezoneMismatchClinicLabel') }}
            </span>
            <span class="timezone-mismatch-menu__value">
              {{ clinicZone }}
            </span>
            <span
              v-if="!usingBrowser"
              class="timezone-mismatch-menu__badge"
            >
              {{ t('timezoneMismatchInUse') }}
            </span>
          </button>
        </div>
        <p class="timezone-mismatch-menu__hint">
          {{ t('timezoneMismatchSessionHint') }}
        </p>
      </div>
    </q-menu>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { portalTestIds } from 'src/test-ids/index.js'
import { useSessionDisplayTimezone } from
  'src/composables/useSessionDisplayTimezone.js'

const CLOSE_MS = 180
const { t } = useI18n()
const {
  mismatch,
  usingBrowser,
  clinicZone,
  browserZone,
  useBrowserZone,
  useClinicZone,
} = useSessionDisplayTimezone()

const menuOpen = ref(false)
let closeTimer = null

function clearCloseTimer() {
  if (closeTimer) {
    window.clearTimeout(closeTimer)
    closeTimer = null
  }
}

function openMenu() {
  clearCloseTimer()
  menuOpen.value = true
}

function scheduleClose() {
  clearCloseTimer()
  closeTimer = window.setTimeout(() => {
    menuOpen.value = false
    closeTimer = null
  }, CLOSE_MS)
}

function toggleMenu() {
  clearCloseTimer()
  menuOpen.value = !menuOpen.value
}

function onUseDevice() {
  useBrowserZone()
}

function onUseClinic() {
  useClinicZone()
}
</script>
