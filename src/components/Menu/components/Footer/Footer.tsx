import classNames from 'classnames';

import { useDispatch } from '@store';
import { mainActions } from '@store/main';

import * as styles from './Footer.module.scss';

const getClassNames = (className: string) => {
  return classNames([
    styles.Button,
    className,
  ]);
};

export const Footer = () => {
  const dispatch = useDispatch();

  const tableOfContentsButtonClickHandler = () => {
    dispatch(mainActions.setMenuActiveState('tableOfContents'));
  };

  /*const achievementsProgressClickHandler = () => {
    dispatch(mainActions.setMenuActiveState('achievementsProgress'));
  };*/

  const closeButtonClickHandler = () => {
    dispatch(mainActions.setMenuActiveState(null));
  };

  const tableOfContentsButtonClassNames = getClassNames(styles.isTableOfContents);
  const closeButtonClassNames = getClassNames(styles.isClose);

  return (
    <div className={styles.Footer}>
      <button className={tableOfContentsButtonClassNames} onClick={tableOfContentsButtonClickHandler}>
        Оглавление
      </button>

      {/* временно скрываю всё, что связано с ачивками */}
      {/*<button className={getClassNames(styles.isAchievementsProgress)} onClick={achievementsProgressClickHandler}>
        Прогресс достижений
      </button>*/}

      <button className={closeButtonClassNames} onClick={closeButtonClickHandler}>
        Закрыть
      </button>
    </div>
  );
};
