<template>
  <div class="signature-canvas">
    <div
      v-if="!readonly"
      class="signature-canvas__toolbar row items-center q-mb-sm">
      <p class="text-body2 text-grey-7 col q-mb-none">
        {{ hint || t('consentSignatureHint') }}
      </p>
      <q-btn
        no-caps
        :outline="hasStroke"
        :flat="!hasStroke"
        :color="hasStroke ? 'primary' : 'grey-5'"
        class="app-btn-outline signature-canvas__clear"
        :class="{ 'signature-canvas__clear--idle': !hasStroke }"
        icon="restart_alt"
        :data-testid="portalTestIds.consentSignatureClear"
        :disable="!hasStroke"
        :label="t('consentSignatureClear')"
        @click="clearPad"
      />
    </div>
    <div
      ref="padRef"
      class="signature-canvas__pad"
      :class="{
        'signature-canvas__pad--readonly': readonly,
        'signature-canvas__pad--empty': !hasStroke && !readonly,
        'signature-canvas__pad--tall': size === 'tall',
      }">
      <canvas
        ref="canvasRef"
        class="signature-canvas__surface"
        @mousedown.prevent="startDraw"
        @mousemove.prevent="draw"
        @mouseup.prevent="endDraw"
        @mouseleave.prevent="endDraw"
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend.prevent="endDraw"
      />
      <p
        v-if="!hasStroke && !readonly"
        class="signature-canvas__placeholder text-body2">
        <q-icon
          name="draw"
          size="20px"
          class="signature-canvas__placeholder-icon"
        />
        {{ t('consentSignaturePlaceholder') }}
      </p>
    </div>
  </div>
</template>

<script setup>
import {
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'
import { portalTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  hint: {
    type: String,
    default: '',
  },
  /** `default` (160px) or `tall` (220px) for tablet consent signing. */
  size: {
    type: String,
    default: 'default',
    validator: value => ['default', 'tall'].includes(value),
  },
})

const emit = defineEmits(['update:modelValue'])

const { t } = useI18n()

const padRef = ref(null)
const canvasRef = ref(null)
const hasStroke = ref(false)
const drawing = ref(false)
let ctx = null
let resizeObserver = null
let skipEmptyWatch = false

