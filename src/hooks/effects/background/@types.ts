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

export type BackgroundEffectKind =
  | 'background'
  | 'image'
  | 'video'
  | 'shadow'
  | 'component';

export type BackgroundEffect = {
  order?: number;
  id: string;
  kind: BackgroundEffectKind;
  style?: React.CSSProperties;
  image?: BackgroundEffectMediaOptions;
  video?: BackgroundEffectVideoOptions;
  shadow?: BackgroundEffectShadowOptions;
};
