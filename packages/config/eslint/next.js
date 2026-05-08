/**
 * Standalone Next.js eslint config.
 *
 * Intentionally does NOT extend our `base.js`: `eslint-config-next` already
 * registers the `import` plugin via its own `extends` chain, and pnpm's
 * strict resolution makes ESLint v8 see two separately-resolved copies as
 * conflicting plugins. The Next-flavoured config below covers the same
 * substantive rules our base does.
 *
 * @type {import('eslint').Linter.Config}
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'next/core-web-vitals',
    'plugin:jsx-a11y/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/consistent-type-imports': ['warn', { prefer: 'type-imports' }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
    'react/jsx-key': 'error',
    'react/no-unescaped-entities': 'off',
    '@next/next/no-html-link-for-pages': 'off',
    'jsx-a11y/anchor-is-valid': 'warn',
  },
  ignorePatterns: ['dist', 'build', '.next', '.turbo', 'node_modules', 'coverage', '*.config.js', '*.config.cjs'],
};
