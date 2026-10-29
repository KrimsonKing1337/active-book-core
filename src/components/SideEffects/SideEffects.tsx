import type { CSSProperties } from 'react';

import classNames from 'classnames';

import { useSelector } from '@store';

import { sideEffectsSelectors } from '@store/effects/side';

import { SideElement } from './components/SideElement';
import { SideShadow, Police, Caramelldansen } from './components/SideShadow';
import { SideText } from './components/SideText';

import { getFrameMaskImage } from './utils';

import * as styles from './SideEffects.module.scss';

export const SideEffects = () => {
  const effects = useSelector(sideEffectsSelectors.effects);

  return (
    <div id="side-effects" className={styles.SideEffects}>
      {Object.values(effects).map((effectCur) => {
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

        let wrapperStyle: CSSProperties = kind === 'component' ? (style ?? {}) : { zIndex };

        if (isFrameMasked && frameMask) {
          wrapperStyle = {
            ...wrapperStyle,
            maskImage: getFrameMaskImage(frameMask.sides),
            maskComposite: 'add',
          };
        }

        const wrapperClassNames = classNames({
          [styles.EffectWrapper]: true,
          [styles.isFrameMasked]: isFrameMasked,
        });

        let ShadowComponent = SideShadow;

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
            className={wrapperClassNames}
          >
            {showShadow && (
              <SideElement {...shadow}>
                <ShadowComponent options={shadow} />
              </SideElement>
            )}

            {showText && (
              <SideElement {...text}>
                <SideText animation={text.animation} style={text.style}>
                  <span>
                    {text.leftText}
                  </span>

                  <span>
                    {text.rightText}
                  </span>
                </SideText>
              </SideElement>
            )}

            {componentContent}
          </div>
        );
      })}
    </div>
  );
};
