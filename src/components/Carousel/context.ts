import { createContext, useContext } from 'react';

export const CarouselSlideActiveContext = createContext(true);

export const useCarouselSlideActive = (): boolean => {
  return useContext(CarouselSlideActiveContext);
};
