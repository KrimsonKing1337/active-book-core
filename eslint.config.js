import { defineConfig, globalIgnores } from 'eslint/config';

import { fixupPluginRules } from '@eslint/compat';
import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import newlineDestructuring from 'eslint-plugin-newline-destructuring';

import importX from 'eslint-plugin-import-x';
import tsParser from '@typescript-eslint/parser';
import typescriptEslint from '@typescript-eslint/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import jest from 'eslint-plugin-jest';

const ignores = [
  '**/*.js',
  'eslint.config.js',
  'lib',
  'scripts',
  'd.ts',
];

const globIgnores = globalIgnores(ignores);

export default defineConfig([globIgnores, {
  extends: [js.configs.recommended, typescriptEslint.configs['flat/recommended']],

  plugins: {
    'import-x': importX,
    '@stylistic': stylistic,
    'newline-destructuring': fixupPluginRules(newlineDestructuring),
    'react-hooks': reactHooks,
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
    'import-x/internal-regex': '^(?:@types$|@(assets|components|pages|controllers|hooks|utils|store|styles)(/.*)?)$',
  },

  rules: {
    'import-x/order': ['error', {
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
        { pattern: '@controllers{,/**}', group: 'internal', position: 'after' },
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

    '@stylistic/object-property-newline': ['error',  {
      allowAllPropertiesOnSameLine: true,
    }],

    '@stylistic/object-curly-newline': ['error', {
      ObjectExpression: {
        minProperties: 3,
        multiline: true,
        consistent: true,
      },
      ObjectPattern: {
        minProperties: 3,
        multiline: true,
        consistent: true,
      },
      TSTypeLiteral: {
        minProperties: 1,
        multiline: true,
        consistent: true,
      },
      TSInterfaceBody: {
        minProperties: 1,
        multiline: true,
        consistent: true,
      },
      TSEnumBody: {
        minProperties: 1,
        multiline: true,
        consistent: true,
      }
    }],

    '@stylistic/padding-line-between-statements': ['error', {
      blankLine: 'always',
      prev: '*',
      next: 'return',
    }],

    '@stylistic/curly-newline': ['error', {
      'minElements': 1,
    }],

    '@stylistic/max-len': ['error', {
      code: 120,
    }],

    'max-lines': ['warn', {
      max: 150,
      skipBlankLines: true,
      skipComments: true,
    }],

    'import-x/no-default-export': 'warn',
    'curly': ['error', 'all'],

    'no-unneeded-ternary': ['error', {
      defaultAssignment: true,
    }],

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
    '@stylistic/jsx-self-closing-comp': 'error',

    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/camelcase': 0,
    '@typescript-eslint/interface-name-prefix': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/explicit-module-boundary-types': 0,
    '@typescript-eslint/no-var-requires': 0,

    '@typescript-eslint/no-explicit-any': ['warn', {
      ignoreRestArgs: false,
    }],

    'newline-destructuring/newline': ['error', {
      items: 2,
      consistent: false,
      allowAllPropertiesOnSameLine: false,
    }],

    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
  },
},
{
  files: ['tests/**/*.{ts,tsx}'],
  languageOptions: {
    parserOptions: {
      project: './tests/tsconfig.json',
    },
  },
}]);
