<template>
  <div>
    <q-card class="portal-card portal-profile-card q-mb-md">
      <q-card-section>
        <div class="portal-section-head">
          <div class="portal-section-head__icon" aria-hidden="true">
            <q-icon name="home" size="22px" />
          </div>
          <div class="portal-section-head__text">
            <h2 class="portal-section-head__title">
              {{ t('profileAddressTitle') }}
            </h2>
            <p class="portal-section-head__hint">
              {{ t('profileAddressHint') }}
            </p>
          </div>
        </div>
        <LoginTextInput
          v-model="chart.address.line1"
          icon-left="place"
          :label="t('addressLine1')"
          :test-id="portalTestIds.profileFieldAddressLine1"
        />
        <LoginTextInput
          v-model="chart.address.line2"
          :label="t('addressLine2')"
          :test-id="portalTestIds.profileFieldAddressLine2"
        />
        <div class="row q-col-gutter-md q-mt-md">
          <div class="col-12 col-sm-6">
            <LoginTextInput
              v-model="chart.address.city"
              :label="t('city')"
              :test-id="portalTestIds.profileFieldCity"
            />
          </div>
          <div class="col-12 col-sm-3">
            <LoginTextInput
              v-model="chart.address.state"
              :label="t('state')"
              :test-id="portalTestIds.profileFieldState"
            />
          </div>
          <div class="col-12 col-sm-3">
            <LoginTextInput
              v-model="chart.address.zip"
              :label="t('zip')"
              :test-id="portalTestIds.profileFieldZip"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="portal-card portal-profile-card q-mb-md">
      <q-card-section>
        <div class="portal-section-head">
          <div class="portal-section-head__icon" aria-hidden="true">
            <q-icon name="support_agent" size="22px" />
          </div>
          <div class="portal-section-head__text">
            <h2 class="portal-section-head__title">
              {{ t('profileEmergencyTitle') }}
            </h2>
            <p class="portal-section-head__hint">
              {{ t('profileEmergencyHint') }}
            </p>
          </div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <LoginTextInput
              v-model="chart.emergency.firstName"
              icon-left="person"
              :label="t('firstName')"
              :test-id="portalTestIds.profileFieldEmergencyFirst"
            />
          </div>
          <div class="col-12 col-sm-6">
            <LoginTextInput
              v-model="chart.emergency.lastName"
              icon-left="person"
              :label="t('lastName')"
              :test-id="portalTestIds.profileFieldEmergencyLast"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="chart.emergency.relationship"
              outlined
              emit-value
              map-options
              clearable
              hide-bottom-space
              class="login-text-input full-width"
              :options="relationshipOpts"
              :label="t('relationship')"
              :data-testid="portalTestIds.profileFieldEmergencyRel"
            />
          </div>
          <div class="col-12 col-sm-6">
            <LoginTextInput
              v-model="chart.emergency.phone"
              type="tel"
              icon-left="phone"
              :label="t('phoneOptional')"
              :test-id="portalTestIds.profileFieldEmergencyPhone"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="portal-card portal-profile-card q-mb-md">
      <q-card-section>
        <div class="portal-section-head">
          <div class="portal-section-head__icon" aria-hidden="true">
            <q-icon name="forum" size="22px" />
          </div>
          <div class="portal-section-head__text">
            <h2 class="portal-section-head__title">
              {{ t('profileCommTitle') }}
            </h2>
            <p class="portal-section-head__hint">
              {{ t('profileCommHint') }}
            </p>
          </div>
        </div>
        <div class="portal-choice-grid">
          <button
            v-for="option in communicationOpts"
            :key="option.value"
            type="button"
            class="portal-booking-choice"
            :class="{
              'portal-booking-choice--active':
                chart.communicationPreference === option.value,
            }"
            :data-testid="portalTestIds.profileFieldComm(
              option.value,
            )"
            @click="selectComm(option.value)"
          >
            <span class="portal-booking-choice__title">
              {{ option.label }}
            </span>
            <span class="portal-booking-choice__meta">
              {{ option.hint }}
            </span>
          </button>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="portal-card portal-profile-card q-mb-md">
      <q-card-section>
        <div class="portal-section-head">
          <div class="portal-section-head__icon" aria-hidden="true">
            <q-icon name="health_and_safety" size="22px" />
          </div>
          <div class="portal-section-head__text">
            <h2 class="portal-section-head__title">
              {{ t('profileInsuranceTitle') }}
            </h2>
            <p class="portal-section-head__hint">
              {{ t('profileInsuranceHint') }}
            </p>
          </div>
        </div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <LoginTextInput
              v-model="chart.insurance.payerPlanName"
              icon-left="apartment"
              :label="t('insurancePayer')"
              :test-id="portalTestIds.profileFieldInsurancePayer"
            />
          </div>
          <div class="col-12 col-sm-6">
            <LoginTextInput
              v-model="chart.insurance.memberId"
              icon-left="badge"
              :label="t('insuranceMemberId')"
              :test-id="portalTestIds.profileFieldInsuranceMember"
            />
          </div>
          <div class="col-12 col-sm-6">
            <PortalDateField
              v-model="chart.insurance.effectiveUs"
              :label="t('insuranceEffective')"
              :close-label="t('close')"
              :test-id="portalTestIds.profileFieldInsuranceFrom"
            />
          </div>
          <div class="col-12 col-sm-6">
            <PortalDateField
              v-model="chart.insurance.expirationUs"
              :label="t('insuranceExpiration')"
              :close-label="t('close')"
              :test-id="portalTestIds.profileFieldInsuranceTo"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card class="portal-card portal-profile-card q-mb-md">
      <q-card-section>
        <div class="portal-section-head">
          <div class="portal-section-head__icon" aria-hidden="true">
            <q-icon name="vaccines" size="22px" />
          </div>
          <div class="portal-section-head__text">
            <h2 class="portal-section-head__title">
              {{ t('profileAllergiesTitle') }}
            </h2>
            <p class="portal-section-head__hint">
              {{ t('profileAllergiesHint') }}
            </p>
          </div>
        </div>
        <p class="portal-choice-label">
          {{ t('preferredLanguage') }}
        </p>
        <div class="portal-choice-grid q-mb-md">
          <button
            v-for="option in languageOpts"
            :key="option.value"
            type="button"
            class="portal-booking-choice"
            :class="{
              'portal-booking-choice--active':
                chart.preferredLanguage === option.value,
            }"
            :data-testid="portalTestIds.profileFieldLanguage(
              option.value,
            )"
            @click="selectLanguage(option.value)"
          >
            <span class="portal-booking-choice__title">
              {{ option.label }}
            </span>
          </button>
        </div>
        <button
          type="button"
          class="portal-booking-choice q-mb-md"
          :class="{
            'portal-booking-choice--active': chart.noAllergies,
          }"
          :data-testid="portalTestIds.profileNoAllergies"
          @click="toggleNoAllergies"
        >
          <span class="portal-booking-choice__title">
            {{ t('noKnownAllergies') }}
          </span>
          <span class="portal-booking-choice__meta">
            {{ t('noKnownAllergiesHint') }}
          </span>
        </button>
        <div v-if="!chart.noAllergies">
          <div
            v-for="(row, index) in chart.allergies"
            :key="row.id || `new-${index}`"
            class="portal-allergy-row"
          >
            <LoginTextInput
              v-model="row.name"
              :label="t('allergyName')"
              :test-id="portalTestIds.profileAllergyName(index)"
            />
            <q-select
              v-model="row.severity"
              outlined
              emit-value
              map-options
              hide-bottom-space
              class="login-text-input full-width"
              :options="severityOpts"
              :label="t('allergySeverity')"
              :data-testid="portalTestIds.profileAllergySeverity(
                index,
              )"
            />
            <q-btn
              flat
              round
              dense
              icon="close"
              color="grey-7"
              :aria-label="t('removeAllergy')"
              :data-testid="portalTestIds.profileAllergyRemove(
                index,
              )"
              @click="removeAllergy(index)"
            />
          </div>
          <q-btn
            outline
            no-caps
            color="primary"
            icon="add"
            class="q-mt-sm"
            :label="t('addAllergy')"
            :data-testid="portalTestIds.profileBtnAddAllergy"
            @click="addAllergy"
          />
        </div>
        <div class="portal-form__actions">
          <slot name="actions" />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import LoginTextInput from 'src/components/LoginTextInput.vue'
import PortalDateField from 'src/components/PortalDateField.vue'
import { portalTestIds } from 'src/test-ids/index.js'
import {
  communicationOptions,
  emptyAllergyRow,
  languageOptions,
  relationshipOptions,
  severityOptions,
} from 'src/utils/portal-profile.js'

const chart = defineModel({ type: Object, required: true })
const { t } = useI18n()

const relationshipOpts = computed(() => relationshipOptions(t))
const communicationOpts = computed(() => communicationOptions(t))
const languageOpts = computed(() => languageOptions(t))
const severityOpts = computed(() => severityOptions(t))

function selectComm(value) {
  const current = chart.value.communicationPreference
  chart.value.communicationPreference = current === value
    ? ''
    : value
}

function selectLanguage(value) {
  const current = chart.value.preferredLanguage
  chart.value.preferredLanguage = current === value
    ? ''
    : value
}

function toggleNoAllergies() {
  const next = !chart.value.noAllergies
  chart.value.noAllergies = next
  if (next) {
    chart.value.allergies = []
  }
}

function addAllergy() {
  chart.value.noAllergies = false
  chart.value.allergies.push(emptyAllergyRow())
}

function removeAllergy(index) {
  chart.value.allergies.splice(index, 1)
}
</script>
