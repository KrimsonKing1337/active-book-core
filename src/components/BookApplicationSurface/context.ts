import { createContext, useContext } from 'react';


export type ApplicationHosts = {
  underStory: HTMLDivElement | null;
  aboveStory: HTMLDivElement | null;
  feedback: HTMLDivElement | null;
  selection: HTMLDivElement | null;
};

export type ApplicationSurfaceContext = {
  element: HTMLDivElement | null;
  hosts: ApplicationHosts;
  setInverseColors: (inverse: boolean) => void;
};

export const BookApplicationContext = createContext<ApplicationSurfaceContext | null>(null);

export const useBookApplicationSurface = () => useContext(BookApplicationContext);
