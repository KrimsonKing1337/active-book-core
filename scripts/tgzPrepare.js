import { mkdirSync, statSync } from 'node:fs';

try {
  const entry = new URL('../lib/src/components/index.js', import.meta.url);

  if (!statSync(entry).isFile()) {
    throw new Error('Run npm run build before packaging');
  }

  mkdirSync(new URL('../tgz/', import.meta.url), { recursive: true });
} catch (error) {
  console.error('Cannot package core. Run npm run build first.', error);

  process.exitCode = 1;
}
