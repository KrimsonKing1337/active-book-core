import { defineConfig, globalIgnores } from 'eslint/config';
import common, { importOrder } from '@active-book/common/eslint';
import jest from 'eslint-plugin-jest';

export default defineConfig([
  globalIgnores([
    '**/*.js',
    'eslint.config.js',
    'lib',
    'scripts',
    'd.ts',
  ]),
  {
    extends: [common],
    plugins: { jest },
    languageOptions: { parserOptions: { project: './tsconfig.json' } },
    settings: { 'import-x/internal-regex': '^(?:@types$|@(assets|components|pages|controllers|hooks|utils|store|styles)(/.*)?)$' },
    rules: {
      'import-x/order': ['error', {
        ...importOrder,
        pathGroups: [
          { pattern: 'react', group: 'external', position: 'before' },
          { pattern: 'react-redux', group: 'external', position: 'before' },

          { pattern: '@types', group: 'internal', position: 'before' },
          { pattern: '@assets{,/**}', group: 'internal', position: 'after' },
          { pattern: '@styles{,/**}', group: 'internal', position: 'after' },
          { pattern: '@pages{,/**}', group: 'internal', position: 'after' },
          { pattern: '@store{,/**}', group: 'internal', position: 'after' },
          { pattern: '@controllers{,/**}', group: 'internal', position: 'after' },
          { pattern: '@hooks{,/**}', group: 'internal', position: 'after' },
          { pattern: '@components{,/**}', group: 'internal', position: 'after' },
          { pattern: '@utils{,/**}', group: 'internal', position: 'after' },
        ],
      }],
      '@typescript-eslint/camelcase': 'off',
      '@typescript-eslint/interface-name-prefix': 'off',
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    },
  },
  {
    files: ['tests/**/*.{ts,tsx}'],
    languageOptions: { parserOptions: { project: './tests/tsconfig.json' } },
  },
]);
