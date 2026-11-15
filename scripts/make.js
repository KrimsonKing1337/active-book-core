import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

try {
  for (const script of ['build', 'packaging']) {
    execFileSync(process.execPath, [
      process.env.npm_execpath,
      'run',
      script,
    ], {
      cwd: fileURLToPath(new URL('../', import.meta.url)),
      stdio: 'inherit',
    });
  }
} catch (error) {
  console.error(error);

  process.exitCode = 1;
}
