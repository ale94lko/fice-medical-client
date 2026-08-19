<template>
  <q-dialog
    v-if="modelValue"
    :model-value="true"
    persistent
    transition-show="scale"
    transition-hide="scale"
    :data-testid="sessionInactivityTestIds.dialog"
    @update:model-value="onDialogUpdate"
  >
    <q-card class="session-expiry-dialog portal-dialog">
      <q-card-section class="session-expiry-dialog__body">
        <div
          class="session-expiry-dialog__icon-wrap"
          aria-hidden="true"
        >
          <q-icon name="warning_amber" size="26px" />
        </div>

        <h2 class="session-expiry-dialog__title">
          {{ t('sessionExpiryTitle') }}
        </h2>

        <div class="session-expiry-dialog__messages">
          <p class="session-expiry-dialog__message">
            {{ t('sessionExpiryInactiveMessage') }}
          </p>
          <p class="session-expiry-dialog__message">
            {{ t('sessionExpiryAutoCloseMessage') }}
          </p>
        </div>

        <div class="session-expiry-dialog__timer">
          <p class="session-expiry-dialog__timer-label">
            {{ t('sessionExpiryCountdownLabel') }}
          </p>
          <p
            class="session-expiry-dialog__timer-value"
            :data-testid="sessionInactivityTestIds.countdown"
          >
            {{ countdown }}
          </p>
        </div>

        <div class="session-expiry-dialog__actions">
          <q-btn
            no-caps
            unelevated
            dense
            outline
            color="primary"
            class="session-expiry-dialog__btn"
            :disable="actionsDisabled"
            :data-testid="sessionInactivityTestIds.closeSection"
            :label="t('sessionExpiryCloseSection')"
            @click="emit('close-section')"
          />
          <q-btn
            no-caps
            unelevated
            dense
            color="primary"
            class="session-expiry-dialog__btn"
            :loading="keepOpenLoading"
            :disable="actionsDisabled && !keepOpenLoading"
            :data-testid="sessionInactivityTestIds.keepOpen"
            :label="t('sessionExpiryKeepOpen')"
            @click="emit('keep-open')"
          />
        </div>

        <p class="session-expiry-dialog__footer">
          <q-icon name="lock" size="12px" />
          <span>{{ t('sessionExpirySecureFooter') }}</span>
        </p>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { sessionInactivityTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  countdown: {
    type: String,
    required: true,
  },
  keepOpenLoading: {
    type: Boolean,
    default: false,
  },
  closingSection: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'update:modelValue',
  'close-section',
  'keep-open',
])

const { t } = useI18n()

function onDialogUpdate(open) {
  if (!open) {
    emit('update:modelValue', false)
  }
}

const actionsDisabled = computed(
  () => props.keepOpenLoading || props.closingSection,
)
</script>
