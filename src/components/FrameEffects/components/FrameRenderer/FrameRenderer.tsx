import type { CSSProperties } from 'react';

import type { ReactNode } from 'react';

import type { JsonObject, VisualRendererProps } from '@active-book/types';


import type { FrameEffect } from '@hooks/effects/frame/@types';

import { FrameElement } from '../FrameElement';
import { FrameShadow, Police, Caramelldansen } from '../FrameShadow';
import { FrameText } from '../FrameText';

import * as styles from '../../FrameEffects.module.scss';

type FrameParams = JsonObject & Omit<FrameEffect, 'id'>;

export const FrameRenderer = ({ id, params, children }: VisualRendererProps & { children?: ReactNode }) => {
  const options = params as FrameParams;

  const {
    kind,
    shadow,
    text,
    style,
  } = options;

  const zIndex = shadow?.style?.zIndex ?? text?.style?.zIndex;

  const styleSafe = style ?? {};

  const wrapperStyle: CSSProperties = kind === 'component' ? styleSafe : { zIndex };

  let ShadowComponent = FrameShadow;

  if (shadow?.animation?.preset === 'police') {
    ShadowComponent = Police;
  } else if (shadow?.animation?.preset === 'caramel') {
    ShadowComponent = Caramelldansen;
  }

  const showShadow = kind === 'shadow' && shadow;
  const showText = kind === 'text' && text;
  const componentContent = kind === 'component' ? children : null;

  return (
    <div
      id={`effect-${id}`}
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

      {componentContent}
    </div>
  );
};
