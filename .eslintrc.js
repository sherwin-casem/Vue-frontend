module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ['plugin:vue/vue3-recommended', 'eslint:recommended', 'plugin:prettier/recommended'],
  parserOptions: {
    parser: '@babel/eslint-parser'
  },
  rules: {
    'no-console': 'warn',
    'no-debugger': 'warn',
    'vue/multi-word-component-names': 'warn',
    'no-unused-vars': 'warn',
    'vue/no-unused-vars': 'warn',
    'vue/valid-v-slot': 'off',
    'prettier/prettier': ['error', {}, { usePrettierrc: true }]
  }
}
