import assert from 'node:assert/strict';
import path from 'node:path';

import ts from 'typescript';

const directoryRoots = new Set([
  'components',
  'controllers',
  'hooks',
  'pages',
  'store',
]);

const entryExports = {
  'components/App': [
    'App',
    'AppModeContext',
    'useAppMode',
  ],
  'controllers/visualEffects/utils': ['copyVisualData', 'createBuiltinRegistration'],
  'hooks/control': ['useGoToPage'],
  'hooks/effects/background': [
    'useBackground',
    'BackgroundEffect',
    'BackgroundEffectKind',
    'BackgroundEffectMediaOptions',
    'BackgroundEffectVideoOptions',
    'BackgroundEffectShadowOptions',
  ],
  'hooks/effects/frame': [
    'useFrameEffect',
    'useFrameEffects',
    'FrameSide',
    'FrameLayer',
    'FrameMask',
    'FramePosition',
    'FrameAnimationPreset',
    'FrameAnimation',
    'FrameElementLayout',
    'FrameShadowItem',
    'FrameTextItem',
    'FrameEffect',
  ],
};

export const getModuleEntries = (files) => {
  const modules = new Map();

  for (const filenameCur of files) {
    if (!filenameCur.startsWith('lib/src/') || !filenameCur.endsWith('.js')) {
      continue;
    }

    const modulePath = filenameCur.slice('lib/src/'.length, -3);
    const [moduleRoot] = modulePath.split('/');

    if (directoryRoots.has(moduleRoot)) {
      if (modulePath.endsWith('/index')) {
        modules.set(modulePath.slice(0, -'/index'.length), modulePath);
      }

      continue;
    }

    modules.set(modulePath, modulePath);
  }

  // The public audio volume contract lives with the audio utilities.
  modules.set('audioVolume', 'utils/effects/audio/audioVolume');

  return modules;
};

export const assertEntryExports = (root) => {
  const declarations = Object.keys(entryExports).map((entryCur) => {
    return path.join(root, 'lib/src', entryCur, 'index.d.ts');
  });
  const program = ts.createProgram(declarations, {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();

  for (const [entryCur, expectedNames] of Object.entries(entryExports)) {
    const filename = path.join(root, 'lib/src', entryCur, 'index.d.ts');
    const source = program.getSourceFile(filename);
    assert(source, entryCur);
    const module = checker.getSymbolAtLocation(source);
    assert(module, entryCur);
    const names = new Set(checker.getExportsOfModule(module).map((symbolCur) => symbolCur.name));

    for (const nameCur of expectedNames) {
      assert(names.has(nameCur), `${entryCur} must export ${nameCur}`);
    }
  }
};
