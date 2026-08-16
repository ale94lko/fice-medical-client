import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'
import messages from 'src/i18n'

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
  app.use(i18n)
})
