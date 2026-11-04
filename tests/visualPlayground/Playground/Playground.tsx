import type { CSSProperties } from 'react';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { StoreProvider } from '@store';

import { createVisualEffects } from '@controllers/visualEffects';

import { AppModeContext } from '@components/App/AppModeContext';
import { AppWrapper } from '@components/AppWrapper';
import { BookApplicationSurface } from '@components/BookApplicationSurface';
import { supportsCssLayout } from '@components/VisualSurfaces/utils/cssLayout';

import { type Settings, initialSettings } from '../@types';
import { Controls } from '../Controls';
import { PlaygroundPage } from '../PlaygroundPage';
import { Navigation } from '../Navigation';
import { definitionsFor, registrationsFor } from '../registrations';
import { playSequence } from '../sequence';

import * as styles from './Playground.module.scss';

const config = {
  id: 'visual-playground',
  pages: 4,
  defaultTheme: 'dark' as const,
};

const demoColors: Partial<Record<Settings['demo'], string>> = {
  frame: '#70d9c5',
  smoke: '#bdced4',
  through: '#75e1d5',
};

const getDemoDefaults = (demo: Settings['demo']): Pick<Settings, 'color' | 'region'> => {
  return {
    color: demoColors[demo] ?? '#11131f',
    region: demo === 'frame' ? 'storyViewport' : 'application',
  };
};

