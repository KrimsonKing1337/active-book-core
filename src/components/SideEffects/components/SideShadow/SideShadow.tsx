import { useSelector } from 'store';

import { sideShadowEffectSelectors } from 'store/effects/side/shadow';

import type { SideShadowItem } from 'hooks/effects/side/@types';

import { AnimatedSideShadow } from './AnimatedSideShadow';
import { Police, Caramelldansen } from './presets';

export const SideShadow = () => {
  const color = useSelector(sideShadowEffectSelectors.color);
  const speed = useSelector(sideShadowEffectSelectors.speed);

  let preset: NonNullable<SideShadowItem['animation']>['preset'] = 'pulse';

  if (color === 'police') {
    preset = 'police';
  } else if (color === 'caramel') {
    preset = 'caramel';
  }

  const options: SideShadowItem = {
    id: 'legacy-side-shadow',
    style: { color: preset === 'pulse' ? color : 'red' },
    animation: { preset, duration: speed },
  };

  if (preset === 'police') {
    return <Police options={options} />;
  }

  if (preset === 'caramel') {
    return <Caramelldansen options={options} />;
  }

  return <AnimatedSideShadow options={options} />;
};
