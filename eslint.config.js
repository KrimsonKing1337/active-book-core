import { defineConfig, globalIgnores } from 'eslint/config';
import common, { globals, importOrder } from '@active-book/common/eslint';
import jest from 'eslint-plugin-jest';

export default defineConfig([
  globalIgnores([
    '**/node_modules/**',
    '**/{lib,lib-esm,dist,build,coverage,tgz}/**',
    'tests/visualPlayground/artifacts/**',
  ]),
  {
    extends: [common],
    settings: {
      'import-x/internal-regex': '^(?:@types$|@(assets|components|pages|controllers|hooks|utils|store|styles)(/.*)?)$',
    },
    rules: {
      'import-x/order': [
        'error',
        {
          ...importOrder,
          pathGroups: [
            {
              pattern: 'react',
              group: 'external',
              position: 'before',
            },
            {
              pattern: 'react-redux',
              group: 'external',
              position: 'before',
            },

            {
              pattern: '@types',
              group: 'internal',
              position: 'before',
            },
            {
              pattern: '@assets{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@styles{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@pages{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@store{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@controllers{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@hooks{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@components{,/**}',
              group: 'internal',
              position: 'after',
            },
            {
              pattern: '@utils{,/**}',
              group: 'internal',
              position: 'after',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,tsx,mts,cts}', 'd.ts'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { project: './tsconfig.json', tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['tests/**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { project: './tests/tsconfig.json', tsconfigRootDir: import.meta.dirname },
    },
  },
  {
    files: ['**/*.{js,jsx,mjs,cjs}'],
    languageOptions: { parserOptions: { project: null } },
  },
  {
    files: ['src/**/*.{js,jsx,mjs}', 'tests/**/*.{js,jsx,mjs}'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      '*.{js,mjs,cjs}',
      'scripts/**/*.{js,mjs,cjs}',
      'config/**/*.{js,mjs,cjs}',
      'tests/**/*.{test,spec}.{js,mjs,cjs}',
      'tests/**/*Fixture.js',
    ],
    languageOptions: { globals: globals.node },
  },
  {
    // Playwright callbacks execute in the page; the surrounding harness runs in Node.
    files: ['scripts/measureCssFirst.js'],
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      'src/**/*.{test,spec}.{js,jsx,ts,tsx}',
      'src/**/tests/**/*.{js,jsx,ts,tsx}',
      'tests/jest/**/*.ts',
    ],
    plugins: { jest },
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
      'jest/no-identical-title': 'error',
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    },
  },
]);
