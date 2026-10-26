export type BackgroundEffectMediaPosition =
  'center'
  | 'left'
  | 'right'
  | 'top'
  | 'bottom'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type BackgroundEffectMediaOptions = {
  id: string;
  src: string;
  style?: React.CSSProperties;
};

export type BackgroundEffectVideoOptions = BackgroundEffectMediaOptions & {
  loop?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  relativeVolume?: number;
};

export type BackgroundEffectShadowOptions = {
  style?: React.CSSProperties;
  show?: boolean;
};

export type BackgroundEffectKind = 'background' | 'image' | 'video' | 'shadow' | 'component';

export type BackgroundEffect = {
  id: string;
  kind: BackgroundEffectKind;
  inRange?: boolean;
  style?: React.CSSProperties;
  image?: BackgroundEffectMediaOptions;
  video?: BackgroundEffectVideoOptions;
  Component?: React.ReactNode;
  shadow?: BackgroundEffectShadowOptions;
};
