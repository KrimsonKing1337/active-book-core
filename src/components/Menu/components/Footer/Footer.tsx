import classNames from 'classnames';

import { useReaderWindow } from '@components/StoryWindowHost/hooks';

import * as styles from './Footer.module.scss';

const getClassNames = (className: string) => {
  return classNames([
    styles.Button,
    className,
  ]);
};

export const Footer = () => {
  const menu = useReaderWindow({ kind: 'menu' });
  const contents = useReaderWindow({ kind: 'tableOfContents' });

  const tableOfContentsButtonClassNames = getClassNames(styles.isTableOfContents);
  const closeButtonClassNames = getClassNames(styles.isClose);

  return (
    <div className={styles.Footer}>
      <button className={tableOfContentsButtonClassNames} onClick={contents.open}>
        Оглавление
      </button>

      <button className={closeButtonClassNames} onClick={menu.close}>
        Закрыть
      </button>
    </div>
  );
};
