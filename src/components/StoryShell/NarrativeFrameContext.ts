import { createContext, useContext } from 'react';

export type NarrativeFrameTarget = {
  element: HTMLDivElement | null;
  attach: (element: HTMLDivElement | null) => void;
};

export const NarrativeFrameContext = createContext<NarrativeFrameTarget | null>(null);

/** The actual persistent DOM region, for effects that use local CSS coordinates. */
export const useNarrativeFrame = () => useContext(NarrativeFrameContext)?.element ?? null;
