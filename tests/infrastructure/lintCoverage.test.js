import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { ESLint } from 'eslint';

const root = new URL('../../', import.meta.url);
const eslint = new ESLint({ cwd: fileURLToPath(root) });
const { scripts } = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));

test('standard lint commands cover JS and TS once, including tools, configs and tests', async () => {
  assert.equal(scripts['lint:js:check'], 'eslint "**/*.{js,jsx,mjs,cjs}"');
  assert.equal(scripts['lint:ts:check'], 'eslint "**/*.{ts,tsx,mts,cts}"');
  assert.equal(scripts['lint:css:check'], 'stylelint "{src,tests}/**/*.scss"');

  const paths = [
    'scripts/build.js',
    'eslint.config.js',
    'jest.config.js',
    'config/jest/file-transform.js',
    'tests/audioLifecycle/fadeIn.browser.test.js',
    'tests/audioLifecycle/fadeFixture.js',
    'tests/eslint/eslint.test.js',
    'tests/audioLifecycle/main.ts',
    'src/components/AppWrapper/hooks.ts',
    'src/components/AppWrapper/tests/videoTime.component.test.tsx',
    'd.ts',
  ];
  const results = await eslint.lintFiles(paths);

  assert.equal(results.length, paths.length);

  for (const resultCur of results) {
    assert.equal(resultCur.fatalErrorCount, 0, JSON.stringify(resultCur.messages));
    assert(!resultCur.messages.some((message) => /ignored/.test(message.message)));
  }
});

test('new JS, MJS and CJS tools are checked without a TypeScript project', async () => {
  for (const extensionCur of [
    'js',
    'mjs',
    'cjs',
  ]) {
    const filePath = `scripts/new-tool.${extensionCur}`;
    const config = await eslint.calculateConfigForFile(filePath);
    const [result] = await eslint.lintText('process.stdout.write(missingToolValue);\n', { filePath });

    assert.equal(config.languageOptions.parserOptions.project, null);
    assert.equal(result.fatalErrorCount, 0);
    assert(result.messages.some((message) => message.ruleId === 'no-undef'));
    assert(!result.messages.some((message) => message.message.includes('\'process\'')));

    if (extensionCur === 'cjs') {
      const [commonjsResult] = await eslint.lintText('module.exports = __dirname;\n', { filePath });

      assert.equal(commonjsResult.errorCount, 0, JSON.stringify(commonjsResult.messages));
    } else {
      const [esmResult] = await eslint.lintText('require(\'node:path\');\n', { filePath });

      assert(esmResult.messages.some((message) => message.ruleId === 'no-undef'));
    }
  }
});

test('Node, browser, Jest and Playwright environments stay separate', async () => {
  const browser = await eslint.calculateConfigForFile('src/components/Video/Video.tsx');
  const jest = await eslint.calculateConfigForFile('src/components/Video/tests/Video.test.tsx');
  const jestJavaScript = await eslint.calculateConfigForFile('src/components/Video/tests/new.component.test.js');
  const fixture = await eslint.calculateConfigForFile('tests/audioLifecycle/main.ts');
  const tool = await eslint.calculateConfigForFile('scripts/build.js');
  const harness = await eslint.calculateConfigForFile('tests/browserFixture.js');
  const infrastructure = await eslint.calculateConfigForFile('tests/jest/file-transform.test.js');

  assert.equal(browser.languageOptions.globals.process, undefined);
  assert.equal(browser.languageOptions.globals.expect, undefined);
  assert.notEqual(jest.languageOptions.globals.expect, undefined);
  assert.equal(jest.rules['jest/no-focused-tests'][0], 2);
  assert.notEqual(jestJavaScript.languageOptions.globals.expect, undefined);
  assert.equal(fixture.languageOptions.globals.process, undefined);
  assert.equal(tool.languageOptions.globals.window, undefined);
  assert.notEqual(harness.languageOptions.globals.window, undefined);
  assert.notEqual(harness.languageOptions.globals.process, undefined);
  assert.equal(infrastructure.languageOptions.globals.expect, undefined);
});

test('dependencies and generated output stay outside lint coverage', async () => {
  for (const pathCur of [
    'node_modules/example/index.js',
    'lib/src/components/Video.js',
    'dist/generated.js',
    'tgz/unpacked/index.js',
    'tests/visualPlayground/artifacts/report.js',
  ]) {
    assert.equal(await eslint.isPathIgnored(pathCur), true, pathCur);
  }
});
