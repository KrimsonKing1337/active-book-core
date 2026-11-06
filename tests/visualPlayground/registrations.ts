import type { VisualEffectRegistration, VisualRegion } from '@active-book/types';

import type { HostVisualEffectDefinition } from '@controllers/visualEffects';

import { fillRegion } from '@controllers/visualEffects/utils/declarations';

import type { Settings } from './@types';

import { ToolbarDemo } from './ToolbarDemo';

import { AdvancingDarkness } from './AdvancingDarkness';

import { ContinuousBall } from './ContinuousBall';

import { Darkness } from './Darkness';
import { Smoke } from './Smoke';
import { FrameDemo } from './FrameDemo';
import { Through } from './Through';
import { Collapse } from './Collapse';
import { SingleScene } from './SingleScene';
import { FeedbackProbe } from './FeedbackProbe';
import { ViewportTelemetry } from './ViewportTelemetry';

const createRegistration = (
  settings: Settings,
  id: string,
  definitionId: string,
  region: VisualRegion,
): VisualEffectRegistration => {
  const params = {
    duration: settings.duration,
    intensity: settings.intensity,
    opacity: settings.opacity,
    speed: settings.speed,
    color: settings.color,
    direction: settings.direction,
    composition: settings.composition,
    originX: settings.originX,
    originY: settings.originY,
    frameAnchor: settings.frameAnchor,
    framePreset: settings.framePreset,
    offsetX: settings.offsetX,
  };
  const effect: VisualEffectRegistration['effect'] = {
    id,
    definitionId,
    params,
    placement: fillRegion(region),
    visibility: ['storyViewportFrame', 'toolbarFrame'].includes(region)
      ? { sides: ['top', 'right', 'bottom', 'left'] } : {},
    depth: {
      plane: ['lab.edges', 'lab.under-curtain', 'lab.single'].includes(definitionId)
        ? 'background' : 'aboveStoryControls',
      order: 0,
    },
  };

  return {
    effect,
    lifetime: { type: 'range', range: [{ from: 1, to: 2 }, { from: 4, to: 4 }] },
  };
};

export const definitionsFor = (): HostVisualEffectDefinition[] => {
  const definitions: HostVisualEffectDefinition[] = [
    {
      id: 'lab.toolbar', defaultParams: {}, Renderer: ToolbarDemo,
    },
    {
      id: 'lab.ball', defaultParams: {}, Renderer: ContinuousBall,
    },
    {
      id: 'lab.advancing', defaultParams: {}, Renderer: AdvancingDarkness,
    },
    {
      id: 'lab.under-curtain', defaultParams: {}, Renderer: Darkness,
    },
    {
      id: 'lab.telemetry', defaultParams: {}, Renderer: ViewportTelemetry, systemFeedback: true,
    },
    {
      id: 'lab.feedback', defaultParams: {}, Renderer: FeedbackProbe, systemFeedback: true,
    },
    {
      id: 'lab.frame', defaultParams: {}, Renderer: FrameDemo,
    },
    {
      id: 'lab.dark', defaultParams: {}, Renderer: Darkness,
    },
    {
      id: 'lab.edges', defaultParams: {}, Renderer: Darkness,
    },
    {
      id: 'lab.smoke', defaultParams: {}, Renderer: Smoke,
    },
    {
      id: 'lab.through', defaultParams: {}, Renderer: Through,
    },
    {
      id: 'lab.curtain', defaultParams: {}, Renderer: Darkness,
    },
    {
      id: 'lab.collapse', defaultParams: {}, Renderer: Collapse,
    },
    {
      id: 'lab.single', defaultParams: {}, Renderer: SingleScene,
    },
  ];

  return definitions;
};

const createFrameRegistration = (settings: Settings): VisualEffectRegistration => {
  const frame = createRegistration(settings, 'frame', 'lab.frame', settings.region);
  frame.effect.depth.plane = settings.plane;

  frame.effect.visibility = settings.mask ? {
    sides: ['top', 'right', 'bottom', 'left'], frameWidth: { value: 45, unit: 'px' },
  } : {};

  return frame;
};

const createSceneRegistrations = (settings: Settings): VisualEffectRegistration[] => {
  const curtain = createRegistration(settings, 'curtain', 'lab.under-curtain', 'application');
  curtain.effect.params = {
    ...curtain.effect.params, direction: 'grow', intensity: 1,
  };
  const collapse = createRegistration(settings, 'collapse', 'lab.collapse', 'storyViewport');
  const reveal = createRegistration(settings, 'reveal', 'lab.curtain', 'application');
  reveal.effect.params = {
    ...reveal.effect.params, direction: 'reveal', intensity: 1,
  };
  reveal.effect.depth.order = 1;

  if (settings.demo === 'collapse') {
    return [
      curtain, collapse, reveal,
      createRegistration(settings, 'telemetry', 'lab.telemetry', 'application'),
    ];
  }

  const narrative = createRegistration(settings, 'narrative-dark', 'lab.dark', 'narrativeFrame');
  narrative.effect.params = {
    ...narrative.effect.params, direction: 'grow', intensity: 1,
  };

  return [
    narrative, curtain, collapse, reveal,
    createRegistration(settings, 'telemetry', 'lab.telemetry', 'application'),
  ];
};

export const registrationsFor = (settings: Settings): VisualEffectRegistration[] => {
  if (settings.demo === 'toolbar') {
    const frame = createRegistration(settings, 'toolbar-frame', 'lab.toolbar', 'toolbarFrame');
    const content = createRegistration(settings, 'toolbar-content', 'lab.toolbar', 'toolbar');
    frame.effect.depth.plane = 'aboveNarrative';
    content.effect.depth.plane = settings.plane;
    content.effect.visibility = {};

    return [frame, content];
  }

  if (settings.demo === 'advancing') {
    return [createRegistration(settings, 'advancing', 'lab.advancing', 'application')];
  }

  if (settings.demo === 'ball') {
    const rangeBall = createRegistration(settings, 'range-ball', 'lab.ball', 'narrativeFrame');
    const pageBall = createRegistration(settings, 'page-ball', 'lab.ball', 'narrativeFrame');
    pageBall.lifetime = { type: 'page', page: 1 };

    return [rangeBall, pageBall];
  }

  if (settings.demo === 'frame') {
    return [createFrameRegistration(settings)];
  }

  if (settings.demo === 'darkness') {
    return [createRegistration(settings, 'darkness', 'lab.dark', settings.region)];
  }

  if (settings.demo === 'edges') {
    const edge = createRegistration(settings, 'edges', 'lab.edges', 'application');
    edge.effect.params = {
      ...edge.effect.params, edges: true, intensity: 1,
    };

    return [edge];
  }

  if (settings.demo === 'smoke') {
    const smoke = createRegistration(settings, 'smoke', 'lab.smoke', settings.region);

    return [smoke];
  }

  if (settings.demo === 'through') {
    if (settings.composition === 'single') {
      return [createRegistration(settings, 'through', 'lab.through', settings.region)];
    }

    return [
      createRegistration(settings, 'through-narrative', 'lab.through', 'narrativeFrame'),
      createRegistration(settings, 'through-viewport', 'lab.through', 'storyViewport'),
      createRegistration(settings, 'through-application', 'lab.through', settings.region),
    ];
  }

  if (settings.demo === 'single') {
    return [
      createRegistration(settings, 'single', 'lab.single', 'application'),
      createRegistration(settings, 'telemetry', 'lab.telemetry', 'application'),
    ];
  }

  return createSceneRegistrations(settings);
};
