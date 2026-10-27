import { defineConfig, globalIgnores } from 'eslint/config';

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { fixupPluginRules } from '@eslint/compat';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';
import stylistic from '@stylistic/eslint-plugin';

import _import from 'eslint-plugin-import';
import tsParser from '@typescript-eslint/parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jest from 'eslint-plugin-jest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

const ignores = [
  '**/*.js',
  'eslint.config.js',
  'lib',
  'scripts',
  'd.ts',
];

const globIgnores = globalIgnores(ignores);

export default defineConfig([globIgnores, {
  extends: compat.extends('eslint:recommended', 'plugin:@typescript-eslint/recommended'),

  plugins: {
    import: fixupPluginRules(_import),
    '@stylistic': stylistic,
    '@typescript-eslint': typescriptEslint,
    react,
    'react-hooks': fixupPluginRules(reactHooks),
    jest,
  },

  languageOptions: {
    parser: tsParser,
    ecmaVersion: 2021,
    sourceType: 'module',

    parserOptions: {
      project: './tsconfig.json',
      ecmaFeatures: {
        jsx: true,
      },
    },
  },

  settings: {
    react: {
      version: 'detect',
    },
    'import/internal-regex': '^(?:@types$|@(assets|components|pages|hooks|utils|store|styles)(/.*)?)$',
  },

  rules: {
    'import/order': ['error', {
      'newlines-between': 'always-and-inside-groups',
      groups: [
        'builtin',
        'external',
        'internal',
        ['parent', 'sibling', 'index'],
      ],

      pathGroups: [
        { pattern: 'react', group: 'external', position: 'before' },
        { pattern: 'react-redux', group: 'external', position: 'before' },

        { pattern: '@types', group: 'internal', position: 'before' },
        { pattern: '@assets{,/**}', group: 'internal', position: 'after' },
        { pattern: '@styles{,/**}', group: 'internal', position: 'after' },
        { pattern: '@pages{,/**}', group: 'internal', position: 'after' },
        { pattern: '@store{,/**}', group: 'internal', position: 'after' },
        { pattern: '@hooks{,/**}', group: 'internal', position: 'after' },
        { pattern: '@components{,/**}', group: 'internal', position: 'after' },
        { pattern: '@utils{,/**}', group: 'internal', position: 'after' },
      ],

      pathGroupsExcludedImportTypes: ['builtin'],
    }],

    '@stylistic/eol-last': ['error', 'always'],
    '@stylistic/comma-dangle': ['error', 'always-multiline'],
    '@stylistic/semi': ['error', 'always'],
    '@stylistic/indent': ['error', 2],
    '@stylistic/quotes': ['error', 'single'],
    '@stylistic/object-curly-spacing': ['error', 'always'],

    '@stylistic/max-len': ['error', {
      code: 120,
    }],

    'max-lines': ['warn', {
      max: 150,
      skipBlankLines: true,
      skipComments: true,
    }],

    'import/no-default-export': 'warn',
    'no-negated-in-lhs': 0,
    'no-native-reassign': 0,
    'jsx-a11y/anchor-is-valid': 0,

    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    '@stylistic/jsx-max-props-per-line': [2, {
      maximum: {
        single: 3,
        multi: 1,
      },
    }],

    '@stylistic/jsx-closing-bracket-location': [2, {
      nonEmpty: 'tag-aligned',
      selfClosing: 'line-aligned',
    }],

    '@stylistic/jsx-closing-tag-location': 1,
    '@stylistic/jsx-first-prop-new-line': [2, 'multiline'],
    '@stylistic/jsx-curly-brace-presence': ['error', 'never'],
    'react/self-closing-comp': 'error',

    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/camelcase': 0,
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-var-requires': 0,

    '@typescript-eslint/no-explicit-any': ['warn', {
      ignoreRestArgs: false,
    }],

    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
  },
}]);
