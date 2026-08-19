<template>
  <q-card
    class="portal-card portal-action-card"
    :data-testid="testId"
  >
    <q-card-section class="portal-action-card__section">
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
        v-if="visibleItems.length"
        class="portal-open-requests__list"
        :class="{
          'portal-open-requests__list--scroll': listScrolls,
        }"
        :style="listScrollStyle"
      >
        <article
          v-for="item in visibleItems"
          :key="item.key"
          class="portal-request-item"
        >
          <div class="portal-request-item__main">
            <div
              v-if="item.place"
              class="portal-request-item__place"
            >
              <div
                class="portal-request-item__place-icon"
                aria-hidden="true"
              >
                <q-icon
                  :name="item.placeIcon || 'place'"
                  size="16px"
                />
              </div>
              <div class="portal-request-item__place-body">
                <div class="portal-request-item__place-row">
                  <span class="portal-request-item__place-name">
                    {{ item.place }}
                  </span>
                  <span
                    v-if="item.chip"
                    class="portal-status-chip"
                  >
                    {{ item.chip }}
                  </span>
                </div>
                <div
                  v-if="item.placeAddress"
                  class="portal-request-item__address"
                >
                  {{ item.placeAddress }}
                </div>
              </div>
            </div>
            <div class="portal-request-item__when-row">
              <div class="portal-request-item__when">
                <span>{{ item.title }}</span>
                <span
                  v-if="item.time"
                  class="portal-request-item__clock"
                >
                  {{ item.time }}
                </span>
              </div>
              <span
                v-if="item.chip && !item.place"
                class="portal-status-chip"
              >
                {{ item.chip }}
              </span>
            </div>
            <div
              v-if="item.meta"
              class="portal-request-item__service"
            >
              {{ item.meta }}
            </div>
          </div>
          <div
            v-if="item.showJoin || item.cancelLabel"
            class="portal-request-item__side"
          >
            <span
              v-if="item.showJoin"
              class="portal-request-item__join-wrap"
            >
              <q-btn
                unelevated
                no-caps
                color="primary"
                :label="item.actionLabel"
                :to="item.joinDisabled ? undefined : item.to"
                :disable="item.joinDisabled"
                :data-testid="item.testId"
              />
              <q-tooltip
                v-if="item.joinHint"
                class="app-info-tooltip"
              >
                {{ item.joinHint }}
              </q-tooltip>
            </span>
            <q-btn
              v-if="item.cancelLabel"
              outline
              no-caps
              color="primary"
              :label="item.cancelLabel"
              :data-testid="item.cancelTestId"
              @click="emit('cancel', item.source || item)"
            />
          </div>
        </article>
      </div>
      <div v-else class="portal-empty">
        <div class="text-body2 text-grey-7">
          {{ emptyText }}
        </div>
      </div>

      <q-btn
        v-if="viewMoreTo"
        flat
        dense
        no-caps
        color="primary"
        class="portal-dashboard-more"
        :to="viewMoreTo"
        :data-testid="viewMoreTestId"
      >
        {{ t('dashboardViewMore') }}
        <q-icon name="chevron_right" size="18px" />
      </q-btn>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const DASHBOARD_PREVIEW_LIMIT = 3

const props = defineProps({
  title: { type: String, required: true },
  hint: { type: String, default: '' },
  icon: { type: String, required: true },
  items: { type: Array, default: () => [] },
  emptyText: { type: String, default: '' },
  testId: { type: String, default: '' },
  viewMoreTo: { type: String, default: '' },
  viewMoreTestId: { type: String, default: '' },
  unlimited: { type: Boolean, default: false },
  maxVisible: { type: Number, default: 0 },
})

const emit = defineEmits(['cancel'])
const { t } = useI18n()
const visibleItems = computed(() => {
  const list = props.items ?? []
  if (props.unlimited) {
    return list
  }
  return list.slice(0, DASHBOARD_PREVIEW_LIMIT)
})

const listScrolls = computed(() =>
  props.unlimited
  && props.maxVisible > 0
  && visibleItems.value.length > props.maxVisible,
)

const listScrollStyle = computed(() => {
  if (!listScrolls.value) {
    return undefined
  }
  const visible = props.maxVisible
  const gaps = Math.max(0, visible - 1)
  return {
    '--portal-visit-visible': String(visible),
    '--portal-visit-gaps': String(gaps),
  }
})
</script>
