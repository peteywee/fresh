/** @type {import('eslint').Linter.FlatConfig[]} */
module.exports = [
  { 
    ignores: [
      '**/dist/**', 
      '**/.next/**', 
      '**/node_modules/**', 
      '**/out/**',
      '**/build/**',
      'docs/**', 
      'sac.json',
      'coverage/**',
      '*.d.ts'
    ] 
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-unused-vars': 'off', // Use TypeScript version instead
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: require('@typescript-eslint/parser'),
      parserOptions: { 
        ecmaVersion: 'latest', 
        sourceType: 'module'
      },
    },
    plugins: { '@typescript-eslint': require('@typescript-eslint/eslint-plugin') },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
];
