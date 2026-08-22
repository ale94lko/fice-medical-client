<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    full-width
    content-class="portal-consent-dialog"
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="onOpenChange"
  >
    <q-card
      class="portal-dialog portal-dialog--wide portal-card"
      :data-testid="portalTestIds.consentsSignDialog"
    >
      <q-card-section class="portal-dialog__header">
        <h2 class="portal-dialog__title">
          {{ detail?.name || t('consents') }}
        </h2>
        <q-btn
          flat
          round
          dense
          icon="close"
          :aria-label="t('close')"
          :data-testid="portalTestIds.consentsSignDialogClose"
          @click="close"
        />
      </q-card-section>
      <q-card-section class="portal-dialog__body">
        <p v-if="loading" class="text-body2 text-grey-7 q-mb-none">
          {{ t('submit') }}…
        </p>
        <div
          v-else-if="detail"
          class="portal-consent-scroll"
        >
          <iframe
            ref="frameRef"
            class="portal-consent-frame"
            sandbox="allow-same-origin"
            referrerpolicy="no-referrer"
            :title="detail.name || t('consents')"
            :srcdoc="framedHtml"
            @load="fitFrame"
          />
          <PortalConsentFields
            v-model="fieldValues"
            :fields="authorizationFields"
            :show-errors="fieldShowErrors"
          />
          <p
            v-if="!clientMaySign"
            class="text-body2 text-grey-7 q-mt-md q-mb-none"
          >
            {{ t('consentClientSignerNotAllowed') }}
          </p>
          <SignatureCanvas
            v-else-if="detail.signature_required !== false"
            v-model="signatureArtifact"
            size="tall"
            class="portal-consent-sign"
            :hint="t('consentSignatureHint')"
          />
        </div>
      </q-card-section>
      <q-card-actions
        align="right"
        class="portal-dialog__actions"
      >
        <q-btn
          outline
          no-caps
          color="primary"
          :label="t('declineConsent')"
          :loading="declining"
          :disable="busy"
          :data-testid="portalTestIds.consentsBtnDecline"
          @click="onDecline"
        />
        <q-btn
          unelevated
          no-caps
          color="primary"
          class="auth-submit"
          :label="t('signConsent')"
          :loading="signing"
          :disable="!canSign || busy"
          :data-testid="portalTestIds.consentsBtnSign"
          @click="onSign"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import SignatureCanvas from 'src/components/SignatureCanvas.vue'
import PortalConsentFields from 'src/components/PortalConsentFields.vue'
import { api } from 'boot/axios'
import { portalTestIds } from 'src/test-ids/index.js'
import { portalPaths, unwrapData } from 'src/utils/portal-api.js'
import {
  buildConsentFieldValueWrites,
  missingRequiredConsentFields,
  normalizeConsentFieldValue,
  valuesByKeyFromConsentFields,
} from 'src/utils/consent-fields.js'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  consentId: { type: [Number, String], default: null },
})

const emit = defineEmits(['update:modelValue', 'signed', 'declined'])
const { t } = useI18n()
const detail = ref(null)
const loading = ref(false)
const signing = ref(false)
const declining = ref(false)
const signatureArtifact = ref('')
const fieldValues = ref({})
const fieldShowErrors = ref(false)
const frameRef = ref(null)

const busy = computed(() => signing.value || declining.value)

function parseAllowedSignerTypes(raw) {
  if (Array.isArray(raw)) {
    return raw
      .map(item => String(item ?? '').trim().toUpperCase())
      .filter(Boolean)
  }
  const token = String(raw ?? '').trim()
  if (!token) {
    return []
  }

  return token
    .split(',')
    .map(item => item.trim().toUpperCase())
    .filter(Boolean)
}

