import { useLayoutEffect, useRef, useState } from 'react';

type WindowEntry = {
  owner: string;
  scope: string;
  windowId: string | null;
};

const entryKey = 'activeBookWindow';

const readEntry = (): WindowEntry | null => {
  const entry: unknown = window.history.state?.[entryKey];

  if (!entry || typeof entry !== 'object') {
    return null;
  }

  if ('owner' in entry && 'scope' in entry && 'windowId' in entry
    && typeof entry.owner === 'string' && typeof entry.scope === 'string'
    && (typeof entry.windowId === 'string' || entry.windowId === null)) {
    return entry as WindowEntry;
  }

  return null;
};

/** One same-URL entry for the currently open window; switching replaces that entry. */
export const useWindowHistory = (
  scope: string,
  windowId: string | null,
  onChange: (windowId: string | null) => void,
  resetOnMount = false,
) => {
  const [owner] = useState(() => {
    const entry = readEntry();

    return entry?.scope === scope ? entry.owner : crypto.randomUUID();
  });
  const desiredRef = useRef(windowId);
  const changeRef = useRef(onChange);
  const consumingRef = useRef(false);
  const mountedRef = useRef(false);
  const appliedRef = useRef<string | null | undefined>(undefined);

  desiredRef.current = windowId;
  changeRef.current = onChange;

  useLayoutEffect(() => {
    mountedRef.current = true;

    const writeEntry = (next: string | null, replace: boolean) => {
      const entry = {
        owner,
        scope,
        windowId: next,
      };
      const state = {
        ...window.history.state,
        [entryKey]: entry,
      };

      if (replace) {
        window.history.replaceState(state, '', window.location.href);
      } else {
        window.history.pushState(state, '', window.location.href);
      }
    };

    const entry = readEntry();

    if (entry?.owner === owner && entry.windowId) {
      appliedRef.current = entry.windowId;
      changeRef.current(entry.windowId);
    } else if (resetOnMount) {
      desiredRef.current = null;
      appliedRef.current = null;
      changeRef.current(null);
    }

    const handlePopState = () => {
      const current = readEntry();

      if (consumingRef.current) {
        consumingRef.current = false;

        // Reopening during an asynchronous Back must not lose the new request.
        if (desiredRef.current) {
          writeEntry(desiredRef.current, false);
        }

        return;
      }

      const next = current?.owner === owner ? current.windowId : null;
      appliedRef.current = next;
      if (next !== desiredRef.current) {
        changeRef.current(next);
      }
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);

      mountedRef.current = false;

      queueMicrotask(() => {
        if (mountedRef.current) {
          return;
        }

        const current = readEntry();

        if (current?.owner === owner && current.windowId) {
          writeEntry(null, true);
          window.history.back();
        }

        if (resetOnMount) {
          changeRef.current(null);
        }
      });
    };
  }, [owner, scope, resetOnMount]);

  useLayoutEffect(() => {
    if (appliedRef.current !== undefined) {
      const applied = appliedRef.current;
      appliedRef.current = undefined;

      if (windowId === applied || desiredRef.current === null) {
        return;
      }
    }

    if (consumingRef.current) {
      return;
    }

    const entry = readEntry();
    const ownsEntry = entry?.owner === owner;

    if (ownsEntry && entry.windowId === windowId) {
      return;
    }

    if (!windowId && !ownsEntry) {
      return;
    }

    const nextEntry = {
      owner,
      scope,
      windowId,
    };
    const state = {
      ...window.history.state,
      [entryKey]: nextEntry,
    };

    if (ownsEntry) {
      window.history.replaceState(state, '', window.location.href);

      if (!windowId) {
        // Forward after X lands on an inert entry, never reopens a dismissed window.
        consumingRef.current = true;
        window.history.back();
      }
    } else if (windowId) {
      window.history.pushState(state, '', window.location.href);
    }
  }, [owner, scope, windowId]);
};
