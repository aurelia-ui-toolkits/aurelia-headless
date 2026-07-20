import parser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/docs/**',
      '**/*.d.ts'
    ]
  },
  {
    files: ['**/*.ts'],
    languageOptions: {
      parser,
      ecmaVersion: 'latest',
      sourceType: 'module'
    },
    linterOptions: {
      // Existing inline disable comments are intentional; don't flag them.
      reportUnusedDisableDirectives: 'off'
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }]
    }
  }
];
