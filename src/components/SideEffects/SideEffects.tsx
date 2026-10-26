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
          shadows,
          texts,
          Component,
        } = effectCur;

        const zIndex = shadows?.[0]?.style?.zIndex ?? texts?.[0]?.style?.zIndex;

        return (
          <div
            key={id}
            id={`effect-${id}`}
            data-effect-id={id}
            className={styles.EffectWrapper}
            style={{ zIndex }}
          >
            {shadows?.map((shadowCur) => {
              const preset = shadowCur.animation?.preset;

              let ShadowComponent = SideShadow;

              if (preset === 'police') {
                ShadowComponent = Police;
              } else if (preset === 'caramel') {
                ShadowComponent = Caramelldansen;
              }

              return (
                <SideElement key={shadowCur.id} {...shadowCur}>
                  <ShadowComponent options={shadowCur} />
                </SideElement>
              );
            })}

            {texts?.map((textCur) => {
              const {
                id,
                animation,
                style,
                leftText,
                rightText,
              } = textCur;

              return (
                <SideElement key={id} {...textCur}>
                  <SideText animation={animation} style={style}>
                    <span>
                      {leftText}
                    </span>

                    <span>
                      {rightText}
                    </span>
                  </SideText>
                </SideElement>
              );
            })}

            {Component}
          </div>
        );
      })}
    </div>
  );
};
