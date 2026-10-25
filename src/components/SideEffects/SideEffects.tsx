import { useSelector } from 'store';

import { sideEffectsSelectors } from 'store/effects/side/effects';
import { sideShadowEffectSelectors } from 'store/effects/side/shadow';
import { sideTextEffectSelectors } from 'store/effects/side/text';

import { SideElement } from './components/SideElement';
import { SideShadow, AnimatedSideShadow, Police, Caramelldansen } from './components/SideShadow';
import { SideText } from './components/SideText';

import * as styles from './SideEffects.module.scss';

export const SideEffects = () => {
  const effects = useSelector(sideEffectsSelectors.effects);

  // The legacy hook remains available to books and to the flashlight fallback.
  const sideShadowIsActive = useSelector(sideShadowEffectSelectors.isActive);
  const sideTextIsActive = useSelector(sideTextEffectSelectors.isActive);
  const sideTextTemplate = useSelector(sideTextEffectSelectors.template);

  return (
    <div id="side-effects" className={styles.SideEffects}>
      {sideShadowIsActive && <SideShadow />}
      {sideTextIsActive && sideTextTemplate}

      {Object.values(effects).map((effectCur) => {
        return (
          <div key={effectCur.id}>
            {effectCur.shadows?.map((shadowCur) => {
              const preset = shadowCur.animation?.preset;

              let ShadowComponent = AnimatedSideShadow;

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

            {effectCur.texts?.map((textCur) => {
              return (
                <SideElement key={textCur.id} {...textCur}>
                  <SideText animation={textCur.animation} style={textCur.style}>
                    <span>{textCur.leftText}</span>
                    <span>{textCur.rightText}</span>
                  </SideText>
                </SideElement>
              );
            })}

            {effectCur.Component}
          </div>
        );
      })}
    </div>
  );
};
