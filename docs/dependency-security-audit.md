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
TypeScript 5.9 and ESLint 9 remain on their compatible lines: the current
typescript-eslint peer range excludes TypeScript 7, and the current
eslint-plugin-import/react peer ranges exclude ESLint 10. There was no downgrade
or forced peer installation. Linter rules and test configuration were preserved.

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
