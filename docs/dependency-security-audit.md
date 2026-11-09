# Dependency security audit — 2026-11-09

Baseline: main at `d7d5689`. Validation used Node 24.19.0 and npm 11.9.0.

## Audit results

| Tree | Before | After |
| --- | --- | --- |
| Full dependency tree | 27: 26 moderate, 1 low | 6 low |
| Production (`--omit=dev`) | 0 | 0 |

The six remaining entries describe one advisory, not six distinct defects:
`deepmerge` and the five packages that depend on it (`jest-config`, `@jest/core`,
`jest-cli`, `jest` and `jest-watch-typeahead`). Jest 30.5.2 still requires
`deepmerge@^4.3.1`; the advisory lists no patched version. The affected operation
merges Jest configuration in development tooling. Production dependencies do not
contain it. Updating Jest when its configuration dependency is fixed is the
appropriate follow-up. Downgrading deepmerge or replacing Jest was rejected.

## Changes and compatibility

Updated compatible direct dependencies and their lockfile resolutions, including
React/React DOM 19.3.1, Redux Toolkit 2.14.0, React Redux 9.3.1, redux-saga 1.5.1,
lodash-es 4.18.1, typescript-eslint 8.72.1, rimraf 6.1.4 and Vite 8.3.6.
The production build creates core 0.0.55 for the editor integration.

Removed unused `moment` and `util`, redundant `@types/classnames`,
`@types/react-redux` and `@types/webpack-env`, the unused core
`eslint-plugin-jsx-a11y`, and the redundant direct `stylelint-config-standard`
dependency. React Redux and classnames provide their own types; the SCSS config
still supplies the standard Stylelint rules transitively.

Two bounded overrides are necessary because current Jest and typescript-eslint
still request vulnerable major versions:

- `glob@>=9.0.0 <14.0.2` → `^14.0.4` fixes canceled filesystem traversal.
- `minimatch@>=7.0.0 <11.0.1` → `^11.0.5` fixes pattern amplification.

Older callback-based glob/minimatch dependencies are unaffected by these ranges
and were deliberately left alone. The replacement versions support the named
APIs used by their consumers. Test discovery, linting, coverage, the build and
all browser scenarios were checked with the replacements.

The Node requirement reflects Vite 8 and the supported glob/minimatch runtimes.
TypeScript 5.9 remains within typescript-eslint's supported compiler range.
ESLint was subsequently migrated to 10.14.0, as described below. There was no
downgrade or forced peer installation. Test configuration was preserved.

## ESLint 10 migration

ESLint 10.14.0 and @eslint/js 10.0.1 use native flat presets instead of
FlatCompat; the direct @eslint/eslintrc dependency was removed. The current
typescript-eslint 8.72.1, Stylistic 5.10.0, React Hooks 7.1.1 and Jest plugin
29.17.0 all declare ESLint 10 support and remain enabled.

eslint-plugin-import 2.32.0 excludes ESLint 10 from its peer range, so it was
replaced with the maintained eslint-plugin-import-x 4.18.1. The order and
no-default-export rules and internal-regex setting moved to the import-x
namespace with their options and severities unchanged. The unused React plugin
was removed: there were no active react/* rules in the effective configuration.
Only disabled obsolete rule aliases were removed.

The newline-destructuring plugin accepts ESLint >=7.2 but calls the removed
getSourceCode method. ESLint's official @eslint/compat 2.1.1 fixupPluginRules
adapts it. This preserves the exact pair/triple/rest behavior; Stylistic's
object-curly-newline and object-property-newline rules do not enforce the same
destructuring restrictions. Other modern plugins need no compatibility wrapper.

All active user rules, parser options and ignore patterns were preserved.
The new recommended no-unassigned-vars, no-useless-assignment and
preserve-caught-error rules are enabled. The core sources needed no changes.
ESLint 10 also tightens the default no-shadow-restricted-names check to include
globalThis. The Node engine range now excludes unsupported Node 22.12 and 23.

Validation after a clean `npm ci --strict-peer-deps --no-audit --no-fund`:

- The same 333 source files are linted, with zero errors and the same 40 warnings.
- Effective configurations and warning diagnostics were compared with ESLint 9;
  existing enabled rules and their severities were retained, with the documented
  new recommended rules and stricter globalThis default.
- `node --test config/eslint.test.js`: 14 passing regression cases for formatting,
  imports, destructuring, new quality checks, React Hooks and focused Jest tests.
- Typechecks, Jest and `npm ls --all` passed without invalid peer dependencies.

No mass autofix or source formatting was performed.

## Validation

- `npm ci --no-audit --no-fund`: clean installation verified.
- `npm test -- --runInBand`: 13 suites, 40 tests passed, before and after.
- `npm run test:coverage -- --runInBand`: 40 tests passed; coverage generated.
- `npm run typecheck` and `npm run typecheck:test`: passed.
- `npx --no-install eslint './src/**/*.{ts,tsx}'`: no errors, 40 existing warnings;
  output is identical to the baseline.
- `npx --no-install stylelint 'src/**/*.scss'`: passed before and after.
- `npm run test:scss-alias`: 8 tests passed.
- `node --test config/jest/file-transform.test.js`: 2 tests passed.
- `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/chromium npm run test:browser`:
  62 tests passed without skips, including the reviewed screenshot.
- `npm run make`: production compilation, alias rewriting and packaging passed.
- `npm audit --json` and `npm audit --omit=dev --json`: results above.

## Sources

- [Glob advisory and fixed release](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)
- [Minimatch advisory and fixed release](https://github.com/advisories/GHSA-g3hv-75wg-m249)
- [Deepmerge advisory: no patched version](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)
- [ESLint 10 migration guide](https://eslint.org/docs/latest/use/migrate-to-10.0.0)
- [Import-x compatibility and migration](https://github.com/un-ts/eslint-plugin-import-x)
