import type { VisualEffectController, VisualPlayback } from '@active-book/types';

export type AttachVisualController = {
  id: string;
  readPlayback: () => VisualPlayback | null;
};

type VisualControllersOptions = {
  remove: (id: string) => void;
};

/** Per-activation handles. No renderer resources or callbacks enter the serialized snapshot. */
export const createVisualControllers = ({ remove }: VisualControllersOptions) => {
  const controllers = new Map<string, VisualEffectController>();

  const invalidate = (id: string) => {
    controllers.delete(id);
  };

  const attach = ({ id, readPlayback }: AttachVisualController) => {
    if (controllers.has(id)) {
      throw new Error(`Visual effect already has an active renderer: ${id}`);
    }

    const isCurrent = () => controllers.get(id) === controller;

    const controller: VisualEffectController = {
      destroy: () => {
        if (isCurrent()) {
          invalidate(id);
          remove(id);
        }
      },
      get playback() {
        const playback = readPlayback();

        if (!isCurrent() || !playback) {
          return undefined;
        }

        const canCall = () => isCurrent() && readPlayback() === playback;

        return {
          play: () => {
            if (canCall()) {
              return playback.play();
            }
          },
          pause: () => {
            if (canCall()) {
              playback.pause();
            }
          },
          stop: () => {
            if (canCall()) {
              playback.stop();
            }
          },
        };
      },
    };

    controllers.set(id, controller);

    return () => {
      if (isCurrent()) {
        invalidate(id);
      }
    };
  };

  return {
    attach,
    invalidate,
    get: (id: string) => controllers.get(id),
    clear: () => controllers.clear(),
  };
};
