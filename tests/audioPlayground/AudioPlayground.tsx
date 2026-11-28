import { useState } from 'react';

import {
  StoreProvider,
  useDispatch,
  useSelector,
} from '@store';
import { mainActions, mainSelectors } from '@store/main';

import { AudioControls } from './AudioControls';
import { DemoBook } from './DemoBook';
import { EffectStatus } from './EffectStatus';
import { effects } from './effects';
import { quietScene, scenes } from './story';

import * as styles from './AudioPlayground.module.scss';

const PlaygroundContent = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isQuiet, setIsQuiet] = useState(false);
  const page = useSelector(mainSelectors.page);
  const isPresented = useSelector(mainSelectors.isPagePresented);
  const isAudioUnlocked = useSelector(mainSelectors.isAudioUnlocked);
  const dispatch = useDispatch();

  let scene = scenes[page - 1];
  let bookButton = 'Закрыть книгу';
  let switchButton = 'Открыть тихую книгу';
  let visitStatus = 'Книга закрыта';
  let audioStatus = 'Звук ждёт жеста';

  if (isQuiet) {
    scene = quietScene;
    switchButton = 'Открыть "Сигналы в тумане"';
  }

  if (!isOpen) {
    bookButton = 'Открыть книгу';
  } else if (isPresented && scene) {
    visitStatus = `Страница ${page} · ${scene.title} · раскрыта`;
  } else {
    visitStatus = `Страница ${page} · подготовка`;
  }

  if (isAudioUnlocked) {
    audioStatus = 'Звук разрешён';
  }

  // The reader handles the button's trusted click through its normal gesture listener.
  const showUnlock = isOpen && !isAudioUnlocked;
  const showScenes = isOpen && !isQuiet;
  const showCue = isOpen && isPresented && Boolean(scene);

  const handleBookToggle = () => {
    setIsOpen((open) => !open);
  };

  const handleSwitchBook = () => {
    setIsQuiet((quiet) => !quiet);
    setIsOpen(true);
  };

  const handleNavigate = (nextPage: number) => {
    dispatch(mainActions.setPage(nextPage));
  };

  return (
    <main className={styles.Lab}>
      <header className={styles.Header}>
        <div>
          <h1>
            Сигналы в тумане
          </h1>

          <p>
            ActiveBook · Лаборатория межстраничного аудио
          </p>
        </div>

        <div className={styles.Actions}>
          {showUnlock && (
            <button type="button" className={styles.Primary}>
              Разрешить звук
            </button>
          )}

          <button type="button" onClick={handleBookToggle}>
            {bookButton}
          </button>

          <button type="button" onClick={handleSwitchBook}>
            {switchButton}
          </button>
        </div>
      </header>

      <div className={styles.Layout}>
        <section className={styles.Workspace} aria-label="Книга">
          <div className={styles.BookStatus}>
            <output data-testid="audio-visit">
              {visitStatus}
            </output>

            <span data-testid="audio-permission">
              {audioStatus}
            </span>
          </div>

          <div className={styles.Stage}>
            {isOpen && (
              <DemoBook isQuiet={isQuiet} />
            )}
          </div>

          {showScenes && (
            <nav className={styles.Navigation} aria-label="Страницы истории">
              {scenes.map(({ id, title }, index) => {
                const position = index + 1;
                let current: 'page' | undefined;

                if (position === page) {
                  current = 'page';
                }

                return (
                  <button
                    key={id}
                    type="button"
                    aria-current={current}
                    onClick={() => handleNavigate(position)}
                  >
                    {position}. {title}
                  </button>
                );
              })}
            </nav>
          )}

          {showCue && (
            <p className={styles.Cue}>
              {scene.cue}
            </p>
          )}
        </section>

        <aside className={styles.Panel} aria-label="Диагностика аудио">
          <h2>
            Аудиоэффекты
          </h2>

          <AudioControls />

          <ul className={styles.Effects}>
            {effects.map((effect) => (
              <EffectStatus key={effect.id} effect={effect} />
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
};

export const AudioPlayground = () => (
  <StoreProvider>
    <PlaygroundContent />
  </StoreProvider>
);
