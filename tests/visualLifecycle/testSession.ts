import type {
  VisualEffectController,
  VisualEffectDefinition,
  VisualEffectRegistration,
  VisualPlayback,
} from '@active-book/types';

import { createVisualEffects } from '../../src/controllers/visualEffects';

import { CounterRenderer } from './CounterRenderer';
import { StaticRenderer } from './StaticRenderer';
import { metrics } from './metrics';

const definitions: VisualEffectDefinition[] = [
  { id: 'counter', defaultParams: { step: 1, label: 'default label' }, Renderer: CounterRenderer },
  { id: 'static', defaultParams: { label: 'static default' }, Renderer: StaticRenderer },
];

export const visualEffects = createVisualEffects({ definitions, pages: 5 });

export const registration: VisualEffectRegistration = {
  effect: {
    id: 'range-a',
    definitionId: 'counter',
    params: {},
    placement: {
      coordinates: 'narrativeFrame',
      anchor: { region: 'narrativeFrame', point: 'top-left' },
      origin: 'top-left',
      offset: { x: { value: 0, unit: 'px' }, y: { value: 0, unit: 'px' } },
      size: { width: { value: 100, unit: '%' }, height: { value: 100, unit: '%' } },
    },
    visibility: { region: 'narrativeFrame' },
    depth: { plane: 'aboveNarrative', order: 0 },
  },
  lifetime: { type: 'range', range: [{ from: 1, to: 3 }, { from: 5, to: 5 }] },
};

visualEffects.register(registration);
visualEffects.register({ ...registration, effect: { ...registration.effect, id: 'range-b' } });
visualEffects.register({
  effect: { ...registration.effect, id: 'page', params: { step: 2 } },
  lifetime: { type: 'page', page: 1 },
});
visualEffects.register({
  effect: { ...registration.effect, id: 'static', definitionId: 'static' },
  lifetime: { type: 'range', range: [{ from: 1, to: 5 }] },
});

export const testApi = {
  effects: visualEffects,
  metrics,
  registration,
  ready: false,
  goToPage: (page: number) => {
    void page;
  },
  setBookVisible: (visible: boolean) => {
    void visible;
  },
  heldController: undefined as VisualEffectController | undefined,
  heldPlayback: undefined as VisualPlayback | undefined,
};

window.visualLifecycle = testApi;

declare global {
  interface Window {
    visualLifecycle: typeof testApi;
  }
}
