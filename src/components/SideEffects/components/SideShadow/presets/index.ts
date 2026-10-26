import type { SideAnimationPreset } from 'hooks/effects/side/@types';

export * from './Police';
export * from './Caramelldansen';

export type SideShadowPreset = {
  value: Exclude<SideAnimationPreset, 'scroll'>;
  label: string;
  canChangeColor?: boolean;
};

export const SIDE_SHADOW_PRESETS = [
  { value: 'none', label: 'Без анимации', canChangeColor: true },
  { value: 'pulse', label: 'Пульсация', canChangeColor: true },
  { value: 'police', label: 'Полиция' },
  { value: 'caramel', label: 'Caramelldansen' },
] as const satisfies readonly SideShadowPreset[];
