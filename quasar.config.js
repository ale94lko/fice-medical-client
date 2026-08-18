import { defineConfig } from '#q-app/wrappers'
import { fileURLToPath } from 'node:url'
import { loadEnv } from 'vite'

function devApiProxy(target) {
  const normalized = target.replace(/\/$/, '')
  const options = {
    target: normalized,
    changeOrigin: true,
    secure: true,
  }
  if (/ngrok(-free)?\.(dev|app|io)/i.test(normalized)) {
    options.headers = {
      'ngrok-skip-browser-warning': 'true',
    }
  }
  return {
    '/portal': { ...options },
    '/logout': { ...options },
    '/telehealth': { ...options, ws: true },
  }
}

export default defineConfig((ctx) => {
  const mode = ctx.dev ? 'development' : 'production'
  const viteEnv = loadEnv(mode, process.cwd(), '')
  const defaultProxy =
    'https://drippy-phonebook-wildcard.ngrok-free.dev'
  const apiProxyTarget = String(
    viteEnv.API_PROXY_TARGET || (ctx.dev ? defaultProxy : ''),
  ).trim()

  return {
    boot: ['i18n', 'axios'],
    css: ['app.scss'],
    extras: [
      'material-icons',
      'material-icons-outlined',
    ],
    build: {
      target: {
        browser: ['es2022', 'firefox115', 'chrome115', 'safari14'],
        node: 'node20',
      },
      vueRouterMode: 'history',
      publicPath: 'fice-medical-client',
      sassVariables: fileURLToPath(
        new URL('./src/css/quasar.variables.scss', import.meta.url),
      ),
      extendViteConf(viteConf) {
        viteConf.define = {
          ...(viteConf.define || {}),
          global: 'globalThis',
        }
      },
      vitePlugins: [
        ['@intlify/unplugin-vue-i18n/vite', {
          ssr: ctx.modeName === 'ssr',
          include: [fileURLToPath(new URL('./src/i18n', import.meta.url))],
        }],
        ['vite-plugin-checker', {
          eslint: {
            lintCommand:
              'eslint -c ./eslint.config.js '
              + '"./src*/**/*.{js,mjs,cjs,vue}"',
            useFlatConfig: true,
          },
        }, { server: false }],
      ],
    },
    devServer: {
      port: 8091,
      open: true,
      proxy: {
        ...(ctx.dev && apiProxyTarget ? devApiProxy(apiProxyTarget) : {}),
      },
    },
    framework: {
      config: {
        notify: { position: 'top' },
        btn: { unelevated: true, rounded: true },
      },
      lang: 'en-US',
      plugins: ['Notify'],
    },
    animations: [],
  }
})
