import { onUnmounted, ref, watch } from 'vue'
import { isImageContentType } from
  'src/utils/portal-messages-normalize.js'

export function useMessageImagePreviews(messages, downloadFile) {
  const previewUrls = ref({})
  const pending = new Set()

  async function loadPreview(file) {
    if (!file?.id || pending.has(file.id)) {
      return
    }
    if (previewUrls.value[file.id]) {
      return
    }
    if (!Number.isFinite(Number(file.id))) {
      return
    }
    if (!isImageContentType(file.contentType)) {
      return
    }
    pending.add(file.id)
    try {
      const payload = await downloadFile(file.id)
      const url = URL.createObjectURL(payload.blob)
      previewUrls.value = {
        ...previewUrls.value,
        [file.id]: url,
      }
    } catch {
      pending.delete(file.id)
    }
  }

  watch(
    messages,
    (rows) => {
      const list = Array.isArray(rows) ? rows : []
      list.forEach((msg) => {
        if (msg?.pending || !msg?.file) {
          return
        }
        void loadPreview(msg.file)
      })
    },
    { immediate: true },
  )

  onUnmounted(() => {
    Object.values(previewUrls.value).forEach((url) => {
      URL.revokeObjectURL(url)
    })
  })

  return previewUrls
}
