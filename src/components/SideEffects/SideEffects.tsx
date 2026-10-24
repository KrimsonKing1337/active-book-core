import { useSelector } from 'store';

import { sideEffectsSelectors } from 'store/effects/side/effects';
import { sideShadowEffectSelectors } from 'store/effects/side/shadow';
import { sideTextEffectSelectors } from 'store/effects/side/text';

import { SideElement } from './components/SideElement';
import { SideShadow, AnimatedSideShadow } from './components/SideShadow';
import { SideText } from './components/SideText';

import * as styles from './SideEffects.module.scss';

export const SideEffects = () => {
  const effects = useSelector(sideEffectsSelectors.effects);

  // Kept for the existing flashlight fallback until it has a dedicated glow component.
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
              return (
                <SideElement key={shadowCur.id} {...shadowCur}>
                  <AnimatedSideShadow options={shadowCur} />
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
