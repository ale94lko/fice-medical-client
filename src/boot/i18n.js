import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

let i18nSingleton = null

export function i18nGlobalT(key) {
  if (!i18nSingleton?.global?.t) {
    return key === 'sessionExpiredRelogin'
      ? 'Your session has expired, please sign in again'
      : String(key)
  }

  return String(i18nSingleton.global.t(key))
}

export default defineBoot(({ app }) => {
  const savedLocale = localStorage.getItem('locale')
  const isSpanish = navigator.language.slice(0, 2) === 'es'
  const browserLocale = isSpanish ? 'es-ES' : 'en-US'
  const i18n = createI18n({
    locale: savedLocale || browserLocale,
    fallbackLocale: 'en-US',
    globalInjection: true,
    messages,
  })
  i18nSingleton = i18n
  app.use(i18n)
})
