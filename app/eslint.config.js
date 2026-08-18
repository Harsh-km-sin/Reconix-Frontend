import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * Structure is enforced here rather than left to convention — see
 * docs/REFACTOR_PLAN.md ground rule 3. All three structural rules are errors,
 * so CI fails on them.
 */
const noTypeDeclarations = (where, home) => [
  {
    selector: 'TSInterfaceDeclaration',
    message: `${where} must not declare interfaces. Move this to ${home}.`,
  },
  {
    selector: 'TSTypeAliasDeclaration',
    message: `${where} must not declare type aliases. Move this to ${home}.`,
  },
]

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },

  // Pages render; they do not own shapes. Page props, filter/state shapes and
  // domain models belong to the module.
  {
    files: ['**/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...noTypeDeclarations('Pages', "the module's types.ts"),
      ],
    },
  },

  // Services call the API; DTOs belong to the module, shared envelopes to
  // lib/types/api.ts. This is what kept two rival ListResponse<T> alive.
  {
    files: ['**/services/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...noTypeDeclarations('Services', "the module's types.ts, or lib/types/api.ts if it is a shared envelope"),
      ],
    },
  },

  // The dependency direction is modules -> ui_library, never the reverse.
  // A ui_library component that reaches into a feature is no longer reusable.
  {
    files: ['src/ui_library/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/modules/*', '@/modules/**', '**/modules/*', '**/modules/**'],
              message:
                'ui_library must not import from modules/. Lift the shared part into ui_library, or pass it in as a prop.',
            },
          ],
        },
      ],
    },
  },
])
