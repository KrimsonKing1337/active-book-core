# Jest

Run the unit tests with `npm test`, watch them with `npm test -- --watch`, or
collect coverage with `npm run test:coverage`. Run the file transformer regression
tests together with ESLint and test-layout regressions with `npm run test:scripts`.
The transformer suite alone is `node --test tests/jest/file-transform.test.js`.

## Transformation and types

Jest and `jest-environment-jsdom` use version 30.5.2; `@types/jest` uses version 30.
The existing ESM `jest.config.js` uses Jest's `defineConfig`, so loading the config
does not need a TypeScript loader or another configuration file.

`@swc/jest` and `@swc/core` replace Babel for JS, JSX, MJS, CJS, TS and TSX.
SWC targets the running Node version, uses React's automatic JSX runtime,
provides source maps and hoists `jest.mock`. Tests continue to run as CommonJS
inside Jest, including transformed ESM dependencies such as `lodash-es` and
`nanoid`. `transformIgnorePatterns: []` is intentional.

Transformation does not typecheck. Run `npm run typecheck` for source code and
unit tests, and `npm run typecheck:test` for the browser fixtures.

## Preserved behavior

The existing test patterns, aliases, module search directories and extension
order are unchanged. This includes relative `.js` imports resolving to TypeScript,
the React singleton mapping, `@@/*`, `@types` and the named source aliases.

The jsdom environment, `__IS_SERVER__` and `__NAME__` globals, `resetMocks`,
Testing Library matchers, watch typeahead plugins and Sonar XML reporter remain
enabled. `react-app-polyfill/jsdom` is retained because it provides `fetch`,
`Headers`, `Request` and `Response` in jsdom.

CSS, SCSS, image and font mappings still use `jest-transform-stub`; SVG imports
still use `tests/jest/svg-mock.ts`. The redundant CSS transformer and unreachable
SVG branch in the fallback transformer were removed. Other assets use the file
transformer, which exports their basename. Its pattern now actually matches
asset paths, and its return value follows Jest's `{ code }` transformer contract.

Coverage uses V8, avoiding Babel instrumentation. The collection patterns,
exclusions, output directory and report formats are unchanged. The before/after
coverage reports contain the same 193 source files. Coverage percentages can
differ because V8 and Babel count statements, branches and functions differently.

The unused `ts-jest`, `jest-jasmine2`, `@testing-library/user-event` and direct
Babel dependencies were removed. Babel packages required transitively by Jest,
Testing Library and ESLint remain installed; they are not configured to transform
the project's tests or instrument coverage.

## References

- [Jest configuration](https://jestjs.io/docs/configuration)
- [Jest code transformation](https://jestjs.io/docs/code-transformation)
- [Jest TypeScript setup](https://jestjs.io/docs/getting-started#using-typescript)
- [SWC Jest integration](https://swc.rs/docs/usage/jest)
- [React Testing Library setup](https://testing-library.com/docs/react-testing-library/setup/)
