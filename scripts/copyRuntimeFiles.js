import { cpSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const scriptPath = fileURLToPath(import.meta.url);

const sourceDirectory = resolve(root, 'src');
const targetDirectory = resolve(root, 'lib/src');

const excludedDirectories = new Set([
  'tests',
  '__tests__',
  '__mocks__',
]);

const sourceFilePattern = /\.[cm]?[jt]sx?$/u;
const excludedRuntimeFile = 'dotlottie-player.wasm';

const shouldCopyFile = (source) => {
  const name = basename(source);

  if (excludedDirectories.has(name)) {
    return false;
  }

  if (sourceFilePattern.test(name)) {
    return false;
  }

  return name !== excludedRuntimeFile;
};

export const copyRuntimeFiles = () => {
  cpSync(sourceDirectory, targetDirectory, {
    recursive: true,
    filter: shouldCopyFile,
  });
};

const isDirectExecution = process.argv[1] && resolve(process.argv[1]) === scriptPath;

if (isDirectExecution) {
  copyRuntimeFiles();
}
