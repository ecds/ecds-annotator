module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ["plugin:react/recommended"],
  overrides: [],
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "jsx-a11y"],
  rules: {
    "import/no-extraneous-dependencies": "off",
    "no-console": ["error", { allow: ["warn", "error"] }],
    "no-restricted-syntax": "off",
    "react/function-component-definition": "off",
    "react/prop-types": "off",
    "react/jsx-one-expression-per-line": "off",
  },
};
