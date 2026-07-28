module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['airbnb-base', 'prettier'],
  plugins: ['prettier'],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script',
  },
  rules: {
    'prettier/prettier': 'warn',
    'no-underscore-dangle': ['error', { allow: ['_id'] }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'consistent-return': 'off',
    'import/no-dynamic-require': 'off',
    'global-require': 'off',
    camelcase: 'off',
    'max-len': ['warn', { code: 120, ignoreComments: true, ignoreStrings: true }],
  },
};
