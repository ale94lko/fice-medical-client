<template>
  <aside
    class="login-promo-panel"
    role="complementary"
    :aria-label="t('loginPromoAriaLabel')">
    <div
      class="login-promo-panel__scene"
      aria-hidden="true">
      <svg
        class="login-promo-panel__wave login-promo-panel__wave--back"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none">
        <defs>
          <linearGradient
            id="loginPromoWaveGradBack"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%">
            <stop offset="0%" stop-color="#99f6e4" stop-opacity="0.15" />
            <stop offset="50%" stop-color="#5eead4" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#2dd4bf" stop-opacity="0.15" />
          </linearGradient>
        </defs>
        <path
          :d="wavePathBack"
          fill="url(#loginPromoWaveGradBack)" />
      </svg>
      <svg
        class="login-promo-panel__wave login-promo-panel__wave--mid"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none">
        <defs>
          <linearGradient
            id="loginPromoWaveGradMid"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%">
            <stop offset="0%" stop-color="#5eead4" stop-opacity="0.25" />
            <stop offset="50%" stop-color="#14b8a6" stop-opacity="0.55" />
            <stop offset="100%" stop-color="#0d9488" stop-opacity="0.25" />
          </linearGradient>
        </defs>
        <path
          :d="wavePathMid"
          fill="url(#loginPromoWaveGradMid)" />
      </svg>
      <svg
        class="login-promo-panel__wave login-promo-panel__wave--front"
        viewBox="0 0 1440 320"
        preserveAspectRatio="none">
        <defs>
          <linearGradient
            id="loginPromoWaveGradFront"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%">
            <stop offset="0%" stop-color="#2dd4bf" stop-opacity="0.35" />
            <stop offset="50%" stop-color="#0f766e" stop-opacity="0.65" />
            <stop offset="100%" stop-color="#14b8a6" stop-opacity="0.35" />
          </linearGradient>
        </defs>
        <path
          :d="wavePathFront"
          fill="url(#loginPromoWaveGradFront)" />
      </svg>
    </div>

    <div class="login-promo-panel__inner">
      <h1 class="login-promo-panel__headline">
        <span class="login-promo-panel__headline-line">
          {{ t('loginPromoHeadline') }}
        </span>
        <span class="login-promo-panel__headline-accent">
          {{ t('loginPromoHeadlineAccent') }}
        </span>
      </h1>
      <p class="login-promo-panel__lead">
        {{ t('loginPromoDescription') }}
      </p>
      <ul class="login-promo-panel__features">
        <li
          v-for="feature in promoFeatures"
          :key="feature.icon"
          class="login-promo-panel__feature">
          <div
            class="login-promo-panel__feature-icon"
            aria-hidden="true">
            <q-icon :name="feature.icon" size="20px" />
          </div>
          <div class="login-promo-panel__feature-body">
            <div class="login-promo-panel__feature-title">
              {{ t(feature.titleKey) }}
            </div>
            <p class="login-promo-panel__feature-desc">
              {{ t(feature.descKey) }}
            </p>
          </div>
        </li>
      </ul>
      <div class="login-promo-panel__footer">
        <q-icon
          class="login-promo-panel__footer-icon"
          name="shield"
          size="18px"
          aria-hidden="true" />
        <p class="login-promo-panel__footer-text">
          {{ t('loginPromoFooter') }}
        </p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const wavePathBack = [
  'M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7',
  'C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,',
  '1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,',
  '1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,',
  '384,320,288,320C192,320,96,320,48,320L0,320Z',
].join('')

const wavePathMid = [
  'M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3',
  'C672,224,768,224,864,208C960,192,1056,160,1152,154.7C1248,149,1344,',
  '171,1392,181.3L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320,',
  'C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,',
  '288,320C192,320,96,320,48,320L0,320Z',
].join('')

const wavePathFront = [
  'M0,256L48,250.7C96,245,192,235,288,229.3C384,224,480,224,576,218.7',
  'C672,213,768,203,864,197.3C960,192,1056,192,1152,186.7C1248,181,',
  '1344,171,1392,165.3L1440,160L1440,320L1392,320C1344,320,1248,320,',
  '1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,',
  '384,320,288,320C192,320,96,320,48,320L0,320Z',
].join('')

const promoFeatures = [
  {
    icon: 'event',
    titleKey: 'loginPromoFeatureAppointmentsTitle',
    descKey: 'loginPromoFeatureAppointmentsDesc',
  },
  {
    icon: 'folder',
    titleKey: 'loginPromoFeatureDocumentsTitle',
    descKey: 'loginPromoFeatureDocumentsDesc',
  },
  {
    icon: 'verified_user',
    titleKey: 'loginPromoFeatureConsentsTitle',
    descKey: 'loginPromoFeatureConsentsDesc',
  },
]
</script>
