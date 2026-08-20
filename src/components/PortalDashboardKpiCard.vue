<template>
  <component
    :is="to ? 'router-link' : 'div'"
    class="portal-kpi-link"
    :to="to"
    :data-testid="testId"
  >
    <q-card class="portal-card portal-kpi">
      <q-card-section class="portal-kpi__section">
        <p class="portal-kpi__label">{{ label }}</p>
        <div class="portal-kpi__row">
          <div
            class="portal-kpi__icon"
            :class="`portal-kpi__icon--${tone}`"
            aria-hidden="true"
          >
            <q-icon :name="icon" size="22px" />
          </div>
          <div class="portal-kpi__copy">
            <p class="portal-kpi__value">{{ value }}</p>
            <p class="portal-kpi__hint">{{ hint }}</p>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </component>
</template>

<script setup>
defineProps({
  label: { type: String, required: true },
  hint: { type: String, required: true },
  value: { type: [Number, String], required: true },
  icon: { type: String, required: true },
  tone: { type: String, default: 'primary' },
  to: { type: String, default: '' },
  testId: { type: String, default: '' },
})
</script>
