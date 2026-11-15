import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const digest = (filename) => createHash('sha256').update(readFileSync(filename)).digest('hex');

const snapshot = (directory) => {
  const files = {};

  for (const relative of readdirSync(directory, { recursive: true }).sort()) {
    const filename = path.join(directory, relative);

    if (statSync(filename).isFile()) {
      files[relative] = digest(filename);
    }
  }

  return files;
};

test('production builds and archives are reproducible without changing source or version', async (context) => {
  const npmCli = process.env.npm_execpath;
  assert(npmCli, 'Run through npm run test:scripts');
  const temporary = mkdtempSync(path.join(tmpdir(), 'core-package-'));
  context.after(() => rmSync(temporary, { recursive: true, force: true }));

  const manifestPath = path.join(root, 'package.json');
  const manifest = readFileSync(manifestPath, 'utf8');
  const lock = digest(path.join(root, 'package-lock.json'));
  const sources = snapshot(path.join(root, 'src'));
  const options = {
    cwd: root,
    encoding: 'utf8',
    env: { ...process.env, npm_config_cache: path.join(temporary, 'cache') },
  };
  const npm = (args) => execFileSync(process.execPath, [npmCli, ...args], options);

  npm(['run', 'build']);
  const firstBuild = snapshot(path.join(root, 'lib'));
  const packArgs = [
    'pack',
    '--json',
    '--pack-destination',
    temporary,
  ];
  const [firstPack] = JSON.parse(npm(packArgs));
  const archivePath = path.join(temporary, firstPack.filename);
  const firstArchive = digest(archivePath);

  npm(['run', 'build']);
  assert.deepEqual(snapshot(path.join(root, 'lib')), firstBuild);
  const [secondPack] = JSON.parse(npm(packArgs));
  assert.equal(secondPack.filename, firstPack.filename);
  assert.equal(digest(archivePath), firstArchive);
  assert.equal(readFileSync(manifestPath, 'utf8'), manifest);
  assert.equal(digest(path.join(root, 'package-lock.json')), lock);
  assert.deepEqual(snapshot(path.join(root, 'src')), sources);

  const [dryRun] = JSON.parse(npm([
    'pack',
    '--json',
    '--dry-run',
  ]));
  const files = new Set(dryRun.files.map((fileCur) => fileCur.path));
  const packageJson = JSON.parse(manifest);
  assert.equal(packageJson.scripts.postinstall, undefined);
  assert.equal(packageJson.main, undefined);
  assert(packageJson.dependencies['@types/howler'], 'Published declarations require Howler types');

  for (const filename of files) {
    const isMetadata = [
      'package.json',
      'README.md',
      'LICENSE',
    ].includes(filename);
    assert(isMetadata || filename.startsWith('lib/src/'), filename);
    assert(!/(?:^|\/)(?:tests|__tests__|__mocks__|fixtures|artifacts)(?:\/|$)/.test(filename), filename);
    assert(!/\.(?:test|spec)\.|testFixtures|setup-tests|svg-mock/.test(filename), filename);
  }

  for (const target of Object.values(packageJson.exports)) {
    if (typeof target === 'string') {
      continue;
    }

    assert(files.has(target.types.slice(2)), target.types);
    assert(files.has(target.import.slice(2)), target.import);
  }

  const resources = [
    'styles/styles.scss',
    'assets/img/toolbar/i-arrow-right.svg',
    'assets/img/poster-default.png',
    'assets/fonts/Roboto/RobotoRegular/RobotoRegular.woff',
    'vendors/dotlottie-player.wasm',
  ];

  for (const resource of resources) {
    assert(files.has(`lib/src/${resource}`), resource);
    const resolved = fileURLToPath(import.meta.resolve(`@active-book/core/${resource}`));
    assert(statSync(resolved).size > 0, resource);
  }

  const { copyVisualData } = await import('@active-book/core/controllers/visualEffects/utils/serialization');
  const { createBuiltinRegistration } = await import('@active-book/core/controllers/visualEffects/utils/declarations');
  assert.deepEqual(copyVisualData({ installed: true }), { installed: true });
  assert.equal(typeof createBuiltinRegistration, 'function');
});
