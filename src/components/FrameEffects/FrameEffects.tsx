import type { CSSProperties } from 'react';

import type { FrameEffect } from '@hooks/effects/frame/@types';

import { useSelector } from '@store';

import { frameEffectsSelectors } from '@store/effects/frame';

import { FrameElement } from './components/FrameElement';
import { FrameShadow, Police, Caramelldansen } from './components/FrameShadow';
import { FrameText } from './components/FrameText';

import { getFrameMaskImage } from './utils';

import * as styles from './FrameEffects.module.scss';

export const FrameEffects = () => {
  const effects = Object.values(useSelector(frameEffectsSelectors.effects));

  const behindEffects = effects.filter((effectCur) => !effectCur.layer || effectCur.layer === 'behind');
  const aboveEffects = effects.filter((effectCur) => effectCur.layer === 'above');
  const overlayEffects = effects.filter((effectCur) => effectCur.layer === 'overlay');

  const renderEffect = (effectCur: FrameEffect) => {
    const {
      id,
      kind,
      shadow,
      text,
      Component,
      frameMask,
      style,
    } = effectCur;

    const zIndex = shadow?.style?.zIndex ?? text?.style?.zIndex;
    const isFrameMasked = kind === 'component' && frameMask?.enabled === true;

    const styleSafe = style ?? {};

    let wrapperStyle: CSSProperties = kind === 'component' ? styleSafe : { zIndex };

    if (isFrameMasked && frameMask) {
      const maskImage = getFrameMaskImage(frameMask.sides);

      wrapperStyle = {
        ...wrapperStyle,
        maskImage,
        maskComposite: 'add',
      };
    }

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
        key={id}
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

  return (
    <div id="frame-effects" className={styles.FrameEffects} inert>
      <div className={styles.BehindLayer} data-frame-layer="behind">
        {behindEffects.map(renderEffect)}
      </div>

      <div className={styles.AboveLayer} data-frame-layer="above">
        {aboveEffects.map(renderEffect)}
      </div>

      <div className={styles.OverlayLayer} data-frame-layer="overlay">
        {overlayEffects.map(renderEffect)}
      </div>
    </div>
  );
};
