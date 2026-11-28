import type { AudioEffect } from '@active-book/types';

export type DemoEffect = AudioEffect<number> & {
  label: string;
};

const tone = '/tests/audioLifecycle/tone.wav';
const short = '/tests/audioLifecycle/short.wav';

const relay = (page: number, relativeVolume: number): DemoEffect => ({
  id: `relay-${page}`,
  label: `Реле · ${page}`,
  src: tone,
  lifetime: { type: 'page', page },
  relativeVolume,
  loop: true,
  playOnLoad: true,
  fadeOut: true,
});

export const effects: readonly DemoEffect[] = [
  {
    id: 'beacon',
    label: 'Сигнал маяка',
    src: short,
    lifetime: { type: 'page', page: 1 },
    relativeVolume: 27,
    playOnLoad: true,
  },
  {
    id: 'current',
    label: 'Течение',
    src: tone,
    lifetime: { type: 'range', range: [{ from: 2, to: 4 }] },
    type: 'bg',
    relativeVolume: 18,
    playOnLoad: true,
    loop: true,
    fadeIn: true,
    fadeOut: true,
  },
  {
    id: 'clock',
    label: 'Таймер',
    src: tone,
    lifetime: { type: 'range', range: [{ from: 2, to: 4 }] },
    relativeVolume: 26,
    playOnLoad: true,
    loop: true,
    delay: 2000,
    stopBy: 7000,
    fadeOut: true,
  },
  {
    id: 'depth',
    label: 'Глубина',
    src: `${tone}?arrival`,
    lifetime: { type: 'range', range: [{ from: 3, to: 5 }] },
    type: 'music',
    relativeVolume: 11,
    playOnLoad: true,
    loop: true,
    fadeIn: true,
    fadeOut: true,
  },
  {
    id: 'echo',
    label: 'Эхо',
    src: short,
    lifetime: {
      type: 'range',
      range: [{ from: 3, to: 3 }, { from: 6, to: 7 }],
    },
    relativeVolume: 25,
    playOnLoad: true,
  },
  {
    id: 'broken',
    label: 'Повреждённый сигнал',
    src: 'data:audio/wav;base64,AAAAAAAA',
    lifetime: { type: 'page', page: 3 },
    playOnLoad: true,
  },
  {
    id: 'missed',
    label: 'Запоздалый сигнал',
    src: short,
    lifetime: { type: 'page', page: 4 },
    relativeVolume: 30,
    playOnLoad: true,
    delay: 1000,
    stopBy: 1000,
  },
  relay(5, 30),
  relay(6, 23),
  relay(7, 35),
  {
    id: 'engine',
    label: 'Двигатель',
    src: tone,
    lifetime: { type: 'page', page: 6 },
    type: 'music',
    relativeVolume: 23,
    playOnLoad: true,
    loop: true,
    fadeOut: true,
    waitTillTheEnd: true,
  },
];
