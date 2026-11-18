import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';
import { createServer, normalizePath } from 'vite';

import { assertEntryExports, getModuleEntries } from './entrypoints.js';

const require = createRequire(import.meta.url);

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
  const modules = getModuleEntries(files);
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

  assertEntryExports(root);

  const internalFiles = [
    'components/App/AppModeContext',
    'controllers/visualEffects/utils/serialization',
    'controllers/visualEffects/utils/declarations',
    'hooks/control/useGoToPage',
    'hooks/effects/background/@types',
    'hooks/effects/frame/@types',
    'components/Video/index',
    'store/main/slice',
  ];

  for (const filenameCur of internalFiles) {
    const specifier = `@active-book/core/${filenameCur}`;

    assert.throws(() => require.resolve(specifier), { code: 'MODULE_NOT_FOUND' });
    await assert.rejects(import(specifier), { code: 'ERR_MODULE_NOT_FOUND' });

    for (const resolverCur of typeResolvers) {
      const resolution = ts.resolveModuleName(specifier, importer, resolverCur.options,
        ts.sys, undefined, undefined, ts.ModuleKind.ESNext);

      assert.equal(resolution.resolvedModule, undefined, `${specifier} (${resolverCur.name})`);
    }
  }
};
