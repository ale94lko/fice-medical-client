<template>
  <div class="telehealth-preview">
    <video
      ref="videoRef"
      autoplay
      muted
      playsinline
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps({
  stream: { type: Object, default: null },
})

const videoRef = ref(null)

function attachStream(stream) {
  const el = videoRef.value
  if (!el) {
    return
  }
  el.srcObject = stream || null
  if (stream) {
    el.play?.().catch(() => {})
  }
}

watch(
  () => props.stream,
  value => attachStream(value),
  { immediate: true },
)

watch(videoRef, () => attachStream(props.stream))

onBeforeUnmount(() => {
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
})
</script>
