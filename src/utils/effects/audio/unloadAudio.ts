import type { HowlWrapper } from './HowlWrapper';

/*
  Короткому конечному звуку (до 1.2 секунды) даём доиграть перед unload.
  waitTillTheEnd пропускает loop и ограничивает ожидание, если событие завершения потеряно.
*/
export const unloadAudio = async (audioInstance: HowlWrapper) => {
  const fixedDur = audioInstance.howlInst.duration().toFixed(1);
  const floatDur = parseFloat(fixedDur);

  if (floatDur < 1.2) {
    await audioInstance.waitTillTheEnd();
  }

  await audioInstance.unload();
};
