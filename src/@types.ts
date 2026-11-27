import type { AudioCategory } from '@active-book/types';

import type { ItemProps as TableOfContentsItem } from '@components/TableOfContents/Item';

import type { HowlWrapper } from '@utils/effects/audio/HowlWrapper';

export type AppMode = 'reader' | 'editor';

export type Timer = ReturnType<typeof setTimeout> | null;
export type Interval = ReturnType<typeof setInterval> | null;

export type HowlInst = HowlWrapper | null;
export type HowlInstances = Record<string, HowlInst>;

export type AudioType = AudioCategory;
export type AudioLifecycle = 'auto' | 'manual';

export type AudioEffectOptions = {
  lifecycle?: AudioLifecycle;
  id: string;
  page: number;
  src: string;
  format?: string[];
  fadeOutWhenUnload?: boolean;
  type?: AudioType;
  loop?: boolean;
  stopBy?: number;
  delay?: number;
  relativeVolume?: number;
  screamer?: boolean;
  onPlay?: () => void;
  onUnload?: () => void;
  onPause?: () => void;
  onStop?: () => void;
};

export type VibrationEffectOptions = {
  id: string;
  page: number;
  duration: number;
  delay?: number;
  playOnLoad?: boolean;
};

export type FlashlightEffectOptions = {
  id: string;
  page: number;
  duration: number;
  delay?: number;
  playOnLoad?: boolean;
  withFrameShadow?: boolean;
  speed?: number;
};

export type ThemeOptions = {
  main: string;
  secondary: string;
  hover: string;
  bg: string;
  'text-shadow-for-hover': string;
  overflow: string;
};

export type Config = {
  id: string;
  authorComments?: number;
  easterEggs?: number;
  pages: number;
  defaultTheme: string;
  customThemes?: Record<string, ThemeOptions>;
  disableThemes?: boolean;
  bodyStyle?: React.CSSProperties;
};

export type TableOfContents = TableOfContentsItem[];
