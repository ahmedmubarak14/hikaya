/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: [require.resolve('./base.js')],
  env: {
    node: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/interface-name-prefix': 'off',
    'import/no-default-export': 'off',
  },
};