export const Playground = () => {
  const [settings, setSettings] = useState(initialSettings);
  const [session] = useState(() => createVisualEffects({ pages: 4, definitions: definitionsFor(initialSettings) }));
  const [events, setEvents] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(true);
  const [page, setPage] = useState(1);
  const seenRef = useRef(new Set<string>());
  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(false);
  const registrations = useMemo(() => registrationsFor(settings), [settings]);
  const definitions = useMemo(() => definitionsFor(settings), [settings]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    for (const { effect } of session.getSnapshot()) {
      session.getController(effect.id)?.playback?.stop();
    }
  }, [session]);

  const play = useCallback(() => {
    stop();
    setError('');
    const controller = new AbortController();
    abortRef.current = controller;

    if (settings.demo === 'collapse' || settings.demo === 'sequence') {
      void playSequence({
        session, signal: controller.signal, narrative: settings.demo === 'sequence',
      }).catch((reason) => {
        if (!controller.signal.aborted) {
          if (!(reason instanceof DOMException && reason.name === 'AbortError')) {
            setError(String(reason));
          }
          stop();
        }
      });

      return;
    }

    registrations.forEach(({ effect }) => session.getController(effect.id)?.playback?.play());
  }, [settings.demo, registrations, session, stop]);

  const pause = useCallback(() => {
    registrations.forEach(({ effect }) => session.getController(effect.id)?.playback?.pause());
  }, [registrations, session]);

  const resume = useCallback(() => {
    registrations.forEach(({ effect }) => {
      if (session.runs.read(effect.id)?.status === 'paused') {
        session.getController(effect.id)?.playback?.play();
      }
    });
  }, [registrations, session]);

  const change = useCallback((patch: Partial<Settings>) => {
    const requiresPlaybackReset = patch.demo || patch.region || patch.physicalMode || patch.composition || patch.plane;

    if (requiresPlaybackReset) {
      stop();
    }

    setSettings((previous) => {
      const defaults = patch.demo ? getDemoDefaults(patch.demo) : {};

      return {
        ...previous,
        ...defaults,
        ...patch,
      };
    });
  }, [stop]);

  const handleNavigate = useCallback((nextPage: number) => {
    setPage(nextPage);
  }, []);

  const handleToggleBook = () => {
    stop();
    setVisible((previous) => !previous);
  };

  const playRef = useRef(play);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  useEffect(() => {
    if (settings.trigger === 'page' && page !== 3) {
      playRef.current();
    }
    // Only a committed page transition is a trigger, not a parameter update.
  }, [page, settings.trigger]);

  useEffect(() => {
    return session.runs.subscribe(() => {
      const lines: string[] = [];

      for (const { effect } of session.getSnapshot()) {
        const run = session.runs.read(effect.id);

        if (!run) {
          continue;
        }

        const line = `${effect.id} #${run.number} · ${run.status} ${run.milestones.join(', ')}`;

        if (!seenRef.current.has(line)) {
          seenRef.current.add(line);
          lines.push(line);
        }
      }

      if (lines.length) {
        setEvents((previous) => [...lines, ...previous].slice(0, 30));
      }
    });
  }, [session]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      queueMicrotask(() => {
        if (!mountedRef.current) {
          session.destroy();
        }
      });
    };
  }, [session]);

  useEffect(() => {
    window.playground = {
      session,
      settings,
      change,
      play,
      pause,
      stop,
      setVisible,
    };
  }, [session, settings, change, play, pause, stop]);

  const unsupported = settings.demo === 'frame' && settings.layout === 'css' && !supportsCssLayout({
    ...registrations[0].effect,
    content: null,
  });
  const status = unsupported
    ? 'CSS не поддерживает этот placement: показано несовпадение без возврата к JS'
    : 'Живая сессия · диапазон 1–2 и 4 · page 3 выключает эффекты';
  const appStyle: CSSProperties = { width: settings.width, height: settings.height };
  const storyStyle: CSSProperties = {
    width: `${settings.storySize}%`,
    height: `${settings.storySize}%`,
    '--story-toolbar-height': `${settings.toolbarHeight}px`,
  } as CSSProperties;

  return (
    <AppModeContext value={new URLSearchParams(location.search).get('mode') === 'reader' ? 'reader' : 'editor'}>
      <StoreProvider>
        <MemoryRouter initialEntries={['/page-1']}>
          <div className={styles.Lab}>
            <header className={styles.Header}>
              <div className={styles.Logo}>
                AB
              </div>

              <div>
                <h1>
                  ActiveBook <span>Visual Lab</span>
                </h1>

                <p>
                  Свет, движение и пространство истории
                </p>
              </div>

              <span className={styles.Badge}>
                EXPERIMENT / 01
              </span>
            </header>

            <main className={styles.Main}>
              <div className={styles.Workspace}>
                <div className={styles.WorkspaceBar}>
                  <span>
                    РАБОЧАЯ ПОВЕРХНОСТЬ · {settings.width} × {settings.height}
                  </span>

                  <div>
                    <button type="button" onClick={() => change({ width: 1040, height: 690 })}>Desktop</button>
                    <button type="button" onClick={() => change({ width: 390, height: 740 })}>Mobile</button>
                    <button
                      type="button"
                      onClick={handleToggleBook}
                    >
                      Закрыть / открыть книгу
                    </button>
                  </div>
                </div>

                <div className={styles.ScrollArea}>
                  <div className={styles.Stage} style={appStyle} data-testid="application-stage">
                    {visible && (
                      <BookApplicationSurface>
                        <div className={styles.StorySize} style={storyStyle}>
                          <AppWrapper
                            config={config}
                            tableOfContents={[]}
                            rangeEffects={[]}
                            visualEffects={session}
                            registrations={registrations}
                            definitions={definitions}
                          >
                            <Routes>
                              {[1, 2, 3, 4].map((pageCur) => {
                                return (
                                  <Route
                                    key={pageCur}
                                    path={`/page-${pageCur}`}
                                    element={<PlaygroundPage key={pageCur} settings={settings} page={pageCur} />}
                                  />
                                );
                              })}
                            </Routes>
                          </AppWrapper>
                        </div>
                      </BookApplicationSurface>
                    )}
                  </div>
                </div>

                <div className={styles.Status} data-testid="layout-status" data-unsupported={unsupported}>
                  {status}
                </div>

                <Navigation onNavigate={handleNavigate} />

                <details className={styles.Events} open>
                  <summary>
                    События сессии · {events.length}
                  </summary>

                  <ol data-testid="run-events">
                    {events.slice(0, 8).map((lineCur) => <li key={lineCur}>{lineCur}</li>)}
                  </ol>
                </details>

                {error && (
                  <p role="alert">
                    {error}
                  </p>
                )}
              </div>

              <Controls
                settings={settings}
                onChange={change}
                onPlay={play}
                onPause={pause}
                onResume={resume}
                onStop={stop}
              />
            </main>
          </div>
        </MemoryRouter>
      </StoreProvider>
    </AppModeContext>
  );
};

declare global {
  interface Window {
    playground: {
      session: ReturnType<typeof createVisualEffects>;
      settings: Settings;
      change: (patch: Partial<Settings>) => void;
      play: () => void;
      pause: () => void;
      stop: () => void;
      setVisible: (value: boolean) => void;
    };
  }
}
