import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useSelector } from '@store';
import { audioEffectsSelectors } from '@store/effects/audio/audio';

import type { HowlWrapper } from '@utils/effects/audio/HowlWrapper';

import * as styles from './AudioPlayground.module.scss';

const commands = [
  'onPause',
  'onStop',
  'onUnload',
] as const;

type CommandEvent = {
  id: number;
  effect: string;
  command: (typeof commands)[number];
};

export const AudioCommandEvents = () => {
  const audioInstances = useSelector(audioEffectsSelectors.audioInstances);
  const observed = useRef(new WeakSet<HowlWrapper>());
  const nextId = useRef(0);
  const [events, setEvents] = useState<CommandEvent[]>([]);

  useEffect(() => {
    for (const audioCur of Object.values(audioInstances)) {
      if (!audioCur || observed.current.has(audioCur)) {
        continue;
      }

      observed.current.add(audioCur);

      for (const commandCur of commands) {
        const original = audioCur[commandCur];

        // The wrapper retains its book callback and keeps reporting after leaving the active list.
        audioCur[commandCur] = () => {
          nextId.current += 1;
          const entry = {
            id: nextId.current,
            effect: audioCur.id,
            command: commandCur,
          };

          setEvents((previous) => [entry, ...previous].slice(0, 10));
          original();
        };
      }
    }
  }, [audioInstances]);

  return (
    <section className={styles.CommandEvents} aria-label="События аудио">
      <h2>
        События аудио
      </h2>

      {events.length === 0 && (
        <p>
          Событий пока нет
        </p>
      )}

      {events.length > 0 && (
        <ol>
          {events.map(({
            id,
            effect,
            command,
          }) => (
            <li key={id} data-audio-event={command} data-audio-effect={effect}>
              {command} · {effect}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
};
