import { fileURLToPath } from 'node:url';

import { createServer } from 'vite';
import svgr from 'vite-plugin-svgr';

const root = fileURLToPath(new URL('../', import.meta.url));
const sourcePath = (name) => fileURLToPath(new URL(`../src/${name}`, import.meta.url));

const names = [
  'assets',
  'components',
  'controllers',
  'pages',
  'hooks',
  'utils',
  'store',
  'styles',
];

const alias = Object.fromEntries(names.map((nameCur) => {
  const aliasName = `@${nameCur}`;
  const aliasPath = sourcePath(nameCur);

  return [aliasName, aliasPath];
}));

alias['@@'] = sourcePath('');
alias['@types'] = sourcePath('@types.ts');
alias['~styles'] = sourcePath('styles');
alias['~assets'] = sourcePath('assets');

const server = await createServer({
  configFile: false,
  root,
  plugins: [svgr({ include: '**/*.svg' })],
  resolve: { alias },
  define: { 'process.env.mode': JSON.stringify('development') },
  server: { host: '0.0.0.0', port: 4175, open: '/tests/visualPlayground/' },
});

await server.listen();
server.printUrls();
