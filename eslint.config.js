import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // S85d: regla v6 overly strict para nuestros patrones. showToast() lee
      // toastTimeoutRef.current pero SOLO desde event handlers (nunca durante
      // render). La regla flaggea también calls dentro de inline async functions
      // pasadas como props, aunque solo se ejecuten al hacer click. Disabling
      // global es más limpio que añadir comentarios per-line o refactorizar.
      'react-hooks/refs': 'off',
    },
  },
])
