/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [
    require.resolve('./base.js'),
    'next/core-web-vitals',
    'plugin:jsx-a11y/recommended',
  ],
  plugins: ['jsx-a11y'],
  rules: {
    'react/jsx-key': 'error',
    'react/no-unescaped-entities': 'off',
    '@next/next/no-html-link-for-pages': 'off',
    'jsx-a11y/anchor-is-valid': 'warn',
  },
};
