import {
  useEffect,
  useRef,
  useState,
} from 'react';

import classNames from 'classnames';

import ArrowLeft from '@assets/img/toolbar/i-arrow-left.svg';
import ArrowRight from '@assets/img/toolbar/i-arrow-right.svg';

import { useSelector } from '@store';
import { mainSelectors } from '@store/main';

import { useGoToPage } from '@hooks/control/useGoToPage';

import { useReaderWindow } from '@components/StoryWindowHost/hooks';
import { useAppMode } from '@components/App/AppModeContext';

import { Item } from '@components/Toolbar/components';

import { Flags, modalsWereShowed } from '@utils/localStorage/modalsWereShowed';

import { SwipeNotice } from './SwipeNotice';

import * as styles from './Nav.module.scss';

export const Nav = () => {
  const appMode = useAppMode();

  const {
    goToPage,
    goPrevPage,
    goNextPage,
  } = useGoToPage();

  const id = useSelector(mainSelectors.id);
  const page = useSelector(mainSelectors.page);
  const pages = useSelector(mainSelectors.pages);

  const inputRef = useRef<HTMLInputElement>(null);

  const [goToWithInputIsHide, setGoToWithInputIsHide] = useState(true);
  const [inputValue, setInputValue] = useState('');

  const modalWindow = useReaderWindow({
    kind: 'dialog',
    contentId: 'swipe-notice',
    canClose: false,
  });

  useEffect(() => {
    if (appMode !== 'reader' || goToWithInputIsHide) {
      return;
    }

    inputRef.current?.focus();
  }, [appMode, goToWithInputIsHide]);

  const modalConfirmHandler = () => {
    modalsWereShowed.set(id, Flags.swipes, true);

    modalWindow.close();
  };

  const prevClickHandler = () => {
    goPrevPage();
  };

  const nextClickHandler = () => {
    if (modalsWereShowed.get(id, Flags.swipes)) {
      goNextPage();
    } else {
      modalWindow.open();
    }
  };

  const pageNumberClickHandler = () => {
    setGoToWithInputIsHide(false);
  };

  const go = () => {
    let pageNumber = parseInt(inputValue);

    if (isNaN(pageNumber) || page === pageNumber) {
      return;
    }

    if (pageNumber > pages) {
      pageNumber = pages;
    }

    setGoToWithInputIsHide(true);
    goToPage(pageNumber);
  };

  const buttonClickHandler = () => {
    go();
  };

  const inputBlurHandler = () => {
    setGoToWithInputIsHide(true);
  };

  const inputChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const inputKeyDownHandler = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (appMode === 'reader' && event.key === 'Enter') {
      go();
    }
  };

  const goToWithArrowsClassNames = classNames({
    [styles.GoToWithArrows]: true,
    [styles.isHide]: !goToWithInputIsHide,
  });

  const goToWithInputClassNames = classNames({
    [styles.GoToWithInput]: true,
    [styles.isHide]: goToWithInputIsHide,
  });

  /**
   * из-за того, что используется хак для тачей в виде addTouchSupportForCssHover(),
   * придётся отказаться от логики if/else и переключать видимость элементов по-старинке через css-классы.
   * конструкция вида ```isHide && (<div></div>)``` удаляет элемент физически из DOM-а.
   * и функция addTouchSupportForCssHover не может при инициализации приложения накинуть соответствующие обработчики.
   *
   * есть второй путь: при ре-рендере каждый раз запускать addTouchSupportForCssHover(),
   * но мне кажется, что это будет слишком "дорого" и неудобно.
   * возможно, вернусь к этому позже
   * */
  return (
    <>
      <SwipeNotice
        target={modalWindow.target}
        onConfirm={modalConfirmHandler}
        onCancel={modalWindow.close}
      />

      <div className={goToWithArrowsClassNames}>
        <Item aria-label="Предыдущая страница" onClick={prevClickHandler}>
          <ArrowLeft />
        </Item>

        <div className={styles.PageNumber} onClick={pageNumberClickHandler}>
          {page} из {pages}
        </div>

        <Item aria-label="Следующая страница" onClick={nextClickHandler}>
          <ArrowRight />
        </Item>
      </div>

      <div className={goToWithInputClassNames}>
        <div className={styles.WrapperInput}>
          <input
            ref={inputRef}
            onChange={inputChangeHandler}
            onKeyDown={inputKeyDownHandler}
            onBlur={inputBlurHandler}
            className={styles.Input}
            type="number"
            min="0"
            inputMode="numeric"
            value={inputValue}
            pattern="[0-9]"
            placeholder={page.toString()}
          />
        </div>

        {/* onClick отрабатывает позже onBlur у input-а выше, поэтому используется onMouseDown */}
        <button className={styles.Button} onMouseDown={buttonClickHandler}>
          Перейти
        </button>
      </div>
    </>
  );
};
