import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);

export const copyLottieWasm = () => {
  const entry = require.resolve('@lottiefiles/dotlottie-web');
  const source = path.join(path.dirname(entry), 'dotlottie-player.wasm');
  const directory = new URL('../lib/src/vendors/', import.meta.url);

  mkdirSync(directory, { recursive: true });
  copyFileSync(source, new URL('dotlottie-player.wasm', directory));
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  copyLottieWasm();
}
