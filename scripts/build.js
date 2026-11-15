import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import { replaceTscAliasPaths } from 'tsc-alias';

import { copyRuntimeFiles } from './copyRuntimeFiles.js';
import { copyLottieWasm } from './copyLottieWasm.js';
import { run as rewriteScssAliases } from './scssAlias.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(import.meta.url);

try {
  rmSync(new URL('../lib/', import.meta.url), { recursive: true, force: true });

  execFileSync(process.execPath, [
    require.resolve('typescript/bin/tsc'),
    '--project',
    'tsconfig.build.json',
  ], {
    cwd: root,
    stdio: 'inherit',
  });

  copyRuntimeFiles();
  copyLottieWasm();

  await replaceTscAliasPaths({
    configFile: fileURLToPath(new URL('../tsconfig.build.json', import.meta.url)),
    resolveFullPaths: true,
    resolveFullExtension: '.js',
  });

  rewriteScssAliases([fileURLToPath(new URL('../lib/src/', import.meta.url))]);
} catch (error) {
  console.error(error);

  process.exitCode = 1;
}
