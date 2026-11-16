import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

export const copyLottieWasm = () => {
  const filename = 'dotlottie-player.wasm';
  const entry = require.resolve('@lottiefiles/dotlottie-web');
  const source = path.join(path.dirname(entry), filename);
  const directory = new URL('../lib/src/vendors/', import.meta.url);
  const target = new URL(filename, directory);

  mkdirSync(directory, { recursive: true });
  copyFileSync(source, target);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  copyLottieWasm();
}
