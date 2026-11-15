import { cpSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const copyRuntimeFiles = () => {
  cpSync(new URL('../src/', import.meta.url), new URL('../lib/src/', import.meta.url), {
    recursive: true,
    filter: (source) => {
      const name = path.basename(source);

      if ([
        'tests',
        '__tests__',
        '__mocks__',
      ].includes(name)) {
        return false;
      }

      if (/\.[cm]?[jt]sx?$/.test(name) || name === 'dotlottie-player.wasm') {
        return false;
      }

      return true;
    },
  });
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  copyRuntimeFiles();
}
