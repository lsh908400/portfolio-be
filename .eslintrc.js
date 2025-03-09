module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
      'eslint:recommended',
      'plugin:@typescript-eslint/recommended',
      'prettier'
    ],
    plugins: ['@typescript-eslint'],
    parserOptions: {
      ecmaVersion: 2018,
      sourceType: 'module',
    },
    env: {
      node: true,
      es6: true,
    },
    rules: {
      // 추가 규칙 설정
    }
  };