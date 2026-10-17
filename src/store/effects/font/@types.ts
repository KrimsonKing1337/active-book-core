import type { UseFontOptions } from 'hooks/effects/useFont';

export interface State {
  color: UseFontOptions['color'];
  style: Exclude<UseFontOptions, 'color'>;
}
