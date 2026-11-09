import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';

import jestConfig from '../../jest.config.js';

import fileTransform from './file-transform.js';

test('routes non-script assets to the file transformer', () => {
  const filenames = ['/assets/movie.webm', '/assets/image.gif', '/assets/player.wasm'];

  for (const filenameCur of filenames) {
    const matchingTransform = Object.entries(jestConfig.transform).find(([pattern]) => {
      return new RegExp(pattern).test(filenameCur);
    });
    assert.equal(matchingTransform?.[1], '<rootDir>/config/jest/file-transform.js');
  }
});

test('transforms assets into executable CommonJS exporting the basename', () => {
  const filenames = ['/assets/movie.webm', '/assets/a "quoted" image.gif'];

  for (const filenameCur of filenames) {
    const result = fileTransform.process('', filenameCur);
    const context = { module: { exports: {} } };
    assert.equal(typeof result.code, 'string');
    vm.runInNewContext(result.code, context);
    assert.equal(context.module.exports, filenameCur.slice('/assets/'.length));
  }
});