function resizeCanvas() {
  const canvas = canvasRef.value
  const pad = padRef.value
  if (!canvas || !pad) {
    return false
  }
  const rect = pad.getBoundingClientRect()
  if (rect.width < 1 || rect.height < 1) {
    return false
  }
  const ratio = window.devicePixelRatio || 1
  const displayWidth = Math.floor(rect.width)
  const displayHeight = Math.floor(rect.height)
  canvas.width = displayWidth * ratio
  canvas.height = displayHeight * ratio
  canvas.style.width = `${displayWidth}px`
  canvas.style.height = `${displayHeight}px`
  ctx = canvas.getContext('2d')
  if (!ctx) {
    return false
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.scale(ratio, ratio)
  ctx.lineWidth = 2
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.strokeStyle = '#1e293b'
  if (props.modelValue) {
    loadImage(props.modelValue)
  }

  return true
}

function ensureCanvasReady() {
  if (ctx && canvasRef.value?.width > 0) {
    return true
  }

  return resizeCanvas()
}

function loadImage(dataUrl) {
  if (!ensureCanvasReady() || !dataUrl) {
    return
  }
  const img = new Image()
  img.onload = () => {
    if (!ctx || !canvasRef.value) {
      return
    }
    const w = canvasRef.value.clientWidth
    const h = canvasRef.value.clientHeight
    ctx.clearRect(0, 0, w, h)
    ctx.drawImage(img, 0, 0, w, h)
    hasStroke.value = true
  }
  img.src = dataUrl
}

function pointerPos(event) {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function startDraw(event) {
  if (props.readonly || !ensureCanvasReady()) {
    return
  }
  drawing.value = true
  const { x, y } = pointerPos(event)
  ctx.beginPath()
  ctx.moveTo(x, y)
}

function draw(event) {
  if (!drawing.value || props.readonly || !ctx) {
    return
  }
  const { x, y } = pointerPos(event)
  ctx.lineTo(x, y)
  ctx.stroke()
  hasStroke.value = true
}

function endDraw() {
  if (!drawing.value) {
    return
  }
  drawing.value = false
  emitValue()
}

function onTouchStart(event) {
  if (!event.touches?.length) {
    return
  }
  startDraw(event.touches[0])
}

function onTouchMove(event) {
  if (!event.touches?.length) {
    return
  }
  draw(event.touches[0])
}

function emitValue() {
  if (!canvasRef.value || !hasStroke.value) {
    return
  }
  skipEmptyWatch = false
  emit('update:modelValue', canvasRef.value.toDataURL('image/png'))
}

function clearPad() {
  if (!canvasRef.value) {
    hasStroke.value = false
    skipEmptyWatch = true
    emit('update:modelValue', '')

    return
  }
  if (ctx) {
    const w = canvasRef.value.clientWidth
    const h = canvasRef.value.clientHeight
    ctx.clearRect(0, 0, w, h)
  }
  hasStroke.value = false
  skipEmptyWatch = true
  emit('update:modelValue', '')
}

watch(
  () => props.modelValue,
  value => {
    if (!value) {
      if (skipEmptyWatch) {
        skipEmptyWatch = false

        return
      }
      if (ctx && canvasRef.value) {
        const w = canvasRef.value.clientWidth
        const h = canvasRef.value.clientHeight
        ctx.clearRect(0, 0, w, h)
      }
      hasStroke.value = false

      return
    }
    if (!hasStroke.value || props.readonly) {
      loadImage(value)
    }
  },
)

watch(
  () => props.readonly,
  () => {
    void nextTick(() => {
      resizeCanvas()
    })
  },
)

onMounted(async() => {
  await nextTick()
  resizeCanvas()
  if (padRef.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      resizeCanvas()
    })
    resizeObserver.observe(padRef.value)
  }
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  window.removeEventListener('resize', resizeCanvas)
})

defineExpose({
  clear: clearPad,
  flush: emitValue,
  resize: resizeCanvas,
})

</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables';

.signature-canvas__clear {
  transition: opacity 0.15s ease, color 0.15s ease,
    border-color 0.15s ease, background-color 0.15s ease;

  &--idle,
  &.disabled,
  &[disabled] {
    opacity: 0.38;
    color: $text-muted !important;
    border-color: transparent !important;
    background: transparent !important;
  }
}

.signature-canvas__pad {
  position: relative;
  border: 1px solid $border-subtle;
  border-radius: $radius-md;
  background: #fff;
  min-height: 160px;
  height: 160px;
  touch-action: none;
  transition: border-color 0.15s ease, background 0.15s ease,
    box-shadow 0.15s ease;
}

.signature-canvas__pad--tall {
  min-height: 220px;
  height: 220px;
}

.signature-canvas__pad--empty {
  border: 1.5px dashed rgba($primary, 0.45);
  background: rgba($primary, 0.03);
  box-shadow: inset 0 0 0 1px rgba($primary, 0.04);

  &:hover {
    border-color: $primary;
    background: rgba($primary, 0.06);
  }
}

.signature-canvas__pad--readonly {
  border-style: solid;
  border-color: $border-subtle;
  background: #f1f5f9;
  box-shadow: none;
}

.signature-canvas__surface {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: block;
  width: 100%;
  height: 100%;
  cursor: crosshair;
  touch-action: none;
  background: transparent;
}

.signature-canvas__pad--readonly .signature-canvas__surface {
  cursor: default;
}

.signature-canvas__placeholder {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  margin: 0;
  color: $primary;
  font-weight: 500;
  opacity: 0.72;
}

.signature-canvas__placeholder-icon {
  margin-right: 8px;
}
</style>
