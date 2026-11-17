import type { HTMLAttributes } from 'react';

import { useMemo, useState } from 'react';

import classNames from 'classnames';


import { BookApplicationContext } from './context';

import * as styles from './BookApplicationSurface.module.scss';

/** Optional embed boundary. A single StoryRoot still owns activation and controllers. */
export const BookApplicationSurface = ({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => {
  const [inverseColors, setInverseColors] = useState(false);
  const [element, setElement] = useState<HTMLDivElement | null>(null);
  const [underStory, setUnderStory] = useState<HTMLDivElement | null>(null);
  const [aboveStory, setAboveStory] = useState<HTMLDivElement | null>(null);
  const [feedback, setFeedback] = useState<HTMLDivElement | null>(null);
  const [selection, setSelection] = useState<HTMLDivElement | null>(null);

  const context = useMemo(() => {
    const hosts = {
      underStory,
      aboveStory,
      feedback,
      selection,
    };

    return {
      element,
      hosts,
      setInverseColors,
    };
  }, [
    element,
    underStory,
    aboveStory,
    feedback,
    selection,
  ]);

  const rootClasses = classNames(styles.Application, className, {
    [styles.InverseColors]: inverseColors,
  });

  return (
    <BookApplicationContext value={context}>
      <div
        {...props}
        ref={setElement}
        className={rootClasses}
        data-book-application
      >
        <div
          ref={setUnderStory}
          className={styles.UnderStory}
          data-application-host="underStory"
          inert
        />

        {children}

        <div
          ref={setAboveStory}
          className={styles.AboveStory}
          data-application-host="aboveStory"
          inert
        />

        <div
          ref={setFeedback}
          className={styles.Feedback}
          data-application-host="feedback"
          inert
        />

        <div
          ref={setSelection}
          className={styles.Selection}
          data-application-host="selection"
          inert
        />
      </div>
    </BookApplicationContext>
  );
};
