import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { rewriteScss } from './scssAlias.js';

const scriptsDirectory = path.dirname(fileURLToPath(import.meta.url));
let outputDirectory;
let filePath;

const createFile = (relativePath, content = '') => {
  const absolutePath = path.join(outputDirectory, relativePath);

  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);

  return absolutePath;
};

const transform = (content) => rewriteScss({
  content,
  filePath,
  outputDirectory,
});

beforeEach(() => {
  outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'scss-alias-'));
  filePath = createFile('components/Card.scss');
  createFile('styles/_variables.scss');
  createFile('styles/_index.scss');
  createFile('styles/forward.scss');
  createFile('assets/img/icon.svg');
});

afterEach(() => {
  fs.rmSync(outputDirectory, { recursive: true, force: true });
});

test('rewrites @use, @forward, and multiple @import paths', () => {
  const content = [
    '@use "~styles/variables" as v;',
    "@forward '~styles/forward';",
    '@import "~styles/variables", "~styles/forward";',
  ].join('\n');
  const result = transform(content);

  assert.equal(result.content, [
    '@use "../styles/variables" as v;',
    "@forward '../styles/forward';",
    '@import "../styles/variables", "../styles/forward";',
  ].join('\n'));
  assert.equal(result.replacementsCount, 4);
});

test('rewrites quoted and unquoted url() paths while retaining query and fragment', () => {
  const content = [
    '.Icon { background: url("~assets/img/icon.svg?v=1#part"); }',
    '.Other { mask-image: url(~assets/img/icon.svg); }',
  ].join('\n');
  const result = transform(content);

  assert.equal(result.content, [
    '.Icon { background: url("../assets/img/icon.svg?v=1#part"); }',
    '.Other { mask-image: url(../assets/img/icon.svg); }',
  ].join('\n'));
  assert.equal(result.replacementsCount, 2);
});

test('leaves comments and ordinary string values unchanged', () => {
  const content = [
    '// @use "~styles/variables";',
    '/* background: url("~assets/img/icon.svg"); */',
    '.Title { content: "~styles/variables"; }',
    '.Other { content: "url(~assets/img/icon.svg)"; }',
    '@use "styles/variables";',
  ].join('\n');

  assert.deepEqual(transform(content), {
    content,
    replacementsCount: 0,
  });
});

test('recognizes Sass index files and is idempotent', () => {
  const result = transform('@use "~styles";');
  assert.equal(result.content, '@use "../styles";');
  assert.deepEqual(transform(result.content), {
    content: result.content,
    replacementsCount: 0,
  });
});

test('rejects aliases that are missing, dynamic, or outside output directory', () => {
  assert.throws(() => transform('@use "~styles/missing";'), /Alias target not found/);
  assert.throws(() => transform('@use "~styles/#{name}";'), /Dynamic alias paths/);
  assert.throws(() => transform('@use "~styles\/..\/..\/private";'), /Invalid alias path/);
});

test('reports syntax issues in strings and URLs', () => {
  assert.throws(() => transform('@use "~styles/variables'), /Unterminated string/);
  assert.throws(() => transform('.A { background: url(~assets/img/icon.svg; }'), /Unterminated url/);
});

test('dry-run does not write files; regular run updates SCSS files', () => {
  const content = '@use "~styles/variables";';
  fs.writeFileSync(filePath, content);

  const dryRun = spawnSync(process.execPath, [
    path.join(scriptsDirectory, 'scssAlias.js'),
    '--dry-run',
    outputDirectory,
  ], { encoding: 'utf8' });

  assert.equal(dryRun.status, 0);
  assert.match(dryRun.stdout, /Dry run: 4 SCSS files scanned/);
  assert.match(dryRun.stdout, /files to update: 1/);
  assert.equal(fs.readFileSync(filePath, 'utf8'), content);

  const run = spawnSync(process.execPath, [
    path.join(scriptsDirectory, 'scssAlias.js'),
    outputDirectory,
  ], { encoding: 'utf8' });

  assert.equal(run.status, 0);
  assert.equal(fs.readFileSync(filePath, 'utf8'), '@use "../styles/variables";');
});

test('does not partially rewrite output when an alias is invalid', () => {
  const validContent = '@use "~styles/variables";';
  fs.writeFileSync(filePath, validContent);
  createFile('components/Other.scss', '@use "~styles/does-not-exist";');

  const run = spawnSync(process.execPath, [
    path.join(scriptsDirectory, 'scssAlias.js'),
    outputDirectory,
  ], { encoding: 'utf8' });

  assert.equal(run.status, 1);
  assert.equal(fs.readFileSync(filePath, 'utf8'), validContent);
});