function clientRequirementOpen(detail) {
  const requirements = detail?.signature_requirements
    ?? detail?.signatureRequirements
  if (Array.isArray(requirements) && requirements.length) {
    return requirements.some(item => {
      if (item?.satisfied) {
        return false
      }

      return parseAllowedSignerTypes(
        item.allowed_signer_types ?? item.allowedSignerTypes,
      ).includes('CLIENT')
    })
  }
  const types = parseAllowedSignerTypes(
    detail?.allowed_signer_types ?? detail?.allowedSignerTypes,
  )
  if (!types.length) {
    return true
  }

  return types.includes('CLIENT')
}

const clientMaySign = computed(() => clientRequirementOpen(detail.value))

const canSign = computed(() => {
  if (!detail.value || !clientMaySign.value) {
    return false
  }
  if (detail.value.signature_required === false) {
    return true
  }

  return Boolean(String(signatureArtifact.value ?? '').trim())
})

const authorizationFields = computed(() => {
  const raw = detail.value?.field_values ?? detail.value?.fieldValues
  if (!Array.isArray(raw)) {
    return []
  }

  return raw.map((item, index) => normalizeConsentFieldValue(item, index))
})

const framedHtml = computed(() => {
  const body = String(detail.value?.content_html ?? '')
  return [
    '<!doctype html><html><head><meta charset="utf-8">',
    '<style>html,body{margin:0;overflow:hidden}',
    'body{padding:8px 4px;color:#0f172a;',
    'font:15px/1.5 Inter,Segoe UI,sans-serif}',
    'h1,h2,h3{margin:0 0 .5rem;line-height:1.25}',
    'p{margin:0 0 12px}ul,ol{padding-left:1.2em}</style>',
    '</head><body>',
    body,
    '</body></html>',
  ].join('')
})

function close() {
  emit('update:modelValue', false)
}

function onOpenChange(value) {
  emit('update:modelValue', value)
}

function fitFrame() {
  const frame = frameRef.value
  if (!frame) {
    return
  }
  try {
    const doc = frame.contentDocument
    const height = Math.max(
      doc?.body?.scrollHeight || 0,
      doc?.documentElement?.scrollHeight || 0,
    )
    if (height) {
      frame.style.height = `${height}px`
    }
  } catch {
    // Cross-origin frames cannot be measured.
  }
}

async function loadDetail() {
  if (!props.consentId) {
    detail.value = null
    return
  }
  loading.value = true
  signatureArtifact.value = ''
  fieldShowErrors.value = false
  fieldValues.value = {}
  try {
    const { data } = await api.get(portalPaths.consent(props.consentId))
    detail.value = unwrapData(data)
    fieldValues.value = valuesByKeyFromConsentFields(
      authorizationFields.value,
    )
  } catch {
    detail.value = null
    close()
  } finally {
    loading.value = false
  }
}

async function onSign() {
  if (!canSign.value || !props.consentId) {
    return
  }
  fieldShowErrors.value = true
  if (missingRequiredConsentFields(
    authorizationFields.value,
    fieldValues.value,
  ).length) {
    Notify.create({
      type: 'negative',
      message: t('consentFieldsRequired'),
    })

    return
  }
  signing.value = true
  try {
    await api.post(portalPaths.consentSign(props.consentId), {
      signatureArtifact: signatureArtifact.value,
      fieldValues: buildConsentFieldValueWrites(
        authorizationFields.value,
        fieldValues.value,
      ),
    })
    Notify.create({ type: 'positive', message: t('consentSigned') })
    emit('signed')
    close()
  } finally {
    signing.value = false
  }
}

async function onDecline() {
  if (!props.consentId) {
    return
  }
  declining.value = true
  try {
    await api.post(portalPaths.consentDecline(props.consentId), {})
    Notify.create({ type: 'positive', message: t('consentDeclined') })
    emit('declined')
    close()
  } finally {
    declining.value = false
  }
}

watch(
  () => [props.modelValue, props.consentId],
  ([open]) => {
    if (open) {
      void loadDetail()
    }
  },
)

watch(framedHtml, async() => {
  await nextTick()
  fitFrame()
})
</script>
