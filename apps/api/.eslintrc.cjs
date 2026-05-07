module.exports = {
  root: true,
  extends: [require.resolve('@hikaya/config/eslint/nest')],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};
