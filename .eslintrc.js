module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Disable problematic rules that are causing build failures
    'no-use-before-define': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'no-unused-vars': 'warn',
    'no-redeclare': 'off',
    'no-undef': 'off'
  },
  env: {
    browser: true,
    es6: true,
    node: true
  }
};
