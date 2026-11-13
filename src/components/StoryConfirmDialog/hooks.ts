import { useEffect, useState } from 'react';

type CountdownOptions = {
  instanceId: string | undefined;
  delayMs: number;
};

type Countdown = {
  instanceId: string;
  delayMs: number;
  secondsLeft: number;
};

export const useConfirmationCountdown = ({ instanceId, delayMs }: CountdownOptions) => {
  const [countdown, setCountdown] = useState<Countdown | null>(null);
  const hasDelay = Number.isFinite(delayMs) && delayMs > 0;

  useEffect(() => {
    if (!instanceId || !hasDelay) {
      return;
    }

    const deadline = Date.now() + delayMs;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let isActive = true;

    const update = () => {
      if (!isActive) {
        return;
      }

      const remaining = Math.max(0, deadline - Date.now());
      setCountdown({
        instanceId,
        delayMs,
        secondsLeft: Math.ceil(remaining / 1000),
      });

      if (remaining > 0) {
        timeout = setTimeout(update, Math.min(remaining, 1000));
      }
    };

    update();

    return () => {
      isActive = false;
      clearTimeout(timeout);
    };
  }, [instanceId, delayMs, hasDelay]);

  if (!instanceId || !hasDelay) {
    return 0;
  }

  if (countdown?.instanceId === instanceId && countdown.delayMs === delayMs) {
    return countdown.secondsLeft;
  }

  return Math.ceil(delayMs / 1000);
};
