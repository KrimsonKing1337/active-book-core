import assert from 'node:assert/strict';
import {
  readdirSync,
  readFileSync,
  statSync,
} from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { browserTests } from '../../scripts/runBrowserTests.js';

const scriptsDirectory = fileURLToPath(new URL('../../scripts/', import.meta.url));
const testsDirectory = fileURLToPath(new URL('../', import.meta.url));

test('scripts contains tools without test files or test fixtures', () => {
  const violations = [];
  const entries = readdirSync(scriptsDirectory, { recursive: true });

  for (const entryCur of entries) {
    const segments = entryCur.split(path.sep);
    const filename = path.basename(entryCur);
    const isTestDirectory = segments.some((segmentCur) => {
      return /^(?:__)?(?:tests?|fixtures?)(?:__)?$/i.test(segmentCur);
    });

    const isTestFile = /\.(?:test|spec)\.[cm]?[jt]sx?$/.test(filename);
    const isFixtureFile = /fixture\.[cm]?[jt]sx?$/i.test(filename);

    if (isTestDirectory || isTestFile || isFixtureFile) {
      violations.push(entryCur);

      continue;
    }

    const absolutePath = path.join(scriptsDirectory, entryCur);

    if (!statSync(absolutePath).isFile() || !/\.[cm]?[jt]sx?$/.test(filename)) {
      continue;
    }

    const source = readFileSync(absolutePath, 'utf8');

    if (/(?:from\s*|import\s*\(|require\s*\()\s*['"]node:test['"]/.test(source)) {
      violations.push(entryCur);
    }
  }

  assert.deepEqual(violations, [], 'Move tests and test fixtures from scripts/ to tests/');
});

test('browser runner includes every browser test exactly once', () => {
  const discovered = [];

  for (const entryCur of readdirSync(testsDirectory, { recursive: true })) {
    if (!/\.browser\.test\.[cm]?[jt]sx?$/.test(entryCur)) {
      continue;
    }

    const normalizedPath = entryCur.split(path.sep).join('/');

    discovered.push(normalizedPath);
  }

  assert.equal(new Set(browserTests).size, browserTests.length, 'Browser test list contains duplicates');
  assert.deepEqual([...browserTests].sort(), discovered.sort());
});
