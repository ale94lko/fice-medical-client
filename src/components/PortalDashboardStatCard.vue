<template>
  <q-card
    class="portal-card portal-action-card"
    :data-testid="testId"
  >
    <q-card-section>
      <div class="portal-section-head">
        <div class="portal-section-head__icon" aria-hidden="true">
          <q-icon :name="icon" size="22px" />
        </div>
        <div class="portal-section-head__text">
          <div class="portal-section-head__title-row">
            <h2 class="portal-section-head__title">
              {{ title }}
            </h2>
            <span
              v-if="items.length"
              class="portal-count-chip"
            >
              {{ items.length }}
            </span>
          </div>
          <p v-if="hint" class="portal-section-head__hint">
            {{ hint }}
          </p>
        </div>
      </div>

      <div
        v-if="items.length"
        class="portal-open-requests__list"
      >
        <article
          v-for="item in items"
          :key="item.key"
          class="portal-request-item"
        >
          <div class="portal-request-item__main">
            <span
              v-if="item.chip"
              class="portal-status-chip"
            >
              {{ item.chip }}
            </span>
            <div class="portal-request-item__when">
              {{ item.title }}
            </div>
            <div
              v-if="item.meta"
              class="portal-request-item__service"
            >
              {{ item.meta }}
            </div>
          </div>
          <q-btn
            v-if="item.to"
            unelevated
            no-caps
            color="primary"
            :label="item.actionLabel"
            :to="item.to"
            :data-testid="item.testId"
          />
        </article>
      </div>
      <div v-else class="portal-empty">
        <div class="text-body2 text-grey-7">
          {{ emptyText }}
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  hint: { type: String, default: '' },
  icon: { type: String, required: true },
  items: { type: Array, default: () => [] },
  emptyText: { type: String, default: '' },
  testId: { type: String, default: '' },
})
</script>
