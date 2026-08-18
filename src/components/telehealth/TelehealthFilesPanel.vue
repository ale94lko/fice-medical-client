<template>
  <div class="telehealth-room__panel">
    <h3 class="telehealth-room__panel-title">
      {{ t('telehealthFilesTitle') }}
    </h3>
    <div
      v-if="canUpload"
      class="q-mb-md">
      <q-file
        v-model="picked"
        dense
        outlined
        dark
        clearable
        :label="t('telehealthFilesPick')"
        @update:model-value="onPick"
      />
    </div>
    <div class="telehealth-files-list">
      <div
        v-for="file in files"
        :key="file.id"
        class="telehealth-file-row">
        <div class="col">
          <div>{{ fileLabel(file) }}</div>
          <div
            class="text-caption"
            style="opacity: 0.65">
            {{ file.category }}
          </div>
        </div>
        <div class="row q-gutter-xs no-wrap">
          <q-btn
            flat
            dense
            round
            icon="download"
            :data-testid="telehealthTestIds.fileDownload(file.id)"
            :aria-label="t('telehealthDownload')"
            @click="$emit('download', file)">
            <q-tooltip>{{ t('telehealthDownload') }}</q-tooltip>
          </q-btn>
          <q-btn
            v-if="canDelete"
            flat
            dense
            round
            icon="delete"
            :data-testid="telehealthTestIds.fileDelete(file.id)"
            :aria-label="t('delete')"
            @click="$emit('delete', file.id)">
            <q-tooltip>{{ t('delete') }}</q-tooltip>
          </q-btn>
        </div>
      </div>
      <p
        v-if="!files.length"
        class="text-caption"
        style="opacity: 0.7">
        {{ t('telehealthFilesEmpty') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { telehealthTestIds } from 'src/test-ids/index.js'

defineProps({
  files: { type: Array, default: () => [] },
  canUpload: { type: Boolean, default: false },
  canDelete: { type: Boolean, default: false },
})

const emit = defineEmits(['upload', 'download', 'delete'])
const { t } = useI18n()
const picked = ref(null)

function fileLabel(file) {
  return file?.file?.originalName
    || t('telehealthFileFallback', { id: file?.id })
}

function onPick(file) {
  if (!file) {
    return
  }
  emit('upload', file)
  picked.value = null
}
</script>
