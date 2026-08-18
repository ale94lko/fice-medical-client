<template>
  <div :data-testid="portalTestIds.consentsPage">
    <h1 class="portal-page__title">{{ t('consents') }}</h1>
    <p class="portal-page__lead">{{ t('consentsLead') }}</p>

    <q-banner
      v-if="needsProfile"
      class="portal-banner q-mb-md"
      rounded
    >
      {{ t('needsClientRecord') }}
      <template #action>
        <q-btn
          flat
          no-caps
          color="primary"
          :label="t('completeProfile')"
          to="/profile"
        />
      </template>
    </q-banner>
    <q-banner
      v-else-if="waitingForChart"
      class="portal-banner q-mb-md"
      rounded
    >
      {{ t('waitingForClientChart') }}
    </q-banner>

    <q-card class="portal-card">
      <q-card-section>
        <div class="portal-section-head">
          <div class="portal-section-head__icon" aria-hidden="true">
            <q-icon name="verified_user" size="22px" />
          </div>
          <div class="portal-section-head__text">
            <div class="portal-section-head__title-row">
              <h2 class="portal-section-head__title">
                {{ t('dashboardConsentsTitle') }}
              </h2>
              <span
                v-if="items.length"
                class="portal-count-chip"
              >
                {{ items.length }}
              </span>
            </div>
            <p class="portal-section-head__hint">
              {{ t('dashboardConsentsHint') }}
            </p>
          </div>
        </div>

        <div
          v-if="items.length"
          class="portal-open-requests__list"
        >
          <article
            v-for="item in items"
            :key="item.id"
            class="portal-request-item"
          >
            <div class="portal-request-item__main">
              <span class="portal-status-chip">
                {{ t('consentToSign') }}
              </span>
              <div class="portal-request-item__when">
                {{ item.name || t('consents') }}
              </div>
              <div
                v-if="item.assigned_at"
                class="portal-request-item__service"
              >
                {{ formatPortalDate(item.assigned_at) }}
              </div>
            </div>
            <q-btn
              unelevated
              no-caps
              color="primary"
              :label="t('reviewAndSign')"
              :data-testid="portalTestIds.consentsBtnOpen(item.id)"
              @click="openSign(item.id)"
            />
          </article>
        </div>
        <div v-else class="portal-empty">
          <div class="text-body2 text-grey-7">
            {{ t('dashboardConsentsEmpty') }}
          </div>
        </div>
      </q-card-section>
    </q-card>

    <PortalConsentSignDialog
      v-model="signOpen"
      :consent-id="activeId"
      @signed="reload"
      @declined="reload"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { api } from 'boot/axios'
import PortalConsentSignDialog
  from 'src/components/PortalConsentSignDialog.vue'
import { portalTestIds } from 'src/test-ids/index.js'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import { formatPortalDate } from 'src/utils/portal-datetime.js'
import { useAuthStore } from 'stores/auth-store.js'

const { t } = useI18n()
const authStore = useAuthStore()
const items = ref([])
const signOpen = ref(false)
const activeId = ref(null)

const needsProfile = computed(() =>
  Boolean(authStore.me?.needs_profile_completion),
)

const waitingForChart = computed(() =>
  Boolean(authStore.me)
  && !authStore.me.needs_profile_completion
  && !authStore.me.has_client,
)

function openSign(id) {
  activeId.value = id
  signOpen.value = true
}

async function reload() {
  if (!authStore.me) {
    await authStore.loadMe()
  }
  const { data } = await api.get(portalPaths.consents)
  const payload = unwrapData(data)
  items.value = Array.isArray(payload) ? payload : []
}

onMounted(reload)
</script>
