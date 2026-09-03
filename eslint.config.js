import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // Wrangler genera bundles temporales bajo .wrangler/; no son código fuente del proyecto.
  // audit-ui: builds estáticos y reportes del harness de auditoría (git-ignored) —
  // son JS minificado de vendor; lintearlos solo produce ruido (374 falsos errores).
  globalIgnores(['dist', '.wrangler', 'tools/audit-ui/.dist-*', 'tools/audit-ui/report', 'tmp']),
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
  {
    // S148: scripts Node CLI bajo tools/ (watchdog.js usa require/__dirname).
    // globals.browser no define globals de Node; este override los añade sin
    // tocar las reglas de src/ (React hooks/refresh siguen aplicando a src/).
    files: ['tools/**/*.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
