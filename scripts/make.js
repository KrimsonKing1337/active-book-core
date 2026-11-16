import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scripts = ['build', 'packaging'];

const cwd = fileURLToPath(new URL('../', import.meta.url));

const options = {
  cwd,
  stdio: 'inherit',
};

try {
  for (const scriptCur of scripts) {
    const args = [
      process.env.npm_execpath,
      'run',
      scriptCur,
    ];

    execFileSync(process.execPath, args, options);
  }
} catch (error) {
  console.error(error);

  process.exitCode = 1;
}
