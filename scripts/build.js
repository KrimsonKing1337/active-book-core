import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { replaceTscAliasPaths } from 'tsc-alias';

import { copyRuntimeFiles } from './copyRuntimeFiles.js';
import { copyLottieWasm } from './copyLottieWasm.js';
import { run as rewriteScssAliases } from './scssAlias.js';

const moduleUrl = import.meta.url;
const require = createRequire(moduleUrl);

const root = fileURLToPath(new URL('../', moduleUrl));

const libDirectory = resolve(root, 'lib');
const libSrcDirectory = resolve(libDirectory, 'src');
const tsconfigBuild = resolve(root, 'tsconfig.build.json');

try {
  rmSync(libDirectory, {
    recursive: true,
    force: true,
  });

  const args = [
    require.resolve('typescript/bin/tsc'),
    '--project',
    'tsconfig.build.json',
  ];

  execFileSync(process.execPath, args, {
    cwd: root,
    stdio: 'inherit',
  });

  copyRuntimeFiles();
  copyLottieWasm();

  await replaceTscAliasPaths({
    configFile: tsconfigBuild,
    resolveFullPaths: true,
    resolveFullExtension: '.js',
  });

  rewriteScssAliases([libSrcDirectory]);
} catch (error) {
  console.error(error);

  process.exitCode = 1;
}
