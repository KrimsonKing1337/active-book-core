export type LayoutMode = 'scale' | 'size';

export type LayoutLease = {
  update: (factor: number) => void;
  release: () => void;
};

/** One allowlisted target and one exclusive contribution, owned by its host. */
export const createViewportLayoutHost = (invalidate: () => void) => {
  let target: HTMLElement | null = null;
  let current: {
    owner: symbol; mode: LayoutMode; factor: number
  } | null = null;

  const clear = (element: HTMLElement) => {
    delete element.dataset.layoutMode;
    element.style.removeProperty('--visual-layout-factor');
  };

  const apply = () => {
    if (target) {
      if (current) {
        target.dataset.layoutMode = current.mode;
        target.style.setProperty('--visual-layout-factor', String(current.factor));
      } else {
        clear(target);
      }
    }

    invalidate();
  };

  const attach = (element: HTMLElement | null) => {
    if (target && target !== element) {
      clear(target);
    }

    target = element;
    apply();
  };

  const acquire = (mode: LayoutMode): LayoutLease => {
    if (current) {
      throw new Error('storyViewport is already controlled by another layout lease');
    }

    const owner = Symbol('viewport-lease');
    current = {
      owner, mode, factor: 1,
    };
    apply();

    return {
      update: (factor) => {
        if (current?.owner !== owner) {
          return;
        }

        if (!Number.isFinite(factor) || factor < 0 || factor > 1) {
          throw new Error('Viewport factor must be finite and between zero and one');
        }

        current.factor = factor;
        apply();
      },
      release: () => {
        if (current?.owner === owner) {
          current = null;
          apply();
        }
      },
    };
  };

  const reset = () => {
    current = null;
    apply();
  };

  return {
    attach, acquire, reset, hasLease: () => current !== null,
  };
};
