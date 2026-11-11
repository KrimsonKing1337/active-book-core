import type { KeyboardEvent, ReactNode } from 'react';

import { useCarousel } from './useCarousel';

import styles from './Carousel.module.scss';

export type CarouselProps = {
  slides: readonly ReactNode[];
};

export const Carousel = ({ slides }: CarouselProps) => {
  const {
    viewportRef,
    navigation,
    previous,
    next,
  } = useCarousel();

  const {
    selected,
    canPrevious,
    canNext,
  } = navigation;

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

            return (
              <div
                key={index}
                className={styles.Slide}
                role="group"
                aria-roledescription="слайд"
                aria-label={label}
                aria-hidden={isInactive}
                inert={isInactive}
                data-carousel-slide
              >
                {slideCur}
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
