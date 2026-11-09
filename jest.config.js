import { defineConfig } from 'jest';

import packageJson from './package.json' with { type: 'json' };

export default defineConfig({
  coverageDirectory: '<rootDir>/coverage',
  coverageProvider: 'v8',
  verbose: true,
  testResultsProcessor: 'jest-sonar-reporter',

  globals: {
    __IS_SERVER__: false,
    __NAME__: packageJson.name,
  },

  moduleDirectories: ['node_modules', 'src'],

  collectCoverageFrom: [
    'src/**/*.{ts,tsx,js,jsx}',
    '!src/**/*.d.ts',
    '!src/test/**/*',
    '!src/**/types.ts',
    '!src/**/*.test.ts',
    '!src/**/*.test.tsx',
    '!src/**/__mocks__/**/*',
    '!src/**/__test__/**/*',
    '!src/**/mixins/**/*',
    '!src/**/index.ts',
    '!src/**/styles.ts',
    '!src/**/*.stories.*',
    '!**/node_modules/**',
  ],

  coveragePathIgnorePatterns: [
    'manifest.ts',
    'example.tsx',
    'analytics-utils.ts',
    'use-isomorphic-layout-effect.ts',
    'api.ts',
    'slice.ts',
    'saga.ts',
    'memo.tsx',
    'with-helmet.tsx',
  ],

  setupFiles: ['react-app-polyfill/jsdom'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup-tests.ts'],

  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}',
  ],
  testEnvironment: 'jsdom',

  transform: {
    '^.+\\.(js|jsx|mjs|cjs|ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: true,
        },
        transform: {
          react: { runtime: 'automatic' },
        },
      },
    }],
    '^(?!.*\\.(js|jsx|mjs|cjs|ts|tsx|css|json)$).+$': '<rootDir>/config/jest/file-transform.js',
  },

  transformIgnorePatterns: [],

  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '.+\\.(css|scss|png|jpg|jpeg|ttf|woff|woff2)$': 'jest-transform-stub',
    '\\.svg': '<rootDir>/src/test/svg-mock.ts',
    '^react($|/.+)': '<rootDir>/node_modules/react$1',
    '^@@/(.*)$': '<rootDir>/src/$1',
    '^@types$': '<rootDir>/src/@types.ts',
    '^@(assets|components|controllers|pages|hooks|utils|store|styles)$': '<rootDir>/src/$1',
    '^@(assets|components|controllers|pages|hooks|utils|store|styles)/(.*)$': '<rootDir>/src/$1/$2',
  },

  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],

  resetMocks: true,
});
