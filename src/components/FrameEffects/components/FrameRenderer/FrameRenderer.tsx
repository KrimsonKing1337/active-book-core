import type { CSSProperties } from 'react';

import type { JsonObject, VisualRendererProps } from '@active-book/types';

import { useVisualEffects } from '@controllers/visualEffects/context';

import type { FrameEffect } from '@hooks/effects/frame/@types';

import { FrameElement } from '../FrameElement';
import { FrameShadow, Police, Caramelldansen } from '../FrameShadow';
import { FrameText } from '../FrameText';

import * as styles from '../../FrameEffects.module.scss';

type FrameParams = JsonObject & Omit<FrameEffect, 'id' | 'Component'>;

export const FrameRenderer = ({ id, params }: VisualRendererProps) => {
  const session = useVisualEffects();

  const options = params as FrameParams;

  const component = session.getRuntimeComponent(id);

  const effectCur = {
    ...options,
    id,
    Component: component,
  };

  const {
    kind,
    shadow,
    text,
    Component,
    style,
  } = effectCur;

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
  const componentContent = kind === 'component' ? Component : null;

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
