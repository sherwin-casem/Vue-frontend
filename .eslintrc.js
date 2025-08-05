module.exports = {
  root: true,
  env: {
    node: true,
    browser: true,
    es2021: true,
  },
  parser: "vue-eslint-parser",
  parserOptions: {
    parser: "@typescript-eslint/parser",
    ecmaVersion: 2021,
    sourceType: "module",
  },
  extends: [
    "plugin:vue/vue3-recommended",      // Vue 3 style & error rules
    "plugin:@typescript-eslint/recommended", // TypeScript rules
  ],
  rules: {
    // Enable some autofixable rules or adjust as needed
    "no-unused-vars": "off", // disable base rule to avoid conflict with TS
    "@typescript-eslint/no-unused-vars": ["error"],
    // Add more rules here if you want
  },
};
