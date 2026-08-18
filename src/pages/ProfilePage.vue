<template>
  <div>
    <h1 class="portal-page__title">{{ title }}</h1>
    <p class="portal-page__lead">{{ t('profileLead') }}</p>

    <q-banner
      v-if="profile?.needs_profile_completion"
      class="portal-banner q-mb-md"
      rounded
    >
      {{ t('needsClientRecord') }}
    </q-banner>

    <q-form
      class="portal-form portal-profile-form"
      @submit.prevent="onSave"
    >
      <q-card class="portal-card q-mb-md">
        <q-card-section>
          <div class="portal-profile-identity">
            <span class="portal-profile-avatar" aria-hidden="true">
              {{ userInitials }}
            </span>
            <div class="portal-profile-identity__text">
              <div class="portal-profile-identity__name">
                {{ displayName }}
              </div>
              <div class="portal-profile-identity__meta">
                <q-icon
                  name="mail"
                  size="16px"
                  class="portal-profile-identity__mail"
                  aria-hidden="true"
                />
                <span :data-testid="portalTestIds.profileFieldEmail">
                  {{ profile?.email || '—' }}
                </span>
              </div>
            </div>
          </div>
          <p class="portal-profile-identity__hint">
            {{ t('profileIdentityHint') }}
          </p>

          <div class="row q-col-gutter-md">
            <div class="col-12 col-sm-6">
              <LoginTextInput
                v-model="firstName"
                icon-left="person"
                :label="t('firstName')"
                :test-id="portalTestIds.profileFieldFirstName"
                :rules="[val => !!val || t('firstNameRequired')]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <LoginTextInput
                v-model="lastName"
                icon-left="person"
                :label="t('lastName')"
                :test-id="portalTestIds.profileFieldLastName"
                :rules="[val => !!val || t('lastNameRequired')]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <PortalDateField
                v-model="dateOfBirth"
                :label="t('dateOfBirth')"
                :close-label="t('close')"
                :test-id="portalTestIds.profileFieldDob"
              />
            </div>
            <div class="col-12 col-sm-6">
              <LoginTextInput
                v-model="phone"
                type="tel"
                icon-left="phone"
                :label="t('phoneOptional')"
                :test-id="portalTestIds.profileFieldPhone"
              />
            </div>
          </div>
          <template v-if="hasChart">
            <p class="portal-choice-label q-mt-lg">
              {{ t('profileSex') }}
            </p>
            <div class="portal-choice-grid">
              <button
                v-for="option in sexOpts"
                :key="option.value"
                type="button"
                class="portal-booking-choice"
                :class="{
                  'portal-booking-choice--active':
                    chart.sex === option.value,
                }"
                :data-testid="portalTestIds.profileFieldSex(
                  option.value,
                )"
                @click="selectSex(option.value)"
              >
                <span class="portal-booking-choice__title">
                  {{ option.label }}
                </span>
              </button>
            </div>
          </template>
          <div
            v-if="!hasChart"
            class="portal-form__actions"
          >
            <q-btn
              type="submit"
              color="primary"
              unelevated
              no-caps
              class="auth-submit"
              :label="t('saveProfile')"
              :loading="saving"
              :data-testid="portalTestIds.profileBtnSave"
            />
          </div>
        </q-card-section>
      </q-card>

      <PortalProfileExtras
        v-if="hasChart"
        v-model="chart"
      >
        <template #actions>
          <q-btn
            type="submit"
            color="primary"
            unelevated
            no-caps
            class="auth-submit"
            :label="t('saveProfile')"
            :loading="saving"
            :data-testid="portalTestIds.profileBtnSave"
          />
        </template>
      </PortalProfileExtras>
    </q-form>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import { api } from 'boot/axios'
import LoginTextInput from 'src/components/LoginTextInput.vue'
import PortalDateField from 'src/components/PortalDateField.vue'
import PortalProfileExtras from 'src/components/PortalProfileExtras.vue'
import { portalTestIds } from 'src/test-ids/index.js'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import {
  isoDateToUsDate,
  usDateToIsoDate,
} from 'src/utils/portal-datetime.js'
import {
  chartFromProfile,
  chartToRequest,
  emptyChart,
  sexOptions,
} from 'src/utils/portal-profile.js'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const authStore = useAuthStore()
const profile = ref(null)
const firstName = ref('')
const lastName = ref('')
const dateOfBirth = ref('')
const phone = ref('')
const chart = ref(emptyChart())
const saving = ref(false)

const sexOpts = computed(() => sexOptions(t))
const hasChart = computed(() => Boolean(profile.value?.has_client))

const title = computed(() => (
  profile.value?.needs_profile_completion
    ? t('completeProfile')
    : t('profile')
))

const displayName = computed(() => {
  const preferred = String(profile.value?.preferred_name ?? '').trim()
  if (preferred) {
    return preferred
  }
  const full = [firstName.value, lastName.value]
    .map(part => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ')
  return full || t('profile')
})

const userInitials = computed(() => {
  const parts = [
    firstName.value,
    lastName.value,
  ]
    .map(part => String(part ?? '').trim())
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

function selectSex(value) {
  chart.value.sex = chart.value.sex === value ? '' : value
}

function applyProfile(data) {
  profile.value = data
  firstName.value = data?.first_name || ''
  lastName.value = data?.last_name || ''
  dateOfBirth.value = isoDateToUsDate(data?.date_of_birth)
  phone.value = data?.phone || ''
  chart.value = chartFromProfile(data, isoDateToUsDate)
}

function buildPayload() {
  const payload = {
    firstName: firstName.value.trim(),
    lastName: lastName.value.trim(),
    dateOfBirth: usDateToIsoDate(dateOfBirth.value),
    phone: phone.value.trim(),
  }
  if (!hasChart.value) {
    return payload
  }
  return {
    ...payload,
    ...chartToRequest(chart.value, usDateToIsoDate),
  }
}

onMounted(async() => {
  const { data } = await api.get(portalPaths.profile)
  applyProfile(unwrapData(data))
})

async function onSave() {
  const payload = buildPayload()
  if (!payload.dateOfBirth) {
    Notify.create({
      type: 'negative',
      message: t('dateOfBirthRequired'),
    })
    return
  }
  saving.value = true
  try {
    const { data } = await api.patch(
      portalPaths.profile,
      payload,
    )
    applyProfile(unwrapData(data))
    await authStore.loadMe()
    Notify.create({ type: 'positive', message: t('profileSaved') })
  } finally {
    saving.value = false
  }
}
</script>
