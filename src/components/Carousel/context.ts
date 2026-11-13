import { createContext, useContext } from 'react';

// Undefined distinguishes standalone content from an active carousel slide.
export const CarouselSlideActiveContext = createContext<boolean | undefined>(undefined);

export const useCarouselSlideActive = (): boolean => {
  return useContext(CarouselSlideActiveContext) ?? true;
};
