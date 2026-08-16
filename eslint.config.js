import js from '@eslint/js'
import globals from 'globals'
import pluginVue from 'eslint-plugin-vue'
import pluginQuasar from '@quasar/app-vite/eslint'

export default [
  {
    // ignores: []
  },

  ...pluginQuasar.configs.recommended(),
  js.configs.recommended,
  ...pluginVue.configs[ 'flat/essential' ],

  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',

      globals: {
        ...globals.browser,
        ...globals.node,
        process: 'readonly',
        ga: 'readonly',
        cordova: 'readonly',
        Capacitor: 'readonly',
        chrome: 'readonly',
        browser: 'readonly'
      }
    },

    rules: {
      'prefer-promise-reject-errors': 'off',
      'comma-dangle': ['error', 'only-multiline'],
      'indent': ['error', 2, { 'SwitchCase': 1 }],
      'linebreak-style' : 'off',
      'no-useless-concat': 'error',
      'rest-spread-spacing': 'error',
      'semi-spacing': 'error',
      'arrow-spacing': ['error'],
      'array-bracket-spacing': [2, 'never'],
      'block-scoped-var': 2,
      'brace-style': [2, '1tbs'],
      'camelcase': 1,
      'computed-property-spacing': [2, 'never'],
      'comma-spacing': ['error'],
      'curly': 2,
      'eol-last': 2,
      'eqeqeq': [0, 'smart'],
      'key-spacing': ['error'],
      'keyword-spacing': [2, {'before': true, 'after': true}],
      'max-depth': [1, 3],
      'max-len': [1, 80],
      'max-statements': ['warn', 40],
      'new-cap': 1,
      'no-extend-native': 2,
      'no-mixed-spaces-and-tabs': 2,
      'no-trailing-spaces': 2,
      'no-unused-vars': 1,
      'no-use-before-define': [2, 'nofunc'],
      'no-multi-spaces': 'error',
      'quotes': [2, 'single', 'avoid-escape'],
      'space-unary-ops': 2,
      'space-in-parens': ['error', 'never'],
      'space-before-function-paren': ['error', 'never'],
      'space-before-blocks': ['error'],
      'operator-linebreak': ['error', 'before', {
        'overrides': {
          '+=': 'before',
          '=': 'after',
          '+': 'before',
          '-': 'before',
          '||': 'before',
          '&&': 'before',
        }
      }],
      'no-new': 0,
      'no-console': 0,
      'semi': [2, 'never'],
      'object-curly-spacing': ['error', 'always'],
      'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off'
    }
  },

  {
    files: ['**/i18n/**/*.js'],
    rules: {
      'max-len': 'off',
    },
  },
]
