import type { VisualEffectRegistration, VisualRegion } from '@active-book/types';

import type { HostVisualEffectDefinition } from '@controllers/visualEffects';

import { fillRegion } from '@controllers/visualEffects/utils/declarations';

import type { Settings } from './@types';

import { Darkness } from './Darkness';
import { Smoke } from './Smoke';
import { FrameDemo } from './FrameDemo';
import { Through } from './Through';
import { Collapse } from './Collapse';
import { SingleScene } from './SingleScene';
import { FeedbackProbe } from './FeedbackProbe';
import { ViewportTelemetry } from './ViewportTelemetry';

export const definitionsFor = (settings: Settings): HostVisualEffectDefinition[] => {
  const effectHost = settings.region === 'application' ? 'aboveStory' : 'story';

  return [
    {
      id: 'lab.telemetry', defaultParams: {}, Renderer: ViewportTelemetry, systemFeedback: true,
    },
    {
      id: 'lab.feedback', defaultParams: {}, Renderer: FeedbackProbe, systemFeedback: true,
    },
    {
      id: 'lab.frame', defaultParams: {}, Renderer: FrameDemo, surfaceLayout: settings.layout,
    },
    {
      id: 'lab.dark', defaultParams: {}, Renderer: Darkness, surfaceHost: effectHost,
    },
    {
      id: 'lab.edges', defaultParams: {}, Renderer: Darkness, surfaceHost: 'underStory',
    },
    {
      id: 'lab.smoke', defaultParams: {}, Renderer: Smoke, surfaceHost: effectHost,
    },
    {
      id: 'lab.through', defaultParams: {}, Renderer: Through, surfaceHost: effectHost,
    },
    {
      id: 'lab.curtain', defaultParams: {}, Renderer: Darkness, surfaceHost: 'aboveStory',
    },
    {
      id: 'lab.collapse', defaultParams: {}, Renderer: Collapse, surfaceHost: 'aboveStory',
    },
    {
      id: 'lab.single', defaultParams: {}, Renderer: SingleScene, surfaceHost: 'aboveStory',
    },
  ];
};

export const registrationsFor = (settings: Settings): VisualEffectRegistration[] => {
  const make = (id: string, definitionId: string, region: Exclude<VisualRegion, 'frame'>): VisualEffectRegistration => {
    const params = {
      duration: settings.duration,
      intensity: settings.intensity,
      opacity: settings.opacity,
      speed: settings.speed,
      color: settings.color,
      direction: settings.direction,
      originX: settings.originX,
      originY: settings.originY,
      frameAnchor: settings.frameAnchor,
      offsetX: settings.offsetX,
      physicalMode: settings.physicalMode,
    };
    const effect: VisualEffectRegistration['effect'] = {
      id,
      definitionId,
      params,
      placement: fillRegion(region),
      visibility: { region },
      depth: { plane: 'aboveControls', order: 0 },
    };

    return {
      effect,
      lifetime: { type: 'range', range: [{ from: 1, to: 2 }, { from: 4, to: 4 }] },
    };
  };

  if (settings.demo === 'frame') {
    const frame = make('frame', 'lab.frame', settings.region);
    frame.effect.depth.plane = settings.plane;

    if (settings.mask) {
      frame.effect.visibility = { region: 'frame', sides: ['top', 'right', 'bottom', 'left'] };
    }

    if (settings.customPlacement) {
      frame.effect.placement = {
        ...fillRegion('narrativeContent'),
        anchor: { region: 'narrativeContent', point: 'top-left' },
        offset: { x: { value: 20, unit: 'px' }, y: { value: 50, unit: 'px' } },
        size: { width: { value: 80, unit: '%' }, height: { value: 300, unit: 'px' } },
      };
      frame.effect.visibility = { region: 'storyViewport' };

      if (settings.independentAnchor) {
        frame.effect.placement.anchor = { region: 'storyViewport', point: 'center' };
        frame.effect.placement.origin = 'center';
      }
    }

    return [frame];
  }

  if (settings.demo === 'darkness') {
    return [make('darkness', 'lab.dark', settings.region)];
  }

  if (settings.demo === 'edges') {
    const edge = make('edges', 'lab.edges', 'application');
    edge.effect.params = {
      ...edge.effect.params, edges: true, intensity: 1,
    };

    return [edge];
  }

  if (settings.demo === 'smoke') {
    const smoke = make('smoke', 'lab.smoke', settings.region);
    smoke.effect.placement = fillRegion('narrativeFrame');

    return [smoke];
  }

  if (settings.demo === 'through') {
    if (settings.composition === 'single') {
      return [make('through', 'lab.through', settings.region)];
    }

    return [
      make('through-narrative', 'lab.through', 'narrativeFrame'),
      make('through-viewport', 'lab.through', 'storyViewport'),
      make('through-application', 'lab.through', settings.region),
    ];
  }

  if (settings.demo === 'single') {
    return [make('single', 'lab.single', 'application'), make('telemetry', 'lab.telemetry', 'application')];
  }

  const curtain = make('curtain', 'lab.curtain', 'application');
  curtain.effect.params = {
    ...curtain.effect.params, direction: 'grow', intensity: 1,
  };
  const collapse = make('collapse', 'lab.collapse', 'storyViewport');
  const reveal = make('reveal', 'lab.curtain', 'application');
  reveal.effect.params = {
    ...reveal.effect.params, direction: 'reveal', intensity: 1,
  };
  reveal.effect.depth.order = 1;

  if (settings.demo === 'collapse') {
    return [curtain, collapse, reveal, make('telemetry', 'lab.telemetry', 'application')];
  }

  const narrative = make('narrative-dark', 'lab.dark', 'narrativeFrame');
  narrative.effect.params = {
    ...narrative.effect.params, direction: 'grow', intensity: 1,
  };

  return [narrative, curtain, collapse, reveal, make('telemetry', 'lab.telemetry', 'application')];
};
