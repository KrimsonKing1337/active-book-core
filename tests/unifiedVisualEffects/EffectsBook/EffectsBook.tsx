import { useRef, useState } from 'react';

import type { VisualEffectDefinition, VisualEffectRegistration } from '@active-book/types';

import { createBuiltinRegistration } from '../../../src/controllers/visualEffects/utils/declarations';
import { BackgroundRenderer } from '../../../src/components/BackgroundEffects/components/BackgroundRenderer';
import { FrameRenderer } from '../../../src/components/FrameEffects/components/FrameRenderer';
import { AppModeContext } from '../../../src/components/App/AppModeContext';
import { AppWrapper } from '../../../src/components/AppWrapper';
import { useStoryGeometry } from '../../../src/components/StoryRoot';

import { EffectControls } from '../EffectControls';
import { EffectsPage } from '../EffectsPage';
import { metrics, VisualCounter } from '../VisualCounter';

const query = new URLSearchParams(location.search);
const compatibility = query.has('compat');
const ranges = [{
  from: 1,
  to: 2,
}, {
  from: 4,
  to: 4,
}];
const declarations = compatibility ? [] : [
  {
    id: 'range-background',
    type: 'background',
    range: ranges,
    options: {
      kind: 'component' as const,
    },
  },
  {
    id: 'range-image',
    type: 'background',
    range: ranges,
    options: {
      kind: 'image' as const,
      image: {
        id: 'range-picture',
        src: '/tests/unifiedVisualEffects/range-pattern.svg',
      },
    },
  },
  {
    id: 'range-video',
    type: 'background',
    range: ranges,
    options: {
      kind: 'video' as const,
      video: {
        id: 'range-movie',
        src: '/tests/unifiedVisualEffects/movie.webm',
        autoPlay: true,
      },
    },
  },
  {
    id: 'range-frame',
    type: 'frame',
    range: ranges,
    options: {
      kind: 'component' as const,
    },
  },
  ...(['pulse', 'police', 'caramel'] as const).map((preset) => ({
    id: `range-${preset}`,
    type: 'frame' as const,
    range: ranges,
    options: {
      kind: 'shadow' as const,
      shadow: {
        id: preset,
        sides: ['left', 'right'] as ('left' | 'right')[],
        thickness: 60,
        animation: {
          preset,
          duration: 2000,
        },
      },
    },
  })),
];

const definitions: VisualEffectDefinition[] = [
  {
    id: 'custom.background',
    defaultParams: {},
    Renderer: (props) => (
      <BackgroundRenderer {...props}>
        <VisualCounter label="range-background-state" />
      </BackgroundRenderer>
    ),
  },
  {
    id: 'custom.frame',
    defaultParams: {},
    Renderer: (props) => (
      <FrameRenderer {...props}>
        <VisualCounter label="range-frame-state" />
      </FrameRenderer>
    ),
  },
];
const registrations: VisualEffectRegistration[] = declarations.map((cur) => {
  const registration = createBuiltinRegistration({
    type: cur.type as 'background' | 'frame',
    options: { ...cur.options, id: cur.id },
    lifetime: { type: 'range', range: cur.range },
  });
  if (cur.id === 'range-background') {
    registration.effect.definitionId = 'custom.background';
  }
  if (cur.id === 'range-frame') {
    registration.effect.definitionId = 'custom.frame';
  }

  return registration;
});

export const EffectsBook = () => {
  const bookRef = useRef<HTMLDivElement>(null);
  const geometry = useStoryGeometry(bookRef);
  const [pageCount, setPageCount] = useState(5);
  const [selectedVisualEffectId, setSelectedVisualEffectId] = useState<string | null>(null);
  window.realVisualMetrics = metrics;
  window.setRealPageCount = setPageCount;
  window.setSelectedRealVisualEffect = setSelectedVisualEffectId;
  const tools = (
    <>
      <EffectControls />
      <output data-testid="geometry" hidden>
        {JSON.stringify(geometry)}
      </output>
    </>
  );

  return (
    <AppModeContext value={query.get('mode') === 'editor' ? 'editor' : 'reader'}>
      <AppWrapper
        ref={bookRef}
        config={{
          id: 'real-visual-effects',
          pages: pageCount,
          defaultTheme: 'dark',
        }}
        storyPages={Array.from({ length: pageCount }, (_, index) => ({
          id: `page-${index + 1}`,
          content: <EffectsPage number={index + 1} />,
        }))}
        rangeEffects={[]}
        registrations={registrations}
        selectedVisualEffectId={selectedVisualEffectId}
        definitions={definitions}
        tableOfContents={[]}
        editorTools={tools}
      />
    </AppModeContext>
  );
};

declare global {
  interface Window {
    realVisualMetrics: typeof metrics;
    setRealPageCount: (count: number) => void;
    setSelectedRealVisualEffect: (id: string | null) => void;
  }
}
