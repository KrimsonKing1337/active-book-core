import { useSelector } from 'store';

import { sideEffectsSelectors } from 'store/effects/side/effects';

import { SideElement } from './components/SideElement';
import { SideShadow, Police, Caramelldansen } from './components/SideShadow';
import { SideText } from './components/SideText';

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
          style,
        } = effectCur;
        const zIndex = shadow?.style?.zIndex ?? text?.style?.zIndex;
        const wrapperStyle = kind === 'component' ? style : { zIndex };

        let ShadowComponent = SideShadow;

        if (shadow?.animation?.preset === 'police') {
          ShadowComponent = Police;
        } else if (shadow?.animation?.preset === 'caramel') {
          ShadowComponent = Caramelldansen;
        }

        const showShadow = kind === 'shadow' && shadow;
        const showText = kind === 'text' && text;
        const showComponent = kind === 'component' && Boolean(Component);

        return (
          <div
            key={id}
            id={`effect-${id}`}
            data-effect-id={id}
            style={wrapperStyle}
            className={styles.EffectWrapper}
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

            {showComponent && (
              Component
            )}
          </div>
        );
      })}
    </div>
  );
};
