import { type Howl, Howler } from 'howler';

import type { FadeTime } from './FadeRamp';

// Внутренние свойства Howler 2.2.4 не описаны публичными типами библиотеки.
// Reflect позволяет обращаться к ним без приведения Howl к вымышленному типу.
// Результаты чтения проверяются во время выполнения; Reflect сам по себе их не валидирует.
export const usesHowlerWebAudio = (howl: Howl) => {
  return Reflect.get(howl, '_webAudio') === true;
};

export const isHowlerSound = (value: unknown): value is object => {
  return typeof value === 'object' && value !== null;
};

export const getHowlerSounds = (howl: Howl): readonly object[] => {
  const sounds: unknown = Reflect.get(howl, '_sounds');

  if (Array.isArray(sounds)) {
    return sounds.filter(isHowlerSound);
  }

  return [];
};

export const getHowlerVoiceGain = (sound: object) => {
  const node: unknown = Reflect.get(sound, '_node');

  if (typeof GainNode === 'function' && node instanceof GainNode) {
    return node;
  }
};

export const getFadeTime = (howl: Howl): FadeTime => {
  const wall = performance.now();
  const context = Howler.ctx;
  let playback = wall;

  if (usesHowlerWebAudio(howl) && context) {
    playback = context.currentTime * 1000;
  }

  return { wall, playback };
};

// Updating the group default through volume() also resets every active fade.
export const setHowlerGroupVolume = (howl: Howl, volume: number) => {
  Reflect.set(howl, '_volume', volume);

  for (const soundCur of getHowlerSounds(howl)) {
    if (Reflect.get(soundCur, '_paused') === true) {
      Reflect.set(soundCur, '_volume', volume);
    }
  }
};

// Howler cancels automation only while its wall-clock fade interval is active.
export const cancelHowlerVoiceAutomation = (howl: Howl, soundId: number) => {
  if (!usesHowlerWebAudio(howl)) {
    return;
  }

  const sound = getHowlerSounds(howl).find((voiceCur) => {
    return Reflect.get(voiceCur, '_id') === soundId;
  });

  if (sound) {
    const node = getHowlerVoiceGain(sound);

    node?.gain.cancelScheduledValues(node.context.currentTime);
  }
};
