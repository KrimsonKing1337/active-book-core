import { useRef, useState } from 'react';

import { WithModal } from '../../src/components/ColoredTextTrigger/WithModal';
import { Video } from '../../src/components/Video';
import { useGoToPage } from '../../src/hooks/control/useGoToPage';

import { ConfirmCases } from './ConfirmCases';

const image = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="400"><rect width="900" height="400" fill="teal"/></svg>',
);

export const Content = () => {
  const [isOwnerVisible, setOwnerVisible] = useState(true);
  const [backgroundClicks, setBackgroundClicks] = useState(0);
  const secondRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLDivElement>(null);
  const { goToPage } = useGoToPage();

  const replace = () => {
    secondRef.current?.querySelector<HTMLElement>('[role="button"]')?.click();
  };

  const hideTrigger = () => {
    const trigger = firstRef.current?.querySelector<HTMLElement>('[role="button"]');

    if (trigger) {
      trigger.style.display = 'none';
    }
  };

  return (
    <div data-testid="reader-content">
      <button type="button" onClick={() => setBackgroundClicks((count) => count + 1)}>
        Фоновая кнопка
      </button>

      <output data-testid="background-clicks">{backgroundClicks}</output>

      <div ref={firstRef}>
        {isOwnerVisible && (
          <WithModal text="Видео A" triggerType="action">
            <Video
              id="dialog-video-a"
              src="/tests/unifiedVisualEffects/movie.webm"
              controls
              loop
            />

            <button type="button" onClick={hideTrigger}>Скрыть исходный триггер</button>
            <button type="button" onClick={replace}>Заменить на видео B</button>
            <button type="button" onClick={() => setOwnerVisible(false)}>Удалить владельца окна</button>
            <button type="button" onClick={() => goToPage(2)}>Перейти со страницы окна</button>
          </WithModal>
        )}
      </div>

      <div ref={secondRef}>
        <WithModal text="Видео B" triggerType="action">
          <Video
            id="dialog-video-b"
            src="/tests/unifiedVisualEffects/movie.webm"
            controls
            loop
          />
        </WithModal>
      </div>

      <WithModal text="Комментарий автора" triggerType="author" mode="default">
        <p>Дополнительное пояснение автора</p>
      </WithModal>

      <WithModal text="Секрет" triggerType="egg" eggId="dialog-egg">
        <img alt="Секретная иллюстрация" src={image} />
      </WithModal>

      <ConfirmCases />
    </div>
  );
};
