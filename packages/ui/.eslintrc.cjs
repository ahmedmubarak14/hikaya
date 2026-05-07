module.exports = {
  root: true,
  extends: [require.resolve('@hikaya/config/eslint/base')],
  parserOptions: {
    ecmaFeatures: { jsx: true },
  },
};
