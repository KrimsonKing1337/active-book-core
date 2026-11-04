import type { RefObject } from 'react';

import { createContext, useContext } from 'react';

import type { createViewportLayoutHost } from '@controllers/visualEffects/layout';

export type ApplicationHosts = {
  underStory: HTMLDivElement | null;
  aboveStory: HTMLDivElement | null;
  feedback: HTMLDivElement | null;
  selection: HTMLDivElement | null;
};

export type ApplicationSurfaceContext = {
  root: RefObject<HTMLDivElement | null>;
  element: HTMLDivElement | null;
  hosts: ApplicationHosts;
  layout: ReturnType<typeof createViewportLayoutHost>;
  setInverseColors: (inverse: boolean) => void;
};

export const BookApplicationContext = createContext<ApplicationSurfaceContext | null>(null);

export const useBookApplicationSurface = () => useContext(BookApplicationContext);
