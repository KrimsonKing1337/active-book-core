import type { PropsWithChildren } from 'react';

import type { JsonObject, VisualRendererProps } from '@active-book/types';

import type { FrameEffect } from '@hooks/effects/frame/@types';

import { FrameElement } from '../FrameElement';
import { FrameShadow } from '../FrameShadow';
import { Police, Caramelldansen } from '../FrameShadow/presets';
import { FrameText } from '../FrameText';

import * as styles from '../../FrameEffects.module.scss';

type FrameParams = JsonObject & Omit<FrameEffect, 'id'>;

export type FrameRendererProps = PropsWithChildren & VisualRendererProps;

export const FrameRenderer = ({
  id,
  params,
  children,
}: FrameRendererProps) => {
  const options = params as FrameParams;

  const {
    kind,
    shadow,
    text,
    style,
  } = options;

  const wrapperStyle = { ...style };
  delete wrapperStyle.zIndex;

  let ShadowComponent = FrameShadow;

  if (shadow?.animation?.preset === 'police') {
    ShadowComponent = Police;
  } else if (shadow?.animation?.preset === 'caramel') {
    ShadowComponent = Caramelldansen;
  }

  const showShadow = kind === 'shadow' && shadow;
  const showText = kind === 'text' && text;

  return (
    <div
      data-effect-id={id}
      style={wrapperStyle}
      className={styles.EffectWrapper}
    >
      {showShadow && (
        <FrameElement {...shadow}>
          <ShadowComponent options={shadow} />
        </FrameElement>
      )}

      {showText && (
        <FrameElement {...text}>
          <FrameText animation={text.animation} style={text.style}>
            <span>
              {text.leftText}
            </span>

            <span>
              {text.rightText}
            </span>
          </FrameText>
        </FrameElement>
      )}

      {kind === 'component' && (
        children
      )}
    </div>
  );
};
