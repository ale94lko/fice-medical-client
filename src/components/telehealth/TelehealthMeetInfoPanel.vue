<template>
  <div class="telehealth-room__panel">
    <h3 class="telehealth-room__panel-title">
      {{ t('telehealthMeetInfoTitle') }}
    </h3>

    <div class="telehealth-meet-info__rows">
      <div
        v-for="row in appointmentRows"
        :key="row.label"
        class="telehealth-meet-info__row">
        <div class="telehealth-meet-info__label">
          {{ row.label }}
        </div>
        <div class="telehealth-meet-info__value">
          {{ row.value }}
        </div>
      </div>
      <div
        v-if="meetingCode && showMeetingCode"
        class="telehealth-meet-info__row">
        <div class="telehealth-meet-info__label">
          {{ t('telehealthMeetInfoCodeLabel') }}
        </div>
        <div class="telehealth-meet-info__value">
          {{ meetingCode }}
        </div>
      </div>
      <div
        v-if="statusLabel"
        class="telehealth-meet-info__row">
        <div class="telehealth-meet-info__label">
          {{ t('telehealthMeetInfoStatusLabel') }}
        </div>
        <div class="telehealth-meet-info__value">
          {{ statusLabel }}
        </div>
      </div>
    </div>

    <div
      v-if="showInviteTools && resolvedInviteUrl"
      class="telehealth-meet-info__invite q-mt-md">
      <p class="telehealth-meet-info__label q-mb-sm">
        {{ t('telehealthClientInviteLabel') }}
      </p>
      <div class="row no-wrap items-center q-gutter-xs q-mb-sm">
        <q-btn
          flat
          dense
          round
          color="primary"
          icon="content_copy"
          :data-testid="telehealthTestIds.copyInvite"
          :aria-label="t('telehealthCopy')"
          @click="$emit('copy-invite')">
          <q-tooltip>{{ t('telehealthCopy') }}</q-tooltip>
        </q-btn>
        <q-input
          :model-value="resolvedInviteUrl"
          dense
          outlined
          dark
          readonly
          class="col"
        />
      </div>
      <TelehealthResendInviteFields
        class="q-mt-md"
        :invite-email="inviteEmail"
        :use-custom-email="useCustomInviteEmail"
        :loading="inviteLoading"
        @update:invite-email="
          $emit('update:inviteEmail', $event)
        "
        @update:use-custom-email="
          $emit('update:useCustomInviteEmail', $event)
        "
        @resend="$emit('resend-invite')"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  formatUtcDateLong,
  formatUtcTimeRange,
  resolveBrowserTimeZone,
  resolveTenantTimeZone,
} from 'src/utils/telehealth-datetime.js'
import TelehealthResendInviteFields from
  './TelehealthResendInviteFields.vue'
import { telehealthTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  meetingCode: { type: String, default: '' },
  statusLabel: { type: String, default: '' },
  clientInviteUrl: { type: String, default: '' },
  inviteEmail: { type: String, default: '' },
  useCustomInviteEmail: { type: Boolean, default: false },
  inviteLoading: { type: Boolean, default: false },
  appointment: { type: Object, default: null },
  /** Staff can copy/resend invite; guests only see appointment summary. */
  showInviteTools: { type: Boolean, default: true },
  showMeetingCode: { type: Boolean, default: true },
  /** Guest: browser/OS zone. Staff: tenant/clinic zone. */
  useBrowserTimeZone: { type: Boolean, default: false },
})

defineEmits([
  'copy-invite',
  'resend-invite',
  'update:inviteEmail',
  'update:useCustomInviteEmail',
])

const { t } = useI18n()

function pushRow(rows, label, value) {
  const text = String(value ?? '').trim()
  if (!text) {
    return
  }
  rows.push({ label, value: text })
}

const resolvedInviteUrl = computed(() =>
  String(
    props.clientInviteUrl
    || props.appointment?.telehealthInviteUrl
    || '',
  ).trim(),
)

const appointmentRows = computed(() => {
  const appt = props.appointment
  if (!appt) {
    return []
  }
  const rows = []
  pushRow(
    rows,
    t('appointmentDetailNumberLabel'),
    appt.appointmentNumber,
  )
  pushRow(rows, t('clientNumber'), appt.clientNumber)
  pushRow(rows, t('clinician'), appt.clinicianDisplayName)
  pushRow(rows, t('client'), appt.clientDisplayName)
  pushRow(
    rows,
    t('appointmentDetailServicesLabel'),
    appt.servicesLabel || appt.appointmentTypeName,
  )
  const timeZone = props.useBrowserTimeZone
    ? resolveBrowserTimeZone()
    : resolveTenantTimeZone()
  const dateLabel = formatUtcDateLong(appt.startAtUtc, timeZone)
  pushRow(rows, t('telehealthMeetInfoDateLabel'), dateLabel)
  const timeLabel = formatUtcTimeRange(
    appt.startAtUtc,
    appt.endAtUtc,
    timeZone,
  )
  pushRow(rows, t('telehealthMeetInfoTimeLabel'), timeLabel)
  if (appt.durationMin != null) {
    pushRow(
      rows,
      t('telehealthMeetInfoDurationLabel'),
      t('telehealthMeetInfoDurationMinutes', {
        minutes: appt.durationMin,
      }),
    )
  }

  return rows
})
</script>
