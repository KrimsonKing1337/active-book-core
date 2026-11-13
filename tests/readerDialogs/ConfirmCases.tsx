import { useState } from 'react';

import { StoryConfirmDialog } from '../../src/components/StoryConfirmDialog';
import { useReaderWindow } from '../../src/components/StoryWindowHost/hooks';

export const ConfirmCases = () => {
  const [confirmed, setConfirmed] = useState(0);
  const notice = useReaderWindow({
    kind: 'dialog',
    contentId: 'fixture-confirm',
    canClose: false,
  });
  const params = new URLSearchParams(location.search);
  const delay = Number(params.get('delay') ?? 2000);

  const handleConfirm = () => {
    notice.forceClose();
    setConfirmed((count) => count + 1);
  };

  const reopen = () => {
    notice.forceClose();
    notice.open();
  };

  return (
    <>
      <button type="button" onClick={notice.open}>Показать подтверждение</button>
      <output data-testid="confirmed">{confirmed}</output>

      <StoryConfirmDialog
        target={notice.target}
        title="Проверка подтверждения"
        description="Подтверждение привязано к экземпляру окна"
        confirmationDelayMs={delay}
        confirmLabel="Подтвердить"
        onConfirm={handleConfirm}
      >
        <button type="button" onClick={notice.open}>Заменить предупреждение</button>
        <button type="button" onClick={reopen}>Закрыть и открыть снова</button>
      </StoryConfirmDialog>
    </>
  );
};
