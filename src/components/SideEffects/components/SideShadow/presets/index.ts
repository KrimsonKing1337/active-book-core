export * from './Police';
export * from './Caramelldansen';

export const SIDE_SHADOW_PRESETS = [
  { value: 'none', label: 'Без анимации', canChangeColor: true },
  { value: 'pulse', label: 'Пульсация', canChangeColor: true },
  { value: 'police', label: 'Полиция', canChangeColor: false },
  { value: 'caramel', label: 'Caramelldansen', canChangeColor: false },
] as const;
