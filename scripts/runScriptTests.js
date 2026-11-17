import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const scriptTests = [
  'eslint/eslint.test.js',
  'jest/file-transform.test.js',
  'infrastructure/testLayout.test.js',
  'packaging/package.test.js',
];

export const runScriptTests = () => {
  const testsDirectory = new URL('../tests/', import.meta.url);

  const testFiles = scriptTests.map((filenameCur) => {
    return fileURLToPath(new URL(filenameCur, testsDirectory));
  });

  const args = [
    '--test',
    ...testFiles,
  ];

  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });

  if (result.error) {
    console.error(result.error);

    process.exitCode = 1;
  } else if (result.signal) {
    console.error(`Script tests terminated by signal ${result.signal}`);

    process.exitCode = 1;
  } else {
    process.exitCode = result.status ?? 1;
  }
};

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectExecution) {
  runScriptTests();
}
