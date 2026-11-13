import {
  type KeyboardEvent,
  type ReactNode,
  isValidElement,
} from 'react';

import { CarouselSlideActiveContext } from './context';
import { useCarousel } from './hooks';

import styles from './Carousel.module.scss';

export type CarouselProps = {
  slides: readonly ReactNode[];
  /** Reports the initial zero-based Embla selection and subsequent index changes. */
  onSelect?: (index: number) => void;
};

export const Carousel = ({ slides, onSelect }: CarouselProps) => {
  const {
    viewportRef,
    navigation,
    previous,
    next,
  } = useCarousel(onSelect);

  const {
    selected,
    canPrevious,
    canNext,
  } = navigation;

  if (!slides.length) {
    return null;
  }

  const status = `${selected + 1} из ${slides.length}`;

  const handleKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.target !== e.currentTarget) {
      return;
    }

    if (e.key === 'ArrowLeft') {
      e.preventDefault();

      previous();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();

      next();
    }
  };

  return (
    <section
      className={styles.Carousel}
      aria-label="Карусель"
      aria-roledescription="карусель"
      data-book-carousel
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div ref={viewportRef} className={styles.Viewport}>
        <div className={styles.Slides}>
          {slides.map((slideCur, index) => {
            const isInactive = index !== selected;
            const label = `${index + 1} из ${slides.length}`;

            let key = `position-${index}`;

            if (isValidElement(slideCur) && slideCur.key !== null) {
              key = `key-${slideCur.key}`;
            }

            return (
              <div
                key={key}
                className={styles.Slide}
                role="group"
                aria-roledescription="слайд"
                aria-label={label}
                aria-hidden={isInactive}
                inert={isInactive}
                data-carousel-slide
              >
                <CarouselSlideActiveContext value={!isInactive}>
                  {slideCur}
                </CarouselSlideActiveContext>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.Controls}>
        <button type="button" disabled={!canPrevious} onClick={previous}>
          Предыдущий слайд
        </button>

        <span aria-live="polite" aria-atomic="true">
          {status}
        </span>

        <button type="button" disabled={!canNext} onClick={next}>
          Следующий слайд
        </button>
      </div>
    </section>
  );
};
