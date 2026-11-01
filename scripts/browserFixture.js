import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import { createServer } from 'vite';
import svgr from 'vite-plugin-svgr';

export const openBrowserFixture = async (context) => {
  const root = fileURLToPath(new URL('../', import.meta.url));
  const sourcePath = (name) => fileURLToPath(new URL(`../src/${name}`, import.meta.url));
  const aliases = ['assets', 'components', 'pages', 'hooks', 'utils', 'store', 'styles'];
  const alias = Object.fromEntries(aliases.map((name) => [`@${name}`, sourcePath(name)]));
  alias['@types'] = sourcePath('@types.ts');
  alias['~styles'] = sourcePath('styles');
  alias['~assets'] = sourcePath('assets');

  const server = await createServer({
    configFile: false,
    root,
    plugins: [svgr({ include: '**/*.svg' })],
    resolve: { alias },
    define: { 'process.env.mode': JSON.stringify('development') },
    optimizeDeps: { include: ['react', 'react-dom/client', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-router-dom'] },
    server: { host: '127.0.0.1', port: 0 },
  });
  context.after(() => server.close());
  await server.listen();
  const address = server.httpServer.address();
  assert(address && typeof address === 'object');

  const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH });
  context.after(() => browser.close());
  return { browser, origin: `http://127.0.0.1:${address.port}` };
};

export const readGeometry = async (page) => JSON.parse(await page.getByTestId('geometry').textContent());
export const surface = (page, id = 'probe') => page.locator(`[data-visual-content="${id}"]`);
export const visibility = (page, id = 'probe') => page.locator(`[data-visual-surface="${id}"]`);

export const setSurfaces = async (page, items) => {
  await page.evaluate((items) => window.setVisualTestSurfaces(items), items);
  await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))));
};

export const pixels = async (page) => {
  const screenshot = PNG.sync.read(await page.screenshot());
  return (x, y) => {
    const offset = (Math.floor(y) * screenshot.width + Math.floor(x)) * 4;
    return [...screenshot.data.subarray(offset, offset + 3)];
  };
};

export const near = (actual, expected, label) => {
  assert(Math.abs(actual - expected) < 1, `${label}: ${actual} != ${expected}`);
};
