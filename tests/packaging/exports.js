import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { createServer, normalizePath } from 'vite';

const require = createRequire(import.meta.url);

const directoryAliases = [
  'components',
  'components/BackgroundEffects/components/BackgroundRenderer',
  'components/BookApplicationSurface',
  'components/Carousel',
  'components/FrameEffects/components/FrameRenderer',
  'components/FrameEffects/components/FrameShadow/presets',
  'components/ProxyHooks',
  'components/StoryDialog',
  'components/Video',
  'controllers/visualEffects',
  'hooks/effects',
  'hooks/effects/background',
  'pages/Page0',
  'store',
  'store/config',
  'store/main',
];

const typeResolvers = [
  {
    name: 'Bundler',
    options: {
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      module: ts.ModuleKind.ESNext,
    },
  },
  {
    name: 'NodeNext',
    options: {
      moduleResolution: ts.ModuleResolutionKind.NodeNext,
      module: ts.ModuleKind.NodeNext,
    },
  },
  {
    name: 'Node16',
    options: {
      moduleResolution: ts.ModuleResolutionKind.Node16,
      module: ts.ModuleKind.Node16,
    },
  },
];

export const assertModuleExports = async ({ root, files }) => {
  const modules = new Map();

  for (const aliasCur of directoryAliases) {
    modules.set(aliasCur, `${aliasCur}/index`);
  }

  for (const filenameCur of files) {
    if (filenameCur.startsWith('lib/src/') && filenameCur.endsWith('.js')) {
      const modulePath = filenameCur.slice('lib/src/'.length, -3);

      modules.set(modulePath, modulePath);
    }
  }

  const importer = path.join(root, 'tests/packaging/consumer.mts');
  const server = await createServer({
    configFile: false,
    root,
    optimizeDeps: { noDiscovery: true },
    server: { middlewareMode: true },
  });

  try {
    for (const [specifierCur, modulePath] of modules) {
      const specifier = `@active-book/core/${specifierCur}`;
      const javascript = `lib/src/${modulePath}.js`;
      const declarations = `lib/src/${modulePath}.d.ts`;
      const expectedJavascript = path.join(root, javascript);
      const expectedDeclarations = normalizePath(path.join(root, declarations));

      assert(files.has(javascript), javascript);
      assert(files.has(declarations), declarations);
      assert.equal(fileURLToPath(import.meta.resolve(specifier)), expectedJavascript, specifier);
      assert.equal(require.resolve(specifier), expectedJavascript, specifier);

      const resolved = await server.environments.client.pluginContainer.resolveId(specifier, importer);

      assert.equal(resolved?.id, normalizePath(expectedJavascript), specifier);

      for (const resolverCur of typeResolvers) {
        const resolution = ts.resolveModuleName(specifier, importer, resolverCur.options,
          ts.sys, undefined, undefined, ts.ModuleKind.ESNext);

        assert.equal(resolution.resolvedModule?.resolvedFileName, expectedDeclarations,
          `${specifier} (${resolverCur.name})`);
      }
    }
  } finally {
    await server.close();
  }
};
