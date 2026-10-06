const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  { ignores: ['node_modules/', 'data/'] },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'commonjs',
      globals: { ...globals.node },
    },
    rules: {
      // 'next' é obrigatório na assinatura do handler de erro do Express
      'no-unused-vars': ['error', { argsIgnorePattern: '^(next|req|res)$', caughtErrors: 'none' }],
    },
  },
];
