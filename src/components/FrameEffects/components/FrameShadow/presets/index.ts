import type { FrameAnimationPreset } from '@hooks/effects/frame/@types';

export * from './Police';
export * from './Caramelldansen';

export type FrameShadowPreset = {
  value: Exclude<FrameAnimationPreset, 'scroll'>;
  label: string;
  canChangeColor?: boolean;
};

export const FRAME_SHADOW_PRESETS = [
  { value: 'none', label: 'Без анимации', canChangeColor: true },
  { value: 'pulse', label: 'Пульсация', canChangeColor: true },
  { value: 'police', label: 'Полиция' },
  { value: 'caramel', label: 'Caramelldansen' },
] as const satisfies readonly FrameShadowPreset[];
